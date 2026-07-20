import { api } from '@/lib/api';
import type {
  User,
  Patient,
  Appointment,
  Dentist,
  KanbanColumn,
  PaginatedResponse,
  DashboardStats,
  DashboardCharts,
  ActivityLog,
  Notification,
  ClinicSettings,
} from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
};

export const patientsApi = {
  kanban: () => api.get<KanbanColumn[]>('/patients/kanban'),
  list: (params?: Record<string, string | number>) => {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return api.get<PaginatedResponse<Patient>>(`/patients${query}`);
  },
  get: (id: string) => api.get<Patient>(`/patients/${id}`),
  create: (data: Partial<Patient>) => api.post<Patient>('/patients', data),
  update: (id: string, data: Partial<Patient>) =>
    api.patch<Patient>(`/patients/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch<Patient>(`/patients/${id}/status`, { status }),
  timeline: (id: string) => api.get<ActivityLog[]>(`/patients/${id}/timeline`),
  addNote: (id: string, content: string) =>
    api.post(`/patients/${id}/notes`, { content }),
  exportCsv: async (params?: Record<string, string>) => {
    const query = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/patients/export${query}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    return res.text();
  },
};

export const appointmentsApi = {
  list: (params?: Record<string, string>) => {
    const query = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return api.get<PaginatedResponse<Appointment>>(`/appointments${query}`);
  },
  today: () => api.get<Appointment[]>('/appointments/today'),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post<Appointment>('/appointments', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<Appointment>(`/appointments/${id}`, data),
  complete: (id: string) => api.post(`/appointments/${id}/complete`),
  availableSlots: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<string[]>(`/appointments/available-slots?${query}`);
  },
};

export const dentistsApi = {
  list: () => api.get<Dentist[]>('/dentists'),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
  charts: () => api.get<DashboardCharts>('/dashboard/charts'),
};

export const activityApi = {
  feed: (limit = 50) => api.get<ActivityLog[]>(`/activity?limit=${limit}`),
};

export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  unreadCount: () => api.get<number>('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const searchApi = {
  global: (q: string) =>
    api.get<{
      patients: Patient[];
      appointments: Appointment[];
      dentists: Dentist[];
    }>(`/search?q=${encodeURIComponent(q)}`),
};

export const settingsApi = {
  get: () => api.get<ClinicSettings>('/settings'),
  update: (data: Partial<ClinicSettings>) => api.patch('/settings', data),
};

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (data: Record<string, unknown>) => api.post('/users', data),
};
