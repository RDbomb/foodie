import {publishOrder} from "../realtime.js";
import express from "express";
import { body, param, query, matchedData } from "express-validator";
import rateLimit from "express-rate-limit";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import { asyncRoute, validate } from "../middleware/security.js";
import { authenticate, requireRoles, orderScope } from "../middleware/auth.js";
import User from "../models/User.js";
const router = express.Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many order attempts. Please wait." },
});
router.post(
  "/",
  requireRoles("customer"),
  orderLimiter,
  [
    body("customerName").isString().bail().trim().isLength({ min: 2, max: 80 }),
    body("phone")
      .isString()
      .bail()
      .trim()
      .matches(/^[6-9]\d{9}$/),
    body("address").isString().bail().trim().isLength({ min: 10, max: 500 }),
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.foodId").isMongoId(),
    body("items.*.quantity").isInt({ min: 1, max: 99 }).toInt(),
    validate,
  ],
  asyncRoute(async (req, res) => {
    const {
      customerName,
      phone,
      address,
      items: requested,
    } = matchedData(req, { locations: ["body"] });
    const quantities = new Map();
    for (const item of requested) {
      const count = (quantities.get(item.foodId) || 0) + item.quantity;
      if (count > 99)
        return res
          .status(422)
          .json({ success: false, message: "Maximum quantity is 99 per dish" });
      quantities.set(item.foodId, count);
    }
    const foods = await Food.find({ _id: { $in: [...quantities.keys()] } });
    if (foods.length !== quantities.size)
      return res.status(422).json({
        success: false,
        message:
          "One or more dishes are no longer available. Refresh your menu.",
      });
    const restaurantIds = [
      ...new Set(foods.map((food) => String(food.restaurantId || ""))),
    ];
    if (restaurantIds.length !== 1 || !restaurantIds[0])
      return res
        .status(422)
        .json({
          success: false,
          message:
            "Please order from one restaurant at a time. Remove dishes from other restaurants.",
        });
    const items = foods.map((food) => ({
      foodId: food._id,
      name: food.name,
      price: food.price,
      quantity: quantities.get(String(food._id)),
    }));
    const subtotal =
      Math.round(
        items.reduce(
          (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
          0,
        ),
      ) / 100;
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const order = await Order.create({
      customerId: req.user._id,
      restaurantId: restaurantIds[0],
      customerName,
      phone,
      address,
      items,
      subtotal,
      deliveryFee,
      total,
    });
    void publishOrder(req.app,order,"placed").catch(()=>{});
    res.status(201).json({ success: true, data: order });
  }),
);
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    validate,
  ],
  asyncRoute(async (req, res) => {
    const { page = 1, limit = 20 } = matchedData(req, { locations: ["query"] });
    const data = await Order.find(orderScope(req.user))
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ success: true, count: data.length, page, limit, data });
  }),
);
router.get(
  "/:id",
  authenticate,
  [param("id").isMongoId(), validate],
  asyncRoute(async (req, res) => {
    const order = await Order.findOne({
      _id: req.params.id,
      ...orderScope(req.user),
    });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  }),
);

router.patch(
  "/:id/assign",
  requireRoles("admin"),
  param("id").isMongoId(),
  body("deliveryPartnerId").isMongoId(),
  validate,
  asyncRoute(async (req, res) => {
    const partner = await User.findOne({
      _id: req.body.deliveryPartnerId,
      role: "delivery",
      active: true,
    });
    if (!partner)
      return res
        .status(422)
        .json({ success: false, message: "Choose an active delivery partner" });
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["placed", "preparing"] } },
      { $set: { deliveryPartnerId: partner._id } },
      { new: true },
    );
    if (!order)
      return res
        .status(409)
        .json({
          success: false,
          message: "Only pending orders can be assigned",
        });
    void publishOrder(req.app,order,"assigned").catch(()=>{});
    res.json({ success: true, data: order });
  }),
);
router.patch(
  "/:id/status",
  requireRoles("delivery"),
  param("id").isMongoId(),
  body("status").isIn(["delivered"]),
  validate,
  asyncRoute(async (req, res) => {
    const status = req.body.status;
    const filter = {
      _id: req.params.id,
      deliveryPartnerId: req.user._id,
      status: "out-for-delivery",
    };
    const order = await Order.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!order)
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Order unavailable or status changed. Refresh and try again.",
        });
    void publishOrder(req.app,order,"delivered").catch(()=>{});
    res.json({ success: true, data: order });
  }),
);
router.patch('/:id/handoff',requireRoles('restaurant'),param('id').isMongoId(),body('deliveryPartnerId').isMongoId(),validate,asyncRoute(async(req,res)=>{
 const partner=await User.findOne({_id:req.body.deliveryPartnerId,role:'delivery',active:true,...(process.env.NODE_ENV==='production'?{demoAccount:{$ne:true}}:{})});
 if(!partner)return res.status(422).json({success:false,message:'Choose an active delivery partner'});
 const order=await Order.findOneAndUpdate({_id:req.params.id,...orderScope(req.user),status:{$in:['placed','preparing']}},{$set:{status:'out-for-delivery',deliveryPartnerId:partner._id,handedOverAt:new Date()}},{new:true,runValidators:true});
 if(!order)return res.status(409).json({success:false,message:'Order already handed over or unavailable. Refresh to see its status.'});
 void publishOrder(req.app,order,"handoff").catch(()=>{});
 res.json({success:true,data:order});
}));
export default router;
