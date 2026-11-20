"use client"

import React, { useState } from "react"
import ThreeDCard from "./ThreeDCard"
import {
  Briefcase,
  Receipt,
  Eye,
  Bot,
  TrendingUp,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Activity
} from "lucide-react"
import Link from "next/link"

export default function BentoFeatures3D() {
  const [selectedPrompt, setSelectedPrompt] = useState(0)

  const PROMPTS = [
    {
      q: "Calculate my LTCG tax liability under Section 112A.",
      a: "💡 Section 112A analysis: You have ₹1,25,000 exemption limit. By harvesting ₹85,000 from your high-performing mutual funds before March 31st, you lock in 0% capital gains tax."
    },
    {
      q: "Check my gold vs equity allocation balance.",
      a: "⚖️ Current balance: Equity 82.4%, 24K Gold 12.1%, Cash 5.5%. Your risk score is 94/100. Consider shifting ₹50k to Sovereign Gold Bonds to achieve ideal 15% hedge."
    },
    {
      q: "Review this month's Utkarsh Credit Card spending velocity.",
      a: "💳 Utkarsh CC: ₹14,250 of ₹80,000 limit utilized (18%). Spending is 12% lower than last month. Healthy credit score velocity."
    }
  ]

  return (
    <section className="py-28 relative bg-[#06080C] text-slate-100 overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Layers className="h-3.5 w-3.5" /> BENTO 3D ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Engineered for High-Net-Worth <span className="text-[#F4C542]">Clarity</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every pillar of Bun Vault is crafted with physics-based 3D depth, live real-time feeds, and bank-grade zero-knowledge privacy.
          </p>
        </div>

        {/* 3D Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Multi-Asset Portfolio (Spans 2 cols on LG) */}
          <div className="lg:col-span-2">
            <ThreeDCard glowColor="gold" depth={35} className="h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-[#F4C542] border border-amber-500/30 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> MULTI-ASSET LEDGER
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> SUB-60s SYNC
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mt-4">
                    Institutional Portfolio & Asset Tracking
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    Track your stocks, mutual funds, 24K Sovereign Gold, silver, and crypto in one unified institutional dashboard. Auto-calculates capital invested, current valuation, and total returns.
                  </p>
                </div>

                {/* Live Mini Preview Grid */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">TOTAL VALUATION</span>
                    <span className="text-base sm:text-xl font-bold text-white font-mono mt-1 block">₹6,08,595</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">+43.20%</span>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <span className="text-[10px] font-mono text-slate-400 block">24K GOLD (1G)</span>
                    <span className="text-base sm:text-xl font-bold text-amber-400 font-mono mt-1 block">₹14,826</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">+0.52% SPOT</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">NIFTY 50</span>
                    <span className="text-base sm:text-xl font-bold text-cyan-400 font-mono mt-1 block">24,320</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">+0.59%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link href="/holdings" className="text-xs font-bold text-[#F4C542] hover:underline flex items-center gap-1.5 font-mono">
                    EXPLORE HOLDINGS ENGINE <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-[10px] font-mono text-slate-500">RLS PROTECTED</span>
                </div>
              </div>
            </ThreeDCard>
          </div>

          {/* Card 2: AI Financial Co-Pilot (1 col) */}
          <div className="lg:col-span-1">
            <ThreeDCard glowColor="indigo" depth={30} className="h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center gap-1.5">
                      <Bot className="h-3 w-3" /> AI CO-PILOT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">GEMINI PRO</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-4">
                    Intelligent Tax & Risk Advisor
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    Interactive AI tuned for Indian tax deductions, portfolio diversification, and risk balancing.
                  </p>
                </div>

                {/* Interactive Prompt Selector */}
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {PROMPTS.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPrompt(pIdx)
                        }}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                          selectedPrompt === pIdx
                            ? "bg-violet-500 text-white font-bold"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        Prompt #{pIdx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-violet-500/20 text-xs space-y-2">
                    <div className="text-slate-300 font-semibold text-[11px]">
                      "{PROMPTS[selectedPrompt].q}"
                    </div>
                    <div className="text-violet-300 text-[11px] leading-relaxed">
                      {PROMPTS[selectedPrompt].a}
                    </div>
                  </div>
                </div>

                <Link href="/analytics" className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1.5 font-mono pt-2">
                  LAUNCH AI STUDIO <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ThreeDCard>
          </div>

          {/* Card 3: High-Velocity Cash Flow & Dual Cards (1 col) */}
          <div className="lg:col-span-1">
            <ThreeDCard glowColor="emerald" depth={30} className="h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                    <Receipt className="h-3 w-3" /> CASH VELOCITY
                  </span>

                  <h3 className="text-xl font-bold text-white mt-4">
                    Bank Accounts & Credit Card Sync
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    Track SBI savings, Utkarsh Credit Card, and liquid cash with zero latency. Auto-classifies investments vs lifestyle expenses.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Utkarsh Credit Card</span>
                    <span className="font-mono font-bold text-white">₹14,250 (18%)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">SBI Primary Savings</span>
                    <span className="font-mono font-bold text-emerald-400">₹68,200</span>
                  </div>
                </div>

                <Link href="/expenses" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1.5 font-mono pt-2">
                  MANAGE EXPENSES <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ThreeDCard>
          </div>

          {/* Card 4: Bank-Grade Privacy & Security (1 col) */}
          <div className="lg:col-span-1">
            <ThreeDCard glowColor="cyan" depth={30} className="h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="h-3 w-3" /> BANK GRADE PRIVACY
                  </span>

                  <h3 className="text-xl font-bold text-white mt-4">
                    Zero-Knowledge Encryption
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    Row-Level Security (RLS) ensures nobody but you can view your financial records. No third-party data tracking. No ads.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 text-xs space-y-2 font-mono">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Lock className="h-3.5 w-3.5" /> AES-256 ENCRYPTED
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Database policies enforce hardware-isolated tenant isolation.
                  </div>
                </div>

                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono pt-2">
                  100% PRIVATE ARCHITECTURE
                </span>
              </div>
            </ThreeDCard>
          </div>

          {/* Card 5: Instant PDF Reports & Tax Dossiers (1 col) */}
          <div className="lg:col-span-1">
            <ThreeDCard glowColor="rose" depth={30} className="h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit">
                    <FileText className="h-3 w-3" /> AUDITED REPORTS
                  </span>

                  <h3 className="text-xl font-bold text-white mt-4">
                    One-Click PDF Wealth Dossier
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    Generate clean, professional PDF reports of your net worth, equity holdings, and capital gains ready for your chartered accountant.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Annual Statement</span>
                  <span className="text-rose-400 font-bold">READY TO EXPORT</span>
                </div>

                <Link href="/reports" className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1.5 font-mono pt-2">
                  GENERATE PDF REPORT <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ThreeDCard>
          </div>

        </div>

      </div>
    </section>
  )
}
