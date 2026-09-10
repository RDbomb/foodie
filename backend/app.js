import path from "node:path";
import {fileURLToPath} from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/security.js";
import rateLimit from "express-rate-limit";

import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";

const app = express();
if(process.env.RENDER||process.env.VERCEL)app.set("trust proxy",1);

// ─── Experiment 5: Security Middleware ─────────────────────────
// 1. Helmet — sets 14 security-related HTTP response headers
//    Includes content-type, framing, and content security policy protections.
app.use(helmet({crossOriginOpenerPolicy:{policy:'same-origin-allow-popups'},contentSecurityPolicy:{directives:{
 "script-src":["'self'","https://accounts.google.com/gsi/client"],
 "frame-src":["'self'","https://accounts.google.com"],
 "connect-src":["'self'","https://accounts.google.com","wss:"],
 "img-src":["'self'","data:","https:"],
 "style-src":["'self'","'unsafe-inline'","https://fonts.googleapis.com","https://accounts.google.com"],
 "font-src":["'self'","https://fonts.gstatic.com"],
}}}));

// 2. CORS — strict allowlist of trusted origins only
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          Object.assign(new Error("Origin not allowed"), { status: 403 }),
        );
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Admin-Key",
      "X-CSRF-Token",
    ],
    credentials: true,
  }),
);

// 3. Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Morgan HTTP request logger (dev format in development)
if (process.env.NODE_ENV !== "test")
  app.use(morgan(":method :status :response-time ms"));

// 5. JSON body parser with 10kb size limit (prevents payload flooding)
app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());
app.use("/api/auth", authRoutes);

// ─── Routes ─────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res
    .status(ready ? 200 : 503)
    .json({ success: ready, status: ready ? "ok" : "database unavailable" });
});
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);

if(process.env.SERVE_FRONTEND==='true'){
 const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../frontend/dist');
 app.use(express.static(dist));
 app.get('*',(req,res,next)=>{if(req.path==='/api'||req.path.startsWith('/api/'))return next();res.sendFile(path.join(dist,'index.html'));});
}
// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);
export default app;
