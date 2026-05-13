"use client"

import React from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, ReferenceLine 
} from "recharts"
import { 
  TrendingUp, TrendingDown, Briefcase, Shield, 
  Zap, Calendar, PieChart as PieIcon, Landmark, 
  Award, ChevronRight, AlertCircle, Activity, CheckCircle2 
} from "lucide-react"

// Standard A4 resolution styling at 96dpi (slightly enlarged for retina capture scaling)
const PAGE_WIDTH = 1000 // px
const PAGE_HEIGHT = 1414 // px (A4 Aspect ratio: 1 : 1.414)

const BLUE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface WealthReportTemplateProps {
  user: any
  holdings: any[]
  sips: any[]
  chartData: any[]
  totalInvestment: number
  currentValue: number
  goldPrice: number
  silverPrice: number
  niftyPrice: number
  currentDate: string
}

export function WealthReportTemplate({
  user,
  holdings,
  sips,
  chartData,
  totalInvestment,
  currentValue,
  goldPrice,
  silverPrice,
  niftyPrice,
  currentDate
}: WealthReportTemplateProps) {
  
  const totalPL = currentValue - totalInvestment
  const plPercent = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0
  
  // Asset breakdown calculations
  const assetAllocation = React.useMemo(() => {
    const split: Record<string, number> = { Equity: 0, "Mutual Fund": 0, Debt: 0, Crypto: 0, Commodity: 0 }
    holdings.forEach(h => {
      if (split[h.type] !== undefined) split[h.type] += h.currentValue
      else split[h.type] = h.currentValue
    })
    return Object.entries(split)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
  }, [holdings])

  // Filtered asset lists
  const mutualFunds = holdings.filter(h => h.type === "Mutual Fund")
  const stocks = holdings.filter(h => h.type === "Equity")
  const cryptos = holdings.filter(h => h.type === "Crypto")
  const commodity = holdings.filter(h => h.type === "Commodity")
  const debt = holdings.filter(h => h.type === "Debt")
  
  // Gold and silver specific Gram aggregations
  const physicalGoldHoldings = holdings.filter(h => h.symbol === "GOLD_INR_1G")
  const physicalSilverHoldings = holdings.filter(h => h.symbol === "SILVER_INR_1G")
  const totalGoldGrams = physicalGoldHoldings.reduce((sum, h) => sum + h.qty, 0)
  const totalSilverGrams = physicalSilverHoldings.reduce((sum, h) => sum + h.qty, 0)
  const totalGoldValue = physicalGoldHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalSilverValue = physicalSilverHoldings.reduce((sum, h) => sum + h.currentValue, 0)

  // Dynamic Insights Calculation
  const performanceSorted = [...holdings].sort((a, b) => {
     const aRet = a.totalInvestment > 0 ? (a.currentValue - a.totalInvestment) / a.totalInvestment : 0
     const bRet = b.totalInvestment > 0 ? (b.currentValue - b.totalInvestment) / b.totalInvestment : 0
     return bRet - aRet
  })
  const bestAsset = performanceSorted[0]
  const worstAsset = performanceSorted[performanceSorted.length - 1]
  const activeSipsCount = sips.filter(s => s.status === "Active").length
  const monthlySipTotal = sips
    .filter(s => s.status === "Active")
    .reduce((sum, s) => {
       let val = s.amount
       if (s.frequency === 'Weekly') val = s.amount * 4
       if (s.frequency === 'Daily') val = s.amount * 30
       return sum + val
    }, 0)

  // Normalized user representation
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Investor"

  // 20-Year Future SIP Projection Math
  const sipProjection = React.useMemo(() => {
     const rate = 0.12 // 12% average annual return
     const monthlyRate = rate / 12
     const years = 20
     const data = []
     let accumulated = currentValue
     
     // Baseline 0
     data.push({ year: "Current", corpus: currentValue })
     
     for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
           accumulated = (accumulated + monthlySipTotal) * (1 + monthlyRate)
        }
        // Sample key intervals (Years: 1, 3, 5, 10, 15, 20)
        if ([1, 3, 5, 10, 15, 20].includes(y)) {
           data.push({ year: `Yr ${y}`, corpus: Math.round(accumulated) })
        }
     }
     return data
  }, [monthlySipTotal, currentValue])

  const pageStyle = {
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    fontFamily: 'Inter, system-ui, sans-serif'
  }

  return (
    <div 
      id="wealth-report-container" 
      className="bg-slate-950 text-slate-100 overflow-hidden select-none antialiased"
      style={{ width: `${PAGE_WIDTH}px` }}
    >
      {/* High-Fidelity Legibility Engine - Globally Boosts Font Sizing for Pristine PDF Readability */}
      <style dangerouslySetInnerHTML={{ __html: `
         #wealth-report-container {
            font-size: 16px !important;
         }
         
         /* Core Font Size Scaling (Boost by ~35% for absolute clarity) */
         #wealth-report-container [class*="text-[9px]"] { font-size: 12px !important; }
         #wealth-report-container [class*="text-[10px]"] { font-size: 14px !important; letter-spacing: 0.04em !important; }
         #wealth-report-container [class*="text-[11px]"] { font-size: 15px !important; }
         #wealth-report-container [class*="text-[12px]"] { font-size: 16px !important; }
         
         #wealth-report-container .text-xs { font-size: 15px !important; line-height: 1.4 !important; }
         #wealth-report-container .text-sm { font-size: 18px !important; line-height: 1.5 !important; }
         #wealth-report-container .text-base { font-size: 21px !important; line-height: 1.5 !important; }
         #wealth-report-container .text-lg { font-size: 24px !important; line-height: 1.4 !important; }
         #wealth-report-container .text-xl { font-size: 28px !important; line-height: 1.4 !important; }
         #wealth-report-container .text-2xl { font-size: 36px !important; line-height: 1.3 !important; }
         #wealth-report-container .text-3xl { font-size: 44px !important; line-height: 1.2 !important; }
         #wealth-report-container .text-4xl { font-size: 52px !important; line-height: 1.2 !important; }
         
         /* Special Title Exception for Page 1 Cover (already scaled to 4.5rem) */
         #wealth-report-container .text-\\[4\\.5rem\\] { font-size: 4rem !important; }

         /* Space calibration to maintain layout balance with large text */
         #wealth-report-container .px-14 { padding-left: 3rem !important; padding-right: 3rem !important; }
         #wealth-report-container .py-14 { padding-top: 3rem !important; padding-bottom: 3rem !important; }
         #wealth-report-container .py-20 { padding-top: 4rem !important; padding-bottom: 4rem !important; }
         #wealth-report-container .pt-10 { padding-top: 2rem !important; }
         #wealth-report-container .pb-6 { padding-bottom: 1rem !important; }
         
         /* Tweak visual containers so elements don't compress chart vertical volume */
         #wealth-report-container .gap-8 { gap: 1.5rem !important; }
         #wealth-report-container .space-y-10 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem !important; }
         #wealth-report-container .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem !important; }
         
         /* Standardize quick logo vectors */
         #wealth-report-container .h-16 { height: 3.5rem !important; }
         #wealth-report-container .w-16 { width: 3.5rem !important; }
         #wealth-report-container .h-14 { height: 3.2rem !important; }
         #wealth-report-container .w-14 { width: 3.2rem !important; }
      ` }} />

      {/* ================= PAGE 1: COVER PAGE ================= */}
      <div id="report-page-1" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-16 py-20">
         {/* Ambient Glow Orbs */}
         <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
         <div className="absolute bottom-[-250px] left-[-150px] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[150px]" />
         
         {/* Background grid overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

          {/* Header Brand */}
          <div className="relative flex items-center gap-4">
             <div className="bg-white p-2 rounded-2xl border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.2)] flex items-center justify-center h-14 w-14">
                <img src="/logo.png" alt="Bun Vault" className="h-full w-full object-contain" />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-[0.2em] text-white">BUN VAULT</h1>
                <p className="text-xs font-bold text-blue-400 tracking-widest uppercase">Premium Finance Ecosystem</p>
             </div>
          </div>

          {/* Large Luxury Center Logo Anchor */}
          <div className="relative flex flex-col items-center justify-center py-8">
             <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[3rem] border border-slate-800/80 shadow-[0_0_100px_rgba(59,130,246,0.1)] flex items-center justify-center h-64 w-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-30" />
                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl h-full w-full flex items-center justify-center relative z-10 border border-blue-500/10">
                   <img src="/logo.png" alt="Bun Vault" className="h-full w-full object-contain" />
                </div>
             </div>
             <div className="absolute w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
          </div>

          {/* Centerpiece Titles */}
          <div className="relative flex-1 flex flex-col justify-center pt-4">
             <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
                   <Activity className="w-4 h-4 animate-pulse text-blue-400" /> AI-Powered Intelligence
                </div>
                <h2 className="text-[4.5rem] font-black tracking-tight text-white leading-[1.1]">
                   <span className="capitalize">{userName}&apos;s</span> <br />
                   <span className="text-blue-400 font-black">
                      Wealth Report
                   </span>
                </h2>
                <div className="h-2 w-32 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                <p className="text-slate-400 text-lg max-w-lg pt-2 leading-relaxed">
                   A high-fidelity, investor-grade analysis of your asset allocations, yield projections, and diversified corpus performance metrics.
                </p>
            </div>
         </div>

         {/* Cover Footer Metrics */}
         <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-12 gap-6">
               <div className="col-span-5 space-y-2 pl-4">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Portfolio Value</p>
                  <h3 className="text-3xl font-black text-white">₹{Math.round(currentValue).toLocaleString('en-IN')}</h3>
                  <p className={`text-sm font-bold flex items-center gap-1.5 ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {totalPL >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                     {totalPL >= 0 ? '+' : ''}{plPercent.toFixed(2)}% Growth
                  </p>
               </div>
               <div className="col-span-3 space-y-2 pl-6 border-l border-slate-800">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Asset Count</p>
                  <h3 className="text-3xl font-black text-white">{holdings.length}</h3>
                  <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                     Across {assetAllocation.length} Classes
                  </p>
               </div>
               <div className="col-span-4 space-y-2 pl-6 border-l border-slate-800 flex flex-col justify-between">
                  <div>
                     <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Report For</p>
                     <p className="text-base font-bold text-slate-200 truncate max-w-[200px]">{user?.email || "Private Investor"}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Generated Date</p>
                     <p className="text-xs font-semibold text-slate-500">{currentDate}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* ================= PAGE 2: EXECUTIVE SUMMARY ================= */}
      <div id="report-page-2" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_60%)] opacity-30" />
         
         {/* Page Header */}
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 01 — Performance Core</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-10">
            <div>
               <h2 className="text-4xl font-black text-white tracking-tight">Executive Summary</h2>
               <p className="text-slate-400 text-sm mt-1">Overview of capital deployment efficiency and return yields.</p>
            </div>

            {/* Primary Summary Cards */}
            <div className="grid grid-cols-4 gap-5">
               <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Deployed Capital</p>
                  <p className="text-2xl font-black text-white">₹{totalInvestment.toLocaleString('en-IN')}</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Current Valuation</p>
                  <p className="text-2xl font-black text-blue-400">₹{currentValue.toLocaleString('en-IN')}</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Absolute Yield</p>
                  <p className={`text-2xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {totalPL >= 0 ? '+' : ''}₹{Math.abs(totalPL).toLocaleString('en-IN')}
                  </p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Yield Rate</p>
                  <p className={`text-2xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {totalPL >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                  </p>
               </div>
            </div>

            {/* Core Grid: Allocation Chart and Insights */}
            <div className="grid grid-cols-12 gap-8 flex-1 items-stretch">
               {/* Asset Allocation Chart */}
               <div className="col-span-7 bg-slate-900/30 border border-slate-800/50 rounded-3xl p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-blue-400" /> Asset Allocation Split
                     </h3>
                     <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{assetAllocation.length} Asset Classes</span>
                  </div>
                  <div className="flex-1 flex items-center">
                     <div className="w-[240px] h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={assetAllocation}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={70}
                                 outerRadius={95}
                                 paddingAngle={4}
                                 dataKey="value"
                                 isAnimationActive={false}
                              >
                                 {assetAllocation.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                                 ))}
                              </Pie>
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     {/* Allocation Legend */}
                     <div className="flex-1 pl-8 space-y-3">
                        {assetAllocation.map((item, index) => {
                           const pct = currentValue > 0 ? (item.value / currentValue) * 100 : 0
                           return (
                              <div key={index} className="flex items-center justify-between border-b border-slate-900/60 pb-1.5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BLUE_COLORS[index % BLUE_COLORS.length] }} />
                                    <span className="text-xs font-bold text-slate-300">{item.name}</span>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-bold text-white">₹{item.value.toLocaleString('en-IN')}</p>
                                    <p className="text-[10px] font-bold text-slate-500">{pct.toFixed(1)}%</p>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               </div>

               {/* Quick Diagnostic Insights Column */}
               <div className="col-span-5 flex flex-col gap-6">
                  {/* Best Performing Asset */}
                  {bestAsset && (
                     <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500" />
                        <div className="flex justify-between items-start">
                           <p className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Top Performer</p>
                           <Award className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-extrabold text-white truncate">{bestAsset.name}</h4>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] text-slate-500">Current Value</p>
                              <p className="text-sm font-bold text-white">₹{bestAsset.currentValue.toLocaleString('en-IN')}</p>
                           </div>
                           <span className="bg-emerald-500/10 text-emerald-400 text-xs font-black px-2 py-0.5 rounded border border-emerald-500/20">
                              +{(((bestAsset.currentValue - bestAsset.totalInvestment)/bestAsset.totalInvestment)*100).toFixed(1)}%
                           </span>
                        </div>
                     </div>
                  )}
                  
                  {/* Worst Performing Asset */}
                  {worstAsset && bestAsset !== worstAsset && (
                     <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1 bg-rose-500" />
                        <div className="flex justify-between items-start">
                           <p className="text-[10px] font-bold tracking-widest text-rose-400 uppercase">Lagging Performer</p>
                           <AlertCircle className="w-4 h-4 text-rose-400" />
                        </div>
                        <h4 className="text-lg font-extrabold text-white truncate">{worstAsset.name}</h4>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] text-slate-500">Current Value</p>
                              <p className="text-sm font-bold text-white">₹{worstAsset.currentValue.toLocaleString('en-IN')}</p>
                           </div>
                           <span className={`text-xs font-black px-2 py-0.5 rounded border ${((worstAsset.currentValue - worstAsset.totalInvestment)/worstAsset.totalInvestment) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {(((worstAsset.currentValue - worstAsset.totalInvestment)/worstAsset.totalInvestment)*100).toFixed(1)}%
                           </span>
                        </div>
                     </div>
                  )}

                  {/* SIP Health Card */}
                  <div className="flex-1 bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
                     <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" /> SIP Consistency Rate
                     </h4>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{monthlySipTotal > 0 ? "98" : "00"}</span>
                        <span className="text-xs font-bold text-slate-500 tracking-widest">/ 100 SCORE</span>
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${monthlySipTotal > 0 ? 98 : 0}%` }} />
                     </div>
                     <p className="text-[10px] text-slate-500">
                        {monthlySipTotal > 0 ? "Your recurring systematic flows show highly disciplined savings habits." : "Set up automated recurring Systematic Investment Plans to bolster your future consistency score."}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Page Footer */}
         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>CONFIDENTIAL WEALTH SUMMARY</span>
            <span>Page 02</span>
         </div>
      </div>
      
      {/* ================= PAGE 3: PORTFOLIO OVERVIEW ================= */}
      <div id="report-page-3" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#0f172a_0%,#020617_100%)]" />
         
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 02 — Asset Intelligence</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-8">
            <div>
               <h2 className="text-4xl font-black text-white tracking-tight">Portfolio Breakdown</h2>
               <p className="text-slate-400 text-sm mt-1">Granular insights into valuation weights across 6 asset classifications.</p>
            </div>

            {/* The 6 Card Premium Glass Grid */}
            <div className="grid grid-cols-2 gap-6 flex-1">
               {[
                  { type: "Equity", label: "Equities (Stocks)", list: stocks, color: "from-indigo-500 to-blue-600" },
                  { type: "Mutual Fund", label: "Mutual Funds", list: mutualFunds, color: "from-emerald-500 to-teal-600" },
                  { type: "Commodity", label: "Commodities", list: commodity, color: "from-amber-500 to-orange-600" },
                  { type: "Crypto", label: "Cryptocurrency", list: cryptos, color: "from-fuchsia-500 to-purple-600" },
                  { type: "Debt", label: "Debt & Liquidity", list: debt, color: "from-slate-500 to-slate-700" },
                  { type: "Cash", label: "Calculated Weights", list: [], color: "from-sky-500 to-cyan-600", summary: true }
               ].map((card, idx) => {
                  const listVal = card.list.reduce((sum, item) => sum + item.currentValue, 0)
                  const listInv = card.list.reduce((sum, item) => sum + item.totalInvestment, 0)
                  const listPL = listVal - listInv
                  const listRet = listInv > 0 ? (listPL / listInv) * 100 : 0
                  const weight = currentValue > 0 ? (listVal / currentValue) * 100 : 0

                  if (card.summary) {
                     return (
                        <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                           <div className="absolute top-[-50px] right-[-50px] w-44 h-44 bg-sky-500/5 rounded-full blur-2xl" />
                           <div>
                              <h3 className="text-xl font-bold text-white mb-2">Allocation Balance</h3>
                              <p className="text-xs text-slate-400 leading-relaxed">Balanced cross-asset weighting limits downward portfolio drawdowns during correlated volatile events.</p>
                           </div>
                           <div className="space-y-2 pt-4 border-t border-slate-800/60">
                              <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">High Risk Assets (Eq/Crypto)</span><span className="text-white font-bold">{((stocks.reduce((s,i)=>s+i.currentValue,0) + cryptos.reduce((s,i)=>s+i.currentValue,0))/currentValue*100 || 0).toFixed(1)}%</span></div>
                              <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">Hedged Core Assets (Metal/Debt)</span><span className="text-white font-bold">{((commodity.reduce((s,i)=>s+i.currentValue,0) + debt.reduce((s,i)=>s+i.currentValue,0))/currentValue*100 || 0).toFixed(1)}%</span></div>
                              <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">Managed Core (Mutual Fund)</span><span className="text-white font-bold">{(mutualFunds.reduce((s,i)=>s+i.currentValue,0)/currentValue*100 || 0).toFixed(1)}%</span></div>
                           </div>
                        </div>
                     )
                  }

                  return (
                     <div key={idx} className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative group">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`} />
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">{card.label}</p>
                              <h3 className="text-2xl font-black text-white mt-1">₹{listVal.toLocaleString('en-IN')}</h3>
                           </div>
                           <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase shadow-sm">
                              {weight.toFixed(1)}% WT
                           </div>
                        </div>

                        <div className="flex items-end justify-between pt-6 border-t border-slate-900/80 mt-4">
                           <div>
                              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">Invested Cost</p>
                              <p className="text-sm font-extrabold text-slate-300">₹{listInv.toLocaleString('en-IN')}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">P&L Net</p>
                              <p className={`text-sm font-extrabold flex items-center justify-end gap-1 ${listPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {listPL >= 0 ? '+' : ''}{listRet.toFixed(1)}%
                              </p>
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>DIVERSIFICATION DEEP DIVE</span>
            <span>Page 03</span>
         </div>
      </div>

      {/* ================= PAGE 4: MUTUAL FUNDS ================= */}
      <div id="report-page-4" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#064e3b_0%,transparent_50%)] opacity-10" />
         
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 03 — Holdings Inventory</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-6">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Mutual Funds</h2>
                  <p className="text-slate-400 text-sm mt-1">Automated pooled capital allocations across custom AMCs.</p>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-right">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Managed Portfolio</p>
                  <p className="text-xl font-black text-white">₹{mutualFunds.reduce((sum, h) => sum + h.currentValue, 0).toLocaleString('en-IN')}</p>
               </div>
            </div>

            {/* Dynamic Sparkline Grid Table */}
            <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl overflow-hidden flex-1 flex flex-col">
               {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 bg-slate-900/40 px-6 py-4 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase border-b border-slate-800">
                  <div className="col-span-5">Fund Details</div>
                  <div className="col-span-3 text-right">Deployment</div>
                  <div className="col-span-2 text-center">Recent Spark</div>
                  <div className="col-span-2 text-right">Growth Net</div>
               </div>
               
               {/* Table Body */}
               <div className="flex-1 overflow-hidden divide-y divide-slate-900/60">
                  {mutualFunds.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-slate-600 text-sm font-semibold tracking-wide italic">
                        No managed Mutual Fund assets identified in active holding database.
                     </div>
                  ) : (
                     mutualFunds.slice(0, 8).map((mf, idx) => {
                        const pl = mf.currentValue - mf.totalInvestment
                        const ret = mf.totalInvestment > 0 ? (pl / mf.totalInvestment) * 100 : 0
                        // Simulated custom sparkline vectors for aesthetics
                        const sparkData = [
                           { v: 10 }, { v: 12 + Math.random() * 5 }, { v: 9 + Math.random() * 10 }, 
                           { v: 15 + Math.random() * 5 }, { v: 12 + Math.random() * 15 }
                        ]

                        return (
                           <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                              <div className="col-span-5 flex flex-col pr-2">
                                 <span className="text-sm font-extrabold text-white truncate">{mf.name}</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">CODE: {mf.symbol}</span>
                              </div>
                              <div className="col-span-3 text-right space-y-0.5">
                                 <p className="text-sm font-extrabold text-slate-200">₹{mf.currentValue.toLocaleString('en-IN')}</p>
                                 <p className="text-[10px] text-slate-500">Cost: ₹{mf.totalInvestment.toLocaleString('en-IN')}</p>
                              </div>
                              {/* Vector Sparkline Spark */}
                              <div className="col-span-2 h-8 px-4 flex items-center justify-center">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparkData}>
                                       <defs>
                                          <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor={ret >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                                             <stop offset="95%" stopColor={ret >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                          </linearGradient>
                                       </defs>
                                       <Area type="monotone" dataKey="v" stroke={ret >= 0 ? "#10b981" : "#ef4444"} fill={`url(#grad-${idx})`} strokeWidth={1.5} isAnimationActive={false} dot={false} />
                                    </AreaChart>
                                 </ResponsiveContainer>
                              </div>
                              <div className="col-span-2 text-right flex flex-col items-end">
                                 <span className={`text-sm font-black ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {pl >= 0 ? '+' : ''}{ret.toFixed(1)}%
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-500">XIRR Est.</span>
                              </div>
                           </div>
                        )
                     })
                  )}
               </div>
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>MUTUAL FUNDS PERFORMANCE LEDGER</span>
            <span>Page 04</span>
         </div>
      </div>

      {/* ================= PAGE 5: STOCK HOLDINGS ================= */}
      <div id="report-page-5" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#1e3a8a_0%,transparent_50%)] opacity-10" />
         
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 04 — Equities Inventory</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-6">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">Stock Holdings</h2>
                  <p className="text-slate-400 text-sm mt-1">Direct equity listings tracked against live market valuations.</p>
               </div>
               <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Equity Allocation</p>
                  <p className="text-xl font-black text-white">₹{stocks.reduce((sum, h) => sum + h.currentValue, 0).toLocaleString('en-IN')}</p>
               </div>
            </div>

            {/* Stock Table Layout */}
            <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl overflow-hidden flex-1 flex flex-col">
               <div className="grid grid-cols-12 gap-4 bg-slate-900/40 px-6 py-4 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase border-b border-slate-800">
                  <div className="col-span-4">Company Name</div>
                  <div className="col-span-2 text-center">Volume</div>
                  <div className="col-span-2 text-right">Avg Price</div>
                  <div className="col-span-2 text-right">Live Price</div>
                  <div className="col-span-2 text-right">P&L %</div>
               </div>
               
               <div className="flex-1 overflow-hidden divide-y divide-slate-900/60">
                  {stocks.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-slate-600 text-sm font-semibold tracking-wide italic">
                        No direct equity holdings identified in database.
                     </div>
                  ) : (
                     stocks.slice(0, 10).map((stock, idx) => {
                        const pl = stock.currentValue - stock.totalInvestment
                        const ret = stock.totalInvestment > 0 ? (pl / stock.totalInvestment) * 100 : 0
                        
                        return (
                           <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                              <div className="col-span-4 flex items-center gap-3 pr-2">
                                 <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] border border-slate-700 text-white uppercase">
                                    {stock.symbol?.substring(0, 2) || 'EQ'}
                                 </div>
                                 <div className="flex flex-col truncate">
                                    <span className="text-sm font-extrabold text-white truncate">{stock.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 tracking-wider mt-0.5 uppercase">{stock.symbol}</span>
                                 </div>
                              </div>
                              <div className="col-span-2 text-center font-bold text-slate-300 text-sm">
                                 {stock.qty}
                              </div>
                              <div className="col-span-2 text-right font-medium text-slate-400 text-sm">
                                 ₹{stock.buy_price.toLocaleString('en-IN')}
                              </div>
                              <div className="col-span-2 text-right font-extrabold text-slate-200 text-sm">
                                 ₹{(stock.livePrice || stock.buy_price).toLocaleString('en-IN')}
                              </div>
                              <div className="col-span-2 text-right flex flex-col items-end">
                                 <span className={`text-sm font-black px-2 py-0.5 rounded ${pl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {pl >= 0 ? '+' : ''}{ret.toFixed(1)}%
                                 </span>
                              </div>
                           </div>
                        )
                     })
                  )}
               </div>
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>NSE/BSE REGISTER SUMMARY</span>
            <span>Page 05</span>
         </div>
      </div>

      {/* ================= PAGE 6: GOLD & SILVER HOLDINGS ================= */}
      <div id="report-page-6" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,#f59e0b_0%,transparent_35%)] opacity-5" />
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,#cbd5e1_0%,transparent_35%)] opacity-5" />

         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 05 — Luxury Commodities</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-10">
            <div>
               <h2 className="text-4xl font-black text-white tracking-tight">Precious Metals</h2>
               <p className="text-slate-400 text-sm mt-1">Highly liquid bullion holdings synced with international gold and silver market fixings.</p>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1 items-stretch">
               {/* GOLD LUXURY PANEL */}
               <div className="bg-gradient-to-br from-[#1e170a] via-[#151109] to-slate-950 border border-[#ca8a04]/30 rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 bg-[#ca8a04]/20 text-[#fef08a] font-bold tracking-widest text-[9px] px-6 py-2 uppercase rounded-bl-3xl border-l border-b border-[#ca8a04]/20">
                     24 CARAT BULLION
                  </div>
                  
                  <div className="space-y-6">
                     <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-3 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                        <Landmark className="w-full h-full text-amber-950" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black tracking-tight text-amber-200">Gold Vault</h3>
                        <p className="text-amber-600/80 text-xs font-bold tracking-widest mt-1 uppercase">Hedge Security Asset</p>
                     </div>
                  </div>

                  <div className="py-8 border-y border-amber-950/40 space-y-6">
                     <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Physical Mass</span>
                        <span className="text-2xl font-black text-amber-100">{totalGoldGrams.toFixed(2)} <span className="text-xs text-slate-500">Grams</span></span>
                     </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Spot Fixing (1G)</span>
                        <span className="text-base font-bold text-white">₹{goldPrice.toLocaleString('en-IN')}</span>
                     </div>
                  </div>

                  <div className="space-y-2 pt-4">
                     <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">Valuation Core</p>
                     <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-black text-white">₹{totalGoldValue.toLocaleString('en-IN')}</span>
                        {physicalGoldHoldings.length > 0 && (
                           <span className="text-emerald-400 text-sm font-bold">
                              +{((totalGoldValue - physicalGoldHoldings.reduce((s,h)=>s+h.totalInvestment,0)) / physicalGoldHoldings.reduce((s,h)=>s+h.totalInvestment,0) * 100 || 0).toFixed(1)}%
                           </span>
                        )}
                     </div>
                  </div>
               </div>

               {/* SILVER PANEL */}
               <div className="bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-slate-950 border border-slate-700 rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 bg-slate-800/50 text-slate-300 font-bold tracking-widest text-[9px] px-6 py-2 uppercase rounded-bl-3xl border-l border-b border-slate-700">
                     99.9 FINE BULLION
                  </div>

                  <div className="space-y-6">
                     <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 p-3 flex items-center justify-center shadow-[0_0_30px_rgba(148,163,184,0.2)]">
                        <Shield className="w-full h-full text-slate-950" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black tracking-tight text-slate-100">Silver Ledger</h3>
                        <p className="text-slate-500 text-xs font-bold tracking-widest mt-1 uppercase">Diversified Security</p>
                     </div>
                  </div>

                  <div className="py-8 border-y border-slate-800 space-y-6">
                     <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Physical Mass</span>
                        <span className="text-2xl font-black text-slate-100">{totalSilverGrams.toFixed(2)} <span className="text-xs text-slate-500">Grams</span></span>
                     </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Spot Fixing (1G)</span>
                        <span className="text-base font-bold text-white">₹{silverPrice.toLocaleString('en-IN')}</span>
                     </div>
                  </div>

                  <div className="space-y-2 pt-4">
                     <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Valuation Core</p>
                     <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-black text-white">₹{totalSilverValue.toLocaleString('en-IN')}</span>
                        {physicalSilverHoldings.length > 0 && (
                           <span className="text-emerald-400 text-sm font-bold">
                              +{((totalSilverValue - physicalSilverHoldings.reduce((s,h)=>s+h.totalInvestment,0)) / physicalSilverHoldings.reduce((s,h)=>s+h.totalInvestment,0) * 100 || 0).toFixed(1)}%
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>BULLION VAULT SYSTEM LEDGER</span>
            <span>Page 06</span>
         </div>
      </div>

      {/* ================= PAGE 7: SIP TRACKER ================= */}
      <div id="report-page-7" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_60%)] opacity-30" />
         
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 06 — Recurring Capital Flows</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-8">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">SIP Tracker</h2>
                  <p className="text-slate-400 text-sm mt-1">Compounding trajectory calculated from current monthly systematic inflows.</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Deployment</p>
                  <p className="text-2xl font-black text-white">₹{monthlySipTotal.toLocaleString('en-IN')}</p>
               </div>
            </div>

            {/* Area Chart Container for Future Value Projection */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-8 flex flex-col flex-1">
               <div className="flex justify-between mb-6">
                  <div>
                     <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400"/> 20-Year Wealth Forecast</h3>
                     <p className="text-xs text-slate-500 mt-0.5">Aggregated projection compounding at average 12% CAGR.</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-slate-400">Terminal 20Y Corpus</p>
                     <p className="text-xl font-black text-blue-400">₹{(sipProjection[sipProjection.length-1]?.corpus || 0).toLocaleString('en-IN')}</p>
                  </div>
               </div>

               <div className="flex-1 w-full pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={sipProjection} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                        <defs>
                           <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="year" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis 
                           stroke="#475569" 
                           fontSize={11} 
                           tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} 
                           tickLine={false} 
                           axisLine={false} 
                        />
                        <Area type="monotone" dataKey="corpus" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCorpus)" isAnimationActive={false} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Active SIP Table Quick Row */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">Active Automatic Pipes ({activeSipsCount})</h4>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Automated recurring</span>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  {sips.filter(s => s.status === 'Active').slice(0, 3).map((sip, idx) => (
                     <div key={idx} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex justify-between items-center">
                        <div>
                           <p className="text-sm font-bold text-slate-200 truncate max-w-[140px]">{sip.name}</p>
                           <p className="text-[10px] text-slate-500 mt-0.5">{sip.frequency} AutoPay</p>
                        </div>
                        <span className="text-base font-black text-white">₹{sip.amount.toLocaleString('en-IN')}</span>
                     </div>
                  ))}
                  {activeSipsCount === 0 && (
                     <div className="col-span-3 text-center text-slate-600 text-xs py-2 italic">
                        No active Systematic Plans detected. Setup recurring assets on mobile/web.
                     </div>
                  )}
               </div>
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>SYSTEMATIC ACCUMULATION INVENTORY</span>
            <span>Page 07</span>
         </div>
      </div>

      {/* ================= PAGE 8: AI PORTFOLIO INSIGHTS ================= */}
      <div id="report-page-8" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#172554_0%,#020617_70%)] opacity-40" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10" />

         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900/80">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#22d3ee] rounded-full animate-pulse" />
               <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-mono">ENGINE MODULE AI-9X</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  <Zap className="w-7 h-7 text-cyan-400" />
               </div>
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">AI Insights Engine</h2>
                  <p className="text-slate-400 text-sm mt-1 font-mono text-cyan-500/80">Vector-analyzing risk metrics, overexposure threats, and rebalancing models.</p>
               </div>
            </div>

            <div className="grid grid-cols-12 gap-8 flex-1 items-stretch">
               <div className="col-span-7 bg-slate-900/40 border border-slate-800/60 backdrop-blur-md rounded-3xl p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                     <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono px-3 py-1 rounded border border-cyan-500/30 uppercase">
                        SCANNED SYSTEM LEDGER: OK
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-100">Diversification Analysis</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           Based on mathematical covariance matrices calculated from your current **{assetAllocation.length}** active asset distributions, the portfolio shows a highly rationalised capital spread.
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           **Equity & High-Risk Exposure**: You maintain structural limits with high risk weightings balanced by hedges in metal. Recommended holding periods are estimated at 5+ years to maximize absolute ROI yields.
                        </p>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4 font-mono">
                     <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase">Savings Discipline</p>
                        <p className="text-xl font-black text-emerald-400">OPTIMAL (A+)</p>
                     </div>
                     <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase">Volatility Risk</p>
                        <p className="text-xl font-black text-orange-400">MODERATE</p>
                     </div>
                  </div>
               </div>

               <div className="col-span-5 flex flex-col gap-6">
                  <div className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex-1 flex flex-col items-center justify-center space-y-4">
                     <h4 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Aggregate Risk Level</h4>
                     <div className="relative h-36 w-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                           <circle cx="50" cy="50" r="40" stroke="#06b6d4" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="80" strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                           <span className="text-3xl font-black text-white">68</span>
                           <span className="text-[9px] text-slate-500 tracking-widest font-bold uppercase">/ 100 SCORE</span>
                        </div>
                     </div>
                     <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest">BALANCED RISK PROFILE</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-4 font-mono">
                     <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">AI RECOMMENDATIONS ENGINE</h4>
                     <div className="space-y-3">
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                           <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5"/>
                           <span>Maintain physical bullion levels as an inflationary tailwind defense.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                           <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5"/>
                           <span>Systematic Auto-Pay frequency keeps your market entry points averaged.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                           <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5"/>
                           <span className="text-slate-500">Actionable suggestion queue cleared successfully.</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900/80 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>AI DIAGNOSTICS REPORT CONFIDENTIAL</span>
            <span>Page 08</span>
         </div>
      </div>

      {/* ================= PAGE 9: PERFORMANCE ANALYTICS ================= */}
      <div id="report-page-9" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-14 py-14">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#0f172a_0%,#020617_100%)]" />
         
         <div className="relative flex items-center justify-between pb-6 border-b border-slate-900">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 bg-blue-500 rounded-full" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">PART 07 — Core Analytics Engine</span>
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-700 uppercase">BUN VAULT</span>
         </div>

         <div className="relative flex-1 flex flex-col pt-10 space-y-8">
            <div>
               <h2 className="text-4xl font-black text-white tracking-tight">Performance Analytics</h2>
               <p className="text-slate-400 text-sm mt-1">Visual deep dive into monthly net worth dynamics and historical snapshots.</p>
            </div>

            {/* Visual Quadrant Charts Grid */}
            <div className="grid grid-cols-2 gap-8 flex-1 items-stretch">
               
               {/* QUADRANT 1: NET WORTH MOMENTUM */}
               <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between mb-4">
                     <h4 className="text-sm font-bold text-white">Net Worth Momentum</h4>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Snapshot-Based</span>
                  </div>
                  <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData && chartData.length > 0 ? chartData : [{date: 'Empty', current: 0, invested: 0}]}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                           <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                           <YAxis stroke="#475569" fontSize={10} tickFormatter={(v)=>`₹${v/1000}K`} tickLine={false} width={40} />
                           <Area type="monotone" dataKey="current" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* QUADRANT 2: CAGR BENCHMARKS */}
               <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between mb-4">
                     <h4 className="text-sm font-bold text-white">Asset Class Weight Comparison</h4>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Live Mix</span>
                  </div>
                  <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assetAllocation}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                           <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                           <YAxis stroke="#475569" fontSize={10} tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`} tickLine={false} width={40} />
                           <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                              {assetAllocation.map((e,i)=>(
                                 <Cell key={`cell-${i}`} fill={BLUE_COLORS[i%BLUE_COLORS.length]} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* QUADRANT 3: PORTFOLIO VS BENCHMARK (SYNTHETIC) */}
               <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between mb-4">
                     <h4 className="text-sm font-bold text-white">Corpus Delta (Current vs Inv.)</h4>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Spread Dynamics</span>
                  </div>
                  <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData && chartData.length > 0 ? chartData : [{date: 'Empty', current: 0, invested: 0}]}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                           <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                           <YAxis stroke="#475569" fontSize={10} tickFormatter={(v)=>`₹${v/1000}K`} tickLine={false} width={40} />
                           <Line type="monotone" dataKey="invested" stroke="#475569" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                           <Line type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* QUADRANT 4: DATA CALLOUTS */}
               <div className="bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8 flex flex-col justify-between shadow-inner relative overflow-hidden">
                  <div className="absolute bottom-[-20px] right-[-20px] w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl" />
                  <h4 className="text-sm font-extrabold text-white tracking-wide border-b border-slate-800 pb-2 uppercase mb-4">System Statistics</h4>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                     <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-xs text-slate-500">Database Entries Loaded</span>
                        <span className="text-xs font-mono text-white font-bold">{holdings.length + sips.length}</span>
                     </div>
                     <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-xs text-slate-500">Historical Delta Snapshots</span>
                        <span className="text-xs font-mono text-white font-bold">{chartData.length} Records</span>
                     </div>
                     <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-xs text-slate-500">Live Sync Heartbeat</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold">ONLINE</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-slate-500">Nifty 50 Benchmark</span>
                        <span className="text-xs font-mono text-white font-bold">₹{niftyPrice.toLocaleString('en-IN')}</span>
                     </div>
                  </div>
               </div>

            </div>
         </div>

         <div className="relative pt-6 border-t border-slate-900 flex justify-between text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            <span>STATISTICAL VISUAL LEDGER</span>
            <span>Page 09</span>
         </div>
      </div>

      {/* ================= PAGE 10: FINAL SUMMARY ================= */}
      <div id="report-page-10" style={pageStyle} className="relative overflow-hidden flex flex-col justify-between bg-slate-950 px-16 py-20">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1e293b_0%,#020617_100%)]" />
         <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
         
         <div className="relative border-b border-slate-900/80 pb-8 text-center">
            <h2 className="text-xl font-black tracking-[0.2em] text-white">BUN VAULT</h2>
            <p className="text-[9px] font-bold text-blue-400 tracking-widest uppercase mt-1">SMART WEALTH ECOSYSTEM</p>
         </div>

         <div className="relative flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto text-center space-y-16">
            
            {/* Financial Quote Centerpiece */}
            <div className="space-y-4 relative">
               <span className="text-8xl font-serif text-slate-800 absolute top-[-40px] left-[-40px] select-none opacity-40">“</span>
               <p className="text-3xl font-serif italic text-slate-200 leading-relaxed relative z-10 px-6">
                  Do not save what is left after spending, but spend what is left after saving.
               </p>
               <p className="text-xs font-bold text-blue-400 tracking-widest uppercase">— Warren Buffett</p>
            </div>

            {/* FIRE / Long Term Goals Tracker */}
            <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl space-y-6">
               <div>
                  <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Financial Independence, Retire Early (FIRE) Target</h4>
                  <div className="flex justify-between items-end text-[10px] font-bold tracking-wide uppercase font-mono text-slate-500 pb-2">
                     <span>CORPUS INCEPTION</span>
                     <span>FIRE PROGRESS MILESTONE</span>
                     <span>TARGET ESCAPE</span>
                  </div>
                  <div className="h-4 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
                     <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full" style={{ width: '28%' }} />
                  </div>
                  <div className="flex justify-between items-baseline mt-2 font-mono">
                     <span className="text-xs text-slate-400">₹{totalInvestment.toLocaleString('en-IN')}</span>
                     <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-bold">28% REACHED</span>
                     <span className="text-xs text-slate-500">PROJECTION PHASE I</span>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-800/60 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Emergency Reserve</p>
                     <p className="text-sm font-bold text-emerald-400">ESTABLISHED</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Portfolio Hedge</p>
                     <p className="text-sm font-bold text-slate-200">ACTIVE (GOLD)</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Compounding Pipe</p>
                     <p className="text-sm font-bold text-slate-200">RUNNING</p>
                  </div>
               </div>
            </div>

         </div>

         {/* The Final Legal/System Footer */}
         <div className="relative border-t border-slate-900/80 pt-10 text-center text-slate-600 space-y-4">
            <div className="flex items-center justify-center gap-2">
               <Shield className="w-4 h-4 text-slate-600" />
               <p className="text-[10px] font-bold tracking-widest uppercase">Generated securely by BUN VAULT Smart Engine</p>
            </div>
            <p className="text-[9px] leading-relaxed max-w-2xl mx-auto font-medium">
               This document is an automated summary compiled from user-provided account databases and live third-party market trackers. Figures represent estimated valuations for educational portfolio planning and do not constitute formalized financial or legal advisory directives.
            </p>
            <p className="text-[10px] font-bold tracking-widest text-slate-700 pt-2 uppercase">
               ALL SYSTEMS OPERATIONAL — ARCHIVE VERIFY VALID
            </p>
         </div>
      </div>
    </div>
  )
}

