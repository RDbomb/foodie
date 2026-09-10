import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Food from "../models/Food.js";
import Restaurant from "../models/Restaurant.js";

dotenv.config();

const restaurants = [
  {
    name: "Spice Route Kitchen",
    cuisine: "North Indian",
    location: "Bandra West",
    city: "Mumbai",
    address: "Shop 4, Hill Road, Bandra West, Mumbai 400050",
    rating: 4.8,
    deliveryTime: "20-30 min",
    minOrder: 200,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    tags: ["North Indian", "Mughlai", "Biryani", "Bestseller"],
  },
  {
    name: "The Coastal Bowl",
    cuisine: "South Indian",
    location: "Koramangala",
    city: "Bangalore",
    address: "12, 5th Block, Koramangala, Bangalore 560095",
    rating: 4.6,
    deliveryTime: "25-35 min",
    minOrder: 150,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    tags: ["South Indian", "Seafood", "Dosa", "Filter Coffee"],
  },
  {
    name: "Delhi Darbar",
    cuisine: "Mughlai",
    location: "Connaught Place",
    city: "Delhi",
    address: "A-14, Connaught Place, New Delhi 110001",
    rating: 4.9,
    deliveryTime: "30-45 min",
    minOrder: 300,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    tags: ["Mughlai", "Kebabs", "Biryani", "Heritage"],
  },
  {
    name: "Chai & Chaat House",
    cuisine: "Street Food",
    location: "FC Road",
    city: "Pune",
    address: "88, FC Road, Shivajinagar, Pune 411005",
    rating: 4.5,
    deliveryTime: "15-25 min",
    minOrder: 100,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    tags: ["Chaat", "Street Food", "Snacks", "Chai"],
  },
  {
    name: "The Bengal Kitchen",
    cuisine: "Bengali",
    location: "Salt Lake",
    city: "Kolkata",
    address: "Sector 5, Salt Lake, Kolkata 700091",
    rating: 4.7,
    deliveryTime: "25-40 min",
    minOrder: 200,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    tags: ["Bengali", "Seafood", "Sweets", "Traditional"],
  },
  {
    name: "Grill & Greens",
    cuisine: "Continental & Salads",
    location: "Jubilee Hills",
    city: "Hyderabad",
    address: "Road No. 36, Jubilee Hills, Hyderabad 500033",
    rating: 4.4,
    deliveryTime: "20-30 min",
    minOrder: 250,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    tags: ["Grills", "Salads", "Healthy", "Continental"],
  },
];

const getFoodItems = (restaurantMap) => [
  // ─── Spice Route Kitchen — Mumbai ───────────────────────────────
  {
    name: "Murgh Malai Tikka",
    description: "Creamy, melt-in-mouth chicken tikka marinated in malai, cashew paste and subtle spices.",
    price: 320, category: "Starters", isVeg: false, rating: 4.9, prepTime: "18 min",
    spiceLevel: "Mild", calories: 420,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Paneer Tikka Platter",
    description: "Chargrilled cottage cheese cubes marinated in spiced yogurt with capsicum and onions.",
    price: 260, category: "Starters", isVeg: true, rating: 4.7, prepTime: "15 min",
    spiceLevel: "Medium", calories: 350,
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Dum Pukht Biryani",
    description: "Slow-cooked aromatic basmati rice layered with saffron and tender chicken, sealed with dough.",
    price: 420, category: "Mains", isVeg: false, rating: 4.9, prepTime: "30 min",
    spiceLevel: "Medium", calories: 680,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Dal Makhani",
    description: "Creamy black lentils simmered overnight in a smoky tomato butter sauce.",
    price: 280, category: "Mains", isVeg: true, rating: 4.8, prepTime: "20 min",
    spiceLevel: "Mild", calories: 380,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Butter Naan",
    description: "Soft tandoor-baked flatbread slathered with churned white butter.",
    price: 60, category: "Breads", isVeg: true, rating: 4.5, prepTime: "8 min",
    spiceLevel: "Mild", calories: 190,
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Gulab Jamun",
    description: "Soft khoya dumplings soaked in rose-cardamom sugar syrup, served warm.",
    price: 120, category: "Desserts", isVeg: true, rating: 4.8, prepTime: "5 min",
    spiceLevel: "Mild", calories: 310,
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },
  {
    name: "Rose Lassi",
    description: "Chilled thick yogurt blended with rose syrup and topped with malai.",
    price: 130, category: "Drinks", isVeg: true, rating: 4.7, prepTime: "5 min",
    spiceLevel: "Mild", calories: 220,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Spice Route Kitchen"], restaurantName: "Spice Route Kitchen", city: "Mumbai",
  },

  // ─── The Coastal Bowl — Bangalore ─────────────────────────────
  {
    name: "Masala Dosa",
    description: "Crispy golden rice crepe stuffed with spiced potato filling, served with sambar and chutneys.",
    price: 140, category: "Mains", isVeg: true, rating: 4.8, prepTime: "15 min",
    spiceLevel: "Medium", calories: 340,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },
  {
    name: "Kerala Fish Curry",
    description: "Tangy coconut milk fish curry with raw mango and kokum, served with red parboiled rice.",
    price: 360, category: "Mains", isVeg: false, rating: 4.9, prepTime: "25 min",
    spiceLevel: "Hot", calories: 480,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },
  {
    name: "Prawn Ghee Roast",
    description: "Juicy Mangalorean prawns tossed in fiery dry red chili masala and finished with ghee.",
    price: 420, category: "Starters", isVeg: false, rating: 4.9, prepTime: "20 min",
    spiceLevel: "Extra Hot", calories: 390,
    image: "https://images.unsplash.com/photo-1625938145744-533f5f507006?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },
  {
    name: "Coconut Payasam",
    description: "Slow-cooked rice kheer in fresh coconut milk with cardamom and jaggery.",
    price: 120, category: "Desserts", isVeg: true, rating: 4.7, prepTime: "8 min",
    spiceLevel: "Mild", calories: 290,
    image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },
  {
    name: "Filter Kaapi",
    description: "Authentic South Indian filter coffee — decoction brewed in a brass filter, served frothy.",
    price: 70, category: "Drinks", isVeg: true, rating: 4.9, prepTime: "5 min",
    spiceLevel: "Mild", calories: 80,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },
  {
    name: "Idli Sambar",
    description: "Fluffy steamed rice cakes served with lentil sambar and fresh coconut chutney.",
    price: 110, category: "Starters", isVeg: true, rating: 4.6, prepTime: "10 min",
    spiceLevel: "Mild", calories: 260,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Coastal Bowl"], restaurantName: "The Coastal Bowl", city: "Bangalore",
  },

  // ─── Delhi Darbar — Delhi ──────────────────────────────────────
  {
    name: "Seekh Kebab",
    description: "Hand-pounded minced lamb kebabs with aromatic spices, chargrilled over live coal.",
    price: 380, category: "Starters", isVeg: false, rating: 4.9, prepTime: "20 min",
    spiceLevel: "Hot", calories: 450,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },
  {
    name: "Nihari",
    description: "Slow-braised tender beef shanks in a rich, aromatic stew — a Mughal-era breakfast classic.",
    price: 440, category: "Mains", isVeg: false, rating: 4.8, prepTime: "35 min",
    spiceLevel: "Medium", calories: 620,
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },
  {
    name: "Shahi Paneer",
    description: "Cottage cheese cubes in a royal cashew-tomato gravy, kissed with kewra and saffron.",
    price: 300, category: "Mains", isVeg: true, rating: 4.8, prepTime: "20 min",
    spiceLevel: "Mild", calories: 420,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },
  {
    name: "Lachha Paratha",
    description: "Multi-layered flaky wheat flatbread cooked in a tandoor with pure ghee.",
    price: 80, category: "Breads", isVeg: true, rating: 4.7, prepTime: "10 min",
    spiceLevel: "Mild", calories: 220,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },
  {
    name: "Phirni",
    description: "Chilled rice-flour pudding set in earthen cups, garnished with pistachios and rose petals.",
    price: 150, category: "Desserts", isVeg: true, rating: 4.7, prepTime: "5 min",
    spiceLevel: "Mild", calories: 280,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },
  {
    name: "Kesar Lassi",
    description: "Royal saffron-infused thick yogurt drink garnished with dried rose petals and silver varq.",
    price: 160, category: "Drinks", isVeg: true, rating: 4.8, prepTime: "5 min",
    spiceLevel: "Mild", calories: 250,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Delhi Darbar"], restaurantName: "Delhi Darbar", city: "Delhi",
  },

  // ─── Chai & Chaat House — Pune ────────────────────────────────
  {
    name: "Pav Bhaji",
    description: "Mumbai's iconic spiced vegetable mash with extra butter, served with soft toasted pav.",
    price: 160, category: "Mains", isVeg: true, rating: 4.8, prepTime: "15 min",
    spiceLevel: "Hot", calories: 420,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Chai & Chaat House"], restaurantName: "Chai & Chaat House", city: "Pune",
  },
  {
    name: "Sev Puri",
    description: "Crispy puris topped with diced potato, chutneys, onion and crunchy sev.",
    price: 90, category: "Starters", isVeg: true, rating: 4.6, prepTime: "8 min",
    spiceLevel: "Medium", calories: 210,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Chai & Chaat House"], restaurantName: "Chai & Chaat House", city: "Pune",
  },
  {
    name: "Chole Bhature",
    description: "Spiced chickpeas in a robust tomato-onion gravy served with puffy deep-fried bhature.",
    price: 180, category: "Mains", isVeg: true, rating: 4.7, prepTime: "20 min",
    spiceLevel: "Hot", calories: 560,
    image: "https://images.unsplash.com/photo-1626100134441-b3cb7f2b4a33?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Chai & Chaat House"], restaurantName: "Chai & Chaat House", city: "Pune",
  },
  {
    name: "Cutting Chai",
    description: "Aromatic ginger-cardamom tea served Bombay-style in a small glass — 'cutting' portion.",
    price: 40, category: "Drinks", isVeg: true, rating: 4.9, prepTime: "5 min",
    spiceLevel: "Mild", calories: 60,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Chai & Chaat House"], restaurantName: "Chai & Chaat House", city: "Pune",
  },
  {
    name: "Jalebi & Rabri",
    description: "Crispy spirals of fermented batter fried golden and dunked in condensed saffron rabri.",
    price: 130, category: "Desserts", isVeg: true, rating: 4.8, prepTime: "10 min",
    spiceLevel: "Mild", calories: 390,
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Chai & Chaat House"], restaurantName: "Chai & Chaat House", city: "Pune",
  },

  // ─── The Bengal Kitchen — Kolkata ─────────────────────────────
  {
    name: "Macher Jhol",
    description: "Hilsa fish cooked in a light turmeric-mustard oil curry — the soul of Bengali cuisine.",
    price: 380, category: "Mains", isVeg: false, rating: 4.9, prepTime: "25 min",
    spiceLevel: "Medium", calories: 420,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Bengal Kitchen"], restaurantName: "The Bengal Kitchen", city: "Kolkata",
  },
  {
    name: "Kosha Mangsho",
    description: "Mutton slow-braised in caramelized onions, ginger and robust spices until oil separates.",
    price: 460, category: "Mains", isVeg: false, rating: 4.8, prepTime: "40 min",
    spiceLevel: "Hot", calories: 580,
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Bengal Kitchen"], restaurantName: "The Bengal Kitchen", city: "Kolkata",
  },
  {
    name: "Aloo Posto",
    description: "Potatoes sautéed in a poppy seed paste with green chili and a tempering of mustard.",
    price: 180, category: "Mains", isVeg: true, rating: 4.6, prepTime: "15 min",
    spiceLevel: "Mild", calories: 280,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Bengal Kitchen"], restaurantName: "The Bengal Kitchen", city: "Kolkata",
  },
  {
    name: "Mishti Doi",
    description: "Bengali sweetened yogurt set in clay pots, with caramel-like depth from jaggery.",
    price: 90, category: "Desserts", isVeg: true, rating: 4.9, prepTime: "5 min",
    spiceLevel: "Mild", calories: 160,
    image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Bengal Kitchen"], restaurantName: "The Bengal Kitchen", city: "Kolkata",
  },
  {
    name: "Gondhoraj Lemon Soda",
    description: "Refreshing fizzy soda with rare Bengali Gondhoraj lime — fragrant and uniquely citrusy.",
    price: 80, category: "Drinks", isVeg: true, rating: 4.7, prepTime: "3 min",
    spiceLevel: "Mild", calories: 70,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["The Bengal Kitchen"], restaurantName: "The Bengal Kitchen", city: "Kolkata",
  },

  // ─── Grill & Greens — Hyderabad ───────────────────────────────
  {
    name: "Grilled Chicken Caesar Bowl",
    description: "Romaine lettuce, grilled chicken breast, croutons, parmesan shavings and Caesar dressing.",
    price: 340, category: "Bowls", isVeg: false, rating: 4.6, prepTime: "15 min",
    spiceLevel: "Mild", calories: 450,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
  {
    name: "Smoked BBQ Ribs",
    description: "Fall-off-the-bone pork ribs smoked for 6 hours, glazed with tangy BBQ sauce.",
    price: 680, category: "Mains", isVeg: false, rating: 4.8, prepTime: "30 min",
    spiceLevel: "Medium", calories: 780,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
  {
    name: "Quinoa Power Bowl",
    description: "Protein-packed quinoa with roasted sweet potato, chickpeas, kale, avocado and tahini dressing.",
    price: 290, category: "Bowls", isVeg: true, rating: 4.5, prepTime: "15 min",
    spiceLevel: "Mild", calories: 390,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
  {
    name: "Bruschetta Platter",
    description: "Toasted sourdough with heirloom tomatoes, basil pesto, bocconcini and aged balsamic.",
    price: 220, category: "Starters", isVeg: true, rating: 4.5, prepTime: "10 min",
    spiceLevel: "Mild", calories: 280,
    image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
  {
    name: "Dark Chocolate Lava Cake",
    description: "Warm Belgian dark chocolate fondant with a molten centre, served with vanilla bean ice cream.",
    price: 260, category: "Desserts", isVeg: true, rating: 4.9, prepTime: "15 min",
    spiceLevel: "Mild", calories: 480,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
  {
    name: "Cold Brew Coffee",
    description: "18-hour cold-steeped single-origin coffee served over ice with oat milk.",
    price: 180, category: "Drinks", isVeg: true, rating: 4.7, prepTime: "3 min",
    spiceLevel: "Mild", calories: 60,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    restaurantId: restaurantMap["Grill & Greens"], restaurantName: "Grill & Greens", city: "Hyderabad",
  },
];

const run = async () => {
  await connectDB();

  // Clear old data
  await Food.deleteMany();
  await Restaurant.deleteMany();

  // Insert restaurants & build name → _id map
  const insertedRestaurants = await Restaurant.insertMany(restaurants);
  const restaurantMap = {};
  insertedRestaurants.forEach((r) => {
    restaurantMap[r.name] = r._id;
  });

  const foods = getFoodItems(restaurantMap);
  await Food.insertMany(foods);

  console.log(`\n✅ Seeded ${insertedRestaurants.length} restaurants across 6 cities`);
  console.log(`✅ Seeded ${foods.length} food items into MongoDB Atlas\n`);
  process.exit();
};

run();
