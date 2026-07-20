"use client"

import React, { useState } from "react"
import { Shield, Sparkles, Trophy } from "lucide-react"

interface AppBrandLogoProps {
  size?: "sidebar" | "drawer" | "header" | "splash"
  className?: string
}

export default function AppBrandLogo({ size = "sidebar", className = "" }: AppBrandLogoProps) {
  const [imgError, setImgError] = useState(false)

  // Configure sizing dimensions for Big Aesthetic View
  const dimensions = {
    sidebar: {
      box: "h-14 w-14 sm:h-16 sm:w-16 rounded-2xl p-[2px]",
      inner: "rounded-[14px]",
      icon: "h-10 w-10 max-h-[40px] max-w-[40px]",
      title: "text-xl sm:text-2xl font-bold tracking-tight leading-none",
      subtitle: "text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mt-1.5 px-2 py-0.5 rounded-md",
    },
    drawer: {
      box: "h-12 w-12 rounded-2xl p-[2px]",
      inner: "rounded-[14px]",
      icon: "h-8 w-8 max-h-[32px] max-w-[32px]",
      title: "text-lg font-bold tracking-tight leading-none",
      subtitle: "text-[9px] font-bold tracking-[0.18em] uppercase mt-1 px-1.5 py-0.5 rounded-md",
    },
    header: {
      box: "h-10 w-10 rounded-xl p-[1.5px]",
      inner: "rounded-[10px]",
      icon: "h-6 w-6 max-h-[24px] max-w-[24px]",
      title: "text-base font-bold tracking-tight leading-none",
      subtitle: "text-[8px] font-bold tracking-[0.15em] uppercase mt-0.5 px-1 py-0.5 rounded",
    },
    splash: {
      box: "h-24 w-24 sm:h-28 sm:w-28 rounded-3xl p-[3px] shadow-[0_0_50px_rgba(244,197,66,0.4)]",
      inner: "rounded-[22px]",
      icon: "h-16 w-16 sm:h-20 sm:w-20 max-h-[80px] max-w-[80px]",
      title: "text-3xl sm:text-4xl font-bold tracking-tight leading-none",
      subtitle: "text-xs sm:text-sm font-bold tracking-[0.25em] uppercase mt-2 px-3 py-1 rounded-lg",
    },
  }[size]

  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* Outer Glowing Crest Container */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105 ${dimensions.box} bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-[#F4C542] dark:via-[#FFD700] dark:to-[#D4A017] shadow-lg shadow-amber-500/25 dark:shadow-[#F4C542]/20 group-hover:shadow-xl group-hover:shadow-amber-500/40 dark:group-hover:shadow-[#F4C542]/35`}
      >
        {/* Animated Corner Sparkle */}
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-amber-300 to-emerald-400 border-2 border-white dark:border-[#08090B] flex items-center justify-center z-20 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-950" />
        </span>

        {/* Inner Aesthetic Core */}
        <div
          className={`flex items-center justify-center h-full w-full ${dimensions.inner} bg-white dark:bg-[#0D1117] transition-colors duration-300 overflow-hidden relative`}
        >
          {/* Subtle diagonal sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-emerald-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />

          {!imgError ? (
            <img
              src="/logo.png"
              alt="Bun Vault Emblem"
              onError={() => setImgError(true)}
              className={`${dimensions.icon} object-contain z-10 transition-transform duration-500 group-hover:scale-110`}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            />
          ) : (
            /* Aesthetic Hybrid Vector Emblem if /logo.png fails to load */
            <div className="relative flex items-center justify-center z-10 text-amber-500 dark:text-[#F4C542]">
              <Shield className={`${dimensions.icon} fill-amber-500/15 dark:fill-[#F4C542]/15 stroke-[2.2]`} />
              <Trophy className="absolute h-1/2 w-1/2 text-amber-600 dark:text-[#F4C542] animate-bounce-subtle" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Typography & Badge */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`${dimensions.title} text-slate-900 dark:text-foreground font-mono font-bold tracking-tight group-hover:text-yellow-500 dark:group-hover:text-[#F4C542] transition-colors`}
          >
            BUN VAULT
          </span>
          <Sparkles className="h-4 w-4 text-yellow-500 dark:text-[#F4C542] shrink-0 opacity-80 group-hover:rotate-12 transition-transform" />
        </div>

        <div className="flex items-center">
          <span
            className={`${dimensions.subtitle} bg-yellow-500/15 dark:bg-[#F4C542]/10 border border-yellow-500/30 dark:border-[#F4C542]/25 text-yellow-600 dark:text-[#F4C542] flex items-center gap-1 shadow-sm font-sans`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E676] shrink-0 animate-pulse" />
            EXECUTIVE 4.0
          </span>
        </div>
      </div>
    </div>
  )
}
