import { useState, useEffect, useCallback } from 'react'
import { sessionsApi } from '../api.js'
import type { Session } from '@shared/types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await sessionsApi.list()
      if (result.success) {
        setSessions(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [load])

  return {
    sessions,
    loading,
    error,
    refresh: load
  }
}
