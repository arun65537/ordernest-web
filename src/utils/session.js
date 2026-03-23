import api from "../api/axios";
import { clearToken, getRefreshToken, getToken } from "./auth";

export async function logoutSession() {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();

  try {
    if (accessToken || refreshToken) {
      await api.post("/api/auth/logout", {
        refreshToken: refreshToken || "",
        accessToken: accessToken || ""
      });
    }
  } catch {
    // Always clear local session even if server-side logout fails.
  } finally {
    clearToken();
  }
}

