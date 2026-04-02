import axios from "axios";
import { gatewayBaseUrl } from "../api/gatewayBaseUrl";
import { clearToken, setAuth } from "./auth";
import { handleUnauthorizedRedirect } from "./unauthorized";

let refreshPromise = null;

function extractAccessToken(payload) {
  return payload?.accessToken || payload?.token || payload?.jwt || null;
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post(
      `${gatewayBaseUrl}/api/auth/refresh`,
      {},
      {
        withCredentials: true
      }
    )
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
        handleUnauthorizedRedirect();
      } else {
        clearToken();
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
