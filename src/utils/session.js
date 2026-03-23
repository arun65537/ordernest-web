import authApi from "../api/authApi";
import { clearToken, getRefreshToken, getToken } from "./auth";

export async function logoutSession() {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();

  try {
    if (accessToken || refreshToken) {
      await authApi.post(
        "/api/auth/logout",
        {
          refreshToken: refreshToken || "",
          accessToken: accessToken || ""
        },
        accessToken
          ? {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          : undefined
      );
    }
  } catch {
    // Always clear local session even if server-side logout fails.
  } finally {
    clearToken();
  }
}
