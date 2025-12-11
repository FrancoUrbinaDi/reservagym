import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from
  './authStorage';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as any;
    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refresh_token: refreshToken },
          );
          setTokens(data.access_token, data.refresh_token);
        })();
        await refreshPromise;
        isRefreshing = false;
      } else if (refreshPromise) {
        await refreshPromise;
      }
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return api(originalRequest);
    } catch (e) {
      clearTokens();
      isRefreshing = false;
      refreshPromise = null;
      return Promise.reject(e);
    }
  },
);