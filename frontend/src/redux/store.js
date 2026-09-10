import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice.js";
export const store = configureStore({ reducer: { cart: cartReducer } });
// Persistence is a side effect outside reducers, keeping Redux transitions pure.
let previousItems = store.getState().cart.items;
store.subscribe(() => {
  const items = store.getState().cart.items;
  if (items === previousItems) return;
  previousItems = items;
  try {
    localStorage.setItem("foodie-cart", JSON.stringify(items));
  } catch {
    /* Storage may be unavailable. */
  }
});
