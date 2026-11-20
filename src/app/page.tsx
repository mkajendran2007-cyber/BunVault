"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, useScroll, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Briefcase,
  Receipt,
  Eye,
  Bot,
  TrendingUp,
  FileText,
  ShieldCheck,
  Sparkles,
  Lock,
  ChevronDown,
  Layers,
  Activity,
  CheckCircle2,
  Zap,
  Globe2,
  Award
} from "lucide-react"

// Import 3D Components with Dynamic Client Isolation for WebGL / Three.js
const ThreeVaultCanvas = dynamic(() => import("@/components/landing/ThreeVaultCanvas"), {
  ssr: false
})
import ThreeDCard from "@/components/landing/ThreeDCard"
import ScrollStory3D from "@/components/landing/ScrollStory3D"
import BentoFeatures3D from "@/components/landing/BentoFeatures3D"
import WealthSimulator3D from "@/components/landing/WealthSimulator3D"

// Live Ticker Constants
const LIVE_TICKERS = [
  { label: "NIFTY 50", value: "24,320.50", change: "+0.59%", up: true },
  { label: "GOLD 24K (1G)", value: "₹14,826.00", change: "+0.52%", up: true },
  { label: "GOLD 22K (1G)", value: "₹13,590.00", change: "+0.52%", up: true },
  { label: "SILVER 999 (1G)", value: "₹219.04", change: "+0.48%", up: true },
  { label: "TCS.NS", value: "₹2,304.90", change: "+1.57%", up: true },
  { label: "RELIANCE.NS", value: "₹1,174.60", change: "+0.68%", up: true },
  { label: "BTC / INR", value: "₹77,82,222", change: "-1.71%", up: false },
]

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Hardware-Isolated RLS",
    desc: "Row-Level Security guarantees every single database record is mathematically restricted to your cryptographic user identity.",
    color: "gold" as const
  },
  {
    icon: Activity,
    title: "Sub-60s Live Spot Feeds",
    desc: "Direct polling engines synchronize Nifty 50, physical bullion, and mutual fund NAVs continuously in the background.",
    color: "emerald" as const
  },
  {
    icon: Bot,
    title: "Zero-Data AI Isolation",
    desc: "Financial insights run locally or via zero-retention privacy APIs. Your financial history is never stored or used to train models.",
    color: "indigo" as const
  },
  {
    icon: Layers,
    title: "Offline-First Resilience",
    desc: "Instant sub-millisecond local cache with intelligent background reconciliation when network returns.",
    color: "cyan" as const
  }
]

const FAQ_ITEMS = [
  {
    q: "How does Bun Vault keep my financial records private and secure?",
    a: "Bun Vault is architected on Supabase Row-Level Security (RLS). Every query is enforced at the database kernel level with cryptographic tokens. We do not sell user data, utilize ad trackers, or share records with third parties."
  },
  {
    q: "How accurate are the 24K Gold, Silver, and Nifty 50 spot rates?",
    a: "Our market synchronization engine connects directly to live bullion feeds and Indian market quotes, auto-refreshing spot rates every 60 seconds so your portfolio valuation is always up to date."
  },
  {
    q: "Can I manage multiple bank accounts and credit cards?",
    a: "Yes. Bun Vault provides a unified cash flow velocity ledger supporting SBI, HDFC, ICICI savings accounts, and credit cards like Utkarsh CC with real-time limit tracking and expense classification."
  },
  {
    q: "What makes the 3D Apple & Revolut experience unique?",
    a: "Bun Vault combines spatial 3D physics, WebGL hardware acceleration, and frosted glassmorphic UI tokens to deliver the smoothest, most luxurious wealth management experience available."
  }
]

export default function LuxuryLandingPage() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Track global scroll for Three.js WebGL background
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrollProgress(latest)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  const handleNavigate = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => router.push(path), 600)
  }

  return (
    <div className="min-h-screen bg-[#06080C] text-slate-100 selection:bg-[#F4C542] selection:text-slate-950 font-sans overflow-x-hidden relative">
      
      {/* 3D WEBGL BACKGROUND CANVAS */}
      <ThreeVaultCanvas scrollProgress={scrollProgress} />

      {/* TRANSITION OVERLAY */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#040609] z-[99999] flex flex-col items-center justify-center gap-6 backdrop-blur-3xl"
          >
            <div className="relative h-24 w-24 rounded-3xl gold-gradient-bg p-[2.5px] shadow-2xl shadow-amber-500/30 animate-pulse">
              <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[22px] overflow-hidden">
                <img src="/logo.png" className="h-14 w-14 object-contain" alt="Bun Vault" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-white font-bold text-2xl tracking-[0.25em] font-mono">ENTERING BUN VAULT</h2>
              <p className="text-[#F4C542] text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
                Initializing your private 3D environment...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          1. STICKY FROSTED GLASS HEADER
         ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#06080C]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl gold-gradient-bg p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[14px] overflow-hidden">
                <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-xl text-white font-mono leading-none flex items-center gap-1.5">
                BUN VAULT <span className="text-[10px] px-2 py-0.5 rounded gold-gradient-bg text-slate-950 font-bold tracking-widest">3D PRO</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                Sovereign Wealth Operating System
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono font-semibold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
            <span>3D SPATIAL ENGINE</span>
            <span className="text-slate-600">•</span>
            <span className="text-[#F4C542]">100% PRIVATE & ENCRYPTED</span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => handleNavigate("/login")}
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-white/10"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigate("/dashboard")}
              className="gold-gradient-bg text-slate-950 font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              Enter Vault <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
          </nav>

        </div>
      </header>

      {/* =========================================================================
          2. LIVE SPOT TICKER BAR
         ========================================================================= */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-[#0A0D14]/90 border-b border-white/10 py-2 overflow-hidden font-mono select-none backdrop-blur-md">
        <div className="ticker-track">
          {[...LIVE_TICKERS, ...LIVE_TICKERS, ...LIVE_TICKERS].map((t, idx) => (
            <div key={idx} className="flex items-center gap-2.5 px-6 whitespace-nowrap text-xs">
              <span className="font-extrabold text-slate-400">{t.label}</span>
              <span className="font-bold text-white">{t.value}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${t.up ? 'bg-[#00E676]/15 text-[#00E676]' : 'bg-destructive/15 text-destructive'}`}>
                {t.change}
              </span>
              <span className="text-slate-700 ml-3">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          3. HERO SECTION (3D Spatial Perspective & Physics)
         ========================================================================= */}
      <section className="pt-52 pb-32 relative min-h-screen flex items-center justify-center overflow-hidden">
        
        {/* Subtle Spatial Mesh Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #262B34 1px, transparent 1px), linear-gradient(to bottom, #262B34 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10 text-center space-y-10">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#F4C542]/40 bg-[#F4C542]/10 text-[#F4C542] text-xs font-mono font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10"
          >
            <Sparkles className="h-4 w-4" /> REVOLUTIONARY 3D WEALTH ARCHITECTURE
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Private Wealth Management In{" "}
              <span className="gold-gradient-text">Pure 3D Dimension</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Consolidate your Indian equities, 24K physical gold, mutual funds, and dual-card bank cash flows into an institutional-grade, zero-knowledge vault.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => handleNavigate("/dashboard")}
              className="w-full sm:w-auto gold-gradient-bg text-slate-950 font-extrabold text-sm sm:text-base px-8 py-4 rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              Launch Private Vault <ArrowRight className="h-5 w-5 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleNavigate("/expenses")}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-slate-200 font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2"
            >
              Explore Cash Flow Ledger
            </button>
          </motion.div>

          {/* 3D Interactive Hero Preview Card (Framer Motion Tilt & Glare) */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="max-w-4xl mx-auto pt-6"
          >
            <ThreeDCard glowColor="gold" depth={40}>
              <div className="space-y-6">
                
                {/* Internal Hero Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl gold-gradient-bg p-[1px] flex items-center justify-center">
                      <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                        <Award className="h-6 w-6 text-[#F4C542]" />
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-mono font-bold text-[#F4C542]">EXECUTIVE PORTFOLIO</div>
                      <div className="text-lg font-extrabold text-white">Consolidated Sovereign Wealth</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> HEALTH SCORE 94/100
                    </span>
                  </div>
                </div>

                {/* 3 Core Pillars in Hero Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-xs text-slate-400 font-mono block">CAPITAL DEPLOYED</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">₹4,25,000.00</span>
                    <span className="text-[11px] text-slate-400 font-mono">Principal Invested</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-xs text-slate-400 font-mono block">PORTFOLIO VALUATION</span>
                    <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">₹6,08,595.40</span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">+₹1,83,595.40 (+43.2%)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-xs text-slate-400 font-mono block">24K PHYSICAL GOLD</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">₹14,826.00</span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">+0.52% Spot Rate (1g)</span>
                  </div>
                </div>

                {/* Quick Hint */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> AES-256 ZERO-KNOWLEDGE
                  </span>
                  <span>MOVE CURSOR TO TILT IN 3D SPACE</span>
                </div>

              </div>
            </ThreeDCard>
          </motion.div>

          {/* Social Proof Badges */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>₹100Cr+ ASSETS MONITORED</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>SUB-MINUTE REAL-TIME TICKER</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>ZERO TRACKERS OR COOKIES</span>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          4. STICKY 3D SCROLL STORY (4 Chapters)
         ========================================================================= */}
      <ScrollStory3D />

      {/* =========================================================================
          5. 3D BENTO GRID ARCHITECTURE (Taste Skill / Impeccable)
         ========================================================================= */}
      <BentoFeatures3D />

      {/* =========================================================================
          6. 3D INTERACTIVE WEALTH & COMPOUNDING SIMULATOR
         ========================================================================= */}
      <WealthSimulator3D />

      {/* =========================================================================
          7. HOLOGRAPHIC SECURITY PILLARS
         ========================================================================= */}
      <section className="py-24 relative bg-[#06080C] text-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> FORTRESS ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Cryptographically Isolated <span className="text-[#F4C542]">Security</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Your financial records are your sovereignty. Bun Vault is architected from the database up to ensure zero unauthorized access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_PILLARS.map((p, idx) => (
              <ThreeDCard key={idx} glowColor={p.color} depth={25}>
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <p.icon className="h-6 w-6 text-[#F4C542]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              </ThreeDCard>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          8. INTERACTIVE FAQ ACCORDION
         ========================================================================= */}
      <section className="py-24 relative bg-[#06080C] text-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-white/5 text-slate-300 text-xs font-mono font-bold tracking-widest uppercase">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-colors hover:border-white/20"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-bold text-base text-white">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#F4C542]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          9. 3D GRAND CTA PORTAL & FOOTER
         ========================================================================= */}
      <footer className="pt-20 pb-16 relative bg-[#040609] border-t border-white/10 text-slate-400 text-xs overflow-hidden">
        
        {/* Ambient Portal Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-16">
          
          {/* Grand CTA Banner */}
          <div className="rounded-3xl p-8 sm:p-14 border border-[#F4C542]/30 bg-gradient-to-b from-[#111624] to-[#0A0D15] text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[#F4C542] font-mono font-bold text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> SECURE YOUR FINANCIAL FUTURE
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Ready to Experience the Sovereign Wealth Vault?
            </h2>

            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Step into high-velocity financial clarity. Completely private, real-time sync, and intelligent wealth compounding.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="w-full sm:w-auto gold-gradient-bg text-slate-950 font-extrabold text-sm px-8 py-4 rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                Enter Bun Vault Now <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Footer Bottom Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Bun Vault" className="h-6 w-6 object-contain" />
              <span className="font-mono font-bold text-white tracking-wider">BUN VAULT · 3D EXECUTIVE EDITION</span>
            </div>

            <div className="flex items-center gap-6 font-mono text-[11px]">
              <Link href="/dashboard" className="hover:text-white transition-colors">DASHBOARD</Link>
              <Link href="/expenses" className="hover:text-white transition-colors">EXPENSES</Link>
              <Link href="/holdings" className="hover:text-white transition-colors">HOLDINGS</Link>
              <Link href="/watchlist" className="hover:text-white transition-colors">WATCHLIST</Link>
              <Link href="/sip-planner" className="hover:text-white transition-colors">SIP PLANNER</Link>
            </div>

            <div className="font-mono text-slate-500 text-[11px]">
              © {new Date().getFullYear()} Bun Vault. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
