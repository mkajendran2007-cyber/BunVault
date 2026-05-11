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

    const uniqueSymbols = Array.from(new Set(
       (data || []).map(item => item.symbol).filter(Boolean)
    ));

    let priceMap: Record<string, any> = {};
    
    if (uniqueSymbols.length > 0) {
       try {
          const res = await fetch(`/api/sync?symbols=${uniqueSymbols.map(encodeURIComponent).join(',')}`)
          if (res.ok) {
             priceMap = await res.json();
          }
       } catch (e) {
          console.error("Watchlist bulk sync error:", e);
       }
    }

    const itemsWithLivePrices = (data || []).map((item) => {
      const priceData = priceMap[item.symbol];
      return { 
         ...item, 
         currentPrice: priceData?.price,
         change: priceData?.change,
         changePercent: priceData?.changePercent
      }
    })

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
    <div className="flex-1 space-y-4 relative w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">Market Watchlist</h2>
           <p className="text-muted-foreground font-medium mt-1">Track live price dynamics for prospective investments</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
           <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <Card className="glass-panel border-primary/20">
        <CardContent className="p-0">
            {/* Desktop Watchlist View */}
            <div className="overflow-x-auto hidden md:block no-scrollbar">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="border-b bg-muted/30 whitespace-nowrap">
                    <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Asset Name</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                    <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Live Price</th>
                    <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Today's Change</th>
                    <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Trend</th>
                    <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider">Act.</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                     <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Syncing live market data...</td></tr>
                  ) : watchlist.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="p-12 text-center text-muted-foreground">
                         <div className="border-dashed border-2 m-4 p-8 rounded-lg flex flex-col items-center justify-center">
                            <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                            Your watchlist is empty. Click "Add Asset" to start tracking.
                         </div>
                       </td>
                     </tr>
                  ) : watchlist.map((item) => {
                    const isUp = (item.changePercent || 0) >= 0;
                    return (
                      <tr key={item.id} className="border-b transition-colors hover:bg-muted/30 whitespace-nowrap">
                        <td className="py-3 px-4 align-middle font-semibold text-foreground">
                           {item.name} <span className="text-[10px] text-muted-foreground font-mono ml-1 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/20">({item.symbol})</span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                           <span className="px-2 py-0.5 bg-secondary/60 border border-border/30 rounded text-[10px] font-bold uppercase">{item.type}</span>
                        </td>
                        <td className="py-3 px-4 align-middle text-right font-bold private-value">
                           {item.currentPrice ? `₹${item.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '—'}
                        </td>
                        <td className={`py-3 px-4 align-middle text-right font-bold private-value ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
                           {item.changePercent ? (
                              <div className="flex flex-col items-end leading-tight">
                                <span>{isUp ? '+' : ''}{item.change?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                <span className="text-[10px] opacity-80">({isUp ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                              </div>
                           ) : '—'}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                           <div className={`inline-flex items-center justify-center p-1.5 rounded-md ${isUp ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : 'bg-destructive/15 text-destructive border border-destructive/20'}`}>
                              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                           </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Optimized Watchlist List View */}
            <div className="md:hidden divide-y divide-border/40">
               {loading ? (
                  <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                     <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                     <span>Loading market view...</span>
                  </div>
               ) : watchlist.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                     Tap the button below to build your watchlist!
                  </div>
               ) : watchlist.map((item) => {
                  const isUp = (item.changePercent || 0) >= 0;
                  return (
                     <div key={item.id} className="p-4 flex items-center justify-between active:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-3">
                           <h4 className="font-bold text-[14px] text-foreground leading-tight truncate">{item.name}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground font-mono bg-secondary/60 px-1 rounded">{item.symbol}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{item.type}</span>
                           </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-3 shrink-0">
                           <div className="flex flex-col items-end">
                              <p className="font-extrabold text-[15px] tracking-tight">
                                 {item.currentPrice ? `₹${item.currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}` : '—'}
                              </p>
                              <div className={`flex items-center gap-1 font-bold text-[11px] ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
                                 {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                 <span>{item.changePercent ? `${isUp ? '+' : ''}${item.changePercent.toFixed(2)}%` : ''}</span>
                              </div>
                           </div>
                           
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive/80 active:bg-destructive/10 -mr-1 ml-1">
                              <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                        </div>
                     </div>
                  );
               })}
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
      {/* Mobile Floating Action Button for New Asset */}
      <button 
         onClick={() => setIsModalOpen(true)}
         className="md:hidden fixed bottom-[72px] right-4 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-900/30 flex items-center justify-center z-40 active:scale-95 transition-transform border border-emerald-400/20 hover:bg-emerald-500"
         aria-label="Add Asset"
      >
         <Plus className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
