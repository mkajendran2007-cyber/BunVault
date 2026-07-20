"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AppBrandLogo from "@/components/AppBrandLogo"
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Wallet, 
  Eye, 
  Sparkles, 
  Briefcase, 
  Target, 
  Receipt,
  FileText,
  ShieldCheck,
  Zap
} from "lucide-react"

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: "Live" },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Expense Tracker", href: "/expenses", icon: Receipt, badge: "Loss/Gain" },
    { name: "Watchlist", href: "/watchlist", icon: Eye },
    { name: "AI Analytics", href: "/analytics", icon: Sparkles },
    { name: "SIP Planner", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileText, badge: "PDF" },
  ]

  const renderOverlay = () => {
    if (!mounted) return null

    return createPortal(
      <>
        {/* Backdrop Overlay */}
        {isOpen && (
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[998] bg-black/80 backdrop-blur-md md:hidden transition-opacity duration-300"
          />
        )}

        {/* Drawer Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-[999] w-[310px] bg-white dark:bg-[#0A0D12] border-r border-slate-200/80 dark:border-slate-800/80 p-6 shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1 max-h-[85vh]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between">
              <Link 
                href="/dashboard" 
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <AppBrandLogo size="drawer" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151A24] transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section Label */}
            <div className="px-1 -mb-3">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                Executive Navigation
              </p>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "gold-gradient-bg text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151A24]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-amber-500"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${
                        isActive 
                          ? "bg-slate-950/20 text-slate-950" 
                          : "bg-amber-500/10 text-amber-600 dark:text-[#F4C542] border border-amber-500/20"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

        </div>
      </>,
      document.body
    )
  }

  return (
    <>
      {/* Hamburger Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151A24] transition-colors focus:outline-none"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6 text-foreground" />
      </button>

      {renderOverlay()}
    </>
  )
}
