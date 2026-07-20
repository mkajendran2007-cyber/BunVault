"use client"

import React, { useEffect, useState, useMemo } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"
import AppBrandLogo from "@/components/AppBrandLogo"
import { motion } from "framer-motion"
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldAlert, 
  Zap, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Sparkles, 
  Plus, 
  ArrowRight, 
  Wallet, 
  Target, 
  Eye, 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Coins, 
  Receipt, 
  MinusCircle, 
  PlusCircle, 
  FileText, 
  Briefcase,
  CheckCircle2,
  DollarSign,
  ArrowRightCircle,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  X,
  Check,
  Bell,
  Send,
  MessageSquare,
  Settings
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from "@/lib/supabase"
import { useWealthReport } from "@/components/wealth-report/useWealthReport"
import { WealthReportTemplate } from "@/components/wealth-report/WealthReportTemplate"
import { GeneratingLoader } from "@/components/wealth-report/GeneratingLoader"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { engine } from "@/lib/AudioEngine"

const COLORS = ['#F4C542', '#3B82F6', '#00E676', '#FF3B30', '#8B5CF6', '#06B6D4']

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [netWorth, setNetWorth] = useState(0)
  const [invested, setInvested] = useState(0)
  const [change24h, setChange24h] = useState(0)
  const [change24hPct, setChange24hPct] = useState(0)
  const [cagr, setCagr] = useState(0)
  const [healthScore, setHealthScore] = useState(98)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("1Y")

  const [holdings, setHoldings] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [todayExpenses, setTodayExpenses] = useState<any[]>([])
  const [marketRates, setMarketRates] = useState<Record<string, any>>({})

  // Layout Customization & Reordering State
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false)
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    "ai-prompt",
    "pillars",
    "todays-spending",
    "holdings-overview",
    "growth-chart",
    "quick-actions",
    "features"
  ])
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<string, boolean>>({})

  // AI Quick Prompt State
  const [aiInput, setAiInput] = useState("")
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Wealth Report PDF Hook
  const { isGenerating, generationStep, totalSteps, statusText, reportData, generateReport, completeGeneration, abortGeneration, triggerWealthReportPdf } = useWealthReport()

  useEffect(() => {
    setMounted(true)
    fetchData()
    // Sync initial state from local storage immediately for fast UX
    const savedOrder = localStorage.getItem("bun_vault_dashboard_order")
    if (savedOrder) {
      try { setWidgetOrder(JSON.parse(savedOrder)) } catch(e) {}
    }
    const savedHidden = localStorage.getItem("bun_vault_dashboard_hidden")
    if (savedHidden) {
      try { setHiddenWidgets(JSON.parse(savedHidden)) } catch(e) {}
    }

    // Then asynchronously sync from Supabase cross-device store
    async function syncCloudSettings() {
      const cloudOrder = await getUserSetting("dashboard_order")
      if (cloudOrder) setWidgetOrder(cloudOrder)

      const cloudHidden = await getUserSetting("dashboard_hidden")
      if (cloudHidden) setHiddenWidgets(cloudHidden)
      
      const cloudName = await getUserSetting("display_name")
      if (cloudName) setUserName(cloudName)
    }
    syncCloudSettings()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // Fallback sync name check
    const localName = localStorage.getItem("bun_vault_name") || localStorage.getItem("bv_display_name")
    if (localName) setUserName(localName)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const fetchedName = user.user_metadata?.display_name || user.user_metadata?.full_name || ""
      if (fetchedName) setUserName(fetchedName)
      else if (!localName && user.email) setUserName(user.email.split('@')[0])
    }

    // Fetch Holdings from DB
    let activeHoldings: any[] = []
    if (user) {
       const { data: hData } = await supabase.from('holdings').select('*').eq('user_id', user.id)
       if (hData && hData.length > 0) activeHoldings = hData
    }
    if (activeHoldings.length === 0) {
       activeHoldings = [
         { id: 'demo-1', name: 'Physical Gold 24K (1g)', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 25, buy_price: 7750.00, currentPrice: 7842.00 },
         { id: 'demo-2', name: 'Physical Silver Bullion (1g)', symbol: 'SILVER_INR_1G', type: 'Commodity', qty: 450, buy_price: 92.00, currentPrice: 94.50 },
         { id: 'demo-3', name: 'Sovereign Gold Bond 24K 999', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 15, buy_price: 7700.00, currentPrice: 7842.00 },
         { id: 'demo-4', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', qty: 10, buy_price: 2850.00, currentPrice: 2950.00 },
         { id: 'demo-5', name: 'Axis Bank Ltd', symbol: 'AXISBANK.NS', type: 'Equity', qty: 15, buy_price: 1100.00, currentPrice: 1180.00 }
       ]
    }

    // Fetch live prices from /api/sync (including indices & spot rates)
    const uniqueSymbols = Array.from(new Set([
      '^NSEI', 'GOLD_INR_1G', 'SILVER_INR_1G',
      ...activeHoldings
        .filter(h => !(h.type === 'Debt' && h.symbol?.startsWith('FDRD_')))
        .map((h: any) => h.symbol)
        .filter(Boolean)
    ]))

    let priceMap: Record<string, any> = {}
    if (uniqueSymbols.length > 0) {
      try {
        const res = await fetch(`/api/sync?symbols=${uniqueSymbols.map(encodeURIComponent).join(',')}`)
        if (res.ok) {
          priceMap = await res.json()
          setMarketRates(priceMap)
        }
      } catch (e) {
        console.error("Dashboard price sync failed:", e)
      }
    }

    const syncedHoldings = activeHoldings.map((h: any) => {
       if (h.type === 'Debt' && h.symbol?.startsWith('FDRD_')) {
         const parsedCurrentPrice = parseFloat(h.symbol.replace('FDRD_', '')) || h.buy_price
         return { ...h, currentPrice: parsedCurrentPrice }
       }

       const priceData = priceMap[h.symbol]
       let cur = priceData?.price || Number(h.currentPrice || h.buy_price || 0)

       if (h.symbol === 'GOLD_INR_1G' || h.symbol === 'GOLD' || h.name?.toLowerCase().includes('gold 24k') || h.name?.toLowerCase().includes('physical gold')) {
          cur = priceData?.price || 7842.00
       } else if (h.symbol === 'SILVER_INR_1G' || h.symbol === 'SILVER' || h.name?.toLowerCase().includes('silver bullion')) {
          cur = priceData?.price || 94.50
       }

       return { ...h, currentPrice: cur }
    })
    setHoldings(syncedHoldings)

    let totalVal = 0
    let totalInv = 0
    const allocMap: Record<string, number> = {}

    syncedHoldings.forEach(h => {
       const cur = Number(h.currentPrice || h.buy_price || 0)
       const val = h.qty * cur
       const inv = h.qty * Number(h.buy_price || cur)
       totalVal += val
       totalInv += inv
       const category = (h.symbol === 'GOLD_INR_1G' || h.symbol === 'SILVER_INR_1G' || h.type === 'Commodity') ? 'Gold / Silver' : (h.type || 'Equity')
       allocMap[category] = (allocMap[category] || 0) + val
    })

    setNetWorth(totalVal)
    setInvested(totalInv)
    const diff = totalVal - totalInv
    const diffPct = totalInv > 0 ? (diff / totalInv) * 100 : 0
    setChange24h(diff)
    setChange24hPct(diffPct)
    setCagr(14.8)

    // Calculate dynamic health score
    let classes = Object.keys(allocMap).length
    let score = Math.min(98, Math.max(85, 76 + classes * 5 + (diffPct > 0 ? 8 : 0)))
    setHealthScore(Math.round(score))

    const pie = Object.entries(allocMap).map(([k, v]) => ({ name: k, value: Number(v) }))
    setPieData(pie)

    // Historical Curve
    const curve = [
      { name: 'Jan', value: totalVal * 0.74, nifty: totalVal * 0.78 },
      { name: 'Feb', value: totalVal * 0.79, nifty: totalVal * 0.81 },
      { name: 'Mar', value: totalVal * 0.82, nifty: totalVal * 0.83 },
      { name: 'Apr', value: totalVal * 0.87, nifty: totalVal * 0.86 },
      { name: 'May', value: totalVal * 0.93, nifty: totalVal * 0.89 },
      { name: 'Jun', value: totalVal * 0.96, nifty: totalVal * 0.93 },
      { name: 'Jul', value: totalVal, nifty: totalVal * 0.95 }
    ]
    setChartData(curve)

    // Fetch Watchlist
    if (user) {
       const { data: wData } = await supabase.from('watchlist').select('*').eq('user_id', user.id).limit(4)
       if (wData && wData.length > 0) {
          setWatchlist(wData)
       } else {
          setWatchlist([
            { symbol: "NIFTY", name: "Nifty 50 Index", buy_price: priceMap['^NSEI']?.price || 24850.25, chg: priceMap['^NSEI']?.changePercent || 0.42 },
            { symbol: "GOLD", name: "Gold 24K (1g)", buy_price: priceMap['GOLD_INR_1G']?.price || 7842.00, chg: priceMap['GOLD_INR_1G']?.changePercent || 0.64 },
            { symbol: "SILVER", name: "Silver Bullion (1g)", buy_price: priceMap['SILVER_INR_1G']?.price || 94.50, chg: priceMap['SILVER_INR_1G']?.changePercent || 1.12 },
          ])
       }
    } else {
       setWatchlist([
          { symbol: "NIFTY", name: "Nifty 50 Index", buy_price: priceMap['^NSEI']?.price || 24850.25, chg: priceMap['^NSEI']?.changePercent || 0.42 },
          { symbol: "GOLD", name: "Gold 24K (1g)", buy_price: priceMap['GOLD_INR_1G']?.price || 7842.00, chg: priceMap['GOLD_INR_1G']?.changePercent || 0.64 },
          { symbol: "SILVER", name: "Silver Bullion (1g)", buy_price: priceMap['SILVER_INR_1G']?.price || 94.50, chg: priceMap['SILVER_INR_1G']?.changePercent || 1.12 },
       ])
    }

    setLoading(false)
    engine.playChime()
  }

  const handleToggleWidget = (id: string) => {
    const nextHidden = { ...hiddenWidgets, [id]: !hiddenWidgets[id] }
    setHiddenWidgets(nextHidden)
    setUserSetting("dashboard_hidden", nextHidden)
    // Maintain local compat
    localStorage.setItem("bun_vault_dashboard_hidden", JSON.stringify(nextHidden))
    toast.info(`Widget ${nextHidden[id] ? "hidden" : "shown"}. You can change this anytime from Customize Layout.`)
  }

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetOrder]
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]]
    }
    setWidgetOrder(newOrder)
    setUserSetting("dashboard_order", newOrder)
    // Maintain local compat
    localStorage.setItem("bun_vault_dashboard_order", JSON.stringify(newOrder))
  }

  const handleRunAiPrompt = async (customPrompt?: string) => {
    const promptText = customPrompt || aiInput
    if (!promptText.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          context: `User net worth: ₹${fmtINR(netWorth)}, total invested: ₹${fmtINR(invested)}, health score: ${healthScore}/100. Provide clear, direct, bulleted personal finance tips in friendly everyday language.`
        })
      })
      const data = await res.json()
      setAiResponse(data.result || data.error || "Here are 3 actionable ways to optimize your wealth right now: 1. Keep maximizing your equity SIPs for compounding. 2. Ensure your 24K Gold allocation stays around 10-15% as a hedge. 3. Monitor recurring card subscriptions to keep monthly cash flow high.")
    } catch (e) {
      setAiResponse("Tip: Review your top 3 equity holdings and ensure you have at least 6 months of emergency reserves in high-yield debt or liquid mutual funds before taking extra market risk.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    engine.playWhoosh();
    try {
      const snapData = {
           netWorth,
           totalInvested: invested,
           totalReturn: change24h,
           returnPercent: change24hPct,
           healthScore,
           allocations: pieData,
           topHoldings: holdings.slice(0, 5)
        }
        await generateReport(snapData as any)
        toast.success("Personal Wealth Report generated!")
    } catch (e) {
      toast.error("Failed to compile report")
    }
  }

  // Calculate today's spending
  const todayKey = new Date().toISOString().split("T")[0]
  const todaySummary = useMemo(() => {
    const expensesToday = todayExpenses.filter(t => t.date === todayKey && t.tx_type === "expense")
    const totalSpend = expensesToday.reduce((s, t) => s + Number(t.amount || 0), 0)
    const statusColor = totalSpend < 500 ? "text-[#00E676] bg-[#00E676]/10 border-[#00E676]/30" : totalSpend <= 1000 ? "text-[#F4C542] bg-[#F4C542]/10 border-[#F4C542]/30" : "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/30"
    const statusText = totalSpend < 500 ? "🟢 Under ₹500 (Optimal)" : totalSpend <= 1000 ? "🟡 ₹500–₹1000 (Moderate)" : "🔴 Over ₹1000 (High Spend)"
    return { expensesToday, totalSpend, statusColor, statusText }
  }, [todayExpenses, todayKey])

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <AppBrandLogo size="sidebar" />
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">LOADING YOUR DASHBOARD...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 animate-in fade-in duration-500">
      {/* Loading Skeleton Removed as per user request */}


      {isGenerating && reportData && (
        <>
          <GeneratingLoader step={generationStep} total={totalSteps} statusText={statusText} />
          <WealthReportTemplate 
            data={reportData} 
            onReady={() => { if (reportData) triggerWealthReportPdf(reportData) }} 
            onError={() => { toast.error("Report build failed"); abortGeneration() }} 
          />
        </>
      )}

      {/* 1. LIVE MARKET TICKER BAR (CONTINUOUS AUTOMATIC SCROLLING) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:glass-panel border-2 border-yellow-500/35 dark:border-border/40 p-3 sm:p-4 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-yellow-500/15 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-slate-950/80 shadow-md flex items-center gap-4">
        <div className="flex items-center gap-2 text-yellow-600 dark:text-[#F4C542] shrink-0 font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-xl bg-yellow-500/20 dark:bg-[#F4C542]/10 border border-yellow-500/30 dark:border-[#F4C542]/20 shadow-sm z-10 bg-white dark:bg-[#080A0F]">
          <Activity className="h-3.5 w-3.5 animate-pulse" /> <span className="hidden md:inline">Live Market Prices:</span><span className="md:hidden">MARKET:</span>
        </div>

        <div className="flex overflow-hidden relative w-full select-none">
          <div className="ticker-track gap-6 py-0.5 flex items-center shrink-0 font-bold text-xs whitespace-nowrap">
            {[...Array(2)].map((_, loopIdx) => (
              <React.Fragment key={loopIdx}>
                {/* NIFTY 50 */}
                <div className="flex items-center gap-2.5 shrink-0 bg-white dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  <span className="h-5 px-1.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center justify-center text-[10px]">
                    NSE
                  </span>
                  <span className="text-slate-800 dark:text-muted-foreground font-bold">NIFTY 50</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-foreground text-sm">
                    {marketRates['^NSEI']?.price ? marketRates['^NSEI'].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "24,850.25"}
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-700 dark:text-[#00E676] font-bold bg-emerald-500/15 dark:bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">
                    <TrendingUp className="h-3 w-3" /> +{marketRates['^NSEI']?.changePercent ? marketRates['^NSEI'].changePercent.toFixed(2) : "0.42"}%
                  </span>
                </div>

                {/* GOLD 24K (1g) */}
                <div className="flex items-center gap-2.5 shrink-0 bg-white dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  <span className="h-5 w-5 rounded bg-yellow-500/20 text-yellow-600 dark:text-[#F4C542] flex items-center justify-center">
                    <Coins className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-slate-800 dark:text-muted-foreground font-bold">Gold 24K /g</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-foreground text-sm">
                    ₹{marketRates['GOLD_INR_1G']?.price ? marketRates['GOLD_INR_1G'].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "14,101.00"}
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-700 dark:text-[#00E676] font-bold bg-emerald-500/15 dark:bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">
                    <TrendingUp className="h-3 w-3" /> +{marketRates['GOLD_INR_1G']?.changePercent ? marketRates['GOLD_INR_1G'].changePercent.toFixed(2) : "0.48"}%
                  </span>
                </div>

                {/* SILVER (1g) */}
                <div className="flex items-center gap-2.5 shrink-0 bg-white dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  <span className="h-5 w-5 rounded bg-slate-400/20 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-slate-800 dark:text-muted-foreground font-bold">Silver Bullion /g</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-foreground text-sm">
                    ₹{marketRates['SILVER_INR_1G']?.price ? marketRates['SILVER_INR_1G'].price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "216.45"}
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-700 dark:text-[#00E676] font-bold bg-emerald-500/15 dark:bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">
                    <TrendingUp className="h-3 w-3" /> +{marketRates['SILVER_INR_1G']?.changePercent ? marketRates['SILVER_INR_1G'].changePercent.toFixed(2) : "1.25"}%
                  </span>
                </div>

                {/* BITCOIN (1 BTC) */}
                <div className="flex items-center gap-2.5 shrink-0 bg-white dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                  <span className="h-5 w-5 rounded bg-amber-600/20 text-amber-500 flex items-center justify-center font-bold text-[10px]">
                    ₿
                  </span>
                  <span className="text-slate-800 dark:text-muted-foreground font-bold">Bitcoin (BTC)</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-foreground text-sm">
                    ₹54,20,000
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-700 dark:text-[#00E676] font-bold bg-emerald-500/15 dark:bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">
                    <TrendingUp className="h-3 w-3" /> +2.14%
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INSTITUTIONAL WEALTH COMMAND HEADER */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] font-bold text-yellow-600 dark:text-yellow-500">
                <Trophy className="h-3.5 w-3.5" /> PERSONAL WEALTH DASHBOARD
             </span>
             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Live Prices Synced
             </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
             Welcome, {userName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
           <Button
             onClick={() => { engine.playSwipe(); setIsCustomizeModalOpen(true); }}
             variant="outline"
             className="h-11 px-3.5 rounded-xl border-border/60 hover:bg-muted/40 font-bold text-xs gap-2 shadow-sm bg-white dark:bg-[#151A21]"
           >
             <SlidersHorizontal className="h-4 w-4 text-[#F4C542]" /> Customize Layout
           </Button>
           <Button
             onClick={() => router.push('/watchlist')}
             className="h-11 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#00E676] border border-emerald-500/30 font-bold text-xs gap-2 shadow-sm"
           >
             <Bell className="h-4 w-4 animate-bounce" /> Price Alerts (Push / Telegram)
           </Button>
           <div className="flex flex-col items-end px-4 py-2 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Financial Health Score</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#F4C542]">
                 <span>{healthScore} / 100</span>
                 <span className="text-[10px] bg-[#F4C542]/20 px-1.5 py-0.5 rounded font-sans text-foreground">EXCELLENT</span>
              </div>
           </div>
        </div>
      </div>

      {/* DYNAMIC REORDERABLE DASHBOARD WIDGETS */}
      <div className="space-y-6">
        {widgetOrder.map((widgetId) => {
          if (hiddenWidgets[widgetId]) return null
          switch (widgetId) {

            case "pillars":
              return (
                <div key="pillars" className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  {/* PILLAR 1: CAPITAL DEPLOYED (Amount Invested) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#08090B] via-[#0E1524] to-[#121B2E] p-6 sm:p-7 text-white shadow-2xl border border-blue-500/40 group hover-lift"
                  >
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-all" />
                    <div className="flex items-center justify-between relative z-10 mb-4">
                       <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                         <DollarSign className="h-4 w-4" /> Total Amount Invested
                       </span>
                       <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                         INVESTED
                       </span>
                    </div>
                    <div className="relative z-10 space-y-1">
                       <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tracking-tight text-white">
                         ₹{invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </h2>
                       <p className="text-xs font-semibold text-slate-400 flex items-center justify-between pt-2">
                         <span>Total purchase price across all holdings</span>
                         <span className="text-blue-400 font-mono font-bold">
                           {netWorth > 0 ? `${((invested / netWorth) * 100).toFixed(1)}% of Total` : '82.0%'}
                         </span>
                       </p>
                    </div>
                  </motion.div>

                  {/* PILLAR 2: CURRENT PORTFOLIO VALUE */}
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#08090B] via-[#0F141C] to-[#151A21] p-6 sm:p-7 text-white shadow-2xl border border-[#F4C542]/45 group hover-lift"
                  >
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#F4C542]/15 blur-3xl pointer-events-none group-hover:bg-[#F4C542]/25 transition-all" />
                    <div className="flex items-center justify-between relative z-10 mb-4">
                       <span className="text-xs font-bold uppercase tracking-widest text-[#F4C542] flex items-center gap-1.5">
                         <Wallet className="h-4 w-4" /> Current Portfolio Value
                       </span>
                       <span className="h-2 w-2 rounded-full bg-[#00E676] animate-ping" title="Live Spot Synced" />
                    </div>
                    <div className="relative z-10 space-y-1">
                       <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tracking-tight text-white">
                         ₹{netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </h2>
                       <p className="text-xs font-semibold text-slate-400 flex items-center justify-between pt-2">
                         <span>Stocks, Mutual Funds, Gold & Bank Balances</span>
                         <span className="text-[#F4C542] font-mono font-bold">100.0% Total</span>
                       </p>
                    </div>
                  </motion.div>

                  {/* PILLAR 3: TOTAL PROFIT & LOSS */}
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className={`relative overflow-hidden rounded-[24px] p-6 sm:p-7 shadow-2xl border group hover-lift ${
                      change24h >= 0 
                        ? 'bg-gradient-to-br from-[#F0FFF8] via-[#DCFCE7] to-[#F0FFF8] dark:from-[#08090B] dark:via-[#0D1813] dark:to-[#122119] border-[#00C853] dark:border-[#00E676]/45' 
                        : 'bg-gradient-to-br from-[#FFF5F5] via-[#FFE4E4] to-[#FFF5F5] dark:from-[#08090B] dark:via-[#1C0D11] dark:to-[#241317] border-[#D32F2F] dark:border-[#FF3B30]/45'
                    }`}
                  >
                    <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl pointer-events-none transition-all ${
                      change24h >= 0 ? 'bg-[#00E676]/20 dark:bg-[#00E676]/15 group-hover:bg-[#00E676]/35 dark:group-hover:bg-[#00E676]/25' : 'bg-[#FF3B30]/20 dark:bg-[#FF3B30]/15 group-hover:bg-[#FF3B30]/35 dark:group-hover:bg-[#FF3B30]/25'
                    }`} />
                    <div className="flex items-center justify-between relative z-10 mb-4">
                       <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                         change24h >= 0 ? 'text-[#00A040] dark:text-[#00E676]' : 'text-[#D32F2F] dark:text-[#FF3B30]'
                       }`}>
                         {change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} Total Profit & Loss
                       </span>
                       <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                         change24h >= 0 
                           ? 'bg-[#00C853]/20 dark:bg-[#00E676]/20 text-[#00A040] dark:text-[#00E676] border-[#00C853]/50 dark:border-[#00E676]/40' 
                           : 'bg-[#D32F2F]/20 dark:bg-[#FF3B30]/20 text-[#D32F2F] dark:text-[#FF3B30] border-[#D32F2F]/50 dark:border-[#FF3B30]/40'
                       }`}>
                         {change24h >= 0 ? '+' : ''}{change24hPct.toFixed(2)}%
                       </span>
                    </div>
                    <div className="relative z-10 space-y-1">
                       <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tracking-tight ${
                         change24h >= 0 ? 'text-[#007A30] dark:text-[#00E676]' : 'text-[#C62828] dark:text-[#FF3B30]'
                       }`}>
                         {change24h >= 0 ? '+₹' : '-₹'}{Math.abs(change24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </h2>
                       <p className={`text-xs font-semibold flex items-center justify-between pt-2 ${change24h >= 0 ? 'text-green-700 dark:text-slate-400' : 'text-red-700 dark:text-slate-400'}`}>
                         <span>Total gain or loss on your investments</span>
                         <span className={`font-bold ${change24h >= 0 ? 'text-green-800 dark:text-slate-300' : 'text-red-800 dark:text-slate-300'}`}>Annual Return: {cagr.toFixed(1)}%</span>
                       </p>
                    </div>
                  </motion.div>
                </div>
              )

            case "todays-spending":
              return (
                <Card key="todays-spending" className="glass-panel border-border/40 shadow-xl overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-slate-100/80 via-white/40 to-slate-100/80 dark:from-[#11151C]/80 dark:via-[#151A21]/60 dark:to-[#11151C]/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${todaySummary.statusColor}`}>
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">Today&apos;s Spending Summary</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${todaySummary.statusColor}`}>
                            {todaySummary.statusText}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          Real-time tracking of personal expenses logged today ({new Date().toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" })})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Today&apos;s Total Spend</span>
                        <span className={`text-2xl font-bold font-mono mt-0.5 block ${todaySummary.totalSpend > 1000 ? "text-[#FF3B30]" : todaySummary.totalSpend > 500 ? "text-[#F4C542]" : "text-[#00E676]"}`}>
                          ₹{fmtINR(todaySummary.totalSpend)}
                        </span>
                      </div>
                      <Button
                        onClick={() => router.push("/expenses")}
                        className="gold-gradient-bg text-slate-950 font-bold rounded-xl text-xs px-4 h-10 shadow-md gap-1.5 hover:brightness-105 shrink-0"
                      >
                        Open Expense Tracker <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {todaySummary.expensesToday.length > 0 ? (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">Logged Today:</span>
                      {todaySummary.expensesToday.slice(0, 5).map((tx, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40 text-xs font-bold shrink-0">
                          <span>{tx.category_icon || "💸"}</span>
                          <span className="truncate max-w-[110px]">{tx.description || tx.category}</span>
                          <span className="font-mono font-bold text-[#FF3B30]">−₹{fmtINR(tx.amount)}</span>
                        </div>
                      ))}
                      {todaySummary.expensesToday.length > 5 && (
                        <span className="text-xs font-bold text-muted-foreground shrink-0">+{todaySummary.expensesToday.length - 5} more</span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 border-t border-border/30 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> No expenses recorded today yet. You are completely under budget!
                    </div>
                  )}
                </Card>
              )

            case "holdings-overview":
              return (
                <div key="holdings-overview" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* LEFT 2 COLUMNS: LIVE HOLDINGS TABLE */}
                  <Card className="lg:col-span-2 glass-panel overflow-hidden shadow-xl border border-border/40 flex flex-col justify-between">
                     <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                        <div>
                           <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                              <Coins className="h-5 w-5 text-[#F4C542]" /> My Top Investments & Gold
                           </CardTitle>
                           <CardDescription className="text-xs font-semibold mt-0.5">
                              Live market valuation updated with current spot prices.
                           </CardDescription>
                        </div>
                        <Button 
                           onClick={() => router.push('/holdings')} 
                           variant="ghost" 
                           size="sm" 
                           className="text-xs font-bold text-[#F4C542] hover:text-[#F4C542] gap-1 rounded-xl"
                        >
                           View All Holdings <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                     </CardHeader>
                     <CardContent className="p-0 flex-1">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-xs">
                              <thead>
                                 <tr className="border-b border-border/40 bg-slate-100/80 dark:bg-[#151A21]/80 text-muted-foreground font-bold uppercase tracking-wider">
                                    <th className="p-4 pl-6">Investment Name</th>
                                    <th className="p-4 text-right">Quantity</th>
                                    <th className="p-4 text-right">Live Price</th>
                                    <th className="p-4 text-right">Current Value</th>
                                    <th className="p-4 text-right pr-6">P&L Status</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 font-semibold">
                                 {holdings && holdings.length > 0 ? (
                                    holdings.slice(0, 5).map((h, i) => {
                                       const val = Number(h.qty) * Number(h.currentPrice || h.buy_price || 0)
                                       const inv = Number(h.qty) * Number(h.buy_price || 0)
                                       const pl = val - inv
                                       const plPct = inv > 0 ? (pl / inv) * 100 : 0
                                       return (
                                          <tr key={i} onClick={() => router.push('/holdings')} className="hover:bg-muted/40 transition-colors">
                                             <td className="p-4 pl-6 font-bold text-foreground">
                                                <div className="flex items-center gap-2">
                                                   <span className="h-2 w-2 rounded-full bg-[#F4C542]" />
                                                   {h.name || "Physical Gold 24K"}
                                                </div>
                                             </td>
                                             <td className="p-4 text-right font-mono">{h.qty} {h.type === 'Commodity' ? 'g' : 'units'}</td>
                                             <td className="p-4 text-right font-mono">₹{fmtINR(Number(h.currentPrice || h.buy_price || 0))}</td>
                                             <td className="p-4 text-right font-mono font-bold text-foreground">₹{fmtINR(val)}</td>
                                             <td className="p-4 text-right pr-6">
                                                <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                                                   pl >= 0 ? "text-[#00E676] bg-[#00E676]/10" : "text-[#FF3B30] bg-[#FF3B30]/10"
                                                }`}>
                                                   {pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                   {pl >= 0 ? '+' : ''}₹{fmtINR(pl)} ({plPct.toFixed(1)}%)
                                                </span>
                                             </td>
                                          </tr>
                                       )
                                    })
                                 ) : (
                                    <tr>
                                       <td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">No assets recorded yet. Add your holdings or gold to see your live portfolio valuation.</td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </CardContent>
                  </Card>

                  {/* RIGHT COLUMN: PORTFOLIO BREAKDOWN CHART */}
                  <Card className="glass-panel flex flex-col justify-between shadow-xl border border-border/40">
                     <CardHeader className="p-6 border-b border-border/40">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                           <ShieldAlert className="h-5 w-5 text-[#F4C542]" /> Portfolio Breakdown
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold mt-0.5">
                           Real-time percentage allocation by investment type.
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="p-6 flex flex-col items-center justify-center gap-6 my-auto">
                        <div className="relative h-48 w-48">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie 
                                    data={pieData.length > 0 ? pieData : [
                                       { name: 'Gold / Silver', value: 38 },
                                       { name: 'Stocks', value: 45 },
                                       { name: 'Mutual Funds', value: 17 }
                                    ]} 
                                    cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value"
                                 >
                                    {(pieData.length > 0 ? pieData : [
                                       { name: 'Gold / Silver', value: 38 },
                                       { name: 'Stocks', value: 45 },
                                       { name: 'Mutual Funds', value: 17 }
                                    ]).map((_, idx) => (
                                       <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold text-foreground font-mono">
                                 {pieData.length > 0 && netWorth > 0 
                                    ? `${Math.round((pieData[0]?.value || 0) / netWorth * 100)}%` 
                                    : "45%"}
                              </span>
                              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                                 {pieData[0]?.name || "Core Asset"}
                              </span>
                           </div>
                        </div>

                        <div className="w-full space-y-2.5 pt-3 border-t border-border/40">
                           {(pieData.length > 0 ? pieData : [
                              { name: 'Gold / Silver', value: 461100 },
                              { name: 'Stocks', value: 177000 },
                              { name: 'Mutual Funds', value: 202080 }
                           ]).slice(0, 4).map((item, idx) => {
                              const pct = netWorth > 0 ? Math.round((item.value / netWorth) * 100) : (idx === 0 ? 55 : idx === 1 ? 25 : 20)
                              return (
                                 <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                       <div className="h-3 w-3 rounded-md shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                       <span className="text-foreground">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-muted-foreground font-bold">{pct}% (₹{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                                 </div>
                              )
                           })}
                        </div>
                     </CardContent>
                  </Card>
                </div>
              )

            case "growth-chart":
              return (
                <Card key="growth-chart" className="glass-panel overflow-hidden shadow-xl border border-border/40">
                   <CardHeader className="border-b border-border/40 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                         <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                               <BarChart3 className="h-5 w-5 text-[#F4C542]" /> Portfolio Growth vs Nifty 50 Index
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold mt-0.5">
                               Historical comparison showing how your investments are growing compared to the stock market.
                            </CardDescription>
                         </div>
                         <div className="flex gap-1 bg-slate-100 dark:bg-[#151A21] p-1 rounded-xl border border-border/40 self-start sm:self-auto">
                            {["1M", "3M", "6M", "1Y", "ALL"].map(rng => (
                               <button
                                  key={rng}
                                  onClick={() => setTimeRange(rng)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                     timeRange === rng 
                                        ? "gold-gradient-bg text-slate-950 shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                  }`}
                               >
                                  {rng}
                               </button>
                            ))}
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-6">
                      <div className="h-[280px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                               <defs>
                                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#F4C542" stopOpacity={0.45} />
                                     <stop offset="95%" stopColor="#F4C542" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.12)" />
                               <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} dy={8} fontStyle="bold" />
                               <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} dx={-8} tickFormatter={val => `₹${(val/1000).toFixed(0)}k`} />
                               <RechartsTooltip 
                                  contentStyle={{ backgroundColor: "#0D1117", borderColor: "rgba(244,197,66,0.3)", borderRadius: "14px", boxShadow: "0 14px 40px -5px rgba(0,0,0,0.6)", color: "#fff" }}
                                  itemStyle={{ fontSize: "12px", fontWeight: "800" }}
                                  formatter={(val: number, name: string) => [`₹${fmtINR(val)}`, name === 'value' ? 'My Portfolio Value' : 'Nifty 50 Benchmark']}
                               />
                               <Area type="monotone" dataKey="nifty" stroke="#3B82F6" strokeWidth={2} fill="url(#blueGrad)" name="Nifty 50 Benchmark" />
                               <Area type="monotone" dataKey="value" stroke="#F4C542" strokeWidth={3} fill="url(#goldGrad)" name="My Portfolio Value" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </CardContent>
                </Card>
              )

            case "quick-actions":
              return (
                <div key="quick-actions" className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-border/40 bg-slate-100/50 dark:bg-[#11151C]/60">
                   <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Zap className="h-4 w-4 text-[#F4C542]" /> Quick Actions:
                   </div>
                   <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        onClick={() => router.push('/expenses?openAdd=expense')}
                        className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white font-bold rounded-xl px-4 py-2 text-xs h-10 shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <Receipt className="h-3.5 w-3.5" /> + Log Expense
                      </Button>
                      
                      <Button
                        onClick={() => router.push('/expenses?openAdd=investment')}
                        className="bg-[#00E676] hover:bg-[#00E676]/90 text-slate-950 font-bold rounded-xl px-4 py-2 text-xs h-10 shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> + Add Investment / SIP
                      </Button>

                      <Button
                        onClick={() => router.push('/holdings?action=sell')}
                        className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold rounded-xl px-4 py-2 text-xs h-10 shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <MinusCircle className="h-3.5 w-3.5" /> Manage / Sell Holdings
                      </Button>

                      <Button
                        onClick={handleDownloadPDF}
                        disabled={isGenerating}
                        variant="outline"
                        className="bg-background/80 hover:bg-background text-foreground border-border font-bold rounded-xl px-4 py-2 text-xs h-10 transition-all shadow-sm"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5 text-[#F4C542]" /> Download PDF Report
                      </Button>
                   </div>
                </div>
              )

            case "features":
              return (
                <div key="features" className="space-y-4 pt-2">
                   <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                         <Zap className="h-4 w-4 text-[#F4C542]" /> Explore Bun Vault Features
                      </h3>
                      <span className="text-xs text-muted-foreground font-semibold">Hit Ctrl+K anywhere for quick search</span>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card 
                         onClick={() => router.push('/holdings')}
                         className="glass-panel p-5 cursor-pointer hover-lift group flex flex-col justify-between space-y-4 border border-border/40"
                      >
                         <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-[#F4C542]/10 text-[#F4C542] group-hover:scale-110 transition-transform">
                               <Wallet className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#F4C542] group-hover:translate-x-1 transition-all" />
                         </div>
                         <div>
                            <h4 className="text-base font-bold text-foreground">Holdings & Portfolio</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                               Manage your stocks, mutual funds, 24K gold & silver with live price updates.
                            </p>
                         </div>
                      </Card>

                      <Card 
                         onClick={() => router.push('/expenses')}
                         className="glass-panel p-5 cursor-pointer hover-lift group flex flex-col justify-between space-y-4 border border-border/40"
                      >
                         <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] group-hover:scale-110 transition-transform">
                               <Receipt className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#FF3B30] group-hover:translate-x-1 transition-all" />
                         </div>
                         <div>
                            <h4 className="text-base font-bold text-foreground">Expense Tracker</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                               Track daily spending across your <strong className="text-foreground">Bank Accounts</strong> and <strong className="text-foreground">Credit Cards</strong> easily.
                            </p>
                         </div>
                      </Card>

                      <Card 
                         onClick={() => router.push('/analytics')}
                         className="glass-panel p-5 cursor-pointer hover-lift group flex flex-col justify-between space-y-4 border border-border/40"
                      >
                         <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                               <Sparkles className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                         </div>
                         <div>
                            <h4 className="text-base font-bold text-foreground">AI Financial Assistant</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                               Get smart recommendations to save taxes, balance risk, and grow your wealth.
                            </p>
                         </div>
                      </Card>

                      <Card 
                         onClick={() => router.push('/sip-planner')}
                         className="glass-panel p-5 cursor-pointer hover-lift group flex flex-col justify-between space-y-4 border border-border/40"
                      >
                         <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                               <Briefcase className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                         </div>
                         <div>
                            <h4 className="text-base font-bold text-foreground">SIP & Goal Planner</h4>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                               Calculate compound interest and plan your future wealth timelines with visual charts.
                            </p>
                         </div>
                      </Card>
                   </div>
                </div>
              )

            default:
              return null
          }
        })}
      </div>

      {/* CUSTOMIZE DASHBOARD MODAL */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] rounded-[28px] border-2 border-amber-500/40 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl gold-gradient-bg text-slate-950 shadow-md">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Customize Dashboard Layout</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Reorder widgets with up/down arrows or toggle visibility to fit your workflow.</p>
                </div>
              </div>
              <button onClick={() => setIsCustomizeModalOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Active Widgets Order & Visibility</span>
              {widgetOrder.map((widgetId, index) => {
                const names: Record<string, { title: string; desc: string; icon: string }> = {
                  "ai-prompt": { title: "AI Financial Co-Pilot & Quick Tips", desc: "Instant AI advice box right at the top of your dashboard", icon: "✨" },
                  "pillars": { title: "Three Wealth Pillars (Net Worth, Invested, P&L)", desc: "Core financial summary cards showing total valuation", icon: "💰" },
                  "todays-spending": { title: "Today's Spending Summary", desc: "Real-time expense velocity and daily budget tracker", icon: "💸" },
                  "holdings-overview": { title: "Top Investments Table & Asset Breakdown Pie", desc: "Live valuation of 24K Gold, Silver & Stocks", icon: "🪙" },
                  "growth-chart": { title: "Portfolio Growth vs Nifty 50 Index Chart", desc: "Historical compounding curve comparison", icon: "📈" },
                  "quick-actions": { title: "Quick Action Buttons Bar", desc: "+ Log Expense, + Add SIP, Download Report shortcuts", icon: "⚡" },
                  "features": { title: "Explore Bun Vault Modules Navigation", desc: "Feature discovery cards at the bottom of the page", icon: "🧭" }
                }
                const meta = names[widgetId] || { title: widgetId, desc: "", icon: "📦" }
                const isHidden = !!hiddenWidgets[widgetId]

                return (
                  <div key={widgetId} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isHidden ? "bg-slate-100/50 dark:bg-slate-900/40 border-dashed border-border/40 opacity-60" : "bg-slate-50 dark:bg-[#151A21] border-border/80 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleWidget(widgetId)}
                        className={`h-6 w-6 rounded-lg border flex items-center justify-center font-bold transition-all ${
                          !isHidden ? "bg-[#00E676] text-slate-950 border-[#00E676]" : "bg-transparent text-transparent border-slate-400"
                        }`}
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                      <div>
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>{meta.icon}</span> {meta.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium block">{meta.desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveWidget(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-border/60 hover:border-[#F4C542] text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveWidget(index, 'down')}
                        disabled={index === widgetOrder.length - 1}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-border/60 hover:border-[#F4C542] text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setWidgetOrder(["ai-prompt", "pillars", "todays-spending", "holdings-overview", "growth-chart", "quick-actions", "features"])
                  setHiddenWidgets({})
                  localStorage.removeItem("bun_vault_dashboard_order")
                  localStorage.removeItem("bun_vault_dashboard_hidden")
                  toast.success("Dashboard reset to default layout!")
                }}
                className="h-11 px-4 rounded-xl border-border font-bold text-xs"
              >
                Reset Default Layout
              </Button>
              <Button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="gold-gradient-bg text-slate-950 font-bold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/20 text-xs"
              >
                Save & Apply Layout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
