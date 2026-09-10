import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  selectCartItems,
  selectCartSubtotal,
  selectDeliveryFee,
  selectCartTotal,
  selectIsCartOpen,
  updateQuantity,
  setCartOpen,
} from "../redux/cartSlice.js";

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartError = useSelector((state) => state.cart.error);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const deliveryFee = useSelector(selectDeliveryFee);
  const total = useSelector(selectCartTotal);
  const isCartOpen = useSelector(selectIsCartOpen);

  const drawerRef = useRef(null);
  useEffect(() => {
    if (!isCartOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...(drawerRef.current?.querySelectorAll(
        "button:not(:disabled), a[href], input",
      ) || []),
    ];
    focusable()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") dispatch(setCartOpen(false));
      if (event.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [isCartOpen, dispatch]);

  const handleCheckout = () => {
    dispatch(setCartOpen(false));
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setCartOpen(false))}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50"
          />

          {/* Animated Receipt Drawer */}
          <motion.aside
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-card z-50 shadow-2xl flex flex-col border-l border-ink/10"
          >
            {cartError && (
              <p role="alert" className="bg-turmeric/20 text-ink text-sm p-4">
                {cartError}
              </p>
            )}
            {/* Drawer Header */}
            <div className="p-6 border-b border-dashed border-ink/20 flex items-center justify-between bg-paper/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">
                    Your Order
                  </h2>
                  <p className="text-[11px] font-mono text-ink/40 uppercase tracking-widest">
                    {items.reduce((s, i) => s + i.quantity, 0)} Items Selected
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispatch(setCartOpen(false))}
                className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink transition-colors"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-turmeric/15 flex items-center justify-center text-turmeric-dark mb-1">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-display text-xl font-bold text-ink">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-ink/50 max-w-xs leading-relaxed">
                    Explore our handpicked gourmet dishes and add your
                    favorites.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3.5 items-center p-3 rounded-2xl bg-paper/60 border border-ink/5 hover:border-teal/20 transition-all shadow-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">
                        {item.name}
                      </p>
                      <p className="font-mono text-xs font-bold text-teal mt-0.5">
                        ₹{item.price}
                      </p>
                    </div>
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 border border-ink/15 rounded-full px-2.5 py-1 bg-card shadow-inner">
                      <button
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item._id,
                              quantity: item.quantity - 1,
                            }),
                          )
                        }
                        className="w-5 h-5 flex items-center justify-center text-ink/70 hover:text-chili transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item._id,
                              quantity: item.quantity + 1,
                            }),
                          )
                        }
                        className="w-5 h-5 flex items-center justify-center text-ink/70 hover:text-teal transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Receipt Summary Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-dashed border-ink/20 bg-paper/80 backdrop-blur-md">
                <div className="space-y-2 text-sm mb-5 font-medium">
                  <div className="flex justify-between text-ink/70">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-ink">
                      ₹{subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between text-ink/70">
                    <span>Delivery fee</span>
                    <span className="font-mono text-teal font-bold">
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee === 0 && (
                    <p className="text-[11px] text-teal font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Free delivery unlocked!
                    </p>
                  )}
                  <div className="flex justify-between font-display font-bold text-xl text-ink pt-3 border-t border-ink/10">
                    <span>Total Amount</span>
                    <span className="font-mono text-teal-dark">₹{total}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-paper font-bold py-3.5 rounded-full transition-all shadow-lg shadow-teal/20 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
