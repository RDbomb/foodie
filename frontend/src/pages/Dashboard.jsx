import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowRight, Package, ChefHat, Bike } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, errorMessage } from "../lib/api.js";
import { ROLES } from "../lib/roles.js";
import {useLive} from "../context/LiveContext.jsx";
const button =
  "rounded-xl bg-teal text-white px-4 py-2 text-sm font-semibold disabled:opacity-50";
export default function Dashboard() {
  const { user } = useAuth();
  const {revision}=useLive();
  const requestVersion=useRef(0);
  const [orders, setOrders] = useState([]),
    [foods, setFoods] = useState([]),
    [partners, setPartners] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const version=++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all([
        api.get("/orders", { params: { page, limit: 20 } }),
        user.role === "restaurant" && user.restaurantId
          ? api.get("/foods", { params: { restaurantId: user.restaurantId } })
          : Promise.resolve(null),
        ["admin", "restaurant"].includes(user.role)
          ? api.get("/auth/delivery-partners")
          : Promise.resolve(null),
      ]);
      if(version!==requestVersion.current)return;
      setOrders(results[0].data.data);
      setFoods(results[1]?.data.data || []);
      setPartners(results[2]?.data.data || []);
    } catch (e) {
      if(version===requestVersion.current)setError(errorMessage(e));
    } finally {
      if(version===requestVersion.current)setLoading(false);
    }
  }, [user.role, user.restaurantId, page]);
  useEffect(() => {
    load();
  }, [load,revision]);
  useEffect(()=>{const refresh=()=>load();window.addEventListener("focus",refresh);return()=>window.removeEventListener("focus",refresh);},[load]);
  async function action(path, body) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(path, body);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <p className="text-teal text-xs tracking-widest uppercase font-semibold mb-2">
            {ROLES[user.role].title} console
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            Hello, {user.name}.
          </h1>
        </div>
        <button
          className="flex items-center gap-2 text-sm border border-ink/15 rounded-xl px-4 py-2"
          onClick={load}
          disabled={loading || busy}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {user.role === "customer" && (
        <Link
          to="/menu"
          className="mb-8 flex items-center justify-between gap-5 rounded-3xl p-7 bg-teal text-paper"
        >
          <div>
            <h2 className="font-display text-2xl font-bold">
              Something delicious is waiting.
            </h2>
            <p className="mt-2 text-sm text-paper/75">
              Browse local kitchens and find your next meal.
            </p>
          </div>
          <ArrowRight />
        </Link>
      )}
      <p className="text-ink/55 text-sm mb-6">
        {
          {
            customer: "Your orders and their latest status.",
            restaurant:
              "When an order is ready, choose a delivery partner and confirm you have handed it over.",
            delivery: "Only deliveries assigned to your account appear here.",
            admin:
              "View orders and assign delivery partners. Restaurants confirm handover; delivery partners confirm delivery.",
          }[user.role]
        }
      </p>
      {error && (
        <p role="alert" className="bg-red-50 text-red-800 p-4 rounded-xl mb-5">
          {error}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
        <Package size={22} />
        {user.role === "delivery" ? "Assigned deliveries" : "Orders"}
      </h2>
      {loading ? (
        <p role="status" className="p-8">
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-ink/20 text-ink/50">
          No orders here yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <article
              key={order._id}
              className="p-5 sm:p-6 bg-card border border-ink/10 rounded-2xl"
            >
              <div className="flex justify-between gap-3 mb-4">
                <p className="font-mono text-xs text-ink/50">
                  #{order._id.slice(-8).toUpperCase()}
                </p>
                <span className="bg-teal/10 text-teal text-xs px-3 py-1 rounded-full capitalize">
                  {order.status.replaceAll("-", " ")}
                </span>
              </div>
              {order.handedOverAt && <p className="text-sm text-teal mb-3">Handed to delivery partner · {new Date(order.handedOverAt).toLocaleString()}</p>}
              <p className="text-xs text-ink/45 mb-3">
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <ul className="text-sm space-y-1 mb-4">
                {order.items.map((item) => (
                  <li key={item.foodId}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
              <p className="font-bold mb-3">
                ₹{order.total.toFixed(2)}{" "}
                <span className="text-xs font-normal text-ink/50">
                  · Pay on delivery
                </span>
              </p>
              <p className="text-sm text-ink/60">
                {order.customerName} · {order.phone}
              </p>
              <p className="text-sm text-ink/60 mt-1">{order.address}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.role === 'restaurant' && ['placed','preparing'].includes(order.status) && <Handoff order={order} partners={partners} busy={busy} onHandoff={deliveryPartnerId=>action('/orders/'+order._id+'/handoff',{deliveryPartnerId})}/>}
                
                {user.role === "delivery" && String(order.deliveryPartnerId) === user.id &&
                  order.status === "out-for-delivery" && (
                    <button
                      disabled={busy}
                      className={button}
                      onClick={() =>
                        action("/orders/" + order._id + "/status", {
                          status: "delivered",
                        })
                      }
                    >
                      Mark delivered
                    </button>
                  )}
              </div>
              {user.role === "admin" &&
                ["placed", "preparing"].includes(order.status) && (
                  <label className="block mt-4 text-xs font-semibold">
                    Delivery partner
                    <select
                      aria-label={"Delivery partner for " + order._id}
                      disabled={busy}
                      value={order.deliveryPartnerId || ""}
                      onChange={(e) =>
                        action("/orders/" + order._id + "/assign", {
                          deliveryPartnerId: e.target.value,
                        })
                      }
                      className="block mt-2 w-full border rounded-xl p-2 bg-paper"
                    >
                      <option value="" disabled>
                        Assign a partner
                      </option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
            </article>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-4 my-6 text-sm">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="disabled:opacity-30"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={orders.length < 20 || loading}
          onClick={() => setPage((p) => p + 1)}
          className="disabled:opacity-30"
        >
          Next
        </button>
      </div>
      {user.role === "restaurant" && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-4 flex gap-2 items-center">
            <ChefHat size={22} /> Your menu
          </h2>
          {!user.restaurantId ? (
            <p>No restaurant assigned. Contact your administrator.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foods.map((food) => (
                <MenuPrice
                  key={food._id}
                  food={food}
                  busy={busy}
                  save={(price) => action("/foods/" + food._id, { price })}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
function MenuPrice({ food, busy, save }) {
  const [price, setPrice] = useState(food.price);
  useEffect(() => setPrice(food.price), [food.price]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(Number(price));
      }}
      className="bg-card rounded-2xl border border-ink/10 p-4"
    >
      <h3 className="font-semibold mb-2">{food.name}</h3>
      <p className="text-xs text-ink/50 mb-4">{food.category}</p>
      <label className="text-xs font-semibold">
        Price (₹)
        <input
          aria-label={"Price for " + food.name}
          type="number"
          required
          min="0"
          max="100000"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="block w-full p-2 my-2 border rounded-lg bg-paper"
        />
      </label>
      <button
        disabled={busy || Number(price) === food.price}
        className={button}
      >
        Save price
      </button>
    </form>
  );
}

function Handoff({order,partners,busy,onHandoff}){
 const [selected,setSelected]=useState(order.deliveryPartnerId||'');
 const partnerId=selected || (partners.length===1?partners[0].id:'');
 return <div className="w-full space-y-3"><label className="block text-xs font-semibold">Hand order to<select aria-label={'Handoff partner for '+order._id} className="block w-full border rounded-xl p-2 mt-2 bg-paper" value={partnerId} onChange={e=>setSelected(e.target.value)} disabled={busy}><option value="" disabled>Choose delivery partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{!partners.length&&<p className="text-sm text-ink/60">No delivery partners available. Ask your administrator to add one.</p>}<button className={button} disabled={busy||!partnerId} onClick={()=>onHandoff(partnerId)}>Ready — hand to delivery partner</button><p className="text-xs text-ink/50">Confirm only once the partner has collected the food.</p></div>;
}
