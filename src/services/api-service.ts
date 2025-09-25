import type { ApiResponse } from '@/lib/types';

const API_BASE_URL = 'https://thirumalaimaligai.onrender.com/product/api';

export class ApiServiceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data: ApiResponse<T> = await response.json();

  if (!response.ok || data.statusCode !== 0) {
    const errorMessage = data.message || data.errorDescription || `HTTP error! status: ${response.status}`;
    console.error('API Error:', data);
    throw new ApiServiceError(errorMessage, response.status);
  }
  
  return data;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return handleResponse<T>(response);
}

export const ApiService = {
  get: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'GET' });
  },
  post: <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  put: <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};
