import authApi from "../api/authApi";
import { clearToken, getToken } from "./auth";

export async function logoutSession() {
  const accessToken = getToken();

  try {
    await authApi.post("/api/auth/logout", {
      accessToken: accessToken || null
    });
  } catch {
    // Always clear local session even if server-side logout fails.
  } finally {
    clearToken();
  }
}
