const TOKEN_KEY = "token";
const LEGACY_AUTH_KEY = "auth";

function extractToken(payload) {
  return payload?.token || payload?.jwt || payload?.accessToken || null;
}

export function getAuth() {
  const token = getToken();
  return token ? { token } : null;
}

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return token;
  }

  // Backward compatibility: migrate legacy auth object to a single token key.
  const legacyRaw = localStorage.getItem(LEGACY_AUTH_KEY);
  if (!legacyRaw) {
    return null;
  }

  try {
    const legacyAuth = JSON.parse(legacyRaw);
    const legacyToken = extractToken(legacyAuth);
    if (legacyToken) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }
    localStorage.removeItem(LEGACY_AUTH_KEY);
    return legacyToken;
  } catch {
    localStorage.removeItem(LEGACY_AUTH_KEY);
    return null;
  }
}

export function setAuth(auth) {
  const token = extractToken(auth);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  localStorage.removeItem(LEGACY_AUTH_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_AUTH_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

export function getTokenPayload(token = getToken()) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

export function getUserRole(token = getToken()) {
  const payload = getTokenPayload(token);
  const role = payload?.role;

  if (!role || typeof role !== "string") {
    return null;
  }

  const normalized = role.trim().toUpperCase();
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

export function isAdmin(token = getToken()) {
  return getUserRole(token) === "ADMIN";
}

export function getPostLoginPath(token = getToken()) {
  return isAdmin(token) ? "/admin" : "/products";
}
