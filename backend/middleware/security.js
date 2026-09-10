import { requireRoles } from "./auth.js";
import { validationResult } from "express-validator";
export const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({
      success: false,
      errors: errors
        .array()
        .map(({ path, msg }) => ({ field: path, message: msg })),
    });
  next();
};
export const requireAdmin = requireRoles("admin");
export const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  if (err.name === "ValidationError" || err.name === "CastError") status = 422;
  if (err.code === 11000) status = 409;
  const message =
    status >= 500
      ? "Internal server error"
      : status === 413
        ? "Request body exceeds 10 KB"
        : status === 422
          ? "Invalid request data"
          : status === 409
            ? "Resource already exists"
            : status === 400
              ? "Invalid request body"
              : err.message;
  res.status(status).json({ success: false, message });
};
