import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Home from "./pages/Home.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { ProtectedRoute } from "./context/AuthContext.jsx";

import {LiveStatus} from "./context/LiveContext.jsx";
function App() {
  return (
    <div className="min-h-screen bg-paper font-body">
      <Navbar />
      <LiveStatus />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/menu" element={<Home />} />
        <Route path="/login/:role" element={<Login />} />
        {["customer", "restaurant", "delivery", "admin"].map((role) => (
          <Route
            key={role}
            path={"/" + role}
            element={
              <ProtectedRoute role={role}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="customer">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success"
          element={
            <ProtectedRoute role="customer">
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
