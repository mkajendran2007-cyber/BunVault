"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Wallet, 
  Eye, 
  LineChart, 
  Briefcase, 
  Target 
} from "lucide-react"

export default function MobileNavBar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Watchlist", href: "/watchlist", icon: Eye },
    { name: "AI Insight", href: "/ai-assistant", icon: LineChart },
    { name: "SIP", href: "/sip-planner", icon: Briefcase },
    { name: "Goals", href: "/goals", icon: Target }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-lg border-t border-white/5 flex justify-around items-center px-1 z-50 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.3)] pb-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link 
            key={item.name} 
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300"
          >
            {/* Glowing top line for active item */}
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            )}

            <Icon 
              className={`h-5 w-5 transition-all duration-300 ${
                isActive 
                  ? "text-primary scale-110 filter drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" 
                  : "text-muted-foreground/80 hover:text-foreground"
              }`} 
            />

            <span 
              className={`text-[10px] mt-1 font-medium tracking-wide transition-all duration-300 ${
                isActive 
                  ? "text-primary font-bold scale-105" 
                  : "text-muted-foreground/70"
              }`}
            >
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
