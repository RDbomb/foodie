import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Leaf } from "lucide-react";
import { selectCartItemCount, setCartOpen } from "../redux/cartSlice.js";
import { usePreferences } from "../context/PreferencesContext.jsx";

import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
const Navbar = () => {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const location = useLocation();
  const shopping =
    (!user || user.role === "customer") &&
    ["/menu", "/checkout", "/order-success"].includes(location.pathname);
  const dispatch = useDispatch();
  const itemCount = useSelector(selectCartItemCount);
  const { vegOnly, toggleVegOnly } = usePreferences();

  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-xl border-b border-ink/8 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-paper font-display font-bold text-xl shadow-md shadow-teal/25"
          >
            F
          </motion.div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-ink leading-none group-hover:text-teal transition-colors">
              Foodie<span className="text-turmeric">.</span>
            </p>
            <p className="text-[9px] font-mono tracking-[0.2em] text-ink/35 uppercase">
              Gourmet Kitchen
            </p>
          </div>
        </Link>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2.5">
          <Link
            to={user ? "/" + user.role : "/login/customer"}
            className="text-xs sm:text-sm font-semibold text-teal px-2"
          >
            {user ? "My console" : "Sign in"}
          </Link>
          {user && (
            <button
              className="text-xs sm:text-sm text-ink/60"
              onClick={async () => {
                try {
                  await logout();
                  setLogoutError("");
                } catch {
                  setLogoutError("Could not sign out. Please try again.");
                }
              }}
            >
              Sign out
            </button>
          )}
          {logoutError && (
            <span role="alert" className="text-xs text-red-700">
              {logoutError}
            </span>
          )}
          {shopping && (
            <>
              {/* Veg Only Toggle */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleVegOnly}
                aria-label="Vegetarian dishes only"
                role="switch"
                aria-checked={vegOnly}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border-2 transition-all duration-200 ${
                  vegOnly
                    ? "bg-teal/10 border-teal text-teal-dark"
                    : "bg-card border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink"
                }`}
              >
                <Leaf
                  className={`w-3.5 h-3.5 ${vegOnly ? "text-teal" : "text-ink/40"}`}
                />
                <span className="hidden sm:inline">Veg only</span>
                <span
                  className={`w-2 h-2 rounded-full ${vegOnly ? "bg-teal" : "bg-ink/20"}`}
                />
              </motion.button>

              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Open cart"
                onClick={() => dispatch(setCartOpen(true))}
                className="relative flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-full font-semibold text-sm transition-all shadow hover:bg-teal hover:shadow-md hover:shadow-teal/25"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>

                <AnimatePresence mode="wait">
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                      }}
                      className="ml-0.5 bg-turmeric text-ink font-mono font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
