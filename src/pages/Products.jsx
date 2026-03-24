import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import inventoryApi from "../api/inventoryAxios";
import { clearToken } from "../utils/auth";
import { getColorClass } from "../utils/colorSwatch";
import { formatCurrency } from "../utils/formatters";
import { logoutSession } from "../utils/session";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await inventoryApi.get("/api/products");
        if (!cancelled) {
          const parsed = Array.isArray(data) ? data : [];
          setProducts(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            clearToken();
            navigate("/login", { replace: true });
            return;
          }

          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load products. Please try again.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const logout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const name = product?.name?.toLowerCase() || "";
      const description = product?.description?.toLowerCase() || "";
      const currency = product?.currency?.toLowerCase() || "";
      return name.includes(query) || description.includes(query) || currency.includes(query);
    });
  }, [products, search]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-7xl rounded-3xl border border-primary-100 bg-white/95 p-5 shadow-2xl shadow-primary-100/70 backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Inventory</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="self-start rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 sm:self-auto"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="self-start rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 sm:self-auto"
            >
              My Orders
            </button>
            <button
              onClick={logout}
              className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:self-auto"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="product-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search products
          </label>
          <input
            id="product-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, currency, or description"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-primary-500 transition focus:ring-2"
          />
        </div>

        {loading && <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading products...</p>}

        {error && <p className="mt-6 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md"
                >
                  <Link to={`/products/${product.id}`} className="flex items-start gap-4">
                    <div className={`h-16 w-16 flex-none rounded-xl ${getColorClass(product.id || product.name || "")}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-slate-900">{product.name}</h2>
                        <p className="text-sm font-semibold text-primary-700">
                          {formatCurrency(Number(product.price), product.currency)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">Stock: {product.availableQuantity}</p>
                      <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                No products matched your search.
              </p>
            )}
          </>
        )}

        {!loading && !error && products.length > 0 && (
          <p className="mt-4 text-xs text-slate-500">Showing {filteredProducts.length} of {products.length} products</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">No products found.</p>
        )}
      </section>
    </main>
  );
}
