import mongoose from "mongoose";
export default mongoose.model(
  "Session",
  new mongoose.Schema({
    _id: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    csrf: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  }),
);
