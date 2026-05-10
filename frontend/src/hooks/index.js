import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../features/auth/authSlice";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import {
  fetchUnreadCount,
  fetchNotifications,
} from "../features/notifications/notificationSlice";
import { initSocket, disconnectSocket } from "../socket/socket";

// ─── useAuth ──────────────────────────────────────────────
export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector((s) => s.auth.loading);
  const initialized = useSelector((s) => s.auth.initialized);

  // Bootstrap auth state on app mount
  useEffect(() => {
    if (!initialized) dispatch(fetchMe());
  }, [dispatch, initialized]);

  // Once authenticated, fetch unread notifications + full list
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  return { user, isAuthenticated, loading, initialized };
};

// ─── useSocket ────────────────────────────────────────────
export const useSocket = () => {
  const accessToken = useSelector((s) => s.auth.accessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initSocket(accessToken);
    }
    return () => {
      if (!isAuthenticated) disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);
};

// ─── useGeolocation ───────────────────────────────────────
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  return { location, error, loading, getLocation };
};

// ─── useDebounce ──────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─── useOutsideClick ──────────────────────────────────────
export const useOutsideClick = (callback) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callback();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);
  return ref;
};

// ─── useLocalStorage ──────────────────────────────────────
export const useLocalStorage = (key, initial) => {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  const set = useCallback((v) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [value, set];
};
