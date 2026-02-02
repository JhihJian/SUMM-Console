import { useState } from 'react'
import { useKeyboardShortcuts, SHORTCUTS } from './useKeyboardShortcuts.js'

export function useAppShortcuts() {
  const [showCreateTodo, setShowCreateTodo] = useState(false)

  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NEW_TODO,
      action: () => setShowCreateTodo(true)
    },
    {
      ...SHORTCUTS.CLOSE_MODAL,
      action: () => setShowCreateTodo(false)
    }
  ])

  return {
    showCreateTodo,
    setShowCreateTodo: (show: boolean) => setShowCreateTodo(show),
    toggleCreateTodo: () => setShowCreateTodo(v => !v)
  }
}
