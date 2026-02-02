# Phase 7: Integration Testing & Optimization - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Test all features, fix bugs, optimize performance, and ensure production readiness.

**Architecture:** End-to-end testing, performance profiling, code cleanup, documentation updates.

**Tech Stack:** Node.js testing tools, Chrome DevTools, TypeScript compiler

---

## Task 1: Project Structure Verification

**Files:** None (verification)

**Step 1: Verify all required files exist**

Run:
```bash
echo "=== Frontend ===" && \
ls -la src/client/*.tsx && \
echo "=== Components ===" && \
ls -la src/client/components/*.tsx && \
echo "=== Hooks ===" && \
ls -la src/client/hooks/*.ts && \
echo "=== Backend ===" && \
ls -la src/server/*.ts && \
echo "=== Routes ===" && \
ls -la src/server/routes/*.ts && \
echo "=== WebSocket ===" && \
ls -la src/server/ws/*.ts && \
echo "=== Shared ===" && \
ls -la src/shared/*.ts
```

Expected: All files listed without errors

**Step 2: Create missing index file**

Create: `src/client/components/index.ts`

```typescript
// Layout components
export { Panel } from './layout/Panel.js'
export { TitleBar } from './layout/TitleBar.js'
export { MainGrid } from './layout/MainGrid.js'

// Feature components
export { TodoPanel } from './TodoPanel.js'
export { DraftPanel } from './DraftPanel.js'
export { ChatPanel } from './ChatPanel.js'
export { DisplayPanel } from './DisplayPanel.js'
export { SessionsPanel } from './SessionsPanel.js'
export { ProgressPanel } from './ProgressPanel.js'
export { TokenPanel } from './TokenPanel.js'

// Modals
export { TodoFilesModal } from './modals/TodoFilesModal.js'
export { TodoCreateModal } from './modals/TodoCreateModal.js'
export { SessionTerminalModal } from './modals/SessionTerminalModal.js'

// Utilities
export { ErrorBoundary } from './ErrorBoundary.js'
export { ToastContainer, Toast } from './Toast.js'
export { Skeleton, TodoSkeleton, SessionSkeleton } from './Skeleton.js'
```

**Step 3: Create hooks index**

Create: `src/client/hooks/index.ts`

```typescript
export { useTodos } from './useTodos.js'
export { useDraft } from './useDraft.js'
export { useTerminal } from './useTerminal.js'
export { useSessions } from './useSessions.js'
export { useProgress } from './useProgress.js'
export { usePlan } from './usePlan.js'
export { useTokenUsage } from './useTokenUsage.js'
export { useKeyboardShortcuts, SHORTCUTS } from './useKeyboardShortcuts.js'
export { useToast } from './useToast.js'
```

**Step 4: Commit**

```bash
git add src/client/components/index.ts src/client/hooks/index.ts
git commit -m "chore: add component and hook index files

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: TypeScript Compilation Check

**Files:** None (verification)

**Step 1: Check for TypeScript errors**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors (warnings acceptable)

**Step 2: Fix any errors found**

If errors exist, fix them in respective files.

**Step 3: Verify build works**

Run:
```bash
npm run build:client
```

Expected: Clean build in `dist/client/`

**Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve TypeScript compilation errors

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Backend API Testing

**Files:** None (testing)

**Step 1: Start backend server**

Run:
```bash
npm run dev:server
```

**Step 2: Test each endpoint**

Run in another terminal:
```bash
# Health check
curl http://localhost:3000/api/health

# TODO endpoints
curl http://localhost:3000/api/todos
curl -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"Test TODO"}'
curl http://localhost:3000/api/todos/todo_*

# Draft endpoints
curl http://localhost:3000/api/draft
curl -X PUT http://localhost:3000/api/draft -H "Content-Type: application/json" -d '{"content":"Test draft"}'

# Progress endpoints
curl http://localhost:3000/api/progress

# Plan endpoint
curl http://localhost:3000/api/plan

# Token endpoint
curl http://localhost:3000/api/token-usage

# Sessions endpoint (may fail if daemon not running)
curl http://localhost:3000/api/sessions
```

Expected: All return `{"success":true,...}` except sessions which may return daemon error

**Step 3: Test file upload**

```bash
# Create test file
echo "test content" > /tmp/test.txt

# Upload to a TODO (replace todo_id with actual ID)
curl -X POST http://localhost:3000/api/todos/todo_*/files \
  -F "file=@/tmp/test.txt"
```

**Step 4: Document any issues found**

Create notes if bugs found for fixing.

---

## Task 4: Frontend Integration Testing

**Files:** None (testing)

**Step 1: Start both servers**

Run:
```bash
npm run dev
```

**Step 2: Manual testing checklist**

Open http://localhost:5173 and verify:

**Layout:**
- [ ] TitleBar displays with SUMM Console title
- [ ] All 7 panels visible in correct positions
- [ ] 3-column grid layout responsive
- [ ] Scrollbars styled correctly

**TODO Panel:**
- [ ] TODOs load from backend
- [ ] Create TODO modal opens (Ctrl+N or + button)
- [ ] New TODO appears after creation
- [ ] Drag and drop reordering works
- [ ] Click TODO opens file modal
- [ ] File upload works
- [ ] File deletion works

**Draft Panel:**
- [ ] Draft content loads
- [ ] Typing triggers auto-save after 1s
- [ ] "Saving" / "Saved" status shows
- [ ] Character count updates

**Chat Panel:**
- [ ] Terminal renders (xterm.js)
- [ ] Connection status shows
- [ ] Can type and send input
- [ ] Output displays correctly

**Display Panel:**
- [ ] Plan content loads
- [ ] Markdown renders correctly
- [ ] Tabs switch (plan/output)

**Sessions Panel:**
- [ ] Sessions load (if daemon running)
- [ ] Session list displays
- [ ] Click opens terminal modal

**Progress Panel:**
- [ ] Progress items load
- [ ] Archive button works
- [ ] Timestamps display correctly

**Token Panel:**
- [ ] Token usage displays
- [ ] Progress bar renders
- [ ] Segment bars show usage

**Step 3: Test error scenarios**

- [ ] Stop backend and verify error handling
- [ ] Restart backend and verify reconnection
- [ ] Test with invalid TODO ID

**Step 4: Document bugs found**

Create a list of any issues found.

---

## Task 5: Performance Optimization

**Files:** Multiple

**Step 1: Add debounce hook for search/filter**

Create: `src/client/hooks/useDebounce.ts`

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

**Step 2: Optimize polling intervals**

Review each hook's polling interval:
- TODO: 5s - appropriate
- Sessions: 3s - appropriate for real-time feel
- Progress: 10s - appropriate
- Plan: 10s - appropriate
- Token: 60s - appropriate

**Step 3: Add request caching to API client**

Update `src/client/api.ts` with simple cache:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 // 1 second for GET requests

async function cachedRequest<T>(key: string, fn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { success: true, data: cached.data }
  }

  const result = await fn()
  if (result.success && result.data !== undefined) {
    cache.set(key, { data: result.data, timestamp: Date.now() })
  }
  return result
}
```

**Step 4: Commit optimizations**

```bash
git add src/client/hooks/useDebounce.ts src/client/api.ts
git commit -m "perf: add debouncing and request caching

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Code Cleanup

**Files:** Multiple

**Step 1: Remove unused imports**

Check each file for unused imports and remove them.

**Step 2: Add JSDoc comments to key functions**

Add documentation to:
- API functions in `api.ts`
- Hook exports
- Main component exports

**Step 3: Ensure consistent formatting**

Run Prettier if available, or manually ensure consistent formatting.

**Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore: code cleanup and documentation

Remove unused imports
Add JSDoc comments
Ensure consistent formatting

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Environment Configuration

**Files:** `.env.example`

**Step 1: Verify .env.example is complete**

Update `.env.example`:

```env
# Server Configuration
PORT=3000

# SUMM Configuration
SUMM_DIR=./SUMM
SUMM_WORK_DIR=/path/to/workspace

# Anthropic API (optional, for token usage)
ANTHROPIC_API_KEY=

# Development
NODE_ENV=development
```

**Step 2: Create production .env.example**

Update with production defaults.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: update environment configuration template

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Final Verification Checklist

**Files:** None (verification)

**Step 1: Complete checklist**

Run through this final checklist:

**Functionality:**
- [ ] All panels render correctly
- [ ] All CRUD operations work
- [ ] File upload/delete works
- [ ] Terminal connection works
- [ ] Session modal works
- [ ] Auto-save works
- [ ] Polling works for all data
- [ ] Keyboard shortcuts work
- [ ] Error boundary catches errors
- [ ] Toast notifications show

**Performance:**
- [ ] No noticeable lag on load
- [ ] Panel re-renders optimized
- [ ] Polling doesn't cause excessive requests
- [ ] Terminal is responsive

**Code Quality:**
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] No console warnings (except known)
- [ ] All files properly formatted
- [ ] Imports are consistent

**Deployment Readiness:**
- [ ] .gitignore excludes sensitive files
- [ ] .env.example provided
- [ ] Build command works
- [ ] Can run from built files

**Step 2: Create final summary**

Document any known issues or limitations.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Phase 7 complete - testing and optimization finished

All features tested and working
Performance optimizations applied
Code cleanup complete
Environment configuration updated
Ready for deployment preparation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 7 Completion Criteria

- [x] All TypeScript compilation errors resolved
- [x] All API endpoints tested
- [x] All frontend features tested
- [x] Performance optimizations applied
- [x] Code cleanup complete
- [x] Environment configuration documented
- [x] No critical bugs remaining

---

**Next:** Phase 8 - Deployment Preparation
