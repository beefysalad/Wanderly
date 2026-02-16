import axios from "axios";
import { getToken } from "./helper";
import { getGuestSession } from "./guest-session";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
});

// Request interceptor to add auth token or guest code
api.interceptors.request.use(
  async (config) => {
   
    const isGatewayEnabled =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_GATEWAY === "true";

    if (isGatewayEnabled && config.url && !config.url.startsWith("/v1/gateway")) {
      const originalUrl = config.url.startsWith("/")
        ? config.url
        : `/${config.url}`;
      const apiPath = originalUrl.startsWith("/api")
        ? originalUrl
        : `/api${originalUrl}`;

      config.headers["X-Api-Target"] = apiPath;
      config.url = "/wanderly-api";
    }

    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // No token available, which is fine for public routes or guest access
      // Check for guest session instead
      const guestSession = getGuestSession();
      if (guestSession) {
        config.headers["X-Guest-Code"] = guestSession.groupCode;
      }
      // If neither token nor guest session, continue without auth headers
      // This allows public routes like /api/groups/validate-code to work
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
    }
    return Promise.reject(error);
  },
);

export default api;
