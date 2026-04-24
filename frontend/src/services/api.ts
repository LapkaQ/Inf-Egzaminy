/// <reference types="vite/client" />
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

export const api = {
  get: (url: string) => request(url, { method: 'GET' }),

  post: (url: string, data: unknown) =>
    request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  patch: (url: string, data: unknown) =>
    request(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  put: (url: string, data: unknown) =>
    request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (url: string) => request(url, { method: 'DELETE' }),

  postForm: (url: string, data: URLSearchParams) =>
    request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    }),
};

async function request(endpoint: string, options: RequestInit) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers as HeadersInit);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 204) return null; // No Content

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Wystąpił błąd podczas żądania.');
  }

  return response.json();
}
