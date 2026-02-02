import { useState, useEffect, useCallback } from 'react'
import { progressApi } from '../api.js'
import type { ProgressItem } from '../shared/types.js'

export function useProgress() {
  const [items, setItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await progressApi.get()
      if (result.success) {
        setItems(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const archive = useCallback(async () => {
    const result = await progressApi.archive()
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const add = useCallback(async (description: string, todoId?: string) => {
    const result = await progressApi.add(description, todoId)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  return {
    items,
    loading,
    error,
    add,
    archive,
    refresh: load
  }
}
