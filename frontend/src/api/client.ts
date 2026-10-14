const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<any>('/auth/me'),
    updateSettings: (body: any) => request<any>('/auth/settings', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Scheduling
  scheduling: {
    simulate: (body: any) => request<any>('/scheduling/simulate', { method: 'POST', body: JSON.stringify(body) }),
    compare: (body: any) => request<any>('/scheduling/compare', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Memory
  memory: {
    simulate: (body: any) => request<any>('/memory/simulate', { method: 'POST', body: JSON.stringify(body) }),
    compare: (body: any) => request<any>('/memory/compare', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Paging
  paging: {
    simulate: (body: any) => request<any>('/paging/simulate', { method: 'POST', body: JSON.stringify(body) }),
    compare: (body: any) => request<any>('/paging/compare', { method: 'POST', body: JSON.stringify(body) }),
    belady: (body?: any) => request<any>('/paging/belady', { method: 'POST', body: JSON.stringify(body || {}) }),
  },

  // Deadlock
  deadlock: {
    validate: (body: any) => request<any>('/deadlock/validate', { method: 'POST', body: JSON.stringify(body) }),
    safety: (body: any) => request<any>('/deadlock/safety', { method: 'POST', body: JSON.stringify(body) }),
    request: (body: any) => request<any>('/deadlock/request', { method: 'POST', body: JSON.stringify(body) }),
    detect: (body: any) => request<any>('/deadlock/detect', { method: 'POST', body: JSON.stringify(body) }),
    rag: (body: any) => request<any>('/deadlock/rag', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Synchronization
  synchronization: {
    producerConsumer: (body: any) => request<any>('/synchronization/producer-consumer', { method: 'POST', body: JSON.stringify(body) }),
    readersWriters: (body: any) => request<any>('/synchronization/readers-writers', { method: 'POST', body: JSON.stringify(body) }),
    diningPhilosophers: (body: any) => request<any>('/synchronization/dining-philosophers', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Disk
  disk: {
    simulate: (body: any) => request<any>('/disk/simulate', { method: 'POST', body: JSON.stringify(body) }),
    compare: (body: any) => request<any>('/disk/compare', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Experiments
  experiments: {
    list: (params?: { module?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.module) q.append('module', params.module);
      if (params?.search) q.append('search', params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<any>(`/experiments${queryStr}`);
    },
    get: (id: number) => request<any>(`/experiments/${id}`),
    create: (body: any) => request<any>('/experiments', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: any) => request<any>(`/experiments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => request<any>(`/experiments/${id}`, { method: 'DELETE' }),
    duplicate: (id: number) => request<any>(`/experiments/${id}/duplicate`, { method: 'POST' }),
  },

  // Comparisons
  comparisons: {
    list: (module?: string) => request<any>(`/comparisons${module ? `?module=${module}` : ''}`),
    get: (id: number) => request<any>(`/comparisons/${id}`),
    create: (body: any) => request<any>('/comparisons', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: number) => request<any>(`/comparisons/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    overview: () => request<any>('/analytics/overview'),
  },

  // Tutor
  tutor: {
    getTopics: () => request<any>('/tutor/topics'),
    getQuiz: (topic?: string) => request<any>(`/tutor/quiz${topic ? `?topic=${topic}` : ''}`),
    submitQuiz: (answers: Record<string, number>) => request<any>('/tutor/quiz/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
    explain: (module: string, result: any) => request<any>('/tutor/explain', { method: 'POST', body: JSON.stringify({ module, result }) }),
  },

  // Exports
  exports: {
    downloadCsv: async (module: string, result: any, filename?: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/exports/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ module, result }),
      });
      if (!response.ok) throw new Error('Failed to generate CSV export.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${module}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  },
};
