"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, TrendingUp, BarChart3, Bot, Lock, Target, Award, Eye, FileText } from "lucide-react"

const EXECUTIVE_PILLARS = [
  { icon: TrendingUp, text: "Live Stock & Gold Price Tracking" },
  { icon: BarChart3,  text: "Portfolio Performance & Return Analytics" },
  { icon: Bot,        text: "AI Financial Assistant & Recommendations" },
  { icon: Award,      text: "SIP Planning & Wealth Goal Calculators" },
  { icon: Shield,     text: "Bank-Grade Security & Data Privacy" },
  { icon: Lock,       text: "Zero Spam & No Tracking Cookies" },
]

const LIVE_ENCLAVE_CARDS = [
  { label: "Nifty 50 Benchmark", value: "24,832.40", change: "+1.24%", up: true, delay: 0.3 },
  { label: "Sovereign Gold Bond", value: "₹8,110.00", change: "+0.80%", up: true, delay: 0.6 },
  { label: "AI Portfolio Health", value: "88/100", change: "OPTIMAL", up: true, delay: 0.9 },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#06080C] text-slate-100 selection:bg-[#F4C542] selection:text-slate-950 font-sans overflow-hidden">

      {/* ─── LEFT: EXECUTIVE OBSIDIAN BRANDING ENCLAVE ─── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative overflow-hidden border-r border-[#242C3E]">

        {/* Base Obsidian background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#06080C] via-[#0D121C] to-[#121926]" />

        {/* Subtle Institutional Grid */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #242C3E 1px, transparent 1px), linear-gradient(to bottom, #242C3E 1px, transparent 1px)`,
            backgroundSize: '56px 56px'
          }}
        />

        {/* Ambient Gold & Obsidian Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl gold-gradient-bg p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all">
                <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[14px] overflow-hidden">
                  <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xl tracking-wider font-mono leading-none flex items-center gap-1.5">
                  BUN VAULT <span className="text-[10px] px-2 py-0.5 rounded gold-gradient-bg text-slate-950 font-bold">4.0</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                  Smart Wealth Management
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Center Content */}
          <div className="flex flex-col gap-8 my-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#141A26] border border-[#242C3E] text-xs font-mono font-bold text-[#F4C542] mb-4">
                <Shield className="h-3.5 w-3.5" /> 100% PRIVATE & SECURE
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.06] tracking-tight font-mono">
                Take Full Control.<br />
                <span className="gold-gradient-text">
                  Grow Your Wealth.
                </span>
              </h1>
              <p className="mt-3.5 text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-lg font-sans">
                Log in to track your live portfolio, monitor daily expenses across bank accounts, and get clear AI financial insights.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 gap-3 font-mono text-xs text-slate-300"
            >
              {EXECUTIVE_PILLARS.map((f, i) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#141A26] border border-[#242C3E] flex items-center justify-center shrink-0 text-[#F4C542]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold">{f.text}</span>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Floating Enclave Cards */}
          <div className="flex flex-col gap-3 font-mono">
            {LIVE_ENCLAVE_CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: card.delay, duration: 0.5 }}
                className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#0F1420]/80 border border-[#242C3E] backdrop-blur-md shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
                  <span className="text-xs text-slate-300 font-bold uppercase">{card.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white">{card.value}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${card.up ? 'bg-[#00E676]/15 text-[#00E676]' : 'bg-destructive/15 text-destructive'}`}>
                    {card.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: FORM ENCLAVE PANEL ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 relative bg-[#070A0F]">
        <div className="w-full max-w-md relative z-10">
           {children}
        </div>
      </div>
    </div>
  )
}
