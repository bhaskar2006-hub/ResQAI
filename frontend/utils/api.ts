const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiRequest<T = Record<string, unknown>>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = { ...options, headers };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    config.body = options.body;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, config);

  if (response.status === 204) return {} as T;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Request failed with status ${response.status}`);
  return data;
}

export const api = {
  get: <T = Record<string, unknown>>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = Record<string, unknown>>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T = Record<string, unknown>>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T = Record<string, unknown>>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
