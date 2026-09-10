import { useDispatch, useSelector } from "react-redux";
import * as cart from "../redux/cartSlice.js";
export const CartProvider = ({ children }) => children;
export const useCart = () => {
  const dispatch = useDispatch();
  return {
    items: useSelector(cart.selectCartItems),
    subtotal: useSelector(cart.selectCartSubtotal),
    deliveryFee: useSelector(cart.selectDeliveryFee),
    total: useSelector(cart.selectCartTotal),
    itemCount: useSelector(cart.selectCartItemCount),
    isCartOpen: useSelector(cart.selectIsCartOpen),
    addItem: (food) => dispatch(cart.addItem(food)),
    removeItem: (id) => dispatch(cart.removeItem(id)),
    updateQuantity: (id, quantity) =>
      dispatch(cart.updateQuantity({ id, quantity })),
    clearCart: () => dispatch(cart.clearCart()),
    setIsCartOpen: (value) => dispatch(cart.setCartOpen(value)),
  };
};
