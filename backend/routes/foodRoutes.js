import Food from "../models/Food.js";
import { createCatalogRouter } from "./catalogRoutes.js";
export default createCatalogRouter(Food, "food");
