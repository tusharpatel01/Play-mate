import api from "./axios";

// ─── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register:       (data)    => api.post("/auth/register", data),
  login:          (data)    => api.post("/auth/login", data),
  logout:         ()        => api.post("/auth/logout"),
  me:             ()        => api.get("/auth/me"),
  verifyEmail:    (token)   => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email)   => api.post("/auth/forgot-password", { email }),
  resetPassword:  (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

// ─── Users ────────────────────────────────────────────────
export const userAPI = {
  getProfile:     (id)    => api.get(`/users/${id}`),
  updateProfile:  (data)  => api.put("/users/profile", data),
  updateAvatar:   (form)  => api.put("/users/avatar", form, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (data)  => api.put("/users/change-password", data),
  getNearby:      (params)=> api.get("/users/nearby", { params }),
};

// ─── Matches ─────────────────────────────────────────────
export const matchAPI = {
  getAll:    (params) => api.get("/matches", { params }),
  getById:   (id)     => api.get(`/matches/${id}`),
  create:    (data)   => api.post("/matches", data),
  update:    (id, d)  => api.put(`/matches/${id}`, d),
  delete:    (id)     => api.delete(`/matches/${id}`),
  getMy:     ()       => api.get("/matches/my"),
  getJoined: ()       => api.get("/matches/joined"),
};

// ─── Join Requests ────────────────────────────────────────
export const joinAPI = {
  send:        (data)               => api.post("/join-requests", data),
  getMy:       ()                   => api.get("/join-requests/my"),
  getForMatch: (matchId)            => api.get(`/join-requests/match/${matchId}`),
  accept:      (id)                 => api.put(`/join-requests/${id}/accept`),
  reject:      (id)                 => api.put(`/join-requests/${id}/reject`),
  cancel:      (id)                 => api.put(`/join-requests/${id}/cancel`),
  removePlayer:(matchId, userId)    => api.delete(`/join-requests/match/${matchId}/player/${userId}`),
};

// ─── Chats ────────────────────────────────────────────────
export const chatAPI = {
  getAll:      ()                   => api.get("/chats"),
  getMessages: (chatId, page = 1)   => api.get(`/chats/${chatId}/messages`, { params: { page } }),
  getDirect:   (userId)             => api.post("/chats/direct", { userId }),
  deleteMsg:   (chatId, messageId)  => api.delete(`/chats/${chatId}/messages/${messageId}`),
};

// ─── Notifications ────────────────────────────────────────
export const notifAPI = {
  getAll:       ()   => api.get("/notifications"),
  getUnread:    ()   => api.get("/notifications/unread-count"),
  markAllRead:  ()   => api.put("/notifications/read-all"),
  markOneRead:  (id) => api.put(`/notifications/${id}/read`),
};

// ─── Reviews ─────────────────────────────────────────────
export const reviewAPI = {
  create:     (data)   => api.post("/reviews", data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
  report:     (data)   => api.post("/reviews/report", data),
};

// ─── Admin ────────────────────────────────────────────────
export const adminAPI = {
  getStats:       ()            => api.get("/admin/stats"),
  getUsers:       (params)      => api.get("/admin/users", { params }),
  banUser:        (id, reason)  => api.put(`/admin/users/${id}/ban`, { reason }),
  unbanUser:      (id)          => api.put(`/admin/users/${id}/unban`),
  getReports:     ()            => api.get("/admin/reports"),
  resolveReport:  (id, status)  => api.put(`/admin/reports/${id}`, { status }),
};
