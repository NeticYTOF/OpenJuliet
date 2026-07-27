import { useState, useCallback } from 'react'

/**
 * Generic async operation state tracker.
 */
interface AsyncState<T> {
  /** Current operation data */
  data: T | null
  /** Loading state */
  loading: boolean
  /** Error message if operation failed */
  error: string | null
}

/**
 * Return type for useIPC hook.
 */
interface UseIPCReturn<T> extends AsyncState<T> {
  /** Execute the IPC operation */
  execute: (...args: unknown[]) => Promise<T | null>
  /** Reset state to initial values */
  reset: () => void
  /** Set data manually */
  setData: (data: T | null) => void
}

/**
 * useIPC — Hook wrapper around Electron window.api calls with loading/error state management.
 *
 * Provides a consistent pattern for calling IPC methods with automatic loading,
 * error handling, and state management.
 *
 * @param ipcMethod — The window.api method to call (e.g. 'openDirectory', 'getAppVersion')
 * @returns Object with data, loading, error states, and execute/reset/setData actions
 *
 * @example
 * const { data: version, loading, execute } = useIPC<string>('getAppVersion')
 * // Call: await execute()
 * // result: version = '1.0.0'
 */
export function useIPC<T = unknown>(ipcMethod: string): UseIPCReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      const api = (window as unknown as { api?: Record<string, unknown> }).api
      const method = api?.[ipcMethod]

      if (!api || typeof method !== 'function') {
        const msg = `IPC method '${ipcMethod}' is not available on window.api`
        console.warn(msg)
        setError(msg)
        setLoading(false)
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await (method as (...args: unknown[]) => Promise<T>)(...args)
        setData(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : `IPC call '${ipcMethod}' failed`
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [ipcMethod]
  )

  return { data, loading, error, execute, reset, setData }
}

/**
 * useAppVersion — Convenience hook to get the app version.
 */
export function useAppVersion(): { version: string | null; loading: boolean; error: string | null } {
  const { data: version, loading, error } = useIPC<string>('getAppVersion')
  return { version, loading, error }
}

/**
 * useFileDialog — Convenience hook for file/directory pickers.
 */
export function useFileDialog(mode: 'file' | 'directory' = 'file'): {
  path: string | null
  loading: boolean
  error: string | null
  open: () => Promise<void>
} {
  const method = mode === 'directory' ? 'openDirectory' : 'openFile'
  const { data: path, loading, error, execute } = useIPC<string>(method)

  const open = useCallback(async () => {
    await execute()
  }, [execute])

  return { path, loading, error, open }
}

