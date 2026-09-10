import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  selectCartItems,
  selectCartSubtotal,
  selectDeliveryFee,
  selectCartTotal,
  clearCart,
} from "../redux/cartSlice.js";

const Checkout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const deliveryFee = useSelector(selectDeliveryFee);
  const total = useSelector(selectCartTotal);

  const [form, setForm] = useState({
    customerName: user?.name || "",
    phone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    if (items.some((item) => !/^[a-f0-9]{24}$/i.test(item._id))) {
      setError(
        "Your cart contains sample dishes. Clear it and add dishes from the live menu.",
      );
      return;
    }
    setSubmitting(true);
    setError("");

    const orderPayload = {
      ...form,
      items: items.map((i) => ({
        foodId: i._id,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await api.post(`/orders`, orderPayload, {
        timeout: 15000,
      });
      dispatch(clearCart());
      navigate("/order-success", { state: { order: res.data.data } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors?.map((item) => item.message).join(". ") ||
          err.response?.data?.message ||
          "Could not confirm your order. Your cart has been kept. If the request timed out, check with the restaurant before retrying.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto mb-4 font-bold">
          🛒
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-2">
          Nothing to check out yet
        </h1>
        <p className="text-ink/60 mb-6 text-sm">
          Add a few gourmet dishes from the menu first.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-teal text-paper font-bold px-6 py-3 rounded-full hover:bg-teal-dark transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-xs font-bold text-ink/50 hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <div className="grid sm:grid-cols-[1.3fr_1fr] gap-8 items-start">
        {/* Delivery Details Form */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-ink/10 rounded-3xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-teal/10 text-teal flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                Delivery Address
              </h1>
              <p className="text-xs text-ink/50">
                Enter your details to receive your order
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="customerName"
                className="text-xs font-bold text-ink/70 block mb-1 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-teal" /> Full Name
              </label>
              <input
                type="text"
                id="customerName"
                minLength={2}
                maxLength={80}
                name="customerName"
                required
                value={form.customerName}
                onChange={handleChange}
                placeholder="Rishi Dembla"
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-paper/50 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-xs font-bold text-ink/70 block mb-1 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-teal" /> Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                title="Enter 10 digits starting with 6, 7, 8, or 9"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-paper/50 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="text-xs font-bold text-ink/70 block mb-1 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-teal" /> Complete Address
              </label>
              <textarea
                id="address"
                minLength={10}
                maxLength={500}
                name="address"
                required
                rows={3}
                value={form.address}
                onChange={handleChange}
                placeholder="Flat / House No., Building Name, Street, City"
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-paper/50 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-sm font-medium resize-none transition-all"
              />
            </div>

            {error && (
              <p role="alert" className="text-chili text-xs font-bold">
                {error}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="mt-3 bg-gradient-to-r from-turmeric to-turmeric-dark hover:from-turmeric-dark hover:to-turmeric disabled:opacity-60 text-ink font-bold py-3.5 rounded-full transition-all shadow-md shadow-turmeric/20 flex items-center justify-center gap-2"
            >
              {submitting ? "Placing Order..." : `Confirm Order — ₹${total}`}
            </motion.button>
          </form>
        </motion.section>

        {/* Order Receipt Summary */}
        <motion.aside
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-ink/10 rounded-3xl p-6 shadow-sm sticky top-24"
        >
          <h2 className="font-display text-xl font-bold text-ink mb-4 pb-3 border-b border-ink/10 flex items-center justify-between">
            <span>Order Summary</span>
            <span className="text-xs font-mono text-ink/40 font-semibold">
              {items.length} Items
            </span>
          </h2>

          <div className="flex flex-col gap-3 mb-5 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center text-xs font-medium"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-md bg-ink/5 text-ink font-mono flex items-center justify-center font-bold text-[11px]">
                    {item.quantity}
                  </span>
                  <span className="text-ink/80 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-ink">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-ink/20 pt-4 space-y-2 text-xs font-medium">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-ink">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Delivery Fee</span>
              <span className="font-mono text-teal font-bold">
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg text-ink pt-3 border-t border-ink/10">
              <span>Total Payable</span>
              <span className="font-mono text-teal-dark">₹{total}</span>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-teal/5 border border-teal/15 flex items-center gap-2 text-[11px] text-teal-dark font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal" />
            <span>
              Pay on delivery. Final prices are verified by the server.
            </span>
          </div>
        </motion.aside>
      </div>
    </main>
  );
};

export default Checkout;
