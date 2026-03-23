import { Link, useNavigate } from "react-router-dom";
import { clearToken, isAuthenticated } from "../utils/auth";
import { logoutSession } from "../utils/session";

export default function Landing() {
  const navigate = useNavigate();
  const showLogout = isAuthenticated();

  const handleLogout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white/90 p-8 shadow-xl shadow-primary-100/60 backdrop-blur-sm">
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
        <h1 className="text-center text-3xl font-bold text-primary-700">OrderNest</h1>
        <p className="mt-3 text-center text-sm text-slate-600">
          Manage your orders with a secure and simple workflow.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-primary-700"
          >
            Login
          </Link>
          <Link
            to="/admin/login"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Admin Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-primary-200 px-4 py-2.5 text-center font-medium text-primary-700 transition hover:bg-primary-50"
          >
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
