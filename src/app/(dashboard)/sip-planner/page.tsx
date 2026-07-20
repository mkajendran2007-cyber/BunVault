"use client"

import { useState, useEffect, Suspense } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Calculator, Pencil, Sparkles, Trophy, TrendingUp, Layers, CheckCircle2, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

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
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    if (Number(localValue) !== value) {
      setLocalValue(value.toString())
    }
  }, [value])

  return (
    <div className="flex items-center font-mono font-bold text-foreground bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-border/40 text-xs">
      {prefix && <span className="pointer-events-none text-muted-foreground mr-0.5">{prefix}</span>}
      <input 
        type="number" 
        value={localValue} 
        onChange={(e) => {
          const val = e.target.value
          setLocalValue(val)
          const num = parseFloat(val)
          if (!isNaN(num)) {
            onChange(num)
          }
        }}
        onBlur={() => {
          setLocalValue(value.toString())
        }}
        className={`bg-transparent text-right font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      />
      {suffix && <span className="ml-0.5 pointer-events-none text-muted-foreground">{suffix}</span>}
    </div>
  )
}

function SIPPlannerContent() {
  const [mounted, setMounted] = useState(false)
  const [sips, setSips] = useState<SIP[]>([])
  const [holdings, setHoldings] = useState<{name: string, symbol: string, type: string}[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Form State
  const [editingSipId, setEditingSipId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("Equity")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("Monthly")
  const [nextDate, setNextDate] = useState("")

  // Calculator State
  const [calcAmount, setCalcAmount] = useState(10000)
  const [calcRate, setCalcRate] = useState(14)
  const [calcYears, setCalcYears] = useState(15)
  const [dashboardYears, setDashboardYears] = useState(25)
  const [dashYearsInput, setDashYearsInput] = useState("25")
  const [dashboardRate, setDashboardRate] = useState(14)
  const [dashRateInput, setDashRateInput] = useState("14")

  // Multi-calculator States
  const [calcMode, setCalcMode] = useState<'SIP' | 'SWP' | 'Inflation' | 'Lumpsum'>('SIP')

  // SWP States
  const [swpInvested, setSwpInvested] = useState(2500000)
  const [swpWithdrawal, setSwpWithdrawal] = useState(20000)
  const [swpRate, setSwpRate] = useState(12)
  const [swpYears, setSwpYears] = useState(20)

  // Inflation States
  const [infCost, setInfCost] = useState(2000000)
  const [infRate, setInfRate] = useState(6)
  const [infYears, setInfYears] = useState(15)

  // Lumpsum States
  const [lumpInvested, setLumpInvested] = useState(500000)
  const [lumpRate, setLumpRate] = useState(14)
  const [lumpYears, setLumpYears] = useState(15)

  useEffect(() => {
    fetchSIPs()
  }, [])

  const triggerConfetti = () => {
    confetti({
       particleCount: 110,
       spread: 75,
       origin: { y: 0.65 },
       colors: ['#F4C542', '#00E676', '#3B82F6', '#EC4899']
    })
    toast.success("🎉 Wealth Multiplier Celebration Triggered!")
  }

  const fetchSIPs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Demo institutional SIPs
      const demoSips: SIP[] = [
        { id: 'demo-s1', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', amount: 25000, frequency: 'Monthly', next_date: '2026-08-05', status: 'Active' },
        { id: 'demo-s2', name: 'TATA Consultancy Services Accumulation', symbol: 'TCS.NS', type: 'Equity', amount: 15000, frequency: 'Monthly', next_date: '2026-08-10', status: 'Active' },
        { id: 'demo-s3', name: 'Sovereign Gold Bond Tranche SIP', symbol: 'GOLD_INR_1G', type: 'Commodity', amount: 10000, frequency: 'Monthly', next_date: '2026-08-15', status: 'Active' },
        { id: 'demo-s4', name: 'Bitcoin Secure DCA', symbol: 'BTC-INR', type: 'Crypto', amount: 2000, frequency: 'Weekly', next_date: '2026-07-20', status: 'Active' }
      ]
      setSips(demoSips)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('sips')
      .select('*')
      .eq('user_id', user.id)
      .order('next_date', { ascending: true })

    const { data: holdingsData } = await supabase
      .from('holdings')
      .select('name, symbol, type')
      .eq('user_id', user.id)

    if (error || !data || data.length === 0) {
      if (!data || data.length === 0) {
         const demoSips: SIP[] = [
           { id: 'demo-s1', name: 'Nippon India Small Cap Growth', symbol: '122639', type: 'Mutual Fund', amount: 25000, frequency: 'Monthly', next_date: '2026-08-05', status: 'Active' },
           { id: 'demo-s2', name: 'TATA Consultancy Services Accumulation', symbol: 'TCS.NS', type: 'Equity', amount: 15000, frequency: 'Monthly', next_date: '2026-08-10', status: 'Active' }
         ]
         setSips(demoSips)
      }
      setLoading(false)
      return
    }

    setSips(data || [])
    if (holdingsData) {
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
     
     if (sip.frequency === 'Daily') {
        setNextDate("Everyday")
     } else if (sip.frequency === 'Weekly') {
        const d = new Date(sip.next_date)
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        setNextDate(days[d.getDay()] || "Monday")
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
       const demoNew: SIP = {
          id: `demo-sip-${Date.now()}`,
          name: name || "Custom SIP Investment",
          symbol: symbol || "CUSTOM",
          type,
          amount: parseFloat(amount || "10000"),
          frequency,
          next_date: '2026-08-01',
          status: 'Active'
       }
       setSips(prev => [demoNew, ...prev])
       setIsModalOpen(false)
       triggerConfetti()
       window.dispatchEvent(new CustomEvent('bun-notify', {
          detail: {
             title: "🚀 Automated SIP Deployed",
             message: `New recurring investment of ₹${amount} (${frequency}) locked into portfolio trajectory!`,
             type: "success"
          }
       }))
       return
    }

    let finalDate = nextDate
    const now = new Date()
    if (frequency === 'Daily') {
      now.setDate(now.getDate() + 1)
      finalDate = now.toISOString().split('T')[0]
    } else if (frequency === 'Monthly') {
      const d = parseInt(nextDate) || 1
      let target = new Date(now.getFullYear(), now.getMonth(), d)
      if (target <= now) target.setMonth(target.getMonth() + 1)
      finalDate = target.toISOString().split('T')[0]
    } else if (frequency === 'Weekly') {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const targetDay = days.indexOf(nextDate)
      let diff = targetDay - now.getDay()
      if (diff <= 0) diff += 7
      now.setDate(now.getDate() + diff)
      finalDate = now.toISOString().split('T')[0]
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

    let error
    if (editingSipId && !editingSipId.startsWith('demo-')) {
       const res = await supabase.from('sips').update(payload).eq('id', editingSipId)
       error = res.error
    } else if (!editingSipId) {
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
      triggerConfetti()
      fetchSIPs()
    } else {
      toast.error("Failed to save SIP: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !id.startsWith('demo-')) {
       await supabase.from('sips').delete().eq('id', id)
       fetchSIPs()
    } else {
       setSips(prev => prev.filter(s => s.id !== id))
    }
    toast.success("SIP schedule canceled")
  }

  const totalMonthlySIP = sips
    .filter(s => s.status === 'Active')
    .reduce((acc, curr) => {
      let val = curr.amount
      if (curr.frequency === 'Weekly') val = curr.amount * 4
      if (curr.frequency === 'Daily') val = curr.amount * 30
      return acc + val
    }, 0)

  const activeSipsCount = sips.filter(s => s.status === 'Active').length

  const totalProjectedReturn = sips
    .filter(s => s.status === 'Active')
    .reduce((acc, curr) => {
      let monthlyAmt = curr.amount
      if (curr.frequency === 'Weekly') monthlyAmt *= 4
      if (curr.frequency === 'Daily') monthlyAmt *= 30
      
      const rInvested = monthlyAmt * (dashboardYears * 12)
      const rTotal = monthlyAmt * ((Math.pow(1 + (dashboardRate/12/100), dashboardYears * 12) - 1) / (dashboardRate/12/100)) * (1 + (dashboardRate/12/100))
      const rReturns = rTotal - rInvested
      return acc + rReturns
    }, 0)

  const totalProjectedInvested = totalMonthlySIP * 12 * dashboardYears

  // Calculate SIP Returns
  const i = calcRate / 12 / 100
  const n = calcYears * 12
  const calcInvested = calcAmount * n
  const calcTotalValue = calcAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
  const calcEstimatedReturns = calcTotalValue - calcInvested

  // SWP Calculations
  const swpTotalWithdrawals = swpWithdrawal * swpYears * 12
  let swpFinalValue = swpInvested
  const swpMonthlyRate = swpRate / 12 / 100
  for (let month = 0; month < swpYears * 12; month++) {
    swpFinalValue = swpFinalValue * (1 + swpMonthlyRate) - swpWithdrawal
    if (swpFinalValue < 0) {
      swpFinalValue = 0
      break
    }
  }

  // Inflation Calculations
  const infFutureCost = infCost * Math.pow(1 + infRate / 100, infYears)
  const infCostIncrease = infFutureCost - infCost

  // Lumpsum Calculations
  const lumpTotalValue = lumpInvested * Math.pow(1 + (lumpRate / 100), lumpYears)
  const lumpReturns = lumpTotalValue - lumpInvested

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">INITIALIZING SIP ENGINE...</span>
          <p className="text-[11px] font-mono text-slate-500">Syncing compound velocity & wealth projection curves</p>
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
               <Calculator className="h-3.5 w-3.5" /> Compound Velocity Engine & SIP Terminal
             </span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-mono">
             SIP & Wealth Multiplier
           </h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
             Automate active recurring investment streams, model multi-decade compound returns, and trigger milestone celebrations.
           </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
           <Button onClick={triggerConfetti} variant="outline" className="h-11 px-4 rounded-xl border-[#F4C542]/50 text-[#F4C542] hover:bg-[#F4C542]/10 font-bold text-xs gap-1.5">
              <Sparkles className="h-4 w-4 fill-[#F4C542]" /> Test Celebration
           </Button>
           <Button onClick={handleOpenAdd} className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/20 text-xs flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2 stroke-[3]" /> + Deploy New SIP
           </Button>
        </div>
      </div>

      {/* 2. COMPOUND VELOCITY PILLARS */}
      <div className="grid gap-6 md:grid-cols-2 w-full min-w-0">
        <Card className="glass-panel p-6 rounded-2xl border border-border/40 relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                 <span className="text-[11px] font-bold uppercase tracking-widest text-[#F4C542]">Monthly Automated Deployment</span>
                 <div className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight">
                    ₹{totalMonthlySIP.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </div>
                 <p className="text-xs text-muted-foreground font-semibold pt-1">Recurring investment cash flow across {activeSipsCount} active streams</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#151A21] px-5 py-3.5 rounded-2xl border border-border/60 shadow-inner self-start sm:self-center shrink-0">
                 <div className="text-3xl font-bold font-mono text-[#00E676]">{activeSipsCount}</div>
                 <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Active<br/>Streams</div>
              </div>
           </div>
        </Card>

        <Card className="glass-panel p-6 rounded-2xl border border-[#00E676]/30 bg-[#00E676]/5 relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00E676]" />
           <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
              <div>
                 <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E676]">Projected Compound Wealth ({dashboardYears}Y)</span>
                 <div className="text-3xl sm:text-4xl font-bold font-mono text-[#00E676] tracking-tight mt-1">
                    ₹{fmtINR(Math.round(totalProjectedReturn + totalProjectedInvested))}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#151A21] rounded-xl px-2.5 py-1 border border-border/50 text-xs font-bold">
                    <span className="text-muted-foreground text-[10px]">Horizon:</span>
                    <input 
                       type="number" 
                       value={dashYearsInput}
                       min={1}
                       max={50}
                       onChange={(e) => {
                          const v = e.target.value
                          setDashYearsInput(v)
                          const num = parseInt(v, 10)
                          if (!isNaN(num)) setDashboardYears(num)
                       }}
                       className="w-8 bg-transparent font-mono font-bold text-[#F4C542] text-center focus:outline-none border-b border-[#F4C542]"
                    />
                    <span className="text-[10px] text-muted-foreground">Yrs</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#151A21] rounded-xl px-2.5 py-1 border border-border/50 text-xs font-bold">
                    <span className="text-muted-foreground text-[10px]">CAGR:</span>
                    <input 
                       type="number" 
                       value={dashRateInput}
                       min={1}
                       max={40}
                       onChange={(e) => {
                          const v = e.target.value
                          setDashRateInput(v)
                          const num = parseFloat(v)
                          if (!isNaN(num)) setDashboardRate(num)
                       }}
                       className="w-8 bg-transparent font-mono font-bold text-[#00E676] text-center focus:outline-none border-b border-[#00E676]"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground border-t border-border/30 pt-3 flex-wrap">
              <span>Invested Principal: <strong className="font-mono text-foreground">₹{fmtINR(Math.round(totalProjectedInvested))}</strong></span>
              <span className="opacity-40">•</span>
              <span>Estimated Compound Gain: <strong className="font-mono text-[#00E676]">+₹{fmtINR(Math.round(totalProjectedReturn))}</strong></span>
           </div>
        </Card>
      </div>

      {/* 3. MULTI-CALCULATOR STUDIO & SCHEDULED SIPS LEDGER */}
      <div className="grid gap-6 md:grid-cols-3 w-full min-w-0">
         {/* SIP Table (2 Columns) */}
         <div className="md:col-span-2 min-w-0">
            <Card className="glass-panel border-[#E8EAF0] dark:border-[#262626] shadow-xl h-full overflow-hidden flex flex-col">
               <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="text-xl font-bold text-foreground">Active SIP Ledger</CardTitle>
                     <CardDescription className="text-xs font-semibold">Scheduled investment deductions and progress tracking.</CardDescription>
                  </div>
                  <span className="badge-wealth text-xs">{sips.length} Streams</span>
               </CardHeader>
               <CardContent className="p-0 flex-1">
                  <div className="overflow-x-auto no-scrollbar">
                     <table className="w-full text-left text-xs table-auto">
                        <thead className="bg-slate-100 dark:bg-[#151A21] font-bold uppercase text-muted-foreground border-b border-[#E8EAF0] dark:border-[#262626] h-12">
                           <tr className="whitespace-nowrap">
                              <th className="px-5 text-left">Fund / Asset Name</th>
                              <th className="px-3 text-left">Freq</th>
                              <th className="px-3 text-right">Deduction (₹)</th>
                              <th className="px-3 text-center">Next Cycle Due</th>
                              <th className="px-3 text-right">Invested Principal</th>
                              <th className="px-3 text-right">Est Total ({dashboardYears}Y)</th>
                              <th className="px-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 font-semibold">
                           {loading ? (
                              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground font-bold">Syncing recurring wealth streams...</td></tr>
                           ) : sips.length === 0 ? (
                              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-bold">No active SIPs scheduled. Click "+ Deploy New SIP" to automate wealth generation!</td></tr>
                           ) : sips.map(sip => {
                              let monthlyAmt = sip.amount
                              if (sip.frequency === 'Weekly') monthlyAmt *= 4
                              if (sip.frequency === 'Daily') monthlyAmt *= 30
                              
                              const rInvested = monthlyAmt * (dashboardYears * 12)
                              const rTotal = monthlyAmt * ((Math.pow(1 + (dashboardRate/12/100), dashboardYears * 12) - 1) / (dashboardRate/12/100)) * (1 + (dashboardRate/12/100))
                              const rReturns = rTotal - rInvested

                              return (
                                 <tr key={sip.id} className="hover:bg-slate-50 dark:hover:bg-[#151A21]/50 transition-colors whitespace-nowrap group">
                                    <td className="p-4 px-5 font-bold text-foreground min-w-[200px]">
                                       <div className="text-sm font-bold">{sip.name}</div>
                                       <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{sip.symbol || 'SIP'}</div>
                                    </td>
                                    <td className="p-4 px-3">
                                       <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700">
                                          {sip.frequency}
                                       </span>
                                    </td>
                                    <td className="p-4 px-3 text-right font-mono font-bold text-foreground text-sm">
                                       ₹{fmtINR(sip.amount)}
                                    </td>
                                    <td className="p-4 px-3 text-center text-xs font-bold text-muted-foreground">
                                       {sip.frequency === 'Daily' ? 'Everyday' : 
                                        sip.frequency === 'Weekly' ? new Date(sip.next_date).toLocaleDateString('en-US', {weekday: 'short'}) : 
                                        new Date(sip.next_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                                    </td>
                                    <td className="p-4 px-3 text-right font-mono text-muted-foreground">
                                       ₹{fmtINR(Math.round(rInvested))}
                                    </td>
                                    <td className="p-4 px-3 text-right font-mono font-bold text-[#00E676] text-sm">
                                       ₹{fmtINR(Math.round(rTotal))}
                                    </td>
                                    <td className="p-4 px-4 text-right">
                                       <div className="flex items-center justify-end gap-1.5">
                                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(sip)} className="h-7 w-7 text-[#F4C542] hover:bg-[#F4C542]/10 rounded-lg">
                                             <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => handleDelete(sip.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg">
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
         </div>

         {/* Multi-Calculator Column (1 Column) */}
         <div className="min-w-0">
            <Card className="glass-panel border-[#F4C542]/40 shadow-2xl overflow-hidden h-full flex flex-col justify-between">
               <CardHeader className="p-6 border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-[#F4C542]" />
                        {calcMode === 'SIP' ? 'SIP Multiplier' : calcMode === 'SWP' ? 'SWP Pension' : calcMode === 'Lumpsum' ? 'Lumpsum Growth' : 'Inflation Shield'}
                     </CardTitle>
                     <div className="flex bg-slate-100 dark:bg-[#151A21] p-1 rounded-xl border border-border/40 text-[10px] font-bold">
                        {(['SIP', 'Lumpsum', 'SWP', 'Inflation'] as const).map(m => (
                           <button
                              key={m}
                              onClick={() => setCalcMode(m)}
                              className={`px-2 py-1 rounded-lg transition-all ${calcMode === m ? 'gold-gradient-bg text-slate-950 shadow' : 'text-muted-foreground hover:text-foreground'}`}
                           >
                              {m === 'Lumpsum' ? 'LMP' : m === 'Inflation' ? 'INF' : m}
                           </button>
                        ))}
                     </div>
                  </div>
                  <CardDescription className="text-xs font-semibold">
                     {calcMode === 'SIP' ? 'Model recurring compound growth.' : calcMode === 'Lumpsum' ? 'Simulate one-time capital doubling.' : calcMode === 'SWP' ? 'Calculate monthly withdrawal run-rate.' : 'Estimate future cost inflation impact.'}
                  </CardDescription>
               </CardHeader>
               <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  {calcMode === 'SIP' && (
                     <>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Monthly Investment</span>
                                 <CalcInput value={calcAmount} onChange={setCalcAmount} prefix="₹" className="w-20" />
                              </div>
                              <input type="range" min="1000" max="150000" step="1000" value={calcAmount} onChange={e => setCalcAmount(Number(e.target.value))} className="w-full accent-[#F4C542]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Expected Return Rate (CAGR)</span>
                                 <CalcInput value={calcRate} onChange={setCalcRate} suffix="%" className="w-10" />
                              </div>
                              <input type="range" min="1" max="30" step="0.5" value={calcRate} onChange={e => setCalcRate(Number(e.target.value))} className="w-full accent-[#00E676]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Time Horizon (Years)</span>
                                 <CalcInput value={calcYears} onChange={setCalcYears} suffix=" Yrs" className="w-12" />
                              </div>
                              <input type="range" min="1" max="40" step="1" value={calcYears} onChange={e => setCalcYears(Number(e.target.value))} className="w-full accent-[#3B82F6]" />
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-2 mt-4">
                           <div className="flex justify-between text-xs font-bold text-muted-foreground">
                              <span>Invested Principal</span>
                              <span className="font-mono text-foreground">₹{fmtINR(calcInvested)}</span>
                           </div>
                           <div className="flex justify-between text-xs font-bold text-[#00E676]">
                              <span>Compound Returns</span>
                              <span className="font-mono">+₹{fmtINR(Math.round(calcEstimatedReturns))}</span>
                           </div>
                           <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                              <span className="text-xs font-bold uppercase text-foreground">Total Maturity Value</span>
                              <span className="text-xl font-bold font-mono text-[#F4C542]">₹{fmtINR(Math.round(calcTotalValue))}</span>
                           </div>
                        </div>
                     </>
                  )}

                  {calcMode === 'Lumpsum' && (
                     <>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>One-Time Capital Deployment</span>
                                 <CalcInput value={lumpInvested} onChange={setLumpInvested} prefix="₹" className="w-24" />
                              </div>
                              <input type="range" min="10000" max="5000000" step="10000" value={lumpInvested} onChange={e => setLumpInvested(Number(e.target.value))} className="w-full accent-[#F4C542]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Expected CAGR Rate</span>
                                 <CalcInput value={lumpRate} onChange={setLumpRate} suffix="%" className="w-10" />
                              </div>
                              <input type="range" min="1" max="30" step="0.5" value={lumpRate} onChange={e => setLumpRate(Number(e.target.value))} className="w-full accent-[#00E676]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Holding Period (Years)</span>
                                 <CalcInput value={lumpYears} onChange={setLumpYears} suffix=" Yrs" className="w-12" />
                              </div>
                              <input type="range" min="1" max="40" step="1" value={lumpYears} onChange={e => setLumpYears(Number(e.target.value))} className="w-full accent-[#3B82F6]" />
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-2 mt-4">
                           <div className="flex justify-between text-xs font-bold text-muted-foreground">
                              <span>Deployed Principal</span>
                              <span className="font-mono text-foreground">₹{fmtINR(lumpInvested)}</span>
                           </div>
                           <div className="flex justify-between text-xs font-bold text-[#00E676]">
                              <span>Total Capital Gain</span>
                              <span className="font-mono">+₹{fmtINR(Math.round(lumpReturns))}</span>
                           </div>
                           <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                              <span className="text-xs font-bold uppercase text-foreground">Projected Valuation</span>
                              <span className="text-xl font-bold font-mono text-[#F4C542]">₹{fmtINR(Math.round(lumpTotalValue))}</span>
                           </div>
                        </div>
                     </>
                  )}

                  {calcMode === 'SWP' && (
                     <>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Initial Corpus</span>
                                 <CalcInput value={swpInvested} onChange={setSwpInvested} prefix="₹" className="w-24" />
                              </div>
                              <input type="range" min="500000" max="20000000" step="50000" value={swpInvested} onChange={e => setSwpInvested(Number(e.target.value))} className="w-full accent-[#F4C542]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Monthly Pension Withdrawal</span>
                                 <CalcInput value={swpWithdrawal} onChange={setSwpWithdrawal} prefix="₹" className="w-20" />
                              </div>
                              <input type="range" min="5000" max="200000" step="2500" value={swpWithdrawal} onChange={e => setSwpWithdrawal(Number(e.target.value))} className="w-full accent-[#FF3B30]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Corpus Return Rate</span>
                                 <CalcInput value={swpRate} onChange={setSwpRate} suffix="%" className="w-10" />
                              </div>
                              <input type="range" min="1" max="20" step="0.5" value={swpRate} onChange={e => setSwpRate(Number(e.target.value))} className="w-full accent-[#00E676]" />
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-2 mt-4">
                           <div className="flex justify-between text-xs font-bold text-muted-foreground">
                              <span>Total Withdrawals ({swpYears}Y)</span>
                              <span className="font-mono text-[#00E676]">₹{fmtINR(swpTotalWithdrawals)}</span>
                           </div>
                           <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                              <span className="text-xs font-bold uppercase text-foreground">Remaining Corpus Balance</span>
                              <span className="text-xl font-bold font-mono text-[#F4C542]">₹{fmtINR(Math.round(swpFinalValue))}</span>
                           </div>
                        </div>
                     </>
                  )}

                  {calcMode === 'Inflation' && (
                     <>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Current Expense / Goal Cost</span>
                                 <CalcInput value={infCost} onChange={setInfCost} prefix="₹" className="w-24" />
                              </div>
                              <input type="range" min="100000" max="20000000" step="50000" value={infCost} onChange={e => setInfCost(Number(e.target.value))} className="w-full accent-[#F4C542]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Expected Inflation Rate</span>
                                 <CalcInput value={infRate} onChange={setInfRate} suffix="%" className="w-10" />
                              </div>
                              <input type="range" min="2" max="15" step="0.5" value={infRate} onChange={e => setInfRate(Number(e.target.value))} className="w-full accent-[#FF3B30]" />
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                 <span>Future Year Target</span>
                                 <CalcInput value={infYears} onChange={setInfYears} suffix=" Yrs" className="w-12" />
                              </div>
                              <input type="range" min="1" max="40" step="1" value={infYears} onChange={e => setInfYears(Number(e.target.value))} className="w-full accent-[#3B82F6]" />
                           </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-2 mt-4">
                           <div className="flex justify-between text-xs font-bold text-muted-foreground">
                              <span>Current Purchasing Power Cost</span>
                              <span className="font-mono text-foreground">₹{fmtINR(infCost)}</span>
                           </div>
                           <div className="flex justify-between text-xs font-bold text-[#FF3B30]">
                              <span>Inflation Purchasing Decay</span>
                              <span className="font-mono">+₹{fmtINR(Math.round(infCostIncrease))}</span>
                           </div>
                           <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                              <span className="text-xs font-bold uppercase text-foreground">Future Equivalent Cost</span>
                              <span className="text-xl font-bold font-mono text-[#F4C542]">₹{fmtINR(Math.round(infFutureCost))}</span>
                           </div>
                        </div>
                     </>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>

      {/* 4. DEPLOY SIP MODAL */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <Card className="w-full max-w-md bg-white dark:bg-[#08090B] border border-[#F4C542]/40 shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col shrink-0">
               <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg shrink-0" />
               <CardHeader className="p-4 sm:p-5 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
                  <div>
                     <CardTitle className="text-lg sm:text-xl font-bold text-foreground">{editingSipId ? 'Update SIP Plan' : 'Deploy Automated SIP'}</CardTitle>
                     <CardDescription className="text-xs font-semibold">Set deduction schedule and link to asset category.</CardDescription>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full shrink-0">
                     <X className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <form onSubmit={handleAddSIP} className="flex flex-col overflow-hidden">
                  <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fund / Asset Name</label>
                        <input 
                           required 
                           list="holdings-list-v4"
                           value={name} 
                           onChange={e => {
                              const val = e.target.value
                              setName(val)
                              const match = holdings.find(h => h.name === val)
                              if (match) {
                                 setSymbol(match.symbol)
                                 setType(match.type)
                              }
                           }} 
                           placeholder="e.g. Nippon India Small Cap" 
                           className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]" 
                        />
                        <datalist id="holdings-list-v4">
                           {holdings.map((h, idx) => (
                              <option key={idx} value={h.name} />
                           ))}
                        </datalist>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Category</label>
                           <select value={type} onChange={e => setType(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                              <option>Equity</option>
                              <option>Mutual Fund</option>
                              <option>Crypto</option>
                              <option>Commodity</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deduction (₹)</label>
                           <input required type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 25000" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-base focus:outline-none focus:border-[#F4C542]" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Frequency</label>
                           <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                              <option>Daily</option>
                              <option>Weekly</option>
                              <option>Monthly</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {frequency === 'Weekly' ? 'Day of Week' : frequency === 'Daily' ? 'Schedule' : 'Date of Month'}
                           </label>
                           {frequency === 'Weekly' ? (
                              <select value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                                 <option>Monday</option>
                                 <option>Tuesday</option>
                                 <option>Wednesday</option>
                                 <option>Thursday</option>
                                 <option>Friday</option>
                              </select>
                           ) : frequency === 'Daily' ? (
                              <input disabled value="Everyday" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-muted-foreground font-bold text-xs" />
                           ) : (
                              <input required type="number" min="1" max="31" placeholder="e.g. 5" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-sm focus:outline-none focus:border-[#F4C542]" />
                           )}
                        </div>
                     </div>
                  </CardContent>
                  <div className="p-4 sm:p-5 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/80 flex justify-end gap-3 shrink-0">
                     <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold px-5 h-10">Cancel</Button>
                     <Button type="submit" className="gold-gradient-bg text-slate-950 font-bold rounded-xl px-6 h-10 shadow-lg hover:brightness-105">
                        {editingSipId ? 'Save Updates' : 'Deploy Automated SIP'}
                     </Button>
                  </div>
               </form>
            </Card>
         </div>
      )}
    </div>
  )
}

export default function SIPPlannerPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Compound Velocity Engine...</div>}>
      <SIPPlannerContent />
    </Suspense>
  )
}
