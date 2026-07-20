"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"

export default function PrivacyToggle() {
  const [isPrivate, setIsPrivate] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isPrivacyMode = localStorage.getItem("privacy") === "true"
    setIsPrivate(isPrivacyMode)
    if (isPrivacyMode) {
      document.documentElement.classList.add("privacy-mode")
    }

    // Sync cloud setting
    async function syncCloud() {
      const cloudPriv = await getUserSetting("privacy")
      if (cloudPriv !== null) {
        const isCloudPriv = cloudPriv === "true"
        setIsPrivate(isCloudPriv)
        if (isCloudPriv) {
          document.documentElement.classList.add("privacy-mode")
          localStorage.setItem("privacy", "true")
        } else {
          document.documentElement.classList.remove("privacy-mode")
          localStorage.setItem("privacy", "false")
        }
      }
    }
    syncCloud()
  }, [])

  const togglePrivacy = () => {
    if (isPrivate) {
      document.documentElement.classList.remove("privacy-mode")
      setUserSetting("privacy", "false")
      localStorage.setItem("privacy", "false")
      setIsPrivate(false)
    } else {
      document.documentElement.classList.add("privacy-mode")
      setUserSetting("privacy", "true")
      localStorage.setItem("privacy", "true")
      setIsPrivate(true)
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={togglePrivacy}
      title={isPrivate ? "Privacy Mode ON — Click to reveal" : "Click to hide sensitive values"}
      className={`
        relative flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-300 group
        ${isPrivate
          ? "bg-amber-500/15 border-amber-500/60 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_18px_rgba(245,158,11,0.5)] hover:bg-amber-500/25"
          : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
        }
      `}
    >
      {/* Glow ring when active */}
      {isPrivate && (
        <span className="absolute inset-0 rounded-xl animate-ping opacity-30 bg-amber-500/50" />
      )}

      {isPrivate ? (
        <ShieldCheck className="h-4 w-4 relative z-10 transition-transform duration-200 group-hover:scale-110" />
      ) : (
        <Eye className="h-4 w-4 relative z-10 transition-transform duration-200 group-hover:scale-110" />
      )}

      <span className="sr-only">Toggle privacy mode</span>
    </button>
  )
}
