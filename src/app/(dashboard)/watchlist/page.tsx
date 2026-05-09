"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, TrendingUp, TrendingDown } from "lucide-react"

type WatchlistItem = {
  id: string
  name: string
  symbol: string
  type: string
  currentPrice?: number
  change?: number
  changePercent?: number
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
  { name: "Bitcoin", symbol: "BTC-USD", type: "Crypto" },
  { name: "Ethereum", symbol: "ETH-USD", type: "Crypto" },
  { name: "Solana", symbol: "SOL-USD", type: "Crypto" },
  { name: "Binance Coin", symbol: "BNB-USD", type: "Crypto" },
  { name: "Ripple", symbol: "XRP-USD", type: "Crypto" },

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

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("Equity")

  const [suggestions, setSuggestions] = useState<{name: string, symbol: string, type: string}[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  // Live autocomplete search for all Indian equities and mutual funds
  useEffect(() => {
    if (name.length < 2 || (type !== 'Equity' && type !== 'Mutual Fund')) {
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

  const fetchWatchlist = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching watchlist:", error)
      return
    }

    const itemsWithLivePrices = await Promise.all((data || []).map(async (item) => {
      try {
        const res = await fetch(`/api/sync?symbol=${item.symbol}`)
        const priceData = await res.json()
        return { 
           ...item, 
           currentPrice: priceData.price,
           change: priceData.change,
           changePercent: priceData.changePercent
        }
      } catch (e) {
        return { ...item } 
      }
    }))

    setWatchlist(itemsWithLivePrices)
    setLoading(false)
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("You are not logged in!")
      return
    }

    const { error } = await supabase.from('watchlist').insert([{
      user_id: user.id,
      name,
      symbol,
      type
    }])

    if (!error) {
      setIsModalOpen(false)
      setName("")
      setSymbol("")
      fetchWatchlist()
    } else {
      alert("Failed to add to watchlist: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this from your watchlist?")) return;
    const { error } = await supabase.from('watchlist').delete().eq('id', id)
    if (!error) fetchWatchlist()
  }

  return (
    <div className="flex-1 space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Market Watchlist</h2>
           <p className="text-muted-foreground">Track live prices and trends for assets you don't own yet.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
           <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <Card className="glass-panel border-primary/20">
        <CardContent className="p-0">
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b bg-muted/50">
                   <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Asset Name</th>
                   <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Live Price (₹)</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Today's Change</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Trend</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                 </tr>
               </thead>
               <tbody className="[&_tr:last-child]:border-0">
                 {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Syncing live market data...
                      </td>
                    </tr>
                 ) : watchlist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <div className="border-dashed border-2 m-4 p-8 rounded-lg flex flex-col items-center justify-center">
                           <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                           Your watchlist is empty. Click "Add Asset" to start tracking the market.
                        </div>
                      </td>
                    </tr>
                 ) : watchlist.map((item) => {
                   const isUp = (item.changePercent || 0) >= 0;
                   return (
                     <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                       <td className="p-4 align-middle font-medium">
                          {item.name} <span className="text-xs text-muted-foreground ml-1">({item.symbol})</span>
                       </td>
                       <td className="p-4 align-middle">
                          <span className="px-2 py-1 bg-secondary rounded-md text-xs">{item.type}</span>
                       </td>
                       <td className="p-4 align-middle text-right font-semibold">
                          {item.currentPrice ? `₹${item.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '—'}
                       </td>
                       <td className={`p-4 align-middle text-right font-medium ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
                          {item.changePercent ? (
                             <>
                               {isUp ? '+' : ''}{item.change?.toLocaleString(undefined, {maximumFractionDigits: 2})} 
                               <span className="text-xs ml-1 opacity-80">({isUp ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                             </>
                          ) : '—'}
                       </td>
                       <td className="p-4 align-middle text-right">
                          <div className={`inline-flex items-center justify-center p-1.5 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                             {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                       </td>
                       <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        </CardContent>
      </Card>

      {/* Add Asset Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
               <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle>Add to Watchlist</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
                     <X className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleAddAsset} className="space-y-4">
                      <div className="relative overflow-visible">
                         <label className="block text-sm font-medium mb-1">Asset Name</label>
                         <div className="relative">
                            <input 
                               required 
                               value={name} 
                               onChange={e => setName(e.target.value)} 
                               placeholder={type === 'Mutual Fund' ? "Type to search Mutual Funds..." : "Type to search Equities..."} 
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
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium mb-1">
                              {type === 'Mutual Fund' ? 'AMFI Code' : 'Symbol / Ticker'}
                           </label>
                           <input required value={symbol} onChange={e => setSymbol(e.target.value)} placeholder={type === 'Mutual Fund' ? 'e.g. 122639' : 'e.g. AAPL'} className="w-full rounded-md border py-2 px-3 bg-background uppercase" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Asset Type</label>
                           <select required value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border py-2 px-3 bg-background">
                              <option>Equity</option>
                              <option>Mutual Fund</option>
                              <option>Crypto</option>
                              <option>Debt</option>
                              <option>Commodity</option>
                           </select>
                        </div>
                     </div>
                     <div className="pt-4">
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Add to Watchlist</Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  )
}
