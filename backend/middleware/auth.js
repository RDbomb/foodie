import jwt from "jsonwebtoken";
import { randomBytes, timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api",
});
export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  restaurantId: u.restaurantId,
});
export function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw Object.assign(new Error("JWT secret is not configured"), {
      status: 503,
    });
  return process.env.JWT_SECRET;
}
export async function startSession(user, res) {
  const key = secret();
  const id = randomBytes(32).toString("hex"),
    csrf = randomBytes(32).toString("hex");
  await Session.create({
    _id: id,
    userId: user._id,
    csrf,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });
  const token = jwt.sign({}, key, {
    algorithm: "HS256",
    subject: String(user._id),
    jwtid: id,
    expiresIn: "2h",
    issuer: "foodie",
    audience: "foodie-web",
  });
  res.cookie("foodie_session", token, {
    ...cookieOptions(),
    maxAge: 2 * 60 * 60 * 1000,
  });
  res.json({ success: true, user: publicUser(user), csrf });
}
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.foodie_session;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Please sign in" });
    let claims;
    try {
      claims = jwt.verify(token, secret(), {
        algorithms: ["HS256"],
        issuer: "foodie",
        audience: "foodie-web",
      });
    } catch (error) {
      if (error.status) throw error;
      return res
        .status(401)
        .json({
          success: false,
          message: "Your session expired. Please sign in again.",
        });
    }
    const session = await Session.findOne({
      _id: claims.jti,
      userId: claims.sub,
      expiresAt: { $gt: new Date() },
    });
    const user = session && (await User.findById(claims.sub));
    if (
      !user?.active ||
      (user.demoAccount && process.env.NODE_ENV === "production")
    )
      return res
        .status(401)
        .json({ success: false, message: "Please sign in again" });
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const a = Buffer.from(req.get("X-CSRF-Token") || ""),
        b = Buffer.from(session.csrf);
      if (a.length !== b.length || !timingSafeEqual(a, b))
        return res
          .status(403)
          .json({ success: false, message: "Refresh the page and try again" });
    }
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
export const allowRoles =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res
          .status(403)
          .json({
            success: false,
            message: "This role cannot perform that action",
          });
export const requireRoles = (...roles) => [authenticate, allowRoles(...roles)];
export function orderScope(user) {
  if (user.role === "admin") return {};
  if (user.role === "customer") return { customerId: user._id };
  if (user.role === "restaurant")
    return user.restaurantId
      ? { restaurantId: user.restaurantId }
      : { _id: null };
  return { deliveryPartnerId: user._id };
}
