import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import {
  fetchMatches,
  selectMatches,
  selectMatchLoading,
  selectFilters,
} from "../features/matches/matchSlice";
import { fetchChats, selectChats } from "../features/chat/chatSlice";
import { useGeolocation } from "./index";

// ─── useMatches: fetch matches based on filters + location ──
export const useMatches = (extraParams = {}) => {
  const dispatch = useDispatch();
  const matches  = useSelector(selectMatches);
  const loading  = useSelector(selectMatchLoading);
  const filters  = useSelector(selectFilters);
  const { location } = useGeolocation();

  const refresh = useCallback(() => {
    const params = { status: "open", ...filters, ...extraParams };
    if (location) {
      params.lat = location.lat;
      params.lng = location.lng;
    }
    dispatch(fetchMatches(params));
  }, [dispatch, filters, location, JSON.stringify(extraParams)]);

  useEffect(() => { refresh(); }, [refresh]);
  return { matches, loading, refresh };
};

// ─── useChats: load chats sorted by last activity ─────────
export const useChats = () => {
  const dispatch = useDispatch();
  const chats    = useSelector(selectChats);
  useEffect(() => { dispatch(fetchChats()); }, [dispatch]);
  return [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.createdAt;
    const bTime = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bTime) - new Date(aTime);
  });
};

// ─── useJoinRequests: organiser's pending requests ────────
export const useJoinRequests = (matchId) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/join-requests/match/${matchId}`);
      setRequests(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);
  const remove = (id) => setRequests((prev) => prev.filter((r) => r._id !== id));
  return { requests, loading, reload: load, remove };
};
