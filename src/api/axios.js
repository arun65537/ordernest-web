import axios from "axios";
import { getToken } from "../utils/auth";

const fallbackApiBaseUrl = "https://sso-service.onrender.com";
const apiBaseUrl = (
  import.meta.env.VITE_SSO_API_BASE_URL ||
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  fallbackApiBaseUrl
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

