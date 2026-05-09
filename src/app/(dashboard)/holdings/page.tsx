"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2 } from "lucide-react"

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

  useEffect(() => {
    fetchHoldings()
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

    // 3. For each holding, fetch the live price from our API
    const holdingsWithLivePrices = await Promise.all((data || []).map(async (holding) => {
      if (holding.type === 'Debt' && holding.symbol.startsWith('FDRD_')) {
        const parsedCurrentPrice = parseFloat(holding.symbol.replace('FDRD_', '')) || holding.buy_price;
        return { ...holding, currentPrice: parsedCurrentPrice }
      }
      try {
        const res = await fetch(`/api/sync?symbol=${holding.symbol}`)
        const priceData = await res.json()
        return { ...holding, currentPrice: priceData.price || holding.buy_price }
      } catch (e) {
        return { ...holding, currentPrice: holding.buy_price } // fallback
      }
    }))

    setHoldings(holdingsWithLivePrices)
    setLoading(false)
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalSymbol = symbol;
    let finalName = name;
    let finalBuyPrice = parseFloat(buyPrice);
    let finalQty = parseFloat(qty);
    
    if (type === 'Commodity' && commoditySubtype === 'Physical') {
       finalSymbol = metalType === 'Gold' ? 'GOLD_INR_1G' : 'SILVER_INR_1G';
       finalName = `Physical ${metalType}`;
       // If Physical Commodity, buyPrice input acts as 'Total Investment', so we calculate per-gram buy price
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

    const { error } = await supabase.from('holdings').insert([{
      user_id: user.id,
      name: finalName,
      symbol: finalSymbol,
      type,
      qty: finalQty,
      buy_price: finalBuyPrice,
    }])

    if (!error) {
      setIsModalOpen(false)
      setName("")
      setSymbol("")
      setQty("")
      setBuyPrice("")
      setTotalInvestment("")
      setCurrentVal("")
      fetchHoldings() // Refresh table
    } else {
      alert("Failed to add asset: " + error.message)
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

  const totalInvested = holdings.reduce((acc, h) => acc + (h.qty * h.buy_price), 0);
  const totalCurrent = holdings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0);
  const totalPL = totalCurrent - totalInvested;
  const plPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="flex-1 space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Your Holdings</h2>
           <p className="text-muted-foreground">Manage your detailed asset portfolio here.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
           <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="glass-panel">
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Total Invested</div>
              <div className="text-3xl font-bold private-value">₹{totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </CardContent>
        </Card>
        <Card className="glass-panel">
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Current Value</div>
              <div className="text-3xl font-bold text-primary private-value">₹{totalCurrent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </CardContent>
        </Card>
        <Card className="glass-panel">
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Unrealized P&L</div>
              <div className={`text-3xl font-bold private-value ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                 {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <p className={`text-xs mt-1 private-value ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                 {totalPL >= 0 ? '+' : ''}{plPercent.toFixed(2)}% overall return
              </p>
           </CardContent>
        </Card>
      </div>

      <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
        {["All", "Equity", "Mutual Fund", "Debt", "Crypto", "Commodity"].map(tab => (
           <Button 
             key={tab} 
             variant={activeTab === tab ? "default" : "ghost"} 
             onClick={() => setActiveTab(tab)}
             size="sm"
           >
             {tab}
           </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
           <div className="relative w-full overflow-auto">
             <table className="w-full caption-bottom text-sm">
               <thead className="[&_tr]:border-b">
                 <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                   <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Asset Name</th>
                   <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Qty</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Avg. Buy (₹)</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Live Price (₹)</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Invested (₹)</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Current Value (₹)</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">% of Portfolio</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">P&L</th>
                   <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                 </tr>
               </thead>
               <tbody className="[&_tr:last-child]:border-0">
                 {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Syncing live data...
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
                   const allocationPercent = totalCurrent > 0 ? (currentValue / totalCurrent) * 100 : 0;

                   return (
                     <tr key={holding.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                       <td className="p-4 align-middle font-medium">
                          {holding.name} <span className="text-xs text-muted-foreground ml-1">({holding.symbol})</span>
                       </td>
                       <td className="p-4 align-middle"><span className="px-2 py-1 bg-secondary rounded-md text-xs">{holding.type}</span></td>
                       <td className="p-4 align-middle text-right private-value">{holding.qty}</td>
                       <td className="p-4 align-middle text-right private-value">₹{holding.buy_price.toFixed(2)}</td>
                       <td className="p-4 align-middle text-right private-value">₹{(holding.currentPrice || 0).toFixed(2)}</td>
                       <td className="p-4 align-middle text-right private-value">₹{invested.toFixed(2)}</td>
                       <td className="p-4 align-middle text-right font-semibold private-value">₹{currentValue.toFixed(2)}</td>
                       <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                             <span className="font-medium text-primary private-value">{allocationPercent.toFixed(1)}%</span>
                             <div className="w-12 bg-secondary/50 h-1.5 rounded-full overflow-hidden hidden md:block border border-white/5">
                                <div className="bg-primary h-full" style={{ width: `${allocationPercent}%` }}></div>
                             </div>
                          </div>
                       </td>
                       <td className={`p-4 align-middle text-right font-medium private-value ${pl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                         {pl >= 0 ? '+' : ''}{pl.toFixed(2)} ({plPercent.toFixed(2)}%)
                       </td>
                       <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(holding.id)} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
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
                  <CardTitle>Add New Asset</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
                     <X className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleAddAsset} className="space-y-4">
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
    </div>
  )
}
