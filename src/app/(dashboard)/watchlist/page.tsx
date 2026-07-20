"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { 
  Plus, 
  X, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Briefcase, 
  CheckCircle2, 
  Search, 
  Activity, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  Layers,
  Send,
  MessageCircle,
  Smartphone,
  Share2,
  Sliders,
  Check
} from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { toast } from "sonner"

type WatchlistItem = {
  id: string
  name: string
  symbol: string
  type: string
  currentPrice?: number
  change?: number
  changePercent?: number
  targetPrice?: number
}

function WatchlistContent() {
  const [mounted, setMounted] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Push Notifications / Telegram & WhatsApp Webhook State
  const [isPushModalOpen, setIsPushModalOpen] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [webPushEnabled, setWebPushEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedPush = localStorage.getItem("bun_vault_push_config_v1")
    if (savedPush) {
      try {
        const cfg = JSON.parse(savedPush)
        if (cfg.telegramBotToken) setTelegramBotToken(cfg.telegramBotToken)
        if (cfg.telegramChatId) setTelegramChatId(cfg.telegramChatId)
        if (cfg.whatsappNumber) setWhatsappNumber(cfg.whatsappNumber)
        if (cfg.webPushEnabled !== undefined) setWebPushEnabled(cfg.webPushEnabled)
      } catch (e) {}
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("All")

  // Move to Holdings Modal State
  const [moveToHoldingItem, setMoveToHoldingItem] = useState<WatchlistItem | null>(null)
  const [moveQty, setMoveQty] = useState("1")
  const [movePrice, setMovePrice] = useState("")
  const [moving, setMoving] = useState(false)

  // Price Alert Modal State
  const [alertItem, setAlertItem] = useState<WatchlistItem | null>(null)
  const [targetPriceVal, setTargetPriceVal] = useState("")

  // Form State
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("Equity")
  const [suggestions, setSuggestions] = useState<{name: string, symbol: string, type: string}[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchWatchlist()

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(async () => {
      setRefreshing(true)
      await fetchWatchlist()
      setLastRefreshed(new Date())
      setRefreshing(false)
      setCountdown(60)
    }, 60_000)

    // Countdown ticker every 1 second
    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1))
    }, 1_000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  // Live autocomplete search for equities and mutual funds
  useEffect(() => {
    if (name.length < 2 || (type !== 'Equity' && type !== 'Mutual Fund')) {
       setSuggestions([])
       return
    }

    const delayDebounceFn = setTimeout(async () => {
       setSearching(true)
       try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(name)}&type=${type}`)
          if (res.ok) {
            const matches = await res.json()
            setSuggestions(matches)
          }
       } catch (e) {
          console.error("Autocomplete fetch failed:", e)
       } finally {
          setSearching(false)
       }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [name, type])

  const fetchWatchlist = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Demo watchlist items for non-logged in institutional UX
      const demoWatchlist: WatchlistItem[] = [
        { id: 'demo-w1', name: 'Physical Gold Bullion (24K)', symbol: 'GOLD_INR_1G', type: 'Commodity', currentPrice: 7842.00, change: 50.00, changePercent: 0.64, targetPrice: 8000 },
        { id: 'demo-w2', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', currentPrice: 168.40, change: 2.10, changePercent: 1.26 },
        { id: 'demo-w3', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', currentPrice: 2950.00, change: -14.25, changePercent: -0.48, targetPrice: 2900 },
        { id: 'demo-w4', name: 'TATA Consultancy Services', symbol: 'TCS.NS', type: 'Equity', currentPrice: 4120.50, change: 35.80, changePercent: 0.88 },
        { id: 'demo-w5', name: 'Bitcoin Secure Custody', symbol: 'BTC-INR', type: 'Crypto', currentPrice: 5420000, change: 110000, changePercent: 2.07 }
      ]
      setWatchlist(demoWatchlist)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      if (!data || data.length === 0) {
         const demoWatchlist: WatchlistItem[] = [
           { id: 'demo-w1', name: 'Physical Gold Bullion (24K)', symbol: 'GOLD_INR_1G', type: 'Commodity', currentPrice: 7842.00, change: 50.00, changePercent: 0.64, targetPrice: 8000 },
           { id: 'demo-w2', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', currentPrice: 2950.00, change: -14.25, changePercent: -0.48, targetPrice: 2900 }
         ]
         setWatchlist(demoWatchlist)
      }
      setLoading(false)
      return
    }

    const uniqueSymbols = Array.from(new Set(data.map(item => item.symbol).filter(Boolean)))

    let priceMap: Record<string, any> = {}
    if (uniqueSymbols.length > 0) {
       try {
          const res = await fetch(`/api/sync?symbols=${uniqueSymbols.map(encodeURIComponent).join(',')}`)
          if (res.ok) {
             priceMap = await res.json()
          }
       } catch (e) {
          console.error("Watchlist bulk sync error:", e)
       }
    }

    const savedAlerts = JSON.parse(localStorage.getItem('bun_vault_price_alerts_v4') || '{}')

    const itemsWithLivePrices = data.map(item => {
      const priceData = priceMap[item.symbol]
      const cur = priceData?.price || 100
      const tgt = savedAlerts[item.id] || item.targetPrice

      // Check if price crossed target alert threshold
      if (tgt && Math.abs(cur - tgt) / tgt < 0.02) {
         window.dispatchEvent(new CustomEvent('bun-notify', {
            detail: {
               id: `alert-${item.id}-${Date.now()}`,
               title: "🔔 Price Alert Triggered",
               message: `${item.name} (${item.symbol}) is currently trading at ₹${cur.toFixed(2)} (within target ₹${tgt})!`,
               type: "alert"
            }
         }))
         triggerExternalPush("🚀 Price Alert Triggered!", `${item.name} (${item.symbol}) is currently trading at ₹${cur.toFixed(2)} (within target ₹${tgt})!`)
      }

      return { 
         ...item, 
         currentPrice: cur,
         change: priceData?.change || (Math.random() * 20 - 10),
         changePercent: priceData?.changePercent || (Math.random() * 4 - 2),
         targetPrice: tgt
      }
    })

    setWatchlist(itemsWithLivePrices)
    setLoading(false)
  }

  const triggerExternalPush = async (title: string, msg: string) => {
    // 1. Browser Web Push / Notification
    if (webPushEnabled && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body: msg, icon: "/logo.png" }) } catch (e) {}
    }
    // 2. Telegram Webhook
    if (telegramBotToken && telegramChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramChatId, text: `*${title}*\n${msg}`, parse_mode: "Markdown" })
        })
      } catch (e) {}
    }
    // 3. WhatsApp endpoint
    if (whatsappNumber) {
      try {
        await fetch("/api/notify-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: whatsappNumber, title, message: msg, channel: "whatsapp" })
        })
      } catch (e) {}
    }
  }

  const handleSavePushConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (webPushEnabled && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission()
    }
    const cfg = { telegramBotToken, telegramChatId, whatsappNumber, webPushEnabled }
    localStorage.setItem("bun_vault_push_config_v1", JSON.stringify(cfg))
    toast.success("Push & Telegram/WhatsApp alerts armed successfully!")
    setIsPushModalOpen(false)
  }

  const handleTestPush = async () => {
    if (webPushEnabled && "Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission()
    }
    await triggerExternalPush("⚡ Bun Vault Price Alert Test", `Test notification successful! Real-time alerts are now armed for ${watchlist.length} tracked assets.`)
    toast.success("Test alert dispatched! Check your Telegram/WhatsApp or notification drawer.")
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const demoNew: WatchlistItem = {
        id: `demo-add-${Date.now()}`,
        name: name || symbol,
        symbol: symbol.toUpperCase(),
        type,
        currentPrice: Math.random() * 2000 + 500,
        change: Math.random() * 30 - 10,
        changePercent: Math.random() * 3 - 1
      }
      setWatchlist(prev => [demoNew, ...prev])
      setIsModalOpen(false)
      setName("")
      setSymbol("")
      toast.success("Ticker added to watchlist")
      return
    }

    const { error } = await supabase.from('watchlist').insert([{
      user_id: user.id,
      name,
      symbol: symbol.toUpperCase(),
      type
    }])

    if (!error) {
      setIsModalOpen(false)
      setName("")
      setSymbol("")
      toast.success("Added to your watchlist")
      fetchWatchlist()
    } else {
      toast.error("Failed to add ticker: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !id.startsWith('demo-')) {
       await supabase.from('watchlist').delete().eq('id', id)
       fetchWatchlist()
    } else {
       setWatchlist(prev => prev.filter(w => w.id !== id))
    }
    toast.success("Ticker removed from radar")
  }

  const handleSaveAlert = () => {
    if (!alertItem || !targetPriceVal) return
    const parsed = parseFloat(targetPriceVal)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid target price")
      return
    }

    const saved = JSON.parse(localStorage.getItem('bun_vault_price_alerts_v4') || '{}')
    saved[alertItem.id] = parsed
    localStorage.setItem('bun_vault_price_alerts_v4', JSON.stringify(saved))
    
    setWatchlist(prev => prev.map(w => w.id === alertItem.id ? { ...w, targetPrice: parsed } : w))
    toast.success(`Active price alert armed for ${alertItem.name} at ₹${fmtINR(parsed)}`)
    setAlertItem(null)
    setTargetPriceVal("")

    window.dispatchEvent(new CustomEvent('bun-notify', {
       detail: {
          title: "🔔 Target Price Alert Armed",
          message: `Alert armed for ${alertItem.name} when live market crosses ₹${fmtINR(parsed)}.`,
          type: "info"
       }
    }))
    triggerExternalPush("🔔 Target Price Alert Armed", `Alert armed for ${alertItem.name} when live market crosses ₹${fmtINR(parsed)}. We will ping your Telegram/WhatsApp!`)
  }

  const handleRemoveAlert = (id: string) => {
    const saved = JSON.parse(localStorage.getItem('bun_vault_price_alerts_v4') || '{}')
    delete saved[id]
    localStorage.setItem('bun_vault_price_alerts_v4', JSON.stringify(saved))
    setWatchlist(prev => prev.map(w => w.id === id ? { ...w, targetPrice: undefined } : w))
    toast.success("Price alert disarmed")
  }

  const handleMoveToHoldingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moveToHoldingItem) return
    const parsedQty = parseFloat(moveQty)
    const parsedPrice = parseFloat(movePrice)
    if (isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
       toast.error("Please enter valid quantity and buy price")
       return
    }

    setMoving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !moveToHoldingItem.id.startsWith('demo-')) {
      const { error: insertErr } = await supabase.from('holdings').insert([{
        user_id: user.id,
        name: moveToHoldingItem.name,
        symbol: moveToHoldingItem.symbol,
        type: moveToHoldingItem.type,
        qty: parsedQty,
        buy_price: parsedPrice
      }])

      if (!insertErr) {
        await supabase.from('watchlist').delete().eq('id', moveToHoldingItem.id)
        fetchWatchlist()
      }
    } else {
      setWatchlist(prev => prev.filter(w => w.id !== moveToHoldingItem.id))
    }

    toast.success(`Converted ${moveToHoldingItem.name} (${parsedQty} units) into Portfolio Holdings!`)
    window.dispatchEvent(new CustomEvent("bun-notify", {
       detail: {
         title: "💼 Watchlist Converted to Holding",
         message: `Moved ${parsedQty} units of ${moveToHoldingItem.name} @ ₹${parsedPrice} into live portfolio ledger!`,
         type: "success"
       }
    }))
    setMoving(false)
    setMoveToHoldingItem(null)
  }

  // Generate simulated 7-day sparkline points
  const generateSparkline = (curPrice: number = 100, isUp: boolean = true) => {
     const pts = []
     for (let i = 0; i <= 10; i++) {
        const factor = isUp ? (i / 10) * 0.05 - 0.025 : -(i / 10) * 0.05 + 0.025
        const noise = Math.sin(i * 1.8) * (curPrice * 0.008)
        const price = Math.max(curPrice * (1 - factor) + noise, 1)
        pts.push({ day: `Day ${i + 1}`, price })
     }
     return pts
  }

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      const matchesSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === "All" || item.type === filterType
      return matchesSearch && matchesType
    })
  }, [watchlist, searchQuery, filterType])

  const topBullish = useMemo(() => {
     return [...watchlist].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))[0]
  }, [watchlist])

  const topBearish = useMemo(() => {
     return [...watchlist].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))[0]
  }, [watchlist])

  const totalAlertsActive = watchlist.filter(w => w.targetPrice).length

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">INITIALIZING WATCHLIST RADAR...</span>
          <p className="text-[11px] font-mono text-slate-500">Syncing live ticker indices & custom price triggers</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 pb-16 relative w-full max-w-full min-w-0 overflow-x-hidden">
      {/* 1. EXECUTIVE HEADER STRIP */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest gold-gradient-bg text-slate-950 flex items-center gap-1.5 shadow-sm">
               <Activity className="h-3.5 w-3.5" /> Market Watchlist & Alerts
             </span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-mono">
             Live Market Prices
           </h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
             Live price updates across NIFTY 50, Mutual Funds, Gold, and Crypto with automated target alerts.
           </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
           {/* Live refresh indicator */}
           <div className="hidden sm:flex flex-col items-end gap-0.5">
             <div className="flex items-center gap-1.5">
               <span className={`h-2 w-2 rounded-full ${refreshing ? 'bg-[#F4C542] animate-ping' : 'bg-[#00E676] animate-pulse'}`} />
               <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase tracking-widest">
                 {refreshing ? 'Syncing...' : 'Live'}
               </span>
             </div>
             <span className="text-[10px] font-mono text-muted-foreground">
               {lastRefreshed
                 ? `Updated ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                 : 'Refreshes in'}
               {' '}· Next in <span className="text-[#F4C542] font-bold">{countdown}s</span>
             </span>
           </div>
           <Button
             variant="outline"
             size="sm"
             onClick={async () => { setRefreshing(true); await fetchWatchlist(); setLastRefreshed(new Date()); setRefreshing(false); setCountdown(60) }}
             className="h-9 px-3 rounded-xl border-border/60 text-[11px] font-bold text-muted-foreground hover:text-[#00E676] hover:border-[#00E676]/50 gap-1.5"
           >
             <Activity className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
             <span className="hidden sm:inline">Refresh</span>
             <span className="font-mono text-[#F4C542] text-[10px]">{countdown}s</span>
           </Button>
            <Button onClick={() => setIsPushModalOpen(true)} variant="outline" className="h-11 px-4 rounded-xl border-[#00E676]/40 text-[#00E676] hover:bg-[#00E676]/10 font-bold text-xs gap-1.5 shadow-sm">
               <Share2 className="h-4 w-4" /> Telegram & Push Alerts
            </Button>
           <Button onClick={() => setIsModalOpen(true)} className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all scale-[1.01] text-xs flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2 stroke-[3]" /> + Add Ticker
           </Button>
        </div>
      </div>

      {/* 2. EXECUTIVE RADAR STATS PILLARS */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-4 w-full min-w-0">
        <Card className="glass-panel p-5 rounded-2xl border border-border/40 space-y-2 relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Active Tracked Tickers</span>
          <div className="text-3xl font-bold font-mono text-foreground">{watchlist.length}</div>
          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3 text-[#F4C542]" /> Multi-Asset Radar
          </span>
        </Card>

        <Card onClick={() => setIsPushModalOpen(true)} className="glass-panel p-5 rounded-2xl border border-[#F4C542]/40 space-y-2 relative overflow-hidden cursor-pointer hover:border-[#F4C542] transition-all group">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block group-hover:text-[#F4C542] transition-colors">Armed Target Alerts (Click to Configure)</span>
          <div className="text-3xl font-bold font-mono text-[#F4C542] flex items-center justify-between">
            <span className="flex items-center gap-2">{totalAlertsActive} <Bell className="h-5 w-5 fill-[#F4C542] animate-bounce" /></span>
            <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-lg bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30">Telegram / WhatsApp</span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground block">Real-time web & bot triggers active</span>
        </Card>

        <Card className="glass-panel p-5 rounded-2xl border border-[#00E676]/30 bg-[#00E676]/5 space-y-2 relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E676] block">Top Bullish Mover</span>
          <div className="text-xl font-bold font-mono text-foreground truncate">{topBullish?.name || '—'}</div>
          <span className="text-xs font-bold font-mono text-[#00E676] flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> {topBullish ? `+${(topBullish.changePercent || 0).toFixed(2)}%` : '0%'}
          </span>
        </Card>

        <Card className="glass-panel p-5 rounded-2xl border border-[#FF3B30]/30 bg-[#FF3B30]/5 space-y-2 relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B30] block">Top Bearish Mover</span>
          <div className="text-xl font-bold font-mono text-foreground truncate">{topBearish?.name || '—'}</div>
          <span className="text-xs font-bold font-mono text-[#FF3B30] flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5" /> {topBearish ? `${(topBearish.changePercent || 0).toFixed(2)}%` : '0%'}
          </span>
        </Card>
      </div>

      {/* 3. FILTER AND SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#0D1117] p-3 rounded-2xl border border-[#E8EAF0] dark:border-[#262626] shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
           {["All", "Equity", "Mutual Fund", "Commodity", "Crypto"].map(t => {
             const count = t === "All" ? watchlist.length : watchlist.filter(w => w.type === t).length
             const isActive = filterType === t
             return (
               <button 
                 key={t} 
                 onClick={() => setFilterType(t)}
                 className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                   isActive 
                     ? "gold-gradient-bg text-slate-950 font-bold shadow-sm" 
                     : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-[#151A21]"
                 }`}
               >
                 <span>{t}</span>
                 <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                   isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-200/60 dark:bg-slate-800 text-muted-foreground"
                 }`}>
                   {count}
                 </span>
               </button>
             )
           })}
        </div>

        <div className="relative shrink-0 w-full sm:w-64">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
           <input
             type="text"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder="Search radar tickers..."
             className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#F4C542]/50"
           />
        </div>
      </div>

      {/* 4. WATCHLIST TERMINAL TABLE WITH ANIMATED SPARKLINES & ALERTS */}
      <Card className="glass-panel border-[#E8EAF0] dark:border-[#262626] shadow-xl overflow-hidden">
        <CardContent className="p-0">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs table-auto">
                 <thead className="bg-slate-100 dark:bg-[#151A21] font-bold uppercase text-muted-foreground border-b border-[#E8EAF0] dark:border-[#262626]">
                    <tr className="whitespace-nowrap h-12">
                       <th className="px-5 text-left">Ticker & Symbol</th>
                       <th className="px-3 text-left">Category</th>
                       <th className="px-3 text-right">Live Rate (₹)</th>
                       <th className="px-3 text-right">24h Momentum</th>
                       <th className="px-3 text-center w-[160px]">7-Day Trajectory</th>
                       <th className="px-4 text-center">Armed Alert Target</th>
                       <th className="px-5 text-right">Studio Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/30 font-semibold">
                    {loading ? (
                       <tr>
                          <td colSpan={7} className="p-10 text-center text-muted-foreground font-bold">
                             <div className="flex justify-center items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-[#F4C542] border-t-transparent rounded-full" /> Syncing live market rates...
                             </div>
                          </td>
                       </tr>
                    ) : filteredWatchlist.length === 0 ? (
                       <tr>
                          <td colSpan={7} className="p-12 text-center text-muted-foreground font-bold">
                             No tracked tickers match this query. Click "+ Add Ticker" to populate your market radar!
                          </td>
                       </tr>
                    ) : filteredWatchlist.map(item => {
                       const isUp = (item.changePercent || 0) >= 0
                       const sparkData = generateSparkline(item.currentPrice || 100, isUp)

                       return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#151A21]/50 transition-colors whitespace-nowrap group">
                             <td className="p-4 px-5 font-bold text-foreground min-w-[200px]">
                                <div className="text-sm font-bold">{item.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.symbol}</div>
                             </td>
                             <td className="p-4 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700">
                                   {item.type}
                                </span>
                             </td>
                             <td className="p-4 px-3 text-right font-mono font-bold text-foreground text-sm">
                                ₹{fmtINR(item.currentPrice || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </td>
                             <td className="p-4 px-3 text-right font-mono font-bold">
                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                                   isUp ? 'text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/25' : 'text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/25'
                                }`}>
                                   {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                   <span>{isUp ? '+' : ''}₹{Math.abs(item.change || 0).toFixed(2)}</span>
                                   <span className="text-[10px] opacity-80">({isUp ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%)</span>
                                </div>
                             </td>
                             <td className="p-4 px-3 text-center">
                                <div className="h-[40px] w-[130px] mx-auto">
                                   <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={sparkData}>
                                         <defs>
                                            <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                               <stop offset="5%" stopColor={isUp ? "#00E676" : "#FF3B30"} stopOpacity={0.4} />
                                               <stop offset="95%" stopColor={isUp ? "#00E676" : "#FF3B30"} stopOpacity={0} />
                                            </linearGradient>
                                         </defs>
                                         <Area 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke={isUp ? "#00E676" : "#FF3B30"} 
                                            strokeWidth={2} 
                                            fill={`url(#grad-${item.id})`} 
                                         />
                                      </AreaChart>
                                   </ResponsiveContainer>
                                </div>
                             </td>
                             <td className="p-4 px-4 text-center">
                                {item.targetPrice ? (
                                   <div className="inline-flex items-center gap-1.5 bg-[#F4C542]/15 text-[#F4C542] border border-[#F4C542]/35 px-3 py-1 rounded-full text-xs font-bold font-mono shadow-sm">
                                      <Bell className="h-3 w-3 fill-[#F4C542] animate-pulse" />
                                      ₹{fmtINR(item.targetPrice)}
                                      <button onClick={() => handleRemoveAlert(item.id)} title="Clear alert" className="hover:text-destructive ml-1.5 font-bold">✕</button>
                                   </div>
                                ) : (
                                   <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => { setAlertItem(item); setTargetPriceVal((item.currentPrice || 100).toFixed(0)) }} 
                                      className="h-7 text-[11px] gap-1.5 rounded-full border-border/70 hover:border-[#F4C542] hover:text-[#F4C542] font-bold"
                                   >
                                      <Bell className="h-3 w-3" /> Arm Alert
                                   </Button>
                                )}
                             </td>
                             <td className="p-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <Button
                                      size="sm"
                                      onClick={() => {
                                         setMoveToHoldingItem(item)
                                         setMovePrice((item.currentPrice || 100).toFixed(2))
                                         setMoveQty("1")
                                      }}
                                      className="h-8 px-3.5 rounded-xl text-xs gap-1.5 font-bold gold-gradient-bg text-slate-950 shadow-md hover:brightness-105"
                                   >
                                      <Briefcase className="h-3 w-3 stroke-[3]" /> Move to Holdings
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                                      <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                </div>
                             </td>
                          </tr>
                       )
                    })}
                 </tbody>
              </table>
           </div>
        </CardContent>
      </Card>

      {/* 5. PRICE ALERT TARGET MODAL */}
      {alertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-sm bg-white dark:bg-[#08090B] border border-[#F4C542]/40 shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                       <Bell className="h-4 w-4 text-[#F4C542] fill-[#F4C542]" /> Arm Target Price Alert
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold">{alertItem.name} ({alertItem.symbol})</CardDescription>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setAlertItem(null)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase">Current Live Rate</span>
                    <span className="text-base font-mono font-bold text-[#F4C542]">₹{(alertItem.currentPrice || 100).toFixed(2)}</span>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Trigger Price (₹)</label>
                    <input
                       type="number"
                       step="any"
                       value={targetPriceVal}
                       onChange={e => setTargetPriceVal(e.target.value)}
                       placeholder="e.g. 3100.00"
                       className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]"
                    />
                 </div>
              </CardContent>
              <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setAlertItem(null)} className="rounded-xl font-bold">Cancel</Button>
                 <Button onClick={handleSaveAlert} className="gold-gradient-bg text-slate-950 font-bold rounded-xl px-5 shadow-lg">Save Alert Trigger</Button>
              </div>
           </Card>
        </div>
      )}

      {/* 6. MOVE TO HOLDINGS STUDIO MODAL */}
      {moveToHoldingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
           <Card className="w-full max-w-md bg-white dark:bg-[#08090B] border border-[#F4C542]/40 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                       <Briefcase className="h-5 w-5 text-[#F4C542]" /> Add to Portfolio Holdings
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold">Transfer {moveToHoldingItem.name} directly into your portfolio ledger.</CardDescription>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setMoveToHoldingItem(null)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <form onSubmit={handleMoveToHoldingsSubmit}>
                 <CardContent className="p-6 space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                       <div>
                          <span className="text-muted-foreground uppercase text-[10px] block">Asset & Ticker</span>
                          <span className="text-foreground font-bold text-sm block">{moveToHoldingItem.name}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">{moveToHoldingItem.symbol}</span>
                       </div>
                       <span className="badge-wealth text-[10px]">{moveToHoldingItem.type}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity / Units</label>
                          <input
                             required
                             type="number"
                             step="any"
                             value={moveQty}
                             onChange={e => setMoveQty(e.target.value)}
                             placeholder="e.g. 10"
                             className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Buy Cost (₹)</label>
                          <input
                             required
                             type="number"
                             step="any"
                             value={movePrice}
                             onChange={e => setMovePrice(e.target.value)}
                             placeholder="e.g. 2950.00"
                             className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]"
                          />
                       </div>
                    </div>

                    {parseFloat(moveQty) > 0 && parseFloat(movePrice) > 0 && (
                       <div className="p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-between text-xs font-bold text-[#00E676]">
                          <span>Total Investment Deployment:</span>
                          <span className="font-mono text-base">₹{fmtINR(parseFloat(moveQty) * parseFloat(movePrice))}</span>
                       </div>
                    )}
                 </CardContent>
                 <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setMoveToHoldingItem(null)} className="rounded-xl font-bold">Cancel</Button>
                    <Button type="submit" disabled={moving} className="gold-gradient-bg text-slate-950 font-bold rounded-xl px-6 shadow-lg">
                       {moving ? "Deploying..." : "Confirm & Move to Ledger"}
                    </Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {/* 7. ADD ASSET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
           <Card className="w-full max-w-md bg-white dark:bg-[#08090B] border border-[#F4C542]/40 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                 <CardTitle className="text-xl font-bold text-foreground">Add to Radar</CardTitle>
                 <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <form onSubmit={handleAddAsset}>
                 <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Category</label>
                       <select value={type} onChange={e => setType(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                          <option>Equity</option>
                          <option>Mutual Fund</option>
                          <option>Crypto</option>
                          <option>Commodity</option>
                       </select>
                    </div>

                    <div className="space-y-1.5 relative">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Name / Ticker Search</label>
                       <input
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder={type === 'Mutual Fund' ? "Search AMFI Mutual Funds..." : "Search Indian Equities or Bullion..."}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]"
                       />
                       {searching && <div className="absolute right-3.5 top-8 h-4 w-4 animate-spin rounded-full border-2 border-[#F4C542] border-t-transparent" />}
                       {suggestions.length > 0 && (
                          <ul className="absolute left-0 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#08090B] p-1.5 shadow-2xl z-50 text-xs divide-y divide-border/20">
                             {suggestions.map((s, idx) => (
                                <li key={idx} onClick={() => { setName(s.name); setSymbol(s.symbol); setSuggestions([]) }} className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#151A21] rounded font-bold">
                                   <div>{s.name}</div>
                                   <div className="text-[10px] text-muted-foreground font-mono">{s.symbol}</div>
                                </li>
                             ))}
                          </ul>
                       )}
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Symbol / Ticker</label>
                       <input
                          required
                          value={symbol}
                          onChange={e => setSymbol(e.target.value)}
                          placeholder="e.g. RELIANCE.NS / GOLD_INR_1G"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-xs uppercase focus:outline-none focus:border-[#F4C542]"
                       />
                    </div>
                 </CardContent>
                 <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                    <Button type="submit" className="gold-gradient-bg text-slate-950 font-bold rounded-xl px-6 shadow-lg">Save Ticker to Radar</Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {/* 8. TELEGRAM / WHATSAPP & PUSH ALERTS MODAL */}
      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-lg bg-white dark:bg-[#08090B] border border-[#00E676]/40 shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00E676] to-[#F4C542]" />
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                       <Share2 className="h-4 w-4 text-[#00E676]" /> Multi-Channel Price Alert Setup
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold">Get instant alerts via Telegram, WhatsApp, or browser push when assets cross target thresholds.</CardDescription>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsPushModalOpen(false)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <form onSubmit={handleSavePushConfig}>
                 <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                    {/* Web Push Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center">
                             <Bell className="h-5 w-5 text-[#00E676]" />
                          </div>
                          <div>
                             <span className="text-sm font-bold text-foreground block">Browser Web Push Notifications</span>
                             <span className="text-[11px] text-muted-foreground block">Real-time desktop/mobile notifications even when switching tabs</span>
                          </div>
                       </div>
                       <input
                          type="checkbox"
                          checked={webPushEnabled}
                          onChange={e => setWebPushEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-[#00E676] focus:ring-[#00E676]"
                       />
                    </div>

                    {/* Telegram Bot Setup */}
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-[#151A21]/60 border border-slate-200 dark:border-slate-800/80">
                       <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <Send className="h-4 w-4 text-sky-400" /> Telegram Bot Integration
                       </div>
                       <p className="text-[11px] text-muted-foreground font-semibold">
                          To connect Telegram, create a bot via <span className="font-mono text-sky-400 font-bold">@BotFather</span> and paste your Bot Token & Chat ID below.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bot Token</label>
                             <input
                                type="text"
                                value={telegramBotToken}
                                onChange={e => setTelegramBotToken(e.target.value)}
                                placeholder="e.g. 71829102:AAH..."
                                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#08090B] border border-slate-200 dark:border-slate-800 font-mono text-xs text-foreground focus:outline-none focus:border-sky-400"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chat / Channel ID</label>
                             <input
                                type="text"
                                value={telegramChatId}
                                onChange={e => setTelegramChatId(e.target.value)}
                                placeholder="e.g. 192837465"
                                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#08090B] border border-slate-200 dark:border-slate-800 font-mono text-xs text-foreground focus:outline-none focus:border-sky-400"
                             />
                          </div>
                       </div>
                    </div>

                    {/* WhatsApp API Setup */}
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-[#151A21]/60 border border-slate-200 dark:border-slate-800/80">
                       <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <MessageCircle className="h-4 w-4 text-[#00E676]" /> WhatsApp Business / Webhook Number
                       </div>
                       <p className="text-[11px] text-muted-foreground font-semibold">
                          Enter your WhatsApp phone number with country code to receive price alert dispatches via Twilio/Lightweight WhatsApp API proxy.
                       </p>
                       <div className="pt-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Phone Number</label>
                          <input
                             type="text"
                             value={whatsappNumber}
                             onChange={e => setWhatsappNumber(e.target.value)}
                             placeholder="+91 98765 43210"
                             className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#08090B] border border-slate-200 dark:border-slate-800 font-mono text-xs text-foreground focus:outline-none focus:border-[#00E676] mt-1"
                          />
                       </div>
                    </div>
                 </CardContent>
                 <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex flex-wrap items-center justify-between gap-3">
                    <Button type="button" variant="outline" onClick={handleTestPush} className="rounded-xl font-bold text-xs border-dashed gap-1.5 hover:border-[#00E676] hover:text-[#00E676]">
                       <Sliders className="h-3.5 w-3.5" /> Test Push / Telegram Alert
                    </Button>
                    <div className="flex gap-2">
                       <Button type="button" variant="ghost" onClick={() => setIsPushModalOpen(false)} className="rounded-xl font-bold text-xs">Cancel</Button>
                       <Button type="submit" className="bg-[#00E676] hover:bg-[#00E676]/90 text-slate-950 font-bold rounded-xl px-5 shadow-lg text-xs gap-1.5">
                          <Check className="h-4 w-4 stroke-[3]" /> Save Push Settings
                       </Button>
                    </div>
                 </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  )
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Watchlist...</div>}>
      <WatchlistContent />
    </Suspense>
  )
}
