import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { clearToken, isAdmin, isAuthenticated, setAuth } from "../utils/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const showLogout = isAuthenticated();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    clearToken();
    navigate("/", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/login", form);
      const token = data?.token ?? data?.jwt ?? data?.accessToken;

      if (!token) {
        throw new Error("Missing token in login response.");
      }

      setAuth(data);
      if (!isAdmin(token)) {
        clearToken();
        throw new Error("This account does not have admin access.");
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Unable to login. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-xl shadow-primary-100/60">
        {showLogout && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">OrderNest Console</p>
        <h1 className="mt-2 text-2xl font-semibold text-primary-700">Admin Login</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
          </div>

          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Enter Admin Console"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Not an admin?{" "}
          <Link to="/login" className="font-medium text-primary-700 hover:underline">
            User login
          </Link>
        </p>
      </section>
    </main>
  );
}
