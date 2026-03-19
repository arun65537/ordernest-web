import axios from "axios";
import { getToken } from "../utils/auth";

const fallbackShipmentBaseUrl = "https://ordernest-order-service.onrender.com";
const shipmentBaseUrl = (import.meta.env.VITE_SHIPMENT_API_BASE_URL || fallbackShipmentBaseUrl).replace(/\/+$/, "");

const shipmentApi = axios.create({
  baseURL: shipmentBaseUrl
});

shipmentApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default shipmentApi;
