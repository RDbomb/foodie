import { useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, Plus, Check } from "lucide-react";
import { addItem } from "../redux/cartSlice.js";

const VegDot = ({ isVeg }) => (
  <span
    className={`w-[18px] h-[18px] border-2 flex items-center justify-center rounded-md backdrop-blur-md bg-paper/90 ${
      isVeg ? "border-teal shadow-teal/20" : "border-chili shadow-chili/20"
    } shadow-sm`}
    title={isVeg ? "100% Vegetarian" : "Non-vegetarian"}
  >
    <span
      className={`w-2 h-2 rounded-full ${isVeg ? "bg-teal" : "bg-chili"}`}
    />
  </span>
);

const FoodCard = ({ food, disabled = false }) => {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    dispatch(addItem(food));
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -6 }}
      className="group bg-card rounded-3xl overflow-hidden border border-ink/10 hover:border-teal/40 hover:shadow-xl hover:shadow-teal/10 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Top Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Veg Badge */}
        <div className="absolute top-3 left-3 z-10">
          <VegDot isVeg={food.isVeg} />
        </div>

        {/* Prep Time Tag */}
        <div className="absolute top-3 right-3 bg-ink/80 backdrop-blur-md text-paper text-xs font-mono font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
          <Clock className="w-3 h-3 text-turmeric" />
          <span>{food.prepTime}</span>
        </div>

        {/* Category Pill on Hover */}
        <div className="absolute bottom-3 left-3 bg-paper/90 backdrop-blur-md text-ink text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {food.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg leading-snug text-ink group-hover:text-teal transition-colors">
            {food.name}
          </h3>
          <div className="flex items-center gap-1 text-xs font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-teal text-teal" />
            <span>{food.rating}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink/60 leading-relaxed line-clamp-2 flex-1">
          {food.description}
        </p>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-3 border-t border-ink/5 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-ink/40 uppercase tracking-wider">
              Price
            </span>
            <span className="font-mono font-bold text-xl text-ink">
              ₹{food.price}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            disabled={disabled}
            aria-label={
              disabled
                ? "Sample dish — ordering unavailable"
                : `Add ${food.name} to cart`
            }
            onClick={handleAdd}
            className={`disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md ${
              added
                ? "bg-teal text-paper shadow-teal/20"
                : "bg-turmeric hover:bg-turmeric-dark text-ink shadow-turmeric/20"
            }`}
          >
            <AnimatePresence mode="wait">
              {added ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Added!
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
