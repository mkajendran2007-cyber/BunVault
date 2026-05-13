"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Pencil } from "lucide-react"

type Holding = {
  id: string
  name: string
  symbol: string
  type: string
  qty: number
  buy_price: number
  purchase_date: string
  currentPrice?: number // Fetched live
}

const POPULAR_ASSETS = [
  // Equity (NSE)
  { name: "Reliance Industries", symbol: "RELIANCE.NS", type: "Equity" },
  { name: "TCS", symbol: "TCS.NS", type: "Equity" },
  { name: "HDFC Bank", symbol: "HDFCBANK.NS", type: "Equity" },
  { name: "Infosys", symbol: "INFY.NS", type: "Equity" },
  { name: "ICICI Bank", symbol: "ICICIBANK.NS", type: "Equity" },
  { name: "State Bank of India", symbol: "SBIN.NS", type: "Equity" },
  { name: "Bharti Airtel", symbol: "BHARTIARTL.NS", type: "Equity" },
  { name: "ITC", symbol: "ITC.NS", type: "Equity" },
  { name: "Larsen & Toubro", symbol: "LT.NS", type: "Equity" },
  { name: "Tata Motors", symbol: "TATAMOTORS.NS", type: "Equity" },
  { name: "Bajaj Finance", symbol: "BAJFINANCE.NS", type: "Equity" },

  // Mutual Funds (AMFI Codes)
  { name: "Parag Parikh Flexi Cap Fund", symbol: "122639", type: "Mutual Fund" },
  { name: "Quant Small Cap Fund", symbol: "102885", type: "Mutual Fund" },
  { name: "SBI Small Cap Fund", symbol: "114674", type: "Mutual Fund" },
  { name: "Nippon India Small Cap Fund", symbol: "113177", type: "Mutual Fund" },
  { name: "HDFC Mid-Cap Opportunities Fund", symbol: "106423", type: "Mutual Fund" },
  { name: "Axis Bluechip Fund", symbol: "112251", type: "Mutual Fund" },
  { name: "ICICI Prudential Bluechip Fund", symbol: "108466", type: "Mutual Fund" },

  // Crypto
  { name: "Bitcoin", symbol: "BTC-INR", type: "Crypto" },
  { name: "Ethereum", symbol: "ETH-INR", type: "Crypto" },
  { name: "Solana", symbol: "SOL-INR", type: "Crypto" },
  { name: "Binance Coin", symbol: "BNB-INR", type: "Crypto" },
  { name: "Ripple", symbol: "XRP-INR", type: "Crypto" },

  // Commodity
  { name: "Gold (MCX)", symbol: "GC=F", type: "Commodity" },
  { name: "Silver (MCX)", symbol: "SI=F", type: "Commodity" },
  { name: "Crude Oil", symbol: "CL=F", type: "Commodity" },

  // Debt / ETFs
  { name: "Nippon India Liquid Fund", symbol: "102552", type: "Debt" },
  { name: "SBI Liquid Fund", symbol: "105541", type: "Debt" },
  { name: "HDFC Liquid Fund", symbol: "119062", type: "Debt" },
  { name: "NIFTY 50 ETF", symbol: "NIFTYBEES.NS", type: "Equity" },
  { name: "Gold ETF", symbol: "GOLDBEES.NS", type: "Commodity" }
];

export default function HoldingsPage() {
  const [activeTab, setActiveTab] = useState("All")
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchHoldings()
  }, [])

  // Live autocomplete search for Indian equities, mutual funds, and cryptocurrencies
  useEffect(() => {
    if (name.length < 2 || (type !== 'Equity' && type !== 'Mutual Fund' && type !== 'Crypto')) {
       setSuggestions([])
       return
    }

    const delayDebounceFn = setTimeout(async () => {
       setSearching(true)
       try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(name)}&type=${type}`)
          const matches = await res.json()
          setSuggestions(matches)
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
    
    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 2. Fetch holdings from Supabase
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching holdings:", error)
      return
    }

    // 3. Extract symbols for bulk fetch
    const uniqueSymbols = Array.from(new Set(
      (data || [])
        .filter(h => !(h.type === 'Debt' && h.symbol?.startsWith('FDRD_')))
        .map(h => h.symbol)
        .filter(Boolean)
    ));

    let priceMap: Record<string, any> = {};
    
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

    // 4. Merge prices back into holdings
    const holdingsWithLivePrices = (data || []).map(holding => {
      if (holding.type === 'Debt' && holding.symbol.startsWith('FDRD_')) {
        const parsedCurrentPrice = parseFloat(holding.symbol.replace('FDRD_', '')) || holding.buy_price;
        return { ...holding, currentPrice: parsedCurrentPrice }
      }
      
      const priceData = priceMap[holding.symbol];
      return { 
         ...holding, 
         currentPrice: priceData?.price || holding.buy_price 
      };
    });

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

  const handleOpenEdit = (holding: Holding) => {
    setEditingHoldingId(holding.id)
    setType(holding.type)
    
    if (holding.type === 'Commodity' && (holding.symbol === 'GOLD_INR_1G' || holding.symbol === 'SILVER_INR_1G')) {
       setCommoditySubtype('Physical')
       setMetalType(holding.symbol.startsWith('GOLD') ? 'Gold' : 'Silver')
       setQty(holding.qty.toString())
       setBuyPrice((holding.qty * holding.buy_price).toString()) // Total investment shown in form
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalSymbol = symbol;
    let finalName = name;
    let finalBuyPrice = parseFloat(buyPrice);
    let finalQty = parseFloat(qty);
    
    if (type === 'Commodity' && commoditySubtype === 'Physical') {
       finalSymbol = metalType === 'Gold' ? 'GOLD_INR_1G' : 'SILVER_INR_1G';
       finalName = `Physical ${metalType}`;
       finalBuyPrice = parseFloat(buyPrice) / parseFloat(qty);
    } else if (type === 'Debt' && debtSubtype === 'FD/RD') {
       finalSymbol = `FDRD_${parseFloat(currentVal)}`;
       finalName = name || "FD/RD";
       finalBuyPrice = parseFloat(totalInvestment);
       finalQty = 1;
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("You are not logged in! Please go to the Signup/Login page first to create an account.")
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

    let error;
    if (editingHoldingId) {
       const res = await supabase.from('holdings').update(payload).eq('id', editingHoldingId)
       error = res.error;
    } else {
       const res = await supabase.from('holdings').insert([payload])
       error = res.error;
    }

    if (!error) {
      resetForm()
      fetchHoldings() // Refresh table
    } else {
      alert("Failed to save asset: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    const { error } = await supabase.from('holdings').delete().eq('id', id)
    if (!error) {
      fetchHoldings()
    }
  }

  const filteredHoldings = activeTab === "All" ? holdings : holdings.filter(h => h.type === activeTab)

  // Retain global total for static % of Portfolio reference
  const totalPortfolioCurrent = holdings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0);

  // Dynamically calculate metrics based on current filter (Addresses user request)
  const totalInvested = filteredHoldings.reduce((acc, h) => acc + (h.qty * h.buy_price), 0);
  const totalCurrent = filteredHoldings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0);
  const totalPL = totalCurrent - totalInvested;
  const plPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="flex-1 space-y-4 relative w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">Your Holdings</h2>
           <p className="text-muted-foreground font-medium mt-1">Manage and grow your unified asset portfolio</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
           <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      {/* Desktop Summary View (Restored for PC View) */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-lg border-white/10 bg-white/40 dark:bg-slate-950/30 backdrop-blur-md transition-all">
           <CardContent className="p-6">
              <div className="text-sm font-bold tracking-wider uppercase text-muted-foreground/70 mb-3">Total Invested</div>
              <div className="text-3xl font-black private-value">₹{totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </CardContent>
        </Card>
        <Card className="hover:shadow-lg border-primary/20 transition-all">
           <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-20" />
              <div className="text-sm font-bold tracking-wider uppercase text-primary mb-3">Current Value</div>
              <div className="text-3xl font-black text-foreground private-value">₹{totalCurrent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all">
           <CardContent className="p-6">
              <div className="text-sm font-bold tracking-wider uppercase text-muted-foreground/70 mb-3">Unrealized P&L</div>
              <div className={`text-3xl font-black private-value ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                 {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="mt-2">
                 <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold private-value border ${totalPL >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {totalPL >= 0 ? '+' : ''}{plPercent.toFixed(2)}% overall return
                 </span>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Consolidated Mobile Summary Card (Matches Mobile Preference) */}
      <Card className="md:hidden glass-panel border-border/40 shadow-lg shadow-black/5 mb-2 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                 Invested
              </p>
              <p className="text-xl md:text-2xl font-bold private-value tracking-tight">₹{totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="text-right border-l border-white/10 pl-4">
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
              <p className="text-xl md:text-2xl font-bold text-primary private-value tracking-tight">₹{totalCurrent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Returns / P&L</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className={`text-2xl md:text-3xl font-black private-value tracking-tight ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-md private-value ${totalPL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                  {totalPL >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-2 border-b border-white/10 pb-2 mb-2 overflow-x-auto no-scrollbar scroll-smooth">
        {["All", "Equity", "Mutual Fund", "Debt", "Crypto", "Commodity"].map(tab => (
           <Button 
             key={tab} 
             variant={activeTab === tab ? "default" : "ghost"} 
             onClick={() => setActiveTab(tab)}
             size="sm"
             className={`rounded-full px-4 text-xs font-medium transition-all ${activeTab === tab ? "shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground bg-muted/30"}`}
           >
             {tab}
           </Button>
        ))}
      </div>

      <Card className="border-border/50 shadow-md w-full max-w-full overflow-hidden">
        <CardContent className="p-0">
           {/* Desktop Table View */}
           <div className="relative w-full overflow-x-auto hidden md:block no-scrollbar">
              <table className="w-full caption-bottom text-sm table-auto">
                <thead className="[&_tr]:border-b bg-muted/30">
                  <tr className="border-b border-border/60 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted whitespace-nowrap">
                    <th className="h-12 px-2 lg:px-3 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[160px]">Asset Name</th>
                    <th className="h-12 px-2 lg:px-3 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Qty</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Avg. Buy</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Live Price</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Invested</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Current</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">% Port.</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">P&L</th>
                    <th className="h-12 px-2 lg:px-3 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Act.</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                     <tr>
                       <td colSpan={10} className="p-8 text-center text-muted-foreground">
                         <div className="flex justify-center items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> Syncing live data...
                         </div>
                       </td>
                     </tr>
                  ) : filteredHoldings.length === 0 ? (
                     <tr>
                       <td colSpan={10} className="p-8 text-center text-muted-foreground">
                         No assets found. Click "Add Asset" to start building your portfolio.
                       </td>
                     </tr>
                  ) : filteredHoldings.map((holding) => {
                    const invested = holding.qty * holding.buy_price;
                    const currentValue = holding.qty * (holding.currentPrice || holding.buy_price);
                    const pl = currentValue - invested;
                    const plPercent = invested > 0 ? (pl / invested) * 100 : 0;
                    const allocationPercent = totalPortfolioCurrent > 0 ? (currentValue / totalPortfolioCurrent) * 100 : 0;

                    return (
                      <tr key={holding.id} className="border-b border-border/40 transition-colors hover:bg-muted/20 data-[state=selected]:bg-muted whitespace-nowrap text-[13px]">
                        <td className="py-3 px-2 lg:px-3 align-middle font-semibold text-foreground/90 min-w-[160px] whitespace-normal">
                           {holding.name} <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">{holding.symbol}</div>
                        </td>
                        <td className="py-3 px-2 lg:px-3 align-middle"><span className="px-1.5 py-0.5 bg-secondary/50 text-secondary-foreground border border-border/30 rounded text-[10px] font-medium uppercase tracking-wider">{holding.type}</span></td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right font-medium private-value">{holding.qty}</td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right private-value">₹{holding.buy_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right private-value">₹{(holding.currentPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right private-value font-medium">₹{invested.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right font-bold private-value text-foreground">₹{currentValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right">
                           <div className="flex items-center justify-end gap-1.5">
                              <span className="font-bold text-primary private-value text-[11px]">{allocationPercent.toFixed(1)}%</span>
                              <div className="w-10 bg-secondary/30 h-1 rounded-full overflow-hidden hidden xl:block border border-white/5">
                                 <div className="bg-primary h-full" style={{ width: `${allocationPercent}%` }}></div>
                              </div>
                           </div>
                        </td>
                        <td className={`py-3 px-2 lg:px-3 align-middle text-right font-bold private-value ${pl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                          <div className="flex flex-col items-end leading-tight">
                             <span>{pl >= 0 ? '+' : ''}₹{pl.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</span>
                             <span className="text-[9px] opacity-80">({plPercent.toFixed(1)}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 lg:px-3 align-middle text-right">
                           <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(holding)} className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                 <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(holding.id)} className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors">
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

           {/* Mobile Optimized List View (Matches Image 1 Preference) */}
           <div className="md:hidden divide-y divide-white/5">
             {loading ? (
                <div className="p-8 text-center flex items-center justify-center gap-2 text-muted-foreground text-sm">
                   <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" /> 
                   Loading your portfolio...
                </div>
             ) : filteredHoldings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm bg-muted/10">
                   No assets found in this category.
                </div>
             ) : (
                filteredHoldings.map((holding) => {
                   const invested = holding.qty * holding.buy_price;
                   const currentValue = holding.qty * (holding.currentPrice || holding.buy_price);
                   const pl = currentValue - invested;
                   const plPercent = invested > 0 ? (pl / invested) * 100 : 0;
                   
                   return (
                      <div key={holding.id} className="p-4 flex items-center justify-between active:bg-muted/50 transition-colors group relative">
                         <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-bold text-[14px] leading-tight text-foreground mb-0.5 line-clamp-1">
                               {holding.name}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                               <span className="text-[9px] font-bold bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/20 uppercase tracking-wider">
                                  {holding.type}
                               </span>
                               <span className="text-[11px] text-muted-foreground/80 private-value font-medium">
                                  {holding.type === 'Commodity' && !holding.symbol.includes('ETF') ? 'Wt: ' : 'Qty: '}{holding.qty}
                               </span>
                            </div>
                         </div>
                         
                         <div className="text-right flex items-center gap-3">
                            <div className="flex flex-col items-end">
                               <div className="font-extrabold text-sm private-value tracking-tight">
                                  ₹{currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                               </div>
                               <div className={`text-[11px] font-bold flex items-center mt-0.5 private-value ${pl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                  {pl >= 0 ? '+' : ''}₹{pl.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                  <span className="ml-1 text-[10px] font-medium opacity-90">({pl >= 0 ? '+' : ''}{plPercent.toFixed(1)}%)</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-1 -mr-2">
                               <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(holding)} className="h-7 w-7 text-muted-foreground hover:text-primary active:bg-primary/10">
                                  <Pencil className="h-3.5 w-3.5" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(holding.id)} className="h-7 w-7 text-destructive/80 hover:text-destructive active:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                            </div>
                         </div>
                      </div>
                   )
                })
             )}
           </div>
        </CardContent>
      </Card>

      {/* Add Asset Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
               <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle>{editingHoldingId ? 'Edit Asset' : 'Add New Asset'}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8">
                     <X className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className={(type === 'Commodity' || type === 'Debt') ? "col-span-1" : "col-span-2"}>
                           <label className="block text-sm font-medium mb-1">Asset Type</label>
                           <select required value={type} onChange={e => {
                              const val = e.target.value;
                              setType(val);
                              if (val === 'Debt') {
                                 setDebtSubtype("FD/RD");
                              }
                           }} className="w-full rounded-md border py-2 px-3 bg-background">
                              <option>Equity</option>
                              <option>Mutual Fund</option>
                              <option>Crypto</option>
                              <option>Debt</option>
                              <option>Commodity</option>
                           </select>
                        </div>
                        {type === 'Commodity' && (
                           <div>
                              <label className="block text-sm font-medium mb-1">Format</label>
                              <div className="flex gap-1 p-1 bg-secondary rounded-md h-[42px] items-center">
                                 <Button type="button" variant={commoditySubtype === 'Physical' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs px-2" onClick={() => setCommoditySubtype('Physical')}>Physical</Button>
                                 <Button type="button" variant={commoditySubtype === 'Digital' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs px-2" onClick={() => setCommoditySubtype('Digital')}>Digital</Button>
                              </div>
                           </div>
                        )}
                        {type === 'Debt' && (
                           <div>
                              <label className="block text-sm font-medium mb-1">Debt Type</label>
                              <div className="flex gap-1 p-1 bg-secondary rounded-md h-[42px] items-center">
                                 <Button type="button" variant={debtSubtype === 'FD/RD' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs px-2" onClick={() => setDebtSubtype('FD/RD')}>FD/RD</Button>
                                 <Button type="button" variant={debtSubtype === 'ETF' ? 'default' : 'ghost'} className="flex-1 h-8 text-xs px-2" onClick={() => setDebtSubtype('ETF')}>ETF</Button>
                              </div>
                           </div>
                        )}
                     </div>

                     {type === 'Commodity' && commoditySubtype === 'Physical' ? (
                        <div>
                           <label className="block text-sm font-medium mb-1">Metal Type</label>
                           <div className="flex gap-2 p-1 bg-secondary rounded-md">
                              <Button type="button" variant={metalType === 'Gold' ? 'default' : 'ghost'} className="flex-1 h-10" onClick={() => setMetalType('Gold')}><div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>Gold</Button>
                              <Button type="button" variant={metalType === 'Silver' ? 'default' : 'ghost'} className="flex-1 h-10" onClick={() => setMetalType('Silver')}><div className="w-2 h-2 rounded-full bg-slate-400 mr-2"></div>Silver</Button>
                           </div>
                        </div>
                     ) : type === 'Debt' && debtSubtype === 'FD/RD' ? (
                        <div>
                           <label className="block text-sm font-medium mb-1">Asset Name</label>
                           <input 
                              required
                              value={name} 
                              onChange={e => setName(e.target.value)} 
                              placeholder="e.g. HDFC Fixed Deposit" 
                              className="w-full rounded-md border py-2 px-3 bg-background" 
                           />
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative overflow-visible">
                               <label className="block text-sm font-medium mb-1">Asset Name</label>
                               <div className="relative">
                                  <input 
                                     required={!(type === 'Commodity' && commoditySubtype === 'Physical')}
                                     value={name} 
                                     onChange={e => setName(e.target.value)} 
                                     placeholder={type === 'Mutual Fund' ? "Type to search Mutual Funds..." : (type === 'Crypto' ? "Type to search Cryptos (e.g. Bitcoin)..." : "Type to search Equities...")} 
                                     className="w-full rounded-md border py-2 px-3 bg-background" 
                                  />
                                  {searching && (
                                     <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  )}
                               </div>
                               {suggestions.length > 0 && (
                                  <ul className="absolute left-0 mt-1 max-h-64 w-[320px] md:w-[420px] overflow-y-auto rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl z-[100] text-xs divide-y divide-border/10">
                                     {suggestions.map((item, idx) => (
                                        <li 
                                           key={idx} 
                                           onClick={() => {
                                              setName(item.name)
                                              setSymbol(item.symbol)
                                              setSuggestions([])
                                           }}
                                           className="cursor-pointer select-none rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground font-semibold flex flex-col gap-1 transition-colors text-left"
                                        >
                                           <span className="whitespace-normal break-words leading-relaxed text-foreground">{item.name}</span>
                                           <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded self-start">{item.symbol}</span>
                                        </li>
                                     ))}
                                  </ul>
                               )}
                            </div>
                            <div>
                               <label className="block text-sm font-medium mb-1">{type === 'Mutual Fund' ? 'AMFI Code' : 'Symbol / Ticker'}</label>
                               <input required={!(type === 'Commodity' && commoditySubtype === 'Physical')} value={symbol} onChange={e => setSymbol(e.target.value)} placeholder={type === 'Mutual Fund' ? 'e.g. 122639' : 'e.g. AAPL'} className="w-full rounded-md border py-2 px-3 bg-background uppercase" />
                            </div>
                         </div>
                     )}

                     {type === 'Debt' && debtSubtype === 'FD/RD' ? (
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium mb-1">Total Investment (₹)</label>
                              <input required type="number" step="any" value={totalInvestment} onChange={e => setTotalInvestment(e.target.value)} placeholder="e.g. 100000" className="w-full rounded-md border py-2 px-3 bg-background" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium mb-1">Current Value (₹)</label>
                              <input required type="number" step="any" value={currentVal} onChange={e => setCurrentVal(e.target.value)} placeholder="e.g. 108000" className="w-full rounded-md border py-2 px-3 bg-background" />
                           </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium mb-1">
                                {type === 'Commodity' && commoditySubtype === 'Physical' ? 'Weight (grams)' : (type === 'Mutual Fund' ? 'No. of Units' : 'Quantity')}
                              </label>
                              <input required type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 10" className="w-full rounded-md border py-2 px-3 bg-background" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium mb-1">
                                 {type === 'Commodity' && commoditySubtype === 'Physical' ? 'Total Investment (₹)' : 'Avg. Buy Price (₹)'}
                              </label>
                              <input required type="number" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder={type === 'Commodity' && commoditySubtype === 'Physical' ? 'e.g. 50000' : 'e.g. 150.50'} className="w-full rounded-md border py-2 px-3 bg-background" />
                           </div>
                        </div>
                     )}
                     <div className="pt-4">
                        <Button type="submit" className="w-full">Save Asset</Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
      {/* Mobile Floating Action Button (Inspired by Image 1 & 2) */}
      <button 
         onClick={handleOpenAdd}
         className="md:hidden fixed bottom-[72px] right-4 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-900/30 flex items-center justify-center z-40 active:scale-95 transition-transform border border-emerald-400/20 hover:bg-emerald-500"
         aria-label="Add Asset"
      >
         <Plus className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
