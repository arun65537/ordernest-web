import axios from "axios";
import { getToken } from "../utils/auth";
import { refreshAccessToken } from "../utils/tokenRefresh";
import { gatewayBaseUrl } from "./gatewayBaseUrl";
import { handleUnauthorizedRedirect } from "../utils/unauthorized";

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

function parseTokenExpiry(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const payload = JSON.parse(atob(normalized + padding));
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isExpiredOrNearExpiry(token, skewSeconds = 30) {
  const exp = parseTokenExpiry(token);
  if (!exp) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

export default function createApiClient() {
  const client = axios.create({
    baseURL: gatewayBaseUrl,
    withCredentials: true
  });

  client.interceptors.request.use(async (config) => {
    const url = config?.url || "";
    if (isAuthEndpoint(url)) {
      return config;
    }

    let token = getToken();
    if (token && isExpiredOrNearExpiry(token)) {
      try {
        token = await refreshAccessToken();
      } catch {
        handleUnauthorizedRedirect();
        throw new axios.Cancel("Session refresh failed before request.");
      }
    }

    if (token) {
      config.headers = config.headers || {};
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
        if (status === 401 || status === 403) {
          handleUnauthorizedRedirect();
        }
        throw error;
      }

      originalRequest._retry = true;

      try {
        const refreshedAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        return client(originalRequest);
      } catch {
        handleUnauthorizedRedirect();
        throw error;
      }
    }
  );

  return client;
}
