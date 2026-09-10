import Restaurant from "../models/Restaurant.js";
import { createCatalogRouter } from "./catalogRoutes.js";
export default createCatalogRouter(Restaurant, "restaurant");
