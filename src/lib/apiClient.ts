import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API request wrapper with improved error handling and typing
export async function apiRequest<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(opts.headers as any || {}),
  };
  
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const method = (opts.method || 'GET').toUpperCase();
  
  // Cache handling for GET requests
  if (method === 'GET' && path !== '/system-info') {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    headers['Pragma'] = 'no-cache';
    
    const cacheKey = `${method}:${API_BASE}${path}`;
    const cachedData = getCachedData<ApiResponse<T>>(cacheKey);
    if (cachedData) {
      console.log('📦 Using cached data for:', path);
      return cachedData;
    }
  }

  // Check session expiry
  if (token && isTokenExpired()) {
    clearAuthData();
    window.location.href = '/auth/login';
    throw new ApiError(401, 'Session expired');
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const contentType = response.headers.get('content-type');
    
    // Parse response based on content type
    let data;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Handle non-200 responses
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.detail || data?.message || response.statusText,
        data
      );
    }

    // Cache successful GET responses
    if (method === 'GET' && path !== '/system-info') {
      const ttl = path.includes('/stats') ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM;
      setCachedData(`${method}:${API_BASE}${path}`, { data }, ttl);
    }

    return { data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error
    );
  }
}