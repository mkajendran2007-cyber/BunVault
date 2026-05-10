"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Wallet, 
  Eye, 
  LineChart, 
  Briefcase, 
  Target,
  Settings
} from "lucide-react"

export default function DesktopSidebarNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Watchlist", href: "/watchlist", icon: Eye },
    { name: "AI Assistant", href: "/ai-assistant", icon: LineChart },
    { name: "SIP Planner", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target },
  ]

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-wider text-lg">
          <div className="bg-white p-1 rounded-md border border-border/40 shadow-sm flex items-center justify-center h-8 w-8">
            <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-contain" />
          </div>
          <span>BUN VAULT</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(var(--primary),0.2)]" 
                    : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
            pathname === "/settings" 
              ? "bg-primary/10 text-primary font-semibold" 
              : "text-muted-foreground hover:text-primary hover:bg-muted/50"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  )
}
