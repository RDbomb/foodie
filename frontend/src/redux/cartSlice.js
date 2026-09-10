import { createSlice } from "@reduxjs/toolkit";

const loadInitialCart = () => {
  try {
    const stored = localStorage.getItem("foodie-cart");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            /^[a-f0-9]{24}$/i.test(item._id) &&
            typeof item.name === "string" &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity >= 1 &&
            item.quantity <= 99,
        )
      : [];
  } catch {
    return [];
  }
};

const initialState = {
  items: loadInitialCart(),
  isCartOpen: false,
  error: "",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const food = action.payload;
      state.error = "";
      if (
        state.items.length &&
        String(state.items[0].restaurantId) !== String(food.restaurantId)
      ) {
        state.error =
          "Order from one restaurant at a time. Remove the current dishes before adding from another kitchen.";
        state.isCartOpen = true;
        return;
      }
      const existing = state.items.find((item) => item._id === food._id);
      if (existing) {
        existing.quantity = Math.min(99, existing.quantity + 1);
      } else {
        state.items.push({ ...food, quantity: 1 });
      }
      state.isCartOpen = true;
    },
    removeItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item._id !== id);
    },
    updateQuantity: (state, action) => {
      state.error = "";
      const { id, quantity } = action.payload;
      if (quantity < 1) {
        state.items = state.items.filter((item) => item._id !== id);
      } else {
        const item = state.items.find((i) => i._id === id);
        if (item && Number.isInteger(quantity))
          item.quantity = Math.min(99, quantity);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.error = "";
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen: (state, action) => {
      state.isCartOpen = action.payload;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
} = cartSlice.actions;

// Redux Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectIsCartOpen = (state) => state.cart.isCartOpen;

export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectDeliveryFee = (state) => {
  const subtotal = selectCartSubtotal(state);
  return subtotal > 500 || subtotal === 0 ? 0 : 40;
};

export const selectCartTotal = (state) =>
  selectCartSubtotal(state) + selectDeliveryFee(state);

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
