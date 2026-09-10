import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
if (process.env.NODE_ENV === "production")
  throw new Error("Demo staff accounts are disabled in production");
try {
  await mongoose.connect(process.env.MONGO_URI);
  await User.init();
  const restaurant = await Restaurant.findOne().sort({ _id: 1 });
  if (!restaurant) throw new Error("Seed restaurants first");
  const passwordHash = await bcrypt.hash("admin", 12);
  for (const role of ["restaurant", "delivery", "admin"]) {
    await User.updateOne(
      { role, username: "admin" },
      {
        $setOnInsert: {
          name: {
            restaurant: "Kitchen manager",
            delivery: "Delivery partner",
            admin: "Foodie administrator",
          }[role],
          role,
          username: "admin",
          passwordHash,
          demoAccount: true,
          ...(role === "restaurant" ? { restaurantId: restaurant._id } : {}),
        },
      },
      { upsert: true },
    );
  }
  console.log(
    "Three demo staff accounts ready. User ID: admin; password: admin. Restaurant: " +
      restaurant.name,
  );
} finally {
  await mongoose.disconnect();
}
