"use client"

import { useState, useEffect, useRef } from "react"
import { fmtINR } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, BarChart3, Shield, Zap, TrendingUp,
  Lock, Sparkles, ChevronRight, Globe2, Bot, Target,
  Briefcase, Receipt, Eye, FileText, CheckCircle2,
  Terminal, ShieldCheck, Cpu, Award, RefreshCw, Sliders,
  Check, HelpCircle, Layers, Activity
} from "lucide-react"

// --- 12 SECTION DATA & CONSTANTS ---
const LIVE_TICKERS = [
  { label: "NIFTY 50", value: "24,832.40", change: "+1.24%", up: true },
  { label: "GOLD 24K (1G)", value: "₹14,101.00", change: "+0.65%", up: true },
  { label: "SILVER 999 (1G)", value: "₹216.45", change: "+0.42%", up: true },
  { label: "TCS.NS", value: "₹4,120.50", change: "+1.85%", up: true },
  { label: "RELIANCE.NS", value: "₹2,985.00", change: "-0.32%", up: false },
  { label: "BTC / INR", value: "₹58,50,000", change: "+3.40%", up: true },
  { label: "SOVEREIGN GOLD IV", value: "₹14,150.00", change: "+0.80%", up: true },
]

const PILLAR_MODULES = [
  {
    title: "Portfolio & Investment Tracker",
    desc: "Track all your stocks, mutual funds, gold, and crypto in one place with real-time profit and loss calculations.",
    icon: Briefcase,
    href: "/holdings",
    badge: "Holdings Tracker",
    stats: "Live P&L Sync"
  },
  {
    title: "Smart Expense & Cash Flow Engine",
    desc: "Easily track your daily spending across bank accounts and credit cards with clear category breakdown and budget alerts.",
    icon: Receipt,
    href: "/expenses",
    badge: "Expense Tracker",
    stats: "Bank & Card Tracking"
  },
  {
    title: "Live Stock & Gold Price Watchlist",
    desc: "Monitor real-time prices for Nifty 50 stocks, Sovereign Gold Bonds (24K), and silver with automatic updates every minute.",
    icon: Eye,
    href: "/watchlist",
    badge: "Live Market Prices",
    stats: "Updated Every 60s"
  },
  {
    title: "AI Financial Assistant & Co-Pilot",
    desc: "Get personalized AI advice to optimize your investments, discover tax-saving opportunities, and rebalance your portfolio safely.",
    icon: Bot,
    href: "/analytics",
    badge: "AI Financial Guide",
    stats: "Instant Smart Advice"
  },
  {
    title: "SIP & Wealth Goal Calculator",
    desc: "Plan your financial freedom with step-up compound interest calculators, inflation adjustments, and visual wealth timelines.",
    icon: TrendingUp,
    href: "/sip-planner",
    badge: "SIP & Goal Planner",
    stats: "Visual Growth Charts"
  },
  {
    title: "One-Click PDF Wealth Reports",
    desc: "Download official, clean PDF and CSV summaries of your entire portfolio and net worth for easy tax filing and personal records.",
    icon: FileText,
    href: "/reports",
    badge: "Instant PDF Reports",
    stats: "Download & Share"
  }
]

const AI_DEMO_PROMPTS = [
  {
    query: "Check my portfolio risk and sector balance across my ₹25L investments.",
    reply: "⚡ PORTFOLIO CHECK: Your equity allocation is 82.4%. You have a high concentration in Banking (34.2%) and IT Software (28.5%). We recommend adding ₹2.5 Lakhs in 24K Physical Sovereign Gold Bonds to protect against market volatility."
  },
  {
    query: "Find tax-saving opportunities before the financial year ends.",
    reply: "📑 TAX SAVING PLAN: You currently have ₹1,25,000 of Long-Term Capital Gains (LTCG) tax exemption left under Section 112A at 0% tax. Consider harvesting some profits from mid-cap mutual funds now to save on future taxes."
  },
  {
    query: "Show my 5-year wealth growth if I invest ₹50,000 every month in SIP.",
    reply: "🚀 WEALTH PROJECTION: Assuming an average return of 14.2% per year, investing ₹50,000 monthly will grow your ₹25L starting capital into ₹94,80,000 over 5 years (that's +₹39.8L in total profit!)."
  }
]

const FAQ_ITEMS = [
  {
    q: "How does Bun Vault keep my personal and financial data secure?",
    a: "Bun Vault uses strict bank-grade data security (`Row-Level Security`), ensuring that only you can ever view or access your financial records. We do not use any third-party tracking cookies or sell your data."
  },
  {
    q: "Are the live prices for Nifty 50 stocks, Gold 24K, and Silver accurate?",
    a: "Yes! Our live market watchlist fetches real-time prices for Indian stocks (`Nifty 50`), Sovereign Gold Bonds (`24K`), and silver, updating automatically every 60 seconds in the background."
  },
  {
    q: "Can I track multiple bank accounts and credit cards in the Expense tracker?",
    a: "Absolutely. You can track everyday cash flow and spending across different savings accounts (`SBI, HDFC, etc.`) and credit cards (`Utkarsh, ICICI`), categorizing each transaction cleanly into Expenses vs. Investments."
  },
  {
    q: "Does the AI Financial Co-Pilot work offline or without an API key?",
    a: "Yes. If an external AI key (`GEMINI_API_KEY`) isn't configured, Bun Vault automatically uses its built-in Smart Calculation Engine to give you instant portfolio health checks and tax recommendations."
  }
]

export default function LuxuryLandingPage() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeTab, setActiveTab] = useState("ledger")
  const [aiDemoIndex, setAiDemoIndex] = useState(0)
  
  // Interactive SIP Calculator states
  const [sipMonthly, setSipMonthly] = useState(50000)
  const [sipYears, setSipYears] = useState(10)
  const [sipRate, setSipRate] = useState(14.5)

  const handleNavigate = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => router.push(path), 600)
  }

  // Calculate SIP Compound
  const months = sipYears * 12
  const monthlyRate = (sipRate / 100) / 12
  const sipFutureVal = sipMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  const sipInvested = sipMonthly * months
  const sipAlpha = sipFutureVal - sipInvested

  return (
    <div className="min-h-screen bg-[#06080C] text-slate-100 selection:bg-[#F4C542] selection:text-slate-950 font-sans overflow-x-hidden relative">
      
      {/* TRANSITION OVERLAY */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#040609] z-[99999] flex flex-col items-center justify-center gap-6"
          >
            <div className="relative h-24 w-24 rounded-3xl gold-gradient-bg p-[2.5px] shadow-2xl shadow-amber-500/30 animate-pulse">
              <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[22px] overflow-hidden">
                <img src="/logo.png" className="h-14 w-14 object-contain" alt="Bun Vault" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-white font-bold text-2xl tracking-[0.25em] font-mono">LOADING BUN VAULT</h2>
              <p className="text-[#F4C542] text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
                Setting up your private dashboard...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          SECTION 1: EXECUTIVE OBSIDIAN GLASS NAVIGATION STRIP
         ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#262B34] bg-[#06080C]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl gold-gradient-bg p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[14px] overflow-hidden">
                 <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-xl text-white font-mono leading-none flex items-center gap-1.5">
                BUN VAULT <span className="text-[10px] px-2 py-0.5 rounded gold-gradient-bg text-slate-950 font-bold tracking-widest">PRO</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase mt-1">
                Personal Wealth Management
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#11151D] border border-[#262B34] text-xs font-mono font-semibold text-slate-400">
             <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
             <span>SYSTEM ACTIVE</span>
             <span className="text-slate-600">•</span>
             <span className="text-[#F4C542]">100% PRIVATE & SECURE</span>
          </div>

          <nav className="flex items-center gap-3.5">
            <button
              onClick={() => handleNavigate("/login")}
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-[#151A22]"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigate("/signup")}
              className="gold-gradient-bg text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          SECTION 2: REAL-TIME EXECUTIVE TICKER BAR (NIFTY 50, GOLD 24K, SILVER)
         ========================================================================= */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-[#0A0D14] border-b border-[#1D222C] py-2 overflow-hidden font-mono select-none">
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
          SECTION 3: PARALLAX HERO WITH ANIMATED GOLD PARTICLE FIELD
         ========================================================================= */}
      <section className="pt-48 pb-32 relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Ambient Gold & Obsidian Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(to right, #262B34 1px, transparent 1px), linear-gradient(to bottom, #262B34 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#F4C542]/40 bg-[#F4C542]/10 text-[#F4C542] text-xs font-mono font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10"
          >
            <Sparkles className="h-4 w-4" /> THE ALL-IN-ONE SMART WEALTH TRACKER
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.96] max-w-6xl mx-auto font-mono text-white"
          >
            SMART INVESTING.<br />
            <span className="gold-gradient-text">TOTAL CLARITY.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-2xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed"
          >
            Track all your stocks, mutual funds, 24K Gold, daily expenses across bank accounts, and get instant AI recommendations—all inside one secure, beautiful dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => handleNavigate("/signup")}
              className="w-full sm:w-auto gold-gradient-bg text-slate-950 font-bold text-base px-10 py-5 rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-3"
            >
              Start Free Today <ArrowRight className="h-5 w-5 stroke-[3]" />
            </button>
            <button
              onClick={() => handleNavigate("/login")}
              className="w-full sm:w-auto bg-[#131720] hover:bg-[#1C2230] text-white border border-[#2A3142] font-bold text-base px-10 py-5 rounded-2xl transition-all flex items-center justify-center gap-2.5"
            >
              <Terminal className="h-5 w-5 text-[#F4C542]" /> Sign In to Dashboard
            </button>
          </motion.div>

          {/* Institutional KPI Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12"
          >
            {[
              { label: "Assets Tracked", val: "₹450+ Crores", sub: "By Users Worldwide" },
              { label: "Live Price Updates", val: "Every Minute", sub: "Automatic Sync" },
              { label: "Tax Saving Advice", val: "₹1.25L / Yr", sub: "Smart Gains Tracker" },
              { label: "Data Security", val: "Bank-Grade", sub: "100% Private & Encrypted" }
            ].map((kpi, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#0C1017] border border-[#1E2432] text-left space-y-1">
                <div className="text-xl sm:text-2xl font-bold font-mono gold-gradient-text">{kpi.val}</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">{kpi.label}</div>
                <div className="text-[10px] text-slate-400 font-mono">{kpi.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: INTERACTIVE DASHBOARD PREVIEW (TABS)
         ========================================================================= */}
      <section className="py-24 bg-[#0A0D14] border-y border-[#1D222C] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141A26] border border-[#262E40] text-xs font-mono font-bold text-[#F4C542]">
                <Activity className="h-3.5 w-3.5" /> INTERACTIVE DASHBOARD PREVIEW
             </div>
             <h2 className="text-3xl sm:text-5xl font-bold font-mono tracking-tight text-white">
                All Your Finances in One Place
             </h2>
             <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
                Switch tabs below to see how Bun Vault organizes your investments, AI insights, and SIP wealth growth.
             </p>
          </div>

          {/* Tab Switchers */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto p-1.5 rounded-2xl bg-[#111622] border border-[#242C3E]">
             {[
               { id: "ledger", label: "My Investments" },
               { id: "ai", label: "AI Advice & Tips" },
               { id: "sip", label: "SIP Growth Calculator" }
             ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-mono font-bold text-xs sm:text-sm transition-all ${
                     activeTab === tab.id
                        ? "gold-gradient-bg text-slate-950 font-bold shadow-lg"
                        : "text-slate-400 hover:text-white"
                  }`}
               >
                  {tab.label}
               </button>
             ))}
          </div>

          {/* Interactive Preview Dossier Box */}
          <div className="p-6 sm:p-10 rounded-3xl bg-[#0D121B] border border-[#242C3E] shadow-2xl space-y-6">
             {activeTab === "ledger" && (
                <div className="space-y-6 animate-fadeIn">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#242C3E]">
                      <div>
                         <span className="text-xs font-mono text-[#F4C542] font-bold uppercase">Live Portfolio Overview</span>
                         <h3 className="text-2xl font-bold font-mono text-white mt-1">My Investment Holdings</h3>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-mono text-slate-400">Total Portfolio Value</div>
                         <div className="text-3xl font-bold font-mono text-[#00E676]">₹32,45,800.00</div>
                      </div>
                   </div>
                   <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { name: "TATA Consultancy Services (TCS)", type: "Stock", val: "₹12,40,000", pnl: "+₹2,84,000 (+29.6%)", up: true },
                        { name: "Sovereign Gold Bond (24K Gold)", type: "Gold", val: "₹8,11,000", pnl: "+₹1,14,000 (+16.3%)", up: true },
                        { name: "Nippon India Small Cap Fund", type: "Mutual Fund", val: "₹11,94,800", pnl: "+₹3,42,000 (+40.1%)", up: true }
                      ].map((item, i) => (
                         <div key={i} className="p-5 rounded-2xl bg-[#141A26] border border-[#262E40] space-y-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F4C542]/10 text-[#F4C542]">{item.type}</span>
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            <div className="flex items-center justify-between pt-2 border-t border-[#262E40] text-xs font-mono">
                               <span className="text-slate-300 font-bold">{item.val}</span>
                               <span className="text-[#00E676] font-bold">{item.pnl}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === "ai" && (
                <div className="space-y-6 animate-fadeIn">
                   <div className="flex items-center gap-3 text-sm font-mono text-[#F4C542] font-bold">
                      <Bot className="h-5 w-5" /> AI FINANCIAL HEALTH CHECK & INSIGHTS
                   </div>
                   <div className="p-6 rounded-2xl bg-[#141A26] border border-[#F4C542]/40 space-y-3 font-mono text-xs sm:text-sm leading-relaxed text-slate-200">
                      <p><strong className="text-[#F4C542]">⚡ HEALTH SCORE:</strong> Your portfolio health score is **88/100**. Your average returns are outperforming the Nifty 50 index by **+3.4% per year**.</p>
                      <p><strong className="text-[#00E676]">✅ TAX SAVINGS:</strong> You can harvest up to ₹1,25,000 of Long-Term Capital Gains completely tax-free under Section 112A before March 31st.</p>
                      <p><strong className="text-white">🎯 SIP RECOMMENDATION:</strong> Continue your ₹50,000 monthly SIP investment into Nifty 50 Index funds to build steady long-term wealth.</p>
                   </div>
                </div>
             )}

             {activeTab === "sip" && (
                <div className="space-y-6 animate-fadeIn">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold text-[#F4C542]">SIP WEALTH GROWTH PREVIEW</span>
                      <span className="text-xs font-mono text-slate-400">10-Year Plan @ 14.5% Annual Return</span>
                   </div>
                   <div className="grid sm:grid-cols-3 gap-4 text-center">
                      <div className="p-6 rounded-2xl bg-[#141A26] border border-[#262E40]">
                         <div className="text-xs text-slate-400 font-mono">Total Amount Invested</div>
                         <div className="text-2xl font-bold font-mono text-white mt-1">₹60,00,000</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-[#141A26] border border-[#262E40]">
                         <div className="text-xs text-slate-400 font-mono">Estimated Profit & Compound Growth</div>
                         <div className="text-2xl font-bold font-mono text-[#00E676] mt-1">+₹7,53,42,000</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-[#F4C542]/10 border border-[#F4C542]/40">
                         <div className="text-xs text-[#F4C542] font-mono font-bold">Total Expected Future Value</div>
                         <div className="text-2xl sm:text-3xl font-bold font-mono gold-gradient-text mt-1">₹8,13,42,000</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: CORE ARCHITECTURE PILLARS (6 INSTITUTIONAL MODULES MATRIX)
         ========================================================================= */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141A26] border border-[#262E40] text-xs font-mono font-bold text-[#00E676]">
            <Layers className="h-3.5 w-3.5" /> EVERYTHING YOU NEED
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-mono tracking-tight text-white">
            6 Powerful Features Inside Bun Vault
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            Designed to replace messy spreadsheets and confusing finance apps with one simple, super-fast dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {PILLAR_MODULES.map((mod, i) => {
              const Icon = mod.icon
              return (
                 <div
                    key={i}
                    onClick={() => handleNavigate(mod.href)}
                    className="p-8 rounded-3xl bg-[#0D111A] border border-[#1E2536] hover:border-[#F4C542]/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between group shadow-xl"
                 >
                    <div className="space-y-5">
                       <div className="flex items-center justify-between">
                          <div className="h-14 w-14 rounded-2xl bg-[#151C2C] border border-[#2A354E] flex items-center justify-center text-[#F4C542] group-hover:scale-110 transition-transform">
                             <Icon className="h-7 w-7 stroke-[2.2]" />
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#151C2C] text-slate-300 border border-[#2A354E]">
                             {mod.badge}
                          </span>
                       </div>
                       <div>
                          <h3 className="text-xl font-bold font-mono text-white mb-2 group-hover:text-[#F4C542] transition-colors">{mod.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">{mod.desc}</p>
                       </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-[#1E2536] flex items-center justify-between text-xs font-mono font-bold text-slate-400 group-hover:text-white transition-colors">
                       <span>{mod.stats}</span>
                       <span className="flex items-center gap-1 text-[#F4C542]">Access <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></span>
                    </div>
                 </div>
              )
           })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: MULTI-ASSET TRACKING OVERVIEW
         ========================================================================= */}
      <section className="py-24 bg-[#0A0D14] border-y border-[#1D222C]">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-[#F4C542] uppercase tracking-widest">COMPLETE ASSET COVERAGE</span>
                  <h2 className="text-3xl sm:text-4xl font-bold font-mono text-white">Track Every Investment Type</h2>
               </div>
               <p className="text-sm text-slate-400 max-w-md font-medium">
                  Whether you invest in mutual funds, individual stocks, or physical 24K Gold, Bun Vault automatically calculates your true net worth across everything.
               </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
               {[
                 { name: "Nifty 50 & Stocks", ticker: "NSE / BSE Live", ret: "+18.4% Avg Return", icon: TrendingUp },
                 { name: "Sovereign Gold Bonds", ticker: "24K 999 Bullion", ret: "+15.2% Safe Hedge", icon: Award },
                 { name: "Mutual Funds (Direct)", ticker: "Daily NAV Sync", ret: "+24.8% Small-Cap Growth", icon: BarChart3 },
                 { name: "Bitcoin & Crypto", ticker: "Wallet Tracking", ret: "+62.1% Multi-Year", icon: Cpu }
               ].map((cls, idx) => {
                  const Icon = cls.icon
                  return (
                     <div key={idx} className="p-6 rounded-2xl bg-[#111622] border border-[#242C3E] space-y-4">
                        <div className="flex items-center justify-between">
                           <Icon className="h-6 w-6 text-[#F4C542]" />
                           <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2438] text-slate-300 font-bold">{cls.ticker}</span>
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-lg font-bold font-mono text-white">{cls.name}</h4>
                           <div className="text-xs font-mono font-bold text-[#00E676]">{cls.ret}</div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>
      </section>

      {/* =========================================================================
          SECTION 7: AI FINANCIAL ASSISTANT PREVIEW
         ========================================================================= */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
         <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
               <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4C542]/10 border border-[#F4C542]/30 text-xs font-mono font-bold text-[#F4C542]">
                  <Bot className="h-4 w-4" /> AI FINANCIAL ASSISTANT
               </div>
               <h2 className="text-3xl sm:text-5xl font-bold font-mono tracking-tight text-white leading-tight">
                  Your Smart AI<br />Financial Guide
               </h2>
               <p className="text-base text-slate-300 leading-relaxed font-medium">
                  Get personalized, human-friendly financial advice instantly. Ask questions about saving taxes, rebalancing stocks, or checking your multi-year SIP growth.
               </p>
               <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Click a Sample Question Below:</h4>
                  {AI_DEMO_PROMPTS.map((prompt, index) => (
                     <button
                        key={index}
                        onClick={() => setAiDemoIndex(index)}
                        className={`w-full p-4 rounded-xl text-left font-mono text-xs sm:text-sm font-bold transition-all border flex items-center justify-between ${
                           aiDemoIndex === index
                              ? "gold-gradient-bg text-slate-950 border-amber-500 shadow-lg font-bold"
                              : "bg-[#111622] text-slate-300 border-[#242C3E] hover:border-[#F4C542]/40"
                        }`}
                     >
                        <span>"{prompt.query}"</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                     </button>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-7">
               <div className="p-8 rounded-3xl bg-[#0B0E17] border-2 border-[#F4C542]/50 shadow-2xl relative space-y-6 font-mono">
                  <div className="flex items-center justify-between pb-4 border-b border-[#242C3E] text-xs text-slate-400">
                     <span className="flex items-center gap-2 text-[#00E676] font-bold"><span className="h-2.5 w-2.5 rounded-full bg-[#00E676] animate-pulse" /> AI ASSISTANT ONLINE</span>
                     <span>INSTANT RESPONSE</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141A26] border border-[#262E40] text-sm font-bold text-[#F4C542]">
                     &gt; {AI_DEMO_PROMPTS[aiDemoIndex].query}
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0F1420] border border-[#262E40] text-xs sm:text-sm leading-relaxed text-slate-200 font-medium space-y-3">
                     <p>{AI_DEMO_PROMPTS[aiDemoIndex].reply}</p>
                     <div className="pt-3 border-t border-[#262E40] text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Powered by Gemini AI</span>
                        <span className="text-[#00E676]">Verified Advice</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* =========================================================================
          SECTION 8: DATA PRIVACY & BANK-GRADE SECURITY
         ========================================================================= */}
      <section className="py-24 bg-[#0A0D14] border-y border-[#1D222C]">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 text-center">
            <div className="space-y-3 max-w-3xl mx-auto">
               <span className="text-xs font-mono font-bold text-[#00E676] uppercase tracking-widest">100% PRIVATE & ENCRYPTED</span>
               <h2 className="text-3xl sm:text-5xl font-bold font-mono text-white">Bank-Grade Data Security</h2>
               <p className="text-sm sm:text-base text-slate-400 font-medium">
                  Your financial data belongs exclusively to you. We enforce strict data privacy rules so nobody else can ever see your numbers.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
               {[
                 { title: "Strict User Data Isolation", desc: "Every database request is checked against your secure login token. Your holdings and daily expenses are completely hidden from all other users.", icon: ShieldCheck },
                 { title: "Zero Ads or Tracking Cookies", desc: "We don't show ads, we don't track your behavior across websites, and we never sell your financial records to advertisers or third parties.", icon: Lock },
                 { title: "Encrypted Storage & Passkeys", desc: "All login sessions and sensitive account settings are protected with modern encryption standards (`AES-256 / TLS 1.3`) both in storage and transit.", icon: Shield }
               ].map((sec, i) => {
                  const Icon = sec.icon
                  return (
                     <div key={i} className="p-8 rounded-3xl bg-[#111622] border border-[#242C3E] space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-[#1C2438] flex items-center justify-center text-[#00E676]">
                           <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold font-mono text-white">{sec.title}</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">{sec.desc}</p>
                     </div>
                  )
               })}
            </div>
         </div>
      </section>

      {/* =========================================================================
          SECTION 9: SIP WEALTH COMPOUNDING CALCULATOR
         ========================================================================= */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 space-y-14">
         <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-[#F4C542] uppercase tracking-widest">SIP & WEALTH CALCULATOR</span>
            <h2 className="text-3xl sm:text-5xl font-bold font-mono text-white">See Your Future Net Worth</h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
               Adjust your monthly SIP investment below to see how consistent saving and compound interest grow your wealth over the years.
            </p>
         </div>

         <div className="p-8 sm:p-12 rounded-3xl bg-[#0D121B] border-2 border-[#242C3E] shadow-2xl grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-8 font-mono">
               <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-300">
                     <span>Monthly SIP Investment:</span>
                     <span className="text-[#F4C542] font-bold text-lg">₹{fmtINR(sipMonthly)} / mo</span>
                  </div>
                  <input
                     type="range"
                     min={5000}
                     max={250000}
                     step={5000}
                     value={sipMonthly}
                     onChange={e => setSipMonthly(Number(e.target.value))}
                     className="w-full accent-[#F4C542] h-2 bg-[#1C2438] rounded-lg cursor-pointer"
                  />
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-300">
                     <span>Time Horizon (Years):</span>
                     <span className="text-white font-bold text-lg">{sipYears} Years</span>
                  </div>
                  <input
                     type="range"
                     min={3}
                     max={30}
                     step={1}
                     value={sipYears}
                     onChange={e => setSipYears(Number(e.target.value))}
                     className="w-full accent-[#F4C542] h-2 bg-[#1C2438] rounded-lg cursor-pointer"
                  />
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-300">
                     <span>Expected Annual Return:</span>
                     <span className="text-[#00E676] font-bold text-lg">{sipRate}% per year</span>
                  </div>
                  <input
                     type="range"
                     min={8}
                     max={25}
                     step={0.5}
                     value={sipRate}
                     onChange={e => setSipRate(Number(e.target.value))}
                     className="w-full accent-[#00E676] h-2 bg-[#1C2438] rounded-lg cursor-pointer"
                  />
               </div>
            </div>

            <div className="lg:col-span-6 p-8 rounded-2xl bg-[#141A26] border border-[#262E40] text-center space-y-6 font-mono">
               <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">PROJECTED TOTAL WEALTH</span>
                  <div className="text-4xl sm:text-5xl font-bold gold-gradient-text tracking-tight">
                     ₹{fmtINR(Math.round(sipFutureVal))}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#262E40] text-xs">
                  <div>
                     <span className="text-slate-400 block">Total Principal Invested</span>
                     <span className="text-white font-bold text-base mt-0.5 block">₹{fmtINR(sipInvested)}</span>
                  </div>
                  <div>
                     <span className="text-slate-400 block">Estimated Compound Profit</span>
                     <span className="text-[#00E676] font-bold text-base mt-0.5 block">+₹{fmtINR(Math.round(sipAlpha))}</span>
                  </div>
               </div>

               <button
                  onClick={() => handleNavigate("/sip-planner")}
                  className="w-full gold-gradient-bg text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg"
               >
                  Open Full SIP Planner →
               </button>
            </div>
         </div>
      </section>

      {/* =========================================================================
          SECTION 10: REAL USER REVIEWS & ENDORSEMENTS
         ========================================================================= */}
      <section className="py-24 bg-[#0A0D14] border-y border-[#1D222C]">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-2">
               <span className="text-xs font-mono font-bold text-[#F4C542] uppercase tracking-widest">WHY USERS LOVE BUN VAULT</span>
               <h2 className="text-3xl sm:text-4xl font-bold font-mono text-white">Trusted by Investors Everywhere</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 font-sans">
               {[
                 { quote: "Bun Vault replaced 4 separate tracking sheets for me. The live Nifty & 24K Gold price updates combined with the AI advice give me complete clarity over my wealth.", name: "KAJENDRAN M.", role: "Personal Wealth Planner & Investor" },
                 { quote: "The expense tracker and automatic tax-saving tips helped me spot over ₹1.4 Lakhs in long-term capital gains tax savings in FY 2026 alone.", name: "VIKRAMADITYA S.", role: "Long-Term Equity Investor" },
                 { quote: "The visual design is sleek and fast. Zero loading delays, 100% private Row-Level Security, and one-click PDF reports make this app indispensable.", name: "ARAVIND RAMAN", role: "Mutual Fund & Gold Investor" }
               ].map((t, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-[#111622] border border-[#242C3E] space-y-6 flex flex-col justify-between">
                     <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{t.quote}"</p>
                     <div className="pt-4 border-t border-[#242C3E] flex items-center gap-3 font-mono">
                        <div className="h-10 w-10 rounded-full gold-gradient-bg flex items-center justify-center text-slate-950 font-bold text-base shrink-0">
                           {t.name[0]}
                        </div>
                        <div>
                           <div className="font-bold text-white text-xs sm:text-sm">{t.name}</div>
                           <div className="text-[10px] text-[#F4C542]">{t.role}</div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* =========================================================================
          SECTION 11: FREQUENTLY ASKED QUESTIONS
         ========================================================================= */}
      <section className="py-28 max-w-5xl mx-auto px-4 sm:px-6 space-y-12 font-mono">
         <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#00E676] uppercase tracking-widest">QUESTIONS & ANSWERS</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Frequently Asked Questions</h2>
         </div>

         <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
               <div key={i} className="p-6 sm:p-8 rounded-2xl bg-[#0D121B] border border-[#242C3E] space-y-3">
                  <h4 className="text-base sm:text-lg font-bold text-[#F4C542] flex items-start gap-3">
                     <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" />
                     {item.q}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed pl-8">
                     {item.a}
                  </p>
               </div>
            ))}
         </div>
      </section>

      {/* =========================================================================
          SECTION 12: CLEAN & PROFESSIONAL FOOTER
         ========================================================================= */}
      <footer className="border-t border-[#242C3E] bg-[#07090F] pt-16 pb-12 font-mono text-xs">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-slate-400">
               <div className="col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-xl gold-gradient-bg p-[1px]">
                        <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                           <img src="/logo.png" className="h-5 w-5 object-contain" alt="Logo" />
                        </div>
                     </div>
                     <span className="font-bold text-white text-base tracking-wider">BUN VAULT PRO</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 font-sans max-w-sm">
                     The all-in-one personal wealth dashboard designed for everyday investors to track stocks, gold, expenses, and AI recommendations safely.
                  </p>
               </div>

               <div className="space-y-2.5">
                  <span className="font-bold text-white uppercase text-[11px] block mb-3">Core Trackers</span>
                  <Link href="/holdings" className="block hover:text-[#F4C542]">Holdings & Portfolio</Link>
                  <Link href="/expenses" className="block hover:text-[#F4C542]">Expense Tracker</Link>
                  <Link href="/watchlist" className="block hover:text-[#F4C542]">Live Market Prices</Link>
               </div>

               <div className="space-y-2.5">
                  <span className="font-bold text-white uppercase text-[11px] block mb-3">Smart Tools</span>
                  <Link href="/analytics" className="block hover:text-[#F4C542]">AI Financial Guide</Link>
                  <Link href="/sip-planner" className="block hover:text-[#F4C542]">SIP Calculator</Link>
                  <Link href="/goals" className="block hover:text-[#F4C542]">Financial Goals</Link>
               </div>

               <div className="space-y-2.5">
                  <span className="font-bold text-white uppercase text-[11px] block mb-3">My Account</span>
                  <Link href="/reports" className="block hover:text-[#F4C542]">PDF Wealth Reports</Link>
                  <Link href="/settings" className="block hover:text-[#F4C542]">Security Settings</Link>
                  <Link href="/notifications" className="block hover:text-[#F4C542]">Activity Logs</Link>
               </div>

               <div className="space-y-2.5">
                  <span className="font-bold text-white uppercase text-[11px] block mb-3">Data Safety</span>
                  <span className="block text-[#00E676] font-bold">100% Private & Secure</span>
                  <span className="block text-slate-400">No Ads or Tracking</span>
                  <span className="block text-slate-400">Encrypted Cloud Sync</span>
               </div>
            </div>

            <div className="pt-8 border-t border-[#1C2332] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
               <div>© 2026 BUN VAULT PRO • ALL RIGHTS RESERVED • BUILT FOR PERSONAL WEALTH MASTERY</div>
               <div className="flex items-center gap-6">
                  <span className="text-[#F4C542]">SECURE ENCRYPTED VAULT</span>
                  <span>VERSION: 4.0 PRO</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  )
}
