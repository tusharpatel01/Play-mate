import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMatches = createAsyncThunk("matches/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const res = await api.get("/matches", { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMatchById = createAsyncThunk("matches/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/matches/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createMatch = createAsyncThunk("matches/create", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/matches", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyMatches = createAsyncThunk("matches/fetchMy", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/matches/my");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchJoinedMatches = createAsyncThunk("matches/fetchJoined", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/matches/joined");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const sendJoinRequest = createAsyncThunk("matches/sendJoinRequest", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/join-requests", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const matchSlice = createSlice({
  name: "matches",
  initialState: {
    list: [],
    currentMatch: null,
    myMatches: [],
    joinedMatches: [],
    pagination: null,
    loading: false,
    error: null,
    filters: { sport: "all", radius: 10, sort: "distance" },
  },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearCurrentMatch: (state) => { state.currentMatch = null; },
    updateMatchInList: (state, action) => {
      const idx = state.list.findIndex((m) => m._id === action.payload._id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMatches.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMatchById.pending, (state) => { state.loading = true; })
      .addCase(fetchMatchById.fulfilled, (state, action) => { state.loading = false; state.currentMatch = action.payload; })
      .addCase(fetchMatchById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createMatch.fulfilled, (state, action) => { state.myMatches.unshift(action.payload); })
      .addCase(fetchMyMatches.fulfilled, (state, action) => { state.myMatches = action.payload; })
      .addCase(fetchJoinedMatches.fulfilled, (state, action) => { state.joinedMatches = action.payload; });
  },
});

export const { setFilters, clearCurrentMatch, updateMatchInList } = matchSlice.actions;
export default matchSlice.reducer;

export const selectMatches = (s) => s.matches.list;
export const selectCurrentMatch = (s) => s.matches.currentMatch;
export const selectMatchLoading = (s) => s.matches.loading;
export const selectFilters = (s) => s.matches.filters;
export const selectMyMatches = (s) => s.matches.myMatches;
