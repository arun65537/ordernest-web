const fallbackGatewayBaseUrl = "https://ordernest-api-gateway.onrender.com";

export const gatewayBaseUrl = (
  import.meta.env.VITE_API_GATEWAY_BASE_URL || fallbackGatewayBaseUrl
).replace(/\/+$/, "");

