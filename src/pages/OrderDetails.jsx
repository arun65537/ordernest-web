import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderApi from "../api/orderAxios";
import paymentApi from "../api/paymentAxios";
import api from "../api/axios";
import { formatCurrency } from "../utils/formatters";
import { logoutSession } from "../utils/session";
import { handleUnauthorizedRedirect } from "../utils/unauthorized";

const RAZORPAY_CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });

const ORDER_STATUS = Object.freeze({
  CREATED: "CREATED",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED"
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
});

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userError, setUserError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const currentOrderStatus = order?.status || "UNKNOWN";

  const isTerminalOrderStatus = (status) =>
    status === ORDER_STATUS.CONFIRMED || status === ORDER_STATUS.CANCELLED;

  const fetchOrder = useCallback(
    async (silent = false) => {
      setLoading(true);
      setError("");
      setUserError("");
      try {
        const [orderResult, userResult] = await Promise.allSettled([
          orderApi.get(`/api/orders/${orderId}`),
          api.get("/api/auth/me")
        ]);

        if (orderResult.status === "rejected") {
          throw orderResult.reason;
        }

        setOrder(orderResult.value.data);
        setPaymentStatus(orderResult.value.data?.paymentStatus || "");
        if (orderResult.value.data?.paymentStatus !== PAYMENT_STATUS.PENDING) {
          setPaymentInitiated(false);
        }

        if (userResult.status === "fulfilled") {
          setUser(userResult.value.data || null);
        } else {
          setUserError(
            userResult.reason?.response?.data?.error ||
              userResult.reason?.response?.data?.message ||
              "Unable to load user details."
          );
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleUnauthorizedRedirect();
          return;
        }
        setError(err?.response?.data?.message || "Unable to load order details.");
      } finally {
        setLoading(false);
        if (silent) {
          setRefreshing(false);
        }
      }
    },
    [navigate, orderId]
  );

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      fetchOrder();
    }
    return () => {
      cancelled = true;
    };
  }, [fetchOrder]);

  const handlePayNow = async () => {
    if (!order?.orderId || paymentSubmitting || paymentInitiated || cancelSubmitting) {
      return;
    }

    setPaymentError("");
    setPaymentSubmitting(true);

    try {
      const Razorpay = await loadRazorpayCheckout();
      if (!Razorpay) {
        throw new Error("Razorpay checkout is unavailable");
      }

      const { data: createOrderData } = await paymentApi.post("/api/payments/create-order", {
        orderId: order.orderId
      });

      const options = {
        key: createOrderData?.razorpayKeyId,
        amount: createOrderData?.amount,
        currency: createOrderData?.currency,
        name: "OrderNest",
        description: `Payment for Order ${order.orderId}`,
        order_id: createOrderData?.razorpayOrderId,
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          email: user?.email || ""
        },
        handler: async (response) => {
          setVerifyingPayment(true);
          try {
            const { data: verifyData } = await paymentApi.post("/api/payments/verify", {
              orderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (!verifyData?.verified) {
              throw new Error(verifyData?.message || "Payment verification failed");
            }

            setPaymentInitiated(true);
            setPaymentError("");
            await fetchOrder(true);
          } catch (verifyError) {
            setPaymentInitiated(false);
            setPaymentError(verifyError?.response?.data?.message || verifyError?.message || "Payment verification failed.");
          } finally {
            setVerifyingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentInitiated(false);
          }
        },
        theme: {
          color: "#0f766e"
        }
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.on("payment.failed", (response) => {
        setPaymentInitiated(false);
        setPaymentError(response?.error?.description || "Payment failed. Please try again.");
      });

      razorpayInstance.open();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorizedRedirect();
        return;
      }
      setPaymentError(err?.response?.data?.message || "Unable to initiate payment. Please try again.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.orderId || cancelSubmitting || currentOrderStatus === ORDER_STATUS.CANCELLED) {
      return;
    }

    setCancelError("");
    setPaymentError("");
    setCancelSubmitting(true);

    try {
      const { data } = await orderApi.post(`/api/orders/${order.orderId}/cancel`);
      setOrder(data);
      setPaymentStatus(data?.paymentStatus || "");
      setPaymentInitiated(false);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorizedRedirect();
        return;
      }
      setCancelError(err?.response?.data?.message || "Unable to cancel order. Please try again.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleManualRefresh = async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    setPaymentError("");
    await fetchOrder(true);
  };

  const handleLogout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!paymentInitiated || isTerminalOrderStatus(currentOrderStatus)) {
      return undefined;
    }

    const pollOrderStatus = async () => {
      try {
        const { data } = await orderApi.get(`/api/orders/${orderId}`);
        setOrder(data);
        setPaymentStatus(data?.paymentStatus || "");

        if (isTerminalOrderStatus(data?.status)) {
          setPaymentInitiated(false);
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleUnauthorizedRedirect();
          return;
        }
      }
    };

    const intervalId = setInterval(pollOrderStatus, 10000);

    return () => clearInterval(intervalId);
  }, [currentOrderStatus, navigate, orderId, paymentInitiated]);

  const currentPaymentStatus = paymentStatus || order?.paymentStatus || "UNKNOWN";
  const displayPaymentStatus =
    paymentInitiated && currentPaymentStatus === PAYMENT_STATUS.PENDING ? "PAYMENT INITIATED" : currentPaymentStatus;
  const paymentBadgeClass =
    displayPaymentStatus === PAYMENT_STATUS.PAID || displayPaymentStatus === PAYMENT_STATUS.SUCCESS
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : displayPaymentStatus === PAYMENT_STATUS.PENDING
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : displayPaymentStatus === "PAYMENT INITIATED"
          ? "bg-blue-100 text-blue-800 border-blue-200"
      : displayPaymentStatus === PAYMENT_STATUS.FAILED
          ? "bg-rose-100 text-rose-800 border-rose-200"
        : displayPaymentStatus === PAYMENT_STATUS.REFUNDED
          ? "bg-sky-100 text-sky-800 border-sky-200"
        : "bg-slate-100 text-slate-700 border-slate-200";

  const orderBadgeClass =
    currentOrderStatus === ORDER_STATUS.CONFIRMED || currentOrderStatus === ORDER_STATUS.SUCCESS
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : currentOrderStatus === ORDER_STATUS.CREATED || currentOrderStatus === ORDER_STATUS.PENDING
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : currentOrderStatus === ORDER_STATUS.CANCELLED || currentOrderStatus === ORDER_STATUS.FAILED
          ? "bg-rose-100 text-rose-800 border-rose-200"
        : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-primary-100 bg-white/95 p-5 shadow-2xl shadow-primary-100/70 backdrop-blur-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-back"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Page"}
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              Order #{orderId?.slice(0, 8)}
            </span>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-600">Loading order details...</p>}
        {error && <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {!loading && !error && order && (
          <article className="mt-6">
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-primary-50 p-5 shadow-sm">
              <h1 className="text-2xl font-semibold text-slate-900">Order Summary</h1>
              <p className="mt-1 text-sm text-slate-600">Track payment, order state, and buyer details</p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Order ID</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-700">{order.orderId}</p>
                <h2 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Order Status</h2>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${orderBadgeClass}`}>
                    {currentOrderStatus}
                  </div>
                  {currentOrderStatus !== ORDER_STATUS.CANCELLED && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={cancelSubmitting}
                      className="inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelSubmitting ? "Cancelling Order..." : "Cancel Order"}
                    </button>
                  )}
                </div>
                {cancelError && (
                  <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{cancelError}</p>
                )}
                <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Product Name</dt>
                    <dd className="max-w-[62%] break-all text-right font-medium text-slate-800">{order.item?.productName || "-"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Quantity</dt>
                    <dd className="font-medium text-slate-800">{order.item?.quantity}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Total Amount</dt>
                    <dd className="font-medium text-slate-800">
                      {formatCurrency(Number(order.item?.totalAmount), order.item?.currency)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Payment Status</h2>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${paymentBadgeClass}`}>
                    {displayPaymentStatus}
                  </div>
                  {currentPaymentStatus === PAYMENT_STATUS.PENDING && currentOrderStatus !== ORDER_STATUS.CANCELLED && (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={paymentSubmitting || paymentInitiated || cancelSubmitting || verifyingPayment}
                      className="inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentSubmitting
                        ? "Initiating Payment..."
                        : verifyingPayment
                          ? "Verifying Payment..."
                          : paymentInitiated
                            ? "Payment Initiated"
                            : "Pay Now"}
                    </button>
                  )}
                </div>
                {verifyingPayment && (
                  <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">Verifying payment...</p>
                )}
                {paymentError && (
                  <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentError}</p>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">User Details</h2>
                {userError && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{userError}</p>}
                {!userError && (
                  <dl className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="max-w-[62%] break-all text-right font-medium text-slate-800">{user?.email || "-"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "-"}
                      </dd>
                    </div>
                  </dl>
                )}
              </section>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
