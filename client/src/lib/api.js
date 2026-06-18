import axios from 'axios';
import mockApi from './mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function buildRealApi() {
  const instance = axios.create({ baseURL: '/api', withCredentials: true });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('netride_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshPromise = null;

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config;

      // Feature 3: On 401, silently rotate the access token via the refresh cookie
      if (err.response?.status === 401 && !original._retry) {
        original._retry = true;

        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', {}, { withCredentials: true })
            .then((r) => {
              localStorage.setItem('netride_token', r.data.token);
              return r.data.token;
            })
            .catch(() => {
              localStorage.removeItem('netride_token');
              window.location.href = '/login';
            })
            .finally(() => { refreshPromise = null; });
        }

        try {
          const newToken = await refreshPromise;
          if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
            return instance(original);
          }
        } catch {
          // fall through to login redirect
        }
      }

      return Promise.reject(err);
    }
  );

  return instance;
}

const api = USE_MOCK ? mockApi : buildRealApi();

export default api;
