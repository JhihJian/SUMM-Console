import { useState, useEffect, useCallback } from 'react'
import { draftApi } from '../api.js'

interface DraftData {
  content: string
  updatedAt: string
}

export function useDraft() {
  const [draft, setDraft] = useState<DraftData>({
    content: '',
    updatedAt: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load draft on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await draftApi.get()
        if (!cancelled && result.success) {
          setDraft(result.data || { content: '', updatedAt: '' })
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load draft')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!draft.content) return

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        await draftApi.save(draft.content)
        setSaving(false)
      } catch (err) {
        setError('Failed to save draft')
        setSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [draft.content])

  const setContent = useCallback((content: string) => {
    setDraft(prev => ({ ...prev, content }))
  }, [])

  return {
    content: draft.content,
    setContent,
    loading,
    saving,
    error,
    charCount: draft.content.length
  }
}
