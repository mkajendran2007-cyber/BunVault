"use client"

import React from "react"
import { Activity, Cpu } from "lucide-react"

interface GeneratingLoaderProps {
  step: number
  total: number
  statusText: string
}

export function GeneratingLoader({ step, total, statusText }: GeneratingLoaderProps) {
  const percentage = Math.min(100, Math.round((step / total) * 100))

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-500">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center flex flex-col items-center space-y-6 select-none">
        
        {/* Dynamic Glowing Orbit Orb */}
        <div className="relative h-20 w-20 flex items-center justify-center animate-spin-slow">
           <div className="absolute inset-0 rounded-full border-[3px] border-blue-500/20 border-t-blue-500 animate-spin" />
           <div className="absolute inset-2 rounded-full border-[3px] border-indigo-500/20 border-b-indigo-500 animate-spin-reverse" />
           <Cpu className="h-8 w-8 text-blue-400" />
        </div>

        <div className="space-y-2">
           <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" /> Compiling Wealth Report
           </h3>
           <p className="text-xs font-mono text-blue-400 tracking-wider uppercase font-bold">{statusText || "Vector-Rasterizing Engines..."}</p>
        </div>

        {/* Progress Bar Core */}
        <div className="w-full space-y-2 pt-2">
           <div className="flex justify-between items-baseline text-xs font-mono font-bold">
              <span className="text-slate-500">PAGE {step} OF {total}</span>
              <span className="text-white bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{percentage}%</span>
           </div>
           <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                 className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                 style={{ width: `${percentage}%` }}
              />
           </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed px-4">
           Generating high-fidelity retina canvas layers for multi-page pdf assembly. Please do not close this window.
        </p>

      </div>
    </div>
  )
}
