import { useState, useEffect, useCallback } from 'react'
import { todoApi } from '../api.js'
import type { Todo } from '@shared/types'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load todos
  const load = useCallback(async () => {
    try {
      const result = await todoApi.list()
      if (result.success) {
        setTodos(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const createTodo = useCallback(async (data: {
    title: string
    progress?: number
    statusDesc?: string
    state?: string
  }) => {
    const result = await todoApi.create(data)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const result = await todoApi.update(id, updates)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  const deleteTodo = useCallback(async (id: string) => {
    const result = await todoApi.delete(id)
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const archiveTodo = useCallback(async (id: string) => {
    const result = await todoApi.archive(id)
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const reorderTodos = useCallback(async (newOrder: Todo[]) => {
    const updates = newOrder.map((todo, index) => ({
      id: todo.id,
      order: index
    }))

    await Promise.all(
      updates.map(u => todoApi.update(u.id, { order: u.order }))
    )

    await load()
  }, [load])

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    archiveTodo,
    reorderTodos,
    refresh: load
  }
}
