import { useState, useEffect, useCallback } from 'react'
import { tokenApi } from '../api.js'
import type { TokenUsage } from '../shared/types.js'

export function useTokenUsage() {
  const [usage, setUsage] = useState<TokenUsage>({
    used: 0,
    limit: 200000,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await tokenApi.get()
      if (result.success) {
        setUsage(result.data || { used: 0, limit: 200000, percentage: 0 })
        setError(null)
      }
    } catch (err) {
      setError('Failed to load token usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  return {
    usage,
    loading,
    error,
    refresh: load
  }
}
