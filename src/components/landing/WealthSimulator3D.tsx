"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Sparkles, Award, ArrowRight, Zap, Target } from "lucide-react"
import Link from "next/link"

export default function WealthSimulator3D() {
  const [monthlySip, setMonthlySip] = useState(50000)
  const [years, setYears] = useState(10)
  const [rate, setRate] = useState(14.5)

  // Compound Calculation
  const months = years * 12
  const monthlyRate = rate / 100 / 12
  const futureValue =
    monthlySip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  const totalInvested = monthlySip * months
  const totalProfit = futureValue - totalInvested
  const wealthMultiplier = (futureValue / (totalInvested || 1)).toFixed(2)

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakhs`
    }
    return `₹${Math.round(amount).toLocaleString("en-IN")}`
  }

  return (
    <section className="py-24 relative overflow-hidden bg-[#06080C] text-slate-100">
      {/* Background glow orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[#F4C542] text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles className="h-3.5 w-3.5" /> 3D COMPOUND WEALTH ENGINE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Visualize Your Path to <span className="text-[#F4C542]">Financial Independence</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Experience the exponential velocity of compound growth. Adjust monthly allocations, time horizons, and expected CAGRs to see your wealth trajectory unfold.
          </p>
        </div>

        {/* Interactive 3D Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-white/[0.03] border border-white/10 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Slider 1: Monthly Investment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-300">Monthly SIP Contribution</span>
                  <span className="text-[#F4C542] font-mono font-bold text-base">
                    ₹{monthlySip.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={250000}
                  step={5000}
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Number(e.target.value))}
                  className="w-full accent-[#F4C542] bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>₹5,000 / mo</span>
                  <span>₹1,00,000</span>
                  <span>₹2,50,000 / mo</span>
                </div>
              </div>

              {/* Slider 2: Horizon Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-300">Time Horizon</span>
                  <span className="text-emerald-400 font-mono font-bold text-base">
                    {years} Years
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>1 Year</span>
                  <span>15 Years</span>
                  <span>30 Years</span>
                </div>
              </div>

              {/* Slider 3: Expected CAGR Return */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-300">Expected Annual Return (CAGR)</span>
                  <span className="text-cyan-400 font-mono font-bold text-base">
                    {rate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={0.5}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>8% (Conservative)</span>
                  <span>14% (Nifty Index)</span>
                  <span>24% (High Alpha)</span>
                </div>
              </div>

            </div>

            {/* Simulation Milestone Pill */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <Award className="h-6 w-6 text-[#F4C542] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Compound Wealth Expansion</span>
                <span className="text-slate-400">
                  Your capital multiplies by <strong className="text-[#F4C542]">{wealthMultiplier}x</strong> over {years} years!
                </span>
              </div>
            </div>

          </div>

          {/* Visualization Column (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 backdrop-blur-3xl bg-slate-950/80 border border-white/10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            
            {/* Top Specular Rim */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

            {/* Projection Header */}
            <div>
              <div className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#F4C542]" /> PROJECTED PORTFOLIO VALUATION
              </div>
              <div className="text-4xl sm:text-6xl font-extrabold text-white font-mono tracking-tight mt-2">
                {formatCurrency(futureValue)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Estimated maturity valuation based on {rate}% annualized compounding
              </div>
            </div>

            {/* Dynamic Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-xs text-slate-400 block">Total Capital Invested</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-200 mt-1 block">
                  {formatCurrency(totalInvested)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  From ₹{monthlySip.toLocaleString("en-IN")}/mo
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-emerald-300 block">Compound Profit (Alpha)</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  +{formatCurrency(totalProfit)}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  Pure Interest Gain
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">
                  Principal: {Math.round((totalInvested / futureValue) * 100)}%
                </span>
                <span className="text-emerald-400">
                  Gains: {Math.round((totalProfit / futureValue) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(totalInvested / futureValue) * 100}%` }}
                  className="bg-slate-400 transition-all duration-300"
                />
                <div
                  style={{ width: `${(totalProfit / futureValue) * 100}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-[#F4C542] transition-all duration-300"
                />
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-mono">
                Ready to track this real portfolio in Bun Vault?
              </span>
              <Link
                href="/sip-planner"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider font-mono flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
              >
                OPEN DETAILED SIP PLANNER <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
