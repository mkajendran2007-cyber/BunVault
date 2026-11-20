"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import AppBrandLogo from "@/components/AppBrandLogo"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Wallet, 
  Eye, 
  Sparkles, 
  Briefcase, 
  Target,
  ChevronRight,
  Receipt,
  FileText,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react"
import { engine } from "@/lib/AudioEngine"

export default function DesktopSidebarNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Expense Tracker", href: "/expenses", icon: Receipt, badge: "Velocity" },
    { name: "Watchlist", href: "/watchlist", icon: Eye, badge: "24/7" },
    { name: "AI Analytics", href: "/analytics", icon: Sparkles, highlight: true },
    { name: "SIP Planner", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileText, badge: "PDF" },
  ]

  return (
    <div className="flex h-full max-h-screen flex-col justify-between relative z-10 select-none bg-transparent transition-colors overflow-hidden">
      {/* 1. FIXED TOP HEADER: Logo & App Name (Never Scrolls) */}
      <div className="px-5 pt-6 pb-4 shrink-0 border-b border-slate-200/80 dark:border-white/[0.08] bg-transparent z-20">
        <Link href="/dashboard" className="block transition-transform hover:scale-[1.01] active:scale-[0.98]">
          <AppBrandLogo size="sidebar" />
        </Link>
      </div>

      {/* 2. SCROLLABLE NAVIGATION AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-4">
        {/* Section Label */}
        <div className="px-3 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Executive Suite
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        
        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/analytics" && pathname === "/ai-assistant")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => engine.playClick()}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive 
                    ? "text-white dark:text-slate-950 font-semibold shadow-xs" 
                    : "font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
                }`}
              >
                {isActive && (
                  <motion.div 
                     layoutId="sidebar-active-glow"
                     className="absolute inset-0 bg-slate-900 dark:bg-gradient-to-r dark:from-amber-400 dark:via-amber-300 dark:to-yellow-400 rounded-xl shadow-sm shadow-slate-900/10 dark:shadow-amber-500/20"
                     transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                   <div className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-200 group-hover:scale-105 ${
                      isActive 
                        ? 'bg-white/15 text-white dark:bg-slate-950/15 dark:text-slate-950' 
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200/80 dark:group-hover:bg-white/[0.1]'
                   }`}>
                      <Icon className="h-4 w-4" />
                   </div>
                   <span className="tracking-tight text-xs sm:text-sm">{item.name}</span>
                </div>

                <div className="relative z-10 flex items-center gap-1.5">
                   {item.badge && !isActive && (
                     <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 dark:bg-yellow-500/10 dark:text-[#F4C542] border border-slate-200/80 dark:border-yellow-500/20">
                       {item.badge}
                     </span>
                   )}
                   {item.highlight && !isActive && (
                     <span className="flex items-center justify-center h-4 w-4 rounded-full bg-violet-100 text-violet-600 dark:bg-yellow-500/15 dark:text-yellow-500 animate-pulse">
                       <Zap className="h-2.5 w-2.5 fill-current" />
                     </span>
                   )}
                   {isActive && (
                     <ChevronRight className="h-3.5 w-3.5 opacity-80 text-white dark:text-slate-950" />
                   )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 3. BOTTOM CORPORATE FOOTER CARD */}
      <div className="p-3 shrink-0 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-transparent">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-900 dark:text-white">Encrypted Vault</div>
              <div className="text-[9px] font-mono text-slate-400">Zero-Knowledge RLS</div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            PRO
          </span>
        </div>
      </div>
    </div>
  )
}
