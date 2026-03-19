import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

function validatePassword(password) {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return password.length >= 8 && hasLetter && hasNumber && hasSpecial;
}

export default function ChangePassword() {
  const { search } = useLocation();
  const token = useMemo(() => new URLSearchParams(search).get("token"), [search]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage("Password change token is missing in the link.");
      return;
    }

    if (!validatePassword(password)) {
      setMessage("Password must be at least 8 characters and include a letter, number, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/change-password", {
        token,
        newPassword: password
      });
      setSuccess(true);
      setMessage(data?.message || "Password changed successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to change password. The link may be invalid or expired.";
      setSuccess(false);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-xl shadow-primary-100/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">OrderNest</p>
        <h1 className="mt-2 text-2xl font-semibold text-primary-700">Change Password</h1>

        {!token && (
          <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Password change token is missing in the link.
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use at least 8 characters with a letter, number, and special character.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
          </div>

          {message && (
            <p className={`rounded-md px-3 py-2 text-sm ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Updating password..." : "Update Password"}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Go to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
