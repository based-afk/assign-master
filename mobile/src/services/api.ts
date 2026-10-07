import { Platform } from 'react-native';
import { StorageService } from './storage';

const DEFAULT_HOST = 'https://assign-master.onrender.com/api';

let customApiUrl: string | null = null;

export const setCustomApiUrl = (url: string | null) => {
  customApiUrl = url;
};

export const getApiBaseUrl = (): string => {
  return customApiUrl || DEFAULT_HOST;
};

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

type UnauthorizedListener = (message: string) => void;
const unauthorizedListeners: UnauthorizedListener[] = [];

export const onUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx !== -1) unauthorizedListeners.splice(idx, 1);
  };
};

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await StorageService.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      await StorageService.clear();
      unauthorizedListeners.forEach((fn) =>
        fn('Your session has expired. Please log in again.')
      );
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
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Unable to connect to server. Please ensure backend is running.',
      0
    );
  }
}

export const mobileApi = {
  // Auth
  register: (body: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Projects
  getProjects: (params?: { search?: string; status?: string; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    const qs = query.toString();
    return request(`/projects${qs ? `?${qs}` : ''}`);
  },
  createProject: (body: any) =>
    request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id: string, body: any) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: { projectId?: string; search?: string; status?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('projectId', params.projectId);
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.priority && params.priority !== 'ALL') query.append('priority', params.priority);
    const qs = query.toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (body: any) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, body: any) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id: string) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
};
