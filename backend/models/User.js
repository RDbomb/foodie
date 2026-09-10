import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    googleId: { type: String, unique: true, sparse: true },
    username: String,
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["customer", "restaurant", "delivery", "admin"],
      required: true,
    },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    active: { type: Boolean, default: true },
    demoAccount: { type: Boolean, default: false },
  },
  { timestamps: true },
);
schema.index(
  { role: 1, username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: "string" } } },
);
export default mongoose.model("User", schema);
