import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import orderApi from "../api/orderAxios";
import { formatCurrency } from "../utils/formatters";
import { logoutSession } from "../utils/session";
import { handleUnauthorizedRedirect } from "../utils/unauthorized";

const ORDER_STATUS = Object.freeze({
  CREATED: "CREATED",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED"
});

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await orderApi.get("/api/orders/me");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorizedRedirect();
        return;
      }

      setError(err?.response?.data?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders]);

  const getOrderBadgeClass = (status) => {
    if (status === ORDER_STATUS.CONFIRMED || status === ORDER_STATUS.SUCCESS) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }

    if (status === ORDER_STATUS.CREATED || status === ORDER_STATUS.PENDING) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }

    if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.FAILED) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleLogout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-primary-100 bg-white/95 p-5 shadow-2xl shadow-primary-100/70 backdrop-blur-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Orders</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">My Orders</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Products
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-600">Loading your orders...</p>}
        {error && <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {!loading && !error && sortedOrders.length === 0 && (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">No orders found for your account.</p>
        )}

        {!loading && !error && sortedOrders.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {sortedOrders.map((order) => (
              <article
                key={order.orderId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Order #{order.orderId?.slice(0, 8)}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getOrderBadgeClass(order.status)}`}>
                    {order.status || "UNKNOWN"}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Product</dt>
                    <dd className="text-right font-medium">{order.item?.productName || "-"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Quantity</dt>
                    <dd className="font-medium">{order.item?.quantity ?? "-"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-medium">
                      {formatCurrency(Number(order.item?.totalAmount), order.item?.currency)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Payment</dt>
                    <dd className="font-medium">{order.paymentStatus || "-"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Placed At</dt>
                    <dd className="font-medium">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                    </dd>
                  </div>
                </dl>
                <Link
                  to={`/orders/${order.orderId}`}
                  className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  View Details
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
