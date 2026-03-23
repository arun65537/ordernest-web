import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import inventoryApi from "../api/inventoryAxios";
import orderApi from "../api/orderAxios";
import { clearToken } from "../utils/auth";
import { getColorClass } from "../utils/colorSwatch";
import { formatCurrency } from "../utils/formatters";
import { logoutSession } from "../utils/session";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [orderError, setOrderError] = useState("");

  const logout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await inventoryApi.get(`/api/products/${id}`);
        if (!cancelled) {
          setProduct(data);
          setQuantity(1);
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            clearToken();
            navigate("/login", { replace: true });
            return;
          }
          setLoadError(err?.response?.data?.message || "Unable to load product details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const maxQuantity = Math.max(Number(product?.availableQuantity) || 0, 0);
  const setSafeQuantity = (value) => {
    if (maxQuantity <= 0) return setQuantity(1);
    const parsed = Number(value);
    const safe = Number.isNaN(parsed) ? 1 : parsed;
    setQuantity(Math.min(Math.max(Math.floor(safe), 1), maxQuantity));
  };

  const colorClass = useMemo(() => getColorClass(product?.id || id || ""), [id, product?.id]);

  const handleBuy = async () => {
    if (!product) return;

    setSubmitting(true);
    setOrderError("");
    try {
      const payload = {
        item: {
          productId: product.id,
          quantity
        }
      };
      const { data } = await orderApi.post("/api/orders", payload);
      const orderId = data?.orderId;
      if (!orderId) {
        throw new Error("Order ID missing in response.");
      }
      navigate(`/orders/${orderId}`);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      setOrderError(err?.response?.data?.message || err.message || "Unable to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-primary-100 bg-white/95 p-5 shadow-2xl shadow-primary-100/70 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-back">
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
            >
              My Orders
            </button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-600">Loading product details...</p>}
        {loadError && <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>}

        {!loading && !loadError && product && (
          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`h-56 w-full rounded-2xl ${colorClass}`} />
            <div className="mt-5">
              <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
              <p className="mt-2 text-lg font-semibold text-primary-700">{formatCurrency(Number(product.price), product.currency)}</p>
              <p className="mt-2 text-sm text-slate-600">Stock: {product.availableQuantity}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex items-center rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity - 1)}
                    disabled={quantity <= 1 || maxQuantity <= 0}
                    className="h-10 w-10 text-lg font-semibold text-slate-700 disabled:text-slate-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(maxQuantity, 1)}
                    value={quantity}
                    onChange={(event) => setSafeQuantity(event.target.value)}
                    disabled={maxQuantity <= 0}
                    className="h-10 w-16 border-x border-slate-200 text-center text-sm font-medium text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity + 1)}
                    disabled={quantity >= maxQuantity || maxQuantity <= 0}
                    className="h-10 w-10 text-lg font-semibold text-slate-700 disabled:text-slate-300"
                  >
                    +
                  </button>
                </div>
                {orderError && (
                  <p className="text-sm text-rose-700 sm:order-first sm:w-full">{orderError}</p>
                )}
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={submitting || maxQuantity <= 0}
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-slate-300"
                >
                  {submitting ? "Buying..." : "Buy"}
                </button>
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
