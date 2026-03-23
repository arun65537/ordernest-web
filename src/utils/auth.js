const TOKEN_KEY = "token";
const LEGACY_AUTH_KEY = "auth";
const AUTH_META_KEY = "auth_meta";
const REFRESH_TOKEN_COOKIE = "ordernest_refresh_token";
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function extractToken(payload) {
  return payload?.token || payload?.jwt || payload?.accessToken || null;
}

export function getAuth() {
  const token = getToken();
  if (!token) {
    return null;
  }

  return {
    token,
    refreshToken: getRefreshToken(),
    ...getAuthMeta()
  };
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

  const refreshToken = auth?.refreshToken;
  if (typeof refreshToken === "string" && refreshToken.trim()) {
    setRefreshToken(refreshToken.trim());
  }

  localStorage.setItem(
    AUTH_META_KEY,
    JSON.stringify({
      tokenType: auth?.tokenType || "Bearer",
      expiresInSeconds: auth?.expiresInSeconds ?? null,
      roles: Array.isArray(auth?.roles) ? auth.roles : null
    })
  );

  localStorage.removeItem(LEGACY_AUTH_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_AUTH_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_KEY);
  localStorage.removeItem(AUTH_META_KEY);
  clearRefreshToken();
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getRefreshToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = encodeURIComponent(REFRESH_TOKEN_COOKIE) + "=";
  const parts = document.cookie.split(";");

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part.startsWith(encodedName)) {
      const value = part.slice(encodedName.length);
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

export function setRefreshToken(refreshToken) {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${encodeURIComponent(REFRESH_TOKEN_COOKIE)}=${encodeURIComponent(refreshToken)}`,
    "Path=/",
    `Max-Age=${REFRESH_TOKEN_TTL_SECONDS}`,
    "SameSite=Strict",
    secureFlag
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearRefreshToken() {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${encodeURIComponent(REFRESH_TOKEN_COOKIE)}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Strict",
    secureFlag
  ]
    .filter(Boolean)
    .join("; ");
}

export function getAuthMeta() {
  const raw = localStorage.getItem(AUTH_META_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    localStorage.removeItem(AUTH_META_KEY);
    return {};
  }
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

export function getUserId(token = getToken()) {
  const payload = getTokenPayload(token);
  const userId = payload?.userId;

  if (!userId || typeof userId !== "string") {
    return null;
  }

  return userId;
}

export function isAdmin(token = getToken()) {
  return getUserRole(token) === "ADMIN";
}

export function getPostLoginPath(token = getToken()) {
  return isAdmin(token) ? "/admin" : "/products";
}
