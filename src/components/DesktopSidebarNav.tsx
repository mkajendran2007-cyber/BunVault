"use client"
 
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
    <div className="flex h-full max-h-screen flex-col gap-2 relative z-10">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-extrabold tracking-tight text-xl text-foreground hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg shadow-sm border border-border/30">
            <img src="/logo.png" alt="Bun Vault Logo" className="h-full w-full object-cover" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 tracking-wide">
             BUN VAULT
          </span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-3 text-sm font-medium space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors duration-300 ${
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div 
                     layoutId="sidebar-active-pill"
                     className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20"
                     transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 flex items-center justify-center h-6 w-6 transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                   <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="relative z-10">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-border/40">
        <Link
          href="/settings"
          className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-300 ${
            pathname === "/settings" 
              ? "bg-primary/10 text-primary font-semibold border border-primary/10" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-center h-6 w-6 group-hover:rotate-45 transition-transform duration-500">
             <Settings className="h-[18px] w-[18px]" />
          </div>
          Settings
        </Link>
      </div>
    </div>
  )
}
