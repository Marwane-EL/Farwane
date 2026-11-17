"use client"

import { useEffect } from "react"

export function FullscreenShortcut() {
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const isF11 = e.key === "F11"
      const isAltEnter = e.altKey && e.key === "Enter"
      if (!isF11 && !isAltEnter) return

      e.preventDefault()

      // Try native Tauri window API first if running inside Tauri desktop app
      const tauriWindow = (
        window as unknown as {
          __TAURI__?: { window?: { getCurrentWindow: () => { isFullscreen: () => Promise<boolean>; setFullscreen: (v: boolean) => Promise<void> } } }
        }
      ).__TAURI__?.window

      if (tauriWindow) {
        try {
          const win = tauriWindow.getCurrentWindow()
          const current = await win.isFullscreen()
          await win.setFullscreen(!current)
          return
        } catch {
          // Fallback to Web Fullscreen API
        }
      }

      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {})
      } else {
        document.exitFullscreen?.().catch(() => {})
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return null
}
