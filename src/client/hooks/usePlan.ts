import { useState, useEffect, useCallback } from 'react'
import { planApi } from '../api.js'

export function usePlan() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await planApi.get()
      if (result.success) {
        setContent(result.data?.content || '')
        setError(null)
      }
    } catch (err) {
      setError('Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  return {
    content,
    loading,
    error,
    refresh: load
  }
}
