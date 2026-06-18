import { create } from 'zustand';
import api from './api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('netride_token'),
  loading: true,

  setAuth: (token, user) => {
    localStorage.setItem('netride_token', token);
    set({ token, user, loading: false });
  },

  logout: () => {
    localStorage.removeItem('netride_token');
    set({ token: null, user: null, loading: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('netride_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      localStorage.removeItem('netride_token');
      set({ token: null, user: null, loading: false });
    }
  },
}));
