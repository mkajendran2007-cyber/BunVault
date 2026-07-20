"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertTriangle, Sparkles, Trophy, Trash2, ArrowRight, ShieldCheck, Clock } from "lucide-react"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"
import { toast } from "sonner"
import Link from "next/link"

type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  type: "alert" | "milestone" | "info" | "success"
  read: boolean
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    // 1. Initial sync load
    const saved = localStorage.getItem("bun_vault_notifications")
    if (saved) {
      try {
        setNotifications(JSON.parse(saved))
      } catch (e) {}
    } else {
      // Default institutional audit trail
      const initial: NotificationItem[] = [
        {
          id: "notif-1",
          title: "🏆 Milestone Unlocked: Halfway to Villa Downpayment",
          message: "Your current wealth allocation has crossed 50% of your ₹35 Lakh target.",
          time: "2 hours ago",
          type: "milestone",
          read: false,
          link: "/goals"
        },
        {
          id: "notif-2",
          title: "⚠️ Price Alert Armed: TCS.NS Breached Upper Target",
          message: "TCS shares surged +1.8% today to cross your target threshold of ₹4,100.",
          time: "5 hours ago",
          type: "alert",
          read: false,
          link: "/watchlist"
        },
        {
          id: "notif-3",
          title: "🚀 Nightly Audit Completed",
          message: "Automatic investment tracking logged ₹35,000 across mutual funds and ₹12,400 in personal expenses.",
          time: "Yesterday",
          type: "success",
          read: true,
          link: "/expenses"
        },
        {
          id: "notif-4",
          title: "✦ Vault AI Strategic Synthesis Ready",
          message: "Your quarterly tax loss harvesting analysis is ready for executive review.",
          time: "2 days ago",
          type: "info",
          read: true,
          link: "/analytics"
        }
      ]
      setNotifications(initial)
      setUserSetting("bun_vault_notifications", JSON.stringify(initial))
    }

    // 2. Async cloud sync
    async function syncCloud() {
      const cloud = await getUserSetting("bun_vault_notifications")
      if (cloud) {
        try {
          const parsed = typeof cloud === 'string' ? JSON.parse(cloud) : cloud
          if (Array.isArray(parsed)) setNotifications(parsed)
        } catch(e) {}
      }
    }
    syncCloud()

    const handler = (e: any) => {
      const newNotif = e.detail
      setNotifications(prev => {
         const updated = [newNotif, ...prev]
         setUserSetting("bun_vault_notifications", JSON.stringify(updated))
         return updated
      })
    }
    window.addEventListener("bun-notify", handler)
    return () => window.removeEventListener("bun-notify", handler)
  }, [])

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    setUserSetting("bun_vault_notifications", JSON.stringify(updated))
    toast.success("All notifications marked as read")
  }

  const clearHistory = () => {
    setNotifications([])
    setUserSetting("bun_vault_notifications", JSON.stringify([]))
    toast.success("Audit trail cleared")
  }

  const deleteOne = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    setUserSetting("bun_vault_notifications", JSON.stringify(updated))
  }

  return (
    <div className="flex-1 space-y-6 pb-16 relative w-full max-w-full min-w-0 overflow-x-hidden">
      {/* 1. EXECUTIVE HEADER STRIP */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest gold-gradient-bg text-slate-950 flex items-center gap-1.5 shadow-sm">
               <Bell className="h-3.5 w-3.5" /> Activity & Alerts History
             </span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-mono">
             Notification Center
           </h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
             Real-time alerts, milestone celebrations, and market price notifications.
           </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
           {notifications.some(n => !n.read) && (
             <Button onClick={markAllRead} variant="outline" className="h-11 px-4 rounded-xl border-[#00E676]/40 text-[#00E676] hover:bg-[#00E676]/10 font-bold text-xs gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Mark All Read
             </Button>
           )}
           {notifications.length > 0 && (
             <Button onClick={clearHistory} variant="ghost" className="h-11 px-4 rounded-xl text-destructive hover:bg-destructive/10 font-bold text-xs gap-1.5">
                <Trash2 className="h-4 w-4" /> Clear History
             </Button>
           )}
        </div>
      </div>

      {/* 2. NOTIFICATIONS LIST */}
      <Card className="glass-panel border-[#F4C542]/40 shadow-2xl overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
         <CardHeader className="p-6 border-b border-border/40 pb-4 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#F4C542]" /> Recent Activity Feed
               </CardTitle>
               <CardDescription className="text-xs font-semibold">Chronological record of recent events and updates across your dashboard.</CardDescription>
            </div>
            <span className="badge-wealth text-xs">{notifications.filter(n => !n.read).length} Unread</span>
         </CardHeader>
         <CardContent className="p-0 divide-y divide-border/30">
            {notifications.length === 0 ? (
               <div className="p-16 text-center space-y-3">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                  <p className="font-extrabold text-foreground">Audit Log is Clean</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                     As recurring SIP cycles, price thresholds, or milestone percentage markers trigger, they will be archived here.
                  </p>
               </div>
            ) : (
               notifications.map(notif => {
                  const isUnread = !notif.read
                  return (
                     <div key={notif.id} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-[#151A21]/60 ${isUnread ? 'bg-[#F4C542]/5 border-l-4 border-l-[#F4C542]' : ''}`}>
                        <div className="flex items-start gap-4">
                           <div className={`p-3 rounded-2xl shrink-0 ${
                              notif.type === 'milestone' ? 'bg-amber-500/20 text-[#F4C542] border border-[#F4C542]/30' :
                              notif.type === 'alert' ? 'bg-red-500/20 text-destructive border border-destructive/30' :
                              notif.type === 'success' ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                           }`}>
                              {notif.type === 'milestone' ? <Trophy className="h-5 w-5 fill-current" /> :
                               notif.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> :
                               notif.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                               <Sparkles className="h-5 w-5" />}
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <h4 className={`text-base font-bold ${isUnread ? 'text-foreground' : 'text-foreground/90'}`}>
                                    {notif.title}
                                 </h4>
                                 {isUnread && <span className="h-2 w-2 rounded-full bg-[#F4C542] shrink-0 animate-pulse" />}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                 {notif.message}
                              </p>
                              <div className="text-[10px] font-mono font-bold text-muted-foreground/80 pt-1">
                                 Time Logged: {notif.time}
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                           {notif.link && (
                              <Link href={notif.link}>
                                 <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-1.5 h-9 border-border/60 hover:border-[#F4C542]">
                                    Open Module <ArrowRight className="h-3.5 w-3.5" />
                                 </Button>
                              </Link>
                           )}
                           <Button size="icon" variant="ghost" onClick={() => deleteOne(notif.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg">
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     </div>
                  )
               })
            )}
         </CardContent>
         <div className="p-4 border-t border-border/40 bg-slate-100 dark:bg-[#151A21]/60 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-[#00E676]">
               <ShieldCheck className="h-4 w-4" /> Activity Log Synced
            </span>
            <span>Total Events Archived: {notifications.length}</span>
         </div>
      </Card>
    </div>
  )
}
