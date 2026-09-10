import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, Utensils, Bike, CheckCircle2, Home } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import {useEffect,useState} from "react";
import {useLive} from "../context/LiveContext.jsx";
import {api} from "../lib/api.js";
const STAGES = [
  { key: "placed", label: "Order Placed", icon: CheckCircle2 },
  { key: "preparing", label: "Kitchen Preparing", icon: Utensils },
  { key: "out-for-delivery", label: "Out for Delivery", icon: Bike },
  { key: "delivered", label: "Enjoy Your Meal", icon: Check },
];

const OrderSuccess = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [order,setOrder]=useState(location.state?.order);
  const {revision}=useLive();
  useEffect(()=>{if(!order?._id)return;let active=true;api.get("/orders/"+order._id).then(({data})=>{if(active)setOrder(data.data);}).catch(()=>{});return()=>{active=false;};},[order?._id,revision]);
  const stageIndex = Math.max(
    0,
    STAGES.findIndex((stage) => stage.key === order?.status),
  );

  if (!order || String(order.customerId) !== user.id)
    return <Navigate to="/menu" replace />;

  return (
    <main className="max-w-xl mx-auto px-5 py-16 text-center flex flex-col items-center gap-5">
      {/* Animated Bounce Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal to-teal-dark text-paper flex items-center justify-center shadow-xl shadow-teal/25 mb-1"
      >
        <Check className="w-10 h-10 stroke-[3]" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold text-ink"
      >
        Order Confirmed!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-ink/65 text-sm max-w-md leading-relaxed"
      >
        Thank you{order.customerName ? `, ${order.customerName}` : ""}! Your
        delicious food is being freshly prepared and will reach you shortly.
      </motion.p>

      {/* Live Tracker Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full bg-card border border-ink/10 rounded-3xl p-6 shadow-sm my-2"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/40">
            Order Status
          </span>
          <span className="text-xs font-mono font-bold text-teal flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 " /> Status at confirmation
          </span>
        </div>

        {/* Progress Bar & Icons */}
        <div className="grid grid-cols-4 gap-2 relative">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isDone = i <= stageIndex;
            return (
              <div
                key={stage.key}
                className="flex flex-col items-center gap-2 text-center z-10"
              >
                <motion.div
                  animate={{ scale: isDone ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    isDone
                      ? "bg-teal text-paper shadow-teal/20"
                      : "bg-paper border border-ink/15 text-ink/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <span
                  className={`text-[11px] font-semibold leading-tight ${
                    isDone ? "text-ink" : "text-ink/30"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Receipt Breakdown Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-paper/80 border border-dashed border-ink/20 rounded-3xl p-5 text-left text-xs font-medium space-y-2.5 shadow-sm"
      >
        <div className="flex justify-between text-ink/60">
          <span>Order Number</span>
          <span className="font-mono font-bold text-ink">
            #{order._id?.slice(-8)}
          </span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>Delivery Address</span>
          <span className="font-mono text-ink text-right max-w-[200px] truncate">
            {order.address}
          </span>
        </div>
        <div className="flex justify-between font-display font-bold text-lg text-ink pt-3 border-t border-dashed border-ink/20">
          <span>Amount Due</span>
          <span className="font-mono text-teal-dark">₹{order.total}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-ink hover:bg-teal text-paper font-bold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-teal/20 text-sm"
        >
          <Home className="w-4 h-4" /> Back to Gourmet Menu
        </Link>
      </motion.div>
    </main>
  );
};

export default OrderSuccess;
