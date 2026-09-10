import {revokeRealtime} from "../realtime.js";
import express from "express";
import { body, matchedData } from "express-validator";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { asyncRoute, validate } from "../middleware/security.js";
import {
  authenticate,
  startSession,
  publicUser,
  cookieOptions,
  requireRoles,
} from "../middleware/auth.js";
const router = express.Router(),
  google = new OAuth2Client();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
// Login requires JSON from our app origin, preventing cross-site login form posts.
const loginOrigin = (req, res, next) => {
  const origin = req.get("Origin");
  const allowed = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000",
  ];
  if (!req.is("application/json") || (origin && !allowed.includes(origin)))
    return res
      .status(403)
      .json({ success: false, message: "Invalid login request" });
  next();
};
router.post(
  "/staff",
  limiter,
  loginOrigin,
  body("role").isIn(["restaurant", "delivery", "admin"]),
  body("username").isString().bail().trim().isLength({ min: 1, max: 80 }),
  body("password").isString().isLength({ min: 1, max: 128 }),
  validate,
  asyncRoute(async (req, res) => {
    const { role, username, password } = matchedData(req);
    const user = await User.findOne({ role, username, active: true }).select(
      "+passwordHash",
    );
    const hash =
      user?.passwordHash ||
      "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    const valid = await bcrypt.compare(password, hash);
    if (
      !user ||
      !valid ||
      (user.demoAccount && process.env.NODE_ENV === "production")
    )
      return res
        .status(401)
        .json({
          success: false,
          message: "Incorrect user ID or password for this role",
        });
    await startSession(user, res);
  }),
);
router.post(
  "/google",
  limiter,
  loginOrigin,
  body("credential").isString().isLength({ min: 20, max: 8000 }),
  validate,
  asyncRoute(async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID)
      return res
        .status(503)
        .json({
          success: false,
          message:
            "Google sign-in needs a Google client ID. Please finish setup.",
        });
    let payload;
    try {
      payload = (
        await google.verifyIdToken({
          idToken: req.body.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        })
      ).getPayload();
    } catch {
      return res
        .status(401)
        .json({
          success: false,
          message: "Google sign-in could not be verified. Please try again.",
        });
    }
    if (!payload?.sub || !payload.email_verified)
      return res
        .status(401)
        .json({ success: false, message: "Use a verified Google account" });
    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        $setOnInsert: {
          googleId: payload.sub,
          role: "customer",
          name: payload.name || "Customer",
          email: payload.email,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    if (!user.active || user.role !== "customer")
      return res
        .status(403)
        .json({ success: false, message: "Account unavailable" });
    await startSession(user, res);
  }),
);
router.get("/me", authenticate, (req, res) =>
  res.json({
    success: true,
    user: publicUser(req.user),
    csrf: req.session.csrf,
  }),
);
router.post(
  "/logout",
  authenticate,
  asyncRoute(async (req, res) => {
    await Session.deleteOne({ _id: req.session._id });
    revokeRealtime(req.app,String(req.session._id));
    res.clearCookie("foodie_session", cookieOptions());
    res.json({ success: true });
  }),
);
router.get(
  "/delivery-partners",
  requireRoles("admin", "restaurant"),
  asyncRoute(async (req, res) =>
    res.json({
      success: true,
      data: (
        await User.find({ role: "delivery", active: true }).limit(100)
      ).map(publicUser),
    }),
  ),
);
export default router;
