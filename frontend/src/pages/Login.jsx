import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../lib/api.js";
import { ROLES } from "../lib/roles.js";
let googleScript;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript)
    googleScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        googleScript = null;
        script.remove();
        reject(new Error("Google could not load. Check your connection."));
      };
      document.head.appendChild(script);
    });
  return googleScript;
}
export default function Login() {
  const { role } = useParams(),
    { user, loading, login } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const googleButton = useRef(null),
    callback = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  function finish(account) {
    const from = location.state?.from;
    navigate(
      account.role === "customer" &&
        ["/checkout", "/customer", "/order-success"].includes(from)
        ? from
        : "/" + account.role,
      { replace: true },
    );
  }
  callback.current = async (response) => {
    setBusy(true);
    setError("");
    try {
      finish(await login("google", { credential: response.credential }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setError("");
    setPassword("");
    setUsername("");
    if (role !== "customer" || !clientId) return;
    let active = true;
    loadGoogle()
      .then(() => {
        if (!active || !googleButton.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => callback.current(r),
          auto_select: false,
        });
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 280,
          text: "continue_with",
        });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [role, clientId]);
  if (!ROLES[role]) return <Navigate to="/" replace />;
  if (!loading && user) return <Navigate to={"/" + user.role} replace />;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      finish(await login("staff", { role, username, password }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-5xl mx-auto px-5 py-12 sm:py-20">
      <Link
        to="/"
        className="inline-flex gap-2 text-sm text-ink/60 items-center mb-8"
      >
        <ArrowLeft size={16} /> Choose another role
      </Link>
      <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-ink/10 bg-card shadow-lg">
        <section className="bg-teal text-paper p-8 sm:p-12">
          <p className="text-xs uppercase tracking-widest text-paper/60 mb-6">
            Your Foodie space
          </p>
          <h1 className="font-display text-4xl font-bold mb-5">
            Welcome,
            <br />
            {ROLES[role].title.toLowerCase()}.
          </h1>
          <p className="text-paper/75 leading-relaxed">
            {ROLES[role].description}
          </p>
          <div className="mt-12 flex gap-3 text-sm text-paper/70">
            <LockKeyhole size={20} />
            <p>
              {role === "customer"
                ? "Your Google account gets you in. Foodie keeps your orders in one place."
                : "Your account opens the tools assigned to this role."}
            </p>
          </div>
        </section>
        <section className="p-8 sm:p-12">
          <h2 className="font-display text-2xl font-bold mb-2">
            Let’s get you signed in
          </h2>
          <p className="text-sm text-ink/55 mb-8">
            {role === "customer"
              ? "No new password to remember."
              : "Enter your staff user ID and password."}
          </p>
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl bg-red-50 text-red-800 p-3 text-sm"
            >
              {error}
            </p>
          )}
          {role === "customer" ? (
            <div>
              {clientId ? (
                <div ref={googleButton} />
              ) : (
                <p
                  role="status"
                  className="bg-turmeric/15 rounded-xl p-4 text-sm leading-relaxed"
                >
                  Google sign-in is being configured. Please finish the Google
                  client ID setup before signing in.
                </p>
              )}
              {busy && (
                <p role="status" className="mt-4 text-sm">
                  Verifying your Google account…
                </p>
              )}
              <p className="mt-6 text-xs text-ink/45">
                First visit? Your customer account is created automatically
                after Google verifies your identity.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-semibold">
                User ID
                <input
                  required
                  autoComplete="username"
                  value={username}
                  maxLength={80}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full border border-ink/20 rounded-xl p-3 bg-paper"
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  maxLength={128}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border border-ink/20 rounded-xl p-3 bg-paper"
                />
              </label>
              <button
                disabled={busy || loading}
                className="w-full bg-teal text-white p-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
