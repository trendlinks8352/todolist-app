import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function Toast() {
  const toast = useUIStore((s) => s.toast)
  const hideToast = useUIStore((s) => s.hideToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(hideToast, toast.duration)
    return () => clearTimeout(timer)
  }, [toast, hideToast])

  if (!toast) return null

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="status"
      aria-live="polite"
      data-testid="toast"
      data-type={toast.type}
    >
      {toast.message}
    </div>
  )
}
