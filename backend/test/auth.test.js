import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import Restaurant from "../models/Restaurant.js";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "auth-test-secret".repeat(4);
const { default: app } = await import("../app.js");
const roles = ["admin", "restaurant", "delivery", "customer"];
const users = Object.fromEntries(
  roles.map((role, i) => [
    role,
    {
      _id: "10000000000000000000000" + i,
      role,
      name: role,
      active: true,
      restaurantId:
        role === "restaurant" ? "200000000000000000000000" : undefined,
    },
  ]),
);
const hash = await bcrypt.hash("admin", 4);
const sessions = new Map();
let filter;
User.findOne = (q) => ({
  select: async () =>
    q.username === "admin" && users[q.role]
      ? { ...users[q.role], passwordHash: hash }
      : null,
});
User.findById = async (id) => Object.values(users).find((u) => u._id === id);
Session.create = async (data) => {
  sessions.set(data._id, data);
  return data;
};
Session.findOne = async (q) => {
  const s = sessions.get(q._id);
  return s && String(s.userId) === q.userId && s.expiresAt > q.expiresAt.$gt
    ? s
    : null;
};
Session.deleteOne = async (q) => sessions.delete(q._id);
Order.find = (q) => {
  filter = q;
  return {
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit: async () => [],
  };
};
Order.findOne = async (q) => {
  filter = q;
  return null;
};
Order.findOneAndUpdate = async (q) => {
  filter = q;
  return null;
};
Restaurant.findById = async () => ({ name: "Test kitchen", city: "Mumbai" });
Food.findOneAndUpdate = async (q) => {
  filter = q;
  return null;
};
let server, base;
const accounts = {};
const request = (path, method = "GET", body, account, extra = {}) =>
  fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(account
        ? { Cookie: account.cookie, "X-CSRF-Token": account.csrf }
        : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
  for (const role of roles) {
    const id = "session-" + role;
    sessions.set(id, {
      _id: id,
      userId: users[role]._id,
      csrf: "csrf-" + role,
      expiresAt: new Date(Date.now() + 3600000),
    });
    accounts[role] = {
      csrf: "csrf-" + role,
      cookie:
        "foodie_session=" +
        jwt.sign({}, process.env.JWT_SECRET, {
          subject: users[role]._id,
          jwtid: id,
          expiresIn: "1h",
          issuer: "foodie",
          audience: "foodie-web",
        }),
    };
  }
});
after(() => new Promise((r) => server.close(r)));
test("each staff role can sign in using admin/admin and receives an HttpOnly session", async () => {
  for (const role of roles.slice(0, 3)) {
    const res = await request("/api/auth/staff", "POST", {
      role,
      username: "admin",
      password: "admin",
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("set-cookie"), /HttpOnly/);
    assert.match(res.headers.get("set-cookie"), /SameSite=Strict/);
    const data = await res.json();
    assert.equal(data.user.role, role);
    assert.ok(data.csrf);
    assert.equal(data.user.passwordHash, undefined);
  }
});
test("wrong password and customer password login are rejected", async () => {
  assert.equal(
    (
      await request("/api/auth/staff", "POST", {
        role: "admin",
        username: "admin",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/auth/staff", "POST", {
        role: "customer",
        username: "admin",
        password: "admin",
      })
    ).status,
    422,
  );
});
test("missing Google configuration is explicit and forged token never creates an account", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  assert.equal(
    (
      await request("/api/auth/google", "POST", {
        credential: "invalid".repeat(10),
      })
    ).status,
    503,
  );
  process.env.GOOGLE_CLIENT_ID = "test.apps.googleusercontent.com";
  assert.equal(
    (
      await request("/api/auth/google", "POST", {
        credential: "invalid".repeat(10),
      })
    ).status,
    401,
  );
});
test("role scope is taken from server account for all order lists", async () => {
  for (const role of roles) {
    assert.equal(
      (
        await request(
          "/api/orders?role=admin",
          "GET",
          undefined,
          accounts[role],
        )
      ).status,
      200,
    );
    assert.deepEqual(
      filter,
      role === "admin"
        ? {}
        : role === "customer"
          ? { customerId: users.customer._id }
          : role === "restaurant"
            ? { restaurantId: users.restaurant.restaurantId }
            : { deliveryPartnerId: users.delivery._id },
    );
  }
});
test("order detail lookup includes ownership scope", async () => {
  assert.equal(
    (
      await request(
        "/api/orders/300000000000000000000000",
        "GET",
        undefined,
        accounts.customer,
      )
    ).status,
    404,
  );
  assert.equal(filter.customerId, users.customer._id);
});
test("customer and delivery cannot mutate catalog or assign riders", async () => {
  for (const role of ["customer", "delivery"]) {
    assert.equal(
      (await request("/api/foods", "POST", {}, accounts[role])).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/api/orders/300000000000000000000000/assign",
          "PATCH",
          {},
          accounts[role],
        )
      ).status,
      403,
    );
  }
});
test("restaurant menu writes are scoped and cannot reassign ownership", async () => {
  assert.equal(
    (
      await request(
        "/api/foods/300000000000000000000000",
        "PATCH",
        { price: 20 },
        accounts.restaurant,
      )
    ).status,
    404,
  );
  assert.equal(filter.restaurantId, users.restaurant.restaurantId);
  assert.equal(
    (
      await request(
        "/api/foods/300000000000000000000000",
        "PATCH",
        { restaurantId: "400000000000000000000000" },
        accounts.restaurant,
      )
    ).status,
    403,
  );
});
test("CSRF token is mandatory for session mutations", async () => {
  assert.equal(
    (
      await request("/api/auth/logout", "POST", {}, accounts.admin, {
        "X-CSRF-Token": "",
      })
    ).status,
    403,
  );
});
test("delivery completion requires the previous status and assigned delivery partner", async () => {
  assert.equal(
    (
      await request(
        "/api/orders/300000000000000000000000/status",
        "PATCH",
        { status: "delivered" },
        accounts.delivery,
      )
    ).status,
    409,
  );
  assert.equal(filter.status, "out-for-delivery");
  assert.equal(filter.deliveryPartnerId, users.delivery._id);
  assert.equal(
    (
      await request(
        "/api/orders/300000000000000000000000/status",
        "PATCH",
        { status: "delivered" },
        accounts.restaurant,
      )
    ).status,
    403,
  );
});
test("old admin key is not an authentication bypass", async () => {
  assert.equal(
    (
      await request("/api/orders", "GET", undefined, undefined, {
        "X-Admin-Key": "test-admin-key",
      })
    ).status,
    401,
  );
});
test('fulfilment actions reject every other role',async()=>{
 for(const role of ['admin','delivery','customer'])assert.equal((await request('/api/orders/300000000000000000000000/handoff','PATCH',{deliveryPartnerId:users.delivery._id},accounts[role])).status,403);
 for(const role of ['admin','restaurant','customer'])assert.equal((await request('/api/orders/300000000000000000000000/status','PATCH',{status:'delivered'},accounts[role])).status,403);
 assert.equal((await request('/api/orders/300000000000000000000000/status','PATCH',{status:'out-for-delivery'},accounts.delivery)).status,422);
});
test('restaurant handoff assigns the partner within its own kitchen only',async()=>{
 const oldFind=User.findOne,oldUpdate=Order.findOneAndUpdate;
 try{
 User.findOne=async()=>users.delivery;
 Order.findOneAndUpdate=async(q,update)=>{assert.equal(q.restaurantId,users.restaurant.restaurantId);assert.deepEqual(q.status,{$in:['placed','preparing']});assert.equal(update.$set.deliveryPartnerId,users.delivery._id);assert.equal(update.$set.status,'out-for-delivery');return {_id:q._id,...update.$set};};
 assert.equal((await request('/api/orders/300000000000000000000000/handoff','PATCH',{deliveryPartnerId:users.delivery._id},accounts.restaurant)).status,200);
 }finally{User.findOne=oldFind;Order.findOneAndUpdate=oldUpdate;}
});
test("logout revokes session and replay is denied", async () => {
  assert.equal(
    (await request("/api/auth/logout", "POST", {}, accounts.admin)).status,
    200,
  );
  assert.equal(
    (await request("/api/auth/me", "GET", undefined, accounts.admin)).status,
    401,
  );
});
