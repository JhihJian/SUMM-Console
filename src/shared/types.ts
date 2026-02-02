// Todo types
export interface Todo {
  id: string
  title: string
  progress: number
  statusDesc: string
  state: 'pending' | 'working' | 'completed'
  order: number
  files: TodoFile[]
  createdAt: string
  completedAt?: string
}

export interface TodoFile {
  id: string
  name: string
  path: string
  size: number
  uploadedAt: string
}

// Draft types
export interface Draft {
  content: string
  updatedAt: string
}

// Progress types
export interface ProgressItem {
  id: string
  description: string
  completedAt: string
  todoId?: string
}

// Session types
export interface Session {
  id: string
  name: string
  cli: string
  workdir: string
  task: string
  status: 'running' | 'idle' | 'stopped'
  createdAt: string
  lastActivity?: string
}

// Token types
export interface TokenUsage {
  used: number
  limit: number
  percentage: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// WebSocket message types
export interface WSMessage {
  type: 'input' | 'output' | 'resize' | 'status'
  data?: string
  cols?: number
  rows?: number
  connected?: boolean
  needsDecision?: boolean
}
