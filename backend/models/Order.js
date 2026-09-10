import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0, max: 100000 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      validate: Number.isInteger,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    handedOverAt: Date,
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (value) => value.length >= 1 && value.length <= 50,
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 40 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["placed", "preparing", "out-for-delivery", "delivered"],
      default: "placed",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
