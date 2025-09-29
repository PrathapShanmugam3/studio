
import type { ApiResponse } from '@/lib/types';

const API_BASE_URL = 'https://thirumalaimaligai.onrender.com/product';
const API_TIMEOUT = 10000; // 10 seconds

export class ApiServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorText = await response.text();
    // Try to parse error as JSON, but fall back to text
    let errorMessage = `HTTP error! status: ${response.status}, message: ${errorText}`;
    try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.errorDescription || errorMessage;
    } catch (e) {
        // Not a JSON error, use the text
    }
    console.error('API Error:', errorMessage);
    throw new ApiServiceError(errorMessage, response.status);
  }

  const data: ApiResponse<T> = await response.json();

  if (data.statusCode !== 0) {
    const errorMessage = data.message || data.errorDescription || `API returned error status: ${data.statusCode}`;
    console.error('API Error:', data);
    throw new ApiServiceError(errorMessage, response.status);
  }
  
  return data;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiServiceError('Request timed out', 408);
    }
    // Re-throw other errors
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const ApiService = {
  get: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { method: 'GET' });
  },
  post: <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    return request<T>(`/api${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  put: <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    return request<T>(`/update/${body.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>(`/delete/${endpoint}`, { method: 'DELETE' });
  },
  postCustom: <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { // This method does not prefix with /api
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
};
