import axios from "axios";
import { getToken } from "./helper";
import { getGuestSession, refreshGuestToken } from "./guest-session";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
});

// Request interceptor to add the Firebase token, or a guest token for guest sessions
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Not signed in: use the guest session if there is one. The stored group code is never
      // sent here; it is only exchanged for a token (see refreshGuestToken).
      const guestSession = getGuestSession();
      if (guestSession) {
        const guestToken = guestSession.guestToken ?? (await refreshGuestToken());
        if (guestToken) {
          config.headers["X-Guest-Token"] = guestToken;
        }
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

// Response interceptor: an expired guest token is refreshed once and the request retried
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isGuestRequest = !!original?.headers?.["X-Guest-Token"];

    if (error.response?.status === 401 && isGuestRequest && !original._guestRetried) {
      original._guestRetried = true;
      const guestToken = await refreshGuestToken();
      if (guestToken) {
        original.headers["X-Guest-Token"] = guestToken;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
