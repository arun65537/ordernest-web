import axios from "axios";
import { gatewayBaseUrl } from "../api/gatewayBaseUrl";
import { clearToken, getRefreshToken, setAuth } from "./auth";

let refreshPromise = null;

function extractAccessToken(payload) {
  return payload?.accessToken || payload?.token || payload?.jwt || null;
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearToken();
    throw new Error("No refresh token available.");
  }

  refreshPromise = axios
    .post(`${gatewayBaseUrl}/api/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      const accessToken = extractAccessToken(data);
      if (!accessToken) {
        throw new Error("Missing access token in refresh response.");
      }

      setAuth(data);
      return accessToken;
    })
    .catch((error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 400) {
        clearToken();
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

