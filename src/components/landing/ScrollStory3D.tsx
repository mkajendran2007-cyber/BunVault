"use client"

import React, { useRef, useState } from "react"
import { motion, useScroll, AnimatePresence } from "framer-motion"
import { Briefcase, Receipt, Sparkles, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const CHAPTERS = [
  {
    id: "portfolio",
    step: "01",
    badge: "INSTITUTIONAL GRADE",
    title: "All-in-One Multi-Asset Aggregation",
    subtitle: "Real-time valuations across Indian Equities, Sovereign Gold Bonds, Mutual Funds & Crypto in a single synchronized ledger.",
    icon: Briefcase,
    color: "#D97706",
    glow: "shadow-amber-500/10",
    metrics: [
      { label: "Portfolio Value", val: "₹6,08,595.40", change: "+43.20%" },
      { label: "24K Gold Spot", val: "₹14,826 / g", change: "+0.52%" },
      { label: "Nifty Alpha", val: "1.84 Sharpe", change: "Top 5%" }
    ],
    features: [
      "Sub-minute real-time live ticker synchronization",
      "Automatic XIRR & Capital Gains tax categorizer",
      "Dynamic sector rebalancing & concentration shields"
    ]
  },
  {
    id: "expenses",
    step: "02",
    badge: "PRECISION CASH FLOW",
    title: "High-Velocity Expense & Card Tracking",
    subtitle: "Track SBI savings, Utkarsh Credit Card, and liquid cash with zero latency. Categorize expenses vs capital investments seamlessly.",
    icon: Receipt,
    color: "#16A34A",
    glow: "shadow-emerald-500/10",
    metrics: [
      { label: "Net Cash Balance", val: "₹82,450.00", change: "+12.4%" },
      { label: "Utkarsh CC Used", val: "₹14,250.00", change: "18% Limit" },
      { label: "Savings Rate", val: "48.5%", change: "Healthy" }
    ],
    features: [
      "Multi-account ledger with instant bank reconciliation",
      "Credit card billing cycle & limit utilization alarms",
      "One-tap quick transaction modal with smart autocomplete"
    ]
  },
  {
    id: "copilot",
    step: "03",
    badge: "AI INTELLIGENCE",
    title: "Apple AI Financial Co-Pilot",
    subtitle: "Trained on Indian tax code and modern portfolio theory. Discover LTCG tax harvesting and receive calibrated risk alerts 24/7.",
    icon: Sparkles,
    color: "#7C3AED",
    glow: "shadow-violet-500/10",
    metrics: [
      { label: "Tax Exemption Saved", val: "₹1,25,000", change: "Sec 112A" },
      { label: "Risk Health Score", val: "94 / 100", change: "Optimal" },
      { label: "Rebalance Opportunity", val: "2 Alerts", change: "Gold & Debt" }
    ],
    features: [
      "Section 112A LTCG tax harvesting recommendation engine",
      "Offline Smart Engine fallback when API keys are omitted",
      "Zero tracking or profiling — your data never leaves your vault"
    ]
  },
  {
    id: "compounding",
    step: "04",
    badge: "FUTURE PROJECTION",
    title: "Interactive Wealth & SIP Compounding",
    subtitle: "Simulate 5, 10, and 20-year multi-generational wealth accumulation with inflation adjustments and step-up compounding curves.",
    icon: TrendingUp,
    color: "#0284C7",
    glow: "shadow-cyan-500/10",
    metrics: [
      { label: "10-Yr Wealth Projection", val: "₹94.8 Lakhs", change: "14.5% CAGR" },
      { label: "Compounding Gain", val: "+₹39.8 Lakhs", change: "Profit" },
      { label: "Monthly Commitment", val: "₹50,000 / mo", change: "Step-Up 10%" }
    ],
    features: [
      "Dynamic visual growth timelines with inflation toggles",
      "Retirement & Financial Independence (FIRE) milestones",
      "One-click export to institutional PDF wealth dossiers"
    ]
  }
]

export default function ScrollStory3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Listen to scroll to update active chapter
  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const idx = Math.min(Math.floor(latest * CHAPTERS.length), CHAPTERS.length - 1)
      setActiveChapterIndex(idx)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  const activeChapter = CHAPTERS[activeChapterIndex]

  return (
    <section ref={containerRef} className="relative min-h-[380vh] bg-transparent text-foreground">
      {/* Sticky 3D Stage */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4 sm:px-8">
        
        {/* Dynamic Chapter Ambient Backlight */}
        <div
          className="absolute inset-0 transition-colors duration-1000 pointer-events-none opacity-20 dark:opacity-30"
          style={{
            background: `radial-gradient(circle at 60% 50%, ${activeChapter.color}20 0%, transparent 65%)`
          }}
        />

        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 py-12">
          
          {/* LEFT: Chapter Narrative & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Stage Progress Pills */}
            <div className="flex items-center gap-2">
              {CHAPTERS.map((chap, i) => (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeChapterIndex
                      ? "w-10 bg-slate-900 dark:bg-[#F4C542]"
                      : "w-4 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
                  }`}
                />
              ))}
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 ml-2">
                0{activeChapterIndex + 1} / 0{CHAPTERS.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 shadow-xs"
                  style={{ color: activeChapter.color }}
                >
                  <activeChapter.icon className="h-3.5 w-3.5" />
                  {activeChapter.badge}
                </div>

                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {activeChapter.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  {activeChapter.subtitle}
                </p>

                {/* Key Points */}
                <div className="space-y-2.5 pt-2">
                  {activeChapter.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 border border-slate-200 dark:border-white/20 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white shadow-sm"
                  >
                    EXPERIENCE {activeChapter.badge} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* RIGHT: 3D Holographic Interactive Stage (7 Cols) */}
          <div className="lg:col-span-7 relative flex items-center justify-center">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter.id}
                initial={{ opacity: 0, scale: 0.9, rotateX: 10, rotateY: -6 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.05, rotateX: -6, rotateY: 6 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ perspective: 1200 }}
                className="w-full max-w-xl"
              >
                {/* 3D Glass Showcase Card */}
                <div className={`relative rounded-3xl p-6 sm:p-8 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/70 border border-slate-200/90 dark:border-white/15 shadow-xl ${activeChapter.glow} overflow-hidden`}>
                  
                  {/* Subtle Top Specular Rim */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400/20 dark:via-white/40 to-transparent" />

                  {/* Header Strip inside Card */}
                  <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10">
                        <activeChapter.icon className="h-5 w-5" style={{ color: activeChapter.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">MODULE PREVIEW</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{activeChapter.title}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE SPOT SYNC
                    </span>
                  </div>

                  {/* Dynamic Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 my-6">
                    {activeChapter.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-center">
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{m.label}</div>
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-1">{m.val}</div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{m.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Simulated Visual Widget */}
                  <div className="rounded-2xl p-4 bg-slate-50 dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-transparent border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mb-3">
                      <span>INTELLIGENCE STREAM</span>
                      <span className="text-amber-700 dark:text-[#F4C542]">ENCRYPTED RLS</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/70 dark:border-white/5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Auto-Rebalance Audit</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">PASSED (0.01% Dev)</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/70 dark:border-white/5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Real-Time Metal NAV (24K Gold)</span>
                        <span className="text-amber-700 dark:text-amber-400 font-bold font-mono">₹14,826.00 / g</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200/70 dark:border-white/5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Tax Harvesting Status</span>
                        <span className="text-purple-700 dark:text-purple-400 font-bold font-mono">₹1.25L Untapped</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Security Assurance */}
                  <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> AES-256 ZERO-KNOWLEDGE
                    </span>
                    <span className="text-amber-700 dark:text-[#F4C542]">EXECUTIVE VAULT 4.0</span>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  )
}
