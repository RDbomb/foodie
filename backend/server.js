import "dotenv/config";
import {createServer} from "node:http";
import {attachRealtime} from "./realtime.js";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
const { default: app } = await import("./app.js");
await connectDB();
const server = createServer(app);
const io=attachRealtime(server,app);
server.listen(process.env.PORT || 5000, () =>
  console.log("Foodie API listening"),
);
const shutdown = () => {
  io.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
