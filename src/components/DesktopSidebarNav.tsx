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
  Command,
  Sun,
  Moon,
  ShieldCheck,
  Zap
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
    { name: "Expense Tracker", href: "/expenses", icon: Receipt, badge: "Loss/Gain" },
    { name: "Watchlist", href: "/watchlist", icon: Eye, badge: "24/7" },
    { name: "AI Analytics", href: "/analytics", icon: Sparkles, highlight: true },
    { name: "SIP Planner", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileText, badge: "PDF" },
  ]

  return (
    <div className="flex h-full max-h-screen flex-col justify-between relative z-10 select-none bg-white dark:bg-[#0A0D12] border-r border-slate-200/80 dark:border-slate-800/60 shadow-xl shadow-slate-900/5 transition-colors overflow-hidden">
      {/* 1. FIXED TOP HEADER: Logo & App Name (Never Scrolls) */}
      <div className="px-4 pt-5 pb-4 shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0A0D12] z-20">
        <Link href="/dashboard" className="block transition-transform hover:scale-[1.02] active:scale-[0.99]">
          <AppBrandLogo size="sidebar" />
        </Link>
      </div>

      {/* 2. SCROLLABLE NAVIGATION AREA: Starts right from Dashboard downwards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
        {/* Section Label */}
        <div className="px-1">
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Executive Suite
          </p>
        </div>
        
        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/analytics" && pathname === "/ai-assistant")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => engine.playClick()}
                className={`group relative flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  isActive 
                    ? "text-slate-950 font-bold shadow-md shadow-amber-500/15" 
                    : "font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-[#151A24]/70"
                }`}
              >
                {isActive && (
                  <motion.div 
                     layoutId="sidebar-active-glow"
                     className="absolute inset-0 gold-gradient-bg rounded-2xl border border-amber-400/50 shadow-inner"
                     transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3">
                   <div className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200 group-hover:scale-105 ${
                      isActive 
                        ? 'bg-slate-950/15 text-slate-950 shadow-xs' 
                        : 'bg-slate-200/50 dark:bg-[#151A24] text-slate-500 dark:text-slate-400 group-hover:text-amber-500 dark:group-hover:text-[#F4C542] group-hover:bg-slate-200 dark:group-hover:bg-[#1E2533]'
                   }`}>
                      <Icon className="h-4 w-4" />
                   </div>
                   <span className="tracking-tight">{item.name}</span>
                </div>

                <div className="relative z-10 flex items-center gap-1.5">
                   {item.badge && !isActive && (
                     <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-yellow-500/10 text-yellow-600 dark:text-[#F4C542] border border-yellow-500/20">
                       {item.badge}
                     </span>
                   )}
                   {item.highlight && !isActive && (
                     <span className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500/15 text-yellow-500 animate-pulse">
                       <Zap className="h-3 w-3 fill-yellow-500" />
                     </span>
                   )}
                   {isActive && (
                     <ChevronRight className="h-4 w-4 opacity-80 text-slate-950" />
                   )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

