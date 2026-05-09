"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Calculator } from "lucide-react"

type SIP = {
  id: string
  name: string
  symbol: string
  type: string
  amount: number
  frequency: string
  next_date: string
  status: string
}

export default function SIPPlannerPage() {
  const [sips, setSips] = useState<SIP[]>([])
  const [holdings, setHoldings] = useState<{name: string, symbol: string, type: string}[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("Equity")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("Monthly")
  const [nextDate, setNextDate] = useState("")

  // Calculator State
  const [calcAmount, setCalcAmount] = useState(5000)
  const [calcRate, setCalcRate] = useState(12)
  const [calcYears, setCalcYears] = useState(10)

  // Multi-calculator States
  const [calcMode, setCalcMode] = useState<'SIP' | 'SWP' | 'Inflation'>('SIP')

  // SWP States
  const [swpInvested, setSwpInvested] = useState(1000000)
  const [swpWithdrawal, setSwpWithdrawal] = useState(10000)
  const [swpRate, setSwpRate] = useState(12)
  const [swpYears, setSwpYears] = useState(10)

  // Inflation States
  const [infCost, setInfCost] = useState(100000)
  const [infRate, setInfRate] = useState(6)
  const [infYears, setInfYears] = useState(10)

  useEffect(() => {
    fetchSIPs()
  }, [])

  const fetchSIPs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('sips')
      .select('*')
      .eq('user_id', user.id)
      .order('next_date', { ascending: true })

    const { data: holdingsData } = await supabase
      .from('holdings')
      .select('name, symbol, type')
      .eq('user_id', user.id)

    if (error) {
      console.error("Error fetching SIPs:", error)
      return
    }

    setSips(data || [])
    if (holdingsData) {
       // Deduplicate holdings by name
       const uniqueHoldings = Array.from(new Map(holdingsData.map(item => [item.name, item])).values())
       setHoldings(uniqueHoldings)
    }
    setLoading(false)
  }

  const handleAddSIP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
       alert("You must be logged in.")
       return
    }

    let finalDate = nextDate;
    const now = new Date();
    if (frequency === 'Daily') {
      now.setDate(now.getDate() + 1);
      finalDate = now.toISOString().split('T')[0];
    } else if (frequency === 'Monthly') {
      const d = parseInt(nextDate);
      let target = new Date(now.getFullYear(), now.getMonth(), d);
      if (target <= now) target.setMonth(target.getMonth() + 1);
      finalDate = target.toISOString().split('T')[0];
    } else if (frequency === 'Weekly') {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDay = days.indexOf(nextDate);
      let diff = targetDay - now.getDay();
      if (diff <= 0) diff += 7;
      now.setDate(now.getDate() + diff);
      finalDate = now.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('sips').insert([{
      user_id: user.id,
      name,
      symbol,
      type,
      amount: parseFloat(amount),
      frequency,
      next_date: finalDate,
      status: 'Active'
    }])

    if (!error) {
      setIsModalOpen(false)
      setName("")
      setSymbol("")
      setAmount("")
      setNextDate("")
      fetchSIPs()
    } else {
      alert("Failed to add SIP: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SIP?")) return;
    const { error } = await supabase.from('sips').delete().eq('id', id)
    if (!error) fetchSIPs()
  }

  const totalMonthlySIP = sips
    .filter(s => s.status === 'Active')
    .reduce((acc, curr) => {
      // Normalize to monthly
      let val = curr.amount
      if (curr.frequency === 'Weekly') val = curr.amount * 4
      if (curr.frequency === 'Daily') val = curr.amount * 30
      return acc + val
    }, 0)

  const activeSipsCount = sips.filter(s => s.status === 'Active').length
  const nextSip = sips.length > 0 ? sips[0] : null

  const totalProjectedReturn = sips
    .filter(s => s.status === 'Active')
    .reduce((acc, curr) => {
      let monthlyAmt = curr.amount;
      if (curr.frequency === 'Weekly') monthlyAmt *= 4;
      if (curr.frequency === 'Daily') monthlyAmt *= 30;
      
      const rInvested = monthlyAmt * (calcYears * 12);
      const rTotal = monthlyAmt * ((Math.pow(1 + (calcRate/12/100), calcYears * 12) - 1) / (calcRate/12/100)) * (1 + (calcRate/12/100));
      const rReturns = rTotal - rInvested;
      return acc + rReturns;
    }, 0)

  // Calculate SIP Returns
  const i = calcRate / 12 / 100;
  const n = calcYears * 12;
  const calcInvested = calcAmount * n;
  const calcTotalValue = calcAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const calcEstimatedReturns = calcTotalValue - calcInvested;

  // SWP Calculations
  const swpTotalWithdrawals = swpWithdrawal * swpYears * 12;
  let swpFinalValue = swpInvested;
  const swpMonthlyRate = swpRate / 12 / 100;
  for (let month = 0; month < swpYears * 12; month++) {
    swpFinalValue = swpFinalValue * (1 + swpMonthlyRate) - swpWithdrawal;
    if (swpFinalValue < 0) {
      swpFinalValue = 0;
      break;
    }
  }

  // Inflation Calculations
  const infFutureCost = infCost * Math.pow(1 + infRate / 100, infYears);
  const infCostIncrease = infFutureCost - infCost;

  return (
    <div className="flex-1 space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">SIP Planner</h2>
           <p className="text-muted-foreground">Automate your investments with Systematic Investment Plans.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
           <Plus className="h-4 w-4" /> New SIP
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Total Monthly SIP</div>
              <div className="text-3xl font-bold private-value">₹{totalMonthlySIP.toFixed(2)}</div>
           </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Active SIPs</div>
              <div className="text-3xl font-bold">{activeSipsCount}</div>
           </CardContent>
        </Card>
        <Card>
           <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">Total Projected Returns ({calcYears}Y)</div>
              <div className="text-3xl font-extrabold text-emerald-500 private-value">₹{Math.round(totalProjectedReturn).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                 Combined returns at {calcRate}% p.a.
              </p>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         {/* SIP Table (Takes up 2 columns) */}
         <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                 <div>
                    <CardTitle>Your Scheduled SIPs</CardTitle>
                    <CardDescription>Manage and track your recurring investments.</CardDescription>
                 </div>
                 <div className="flex items-center gap-2 bg-secondary/30 py-1 px-3 rounded-lg border border-white/5 shadow-inner">
                    <span className="text-xs text-muted-foreground font-medium">Projection Period:</span>
                    <input 
                       type="number" 
                       min="1" max="50" 
                       value={calcYears} 
                       onChange={(e) => setCalcYears(Number(e.target.value) || 10)} 
                       className="w-14 h-8 rounded-md border text-center text-xs bg-background font-bold text-primary" 
                    />
                    <span className="text-xs text-muted-foreground font-semibold">Yrs</span>
                 </div>
              </CardHeader>
              <CardContent>
                 <div className="relative w-full overflow-auto">
                   <table className="w-full caption-bottom text-sm">
                     <thead className="[&_tr]:border-b">
                       <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                         <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-xs sm:text-sm">Asset</th>
                         <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-xs sm:text-sm">Freq.</th>
                         <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground text-xs sm:text-sm">Amount</th>
                         <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs sm:text-sm">Due</th>
                         <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground text-xs sm:text-sm">Projected ({calcYears}Y)</th>
                         <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground text-xs sm:text-sm">Returns</th>
                         <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground text-xs sm:text-sm">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="[&_tr:last-child]:border-0">
                       {loading ? (
                          <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading SIPs...</td></tr>
                       ) : sips.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No SIPs found. Create one!</td></tr>
                       ) : sips.map((sip) => {
                         let monthlyAmt = sip.amount;
                         if (sip.frequency === 'Weekly') monthlyAmt *= 4;
                         if (sip.frequency === 'Daily') monthlyAmt *= 30;
                         
                         const rInvested = monthlyAmt * (calcYears * 12);
                         const rTotal = monthlyAmt * ((Math.pow(1 + (calcRate/12/100), calcYears * 12) - 1) / (calcRate/12/100)) * (1 + (calcRate/12/100));
                         const rReturns = rTotal - rInvested;

                         return (
                          <tr key={sip.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted text-xs sm:text-sm">
                            <td className="p-2 sm:p-3 align-middle font-medium max-w-[120px] truncate">{sip.name} {sip.symbol && <span className="text-[10px] text-muted-foreground block sm:inline">({sip.symbol})</span>}</td>
                            <td className="p-2 sm:p-3 align-middle">{sip.frequency}</td>
                            <td className="p-2 sm:p-3 align-middle text-right private-value">₹{sip.amount.toLocaleString()}</td>
                            <td className="p-2 sm:p-3 align-middle text-center">
                               {sip.frequency === 'Daily' ? 'Daily' : 
                                sip.frequency === 'Weekly' ? `${new Date(sip.next_date).toLocaleDateString('en-US', {weekday: 'short'})}` : 
                                `Day ${new Date(sip.next_date).getDate()}`}
                            </td>
                            <td className="p-2 sm:p-3 align-middle text-right text-primary font-bold private-value">₹{Math.round(rTotal).toLocaleString()}</td>
                            <td className="p-2 sm:p-3 align-middle text-right text-emerald-500 font-medium private-value">+₹{Math.round(rReturns).toLocaleString()}</td>
                            <td className="p-2 sm:p-3 align-middle text-right">
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(sip.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                            </td>
                          </tr>
                       )})}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
            </Card>
         </div>

         {/* Quick Calculator Column */}
          <div>
            <Card className="h-full border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-primary">
                     <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        <span>
                          {calcMode === 'SIP' ? 'SIP Calc' : calcMode === 'SWP' ? 'SWP Calc' : 'Inflation'}
                        </span>
                     </div>
                     <div className="flex gap-1 border rounded-lg p-0.5 bg-background text-foreground shrink-0 scale-90 sm:scale-100">
                        <button 
                          onClick={() => setCalcMode('SIP')} 
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all ${calcMode === 'SIP' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          SIP
                        </button>
                        <button 
                          onClick={() => setCalcMode('SWP')} 
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all ${calcMode === 'SWP' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          SWP
                        </button>
                        <button 
                          onClick={() => setCalcMode('Inflation')} 
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-all ${calcMode === 'Inflation' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          INF
                        </button>
                     </div>
                  </CardTitle>
                  <CardDescription>
                     {calcMode === 'SIP' ? 'Future wealth estimator' : calcMode === 'SWP' ? 'Withdrawal plan calculator' : 'Future cost calculator'}
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {calcMode === 'SIP' && (
                   <>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Monthly Investment</span>
                           <span className="text-primary font-bold">₹{calcAmount.toLocaleString()}</span>
                        </label>
                        <input 
                           type="range" 
                           min="500" max="100000" step="500" 
                           value={calcAmount} 
                           onChange={(e) => setCalcAmount(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Expected Return Rate</span>
                           <span className="text-primary font-bold">{calcRate}%</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="30" step="1" 
                           value={calcRate} 
                           onChange={(e) => setCalcRate(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Time Period (Years)</span>
                           <span className="text-primary font-bold">{calcYears} Yr</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="40" step="1" 
                           value={calcYears} 
                           onChange={(e) => setCalcYears(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>

                     <div className="pt-4 border-t mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Invested Amount</span>
                           <span className="font-medium">₹{calcInvested.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Est. Returns</span>
                           <span className="font-medium text-emerald-500">₹{Math.round(calcEstimatedReturns).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2">
                           <span>Total Value</span>
                           <span className="text-primary">₹{Math.round(calcTotalValue).toLocaleString()}</span>
                        </div>
                     </div>
                   </>
                 )}

                 {calcMode === 'SWP' && (
                   <>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Total Investment</span>
                           <span className="text-primary font-bold">₹{swpInvested.toLocaleString()}</span>
                        </label>
                        <input 
                           type="range" 
                           min="10000" max="10000000" step="10000" 
                           value={swpInvested} 
                           onChange={(e) => setSwpInvested(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Monthly Withdrawal</span>
                           <span className="text-primary font-bold">₹{swpWithdrawal.toLocaleString()}</span>
                        </label>
                        <input 
                           type="range" 
                           min="500" max="200000" step="500" 
                           value={swpWithdrawal} 
                           onChange={(e) => setSwpWithdrawal(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Expected Return Rate</span>
                           <span className="text-primary font-bold">{swpRate}%</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="30" step="1" 
                           value={swpRate} 
                           onChange={(e) => setSwpRate(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Time Period (Years)</span>
                           <span className="text-primary font-bold">{swpYears} Yr</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="45" step="1" 
                           value={swpYears} 
                           onChange={(e) => setSwpYears(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>

                     <div className="pt-4 border-t mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Invested Amount</span>
                           <span className="font-medium">₹{swpInvested.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Total Withdrawal</span>
                           <span className="font-medium text-emerald-500">₹{swpTotalWithdrawals.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2">
                           <span>Final Balance</span>
                           <span className="text-primary">₹{Math.round(swpFinalValue).toLocaleString()}</span>
                        </div>
                     </div>
                   </>
                 )}

                 {calcMode === 'Inflation' && (
                   <>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Current Cost</span>
                           <span className="text-primary font-bold">₹{infCost.toLocaleString()}</span>
                        </label>
                        <input 
                           type="range" 
                           min="1000" max="10000000" step="1000" 
                           value={infCost} 
                           onChange={(e) => setInfCost(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Inflation Rate</span>
                           <span className="text-primary font-bold">{infRate}%</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="25" step="1" 
                           value={infRate} 
                           onChange={(e) => setInfRate(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Time Period (Years)</span>
                           <span className="text-primary font-bold">{infYears} Yr</span>
                        </label>
                        <input 
                           type="range" 
                           min="1" max="40" step="1" 
                           value={infYears} 
                           onChange={(e) => setInfYears(Number(e.target.value))}
                           className="w-full accent-primary" 
                        />
                     </div>

                     <div className="pt-4 border-t mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Current Cost</span>
                           <span className="font-medium">₹{infCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">Cost Increase</span>
                           <span className="font-medium text-destructive">₹{Math.round(infCostIncrease).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2">
                           <span>Future Cost</span>
                           <span className="text-primary">₹{Math.round(infFutureCost).toLocaleString()}</span>
                        </div>
                     </div>
                   </>
                 )}
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Add SIP Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
               <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle>Create New SIP</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
                     <X className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleAddSIP} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Asset Name</label>
                        <input 
                           required 
                           list="holdings-list"
                           value={name} 
                           onChange={e => {
                              const val = e.target.value;
                              setName(val);
                              // Auto-fill symbol and type if it matches an existing holding
                              const match = holdings.find(h => h.name === val);
                              if (match) {
                                 setSymbol(match.symbol);
                                 setType(match.type);
                              }
                           }} 
                           placeholder="e.g. S&P 500 Index" 
                           className="w-full rounded-md border py-2 px-3 bg-background" 
                        />
                        <datalist id="holdings-list">
                           {holdings.map((h, i) => (
                              <option key={i} value={h.name} />
                           ))}
                        </datalist>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
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
                        <div>
                           <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                           <input required type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500" className="w-full rounded-md border py-2 px-3 bg-background" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium mb-1">Frequency</label>
                           <select required value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full rounded-md border py-2 px-3 bg-background">
                              <option>Daily</option>
                              <option>Weekly</option>
                              <option>Monthly</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">
                              {frequency === 'Weekly' ? 'Deduction Day' : frequency === 'Daily' ? 'Deduction Schedule' : 'Deduction Date (1-31)'}
                           </label>
                           {frequency === 'Weekly' ? (
                              <select required value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full rounded-md border py-2 px-3 bg-background">
                                 <option value="">Select a day...</option>
                                 <option>Monday</option>
                                 <option>Tuesday</option>
                                 <option>Wednesday</option>
                                 <option>Thursday</option>
                                 <option>Friday</option>
                              </select>
                           ) : frequency === 'Daily' ? (
                              <input type="text" disabled value="Everyday" className="w-full rounded-md border py-2 px-3 bg-background opacity-50" />
                           ) : (
                              <input required type="number" min="1" max="31" placeholder="e.g. 5" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full rounded-md border py-2 px-3 bg-background" />
                           )}
                        </div>
                     </div>
                     <div className="pt-4">
                        <Button type="submit" className="w-full">Save SIP Plan</Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  )
}
