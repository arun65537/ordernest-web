import axios from "axios";
import { getToken } from "../utils/auth";
import { refreshAccessToken } from "../utils/tokenRefresh";
import { gatewayBaseUrl } from "./gatewayBaseUrl";

function isAuthEndpoint(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

export default function createApiClient() {
  const client = axios.create({
    baseURL: gatewayBaseUrl,
    withCredentials: true
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;

      if (!originalRequest || status !== 401 || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
        throw error;
      }

      originalRequest._retry = true;

      try {
        const refreshedAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        return client(originalRequest);
      } catch {
        throw error;
      }
    }
  );

  return client;
}
