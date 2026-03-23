import { useState } from "react";
import { useNavigate } from "react-router-dom";
import inventoryApi from "../api/inventoryAxios";
import orderApi from "../api/orderAxios";
import shipmentApi from "../api/shipmentAxios";
import { clearToken } from "../utils/auth";
import { formatCurrency } from "../utils/formatters";
import { logoutSession } from "../utils/session";

const SHIPMENT_STATUS_OPTIONS = ["CREATED", "SHIPPED", "DELIVERED", "RETURNED"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [productId, setProductId] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [shipmentUpdating, setShipmentUpdating] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [productError, setProductError] = useState("");
  const [productStockError, setProductStockError] = useState("");
  const [productStockSuccess, setProductStockSuccess] = useState("");
  const [shipmentError, setShipmentError] = useState("");
  const [shipmentSuccess, setShipmentSuccess] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [productResult, setProductResult] = useState(null);
  const [stockUpdateValue, setStockUpdateValue] = useState("");
  const [stockUpdating, setStockUpdating] = useState(false);
  const [selectedShipmentStatus, setSelectedShipmentStatus] = useState("CREATED");

  const logout = async () => {
    await logoutSession();
    navigate("/", { replace: true });
  };

  const handleUnauthorized = () => {
    clearToken();
    navigate("/admin/login", { replace: true });
  };

  const fetchOrderById = async (event) => {
    event.preventDefault();
    setOrderError("");
    setOrderResult(null);
    setShipmentError("");
    setShipmentSuccess("");

    const trimmed = orderId.trim();
    if (!trimmed) {
      setOrderError("Order ID is required.");
      return;
    }

    setOrderLoading(true);
    try {
      const { data } = await orderApi.get(`/api/orders/${trimmed}`);
      setOrderResult(data || null);
      const responseShipmentStatus = data?.shipmentStatus;
      if (SHIPMENT_STATUS_OPTIONS.includes(responseShipmentStatus)) {
        setSelectedShipmentStatus(responseShipmentStatus);
      } else {
        setSelectedShipmentStatus("CREATED");
      }
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorized();
        return;
      }
      setOrderError(err?.response?.data?.message || "Unable to fetch order.");
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchProductById = async (event) => {
    event.preventDefault();
    setProductError("");
    setProductStockError("");
    setProductStockSuccess("");
    setProductResult(null);

    const trimmed = productId.trim();
    if (!trimmed) {
      setProductError("Product ID is required.");
      return;
    }

    setProductLoading(true);
    try {
      const { data } = await inventoryApi.get(`/api/products/${trimmed}`);
      setProductResult(data || null);
      setStockUpdateValue(
        data?.availableQuantity == null ? "" : String(data.availableQuantity)
      );
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorized();
        return;
      }
      setProductError(err?.response?.data?.message || "Unable to fetch product.");
    } finally {
      setProductLoading(false);
    }
  };

  const updateProductStock = async () => {
    setProductStockError("");
    setProductStockSuccess("");

    const currentProductId = productResult?.id;
    if (!currentProductId) {
      setProductStockError("Fetch a product before updating stock.");
      return;
    }

    const parsedQuantity = Number.parseInt(stockUpdateValue, 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setProductStockError("Stock must be a whole number greater than or equal to 0.");
      return;
    }

    setStockUpdating(true);
    try {
      const { data } = await inventoryApi.patch(`/api/products/${currentProductId}/stock`, {
        availableQuantity: parsedQuantity
      });
      setProductResult(data || null);
      setStockUpdateValue(
        data?.availableQuantity == null ? String(parsedQuantity) : String(data.availableQuantity)
      );
      setProductStockSuccess(`Stock updated to ${data?.availableQuantity ?? parsedQuantity}.`);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorized();
        return;
      }
      setProductStockError(err?.response?.data?.message || "Unable to update product stock.");
    } finally {
      setStockUpdating(false);
    }
  };

  const updateShipmentStatus = async () => {
    setShipmentError("");
    setShipmentSuccess("");

    const currentOrderId = orderResult?.orderId;
    if (!currentOrderId) {
      setShipmentError("Fetch an order before updating shipment status.");
      return;
    }

    setShipmentUpdating(true);
    try {
      await shipmentApi.post("/api/shipments/status", {
        orderId: currentOrderId,
        shipmentStatus: selectedShipmentStatus
      });

      const { data } = await orderApi.get(`/api/orders/${currentOrderId}`);
      setOrderResult(data || null);
      setShipmentSuccess(`Shipment status updated to ${selectedShipmentStatus}.`);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleUnauthorized();
        return;
      }
      setShipmentError(err?.response?.data?.message || "Unable to update shipment status.");
    } finally {
      setShipmentUpdating(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-primary-100 bg-white p-6 shadow-xl shadow-primary-100/60 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">OrderNest Console</p>
            <h1 className="mt-2 text-3xl font-bold text-primary-700">Admin Dashboard</h1>
          </div>
          <button
            onClick={logout}
            className="self-start rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800 sm:self-auto"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fetch Order By ID</h2>
            <form onSubmit={fetchOrderById} className="mt-4 space-y-3">
              <input
                type="text"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Enter order ID"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-primary-500 transition focus:ring-2"
              />
              <button
                type="submit"
                disabled={orderLoading}
                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {orderLoading ? "Fetching..." : "Fetch Order"}
              </button>
            </form>
            {orderError && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{orderError}</p>}
            {orderResult && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p><span className="font-semibold">Order ID:</span> {orderResult.orderId}</p>
                <p className="mt-1"><span className="font-semibold">Status:</span> {orderResult.status || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Payment:</span> {orderResult.paymentStatus || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Shipment:</span> {orderResult.shipmentStatus || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Product:</span> {orderResult.item?.productName || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Product ID:</span> {orderResult.item?.productId || "-"}</p>
                <p className="mt-1"><span className="font-semibold">Quantity:</span> {orderResult.item?.quantity ?? "-"}</p>
                <p className="mt-1">
                  <span className="font-semibold">Total:</span>{" "}
                  {orderResult.item?.totalAmount != null
                    ? formatCurrency(Number(orderResult.item.totalAmount), orderResult.item?.currency)
                    : "-"}
                </p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Update Shipment Status
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedShipmentStatus}
                      onChange={(event) => setSelectedShipmentStatus(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-primary-500 transition focus:ring-2 sm:w-auto"
                    >
                      {SHIPMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={updateShipmentStatus}
                      disabled={shipmentUpdating}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {shipmentUpdating ? "Updating..." : "Update"}
                    </button>
                  </div>
                  {shipmentError && (
                    <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{shipmentError}</p>
                  )}
                  {shipmentSuccess && (
                    <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{shipmentSuccess}</p>
                  )}
                </div>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fetch Product By ID</h2>
            <form onSubmit={fetchProductById} className="mt-4 space-y-3">
              <input
                type="text"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                placeholder="Enter product ID"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-primary-500 transition focus:ring-2"
              />
              <button
                type="submit"
                disabled={productLoading}
                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {productLoading ? "Fetching..." : "Fetch Product"}
              </button>
            </form>
            {productError && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{productError}</p>}
            {productResult && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p><span className="font-semibold">Product ID:</span> {productResult.id}</p>
                <p className="mt-1"><span className="font-semibold">Name:</span> {productResult.name || "-"}</p>
                <p className="mt-1">
                  <span className="font-semibold">Price:</span>{" "}
                  {formatCurrency(Number(productResult.price), productResult.currency)}
                </p>
                <p className="mt-1"><span className="font-semibold">Stock:</span> {productResult.availableQuantity ?? "-"}</p>
                <p className="mt-1"><span className="font-semibold">Description:</span> {productResult.description || "-"}</p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Update Product Stock
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={stockUpdateValue}
                      onChange={(event) => setStockUpdateValue(event.target.value)}
                      placeholder="Enter new stock"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-primary-500 transition focus:ring-2 sm:w-auto"
                    />
                    <button
                      type="button"
                      onClick={updateProductStock}
                      disabled={stockUpdating}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {stockUpdating ? "Updating..." : "Update Stock"}
                    </button>
                  </div>
                  {productStockError && (
                    <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{productStockError}</p>
                  )}
                  {productStockSuccess && (
                    <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{productStockSuccess}</p>
                  )}
                </div>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
