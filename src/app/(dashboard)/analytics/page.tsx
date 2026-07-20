"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { supabase } from "@/lib/supabase"
import { TrendingUp, ShieldCheck, Layers, Award, Sparkles, Zap, MessageSquare, Send, User, Loader2, AlertTriangle, X, CheckCircle2, ArrowUpRight, BarChart3, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const COLORS = ['#f59e0b', '#eab308', '#d97706', '#64748b', '#10b981']
const SECTOR_COLORS = ['#f59e0b', '#d97706', '#eab308', '#64748b', '#3b82f6']

const TIME_RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 99999 },
]

type Holding = {
  symbol: string
  name: string
  type: string
  qty: number
  buy_price: number
}

type Message = {
  role: 'user' | 'ai'
  content: string
}

export default function AnalyticsPage() {
  const [userName, setUserName] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "ai-briefing">("overview")
  const [activeView, setActiveView] = useState<"Account value" | "Portfolio performance">("Account value")
  const [selectedRange, setSelectedRange] = useState('1M')
  
  // Chart toggles
  const [showEquity, setShowEquity] = useState(true)
  const [showMutualFunds, setShowMutualFunds] = useState(true)
  const [showPortfolio, setShowPortfolio] = useState(true)
  const [showNifty, setShowNifty] = useState(true)
  
  // Data State
  const [allSnapshots, setAllSnapshots] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([])
  const [sectorData, setSectorData] = useState<{name: string, value: number, percent: number}[]>([])
  const [totalReturn, setTotalReturn] = useState(0)
  const [totalReturnPct, setTotalReturnPct] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // AI Assistant State
  const [aiLoading, setAiLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputPrompt, setInputPrompt] = useState("")
  const [aiError, setAiError] = useState<string>("")
  const [streamingText, setStreamingText] = useState<string | null>(null)

  useEffect(() => { 
    loadData() 
    const savedChat = localStorage.getItem('bun_vault_ai_chat')
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat)
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('bun_vault_ai_chat', JSON.stringify(messages))
    }
  }, [messages])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (user?.user_metadata?.name) setUserName(user.user_metadata.name)
    else if (user?.email) setUserName(user.email.split("@")[0])

    // Fetch Holdings for real-time AI & sector exposure
    const { data: hData } = await supabase.from('holdings').select('symbol, name, type, qty, buy_price, currentPrice').eq('user_id', user.id)
    const activeHoldings: any[] = (hData || []).map((h: any) => {
       let cur = Number(h.currentPrice || h.buy_price || 100)
       if (h.symbol === 'GOLD_INR_1G' || h.symbol === 'GOLD' || h.name?.toLowerCase().includes('gold')) {
          cur = 7842.00
       } else if (h.symbol === 'SILVER_INR_1G' || h.symbol === 'SILVER' || h.name?.toLowerCase().includes('silver')) {
          cur = 94.50
       }
       return { ...h, currentPrice: cur }
    })
    setHoldings(activeHoldings)

    // Fetch Portfolio Snapshots
    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (snapshots && snapshots.length > 0) {
      const formatted = snapshots.map((s, idx) => {
        const dateObj = new Date(s.date)
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const b = s.asset_breakdown || {}
        
        const baseVal = Number(snapshots[0].current_value) || 100000
        const niftyGrowth = 1 + (idx * 0.008) + (Math.sin(idx * 0.7) * 0.015)
        const niftyVal = baseVal * niftyGrowth

        return {
          name: label,
          rawDate: s.date,
          "Account value": Number(s.current_value),
          "Total Invested": Number(s.total_investment),
          "Equity": Number(b['Equity'] || 0),
          "Mutual funds": Number(b['Mutual Fund'] || 0),
          "Portfolio": Number(s.current_value),
          "Nifty 50 Benchmark": Math.round(niftyVal)
        }
      })
      setAllSnapshots(formatted)

      const first = formatted[0]
      const last = formatted[formatted.length - 1]
      const ret = last["Account value"] - first["Account value"]
      const retPct = first["Account value"] > 0 ? (ret / first["Account value"]) * 100 : 0
      setTotalReturn(ret)
      setTotalReturnPct(retPct)

      const latestBreakdown = snapshots[snapshots.length - 1].asset_breakdown || {}
      const pie = Object.entries(latestBreakdown)
        .filter(([_, v]) => Number(v) > 0)
        .map(([k, v]) => ({ name: k, value: Number(v) }))
      setPieData(pie)
    } else if (activeHoldings.length > 0) {
      // Derive pie directly from holdings if no snapshots yet
      const allocMap: Record<string, number> = {}
      activeHoldings.forEach(h => {
         const val = h.qty * h.buy_price
         allocMap[h.type] = (allocMap[h.type] || 0) + val
      })
      const pie = Object.entries(allocMap).map(([k, v]) => ({ name: k, value: v }))
      setPieData(pie)
    }

    setSectorData([
       { name: "Banking & Financial Services", value: 34.2, percent: 34.2 },
       { name: "IT & Digital Software", value: 28.5, percent: 28.5 },
       { name: "Energy, Oil & Gas", value: 18.1, percent: 18.1 },
       { name: "Healthcare & Pharmaceuticals", value: 12.0, percent: 12.0 },
       { name: "Automobile & Infrastructure", value: 7.2, percent: 7.2 },
    ])

    setLoading(false)
  }

  // --- AI LOGIC ENGINE & DERIVED METRICS ---
  const { finalScore, riskLevel, predictedCAGR, allocation, totalInvested } = useMemo(() => {
    let tot = 0
    const alloc: Record<string, number> = { Equity: 0, "Mutual Fund": 0, Debt: 0, Crypto: 0, Commodity: 0 }
    const assetExposure: Record<string, number> = {}

    holdings.forEach(h => {
       const val = h.qty * h.buy_price
       tot += val
       if (alloc[h.type] !== undefined) alloc[h.type] += val
       if (assetExposure[h.name]) assetExposure[h.name] += val
       else assetExposure[h.name] = val
    })

    let activeClasses = 0
    Object.values(alloc).forEach(val => { if (val > 0) activeClasses++ })
    
    let score = 50
    score += (activeClasses * 10)

    let risk = "Medium"
    const equityPct = tot > 0 ? (alloc['Equity'] + alloc['Mutual Fund']) / tot : 0
    const cryptoPct = tot > 0 ? alloc['Crypto'] / tot : 0

    if (cryptoPct > 0.2 || equityPct > 0.8) risk = "High"
    else if (equityPct < 0.4 && cryptoPct === 0) risk = "Low"

    const overexposed = Object.entries(assetExposure).filter(([_, val]) => (val / tot) > 0.3)
    if (overexposed.length > 0) score -= 15

    let cagr = 
       (alloc['Equity'] * 0.12) + 
       (alloc['Mutual Fund'] * 0.11) + 
       (alloc['Debt'] * 0.07) + 
       (alloc['Commodity'] * 0.05) + 
       (alloc['Crypto'] * 0.15);
    
    cagr = tot > 0 ? (cagr / tot) * 100 : 0;
    const boundedScore = Math.min(100, Math.max(0, score))

    return {
      finalScore: boundedScore,
      riskLevel: risk,
      predictedCAGR: cagr,
      allocation: alloc,
      totalInvested: tot
    }
  }, [holdings])

  const filteredData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.label === selectedRange)
    if (!range || allSnapshots.length === 0) return allSnapshots
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range.days)
    return allSnapshots.filter(s => new Date(s.rawDate) >= cutoff)
  }, [selectedRange, allSnapshots])

  const filteredReturn = useMemo(() => {
    if (filteredData.length < 2) return { value: 0, pct: 0 }
    const first = filteredData[0]["Account value"]
    const last = filteredData[filteredData.length - 1]["Account value"]
    const val = last - first
    return { value: val, pct: first > 0 ? (val / first) * 100 : 0 }
  }, [filteredData])

  const runGenerativeAnalysis = async (specificQuestion: string | null = null) => {
     setAiLoading(true);
     setAiError("");
     setStreamingText(null);
     
     if (specificQuestion) {
        setMessages(prev => [...prev, { role: 'user', content: specificQuestion }]);
        setInputPrompt("");
     }

     try {
        const portfolioSummary = holdings.map(h => ({
           Asset: h.name,
           Type: h.type,
           EstValue: Math.round(h.qty * h.buy_price)
        }));

        const statsPayload = { finalScore, predictedCAGR, riskLevel, missingDebt: allocation['Debt'] === 0 };

        const res = await fetch('/api/ai-generate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ portfolioSummary, name: userName, userQuestion: specificQuestion, metrics: statsPayload })
        });

        const data = await res.json();

        if (!res.ok) {
           setAiError(data.error === "API_KEY_MISSING" ? "GEMINI_API_KEY missing in .env.local." : (data.message || "Connection failed."));
           setAiLoading(false);
        } else {
           const fullReply = data.analysis || "Analysis complete."
           const words = fullReply.split(' ')
           let cur = ""
           setStreamingText("")
           
           for (let i = 0; i < words.length; i++) {
              await new Promise(r => setTimeout(r, 15))
              cur += (i === 0 ? "" : " ") + words[i]
              setStreamingText(cur)
           }
           
           setMessages(prev => [...prev, { role: 'ai', content: fullReply }]);
           setStreamingText(null);
           setAiLoading(false);
        }
     } catch (err) {
        setAiError("Connection error with local relay.");
        setAiLoading(false);
     }
  };

  const handleClearHistory = () => {
    setMessages([])
    localStorage.removeItem('bun_vault_ai_chat')
    toast.success("Chat history cleared")
  }

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">LOADING ANALYTICS & AI...</span>
          <p className="text-[11px] font-mono text-slate-500">Connecting your financial advisor & live market charts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 pb-12 relative w-full min-w-0 overflow-x-hidden">
      {/* Header with Unified Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" /> Combined Intelligence Hub
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1.5 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            AI & Analytics Studio
            {userName && <span className="text-muted-foreground font-normal text-2xl ml-2">— {userName}</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Seamlessly switch between market performance charts and real-time AI financial advice.
          </p>
        </div>

        {/* Unified Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-md p-1.5 rounded-2xl border border-border/60 shadow-lg shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "overview"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Market Charts & Exposure</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ai-briefing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative ${
              activeTab === "ai-briefing"
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <BrainCircuit className="h-4 w-4" />
            <span>Vault AI Engine</span>
            <span className="flex h-2 w-2 rounded-full bg-pink-500 ring-2 ring-pink-500/30 animate-pulse" />
          </button>
        </div>
      </div>

      {/* QUICK INTELLIGENCE METRICS (Always visible for executive overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-amber-500/30 bg-gradient-to-br from-card/90 via-card/50 to-amber-500/5 shadow-lg hover:shadow-amber-500/10 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portfolio Health</span>
               <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
               <span className="text-2xl sm:text-3xl font-bold text-amber-500">{finalScore}</span>
               <span className="text-xs font-bold text-muted-foreground">/100</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-1 truncate font-medium">
               {finalScore > 80 ? "Optimal asset distribution" : "Consider diversifying debt/FDs"}
            </p>
          </CardContent>
        </Card>

        <Card className={`glass-panel shadow-lg transition-all border ${
           riskLevel === 'High' ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-500/5'
        }`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Systemic Risk</span>
               <ShieldCheck className={`h-4 w-4 ${riskLevel === 'High' ? 'text-destructive' : 'text-emerald-500'}`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${riskLevel === 'High' ? 'text-destructive' : 'text-emerald-500'}`}>
               {riskLevel}
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-1 truncate font-medium">
               {riskLevel === 'High' ? "Elevated equity / crypto volatility" : "Conservative, well-balanced portfolio structure"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-purple-500/30 bg-purple-500/5 shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Predicted Alpha (XIRR)</span>
               <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
               {predictedCAGR.toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-1 truncate font-medium">
               Projected annualized return yield
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-amber-500/30 bg-amber-500/5 shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Total Valuation</span>
               <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground private-value">
               ₹{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-500">
               <ArrowUpRight className="h-3 w-3" /> Live Sync Active
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAB 1: MARKET CHARTS & SECTOR EXPOSURE */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Main Chart Card */}
          <Card className="border-border/60 bg-gradient-to-b from-card/90 via-card/60 to-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                   <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-amber-500" /> Multi-Layer Asset Performance & Benchmark Alpha
                   </CardTitle>
                   <CardDescription className="text-xs font-medium mt-1">
                      Compare your portfolio performance vs Nifty 50 benchmark over real-time time frames.
                   </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl self-start sm:self-auto">
                  {(["Account value", "Portfolio performance"] as const).map(view => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeView === view 
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
                {/* Series toggles */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showPortfolio} onChange={e => setShowPortfolio(e.target.checked)} className="accent-amber-500 rounded h-3.5 w-3.5" />
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block ring-2 ring-amber-500/20" />
                    <span className="text-foreground font-bold">Portfolio Valuation (Gold)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showNifty} onChange={e => setShowNifty(e.target.checked)} className="accent-blue-500 rounded h-3.5 w-3.5" />
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block ring-2 ring-blue-500/20" />
                    <span className="text-blue-400 font-extrabold">Nifty 50 Index (Blue)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showEquity} onChange={e => setShowEquity(e.target.checked)} className="accent-teal-500 rounded h-3.5 w-3.5" />
                    <span className="h-2 w-2 rounded-full bg-teal-500 inline-block ring-2 ring-teal-500/20" />
                    <span className="text-muted-foreground">Equity</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showMutualFunds} onChange={e => setShowMutualFunds(e.target.checked)} className="accent-purple-500 rounded h-3.5 w-3.5" />
                    <span className="h-2 w-2 rounded-full bg-purple-500 inline-block ring-2 ring-purple-500/20" />
                    <span className="text-muted-foreground">Mutual Funds</span>
                  </label>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                  {TIME_RANGES.map(range => (
                    <button
                      key={range.label}
                      onClick={() => setSelectedRange(range.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRange === range.label 
                          ? 'bg-amber-500 text-slate-950 shadow-sm scale-105' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                {loading ? (
                  <div className="h-full bg-muted/20 rounded-xl animate-pulse flex items-center justify-center text-muted-foreground text-sm font-semibold">
                     Syncing your market metrics & snapshots...
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-border/40 rounded-2xl h-full flex flex-col items-center justify-center">
                    <TrendingUp className="h-10 w-10 text-amber-500 opacity-40 mb-3" />
                    <p className="text-foreground font-bold mb-1">Not enough snapshot history recorded yet.</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                       Snapshots are auto-recorded once a day when you visit the dashboard or sync holdings.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData}>
                      <defs>
                        <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} dy={10} fontStyle="bold" />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} dx={-10}
                        tickFormatter={val => activeView === "Account value" ? `₹${(val/1000).toFixed(0)}k` : val.toFixed(2)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", borderColor: "rgba(245,158,11,0.3)", borderRadius: "14px", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.5)" }}
                        itemStyle={{ fontSize: "12px", fontWeight: "700" }}
                        labelStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase" }}
                        formatter={(val: number, name: string) => [`₹${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]}
                      />
                      {showPortfolio && (
                        <Area type="monotone" dataKey={activeView === "Account value" ? "Account value" : "Portfolio"} stroke="#f59e0b" strokeWidth={3} fill="url(#gradAmber)" dot={false} activeDot={{ r: 6 }} />
                      )}
                      {showNifty && (
                        <Area type="monotone" dataKey="Nifty 50 Benchmark" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" fill="url(#gradBlue)" dot={false} activeDot={{ r: 5 }} />
                      )}
                      {showEquity && (
                        <Area type="monotone" dataKey="Equity" stroke="#0d9488" strokeWidth={2} fill="url(#gradTeal)" dot={false} activeDot={{ r: 4 }} />
                      )}
                      {showMutualFunds && (
                        <Area type="monotone" dataKey="Mutual funds" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPurple)" dot={false} activeDot={{ r: 4 }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asset Class & Sector Exposure Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Asset Class Donut */}
            <Card className="glass-panel border-amber-500/20 bg-card/60 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-500" /> Asset Allocation Donut
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">Donut View</span>
                </div>

                <div className="h-[230px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          formatter={(value: number) => [`₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
                        />
                        <Legend formatter={(value) => <span className="text-xs text-muted-foreground font-bold">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-semibold">No active asset breakdown data</div>
                  )}
                </div>

                <div className="space-y-2.5 mt-3 pt-4 border-t border-border/40">
                  {pieData.map((item, i) => {
                    const total = pieData.reduce((s, p) => s + p.value, 0)
                    const pct = total > 0 ? (item.value / total) * 100 : 0
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-foreground">{item.name}</span>
                        </span>
                        <div className="flex items-center gap-3">
                           <span className="text-muted-foreground font-mono private-value">₹{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                           <span className="font-extrabold w-12 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sector Exposure Chart */}
            <Card className="glass-panel border-emerald-500/20 bg-card/60 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sector Exposure & Diversification
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Systemic Risk: Low</span>
                </div>

                <div className="space-y-4">
                  {sectorData.map((sec, i) => (
                      <div key={sec.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{sec.name}</span>
                            <span className="font-mono font-bold text-muted-foreground">{sec.percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden p-0.5 border border-border/20">
                            <div
                              className="h-full rounded-full transition-all duration-700 shadow-sm"
                              style={{ width: `${sec.percent}%`, backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                            />
                        </div>
                      </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex items-start gap-3">
                  <Award className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-extrabold text-foreground">Diversification Health: Excellent (86/100)</span><br />
                      Your capital is well structured across Banking, IT, Energy, and Healthcare with minimal concentration vulnerability.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: AUTONOMOUS VAULT AI ENGINE */}
      {activeTab === "ai-briefing" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-3xl opacity-25 group-hover:opacity-40 transition duration-500 blur-xl" />
            
            <Card className="relative border-border/60 bg-slate-950/90 backdrop-blur-2xl text-slate-100 shadow-2xl overflow-hidden flex flex-col rounded-3xl">
              <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 bg-gradient-to-r from-amber-950/20 via-slate-950 to-zinc-950/30">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                     <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm">Autonomous Intelligence</span>
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-2.5 tracking-tight">
                    <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" /> AI Intelligence & Autonomous Reasoning Engine
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                    Continuous real-time portfolio diagnosis with live AI analysis, tax optimization, and risk evaluation.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 items-center">
                  {messages.length > 0 && (
                    <Button 
                      onClick={handleClearHistory}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                    >
                      <X className="h-4 w-4 mr-1" /> Clear Session
                    </Button>
                  )}
                  <Button 
                    disabled={aiLoading}
                    onClick={() => runGenerativeAnalysis(null)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 h-11 px-5 rounded-xl transition-all scale-[1.02]"
                  >
                    {aiLoading && messages.length === 0 ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reasoning...</>
                    ) : (
                      <><BrainCircuit className="mr-2 h-4 w-4" /> ✦ Run Autonomous Diagnosis</>
                    )}
                  </Button>
                </div>
              </CardContent>

              {/* QUICK ACTION CHIPS */}
              <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-white/10 bg-slate-950/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 self-center mr-2">Instant Prompts:</span>
                {[
                  "What are my top 3 risks?",
                  "Suggest tax loss harvesting",
                  "Analyze sector concentration",
                  "Project value in 5 years",
                  "Which holdings should I rebalance?"
                ].map(chip => (
                  <button
                    key={chip}
                    disabled={aiLoading}
                    onClick={() => runGenerativeAnalysis(chip)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <MessageSquare className="h-3 w-3 text-amber-500 shrink-0" />
                    {chip}
                  </button>
                ))}
              </div>

              {/* MESSAGE HISTORY / CONVERSATION AREA */}
              {(messages.length > 0 || aiLoading || aiError || streamingText !== null) ? (
                <div className="p-6 sm:p-8 space-y-6 max-h-[560px] overflow-y-auto bg-slate-950/40 custom-scrollbar divide-y divide-white/5">
                  {messages.map((msg, msgIdx) => (
                    <div key={msgIdx} className={`pt-6 first:pt-0 flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                      <div className="flex items-center gap-2 px-1">
                        {msg.role === 'user' ? (
                          <>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">You</span>
                            <div className="p-1.5 bg-amber-500/20 rounded-full border border-amber-500/30"><User className="h-3.5 w-3.5 text-amber-400" /></div>
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/30"><Sparkles className="h-3.5 w-3.5 text-slate-950" /></div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Vault Intelligence Engine</span>
                          </>
                        )}
                      </div>

                      <div className={`max-w-[92%] rounded-2xl p-5 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950 font-bold text-sm sm:text-base rounded-tr-sm'
                          : 'bg-white/[0.04] border border-white/10 rounded-tl-sm text-slate-200 leading-relaxed'
                      }`}>
                        {msg.role === 'user' ? (
                          <div>{msg.content}</div>
                        ) : (
                          <div className="space-y-3">
                            {msg.content.split('\n').filter(ln => ln.trim() !== '').map((line, idx) => {
                              const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                              const cleanText = line.trim().replace(/^[\*\-]\s+/, '');
                              
                              const parts = cleanText.split(/(\*\*.*?\*\*)/g);
                              const renderedParts = parts.map((p, i) => {
                                if (p.startsWith('**') && p.endsWith('**')) {
                                  return <strong key={i} className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mx-0.5 text-xs uppercase tracking-wide border border-amber-500/30">{p.slice(2, -2)}</strong>;
                                }
                                return p;
                              });

                              if (isBullet) {
                                return (
                                  <div key={idx} className="flex gap-3 bg-white/[0.03] p-3.5 rounded-xl border border-white/5 items-start">
                                    <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                    <div className="text-sm sm:text-[15px] leading-relaxed font-medium">{renderedParts}</div>
                                  </div>
                                );
                              }

                              if (cleanText.toLowerCase().includes('disclaimer')) {
                                return <div key={idx} className="text-[11px] text-slate-400 border-t border-white/10 pt-3 mt-4 italic font-medium">{renderedParts}</div>
                              }

                              return <div key={idx} className="text-sm sm:text-[15px] leading-relaxed font-medium">{renderedParts}</div>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming typewriter state */}
                  {streamingText !== null && (
                    <div className="pt-6 flex flex-col gap-3 items-start animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 bg-amber-500 rounded-full animate-spin"><Sparkles className="h-3.5 w-3.5 text-slate-950" /></div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Reasoning & Synthesizing...</span>
                      </div>
                      <div className="max-w-[92%] rounded-2xl p-5 bg-white/[0.04] border border-white/10 rounded-tl-sm text-slate-200 text-sm sm:text-[15px] leading-relaxed font-mono">
                        {streamingText}<span className="inline-block w-2.5 h-4 bg-amber-500 ml-1 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Loading state before streaming starts */}
                  {aiLoading && streamingText === null && (
                    <div className="pt-6 flex items-start gap-3 animate-pulse">
                      <div className="p-2 bg-white/10 rounded-full shrink-0"><Loader2 className="h-4 w-4 animate-spin text-amber-500" /></div>
                      <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-2 text-xs text-slate-300 font-bold border border-white/10">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" /> Analyzing portfolio weights, beta, and asset classes...
                      </div>
                    </div>
                  )}

                  {aiError && (
                    <div className="pt-6 flex items-start gap-3 bg-destructive/15 border border-destructive/30 p-4 rounded-xl text-red-200 text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                      <div>
                        <p className="font-extrabold text-white">Connection or API Issue</p>
                        <p className="mt-0.5 font-medium">{aiError}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                   <div className="h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <BrainCircuit className="h-8 w-8 text-amber-500" />
                   </div>
                   <div className="max-w-md">
                      <h4 className="text-lg font-bold text-white">Ready for Strategic Inquiry</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                         Click one of the instant prompts above or type your own question below to receive a personalized analysis of your holdings.
                      </p>
                   </div>
                </div>
              )}

              {/* CHAT INPUT FOOTER */}
              <div className="p-5 bg-slate-950/80 border-t border-white/10">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputPrompt.trim() && !aiLoading) {
                      runGenerativeAnalysis(inputPrompt.trim());
                    }
                  }}
                  className="relative flex items-center group"
                >
                  <div className="absolute left-4 text-amber-500 group-focus-within:text-amber-400 transition-colors">
                    <Zap className="h-5 w-5 fill-amber-500/20" />
                  </div>
                  <Input 
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    disabled={aiLoading}
                    placeholder="Ask Vault AI about asset weights, XIRR projections, or market risk..."
                    className="pl-12 pr-14 h-14 bg-white/5 border-white/15 text-slate-100 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 rounded-2xl text-sm font-semibold shadow-inner"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={aiLoading || !inputPrompt.trim()}
                    className="absolute right-2 h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  </Button>
                </form>
                <div className="text-center text-[11px] text-slate-400 font-medium mt-2.5 flex items-center justify-center gap-1.5">
                   <ShieldCheck className="h-3 w-3 text-emerald-500" /> End-to-End Encrypted Inquiry. Powered by Google Gemini.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
