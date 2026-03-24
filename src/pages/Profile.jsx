import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getTokenPayload, getUserId, getUserRole } from "../utils/auth";
import { logoutSession } from "../utils/session";

function resolveEmail(user, tokenPayload) {
  if (user?.email && typeof user.email === "string") {
    return user.email;
  }
  const tokenEmail = tokenPayload?.email;
  return typeof tokenEmail === "string" ? tokenEmail : "";
}

export default function Profile() {
  const navigate = useNavigate();
  const tokenPayload = useMemo(() => getTokenPayload(), []);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        if (cancelled) {
          return;
        }
        setProfile(data || null);
        setResetEmail(resolveEmail(data, tokenPayload));
      } catch {
        if (cancelled) {
          return;
        }
        setProfileError("Live profile details are unavailable, showing token details.");
        setResetEmail(resolveEmail(null, tokenPayload));
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [tokenPayload]);

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "OrderNest User";
  const email = resolveEmail(profile, tokenPayload) || "-";
  const userId = profile?.id || getUserId() || "-";
  const role = profile?.role || getUserRole() || "USER";

  const handleRequestPasswordReset = async (event) => {
    event.preventDefault();
    setResetMessage("");
    setResetError("");

    const emailValue = resetEmail.trim();
    if (!emailValue) {
      setResetError("Email is required.");
      return;
    }

    setSubmittingReset(true);
    try {
      const { data } = await api.post("/api/auth/password-reset", {
        email: emailValue
      });
      setResetMessage(data?.message || "Password reset link sent to your email.");
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to request password reset. Please try again."
      );
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-primary-100 bg-white/95 p-5 shadow-2xl shadow-primary-100/70 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Account</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
          {profileError && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{profileError}</p>}
          <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-right font-medium text-slate-800">{displayName}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-right font-medium text-slate-800">{email}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="text-right font-medium text-slate-800">{role}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500">User ID</dt>
              <dd className="max-w-[65%] break-all text-right font-medium text-slate-800">{userId}</dd>
            </div>
          </dl>
        </article>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <p className="mt-1 text-sm text-slate-600">
            Request a password reset link for your account email. You can then complete the update from the email link.
          </p>

          <form onSubmit={handleRequestPasswordReset} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profileResetEmail">
                Email
              </label>
              <input
                id="profileResetEmail"
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
              />
            </div>

            {resetError && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{resetError}</p>}
            {resetMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{resetMessage}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submittingReset}
                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingReset ? "Sending..." : "Send Reset Link"}
              </button>
              <Link
                to="/change-password"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Change Password Page
              </Link>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
