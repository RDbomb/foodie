import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Starters", "Mains", "Bowls", "Desserts", "Drinks", "Breads", "Rice", "Soups"],
    },
    image: { type: String, required: true },
    isVeg: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    prepTime: { type: String, default: "20 min" },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    restaurantName: { type: String },
    city: { type: String },
    spiceLevel: { type: String, enum: ["Mild", "Medium", "Hot", "Extra Hot"], default: "Medium" },
    calories: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Food", foodSchema);
