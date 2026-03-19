import axios from "axios";
import { getToken } from "../utils/auth";

const fallbackGatewayBaseUrl = "https://ordernest-api-gateway.onrender.com";
const gatewayBaseUrl = (import.meta.env.VITE_API_GATEWAY_BASE_URL || fallbackGatewayBaseUrl).replace(/\/+$/, "");

const inventoryApi = axios.create({
  baseURL: gatewayBaseUrl
});

inventoryApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default inventoryApi;
