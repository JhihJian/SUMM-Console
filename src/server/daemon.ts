import { spawn, ChildProcess } from 'child_process'
import { Session } from '../shared/types.js'

interface DaemonResult {
  success: boolean
  data?: any
  error?: string
  code?: string
}

function execSummCommand(args: string[], timeout = 30000): Promise<DaemonResult> {
  return new Promise((resolve) => {
    const proc = spawn('summ', args)
    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      proc.kill()
      resolve({ success: false, error: 'Command timeout', code: 'E005' })
    }, timeout)

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        try {
          const data = stdout.trim() ? JSON.parse(stdout) : undefined
          resolve({ success: true, data })
        } catch {
          resolve({ success: true, data: stdout.trim() })
        }
      } else {
        resolve({ success: false, error: stderr || 'Command failed', code: 'E008' })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        resolve({ success: false, error: 'SUMM CLI not found', code: 'E007' })
      } else {
        resolve({ success: false, error: err.message, code: 'E007' })
      }
    })
  })
}

export async function checkDaemonRunning(): Promise<boolean> {
  const result = await execSummCommand(['status'], 5000)
  return result.success
}

export async function listSessions(status?: 'running' | 'idle' | 'stopped'): Promise<Session[]> {
  const args = ['list']
  if (status) {
    args.push('--status', status)
  }

  const result = await execSummCommand(args)
  if (!result.success) {
    if (result.code === 'E007') {
      throw new Error('E007: Daemon not running')
    }
    return []
  }

  // Parse sessions from output
  // Expected format: JSON array or specific output format
  try {
    const sessions = Array.isArray(result.data) ? result.data : []
    return sessions
      .filter((s: any) => s.status !== 'suspended' && s.status !== 'paused')
      .slice(0, 20)
  } catch {
    return []
  }
}

export async function getSessionStatus(id: string): Promise<DaemonResult> {
  return execSummCommand(['status', id])
}

export async function startSession(cli: string, init: string, name?: string): Promise<DaemonResult> {
  const args = ['start', '--cli', cli, '--init', init]
  if (name) {
    args.push('--name', name)
  }
  return execSummCommand(args, 60000)
}

export async function stopSession(id: string): Promise<DaemonResult> {
  return execSummCommand(['stop', id])
}

export async function injectMessage(id: string, message: string): Promise<DaemonResult> {
  const result = await execSummCommand(['inject', id, message])
  if (!result.success) {
    return { ...result, code: 'E006' }
  }
  return result
}

export function attachSession(id: string): ChildProcess {
  const proc = spawn('summ', ['attach', id], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  return proc
}

export function attachSummMain(): ChildProcess {
  // Check if SUMM main session exists, if not start it
  const proc = spawn('summ', ['attach', 'summ-main'], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  return proc
}

export { execSummCommand, DaemonResult }
