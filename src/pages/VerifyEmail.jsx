import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const { search } = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const token = useMemo(() => new URLSearchParams(search).get("token"), [search]);

  useEffect(() => {
    let ignore = false;

    const verify = async () => {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage("Verification token is missing in the link.");
        return;
      }

      try {
        const { data } = await api.get("/api/auth/verify-email", {
          params: { token }
        });
        if (ignore) {
          return;
        }
        setSuccess(true);
        setMessage(data?.message || "Email verified successfully.");
      } catch (err) {
        if (ignore) {
          return;
        }
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to verify email. The link may be invalid or expired.";
        setSuccess(false);
        setMessage(errorMessage);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    verify();
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-xl shadow-primary-100/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">OrderNest</p>
        <h1 className="mt-2 text-2xl font-semibold text-primary-700">Email Verification</h1>

        {loading ? (
          <p className="mt-6 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">Verifying your email...</p>
        ) : success ? (
          <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : (
          <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Go to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
