import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD && typeof window !== 'undefined' && window.location.hostname === 'connectify-fawn.vercel.app'
    ? 'https://connectify-api.vercel.app/api'
    : '/api'
);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── Posts API ────────────────────────────────────────────────
export const postsApi = {
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  create: (data: FormData | object) => api.post('/posts', data),
  getById: (id: string) => api.get(`/posts/${id}`),
  update: (id: string, data: object) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  toggleLike: (id: string, reaction = 'like') => api.post(`/posts/${id}/like`, { reaction_type: reaction }),
  getUserPosts: (userId: string, page = 1) => api.get(`/posts/user/${userId}?page=${page}`),
};

// ── Profiles API ─────────────────────────────────────────────
export const profilesApi = {
  getByUsername: (username: string) => api.get(`/profiles/${username}`),
  update: (data: object) => api.put('/profiles', data),
  search: (q: string) => api.get(`/profiles/search?q=${encodeURIComponent(q)}`),
  getSuggestions: () => api.get('/profiles/suggestions'),
};

// ── Comments API ─────────────────────────────────────────────
export const commentsApi = {
  getByPost: (postId: string, page = 1) => api.get(`/posts/${postId}/comments?page=${page}`),
  create: (postId: string, data: { content: string; parent_id?: string }) =>
    api.post(`/posts/${postId}/comments`, data),
  delete: (postId: string, commentId: string) => api.delete(`/posts/${postId}/comments/${commentId}`),
};

// ── Friendships API ──────────────────────────────────────────
export const friendshipsApi = {
  getAll: (status = 'accepted') => api.get(`/friendships?status=${status}`),
  getPending: () => api.get('/friendships/pending'),
  sendRequest: (receiverId: string) => api.post('/friendships/request', { receiverId }),
  respond: (id: string, status: 'accepted' | 'rejected') =>
    api.put(`/friendships/${id}/respond`, { status }),
  remove: (id: string) => api.delete(`/friendships/${id}`),
};

// ── Notifications API ────────────────────────────────────────
export const notificationsApi = {
  getAll: (type?: string, page = 1) => api.get(`/notifications?${type ? `type=${type}&` : ''}page=${page}`),
  markRead: (ids?: string[]) => api.put('/notifications/read', { ids }),
};

// ── Messages API ─────────────────────────────────────────────
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (partnerId: string, page = 1) => api.get(`/messages/${partnerId}?page=${page}`),
  send: (receiverId: string, content: string) => api.post('/messages', { receiverId, content }),
};

// ── Stories API ──────────────────────────────────────────────
export const storiesApi = {
  getAll: () => api.get('/stories'),
  create: (data: object) => api.post('/stories', data),
  view: (id: string) => api.post(`/stories/${id}/view`),
};

// ── Upload API ───────────────────────────────────────────────
export const uploadApi = {
  upload: (file: File, bucket?: string, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(
      `/upload?bucket=${bucket || 'media'}&folder=${folder || 'uploads'}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  delete: (path: string, bucket?: string) => api.delete('/upload', { data: { path, bucket } }),
};
