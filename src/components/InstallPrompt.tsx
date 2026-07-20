"use client"

import { useEffect, useState } from "react"
import { Download, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import AppBrandLogo from "@/components/AppBrandLogo"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err))
    }

    // Listen for the PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Check if user has already dismissed it in this session
      const isDismissed = sessionStorage.getItem("pwa_install_dismissed")
      if (!isDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the browser install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // Reset prompt state
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_install_dismissed", "true")
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[380px] z-[100] animate-in slide-in-from-bottom duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl">
        {/* Subtle decorative gradient background glow */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          {/* Logo Container */}
          <div className="shrink-0">
            <AppBrandLogo size="header" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Install Bun Vault <Smartphone className="h-4 w-4 text-primary animate-pulse" />
              </h3>
              <button 
                onClick={handleDismiss} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add Bun Vault to your Home Screen for instant access, real-time sync, and native experience!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="flex-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Later
          </Button>
          <Button 
            size="sm" 
            onClick={handleInstallClick}
            className="flex-1 text-xs bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:brightness-110 transition-all gap-1.5 font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Install Now
          </Button>
        </div>
      </div>
    </div>
  )
}
