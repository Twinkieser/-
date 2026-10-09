import {
  Client,
  DashboardStats,
  PageResponse,
  ReportSummary,
  ServiceType,
  Ticket,
  TicketComment,
  TestSuiteResult,
  User,
} from './types';

const TOKEN_KEY = 'clientdesk_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      // ignore
    }

    const message =
      errorData?.message ||
      (errorData?.validationErrors ? Object.values(errorData.validationErrors).join(', ') : null) ||
      `Ошибка сервера (HTTP ${res.status})`;

    const error = new Error(message) as any;
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  // Handle binary / empty
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return (await res.blob()) as unknown as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const api = {
  // Auth
  login: (login: string, password: string) =>
    apiFetch<{ token: string; id: number; login: string; fullName: string; role: 'MANAGER' | 'EXECUTOR' }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ login, password }) }
    ),

  getMe: () => apiFetch<User>('/auth/me'),

  // Users
  getUsers: () => apiFetch<User[]>('/users'),
  getExecutors: () => apiFetch<User[]>('/users/executors'),
  createUser: (data: { login: string; password: string; fullName: string; role: 'MANAGER' | 'EXECUTOR' }) =>
    apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: { fullName?: string; role?: string; active?: boolean; password?: string }) =>
    apiFetch<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleUserStatus: (id: number) => apiFetch<User>(`/users/${id}/toggle-status`, { method: 'PATCH' }),

  // Clients
  getClients: (search?: string) =>
    apiFetch<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getClientById: (id: number) => apiFetch<Client>(`/clients/${id}`),
  getClientTickets: (id: number) => apiFetch<Ticket[]>(`/clients/${id}/tickets`),
  createClient: (data: Partial<Client>) => apiFetch<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: number, data: Partial<Client>) =>
    apiFetch<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Service Types
  getServiceTypes: (activeOnly = false) => apiFetch<ServiceType[]>(`/service-types?activeOnly=${activeOnly}`),
  createServiceType: (data: Partial<ServiceType>) =>
    apiFetch<ServiceType>('/service-types', { method: 'POST', body: JSON.stringify(data) }),
  updateServiceType: (id: number, data: Partial<ServiceType>) =>
    apiFetch<ServiceType>(`/service-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Tickets
  getTickets: (params: {
    search?: string;
    status?: string;
    assigneeId?: number;
    priority?: string;
    overdue?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.assigneeId) query.set('assigneeId', String(params.assigneeId));
    if (params.priority) query.set('priority', params.priority);
    if (params.overdue) query.set('overdue', 'true');
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.dateTo) query.set('dateTo', params.dateTo);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 10));
    return apiFetch<PageResponse<Ticket>>(`/tickets?${query.toString()}`);
  },

  getMyTasks: () => apiFetch<Ticket[]>('/tickets/my'),
  getTicketById: (id: number) => apiFetch<Ticket>(`/tickets/${id}`),
  createTicket: (data: any) => apiFetch<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id: number, data: any) => apiFetch<Ticket>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeTicketStatus: (id: number, data: { targetStatus: string; reason?: string; result?: string }) =>
    apiFetch<Ticket>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  addComment: (id: number, text: string) =>
    apiFetch<TicketComment>(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Reports
  getDashboardStats: () => apiFetch<DashboardStats>('/reports/dashboard'),
  getReportSummary: (fromDate?: string, toDate?: string) => {
    const query = new URLSearchParams();
    if (fromDate) query.set('fromDate', fromDate);
    if (toDate) query.set('toDate', toDate);
    return apiFetch<ReportSummary>(`/reports/summary?${query.toString()}`);
  },
  downloadCsv: async (fromDate?: string, toDate?: string) => {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (fromDate) query.set('fromDate', fromDate);
    if (toDate) query.set('toDate', toDate);

    const res = await fetch(`/api/reports/export-csv?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка скачивания CSV файла');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientdesk_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Logs & Tools
  getRecentLogs: (limit = 100) => apiFetch<string[]>(`/logs/events?limit=${limit}`),
  resetDemoData: () => apiFetch<{ message: string }>('/admin/reset-demo', { method: 'POST' }),
  runAcceptanceTests: () => apiFetch<TestSuiteResult>('/test/run-acceptance', { method: 'POST' }),
};
