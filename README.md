# Foodie — Full Stack Lab (Experiments 1–6)

React 18 + Vite + Tailwind CSS, Context, Redux Toolkit, Express, and MongoDB/Mongoose.
Browse dishes, filter the menu, maintain a persistent cart, and place a real database-backed order with payment due on delivery.

## Start on Windows

Open two terminals inside this project. Existing local configuration has been preserved.

Backend:

```powershell
cd backend
npm install
# Only on a fresh copy, when .env does not exist:
# Copy-Item .env.example .env
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. API: http://localhost:5000/api.
The backend waits for MongoDB before accepting requests. GET /api/health returns 200 only while MongoDB is connected; otherwise 503.
Use localhost (matching CLIENT_URL), or configure CLIENT_URL for the exact frontend origin. VITE_API_URL can override the frontend API URL.

## Experiment 6: four roles and sign-in

The landing page at / lets visitors choose Customer, Restaurant partner, Delivery partner or Administrator. /menu stays public. Checkout requires a Google-authenticated customer.

| Role | Login | Console |
| --- | --- | --- |
| Customer | Sign in with Google | Browse, checkout, own order history |
| Restaurant | User ID admin, password admin | Assigned kitchen menu prices and incoming orders |
| Delivery | User ID admin, password admin | Assigned deliveries, pickup and delivery status |
| Admin | User ID admin, password admin | All orders, delivery assignment, fulfilment status |

These are three separate staff accounts, even though their demo credentials match. Restaurant demo account is assigned to **Spice Route Kitchen** in the existing database. Passwords are bcrypt hashes, never plaintext database fields. Demo accounts are rejected in production.

Run **npm run seed:staff** inside backend on a fresh installation after restaurants exist. It inserts missing demo accounts without deleting data or resetting existing passwords. The older **npm run seed** command replaces catalog data and is not required here.

MONGO_URI and a random JWT_SECRET of at least 32 characters belong only in backend/.env. The local JWT secret has been generated. The old ADMIN_API_KEY is no longer accepted by any route. Google sign-in needs the same public client ID in backend GOOGLE_CLIENT_ID and frontend VITE_GOOGLE_CLIENT_ID; see [GOOGLE-SETUP.md](GOOGLE-SETUP.md). Real Google login remains unverified until this external setup is completed.

Sessions last two hours, use HttpOnly/SameSite=Strict cookies and MongoDB session records, and are revoked on logout. Mutating authenticated API requests must send the session's X-CSRF-Token from login or GET /auth/me. Production cookies require HTTPS. Frontend and API must share a site with this cookie policy; localhost ports are supported.

The server loads roles and ownership from MongoDB. Customers see only their orders, restaurant partners see their kitchen's orders and can edit only their food records, delivery partners see only assigned orders, and admins see all orders. Orders placed before authentication was added remain admin-only; they are not assigned to a customer using names or phone numbers.

New orders contain one restaurant per order. Status moves placed → preparing → out-for-delivery → delivered. Restaurant/admin starts preparing, admin assigns a delivery partner, and that partner records pickup/delivery. Dashboard Refresh retrieves current status; WebSocket updates belong to experiment 8.

## Experiment-wise evidence and demonstration

| Experiment                  | Implementation                                                                                                                                                                            | Demonstration                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1: Responsive Tailwind UI   | Home, Navbar, FoodCard, CartDrawer, Checkout, OrderSuccess; responsive grid, filters, drawer, labelled controls                                                                           | Browse at desktop/mobile widths; search and select city/category; add a dish and open the drawer                                |
| 2: React hooks              | useFetch uses useState/useEffect and AbortController; useDebounce cleans up its timer; useLocalStorage persists preferences; usePreferences consumes useContext                           | Toggle Veg only in Navbar and observe Home update; refresh to show persistence; type a search and show its 300 ms debounce      |
| 3: Complex state with Redux | cartSlice actions/selectors; store subscription saves cart outside pure reducers                                                                                                          | Add twice, adjust quantity, remove by reducing to zero; refresh and verify cart; explain subtotal/fee/total selectors           |
| 4: REST + MongoDB/Mongoose  | Food, Restaurant, Order schemas; references; catalog CRUD; validated order creation                                                                                                       | List/create/read/update/delete a test catalog item; place an order and inspect the saved document                               |
| 5: Secure REST APIs         | Helmet, origin allowlist, global/order rate limits, 10 KB body cap, allowlisted validated fields, pagination, authenticated role protection, generic internal errors, server-authoritative pricing | Run npm test in backend; show invalid requests returning 422, protected requests 401, oversized JSON 413, and rate limiting 429 |

Context owns vegetarian preferences. Redux owns the cart. They do not write to the same storage key. CartContext is only a compatibility adapter to Redux; the old preferencesSlice is retained as an unused earlier experiment artifact.

## API reference

All paths below start with /api. JSON responses use { success, data }; list responses also include count/page/limit (catalog lists include total).

| Method | Path             | Access / purpose                                                  |
| ------ | ---------------- | ----------------------------------------------------------------- |
| GET    | /health          | Public database readiness                                         |
| GET    | /foods           | Public; category, city, veg=true/false, restaurantId, page, limit |
| GET    | /foods/:id       | Public single dish                                                |
| POST   | /foods           | Admin or owning restaurant; create                                                     |
| PATCH  | /foods/:id       | Admin or owning restaurant; partial update                                             |
| DELETE | /foods/:id       | Admin or owning restaurant; delete; 204 on success                                     |
| GET    | /restaurants     | Public; city, cuisine, page, limit                                |
| GET    | /restaurants/:id | Public restaurant and up to 100 dishes                            |
| POST   | /restaurants     | Admin; create                                                     |
| PATCH  | /restaurants/:id | Admin; partial update                                             |
| DELETE | /restaurants/:id | Admin; blocked with 409 while dishes reference it                 |
| POST   | /orders          | Customer; authenticated checkout                                            |
| GET    | /orders          | Authenticated; role/ownership-scoped list                            |
| GET    | /orders/:id      | Authenticated; ownership-scoped details                                      |

Authentication endpoints: POST /auth/google with {credential}; POST /auth/staff with {role,username,password}; GET /auth/me; POST /auth/logout. Admin can GET /auth/delivery-partners and PATCH /orders/:id/assign with {deliveryPartnerId}. Staff can PATCH /orders/:id/status with {status}, subject to role and transition checks.

Example order body (replace foodId with a live ID from GET /foods):

```json
{
  "customerName": "Lab Test",
  "phone": "9000000000",
  "address": "Synthetic lab test address",
  "items": [{ "foodId": "REPLACE_WITH_LIVE_MONGODB_ID", "quantity": 2 }]
}
```

Client prices, names, fees and totals are ignored. The server retrieves dish names/prices from MongoDB. Quantities are 1–99 per dish, including duplicate entries. Missing dishes are rejected. Free delivery applies above ₹500; otherwise ₹40. Catalog lists are capped at 100 records per request. City/cuisine filters use exact text matches, not user-controlled regular expressions.

Example food body for POST /foods:

```json
{
  "name": "Lab Test Dish",
  "description": "Temporary lab dish",
  "price": 100,
  "category": "Mains",
  "image": "https://example.com/dish.jpg",
  "isVeg": true
}
```

Use PATCH /foods/:id with {"price":120}; then DELETE that exact test ID. Do not delete existing menu items for a demonstration. Restaurant create requires name, cuisine, city, location, address, image. Food restaurantId, when supplied, must reference an existing restaurant.

## Verification

```powershell
# backend
npm test
# frontend
npm run build
```

The automated suite exercises real Express middleware/routes and Mongoose order validation with mocked database operations. It never connects to or clears the live database. Browser testing additionally covers the existing live menu and checkout.

The seed command is optional for an empty development database. It deletes and replaces all foods/restaurants; do not run it against data you need to keep.

## Honest failure states and scope

When the API fails, the menu explicitly shows sample browsing data and disables adding it to the cart. An empty live menu remains empty. Failed checkout retains the cart and displays the error; successful checkout uses the saved order response. The receipt shows amount due and status at confirmation, without simulated delivery progress.

Experiment 6 code is implemented; Google client setup and a real customer Google login are the remaining external steps. Experiments 7–10 (Postman collection, WebSockets, CI/CD, Docker) are pending. This is a local lab application. Production requires replacing demo staff accounts, HTTPS, appropriate deployment cookie/CORS settings and shared rate-limit storage for multiple instances.

Restaurant handoff: choose a delivery partner and click Ready — hand to delivery partner. PATCH /orders/:id/handoff atomically assigns the partner and moves a placed/preparing order to out-for-delivery. Only the owning restaurant can hand off; the assigned partner can then mark delivered. Consoles refresh on window focus or via Refresh.

Fulfilment permissions: only restaurant accounts can hand over their kitchen orders; only the assigned delivery account can mark an out-for-delivery order delivered. Admins can view orders and assign partners, but cannot perform either fulfilment action.

## Experiment 8 — WebSockets

Socket.IO runs on the Express HTTP server at /api/socket.io using WebSocket transport. HttpOnly cookie sessions, CSRF handshake tokens, and allowed origins protect connections. Orders publish scoped invalidations after successful database writes; clients fetch current data through the existing protected REST API. Logout disconnects the session, expiry closes sockets, and every event rechecks session and role ownership. No client event can change an order.

The signed-in UI shows connection status and short notifications. Dashboards and order receipts refresh automatically after an event or reconnection. Separate browsers/profiles are required for simultaneous different accounts because cookies are shared between tabs.

Demo: log in customer, restaurant, delivery and admin in separate profiles; observe Live updates connected. Place an order from Spice Route Kitchen, watch restaurant/admin update, hand it to the demo delivery partner, then mark delivered as that partner. The customer receipt and consoles update without Refresh. Restart the backend to show Reconnecting, then Connected and a fresh order list. Chrome verification completed on 2026-09-10: an authenticated admin console received a synthetic order, handover and delivery completion without clicking Refresh or navigating. Mutations used authenticated customer/restaurant/delivery API sessions. Synthetic order, user and sessions were removed afterward. Simultaneous browser profiles for all roles were not exercised.

Run npm test in backend: includes real WebSocket connections with mocked database storage, checking unauthenticated and wrong-origin/CSRF rejection, scoped events, logout disconnection, revoked sessions and reconnects. Deployment needs a persistent WebSocket-capable backend (separate from a static frontend host); multiple API instances need a shared Socket.IO adapter.
