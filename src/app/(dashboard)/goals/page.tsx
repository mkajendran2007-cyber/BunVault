"use client"

import { useEffect, useState, useRef, useMemo, Suspense } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Pencil, Coins, Calendar, Trophy, Sparkles, Link, CheckCircle2, Flame, Layers } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

type Goal = {
  id: string
  title: string
  target: number
  current: number
  color: string
  target_date?: string
  track_by?: string
  notes?: string
  monthly_sip?: number
}

type Holding = {
  id: string
  name: string
  symbol: string
  type: string
  qty: number
  buy_price: number
  currentPrice?: number
}

function GoalsContent() {
  const [mounted, setMounted] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Form State
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [current, setCurrent] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [color, setColor] = useState("bg-[#00E676]")
  const [template, setTemplate] = useState("Select a template...")
  const [trackBy, setTrackBy] = useState("Net Worth (all assets)")
  const [notes, setNotes] = useState("")
  const [monthlySip, setMonthlySip] = useState("15000")
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  useEffect(() => {
    fetchGoalsAndHoldings()
  }, [])

  const triggerConfetti = (isHundredPercent = false) => {
    confetti({
      particleCount: isHundredPercent ? 180 : 100,
      spread: isHundredPercent ? 100 : 70,
      origin: { y: 0.6 },
      colors: ['#F4C542', '#00E676', '#3B82F6', '#EC4899', '#8B5CF6']
    })
    toast.success(isHundredPercent ? "🏆 100% Milestone Achieved! Celebration Confetti Triggered!" : "🎉 Milestone Celebration Triggered!")
  }

  const fetchGoalsAndHoldings = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch active holdings for link computation
    let activeHoldings: Holding[] = []
    if (user) {
       const { data: hData } = await supabase.from('holdings').select('*').eq('user_id', user.id)
       activeHoldings = hData || []
       setHoldings(activeHoldings)
    } else {
       activeHoldings = [
          { id: 'demo-h1', name: 'Nippon India Small Cap', symbol: '122639', type: 'Mutual Fund', qty: 1500, buy_price: 160, currentPrice: 168.40 },
          { id: 'demo-h2', name: 'Physical Gold Bullion', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 100, buy_price: 13800, currentPrice: 14394.00 }
       ]
       setHoldings(activeHoldings)
    }

    if (!user) {
      // Check if user modified or deleted goals locally
      const savedGoalsJson = await getUserSetting('bun_vault_goals_persisted_list_v3')
      if (savedGoalsJson !== null) {
        try {
          const parsedGoals = typeof savedGoalsJson === 'string' ? JSON.parse(savedGoalsJson) : savedGoalsJson
          setGoals(parsedGoals)
          setLoading(false)
          return
        } catch (e) {}
      }

      const demoGoals: Goal[] = [
        { id: 'demo-g1', title: 'Retirement Savings', target: 10000000, current: 4250000, color: 'bg-[#3B82F6]', target_date: '2036-12-31', track_by: 'Net Worth (all assets)', monthly_sip: 50000, notes: 'Auto-linked to cumulative net worth growth across all investments.' },
        { id: 'demo-g2', title: 'Dream Home Down Payment', target: 3500000, current: 1850000, color: 'bg-[#00E676]', target_date: '2028-06-30', track_by: 'Category: Mutual Fund', monthly_sip: 35000, notes: 'Allocated mutual fund growth.' },
        { id: 'demo-g3', title: 'Gold Reserve', target: 2000000, current: 1439400, color: 'bg-[#F4C542]', target_date: '2027-01-01', track_by: 'Category: Commodity', monthly_sip: 20000, notes: 'Tracking physical 24K gold holdings.' }
      ]
      setGoals(demoGoals)
      setUserSetting('bun_vault_goals_persisted_list_v3', JSON.stringify(demoGoals))
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      const savedGoalsJson = await getUserSetting('bun_vault_goals_persisted_list_v3')
      if (savedGoalsJson !== null) {
        try {
          const parsedGoals = typeof savedGoalsJson === 'string' ? JSON.parse(savedGoalsJson) : savedGoalsJson
          setGoals(parsedGoals)
          setLoading(false)
          return
        } catch (e) {}
      }

      const demoGoals: Goal[] = [
        { id: 'demo-g1', title: 'Retirement Savings', target: 10000000, current: 4250000, color: 'bg-[#3B82F6]', target_date: '2036-12-31', track_by: 'Net Worth (all assets)', monthly_sip: 50000, notes: 'Auto-linked to cumulative net worth growth across all investments.' },
        { id: 'demo-g2', title: 'Dream Home Down Payment', target: 3500000, current: 1850000, color: 'bg-[#00E676]', target_date: '2028-06-30', track_by: 'Category: Mutual Fund', monthly_sip: 35000, notes: 'Allocated mutual fund growth.' }
      ]
      setGoals(demoGoals)
      setUserSetting('bun_vault_goals_persisted_list_v3', JSON.stringify(demoGoals))
      setLoading(false)
      return
    }

    const enriched = await Promise.all(data.map(async (goal: any) => {
      const localMeta = await getUserSetting(`bun_vault_goal_meta_${goal.id}`)
      let tBy = goal.track_by || "Net Worth (all assets)"
      let n = goal.notes || ""
      let sip = goal.monthly_sip || 15000

      if (localMeta) {
        try {
          const parsed = typeof localMeta === 'string' ? JSON.parse(localMeta) : localMeta
          if (parsed.track_by) tBy = parsed.track_by
          if (parsed.notes) n = parsed.notes
          if (parsed.monthly_sip) sip = Number(parsed.monthly_sip)
        } catch (e) {}
      }

      let computedCurrent = Number(goal.current) || 0
      if (tBy.startsWith('Holding:')) {
         const hName = tBy.replace('Holding: ', '').trim()
         const matched = activeHoldings.find(h => h.name === hName || h.symbol === hName)
         if (matched) {
            computedCurrent = matched.qty * (matched.currentPrice || matched.buy_price)
         }
      } else if (tBy.startsWith('Category:')) {
         const cType = tBy.replace('Category: ', '').trim()
         computedCurrent = activeHoldings
            .filter(h => h.type === cType)
            .reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0)
      } else if (tBy === 'Net Worth (all assets)') {
         const totalNW = activeHoldings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0)
         if (totalNW > 0 && computedCurrent === 0) computedCurrent = totalNW
      }

      const pct = (computedCurrent / Number(goal.target)) * 100
      const celebrated100 = await getUserSetting(`bun_cel_100_v4_${goal.id}`)

      if (pct >= 100 && !celebrated100) {
         triggerConfetti(true)
         setUserSetting(`bun_cel_100_v4_${goal.id}`, 'true')
         window.dispatchEvent(new CustomEvent('bun-notify', {
            detail: {
               id: `milestone-100-${goal.id}-${Date.now()}`,
               title: "🏆 Goal Achieved! 100% Milestone",
               message: `Congratulations! You reached 100% of your target for '${goal.title}' (₹${fmtINR(computedCurrent)}).`,
               type: "milestone"
            }
         }))
      }

      return { ...goal, current: computedCurrent, track_by: tBy, notes: n, monthly_sip: sip }
    }))

    setGoals(enriched)
    setUserSetting('bun_vault_goals_persisted_list_v3', JSON.stringify(enriched))
    setLoading(false)
  }

  const handleTemplateChange = (val: string) => {
    setTemplate(val)
    if (val === "Retirement") {
      setTitle("Retirement Savings")
      setTarget("10000000")
      setColor("bg-[#3B82F6]")
      setMonthlySip("50000")
    } else if (val === "Dream House") {
      setTitle("Dream Home Down Payment")
      setTarget("3500000")
      setColor("bg-[#00E676]")
      setMonthlySip("35000")
    } else if (val === "Dream Car") {
      setTitle("New Vehicle Purchase")
      setTarget("2000000")
      setColor("bg-[#F4C542]")
      setMonthlySip("25000")
    } else if (val === "Emergency Fund") {
      setTitle("6-Month Emergency Shield")
      setTarget("750000")
      setColor("bg-[#8B5CF6]")
      setMonthlySip("20000")
    } else if (val === "Vacation") {
      setTitle("Vacation & Travel Fund")
      setTarget("500000")
      setColor("bg-[#EC4899]")
      setMonthlySip("15000")
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setTitle(goal.title)
    setTarget(goal.target.toString())
    setCurrent(goal.current.toString())
    setTargetDate(goal.target_date || "")
    setColor(goal.color || "bg-[#00E676]")
    setTrackBy(goal.track_by || "Net Worth (all assets)")
    setNotes(goal.notes || "")
    setMonthlySip((goal.monthly_sip || 15000).toString())
    setTemplate("Select a template...")
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingGoalId(null)
    setTitle("")
    setTarget("")
    setCurrent("")
    setTargetDate("")
    setColor("bg-[#00E676]")
    setTemplate("Select a template...")
    setTrackBy("Net Worth (all assets)")
    setNotes("")
    setMonthlySip("15000")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const demoNew: Goal = {
         id: `demo-g-${Date.now()}`,
         title: title || "New Financial Goal",
         target: parseFloat(target || "1000000"),
         current: parseFloat(current || "250000"),
         color,
         target_date: targetDate || '2030-12-31',
         track_by: trackBy,
         notes,
         monthly_sip: parseFloat(monthlySip || "15000")
      }
      let updatedList: Goal[] = []
      if (editingGoalId) {
        updatedList = goals.map(g => g.id === editingGoalId ? { ...demoNew, id: editingGoalId } : g)
      } else {
        updatedList = [demoNew, ...goals]
      }
      setGoals(updatedList)
      setUserSetting('bun_vault_goals_persisted_list_v3', JSON.stringify(updatedList))
      resetForm()
      triggerConfetti()
      return
    }

    const payload = {
      user_id: user.id,
      title,
      target: parseFloat(target),
      current: parseFloat(current || "0"),
      color,
      target_date: targetDate || null
    }

    let error
    let savedId = editingGoalId

    if (editingGoalId && !editingGoalId.startsWith('demo-')) {
      const res = await supabase.from('goals').update(payload).eq('id', editingGoalId)
      error = res.error
    } else if (!editingGoalId) {
      const res = await supabase.from('goals').insert([payload]).select()
      error = res.error
      if (res.data && res.data.length > 0) {
        savedId = res.data[0].id
      }
    }

    if (!error && savedId) {
      setUserSetting(`bun_vault_goal_meta_${savedId}`, JSON.stringify({
        track_by: trackBy,
        notes: notes,
        monthly_sip: parseFloat(monthlySip || "15000")
      }))
      toast.success(editingGoalId ? "Goal updated!" : "New goal created!")
      resetForm()
      triggerConfetti()
      fetchGoalsAndHoldings()
    } else {
      toast.error("Error saving goal: " + (error ? error.message : "Unknown error"))
    }
  }

  const handleDelete = async (id: string) => {
    const updatedList = goals.filter(g => g.id !== id)
    setGoals(updatedList)
    setUserSetting('bun_vault_goals_persisted_list_v3', JSON.stringify(updatedList))

    const { data: { user } } = await supabase.auth.getUser()
    if (user && !id.startsWith('demo-')) {
       await supabase.from('goals').delete().eq('id', id)
       setUserSetting(`bun_vault_goal_meta_${id}`, null)
    }
    toast.success("Goal removed successfully")
  }

  const calculateProjection = (targetAmt: number, currentAmt: number, monthlySipAmt: number) => {
     const needed = targetAmt - currentAmt
     if (needed <= 0) return { months: 0, label: "🏆 100% Goal Achieved!" }
     if (monthlySipAmt <= 0) return { months: 999, label: "Set monthly SIP contribution" }
     
     const monthsLeft = Math.ceil(needed / monthlySipAmt)
     const projDate = new Date()
     projDate.setMonth(projDate.getMonth() + monthsLeft)
     const dateLabel = projDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
     return { months: monthsLeft, label: `${dateLabel} (${monthsLeft} ${monthsLeft === 1 ? 'month' : 'months'})` }
  }

  const totalTargetAmount = goals.reduce((acc, g) => acc + (g.target || 0), 0)
  const totalCurrentAchieved = goals.reduce((acc, g) => acc + (g.current || 0), 0)

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">LOADING GOALS...</span>
          <p className="text-[11px] font-medium text-slate-500">Syncing your savings targets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 pb-16 relative w-full max-w-full min-w-0 overflow-x-hidden">
      {/* 1. HEADER STRIP */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider gold-gradient-bg text-slate-950 flex items-center gap-1.5 shadow-sm">
               <Trophy className="h-3.5 w-3.5" /> Goal Tracker & Milestones
             </span>
           </div>
           <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
             Financial Goals
           </h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
             Set personal savings targets, auto-link them to your portfolio assets, and celebrate when you reach 100%.
           </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
           <Button onClick={() => triggerConfetti(false)} variant="outline" className="h-11 px-4 rounded-xl border-[#F4C542]/50 text-[#F4C542] hover:bg-[#F4C542]/10 font-bold text-xs gap-1.5">
              <Sparkles className="h-4 w-4 fill-[#F4C542]" /> Celebrate
           </Button>
           <Button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold h-11 px-6 rounded-xl shadow-md shadow-amber-500/20 text-xs flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2 stroke-[3]" /> + Create New Goal
           </Button>
        </div>
      </div>

      {/* 2. GOAL SUMMARY CARDS */}
      <div className="grid gap-6 md:grid-cols-3 w-full min-w-0">
         <Card className="glass-panel p-6 rounded-2xl border border-border/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Target Amount</span>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight my-2">
               ₹{totalTargetAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
               <Layers className="h-3.5 w-3.5 text-[#F4C542]" /> Across {goals.length} active goals
            </span>
         </Card>

         <Card className="glass-panel p-6 rounded-2xl border border-[#00E676]/30 bg-[#00E676]/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00E676]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E676]">Saved So Far</span>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-[#00E676] tracking-tight my-2">
               ₹{totalCurrentAchieved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <span className="text-xs font-semibold font-mono text-muted-foreground flex items-center gap-1">
               <CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> {totalTargetAmount > 0 ? ((totalCurrentAchieved / totalTargetAmount) * 100).toFixed(1) : 0}% total progress
            </span>
         </Card>

         <Card className="glass-panel p-6 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#3B82F6]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B82F6]">Auto-Linked Assets</span>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight my-2">
               {goals.filter(g => g.track_by && g.track_by !== 'Manual').length} <span className="text-base font-normal text-muted-foreground">Linked</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
               <Link className="h-3.5 w-3.5 text-[#3B82F6]" /> Real-time sync with your holdings
            </span>
         </Card>
      </div>

      {/* 3. ACTIVE GOALS CARDS */}
      {loading ? (
         <div className="p-12 text-center font-bold text-muted-foreground">Syncing your goals...</div>
      ) : goals.length === 0 ? (
         <Card className="glass-panel border-dashed p-12 text-center text-muted-foreground font-bold">
            <Coins className="h-10 w-10 mx-auto mb-3 text-[#F4C542] opacity-70" />
            No goals created yet. Select a quick template below or create your own target!
         </Card>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => {
               const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100)
               const proj = calculateProjection(goal.target, goal.current, goal.monthly_sip || 15000)

               return (
                  <Card key={goal.id} className="glass-panel rounded-2xl border border-border/40 hover:border-[#F4C542]/50 hover:shadow-2xl transition-all flex flex-col justify-between relative overflow-hidden group">
                     <div className={`absolute top-0 left-0 right-0 h-1.5 ${goal.color}`} />
                     <CardHeader className="p-6 pb-3 flex flex-row items-start justify-between gap-2">
                        <div>
                           <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
                              {percentage >= 100 && <Trophy className="h-4 w-4 text-[#F4C542] shrink-0 fill-[#F4C542]" />}
                              {goal.title}
                           </CardTitle>
                           {goal.target_date && (
                              <div className="flex items-center text-xs font-medium text-muted-foreground mt-1 gap-1">
                                 <Calendar className="h-3 w-3 text-[#F4C542]" /> Target Date: {new Date(goal.target_date).toLocaleDateString()}
                              </div>
                           )}
                        </div>
                        <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-[#F4C542] rounded-lg" onClick={() => handleEdit(goal)}>
                              <Pencil className="h-3.5 w-3.5" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive rounded-lg" onClick={() => handleDelete(goal.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                        </div>
                     </CardHeader>

                     <CardContent className="p-6 pt-2 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                           <div className="flex justify-between items-baseline mb-3">
                              <div className="text-2xl font-bold font-mono text-foreground">₹{fmtINR(goal.current)}</div>
                              <div className="text-xs font-semibold text-muted-foreground">of ₹{fmtINR(goal.target)}</div>
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                 <span className={percentage >= 100 ? "text-[#00E676] font-bold" : "text-muted-foreground"}>{percentage}% Achieved</span>
                                 <span className="font-mono font-semibold text-foreground">₹{fmtINR(goal.target - goal.current > 0 ? goal.target - goal.current : 0)} remaining</span>
                              </div>
                              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-border/30">
                                 <div className={`h-full rounded-full transition-all duration-700 ${goal.color}`} style={{ width: `${percentage}%` }} />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2">
                           {/* Projected Timeline */}
                           <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                 <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#F4C542]" /> Monthly Contribution</span>
                                 <span className="font-mono text-foreground">₹{fmtINR(goal.monthly_sip || 15000)}/mo</span>
                              </div>
                              <div className="text-xs font-bold text-foreground">{proj.label}</div>
                           </div>

                           {/* Linked Telemetry */}
                           {goal.track_by && (
                              <div className="flex items-center justify-between text-xs font-bold bg-[#F4C542]/10 border border-[#F4C542]/25 text-foreground px-3 py-1.5 rounded-xl truncate">
                                 <span className="flex items-center gap-1.5 text-muted-foreground truncate text-[11px]">
                                    <Link className="h-3.5 w-3.5 text-[#F4C542] shrink-0" /> Linkage:
                                 </span>
                                 <span className="font-mono font-bold text-xs truncate ml-2 text-right">{goal.track_by}</span>
                              </div>
                           )}

                           {goal.notes && (
                              <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-[#151A21]/60 p-3 rounded-xl border border-border/30 line-clamp-2 font-medium">
                                 "{goal.notes}"
                              </div>
                           )}
                        </div>
                     </CardContent>
                  </Card>
               )
            })}
         </div>
      )}

      {/* 4. ADD / EDIT GOAL FORM */}
      <Card ref={formRef} className="glass-panel rounded-2xl border border-[#F4C542]/40 shadow-2xl max-w-3xl overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
         <CardHeader className="p-6 border-b border-border/40 pb-4">
            <CardTitle className="text-xl font-bold flex items-center justify-between text-foreground">
               <span>{editingGoalId ? "Update Goal" : "Create New Goal"}</span>
               {editingGoalId && (
                  <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs font-bold gap-1 rounded-xl">
                     <X className="h-4 w-4" /> Cancel Edit
                  </Button>
               )}
            </CardTitle>
            <CardDescription className="text-xs font-medium">
               Connect goals directly to your portfolio holdings or asset categories to track progress automatically without manual entry.
            </CardDescription>
         </CardHeader>
         <CardContent className="p-6 pt-5">
            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Quick Templates</label>
                  <select value={template} onChange={e => handleTemplateChange(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                     <option disabled>Select a template...</option>
                     <option value="Retirement">Retirement Savings (₹1 Cr target)</option>
                     <option value="Dream House">Dream Home Down Payment (₹35 Lakhs)</option>
                     <option value="Dream Car">New Vehicle Purchase (₹20 Lakhs)</option>
                     <option value="Emergency Fund">6-Month Emergency Shield (₹7.5 Lakhs)</option>
                     <option value="Vacation">Vacation & Travel Fund (₹5 Lakhs)</option>
                     <option value="Custom">Custom Goal</option>
                  </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Goal Title</label>
                     <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dream Home Down Payment" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-semibold text-xs focus:outline-none focus:border-[#F4C542]" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Amount (₹)</label>
                     <input required type="number" step="any" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 3500000" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-sm focus:outline-none focus:border-[#F4C542]" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Date</label>
                     <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-semibold text-xs focus:outline-none focus:border-[#F4C542]" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Contribution (₹)</label>
                     <input type="number" step="any" value={monthlySip} onChange={e => setMonthlySip(e.target.value)} placeholder="15000" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-sm focus:outline-none focus:border-[#F4C542]" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress Color</label>
                     <select value={color} onChange={e => setColor(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                        <option value="bg-[#00E676]">Green (Wealth & Growth)</option>
                        <option value="bg-[#3B82F6]">Blue (Retirement & Safety)</option>
                        <option value="bg-[#F4C542]">Gold (Luxury & Vehicle)</option>
                        <option value="bg-[#8B5CF6]">Purple (Emergency & Shield)</option>
                        <option value="bg-[#EC4899]">Rose (Vacation & Travel)</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto-Track From (Linked Assets)</label>
                     <select value={trackBy} onChange={e => setTrackBy(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                        <option value="Net Worth (all assets)">Net Worth (All Assets Combined)</option>
                        <option value="Category: Equity">All Equity Holdings</option>
                        <option value="Category: Mutual Fund">All Mutual Funds</option>
                        <option value="Category: Debt">All Debt / FDs / FDs</option>
                        <option value="Category: Crypto">All Crypto Assets</option>
                        <option disabled>--- Specific Holdings ---</option>
                        {holdings.map((h, idx) => (
                           <option key={idx} value={`Holding: ${h.name}`}>Holding: {h.name} ({h.symbol})</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Amount Saved (₹)</label>
                     <input type="number" step="any" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0 (Leave empty to auto-track)" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-sm focus:outline-none focus:border-[#F4C542]" />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes & Details</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Linked to TCS share growth & SBI Liquid Fund" className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-medium text-xs focus:outline-none focus:border-[#F4C542]" />
               </div>

               <div className="pt-3">
                  <Button type="submit" className="w-full gold-gradient-bg text-slate-950 font-bold h-12 rounded-xl shadow-md shadow-amber-500/20 hover:brightness-105 transition-all text-sm gap-2">
                     <CheckCircle2 className="h-4 w-4 stroke-[3]" /> {editingGoalId ? "Save Goal Updates" : "Create Goal & Start Tracking"}
                  </Button>
               </div>
            </form>
         </CardContent>
      </Card>
    </div>
  )
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Financial Goals Matrix...</div>}>
      <GoalsContent />
    </Suspense>
  )
}
