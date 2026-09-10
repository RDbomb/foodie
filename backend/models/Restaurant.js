import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, default: 4.3, min: 1, max: 5 },
    deliveryTime: { type: String, default: "25-35 min" },
    minOrder: { type: Number, default: 100 },
    image: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
