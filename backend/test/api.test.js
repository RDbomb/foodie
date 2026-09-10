import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Food from "../models/Food.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
process.env.NODE_ENV = "test";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
process.env.JWT_SECRET = "test-only-secret-".repeat(4);
const tokens = {};
for (const role of ["admin", "customer"])
  tokens[role] = jwt.sign({}, process.env.JWT_SECRET, {
    subject:
      role === "admin"
        ? "000000000000000000000010"
        : "000000000000000000000011",
    jwtid: role,
    expiresIn: "2h",
    issuer: "foodie",
    audience: "foodie-web",
  });
Session.findOne = async () => ({ csrf: "test-csrf" });
User.findById = async (id) => ({
  _id: id,
  active: true,
  role: id.endsWith("10") ? "admin" : "customer",
});
const { default: app } = await import("../app.js");
const foodId = "000000000000000000000001";
const queryResult = (data) => ({
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return Promise.resolve(data);
  },
});
let saved;
let available = true;
Food.find = (filter) =>
  filter
    ? Promise.resolve(
        available
          ? [
              {
                _id: foodId,
                name: "Database dish",
                price: 260,
                restaurantId: "000000000000000000000020",
              },
            ]
          : [],
      )
    : queryResult([]);
Food.countDocuments = async () => 0;
Order.create = async (data) => {
  const doc = new Order(data);
  await doc.validate();
  saved = data;
  return doc;
};
Order.find = () => queryResult([]);
Food.findById = async () => null;
Food.create = async (data) => {
  saved = data;
  return new Food(data);
};
Food.findOneAndUpdate = async (id, update) => {
  saved = update.$set;
  return { _id: id, ...saved };
};
Food.findOneAndDelete = async () => ({ _id: foodId });
let server, base;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));
const call = (path, method = "GET", body, admin = false, headers = {}) =>
  fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(admin || (method === "POST" && path === "/api/orders")
        ? {
            Cookie: "foodie_session=" + tokens[admin ? "admin" : "customer"],
            "X-CSRF-Token": "test-csrf",
          }
        : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const order = {
  customerName: "Test User",
  phone: "9000000000",
  address: "Synthetic test address",
  items: [{ foodId, quantity: 2, price: 0, name: "Forged" }],
  total: 0,
};
test("order prices and names come from database, forged totals ignored", async () => {
  const res = await call("/api/orders", "POST", order);
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.data.total, 520);
  assert.equal(saved.items[0].name, "Database dish");
  assert.equal(saved.items[0].price, 260);
  assert.equal(saved.deliveryFee, 0);
});
test("missing foods rejected without creating orders", async () => {
  available = false;
  try {
    assert.equal((await call("/api/orders", "POST", order)).status, 422);
  } finally {
    available = true;
  }
});
test("invalid IDs and phone format rejected", async () => {
  assert.equal(
    (await call("/api/orders", "POST", { ...order, phone: "+91 90000 00000" }))
      .status,
    422,
  );
  assert.equal(
    (
      await call("/api/orders", "POST", {
        ...order,
        items: [{ foodId: "f1", quantity: 1 }],
      })
    ).status,
    422,
  );
});
test("duplicate item quantities cannot exceed limit", async () => {
  assert.equal(
    (
      await call("/api/orders", "POST", {
        ...order,
        items: [
          { foodId, quantity: 60 },
          { foodId, quantity: 60 },
        ],
      })
    ).status,
    422,
  );
});
test("customer information is protected", async () => {
  assert.equal((await call("/api/orders")).status, 401);
  assert.equal((await call("/api/orders/" + foodId)).status, 401);
  assert.equal((await call("/api/orders", "GET", undefined, true)).status, 200);
});
test("catalog mutations require a signed-in staff account", async () => {
  for (const method of ["POST", "PATCH", "DELETE"])
    assert.equal(
      (
        await call(
          "/api/foods" + (method === "POST" ? "" : "/" + foodId),
          method,
          {},
        )
      ).status,
      401,
    );
});
test("admin routes fail closed when JWT secret is missing", async () => {
  const key = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.equal(
      (await call("/api/orders", "GET", undefined, true)).status,
      503,
    );
  } finally {
    process.env.JWT_SECRET = key;
  }
});
test("create allows only declared fields", async () => {
  const res = await call(
    "/api/foods",
    "POST",
    {
      name: "Test dish",
      description: "Test description",
      price: 10,
      category: "Mains",
      image: "https://example.com/food.jpg",
      createdAt: "2000-01-01",
      secret: "injected",
    },
    true,
  );
  assert.equal(res.status, 201);
  assert.equal(saved.secret, undefined);
  assert.equal(saved.createdAt, undefined);
});
test("patch validates values and applies allowlisted updates", async () => {
  assert.equal(
    (await call("/api/foods/" + foodId, "PATCH", { price: -2 }, true)).status,
    422,
  );
  assert.equal(
    (await call("/api/foods/" + foodId, "PATCH", { price: 20 }, true)).status,
    200,
  );
  assert.deepEqual(saved, { price: 20 });
});
test("delete has correct status", async () =>
  assert.equal(
    (await call("/api/foods/" + foodId, "DELETE", undefined, true)).status,
    204,
  ));
test("invalid query operators, pagination, and IDs rejected", async () => {
  for (const path of [
    "/api/foods?city[$ne]=x",
    "/api/foods?limit=1000",
    "/api/foods/not-an-id",
  ])
    assert.equal((await call(path)).status, 422);
});
test("unknown resource returns 404", async () =>
  assert.equal((await call("/api/foods/" + foodId)).status, 404));
test("security headers and rejected origins", async () => {
  const res = await call("/missing");
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    (
      await call("/missing", "GET", undefined, false, {
        Origin: "https://untrusted.example",
      })
    ).status,
    403,
  );
});
test("malformed and oversized JSON rejected", async () => {
  assert.equal(
    (
      await fetch(base + "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("/api/orders", "POST", { data: "a".repeat(11000) })).status,
    413,
  );
});
test("unexpected errors do not disclose internal messages", async () => {
  const previous = Food.findById;
  Food.findById = async () => {
    throw new Error("private database detail");
  };
  try {
    const res = await call("/api/foods/" + foodId);
    assert.equal(res.status, 500);
    assert.equal((await res.json()).message, "Internal server error");
  } finally {
    Food.findById = previous;
  }
});
test("order rate limit returns 429", async () => {
  let status;
  for (let i = 0; i < 11; i++)
    status = (await call("/api/orders", "POST", {})).status;
  assert.equal(status, 429);
});
