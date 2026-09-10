import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Flame, Clock, Award, X, MapPin, ChefHat } from "lucide-react";
import FoodCard from "../components/FoodCard.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { usePreferences } from "../context/PreferencesContext.jsx";

const CATEGORIES = [
  "All",
  "Starters",
  "Mains",
  "Bowls",
  "Desserts",
  "Drinks",
  "Breads",
  "Rice",
  "Soups",
];
const CITIES = [
  "All Cities",
  "Mumbai",
  "Bangalore",
  "Delhi",
  "Pune",
  "Kolkata",
  "Hyderabad",
];
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

// Fallback static food data in case backend is down
const FALLBACK_FOODS = [
  {
    _id: "f1",
    name: "Paneer Tikka Platter",
    description: "Chargrilled cottage cheese cubes with capsicum and onions.",
    price: 260,
    category: "Starters",
    isVeg: true,
    rating: 4.7,
    prepTime: "15 min",
    restaurantName: "Spice Route Kitchen",
    city: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "f2",
    name: "Dum Pukht Biryani",
    description:
      "Slow-cooked aromatic basmati rice with saffron and tender chicken.",
    price: 420,
    category: "Mains",
    isVeg: false,
    rating: 4.9,
    prepTime: "30 min",
    restaurantName: "Spice Route Kitchen",
    city: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "f3",
    name: "Masala Dosa",
    description: "Crispy golden rice crepe stuffed with spiced potato filling.",
    price: 140,
    category: "Mains",
    isVeg: true,
    rating: 4.8,
    prepTime: "15 min",
    restaurantName: "The Coastal Bowl",
    city: "Bangalore",
    image:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "f4",
    name: "Seekh Kebab",
    description: "Hand-pounded minced lamb kebabs chargrilled over live coal.",
    price: 380,
    category: "Starters",
    isVeg: false,
    rating: 4.9,
    prepTime: "20 min",
    restaurantName: "Delhi Darbar",
    city: "Delhi",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "f5",
    name: "Pav Bhaji",
    description:
      "Mumbai's iconic spiced vegetable mash with extra butter and pav.",
    price: 160,
    category: "Mains",
    isVeg: true,
    rating: 4.8,
    prepTime: "15 min",
    restaurantName: "Chai & Chaat House",
    city: "Pune",
    image:
      "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "f6",
    name: "Dark Chocolate Lava Cake",
    description:
      "Warm Belgian chocolate fondant with a molten centre and ice cream.",
    price: 260,
    category: "Desserts",
    isVeg: true,
    rating: 4.9,
    prepTime: "15 min",
    restaurantName: "Grill & Greens",
    city: "Hyderabad",
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  },
];

const RestaurantCard = ({
  name,
  city,
  cuisine,
  rating,
  deliveryTime,
  image,
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    className="shrink-0 w-56 bg-card rounded-2xl overflow-hidden border border-ink/10 hover:border-teal/30 shadow-sm hover:shadow-md transition-all"
  >
    <div className="relative h-28 overflow-hidden">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      <span className="absolute bottom-2 left-3 text-paper text-xs font-bold">
        {name}
      </span>
    </div>
    <div className="p-3 flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-teal">{cuisine}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="flex items-center gap-1 text-[11px] text-ink/60">
          <MapPin className="w-3 h-3" /> {city}
        </span>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-turmeric-dark font-bold">★ {rating}</span>
          <span className="text-ink/40">· {deliveryTime}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCity, setActiveCity] = useState("All Cities");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const { vegOnly } = usePreferences();

  const {
    data: foodsData,
    loading,
    error,
  } = useFetch(`${API_URL}/foods`, null);
  const { data: restaurantsData } = useFetch(`${API_URL}/restaurants`, null);

  const foods = useMemo(() => {
    const raw = foodsData?.data || foodsData;
    if (Array.isArray(raw)) return raw;
    return FALLBACK_FOODS;
  }, [foodsData]);

  const restaurants = useMemo(() => {
    const raw = restaurantsData?.data || restaurantsData;
    return Array.isArray(raw) ? raw : [];
  }, [restaurantsData]);

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      const matchCat =
        activeCategory === "All" || f.category === activeCategory;
      const matchCity = activeCity === "All Cities" || f.city === activeCity;
      const matchSearch =
        f.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (f.restaurantName || "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
      const matchVeg = !vegOnly || f.isVeg;
      return matchCat && matchCity && matchSearch && matchVeg;
    });
  }, [foods, activeCategory, activeCity, debouncedSearch, vegOnly]);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 relative">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 text-center flex flex-col items-center gap-5 relative">
        {/* ambient background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-72 bg-gradient-to-b from-teal/10 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-turmeric/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <motion.span
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-teal-dark bg-teal/10 border border-teal/25 px-4 py-1.5 rounded-full"
        >
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          Fresh from 6 Cities · 35+ Dishes
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl sm:text-6xl font-bold leading-[1.08] text-ink max-w-3xl"
        >
          India's Finest{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-chili via-turmeric-dark to-teal">
            Restaurants
          </span>{" "}
          — Delivered to You
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-ink/60 text-base sm:text-lg max-w-xl leading-relaxed"
        >
          From Mumbai street food to Mughlai Kebabs in Delhi, coastal fish curry
          in Bangalore — order from handpicked restaurants in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold"
        >
          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-ink/10 shadow-sm text-ink/70">
            <Flame className="w-3.5 h-3.5 text-chili" /> Fresh & Hot
          </span>
          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-ink/10 shadow-sm text-ink/70">
            <Award className="w-3.5 h-3.5 text-turmeric-dark" /> 4.8★ Avg Rating
          </span>
          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-ink/10 shadow-sm text-ink/70">
            <Clock className="w-3.5 h-3.5 text-teal" /> Express Delivery
          </span>
          <span className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full border border-ink/10 shadow-sm text-ink/70">
            <ChefHat className="w-3.5 h-3.5 text-ink/50" /> 6 Cities, 6
            Restaurants
          </span>
        </motion.div>
      </section>

      {/* ── Restaurants Horizontal Scroll ─────────────────────── */}
      {restaurants.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">
            Top Restaurants{" "}
            <span className="text-ink/30 text-base font-body font-normal">
              across India
            </span>
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {restaurants.map((r) => (
              <RestaurantCard
                key={r._id}
                name={r.name}
                city={r.city}
                cuisine={r.cuisine}
                rating={r.rating}
                deliveryTime={r.deliveryTime}
                image={r.image}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Search + City Filter Row ───────────────────────────── */}
      <section className="mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search dishes or restaurants"
            placeholder="Search dishes, restaurants..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full border border-ink/15 bg-card/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal/35 focus:border-teal text-sm transition-all"
          />
          {searchInput && (
            <button
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* City Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full min-w-0">
          {CITIES.map((city) => (
            <motion.button
              key={city}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCity(city)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                activeCity === city
                  ? "bg-teal text-paper border-teal shadow-sm shadow-teal/25"
                  : "bg-card text-ink/60 border-ink/15 hover:border-teal/40"
              }`}
            >
              {city !== "All Cities" && <MapPin className="w-3 h-3" />}
              {city}
            </motion.button>
          ))}
        </div>

        <span className="text-xs font-mono text-ink/40 ml-auto whitespace-nowrap hidden sm:block">
          {filtered.length} dishes
        </span>
      </section>

      {/* ── Category Filter ────────────────────────────────────── */}
      <section className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-8 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              activeCategory === cat
                ? "bg-ink text-paper border-ink shadow-sm"
                : "bg-card text-ink/65 border-ink/15 hover:border-ink/40 hover:text-ink"
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </section>

      {error && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-turmeric p-4 text-sm"
        >
          Menu service is unavailable. These are sample dishes for browsing;
          ordering is disabled until the service returns.{" "}
          <button
            className="underline font-bold"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </p>
      )}
      {/* ── Menu Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-ink/50">Loading menu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-card/50 rounded-3xl border border-ink/10 p-10 my-4">
          <p className="font-display text-2xl font-bold text-ink mb-1">
            No dishes found
          </p>
          <p className="text-sm text-ink/50">
            Try a different city, category or search term.
          </p>
        </div>
      ) : (
        <motion.section
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24"
        >
          <AnimatePresence>
            {filtered.map((food) => (
              <FoodCard
                key={food._id || food.name}
                food={food}
                disabled={Boolean(error)}
              />
            ))}
          </AnimatePresence>
        </motion.section>
      )}
    </main>
  );
};

export default Home;
