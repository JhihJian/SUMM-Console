import type { Todo, TodoFile, ProgressItem, Session, TokenUsage } from '@shared/types'

const API_BASE = '/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Simple cache for GET requests
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 // 1 second for GET requests

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`
  const method = options.method?.toUpperCase() || 'GET'
  const cacheKey = `${method}:${url}`

  // Check cache for GET requests
  if (method === 'GET') {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data }
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `HTTP ${response.status}`
    }
  }

  // Cache successful GET responses
  if (method === 'GET' && data.data !== undefined) {
    cache.set(cacheKey, { data: data.data, timestamp: Date.now() })
  }

  return { success: true, data }
}

// TODO API
export const todoApi = {
  list: () => request<Todo[]>('/todos'),

  get: (id: string) => request<Todo>(`/todos/${id}`),

  create: (data: { title: string; progress?: number; statusDesc?: string; state?: string }) =>
    request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id: string, data: Partial<Todo>) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    request(`/todos/${id}`, { method: 'DELETE' }),

  archive: (id: string) =>
    request(`/todos/${id}/archive`, { method: 'POST' }),

  // File operations
  getFiles: (id: string) => request<TodoFile[]>(`/todos/${id}/files`),

  uploadFile: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return fetch(`${API_BASE}/todos/${id}/files`, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
  },

  deleteFile: (id: string, fileId: string) =>
    request(`/todos/${id}/files/${fileId}`, { method: 'DELETE' })
}

// Draft API
export const draftApi = {
  get: () => request<{ content: string; updatedAt: string }>('/draft'),

  save: (content: string) =>
    request<{ content: string; updatedAt: string }>('/draft', {
      method: 'PUT',
      body: JSON.stringify({ content })
    })
}

// Progress API
export const progressApi = {
  get: () => request<ProgressItem[]>('/progress'),

  add: (description: string, todoId?: string) =>
    request<ProgressItem>('/progress', {
      method: 'POST',
      body: JSON.stringify({ description, todoId })
    }),

  archive: () =>
    request('/progress/archive', { method: 'POST' })
}

// Plan API
export const planApi = {
  get: () => request<{ content: string }>('/plan')
}

// Sessions API
export const sessionsApi = {
  list: (statusFilter?: 'running' | 'idle' | 'stopped') =>
    request<Session[]>(`/sessions${statusFilter ? `?status=${statusFilter}` : ''}`)
}

// Token Usage API
export const tokenApi = {
  get: () => request<TokenUsage>('/token-usage')
}
