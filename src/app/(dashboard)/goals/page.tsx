"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Plus, X, Trash2, Pencil, Coins, Calendar, HelpCircle, FileText, Check } from "lucide-react"

type Goal = {
  id: string
  title: string
  target: number
  current: number
  color: string
  target_date?: string
  track_by?: string
  notes?: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  // Form State
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [current, setCurrent] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [color, setColor] = useState("bg-emerald-500")
  const [template, setTemplate] = useState("Select a template...")
  const [trackBy, setTrackBy] = useState("Net Worth (all assets)")
  const [notes, setNotes] = useState("")
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (data) {
      // Enrich goals with local track_by and notes from localStorage
      const enriched = data.map((goal: any) => {
        const localMeta = localStorage.getItem(`bun_vault_goal_meta_${goal.id}`)
        if (localMeta) {
          try {
            const { track_by, notes } = JSON.parse(localMeta)
            return { ...goal, track_by, notes }
          } catch (e) {
            console.error("Error parsing local goal metadata:", e)
          }
        }
        return goal
      })
      setGoals(enriched)
    }
    setLoading(false)
  }

  const handleTemplateChange = (val: string) => {
    setTemplate(val)
    if (val === "Retirement") {
      setTitle("Retirement Fund")
      setTarget("10000000")
      setColor("bg-indigo-500")
    } else if (val === "Dream House") {
      setTitle("Home Downpayment")
      setTarget("2500000")
      setColor("bg-emerald-500")
    } else if (val === "Dream Car") {
      setTitle("Car Purchase")
      setTarget("1500000")
      setColor("bg-amber-500")
    } else if (val === "Emergency Fund") {
      setTitle("Emergency Fund")
      setTarget("500000")
      setColor("bg-blue-500")
    } else if (val === "Vacation") {
      setTitle("Dream Vacation")
      setTarget("300000")
      setColor("bg-rose-500")
    } else {
      setTitle("")
      setTarget("")
      setColor("bg-emerald-500")
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setTitle(goal.title)
    setTarget(goal.target.toString())
    setCurrent(goal.current.toString())
    setTargetDate(goal.target_date || "")
    setColor(goal.color)
    setTrackBy(goal.track_by || "Net Worth (all assets)")
    setNotes(goal.notes || "")
    setTemplate("Custom")
    formRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingGoalId(null)
    setTitle("")
    setTarget("")
    setCurrent("")
    setTargetDate("")
    setColor("bg-emerald-500")
    setTemplate("Select a template...")
    setTrackBy("Net Worth (all assets)")
    setNotes("")
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // PAYLOAD payload only containing columns that strictly exist in public.goals schema
    const goalPayload = {
      title,
      target: parseFloat(target),
      current: parseFloat(current) || 0,
      target_date: targetDate || null,
      color
    }

    if (editingGoalId) {
      const { error } = await supabase
        .from('goals')
        .update(goalPayload)
        .eq('id', editingGoalId)

      if (!error) {
        // Save metadata locally to prevent Supabase schema mismatch crash
        localStorage.setItem(
          `bun_vault_goal_meta_${editingGoalId}`, 
          JSON.stringify({ track_by: trackBy, notes })
        )
        cancelEdit()
        fetchGoals()
      } else {
        alert("Failed to update goal: " + error.message)
      }
    } else {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ user_id: user.id, ...goalPayload }])
        .select() // Return inserted row to get the new id

      if (!error) {
        const newGoal = data?.[0]
        if (newGoal) {
          localStorage.setItem(
            `bun_vault_goal_meta_${newGoal.id}`, 
            JSON.stringify({ track_by: trackBy, notes })
          )
        }
        cancelEdit()
        fetchGoals()
      } else {
        alert("Failed to add goal: " + error.message)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) {
      localStorage.removeItem(`bun_vault_goal_meta_${id}`)
      fetchGoals()
    }
  }

  // Calculate dynamic monthly investment recommendation based on active goals
  const activeGoal = goals.find(g => g.target > g.current && g.target_date)
  let recommendationText = "Set a goal and we will calculate your monthly investment recommendation."
  if (activeGoal && activeGoal.target_date) {
    const d1 = new Date()
    const d2 = new Date(activeGoal.target_date)
    const months = Math.max(1, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()))
    const gap = activeGoal.target - activeGoal.current
    const monthly = gap / months
    recommendationText = `✓ Invest ₹${(monthly / 1000).toFixed(2)}K/mo at 7% p.a. to close the gap for "${activeGoal.title}"`
  }

  return (
    <div className="flex-1 space-y-6 relative max-w-6xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Goals</h2>
           <p className="text-muted-foreground">{goals.length} active goal{goals.length !== 1 && 's'}</p>
        </div>
      </div>

      {/* Suggestion Recommendation Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
         <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
            <Check className="h-4 w-4" />
         </div>
         <p className="text-sm text-emerald-400 font-medium">{recommendationText}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 items-start">
         {/* Goals List (Takes up 3 columns) */}
         <div className="md:col-span-3 space-y-4">
            <h3 className="font-semibold text-lg text-card-foreground">Active Goals</h3>
            {loading ? (
               <div className="p-8 text-muted-foreground animate-pulse">Loading your goals...</div>
            ) : goals.length === 0 ? (
               <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground bg-muted/20">
                  No goals set yet. Use the creation panel to start planning your financial future!
               </div>
            ) : (
               <div className="grid gap-4 sm:grid-cols-1">
                  {goals.map((goal) => {
                     const percent = Math.min(100, (goal.current / goal.target) * 100)
                     const remaining = Math.max(0, goal.target - goal.current)
                     let monthlySave = 0
                     let monthsLeftText = "No target date"

                     if (goal.target_date) {
                        const d1 = new Date()
                        const d2 = new Date(goal.target_date)
                        const monthsLeft = Math.max(1, (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()))
                        
                        if (d2 >= d1 || monthsLeft > 0) {
                           monthlySave = remaining / monthsLeft
                           monthsLeftText = `By ${d2.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                        } else if (remaining > 0) {
                           monthsLeftText = "Deadline passed"
                        } else {
                           monthsLeftText = "Goal reached!"
                        }
                     }

                     return (
                        <Card key={goal.id} className="relative overflow-hidden glass-panel border-primary/10">
                           <CardContent className="p-5 space-y-4">
                              {/* Header Title and Non-overlapping Actions */}
                              <div className="flex justify-between items-start border-b border-primary/5 pb-2">
                                 <div>
                                    <h4 className="font-semibold text-base flex items-center gap-2">
                                       <span className="text-xl">💰</span> {goal.title}
                                    </h4>
                                    {goal.notes && (
                                       <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{goal.notes}"</p>
                                    )}
                                 </div>
                                 <div className="flex gap-1 shrink-0">
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleEdit(goal)} 
                                      className="h-7 w-7 text-primary hover:bg-primary/10"
                                   >
                                      <Pencil className="h-3.5 w-3.5" />
                                   </Button>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDelete(goal.id)} 
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                   >
                                      <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                 </div>
                              </div>

                              {/* Progress Stats Section */}
                              <div className="flex justify-between text-sm pt-1">
                                 <div className="space-y-0.5">
                                    <span className="text-xs text-muted-foreground uppercase block tracking-wider">Already Saved</span>
                                    <span className="font-bold text-base">₹{goal.current.toLocaleString()}</span>
                                 </div>
                                 <div className="text-right space-y-0.5">
                                    <span className="text-xs text-muted-foreground uppercase block tracking-wider">Target Amount</span>
                                    <span className="font-bold text-base">₹{goal.target.toLocaleString()}</span>
                                 </div>
                              </div>

                              {/* Progress Slider */}
                              <div className="space-y-1">
                                 <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${goal.color}`} style={{ width: `${percent}%` }}></div>
                                 </div>
                                 <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                    <span>{percent.toFixed(1)}% Completed</span>
                                    <span>₹{remaining.toLocaleString()} Left</span>
                                 </div>
                              </div>

                              {/* Calculations */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/5 text-center sm:text-left">
                                 <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saved By</p>
                                    <p className="text-xs font-semibold">{goal.track_by || 'Net Worth'}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Required / Mo</p>
                                    <p className="text-xs font-bold text-emerald-500">
                                       {monthlySave > 0 ? `₹${Math.round(monthlySave).toLocaleString()}` : 'Completed'}
                                    </p>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     )
                  })}
               </div>
            )}
         </div>

         {/* Creation Form Panel (Takes up 2 columns) */}
         <div className="md:col-span-2 space-y-4" ref={formRef}>
            <h3 className="font-semibold text-lg text-card-foreground">
               {editingGoalId ? 'Edit Financial Goal' : 'Create New Goal'}
            </h3>
            <Card className="glass-panel border-primary/20">
               <CardContent className="p-5">
                  <form onSubmit={handleAddGoal} className="space-y-4">
                     {/* Template Selector */}
                     <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Template</label>
                        <div className="relative">
                           <select 
                              value={template} 
                              onChange={e => handleTemplateChange(e.target.value)} 
                              className="w-full rounded-md border py-2 px-3 bg-background text-sm cursor-pointer"
                           >
                              <option disabled value="Select a template...">Select a template...</option>
                              <option value="Custom">Custom (Blank)</option>
                              <option value="Retirement">Retirement Fund 👵</option>
                              <option value="Dream House">Dream House Downpayment 🏡</option>
                              <option value="Dream Car">Dream Car Purchase 🚗</option>
                              <option value="Emergency Fund">Emergency Fund (6-Mo) 🛡️</option>
                              <option value="Vacation">Dream Vacation ✈️</option>
                           </select>
                        </div>
                     </div>

                     {/* Goal Name */}
                     <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goal Name *</label>
                        <div className="relative flex items-center">
                           <span className="absolute left-3 text-lg">💰</span>
                           <input 
                              required 
                              type="text" 
                              value={title} 
                              onChange={e => setTitle(e.target.value)}
                              placeholder="Goal name" 
                              className="w-full rounded-md border py-2 pl-10 pr-3 bg-background text-sm" 
                           />
                        </div>
                     </div>

                     {/* Target Amount & Already Saved */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Target Amount *</label>
                           <input 
                              required 
                              type="number" 
                              value={target} 
                              onChange={e => setTarget(e.target.value)}
                              placeholder="Target amount" 
                              className="w-full rounded-md border py-2 px-3 bg-background text-sm" 
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Already Saved</label>
                           <input 
                              type="number" 
                              value={current} 
                              onChange={e => setCurrent(e.target.value)}
                              placeholder="Already saved" 
                              className="w-full rounded-md border py-2 px-3 bg-background text-sm" 
                           />
                        </div>
                     </div>

                     {/* Target Date */}
                     <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Target Date *</label>
                        <input 
                           required
                           type="date" 
                           value={targetDate} 
                           onChange={e => setTargetDate(e.target.value)}
                           className="w-full rounded-md border py-2 px-3 bg-background text-sm cursor-pointer" 
                        />
                     </div>

                     {/* Track Progress By */}
                     <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Track Progress By</label>
                        <select 
                           value={trackBy} 
                           onChange={e => setTrackBy(e.target.value)} 
                           className="w-full rounded-md border py-2 px-3 bg-background text-sm cursor-pointer"
                        >
                           <option>Net Worth (all assets)</option>
                           <option>Specific Holdings</option>
                           <option>Savings Account</option>
                        </select>
                     </div>

                     {/* Notes */}
                     <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes (optional)</label>
                        <textarea 
                           value={notes} 
                           onChange={e => setNotes(e.target.value)}
                           placeholder="Why this goal matters, milestones, plan..."
                           rows={3}
                           className="w-full rounded-md border py-2 px-3 bg-background text-sm resize-none"
                        />
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1 text-sm py-2">
                           {editingGoalId ? 'Update Goal' : 'Create Goal'}
                        </Button>
                        {editingGoalId && (
                           <Button type="button" variant="outline" onClick={cancelEdit} className="text-sm">
                              Cancel
                           </Button>
                        )}
                     </div>
                  </form>
               </CardContent>
            </Card>
         </div>
      </div>
      {/* Mobile Floating Action Button for New Goal */}
      <button 
         onClick={() => {
            cancelEdit(); // Resets state to new creation mode first
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
         }}
         className="md:hidden fixed bottom-[72px] right-4 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-900/30 flex items-center justify-center z-40 active:scale-95 transition-transform border border-emerald-400/20 hover:bg-emerald-500"
         aria-label="New Goal"
      >
         <Plus className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  )
}
