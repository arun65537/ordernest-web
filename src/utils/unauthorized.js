import { clearToken } from "./auth";

let redirecting = false;

export function handleUnauthorizedRedirect() {
  clearToken();

  if (redirecting || typeof window === "undefined") {
    return;
  }

  redirecting = true;
  const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = nextPath && nextPath !== "/login"
    ? `/login?redirect=${encodeURIComponent(nextPath)}`
    : "/login";

  window.location.replace(loginUrl);
}
