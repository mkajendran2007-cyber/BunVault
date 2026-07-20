"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  Sparkles, 
  Target
} from "lucide-react"
import { engine } from "@/lib/AudioEngine"

export default function MobileNavBar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Holdings", href: "/holdings", icon: Wallet },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "AI Studio", href: "/analytics", icon: Sparkles },
    { name: "Goals", href: "/goals", icon: Target }
  ]

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-16 bg-white/95 dark:bg-[#151A24]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-full flex justify-around items-center px-2 z-50 md:hidden shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === "/analytics" && pathname === "/ai-assistant")
        const Icon = item.icon

        return (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={() => engine.playClick()}
            className="flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 group select-none"
          >
            {/* Glowing top gold indicator for active item */}
            {isActive && (
              <motion.span 
                layoutId="mobile-nav-glow"
                className="absolute top-0 w-10 h-1 gold-gradient-bg rounded-full shadow-[0_0_12px_rgba(244,197,66,0.8)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              isActive 
                ? "gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20 scale-105" 
                : "text-muted-foreground group-hover:text-foreground"
            }`}>
              <Icon className="h-4 w-4" />
            </div>

            <span 
              className={`text-[10px] mt-1 tracking-tight transition-all duration-200 ${
                isActive 
                  ? "text-foreground font-bold scale-105" 
                  : "text-muted-foreground font-semibold"
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
