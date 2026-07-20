"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { 
  Plus, 
  X, 
  Trash2, 
  Pencil, 
  Upload, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Calendar, 
  History, 
  FileSpreadsheet, 
  ChevronRight, 
  BarChart2, 
  MinusCircle, 
  Coins, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  SlidersHorizontal,
  Download
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"

type Holding = {
  id: string
  name: string
  symbol: string
  type: string
  qty: number
  buy_price: number
  created_at: string
  currentPrice?: number
}

function HoldingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actionParam = searchParams?.get('action')

  const [activeTab, setActiveTab] = useState("All")
  const [mounted, setMounted] = useState(false)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedHoldingDetail, setSelectedHoldingDetail] = useState<Holding | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'pl' | 'plPercent' | 'xirr'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState("")

  // Bulk import state
  const [bulkCsvText, setBulkCsvText] = useState("")
  const [bulkImporting, setBulkImporting] = useState(false)

  // Sparkline range state in drawer
  const [detailRange, setDetailRange] = useState<'1W' | '1M' | '3M'>('1M')

  // Form State
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("Equity")
  const [qty, setQty] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [commoditySubtype, setCommoditySubtype] = useState("Physical")
  const [metalType, setMetalType] = useState("Gold")
  const [debtSubtype, setDebtSubtype] = useState("FD/RD")
  const [totalInvestment, setTotalInvestment] = useState("")
  const [currentVal, setCurrentVal] = useState("")
  const [suggestions, setSuggestions] = useState<{name: string, symbol: string, type: string}[]>([])
  const [searching, setSearching] = useState(false)
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null)

  // Sell / Withdraw State
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null)
  const [sellQty, setSellQty] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [taxDuration, setTaxDuration] = useState<'STCG' | 'LTCG'>('LTCG')

  // Simulated Transactions for Transaction History Tab
  const [transactions, setTransactions] = useState<any[]>([
    { id: 'tx-1', date: '2026-07-16', type: 'BUY', name: 'Physical Gold 24K', symbol: 'GOLD_INR_1G', qty: 15, price: 8020.00, total: 120300.00, status: 'Completed' },
    { id: 'tx-2', date: '2026-07-14', type: 'BUY', name: 'Reliance Industries', symbol: 'RELIANCE.NS', qty: 25, price: 2910.50, total: 72762.50, status: 'Completed' },
    { id: 'tx-3', date: '2026-07-10', type: 'BUY', name: 'Nippon India Small Cap', symbol: '122639', qty: 450, price: 162.40, total: 73080.00, status: 'Completed' },
    { id: 'tx-4', date: '2026-07-02', type: 'SELL', name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', qty: 10, price: 1680.00, total: 16800.00, status: 'Completed', gain: '+₹1,240' },
  ])

  useEffect(() => {
    fetchHoldings()
  }, [])

  // Check query parameter for automatic sell modal trigger
  useEffect(() => {
    if (actionParam === 'sell' && holdings.length > 0 && !sellingHolding) {
      // Auto-select the first commodity or highest value holding to liquidate
      const bullionOrTop = holdings.find(h => h.type === 'Commodity') || holdings[0]
      if (bullionOrTop) {
        handleOpenSell(bullionOrTop)
      }
    }
  }, [actionParam, holdings])

  // Live autocomplete search
  useEffect(() => {
    if (name.length < 2 || (type !== 'Equity' && type !== 'Mutual Fund' && type !== 'Crypto')) {
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

  const fetchHoldings = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Provide simulated institutional holdings if not logged in
      const demoHoldings: Holding[] = [
        { id: 'demo-1', name: 'Physical Gold 24K', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 25, buy_price: 13800, currentPrice: 14394, created_at: '2025-11-15T00:00:00Z' },
        { id: 'demo-2', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', qty: 40, buy_price: 2680, currentPrice: 2950, created_at: '2026-01-10T00:00:00Z' },
        { id: 'demo-3', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', qty: 650, buy_price: 142.50, currentPrice: 168.40, created_at: '2025-08-20T00:00:00Z' },
        { id: 'demo-4', name: 'Bitcoin Secure Custody', symbol: 'BTC-INR', type: 'Crypto', qty: 0.12, buy_price: 4850000, currentPrice: 5420000, created_at: '2026-03-01T00:00:00Z' },
        { id: 'demo-5', name: 'HDFC Corporate Bond FD', symbol: 'FDRD_118000', type: 'Debt', qty: 1, buy_price: 105000, currentPrice: 118000, created_at: '2025-06-01T00:00:00Z' },
        { id: 'demo-6', name: 'Physical Silver Bullion (999)', symbol: 'SILVER_INR_1G', type: 'Commodity', qty: 450, buy_price: 215.00, currentPrice: 225.00, created_at: '2026-02-12T00:00:00Z' }
      ]
      setHoldings(demoHoldings)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      if (!data || data.length === 0) {
         // Provide demo data on empty db so UX is immediate and stunning
         const demoHoldings: Holding[] = [
            { id: 'demo-1', name: 'Physical Gold 24K', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 25, buy_price: 7800, currentPrice: 8050, created_at: '2025-11-15T00:00:00Z' },
            { id: 'demo-2', name: 'Reliance Industries Ltd', symbol: 'RELIANCE.NS', type: 'Equity', qty: 40, buy_price: 2680, currentPrice: 2950, created_at: '2026-01-10T00:00:00Z' },
            { id: 'demo-3', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', qty: 650, buy_price: 142.50, currentPrice: 168.40, created_at: '2025-08-20T00:00:00Z' }
         ]
         setHoldings(demoHoldings)
      }
      setLoading(false)
      return
    }

    const uniqueSymbols = Array.from(new Set(
      data
        .filter(h => !(h.type === 'Debt' && h.symbol?.startsWith('FDRD_')))
        .map(h => h.symbol)
        .filter(Boolean)
    ))

    let priceMap: Record<string, any> = {}
    
    if (uniqueSymbols.length > 0) {
       try {
          const res = await fetch(`/api/sync?symbols=${uniqueSymbols.map(encodeURIComponent).join(',')}`)
          if (res.ok) {
             priceMap = await res.json()
          }
       } catch (e) {
          console.error("Bulk price fetch failed:", e)
       }
    }

    const holdingsWithLivePrices = data.map(holding => {
      if (holding.type === 'Debt' && holding.symbol?.startsWith('FDRD_')) {
        const parsedCurrentPrice = parseFloat(holding.symbol.replace('FDRD_', '')) || holding.buy_price
        return { ...holding, currentPrice: parsedCurrentPrice }
      }
      
      const priceData = priceMap[holding.symbol]
      let curPrice = priceData?.price || Number(holding.currentPrice || holding.buy_price || 0)
      if (holding.symbol === 'GOLD_INR_1G' || holding.symbol === 'GOLD' || holding.name?.toLowerCase().includes('gold 24k') || holding.name?.toLowerCase().includes('physical gold')) {
         curPrice = priceData?.price || 7842.00
      } else if (holding.symbol === 'SILVER_INR_1G' || holding.symbol === 'SILVER' || holding.name?.toLowerCase().includes('silver bullion')) {
         curPrice = priceData?.price || 94.50
      }
      return { 
         ...holding, 
         currentPrice: curPrice 
      }
    })

    setHoldings(holdingsWithLivePrices)
    setLoading(false)
  }

  const resetForm = () => {
    setEditingHoldingId(null)
    setIsModalOpen(false)
    setName("")
    setSymbol("")
    setType("Equity")
    setQty("")
    setBuyPrice("")
    setCommoditySubtype("Physical")
    setMetalType("Gold")
    setDebtSubtype("FD/RD")
    setTotalInvestment("")
    setCurrentVal("")
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (holding: Holding, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingHoldingId(holding.id)
    setType(holding.type)
    
    if (holding.type === 'Commodity' && (holding.symbol === 'GOLD_INR_1G' || holding.symbol === 'SILVER_INR_1G')) {
       setCommoditySubtype('Physical')
       setMetalType(holding.symbol.startsWith('GOLD') ? 'Gold' : 'Silver')
       setQty(holding.qty.toString())
       setBuyPrice((holding.qty * holding.buy_price).toString())
    } else if (holding.type === 'Debt' && holding.symbol?.startsWith('FDRD_')) {
       setDebtSubtype('FD/RD')
       setName(holding.name)
       setTotalInvestment(holding.buy_price.toString())
       setCurrentVal(holding.symbol.replace('FDRD_', ''))
    } else {
       setName(holding.name)
       setSymbol(holding.symbol)
       setQty(holding.qty.toString())
       setBuyPrice(holding.buy_price.toString())
       if (holding.type === 'Commodity') setCommoditySubtype('Digital')
       if (holding.type === 'Debt') setDebtSubtype('ETF')
    }
    
    setIsModalOpen(true)
  }

  const handleOpenSell = (holding: Holding, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSellingHolding(holding)
    setSellQty(holding.qty.toString())
    setSellPrice((holding.currentPrice || holding.buy_price).toString())
    const diffDays = holding.created_at ? (Date.now() - new Date(holding.created_at).getTime()) / (1000 * 3600 * 24) : 0
    setTaxDuration(diffDays >= 365 ? 'LTCG' : 'STCG')
  }

  const handleConfirmSell = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellingHolding) return

    const numSellQty = parseFloat(sellQty)
    const numSellPrice = parseFloat(sellPrice)

    if (isNaN(numSellQty) || numSellQty <= 0 || numSellQty > sellingHolding.qty) {
      toast.error(`Please enter a valid quantity up to your total holding (${sellingHolding.qty})`)
      return
    }

    const remainingQty = sellingHolding.qty - numSellQty
    const realizedProceeds = numSellQty * (isNaN(numSellPrice) ? (sellingHolding.currentPrice || sellingHolding.buy_price) : numSellPrice)
    const realizedPL = (numSellPrice - sellingHolding.buy_price) * numSellQty

    // Record local transaction log
    const newTx = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'SELL',
      name: sellingHolding.name,
      symbol: sellingHolding.symbol,
      qty: numSellQty,
      price: numSellPrice,
      total: realizedProceeds,
      status: 'Completed',
      gain: `${realizedPL >= 0 ? '+' : ''}₹${fmtINR(Math.abs(realizedPL))}`
    }
    setTransactions(prev => [newTx, ...prev])

    const { data: { user } } = await supabase.auth.getUser()
    if (user && !sellingHolding.id.startsWith('demo-')) {
      if (remainingQty <= 0.0001) {
        await supabase.from('holdings').delete().eq('id', sellingHolding.id)
      } else {
        await supabase.from('holdings').update({ qty: remainingQty }).eq('id', sellingHolding.id)
      }
    } else {
      // Local state fallback for demo items
      if (remainingQty <= 0.0001) {
        setHoldings(prev => prev.filter(h => h.id !== sellingHolding.id))
      } else {
        setHoldings(prev => prev.map(h => h.id === sellingHolding.id ? { ...h, qty: remainingQty } : h))
      }
    }

    toast.success(`Liquidated ${numSellQty} of ${sellingHolding.name} for ₹${fmtINR(realizedProceeds)}`)
    setSellingHolding(null)
    if (user && !sellingHolding.id.startsWith('demo-')) fetchHoldings()

    // Dispatch global notification
    window.dispatchEvent(new CustomEvent("bun-notify", {
      detail: {
        title: "🪙 Asset Liquidated / Realized Gain",
        message: `Sold ${numSellQty} units of ${sellingHolding.name} for ₹${fmtINR(realizedProceeds)}. Net Worth adjusted!`,
        type: "success"
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let finalSymbol = symbol
    let finalName = name
    let finalBuyPrice = parseFloat(buyPrice)
    let finalQty = parseFloat(qty)
    
    if (type === 'Commodity' && commoditySubtype === 'Physical') {
       finalSymbol = metalType === 'Gold' ? 'GOLD_INR_1G' : 'SILVER_INR_1G'
       finalName = `Physical ${metalType}`
       finalBuyPrice = parseFloat(buyPrice) / parseFloat(qty)
    } else if (type === 'Debt' && debtSubtype === 'FD/RD') {
       finalSymbol = `FDRD_${parseFloat(currentVal)}`
       finalName = name || "FD/RD"
       finalBuyPrice = parseFloat(totalInvestment)
       finalQty = 1
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Add local demo holding
      const newDemo: Holding = {
        id: `demo-${Date.now()}`,
        name: finalName,
        symbol: finalSymbol,
        type,
        qty: finalQty,
        buy_price: finalBuyPrice,
        currentPrice: finalBuyPrice * 1.04,
        created_at: new Date().toISOString()
      }
      if (editingHoldingId) {
        setHoldings(prev => prev.map(h => h.id === editingHoldingId ? { ...newDemo, id: editingHoldingId } : h))
      } else {
        setHoldings(prev => [newDemo, ...prev])
      }
      resetForm()
      toast.success(editingHoldingId ? "Asset updated" : "Asset added")
      return
    }

    const payload = {
      user_id: user.id,
      name: finalName,
      symbol: finalSymbol,
      type,
      qty: finalQty,
      buy_price: finalBuyPrice,
    }

    let error
    if (editingHoldingId) {
       const res = await supabase.from('holdings').update(payload).eq('id', editingHoldingId)
       error = res.error
    } else {
       const res = await supabase.from('holdings').insert([payload])
       error = res.error
    }

    if (!error) {
      resetForm()
      fetchHoldings()
      toast.success(editingHoldingId ? "Asset updated" : "Asset added")
    } else {
      toast.error("Failed to save asset: " + error.message)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !id.startsWith('demo-')) {
       await supabase.from('holdings').delete().eq('id', id)
       fetchHoldings()
    } else {
       setHoldings(prev => prev.filter(h => h.id !== id))
    }
    toast.success("Asset removed from ledger")
    if (selectedHoldingDetail?.id === id) setSelectedHoldingDetail(null)
  }

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) {
      toast.error("Please paste CSV data first")
      return
    }

    setBulkImporting(true)
    const { data: { user } } = await supabase.auth.getUser()

    const lines = bulkCsvText.trim().split(/\r?\n/)
    const payloads: any[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.toLowerCase().startsWith('name')) continue
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 5) {
        const [hName, hSymbol, hType, hQty, hPrice] = parts
        const parsedQty = parseFloat(hQty)
        const parsedPrice = parseFloat(hPrice)
        if (!isNaN(parsedQty) && !isNaN(parsedPrice) && parsedQty > 0) {
          payloads.push({
            user_id: user?.id || 'demo-user',
            name: hName || hSymbol,
            symbol: hSymbol.toUpperCase(),
            type: ['Equity', 'Mutual Fund', 'Crypto', 'Debt', 'Commodity'].includes(hType) ? hType : 'Equity',
            qty: parsedQty,
            buy_price: parsedPrice,
            created_at: new Date().toISOString()
          })
        }
      }
    }

    if (payloads.length === 0) {
      toast.error("Could not parse any valid rows. Check format: Name,Symbol,Type,Qty,BuyPrice")
      setBulkImporting(false)
      return
    }

    if (user) {
      const dbPayloads = payloads.map(({ created_at, ...p }) => p)
      await supabase.from('holdings').insert(dbPayloads)
      fetchHoldings()
    } else {
      const demoAdditions = payloads.map((p, idx) => ({ ...p, id: `demo-bulk-${Date.now()}-${idx}`, currentPrice: p.buy_price * 1.05 }))
      setHoldings(prev => [...demoAdditions, ...prev])
    }

    setBulkImporting(false)
    toast.success(`Successfully imported ${payloads.length} holdings!`)
    setIsBulkModalOpen(false)
    setBulkCsvText("")
  }

  const handleSort = (column: 'name' | 'value' | 'pl' | 'plPercent' | 'xirr') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Helper calculation for individual XIRR
  const computeItemXirr = (h: Holding) => {
    const purchaseDate = new Date(h.created_at || Date.now())
    const now = new Date()
    const diffDays = Math.max(Math.ceil(Math.abs(now.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24)), 1)
    const invested = h.qty * h.buy_price
    const current = h.qty * (h.currentPrice || h.buy_price)
    if (invested <= 0) return 0
    const ratio = current / invested
    let annualized = ((Math.pow(ratio, 365 / Math.max(diffDays, 30)) - 1) * 100)
    if (Math.abs(annualized) > 400) annualized = ((ratio - 1) * 100)
    return annualized
  }

  const filteredHoldings = useMemo(() => {
    let list = activeTab === "All" || activeTab === "Transactions" ? holdings : holdings.filter(h => h.type === activeTab)
    if (searchQuery.trim()) {
       const q = searchQuery.toLowerCase()
       list = list.filter(h => h.name.toLowerCase().includes(q) || h.symbol.toLowerCase().includes(q) || h.type.toLowerCase().includes(q))
    }

    return [...list].sort((a, b) => {
      const aInvested = a.qty * a.buy_price
      const bInvested = b.qty * b.buy_price
      const aVal = a.qty * (a.currentPrice || a.buy_price)
      const bVal = b.qty * (b.currentPrice || b.buy_price)
      const aPl = aVal - aInvested
      const bPl = bVal - bInvested
      const aPlPct = aInvested > 0 ? (aPl / aInvested) * 100 : 0
      const bPlPct = bInvested > 0 ? (bPl / bInvested) * 100 : 0
      const aXirr = computeItemXirr(a)
      const bXirr = computeItemXirr(b)

      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortBy === 'value') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
      if (sortBy === 'pl') {
        return sortOrder === 'asc' ? aPl - bPl : bPl - aPl
      }
      if (sortBy === 'plPercent') {
        return sortOrder === 'asc' ? aPlPct - bPlPct : bPlPct - aPlPct
      }
      if (sortBy === 'xirr') {
        return sortOrder === 'asc' ? aXirr - bXirr : bXirr - aXirr
      }
      return 0
    })
  }, [holdings, activeTab, sortBy, sortOrder, searchQuery])

  const totalPortfolioCurrent = holdings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0)
  const totalInvested = holdings.reduce((acc, h) => acc + (h.qty * h.buy_price), 0)
  const totalPL = totalPortfolioCurrent - totalInvested
  const plPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0

  // Sparkline computation for drawer
  const sparklineData = useMemo(() => {
    if (!selectedHoldingDetail) return []
    const points = detailRange === '1W' ? 7 : detailRange === '1M' ? 30 : 90
    const startPrice = selectedHoldingDetail.buy_price
    const endPrice = selectedHoldingDetail.currentPrice || selectedHoldingDetail.buy_price
    const data: any[] = []
    
    for (let i = 0; i <= points; i++) {
      const progress = i / points
      const noise = (Math.sin(i * 1.5) * 0.03 + Math.cos(i * 2.3) * 0.02) * (endPrice * 0.08)
      const price = startPrice + (endPrice - startPrice) * progress + (i === points ? 0 : noise)
      
      const d = new Date()
      d.setDate(d.getDate() - (points - i))
      data.push({
        date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: Math.max(price, 1)
      })
    }
    return data
  }, [selectedHoldingDetail, detailRange])

  const detailMetrics = useMemo(() => {
    if (!selectedHoldingDetail) return { cagr: 0, daysHeld: 1 }
    const purchaseDate = new Date(selectedHoldingDetail.created_at || Date.now())
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime())
    const daysHeld = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1)
    return { cagr: computeItemXirr(selectedHoldingDetail), daysHeld }
  }, [selectedHoldingDetail])

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">LOADING YOUR HOLDINGS...</span>
          <p className="text-[11px] font-mono text-slate-500">Syncing your portfolio investments and live prices</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 relative w-full min-w-0 overflow-x-hidden pb-16">
      {/* 1. EXECUTIVE LIVE BULLION & ASSET TICKER */}
      <div className="glass-panel p-3 px-4 flex items-center gap-4 overflow-hidden border-[#E8EAF0] dark:border-[#262626] bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#0D1117] dark:via-[#151A21]/80 dark:to-[#0D1117] shadow-sm">
        <div className="flex items-center gap-2.5 shrink-0 z-10 bg-white dark:bg-[#0D1117] pr-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md gold-gradient-bg text-slate-950 shadow-sm">
            <Coins className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">Live Rates Index:</span>
        </div>

        {/* Continuous Automatic Left Scrolling Marquee */}
        <div className="flex overflow-hidden relative w-full select-none">
          <div className="ticker-track gap-8 py-1 flex items-center shrink-0 font-bold text-xs">
            {[...Array(2)].map((_, loopIdx) => (
              <React.Fragment key={loopIdx}>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-muted-foreground font-extrabold">24K Gold /g</span>
                  <span className="font-mono font-bold text-foreground">₹14,394.00</span>
                  <span className="text-[#00E676] font-bold bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">+0.48%</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-muted-foreground font-extrabold">Silver Bullion /g</span>
                  <span className="font-mono font-bold text-foreground">₹225.00</span>
                  <span className="text-[#00E676] font-bold bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">+1.25%</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-muted-foreground font-extrabold">NIFTY 50</span>
                  <span className="font-mono font-bold text-foreground">24,850.25</span>
                  <span className="text-[#00E676] font-bold bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">+0.42%</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151A21] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-muted-foreground font-extrabold">Bitcoin (BTC)</span>
                  <span className="font-mono font-bold text-foreground">₹54,20,000</span>
                  <span className="text-[#00E676] font-bold bg-[#00E676]/10 px-1.5 py-0.5 rounded text-[10px]">+2.14%</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE HERO HEADER & LEDGER SUMMARY */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#08090B] via-[#0D1117] to-[#151A21] p-6 sm:p-8 text-white shadow-2xl border border-[#F4C542]/35 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542]/15 border border-[#F4C542]/35 text-xs font-bold text-[#F4C542]">
              <BarChart2 className="h-3.5 w-3.5" /> Portfolio Holdings & Assets
           </div>
           <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-mono">
              ₹{fmtINR(totalPortfolioCurrent, { maximumFractionDigits: 0 })}
           </h2>
           <p className="text-xs text-slate-300 font-semibold flex items-center gap-3">
              <span>Total Invested: <strong className="text-white font-mono">₹{fmtINR(totalInvested)}</strong></span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#F4C542]" />
              <span className={totalPL >= 0 ? "text-[#00E676] font-bold font-mono" : "text-[#FF3B30] font-bold font-mono"}>
                 P&L Alpha: {totalPL >= 0 ? '+' : ''}₹{fmtINR(totalPL)} ({plPercent.toFixed(2)}%)
              </span>
           </p>
        </div>

        {/* Action Strip */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
           <Button onClick={() => setIsBulkModalOpen(true)} type="button" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold h-11 px-5 rounded-xl transition-all shadow-md hover:border-[#F4C542]">
              <Upload className="h-4 w-4 mr-2 text-[#F4C542]" /> Bulk CSV Import
           </Button>

           <Button onClick={handleOpenAdd} className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all scale-[1.01]">
              <Plus className="h-4 w-4 mr-2 stroke-[3]" /> + Add Asset
           </Button>
        </div>
      </div>

      {/* 3. TABS + SEARCH & SORT CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#0D1117] p-3 rounded-2xl border border-[#E8EAF0] dark:border-[#262626] shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
           {["All", "Equity", "Mutual Fund", "Commodity", "Crypto", "Debt", "Transactions"].map(tab => {
             const count = tab === "All" ? holdings.length : tab === "Transactions" ? transactions.length : holdings.filter(h => h.type === tab).length
             const isActive = activeTab === tab
             return (
               <button 
                 key={tab} 
                 onClick={() => setActiveTab(tab)}
                 className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                   isActive 
                     ? "gold-gradient-bg text-slate-950 font-bold shadow-sm" 
                     : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-[#151A21]"
                 }`}
               >
                 <span>{tab}</span>
                 <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                   isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-200/60 dark:bg-slate-800 text-muted-foreground"
                 }`}>
                   {count}
                 </span>
               </button>
             )
           })}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 w-full sm:w-64">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
           <input
             type="text"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder="Search ledger symbols..."
             className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#F4C542]/50"
           />
        </div>
      </div>

      {/* 4. CONTENT AREA: HOLDINGS LEDGER TABLE vs TRANSACTIONS LOG */}
      {activeTab === "Transactions" ? (
        <Card className="glass-panel border-[#E8EAF0] dark:border-[#262626] shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/40 p-5 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-base font-bold flex items-center gap-2">
                 <History className="h-4 w-4 text-[#F4C542]" /> Transaction History
               </CardTitle>
               <CardDescription className="text-xs">Complete record of additions, buys, and sales.</CardDescription>
            </div>
            <span className="badge-wealth text-xs">Verified Trail</span>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs table-auto border-collapse border-2 border-slate-400 dark:border-slate-600">
                  <thead className="bg-slate-200 dark:bg-[#151A21] font-bold uppercase text-slate-800 dark:text-slate-200 border-b-2 border-slate-400 dark:border-slate-600">
                    <tr>
                      <th className="p-3 px-4 border border-slate-300 dark:border-slate-700">Date</th>
                      <th className="p-3 border border-slate-300 dark:border-slate-700">Action</th>
                      <th className="p-3 border border-slate-300 dark:border-slate-700">Asset & Symbol</th>
                      <th className="p-3 text-right border border-slate-300 dark:border-slate-700">Units / Wt</th>
                      <th className="p-3 text-right border border-slate-300 dark:border-slate-700">Price (₹)</th>
                      <th className="p-3 text-right border border-slate-300 dark:border-slate-700">Total Proceeds / Cost</th>
                      <th className="p-3 text-right border border-slate-300 dark:border-slate-700">Realized Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-700 font-bold">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-100 dark:hover:bg-[#1A202C] transition-colors">
                        <td className="p-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">{tx.date}</td>
                        <td className="p-3 border border-slate-300 dark:border-slate-700">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm ${
                            tx.type === 'BUY' ? 'bg-blue-500/20 text-blue-900 dark:text-blue-300 border-blue-500/40' : 'bg-amber-500/25 text-amber-900 dark:text-amber-300 border-amber-500/50'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-foreground border border-slate-300 dark:border-slate-700">
                          {tx.name} <span className="text-slate-700 dark:text-slate-400 font-mono text-[10px] ml-1">({tx.symbol})</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold border border-slate-300 dark:border-slate-700">{tx.qty}</td>
                        <td className="p-3 text-right font-mono font-bold border border-slate-300 dark:border-slate-700">₹{fmtINR(tx.price)}</td>
                        <td className="p-3 text-right font-mono font-bold text-foreground border border-slate-300 dark:border-slate-700">₹{fmtINR(tx.total)}</td>
                        <td className="p-3 text-right font-mono font-bold border border-slate-300 dark:border-slate-700">
                          {tx.gain ? (
                            <span className={`px-2 py-0.5 rounded font-bold border ${tx.gain.includes('+') ? 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-500/40'}`}>{tx.gain}</span>
                          ) : (
                            <span className="text-muted-foreground font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel border-2 border-slate-400 dark:border-slate-600 shadow-xl overflow-hidden">
          <CardContent className="p-0">
             <div className="relative w-full">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                  <table className="w-full caption-bottom text-xs table-auto border-collapse border-2 border-slate-400 dark:border-slate-600">
                  <thead className="bg-slate-200 dark:bg-[#151A21] font-bold uppercase text-slate-800 dark:text-slate-200 border-b-2 border-slate-400 dark:border-slate-600">
                    <tr className="whitespace-nowrap h-12">
                      <th onClick={() => handleSort('name')} className="px-4 text-left cursor-pointer hover:text-foreground select-none border border-slate-300 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                          Asset Name {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-amber-600 dark:text-amber-400" /> : <ArrowDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                        </div>
                      </th>
                      <th className="px-3 text-left border border-slate-300 dark:border-slate-700">Category</th>
                      <th className="px-3 text-right border border-slate-300 dark:border-slate-700">Units / Wt</th>
                      <th className="px-3 text-right border border-slate-300 dark:border-slate-700">Avg Buy (₹)</th>
                      <th className="px-3 text-right border border-slate-300 dark:border-slate-700">Live Price (₹)</th>
                      <th className="px-3 text-right border border-slate-300 dark:border-slate-700">Invested (₹)</th>
                      <th onClick={() => handleSort('value')} className="px-3 text-right cursor-pointer hover:text-foreground select-none border border-slate-300 dark:border-slate-700">
                        <div className="flex items-center justify-end gap-1.5">
                          Current Val (₹) {sortBy === 'value' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-amber-600 dark:text-amber-400" /> : <ArrowDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                        </div>
                      </th>
                      <th onClick={() => handleSort('plPercent')} className="px-3 text-right cursor-pointer hover:text-foreground select-none border border-slate-300 dark:border-slate-700">
                        <div className="flex items-center justify-end gap-1.5">
                          P&L Alpha {sortBy === 'plPercent' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-amber-600 dark:text-amber-400" /> : <ArrowDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                        </div>
                      </th>
                      <th onClick={() => handleSort('xirr')} className="px-3 text-right cursor-pointer hover:text-foreground select-none border border-slate-300 dark:border-slate-700">
                        <div className="flex items-center justify-end gap-1.5">
                          Est. XIRR {sortBy === 'xirr' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-amber-600 dark:text-amber-400" /> : <ArrowDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                        </div>
                      </th>
                      <th className="px-4 text-right border border-slate-300 dark:border-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-700 font-bold">
                    {loading ? (
                       <>
                         {[1, 2, 3, 4].map(i => (
                           <tr key={i} className="animate-pulse">
                             <td className="p-4 border border-slate-300 dark:border-slate-700"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                             <td className="p-4 border border-slate-300 dark:border-slate-700"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                             <td className="p-4 text-right border border-slate-300 dark:border-slate-700"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl ml-auto" /></td>
                           </tr>
                         ))}
                       </>
                    ) : filteredHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-muted-foreground font-bold border border-slate-300 dark:border-slate-700">
                          No assets match this criteria. Click "+ Add Asset" or "Bulk Import" to build your portfolio ledger.
                        </td>
                      </tr>
                    ) : filteredHoldings.map(holding => {
                      const invested = holding.qty * holding.buy_price
                      const currentValue = holding.qty * (holding.currentPrice || holding.buy_price)
                      const pl = currentValue - invested
                      const plPct = invested > 0 ? (pl / invested) * 100 : 0
                      const xirrVal = computeItemXirr(holding)

                      return (
                        <tr 
                          key={holding.id}
                          onClick={() => setSelectedHoldingDetail(holding)}
                          className="hover:bg-slate-100 dark:hover:bg-[#1A202C] cursor-pointer transition-colors whitespace-nowrap group"
                        >
                          <td className="p-3.5 px-4 font-bold text-foreground border border-slate-300 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span>{holding.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">{holding.symbol}</div>
                          </td>
                          <td className="p-3.5 px-3 border border-slate-300 dark:border-slate-700">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm">
                              {holding.type}
                            </span>
                          </td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">{holding.qty}</td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">₹{fmtINR(holding.buy_price, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3.5 px-3 text-right font-mono border border-slate-300 dark:border-slate-700">
                            <span className="bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/50 shadow-sm inline-block">
                              ₹{fmtINR((holding.currentPrice || holding.buy_price), { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">₹{fmtINR(invested, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold text-base text-foreground border border-slate-300 dark:border-slate-700">₹{fmtINR(currentValue, { minimumFractionDigits: 2 })}</td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold border border-slate-300 dark:border-slate-700">
                            <span className={`px-2.5 py-1 rounded-lg font-bold border shadow-sm inline-block ${pl >= 0 ? "bg-emerald-500/20 text-emerald-950 dark:text-emerald-300 border-emerald-500/50" : "bg-rose-500/20 text-rose-950 dark:text-rose-300 border-rose-500/50"}`}>
                              {pl >= 0 ? '+' : ''}₹{fmtINR(pl, { maximumFractionDigits: 0 })} ({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="p-3.5 px-3 text-right font-mono font-bold border border-slate-300 dark:border-slate-700">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${xirrVal >= 0 ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border border-emerald-500/40" : "bg-rose-500/15 text-rose-950 dark:text-rose-300 border border-rose-500/40"}`}>
                              {xirrVal >= 0 ? '+' : ''}{xirrVal.toFixed(1)}% p.a.
                            </span>
                          </td>
                          <td className="p-3.5 px-4 text-right border border-slate-300 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => handleOpenSell(holding, e)}
                                title="Sell or Withdraw Tranche"
                                className="h-7 px-2.5 rounded-lg text-amber-950 dark:text-amber-300 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 font-bold text-[10px] shadow-sm"
                              >
                                <MinusCircle className="h-3 w-3 mr-1" /> Sell
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={e => handleOpenEdit(holding, e)}
                                className="h-7 w-7 text-slate-700 dark:text-slate-300 hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={e => handleDelete(holding.id, e)}
                                className="h-7 w-7 text-destructive/80 hover:text-destructive"
                              >
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

              {/* Mobile Card List View */}
              <div className="flex flex-col gap-4 p-4 md:hidden">
                {loading ? (
                  <>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-slate-100 dark:bg-[#151A21] rounded-xl p-4 h-48 border border-slate-200 dark:border-slate-700" />
                    ))}
                  </>
                ) : filteredHoldings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground font-bold border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#151A21]">
                    No assets match this criteria. Click "+ Add Asset" to build your portfolio.
                  </div>
                ) : filteredHoldings.map(holding => {
                  const invested = holding.qty * holding.buy_price
                  const currentValue = holding.qty * (holding.currentPrice || holding.buy_price)
                  const pl = currentValue - invested
                  const plPct = invested > 0 ? (pl / invested) * 100 : 0
                  const xirrVal = computeItemXirr(holding)

                  return (
                    <div key={holding.id} onClick={() => setSelectedHoldingDetail(holding)} className="bg-white dark:bg-[#151A21] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col gap-4 shadow-sm cursor-pointer hover:border-amber-500/50 transition-colors">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{holding.name}</h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">{holding.symbol}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm">{holding.type}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#0B0E14] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div className="flex flex-col">
                             <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Invested</span>
                             <span className="font-mono font-bold mt-0.5">₹{fmtINR(invested, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Current Val</span>
                             <span className="font-mono font-bold text-foreground mt-0.5">₹{fmtINR(currentValue, { minimumFractionDigits: 2 })}</span>
                          </div>
                       </div>

                       <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-1.5">
                             <span className={`px-2 py-1 rounded font-bold text-[10px] inline-block w-max ${pl >= 0 ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300" : "bg-rose-500/20 text-rose-900 dark:text-rose-300"}`}>
                               {pl >= 0 ? '+' : ''}₹{fmtINR(pl, { maximumFractionDigits: 0 })} ({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)
                             </span>
                             <span className={`px-2 py-1 rounded font-bold text-[10px] inline-block w-max ${xirrVal >= 0 ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300" : "bg-rose-500/15 text-rose-900 dark:text-rose-300"}`}>
                               XIRR: {xirrVal >= 0 ? '+' : ''}{xirrVal.toFixed(1)}% p.a.
                             </span>
                          </div>
                          
                          <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                             <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={e => handleOpenEdit(holding, e)} className="h-7 w-7 text-slate-500 hover:text-foreground bg-slate-100 dark:bg-slate-800/50"><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" onClick={e => handleDelete(holding.id, e)} className="h-7 w-7 text-destructive/80 hover:text-destructive bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                             </div>
                             <Button variant="outline" size="sm" onClick={e => handleOpenSell(holding, e)} className="h-7 px-3 text-[10px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                                <MinusCircle className="h-3 w-3 mr-1.5" /> Sell
                             </Button>
                          </div>
                       </div>
                    </div>
                  )
                })}
              </div>
             </div>
          </CardContent>
        </Card>
      )}
      {selectedHoldingDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
           <Card className="w-full sm:max-w-2xl bg-white dark:bg-[#08090B] border border-[#E8EAF0] dark:border-[#262626] shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
             <CardHeader className="p-6 border-b border-border/40 flex flex-row items-start justify-between">
               <div>
                 <div className="flex items-center gap-2">
                   <CardTitle className="text-xl font-bold text-foreground">{selectedHoldingDetail.name}</CardTitle>
                   <span className="badge-wealth text-[10px]">{selectedHoldingDetail.type}</span>
                 </div>
                 <CardDescription className="font-mono text-xs mt-1 text-muted-foreground">{selectedHoldingDetail.symbol}</CardDescription>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setSelectedHoldingDetail(null)} className="h-8 w-8 rounded-full">
                 <X className="h-4 w-4" />
               </Button>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
               {/* Key KPI Strip */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground block">Live Price</span>
                   <span className="text-base font-bold font-mono text-[#F4C542] mt-0.5 block">
                     ₹{fmtINR(selectedHoldingDetail.currentPrice || selectedHoldingDetail.buy_price)}
                   </span>
                 </div>
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground block">Avg Buy Price</span>
                   <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                     ₹{fmtINR(selectedHoldingDetail.buy_price)}
                   </span>
                 </div>
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground block">Current Valuation</span>
                   <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                     ₹{fmtINR(selectedHoldingDetail.qty * (selectedHoldingDetail.currentPrice || selectedHoldingDetail.buy_price))}
                   </span>
                 </div>
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground block">Total P&L Alpha</span>
                   {(() => {
                     const pl = (selectedHoldingDetail.qty * (selectedHoldingDetail.currentPrice || selectedHoldingDetail.buy_price)) - (selectedHoldingDetail.qty * selectedHoldingDetail.buy_price)
                     const pct = (selectedHoldingDetail.qty * selectedHoldingDetail.buy_price) > 0 ? (pl / (selectedHoldingDetail.qty * selectedHoldingDetail.buy_price)) * 100 : 0
                     return (
                       <span className={`text-base font-bold font-mono mt-0.5 block ${pl >= 0 ? 'text-[#00E676]' : 'text-[#FF3B30]'}`}>
                         {pl >= 0 ? '+' : ''}₹{pl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pct.toFixed(1)}%)
                       </span>
                     )
                   })()}
                 </div>
               </div>

               {/* Sparkline Chart */}
               <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                     <BarChart2 className="h-4 w-4 text-[#F4C542]" /> Price Sparkline Trajectory
                   </span>
                   <div className="flex gap-1 bg-white dark:bg-[#08090B] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                     {(['1W', '1M', '3M'] as const).map(rng => (
                       <button
                         key={rng}
                         onClick={() => setDetailRange(rng)}
                         className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                           detailRange === rng ? 'gold-gradient-bg text-slate-950 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                         }`}
                       >
                         {rng}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="h-[180px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <defs>
                         <linearGradient id="detailGoldGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#F4C542" stopOpacity={0.4} />
                           <stop offset="95%" stopColor="#F4C542" stopOpacity={0} />
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} />
                       <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={v => `₹${v.toFixed(0)}`} />
                       <Tooltip 
                         formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Sparkline Trajectory']}
                         contentStyle={{ backgroundColor: '#08090B', border: '1px solid #F4C542', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                       />
                       <Area type="monotone" dataKey="price" stroke="#F4C542" strokeWidth={2.5} fill="url(#detailGoldGrad)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               {/* XIRR Box */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className="p-4 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-between">
                   <div>
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[#00E676] block">Annualized XIRR Trajectory</span>
                     <span className="text-2xl font-bold font-mono text-[#00E676] mt-0.5 block">
                       {detailMetrics.cagr >= 0 ? '+' : ''}{detailMetrics.cagr.toFixed(2)}% p.a.
                     </span>
                   </div>
                   <Activity className="h-6 w-6 text-[#00E676]" />
                 </div>

                 <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                   <div>
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Holding Duration</span>
                     <span className="text-2xl font-bold font-mono text-foreground mt-0.5 block">
                       {detailMetrics.daysHeld} {detailMetrics.daysHeld === 1 ? 'Day' : 'Days'}
                     </span>
                   </div>
                   <Calendar className="h-6 w-6 text-muted-foreground opacity-60" />
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>
      )}

      {/* 6. SELL / WITHDRAW MODAL */}
      {sellingHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-md bg-white dark:bg-[#08090B] border border-[#F4C542]/40 shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col shrink-0">
             <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg shrink-0" />
             <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
               <div>
                 <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                   <MinusCircle className="h-5 w-5 text-[#F4C542]" /> Sell or Withdraw Tranche
                 </CardTitle>
                 <CardDescription className="text-xs font-semibold">Liquidate {sellingHolding.name} ({sellingHolding.type})</CardDescription>
               </div>
               <Button type="button" variant="ghost" size="icon" onClick={() => setSellingHolding(null)} className="h-8 w-8 rounded-full shrink-0">
                 <X className="h-4 w-4" />
               </Button>
             </CardHeader>
             <form onSubmit={handleConfirmSell} className="flex flex-col overflow-hidden">
               <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                 <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                   <div>
                     <span className="text-muted-foreground uppercase tracking-wider block text-[10px]">Current Holding</span>
                     <span className="text-base text-foreground font-mono font-bold">{sellingHolding.qty} {sellingHolding.type === 'Commodity' ? 'g' : 'units'}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-muted-foreground uppercase tracking-wider block text-[10px]">Avg Acquisition Cost</span>
                     <span className="text-base text-foreground font-mono font-bold">₹{fmtINR(sellingHolding.buy_price)}</span>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                     {sellingHolding.type === 'Commodity' ? 'Weight to Liquidate (grams)' : 'Units to Liquidate'}
                   </label>
                   <input
                     type="number"
                     step="any"
                     required
                     value={sellQty}
                     onChange={e => setSellQty(e.target.value)}
                     placeholder={`Max ${sellingHolding.qty}`}
                     className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                     {sellingHolding.type === 'Commodity' ? 'Realized Selling Rate (₹ per gram)' : 'Realized Selling Price (₹ per unit)'}
                   </label>
                   <input
                     type="number"
                     step="any"
                     required
                     value={sellPrice}
                     onChange={e => setSellPrice(e.target.value)}
                     placeholder="Enter current live rate"
                     className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]"
                   />
                 </div>

                 {parseFloat(sellQty) > 0 && parseFloat(sellPrice) > 0 && (() => {
                    const grossProceeds = parseFloat(sellQty) * parseFloat(sellPrice)
                    const realizedGain = (parseFloat(sellPrice) - sellingHolding.buy_price) * parseFloat(sellQty)
                    const isProfit = realizedGain > 0
                    const taxRate = taxDuration === 'STCG' ? 0.20 : 0.125
                    const estTax = isProfit ? realizedGain * taxRate : 0
                    const netProceeds = grossProceeds - estTax

                    return (
                      <div className="space-y-3">
                        {/* Realized Proceeds & Gain */}
                        <div className="p-4 rounded-xl bg-[#F4C542]/10 border border-[#F4C542]/30 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-[#F4C542]">
                            <span>Gross Realized Proceeds:</span>
                            <span className="font-mono text-base">₹{fmtINR(grossProceeds)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1 border-t border-[#F4C542]/20">
                            <span>Gross Realized Gain/Loss:</span>
                            <span className={`font-mono font-bold ${isProfit ? 'text-[#00E676]' : 'text-[#FF3B30]'}`}>
                              {isProfit ? '+' : ''}₹{fmtINR(realizedGain)}
                            </span>
                          </div>
                        </div>

                        {/* Institutional STCG / LTCG Tax Estimator */}
                        {isProfit && (
                          <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-300 dark:border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Capital Gains Tax Classification:
                              </span>
                              <div className="flex gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-border/40">
                                <button
                                  type="button"
                                  onClick={() => setTaxDuration('STCG')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${taxDuration === 'STCG' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  STCG (&lt;1 Yr · 20%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTaxDuration('LTCG')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${taxDuration === 'LTCG' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  LTCG (&gt;1 Yr · 12.5%)
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 text-xs font-bold">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Estimated Tax Liability</span>
                                <span className="font-mono font-bold text-[#FF3B30]">−₹{fmtINR(estTax)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block">Net Post-Tax Proceeds</span>
                                <span className="font-mono font-bold text-[#00E676]">₹{fmtINR(netProceeds)}</span>
                              </div>
                            </div>
                            <div className="text-[9px] text-muted-foreground font-semibold italic">
                              *Note: Estimates computed as per Union Budget 2024 revised tax brackets (20% STCG / 12.5% LTCG). Actual liability depends on total annual exemption limits.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
               </CardContent>
               <div className="p-4 sm:p-5 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/80 flex justify-end gap-3 shrink-0">
                 <Button type="button" variant="outline" onClick={() => setSellingHolding(null)} className="rounded-xl font-bold px-5 h-10">
                   Cancel
                 </Button>
                 <Button type="submit" className="rounded-xl font-bold px-6 h-10 gold-gradient-bg text-slate-950 shadow-lg hover:brightness-105">
                   Confirm Liquidation
                 </Button>
               </div>
             </form>
           </Card>
        </div>
      )}

      {/* 7. ADD ASSET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-md bg-white dark:bg-[#08090B] border border-[#F4C542]/30 shadow-2xl my-auto max-h-[90vh] flex flex-col shrink-0">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
                 <CardTitle className="font-bold text-lg sm:text-xl">{editingHoldingId ? 'Edit Asset Entry' : 'Add Investment / Asset'}</CardTitle>
                 <Button type="button" variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-full shrink-0">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <CardContent className="pt-4 sm:pt-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                     <div className="grid grid-cols-2 gap-4">
                        <div className={(type === 'Commodity' || type === 'Debt') ? "col-span-1" : "col-span-2"}>
                           <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
                           <select value={type} onChange={e => {
                              const val = e.target.value
                              setType(val)
                              if (val === 'Debt') setDebtSubtype("FD/RD")
                           }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-slate-100 dark:bg-[#151A21] font-bold text-xs">
                              <option>Equity</option>
                              <option>Mutual Fund</option>
                              <option>Commodity</option>
                              <option>Crypto</option>
                              <option>Debt</option>
                           </select>
                        </div>
                        {type === 'Commodity' && (
                           <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Format</label>
                              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#151A21] rounded-xl border border-slate-200 dark:border-slate-800">
                                 <Button type="button" variant={commoditySubtype === 'Physical' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs font-bold" onClick={() => setCommoditySubtype('Physical')}>Physical</Button>
                                 <Button type="button" variant={commoditySubtype === 'Digital' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs font-bold" onClick={() => setCommoditySubtype('Digital')}>Digital</Button>
                              </div>
                           </div>
                        )}
                     </div>

                     {type === 'Commodity' && commoditySubtype === 'Physical' ? (
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Bullion Type</label>
                           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[#151A21] rounded-xl">
                              <Button type="button" variant={metalType === 'Gold' ? 'default' : 'ghost'} className="flex-1 h-10 font-bold" onClick={() => setMetalType('Gold')}><span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] mr-2" /> 24K Gold</Button>
                              <Button type="button" variant={metalType === 'Silver' ? 'default' : 'ghost'} className="flex-1 h-10 font-bold" onClick={() => setMetalType('Silver')}><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2" /> Silver</Button>
                           </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4">
                           <div className="relative">
                              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Asset Name</label>
                              <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reliance / TCS" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-slate-100 dark:bg-[#151A21] font-bold text-xs" />
                              {suggestions.length > 0 && (
                                 <ul className="absolute left-0 mt-1 max-h-48 w-[280px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#08090B] p-1.5 shadow-2xl z-50 text-xs divide-y divide-border/20">
                                    {suggestions.map((item, idx) => (
                                       <li key={idx} onClick={() => { setName(item.name); setSymbol(item.symbol); setSuggestions([]) }} className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-[#151A21] rounded font-bold">
                                          <div>{item.name}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">{item.symbol}</div>
                                       </li>
                                    ))}
                                 </ul>
                              )}
                           </div>
                           <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Symbol / Ticker</label>
                              <input required value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. RELIANCE.NS" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-slate-100 dark:bg-[#151A21] font-bold text-xs uppercase font-mono" />
                           </div>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{type === 'Commodity' ? 'Weight (g)' : 'Quantity / Units'}</label>
                           <input required type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 25" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-slate-100 dark:bg-[#151A21] font-bold text-xs font-mono" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg Buy Rate (₹)</label>
                           <input required type="number" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="e.g. 7800" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-slate-100 dark:bg-[#151A21] font-bold text-xs font-mono" />
                        </div>
                     </div>
                </CardContent>
                <div className="p-4 sm:p-5 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/80 flex justify-end gap-3 shrink-0">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl font-bold px-5 h-10">Cancel</Button>
                  <Button type="submit" className="gold-gradient-bg text-slate-950 font-bold h-10 px-6 rounded-xl shadow-lg hover:brightness-105">
                     Save Investment
                  </Button>
                </div>
              </form>
           </Card>
        </div>
      )}

      {/* 8. BULK CSV IMPORT MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-lg bg-white dark:bg-[#08090B] border border-[#F4C542]/30 shadow-2xl my-auto max-h-[90vh] flex flex-col shrink-0">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-[#F4C542]/60 bg-[#080A0F] p-1 shrink-0 shadow-lg">
                    <img src="/csv-logo.png" alt="Bulk CSV 3D Icon" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <CardTitle className="font-bold flex items-center gap-2 text-lg sm:text-xl text-foreground">
                      Bulk CSV / Excel Import
                    </CardTitle>
                    <CardDescription className="text-xs">Paste multi-row spreadsheet entries to import immediately into your ledger.</CardDescription>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsBulkModalOpen(false)} className="h-8 w-8 rounded-full shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-bold">Format:</strong> <code>Name,Symbol,Type,Qty,BuyPrice</code><br />
                  <span className="text-[11px] font-mono block mt-1">Example: TCS,TCS.NS,Equity,15,3850.00</span>
                </div>
                <textarea
                  rows={6}
                  value={bulkCsvText}
                  onChange={e => setBulkCsvText(e.target.value)}
                  placeholder={`Reliance Industries,RELIANCE.NS,Equity,10,2950\nPhysical Gold 24K,GOLD_INR_1G,Commodity,20,14394`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono bg-slate-50 dark:bg-[#151A21] focus:outline-none focus:border-[#F4C542]"
                />
              </CardContent>
              <div className="p-4 sm:p-5 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/80 flex justify-end gap-3 shrink-0">
                 <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)} className="rounded-xl font-bold px-5 h-10">Cancel</Button>
                 <Button type="button" onClick={handleBulkImport} disabled={bulkImporting} className="gold-gradient-bg text-slate-950 font-bold rounded-xl px-6 h-10 hover:brightness-105">
                   {bulkImporting ? "Processing Import..." : "Import Rows"}
                 </Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  )
}

export default function HoldingsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Holdings...</div>}>
      <HoldingsContent />
    </Suspense>
  )
}
