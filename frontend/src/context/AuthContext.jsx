import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api, setCsrf } from "../lib/api.js";
import { clearCart, setCartOpen } from "../redux/cartSlice.js";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  function accept(data) {
    setUser(data.user);
    setCsrf(data.csrf);
    return data.user;
  }
  useEffect(() => {
    let active = true;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (active) accept(data);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setCsrf(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setCsrf(null);
      dispatch(setCartOpen(false));
    };
    window.addEventListener("foodie-session-expired", expired);
    return () => window.removeEventListener("foodie-session-expired", expired);
  }, [dispatch]);
  async function login(kind, body) {
    const { data } = await api.post("/auth/" + kind, body);
    return accept(data);
  }
  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      if (e.response?.status !== 401) throw e;
    }
    setUser(null);
    setCsrf(null);
    dispatch(clearCart());
    dispatch(setCartOpen(false));
  }
  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth(),
    location = useLocation();
  if (loading)
    return <p className="p-12 text-center">Checking your session…</p>;
  if (!user)
    return (
      <Navigate
        to={"/login/" + role}
        state={{ from: location.pathname }}
        replace
      />
    );
  if (user.role !== role) return <Navigate to={"/" + user.role} replace />;
  return children;
}
