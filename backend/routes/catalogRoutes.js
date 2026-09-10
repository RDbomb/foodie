import express from "express";
import { body, param, query, matchedData } from "express-validator";
import { asyncRoute, validate } from "../middleware/security.js";
import Food from "../models/Food.js";
import Restaurant from "../models/Restaurant.js";
import { requireRoles } from "../middleware/auth.js";
const categories = [
  "Starters",
  "Mains",
  "Bowls",
  "Desserts",
  "Drinks",
  "Breads",
  "Rice",
  "Soups",
];
const text = (field, max = 200) =>
  body(field).isString().bail().trim().isLength({ min: 1, max });
const foodRules = () => [
  text("name", 100),
  text("description", 2000),
  body("price").isFloat({ min: 0, max: 100000 }).toFloat(),
  body("category").isIn(categories),
  body("image").isURL({ protocols: ["http", "https"], require_protocol: true }),
  body("isVeg").optional().isBoolean().toBoolean(),
  body("rating").optional().isFloat({ min: 0, max: 5 }).toFloat(),
  text("prepTime", 40).optional(),
  body("restaurantId").optional().isMongoId(),
  text("restaurantName", 100).optional(),
  text("city", 80).optional(),
  body("spiceLevel").optional().isIn(["Mild", "Medium", "Hot", "Extra Hot"]),
  body("calories").optional().isInt({ min: 0, max: 100000 }).toInt(),
];
const restaurantRules = () => [
  text("name", 100),
  text("cuisine", 100),
  text("city", 80),
  text("location", 200),
  text("address", 500),
  body("image").isURL({ protocols: ["http", "https"], require_protocol: true }),
  body("rating").optional().isFloat({ min: 1, max: 5 }).toFloat(),
  body("minOrder").optional().isInt({ min: 0, max: 100000 }).toInt(),
  text("deliveryTime", 40).optional(),
  body("isOpen").optional().isBoolean().toBoolean(),
  body("tags").optional().isArray({ max: 10 }),
  body("tags.*")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 40 }),
];
const id = () => [param("id").isMongoId(), validate];
export const createCatalogRouter = (Model, kind) => {
  const router = express.Router();
  const access =
    kind === "food"
      ? requireRoles("admin", "restaurant")
      : requireRoles("admin");
  const scope = (req) =>
    req.user.role === "restaurant"
      ? { _id: req.params.id, restaurantId: req.user.restaurantId || null }
      : { _id: req.params.id };
  const rules = kind === "food" ? foodRules : restaurantRules;
  router.get(
    "/",
    [
      query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
      query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
      query("city")
        .optional()
        .isString()
        .bail()
        .trim()
        .isLength({ min: 1, max: 80 }),
      query("cuisine")
        .optional()
        .isString()
        .bail()
        .trim()
        .isLength({ min: 1, max: 100 }),
      query("category").optional().isIn(categories),
      query("veg").optional().isIn(["true", "false"]),
      query("restaurantId").optional().isMongoId(),
      validate,
    ],
    asyncRoute(async (req, res) => {
      const input = matchedData(req, { locations: ["query"] });
      const filter = {};
      if (input.city) filter.city = input.city;
      if (kind === "food") {
        if (input.category) filter.category = input.category;
        if (input.veg !== undefined) filter.isVeg = input.veg === "true";
        if (input.restaurantId) filter.restaurantId = input.restaurantId;
      } else if (input.cuisine) filter.cuisine = input.cuisine;
      const page = input.page || 1,
        limit = input.limit || 100;
      const [data, total] = await Promise.all([
        Model.find(filter)
          .sort({ rating: -1, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Model.countDocuments(filter),
      ]);
      res.json({ success: true, count: data.length, total, page, limit, data });
    }),
  );
  router.get(
    "/:id",
    id(),
    asyncRoute(async (req, res) => {
      const resource = await Model.findById(req.params.id);
      if (!resource)
        return res
          .status(404)
          .json({ success: false, message: "Resource not found" });
      res.json({
        success: true,
        data:
          kind === "restaurant"
            ? {
                restaurant: resource,
                foods: await Food.find({ restaurantId: resource._id }).limit(
                  100,
                ),
              }
            : resource,
      });
    }),
  );
  const save = (update) =>
    asyncRoute(async (req, res) => {
      const data = matchedData(req, { locations: ["body"] });
      if (!Object.keys(data).length)
        return res.status(422).json({
          success: false,
          message: "Provide at least one editable field",
        });
      if (req.user.role === "restaurant") {
        if (!req.user.restaurantId)
          return res
            .status(403)
            .json({ success: false, message: "No restaurant assigned" });
        if (
          data.restaurantId &&
          String(data.restaurantId) !== String(req.user.restaurantId)
        )
          return res
            .status(403)
            .json({
              success: false,
              message: "You can only edit your restaurant",
            });
        data.restaurantId = req.user.restaurantId;
      }
      if (kind === "food" && data.restaurantId) {
        const restaurant = await Restaurant.findById(data.restaurantId);
        if (!restaurant)
          return res
            .status(422)
            .json({ success: false, message: "Restaurant does not exist" });
        data.restaurantName = restaurant.name;
        data.city = restaurant.city;
      }
      const resource = update
        ? await Model.findOneAndUpdate(
            scope(req),
            { $set: data },
            { new: true, runValidators: true },
          )
        : await Model.create(data);
      if (!resource)
        return res
          .status(404)
          .json({ success: false, message: "Resource not found" });
      res.status(update ? 200 : 201).json({ success: true, data: resource });
    });
  router.post("/", access, rules(), validate, save(false));
  router.patch(
    "/:id",
    access,
    id(),
    rules().map((rule) => rule.optional()),
    validate,
    save(true),
  );
  router.delete(
    "/:id",
    access,
    id(),
    asyncRoute(async (req, res) => {
      if (
        kind === "restaurant" &&
        (await Food.exists({ restaurantId: req.params.id }))
      )
        return res.status(409).json({
          success: false,
          message: "Remove or reassign this restaurant’s foods first",
        });
      const resource = await Model.findOneAndDelete(scope(req));
      if (!resource)
        return res
          .status(404)
          .json({ success: false, message: "Resource not found" });
      res.status(204).end();
    }),
  );
  return router;
};
