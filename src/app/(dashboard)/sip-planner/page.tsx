"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Calculator, Pencil } from "lucide-react"

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

function CalcInput({ 
  value, 
  onChange, 
  prefix = "", 
  suffix = "", 
  className = "w-16" 
}: { 
  value: number; 
  onChange: (v: number) => void; 
  prefix?: string; 
  suffix?: string;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (Number(localValue) !== value) {
      setLocalValue(value.toString());
    }
  }, [value]);

  return (
    <div className="flex items-center text-primary font-bold">
      {prefix && <span className="pointer-events-none text-xs">{prefix}</span>}
      <input 
        type="number" 
        value={localValue} 
        onChange={(e) => {
          const val = e.target.value;
          setLocalValue(val);
          const num = parseFloat(val);
          if (!isNaN(num)) {
            onChange(num);
          }
        }}
        onBlur={() => {
          setLocalValue(value.toString());
        }}
        className={`bg-transparent text-right font-bold focus:outline-none border-b border-transparent hover:border-primary/30 focus:border-primary/60 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      />
      {suffix && <span className="ml-0.5 pointer-events-none text-xs">{suffix}</span>}
    </div>
  );
}

export default function SIPPlannerPage() {
  const [sips, setSips] = useState<SIP[]>([])
  const [holdings, setHoldings] = useState<{name: string, symbol: string, type: string}[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form State
  const [editingSipId, setEditingSipId] = useState<string | null>(null)
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
  const [dashboardYears, setDashboardYears] = useState(30)
  const [dashYearsInput, setDashYearsInput] = useState("30")
  const [dashboardRate, setDashboardRate] = useState(12)
  const [dashRateInput, setDashRateInput] = useState("12")

  // Multi-calculator States
  const [calcMode, setCalcMode] = useState<'SIP' | 'SWP' | 'Inflation' | 'Lumpsum'>('SIP')

  // SWP States
  const [swpInvested, setSwpInvested] = useState(1000000)
  const [swpWithdrawal, setSwpWithdrawal] = useState(10000)
  const [swpRate, setSwpRate] = useState(12)
  const [swpYears, setSwpYears] = useState(10)

  // Inflation States
  const [infCost, setInfCost] = useState(100000)
  const [infRate, setInfRate] = useState(6)
  const [infYears, setInfYears] = useState(10)

  // Lumpsum States
  const [lumpInvested, setLumpInvested] = useState(100000)
  const [lumpRate, setLumpRate] = useState(12)
  const [lumpYears, setLumpYears] = useState(10)

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

  const handleOpenAdd = () => {
     setEditingSipId(null)
     setName("")
     setSymbol("")
     setType("Equity")
     setAmount("")
     setFrequency("Monthly")
     setNextDate("")
     setIsModalOpen(true)
  }

  const handleOpenEdit = (sip: SIP) => {
     setEditingSipId(sip.id)
     setName(sip.name)
     setSymbol(sip.symbol)
     setType(sip.type)
     setAmount(sip.amount.toString())
     setFrequency(sip.frequency)
     
     // Parse the stored next_date back into raw value for the input
     if (sip.frequency === 'Daily') {
        setNextDate("Everyday")
     } else if (sip.frequency === 'Weekly') {
        const d = new Date(sip.next_date)
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        setNextDate(days[d.getDay()])
     } else {
        const d = new Date(sip.next_date)
        setNextDate(d.getDate().toString())
     }
     
     setIsModalOpen(true)
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

    const payload = {
      user_id: user.id,
      name,
      symbol,
      type,
      amount: parseFloat(amount),
      frequency,
      next_date: finalDate,
      status: 'Active'
    }

    let error;
    if (editingSipId) {
       const res = await supabase.from('sips').update(payload).eq('id', editingSipId)
       error = res.error
    } else {
       const res = await supabase.from('sips').insert([payload])
       error = res.error
    }

    if (!error) {
      setIsModalOpen(false)
      setEditingSipId(null)
      setName("")
      setSymbol("")
      setAmount("")
      setNextDate("")
      fetchSIPs()
    } else {
      alert("Failed to save SIP: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
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
      
      const rInvested = monthlyAmt * (dashboardYears * 12);
      const rTotal = monthlyAmt * ((Math.pow(1 + (dashboardRate/12/100), dashboardYears * 12) - 1) / (dashboardRate/12/100)) * (1 + (dashboardRate/12/100));
      const rReturns = rTotal - rInvested;
      return acc + rReturns;
    }, 0)

  const totalProjectedInvested = totalMonthlySIP * 12 * dashboardYears;

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

  // Lumpsum Calculations
  const lumpTotalValue = lumpInvested * Math.pow(1 + (lumpRate / 100), lumpYears);
  const lumpReturns = lumpTotalValue - lumpInvested;

  return (
    <div className="flex-1 space-y-4 relative w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
           <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 truncate">SIP Intelligence</h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 line-clamp-1 sm:line-clamp-none">Automate and simulate your wealth compounding velocity.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 hidden sm:flex shrink-0">
           <Plus className="h-4 w-4" /> New SIP
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 w-full min-w-0">
        <Card className="glass-panel overflow-hidden">
           <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <div className="text-sm font-medium text-muted-foreground mb-1">Total Monthly SIP</div>
                 <div className="text-4xl font-bold tracking-tight private-value">₹{totalMonthlySIP.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 px-3 py-2 rounded-lg border border-border/30 self-start md:self-center">
                 <div className="text-2xl font-bold text-foreground leading-none">{activeSipsCount}</div>
                 <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Active<br/>SIPs</div>
              </div>
           </CardContent>
        </Card>
        <Card className="glass-panel overflow-hidden">
           <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                 <div className="text-sm font-medium text-muted-foreground">Total Projected Returns ({dashboardYears}Y)</div>
                 <div className="flex flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border border-border/50">
                       <span className="text-[10px] text-muted-foreground font-medium">Target:</span>
                       <input 
                          type="number" 
                          value={dashYearsInput}
                          min={1}
                          max={50}
                          onChange={(e) => {
                             const v = e.target.value;
                             setDashYearsInput(v);
                             const num = parseInt(v, 10);
                             if (!isNaN(num)) setDashboardYears(num);
                          }}
                          className="w-8 bg-transparent font-bold text-primary text-xs text-center focus:outline-none border-b border-primary/30"
                       />
                       <span className="text-[10px] text-muted-foreground">Yrs</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border border-border/50">
                       <span className="text-[10px] text-muted-foreground font-medium">Rate:</span>
                       <input 
                          type="number" 
                          value={dashRateInput}
                          min={1}
                          max={40}
                          onChange={(e) => {
                             const v = e.target.value;
                             setDashRateInput(v);
                             const num = parseFloat(v);
                             if (!isNaN(num)) setDashboardRate(num);
                          }}
                          className="w-8 bg-transparent font-bold text-emerald-500 text-xs text-center focus:outline-none border-b border-emerald-500/30"
                       />
                       <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                 </div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-500 tracking-tight private-value">₹{Math.round(totalProjectedReturn).toLocaleString()}</div>
              <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground flex-wrap">
                 <span className="font-medium">Invested: <strong className="text-foreground private-value">₹{Math.round(totalProjectedInvested).toLocaleString()}</strong></span>
                 <span className="hidden sm:inline opacity-40">•</span>
                 <span>Est. gain at {dashboardRate}% p.a.</span>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 w-full min-w-0">
         {/* SIP Table (Takes up 2 columns) */}
         <div className="md:col-span-2 min-w-0">
            <Card className="h-full overflow-hidden">
               <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 gap-2 sm:gap-4 p-4 sm:p-6">
                  <div>
                     <CardTitle className="text-lg sm:text-xl">Your Scheduled SIPs</CardTitle>
                     <CardDescription className="text-xs sm:text-sm">Manage and track your recurring investments.</CardDescription>
                  </div>
               </CardHeader>
               <CardContent className="p-2 sm:p-6 pt-0">
                 {/* Desktop Table View */}
                 <div className="relative w-full overflow-x-auto hidden md:block no-scrollbar">
                   <table className="w-full caption-bottom text-sm">
                     <thead className="[&_tr]:border-b bg-muted/30">
                       <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted whitespace-nowrap">
                         <th className="h-10 px-1.5 lg:px-2 text-left align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Asset</th>
                         <th className="h-10 px-1.5 lg:px-2 text-left align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Freq.</th>
                         <th className="h-10 px-1.5 lg:px-2 text-right align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Amount</th>
                         <th className="h-10 px-1.5 lg:px-2 text-center align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Due</th>
                         <th className="h-10 px-1.5 lg:px-2 text-right align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Invested</th>
                         <th className="h-10 px-1.5 lg:px-2 text-right align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Projected</th>
                         <th className="h-10 px-1.5 lg:px-2 text-right align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Returns</th>
                         <th className="h-10 px-1.5 lg:px-2 text-right align-middle font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Act.</th>
                       </tr>
                     </thead>
                     <tbody className="[&_tr:last-child]:border-0">
                       {loading ? (
                          <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading SIPs...</td></tr>
                       ) : sips.length === 0 ? (
                          <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No SIPs found. Create one!</td></tr>
                       ) : sips.map((sip) => {
                         let monthlyAmt = sip.amount;
                         if (sip.frequency === 'Weekly') monthlyAmt *= 4;
                         if (sip.frequency === 'Daily') monthlyAmt *= 30;
                         
                         const rInvested = monthlyAmt * (dashboardYears * 12);
                         const rTotal = monthlyAmt * ((Math.pow(1 + (dashboardRate/12/100), dashboardYears * 12) - 1) / (dashboardRate/12/100)) * (1 + (dashboardRate/12/100));
                         const rReturns = rTotal - rInvested;

                         return (
                          <tr key={sip.id} className="border-b transition-colors hover:bg-muted/20 data-[state=selected]:bg-muted text-[13px] whitespace-nowrap">
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle font-semibold max-w-[110px] truncate text-foreground" title={sip.name}>
                               {sip.name} {sip.symbol && <span className="text-[10px] text-muted-foreground font-normal ml-0.5 hidden xl:inline">({sip.symbol})</span>}
                            </td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-[11px]">
                               <span className="px-1 py-0.5 bg-secondary/50 text-muted-foreground rounded border border-border/20 font-medium">{sip.frequency}</span>
                            </td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-right font-medium private-value">₹{sip.amount.toLocaleString()}</td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-center text-muted-foreground text-[11px]">
                               {sip.frequency === 'Daily' ? 'Daily' : 
                                sip.frequency === 'Weekly' ? `${new Date(sip.next_date).toLocaleDateString('en-US', {weekday: 'short'})}` : 
                                `${new Date(sip.next_date).getDate()}`}
                            </td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-right font-medium text-foreground/70 private-value">₹{Math.round(rInvested).toLocaleString()}</td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-right text-primary font-bold private-value">₹{Math.round(rTotal).toLocaleString()}</td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-right text-emerald-500 font-bold private-value">+₹{Math.round(rReturns).toLocaleString()}</td>
                            <td className="py-2.5 px-1.5 lg:px-2 align-middle text-right flex items-center justify-end gap-1">
                               <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(sip)} className="h-6 w-6 text-primary hover:bg-primary/10 transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDelete(sip.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                            </td>
                          </tr>
                       )})}
                     </tbody>
                   </table>
                 </div>

                 {/* Mobile List View for SIPs */}
                 <div className="md:hidden divide-y divide-border/40 -mx-2 sm:mx-0">
                    {loading ? (
                       <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : sips.length === 0 ? (
                       <div className="p-6 text-center text-sm text-muted-foreground">No active SIPs scheduled.</div>
                    ) : sips.map((sip) => {
                       let monthlyAmt = sip.amount;
                       if (sip.frequency === 'Weekly') monthlyAmt *= 4;
                       if (sip.frequency === 'Daily') monthlyAmt *= 30;
                       
                       const rInvested = monthlyAmt * (dashboardYears * 12);
                       const rTotal = monthlyAmt * ((Math.pow(1 + (dashboardRate/12/100), dashboardYears * 12) - 1) / (dashboardRate/12/100)) * (1 + (dashboardRate/12/100));
                       const rReturns = rTotal - rInvested;

                       return (
                          <div key={sip.id} className="p-3 flex flex-col gap-2.5 active:bg-muted/50 transition-colors">
                              <div className="flex justify-between items-start min-w-0">
                                 <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="font-bold text-[13px] sm:text-[14px] text-foreground truncate">{sip.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                       <span className="text-[9px] px-1 bg-secondary/80 text-muted-foreground rounded font-medium uppercase">{sip.frequency}</span>
                                       <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 truncate">
                                          Due: {sip.frequency === 'Daily' ? 'Daily' : 
                                                sip.frequency === 'Weekly' ? `${new Date(sip.next_date).toLocaleDateString('en-US', {weekday: 'short'})}` : 
                                                `Day ${new Date(sip.next_date).getDate()}`}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="text-right flex items-center gap-1.5 shrink-0">
                                    <div className="font-extrabold text-[13px] sm:text-sm private-value">₹{sip.amount.toLocaleString()}</div>
                                    <div className="flex gap-0.5">
                                       <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(sip)} className="h-7 w-7 text-primary active:bg-primary/10">
                                          <Pencil className="h-3.5 w-3.5" />
                                       </Button>
                                       <Button variant="ghost" size="icon" onClick={() => handleDelete(sip.id)} className="h-7 w-7 text-destructive active:bg-destructive/10">
                                          <Trash2 className="h-3.5 w-3.5" />
                                       </Button>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1.5 bg-muted/30 rounded-lg p-2 border border-border/40">
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium truncate">Invested</span>
                                    <span className="text-[11px] sm:text-[12px] font-bold text-foreground/80 private-value truncate" title={Math.round(rInvested).toLocaleString()}>₹{Math.round(rInvested).toLocaleString()}</span>
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium truncate">Projected</span>
                                    <span className="text-[11px] sm:text-[12px] font-bold text-primary private-value truncate" title={Math.round(rTotal).toLocaleString()}>₹{Math.round(rTotal).toLocaleString()}</span>
                                 </div>
                                 <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium truncate">Returns</span>
                                    <span className="text-[11px] sm:text-[12px] font-bold text-emerald-500 private-value truncate" title={Math.round(rReturns).toLocaleString()}>+₹{Math.round(rReturns).toLocaleString()}</span>
                                 </div>
                              </div>
                           </div>
                       )
                    })}
                 </div>
              </CardContent>
            </Card>
         </div>

         {/* Quick Calculator Column */}
         <div className="min-w-0">
            <Card className="h-full border-primary/20 bg-primary/5 overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle className="flex flex-wrap items-center justify-between text-primary gap-2">
                     <div className="flex items-center gap-1.5">
                        <Calculator className="h-5 w-5 shrink-0" />
                        <span className="text-base font-bold">
                          {calcMode === 'SIP' ? 'SIP Calc' : calcMode === 'SWP' ? 'SWP Calc' : calcMode === 'Lumpsum' ? 'Lumpsum' : 'Inflation'}
                        </span>
                     </div>
                     <div className="flex gap-0.5 border rounded-lg p-0.5 bg-background text-foreground shrink-0">
                        <button 
                          onClick={() => setCalcMode('SIP')} 
                          className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded transition-all ${calcMode === 'SIP' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          SIP
                        </button>
                        <button 
                          onClick={() => setCalcMode('Lumpsum')} 
                          className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded transition-all ${calcMode === 'Lumpsum' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          LMP
                        </button>
                        <button 
                          onClick={() => setCalcMode('SWP')} 
                          className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded transition-all ${calcMode === 'SWP' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          SWP
                        </button>
                        <button 
                          onClick={() => setCalcMode('Inflation')} 
                          className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded transition-all ${calcMode === 'Inflation' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          INF
                        </button>
                     </div>
                  </CardTitle>
                  <CardDescription className="text-xs">
                     {calcMode === 'SIP' ? 'Future wealth estimator' : calcMode === 'Lumpsum' ? 'One-time wealth growth' : calcMode === 'SWP' ? 'Withdrawal plan calculator' : 'Future cost calculator'}
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                 {calcMode === 'SIP' && (
                   <>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Monthly Investment</span>
                           <CalcInput value={calcAmount} onChange={setCalcAmount} prefix="₹" className="w-20 text-xs" />
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
                           <CalcInput value={calcRate} onChange={setCalcRate} suffix="%" className="w-8 text-xs" />
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
                           <CalcInput value={calcYears} onChange={setCalcYears} suffix=" Yr" className="w-10 text-xs" />
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

                  {calcMode === 'Lumpsum' && (
                    <>
                      <div>
                         <label className="flex justify-between text-xs font-medium mb-1">
                            <span>One-time Investment</span>
                            <CalcInput value={lumpInvested} onChange={setLumpInvested} prefix="₹" className="w-24 text-xs" />
                         </label>
                         <input 
                            type="range" 
                            min="1000" max="5000000" step="1000" 
                            value={lumpInvested} 
                            onChange={(e) => setLumpInvested(Number(e.target.value))}
                            className="w-full accent-primary" 
                         />
                      </div>
                      <div>
                         <label className="flex justify-between text-xs font-medium mb-1">
                            <span>Expected Return Rate</span>
                            <CalcInput value={lumpRate} onChange={setLumpRate} suffix="%" className="w-8 text-xs" />
                         </label>
                         <input 
                            type="range" 
                            min="1" max="30" step="1" 
                            value={lumpRate} 
                            onChange={(e) => setLumpRate(Number(e.target.value))}
                            className="w-full accent-primary" 
                         />
                      </div>
                      <div>
                         <label className="flex justify-between text-xs font-medium mb-1">
                            <span>Time Period (Years)</span>
                            <CalcInput value={lumpYears} onChange={setLumpYears} suffix=" Yr" className="w-10 text-xs" />
                         </label>
                         <input 
                            type="range" 
                            min="1" max="40" step="1" 
                            value={lumpYears} 
                            onChange={(e) => setLumpYears(Number(e.target.value))}
                            className="w-full accent-primary" 
                         />
                      </div>

                      <div className="pt-4 border-t mt-4 space-y-1.5">
                         <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Invested Amount</span>
                            <span className="font-medium">₹{lumpInvested.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Est. Returns</span>
                            <span className="font-medium text-emerald-500">₹{Math.round(lumpReturns).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between font-bold text-base pt-2">
                            <span>Total Value</span>
                            <span className="text-primary">₹{Math.round(lumpTotalValue).toLocaleString()}</span>
                         </div>
                      </div>
                    </>
                  )}

                 {calcMode === 'SWP' && (
                   <>
                     <div>
                        <label className="flex justify-between text-xs font-medium mb-1">
                           <span>Total Investment</span>
                           <CalcInput value={swpInvested} onChange={setSwpInvested} prefix="₹" className="w-24 text-xs" />
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
                           <CalcInput value={swpWithdrawal} onChange={setSwpWithdrawal} prefix="₹" className="w-20 text-xs" />
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
                           <CalcInput value={swpRate} onChange={setSwpRate} suffix="%" className="w-8 text-xs" />
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
                           <CalcInput value={swpYears} onChange={setSwpYears} suffix=" Yr" className="w-10 text-xs" />
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
                           <CalcInput value={infCost} onChange={setInfCost} prefix="₹" className="w-24 text-xs" />
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
                           <CalcInput value={infRate} onChange={setInfRate} suffix="%" className="w-8 text-xs" />
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
                           <CalcInput value={infYears} onChange={setInfYears} suffix=" Yr" className="w-10 text-xs" />
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
                  <CardTitle>{editingSipId ? 'Update SIP Plan' : 'Create New SIP'}</CardTitle>
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
                        <Button type="submit" className="w-full">
                           {editingSipId ? 'Update SIP Plan' : 'Save SIP Plan'}
                        </Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
      {/* Mobile Floating Action Button for New SIP */}
      <button 
         onClick={handleOpenAdd}
         className="md:hidden fixed bottom-[72px] right-4 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-900/30 flex items-center justify-center z-40 active:scale-95 transition-transform border border-emerald-400/20 hover:bg-emerald-500"
         aria-label="Add SIP"
      >
         <Plus className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
