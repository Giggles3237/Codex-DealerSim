import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
});

export const safeGet = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

export const safePost = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

export const safePut = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};
