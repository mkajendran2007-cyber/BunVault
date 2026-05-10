"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Wallet, 
  Eye, 
  LineChart, 
  Briefcase, 
  Target, 
  Settings 
} from "lucide-react"

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close drawer on path change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Disable scrolling when drawer is open
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
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Watchlist", href: "/watchlist", icon: Eye },
    { name: "AI Assistant", href: "/ai-assistant", icon: LineChart },
    { name: "SIP Planner", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const renderOverlay = () => {
    if (!mounted) return null

    return createPortal(
      <>
        {/* Backdrop Overlay */}
        {isOpen && (
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          />
        )}

        {/* Drawer Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-[999] w-[280px] bg-background border-r border-border p-6 shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-8">
            {/* Drawer Header */}
            <div className="flex items-center justify-between">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 font-black tracking-wider text-lg"
                onClick={() => setIsOpen(false)}
              >
                <div className="bg-white p-1 rounded-md border border-border/40 shadow-sm flex items-center justify-center h-8 w-8">
                  <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-foreground">BUN VAULT</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
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
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer info inside Drawer */}
          <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground/60 text-center">
            © 2026 BUN VAULT
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
        className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {renderOverlay()}
    </>
  )
}
