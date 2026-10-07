const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('pm_auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('pm_auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('pm_auth_token');
  localStorage.removeItem('pm_user');
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Clear expired session and dispatch event for AuthContext
      clearAuthToken();
      window.dispatchEvent(new CustomEvent('pm:unauthorized'));
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errors?.[0]?.message ||
        `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, data);
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors / offline
    throw new ApiError(
      'Unable to connect to server. Please check your network connection.',
      0
    );
  }
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),

  // Projects
  getProjects: (params?: { search?: string; status?: string; sortBy?: string; sortOrder?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString();
    return apiRequest(`/projects${qs ? `?${qs}` : ''}`);
  },
  getProjectById: (id: string) => apiRequest(`/projects/${id}`),
  createProject: (body: any) =>
    apiRequest('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id: string, body: any) =>
    apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id: string) =>
    apiRequest(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: { projectId?: string; search?: string; status?: string; priority?: string; sortBy?: string; sortOrder?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('projectId', params.projectId);
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.priority && params.priority !== 'ALL') query.append('priority', params.priority);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString();
    return apiRequest(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getTaskById: (id: string) => apiRequest(`/tasks/${id}`),
  createTask: (body: any) =>
    apiRequest('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, body: any) =>
    apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id: string) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => apiRequest('/dashboard'),

  // Activities
  getActivities: () => apiRequest('/activities'),
};
