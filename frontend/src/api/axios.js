import axios from "axios";

// ─── Module-level state (set by main.jsx after store is created) ──
// This breaks the circular dependency: store -> authSlice -> axios.
// Instead of importing { store } directly, the store injects itself.
let _store = null;
let _logoutAction = null;
let _setAccessTokenAction = null;

export const injectStore = (store, { logout, setAccessToken }) => {
  _store = store;
  _logoutAction = logout;
  _setAccessTokenAction = setAccessToken;
};

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});

// ─── Attach access token from store to every request ─────
api.interceptors.request.use((config) => {
  if (_store) {
    const token = _store.getState().auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Refresh access token automatically on 401 ───────────
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Don't try to refresh on the refresh endpoint itself
    if (original?.url?.includes("/auth/refresh")) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry && _store) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        _store.dispatch(_setAccessTokenAction(newToken));
        queue.forEach((p) => p.resolve(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        _store.dispatch(_logoutAction());
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
