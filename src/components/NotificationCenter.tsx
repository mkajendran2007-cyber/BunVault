"use client"

import { useState, useEffect, useRef } from "react"
import { fmtINR } from "@/lib/utils"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"
import { Bell, Check, Trash2, ExternalLink, Sparkles, Trophy, TrendingUp, Calendar, AlertCircle, X, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export type AppNotification = {
  id: string
  title: string
  message: string
  type: 'alert' | 'ai' | 'milestone' | 'sip' | 'market'
  time: string
  read: boolean
  link?: string
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Price Alert Triggered",
    message: "Tata Consultancy Services (TCS) reached your target price of ₹3,850.00 today.",
    type: "alert",
    time: "10 mins ago",
    read: false,
    link: "/watchlist"
  },
  {
    id: "notif-2",
    title: "Milestone Unlocked! 🎉",
    message: "You have achieved over 50% of your Retirement Fund goal target!",
    type: "milestone",
    time: "2 hours ago",
    read: false,
    link: "/goals"
  },
  {
    id: "notif-3",
    title: "Vault AI Briefing Ready",
    message: "Your portfolio health score is 85/100. AI suggests rebalancing Debt exposure.",
    type: "ai",
    time: "5 hours ago",
    read: false,
    link: "/ai-assistant"
  },
  {
    id: "notif-4",
    title: "SIP Top-up Due Reminder",
    message: "Scheduled monthly SIP contribution of ₹25,000 for Nifty 50 Index Fund is due tomorrow.",
    type: "sip",
    time: "1 day ago",
    read: true,
    link: "/sip-planner"
  },
  {
    id: "notif-5",
    title: "Market Update",
    message: "Indian Equity markets closed green today (+1.24%). Your equity portfolio gained ₹18,420.",
    type: "market",
    time: "2 days ago",
    read: true,
    link: "/analytics"
  }
]

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // 1. Synchronous fast load from local
    const saved = localStorage.getItem("bun_vault_notifications")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS)
          setUserSetting("bun_vault_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS))
        }
      } catch (e) {
        setNotifications(DEFAULT_NOTIFICATIONS)
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS)
      setUserSetting("bun_vault_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS))
    }

    // 2. Asynchronous cloud sync
    async function syncCloudNotifications() {
      const cloud = await getUserSetting("bun_vault_notifications")
      if (cloud) {
        try {
          const parsed = typeof cloud === 'string' ? JSON.parse(cloud) : cloud
          if (Array.isArray(parsed)) setNotifications(parsed)
        } catch(e) {}
      }
    }
    syncCloudNotifications()

    // Listen for custom notification events dispatched by Watchlist, Goals, Expenses, or Holdings
    const handleNewNotification = (e: any) => {
       if (e.detail) {
          const newNotif: AppNotification = {
             id: e.detail.id || crypto.randomUUID(),
             title: e.detail.title || "Vault Notification",
             message: e.detail.message || "",
             type: (e.detail.type === "success" || e.detail.type === "ai" || e.detail.type === "sip" || e.detail.type === "market" || e.detail.type === "milestone") ? e.detail.type : "alert",
             time: e.detail.time || "Just now",
             read: false,
             link: e.detail.link || (e.detail.title?.includes("Expense") || e.detail.title?.includes("Investment") ? "/expenses" : "/dashboard")
          }
          setNotifications(prev => {
             const updated = [newNotif, ...prev]
             setUserSetting("bun_vault_notifications", JSON.stringify(updated))
             return updated
          })
       }
    }

    // Nightly Daily Spend vs Invest Automated Summary Engine
    async function processNightly() {
      try {
        const todayStr = new Date().toISOString().split("T")[0]
        const lastSummaryDate = await getUserSetting("bun_vault_nightly_summary_date")
        const currentHour = new Date().getHours()
        
        // If it's evening/night (after 5 PM / 17:00) and user hasn't received today's summary yet
        if (lastSummaryDate !== todayStr && currentHour >= 17) {
          const expRaw = localStorage.getItem("bun_vault_expenses")
          if (expRaw) {
             const expList = JSON.parse(expRaw)
             const todayRecords = expList.filter((x: any) => x.date === todayStr)
             if (todayRecords.length > 0) {
                const todaySpend = todayRecords.filter((x: any) => x.category !== "SIP & Asset Investment").reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0)
                const todayInvest = todayRecords.filter((x: any) => x.category === "SIP & Asset Investment").reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0)
                
                const nightlyNotif: AppNotification = {
                   id: `nightly-${todayStr}`,
                   title: "🌙 Nightly Wealth & Spend Summary",
                   message: `Today's Briefing: You spent ₹${fmtINR(todaySpend)} across your accounts (SBI / Utkarsh CC) and deployed ₹${fmtINR(todayInvest)} into investments.`,
                   type: "ai",
                   time: "Just now",
                   read: false,
                   link: "/expenses"
                }

                setNotifications(prev => {
                   const exists = prev.some(n => n.id === nightlyNotif.id)
                   if (exists) return prev
                   const updated = [nightlyNotif, ...prev]
                   setUserSetting("bun_vault_notifications", JSON.stringify(updated))
                   return updated
                })
                setUserSetting("bun_vault_nightly_summary_date", todayStr)
             }
          }
        }
      } catch (e) {}
    }
    processNightly()

    window.addEventListener("bun-notify", handleNewNotification)
    return () => window.removeEventListener("bun-notify", handleNewNotification)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const saveAndSet = (updated: AppNotification[]) => {
    setNotifications(updated)
    setUserSetting("bun_vault_notifications", JSON.stringify(updated))
  }

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveAndSet(updated)
  }

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    saveAndSet(updated)
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = notifications.filter(n => n.id !== id)
    saveAndSet(updated)
  }

  const clearAll = () => {
    saveAndSet([])
  }

  const handleNotificationClick = (notif: AppNotification) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n)
    saveAndSet(updated)
    setIsOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: AppNotification['type']) => {
     switch (type) {
        case 'alert':
           return <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertCircle className="h-4 w-4" /></div>
        case 'ai':
           return <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20"><Sparkles className="h-4 w-4" /></div>
        case 'milestone':
           return <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><Trophy className="h-4 w-4" /></div>
        case 'sip':
           return <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20"><Calendar className="h-4 w-4" /></div>
        case 'market':
           return <div className="p-2 rounded-full bg-primary/10 text-primary border border-primary/20"><TrendingUp className="h-4 w-4" /></div>
        default:
           return <div className="p-2 rounded-full bg-muted text-muted-foreground"><Bell className="h-4 w-4" /></div>
     }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-10 w-10 rounded-full bg-secondary/60 hover:bg-secondary border border-border/40 text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground ring-2 ring-background animate-pulse shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[340px] sm:w-[380px] origin-top-right rounded-2xl bg-white dark:bg-[#0F141C] border-2 border-slate-300 dark:border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] z-[9999] opacity-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-100 dark:bg-[#151B26] border-b border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-foreground">Notification Center</span>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                     {unreadCount} new
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                     All caught up
                  </span>
                )}
             </div>
             
             <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                   <button
                     onClick={markAllRead}
                     className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                     title="Mark all as read"
                   >
                     <CheckCheck className="h-3.5 w-3.5" /> Read all
                   </button>
                )}
                {notifications.length > 0 && (
                   <button
                     onClick={clearAll}
                     className="text-xs font-semibold text-destructive/80 hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                     title="Clear all notifications"
                   >
                     <Trash2 className="h-3.5 w-3.5" />
                   </button>
                )}
                <button
                   onClick={() => setIsOpen(false)}
                   className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted ml-1"
                >
                   <X className="h-4 w-4" />
                </button>
             </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40 custom-scrollbar">
             {notifications.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 opacity-60">
                     <Bell className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No alerts right now</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Price targets, SIP reminders & AI insights will appear here.</p>
               </div>
             ) : (
               notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3.5 relative group border-b border-slate-100 dark:border-slate-800/60 ${
                      notif.read ? 'bg-white dark:bg-[#0F141C] hover:bg-slate-50 dark:hover:bg-[#151B26]' : 'bg-amber-500/10 dark:bg-[#F4C542]/10 hover:bg-amber-500/15'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <div className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    )}

                    {/* Type Icon */}
                    <div className="shrink-0 mt-0.5">
                       {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                       <div className="flex items-baseline justify-between gap-2">
                          <h4 className={`text-xs font-bold leading-tight truncate ${notif.read ? 'text-slate-800 dark:text-foreground/90' : 'text-slate-950 dark:text-foreground'}`}>
                             {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-muted-foreground shrink-0 font-mono font-bold">
                             {notif.time}
                          </span>
                       </div>
                       <p className="text-xs text-slate-600 dark:text-muted-foreground font-bold mt-1 leading-relaxed line-clamp-2">
                          {notif.message}
                       </p>
                    </div>

                   {/* Hover Action Buttons */}
                   <div className="absolute right-2.5 top-3.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                         <button
                           onClick={(e) => markAsRead(notif.id, e)}
                           className="p-1.5 rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/40"
                           title="Mark as read"
                         >
                           <Check className="h-3 w-3" />
                         </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="p-1.5 rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                   </div>
                 </div>
               ))
             )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 text-center">
             <span className="text-[10px] font-semibold text-muted-foreground/80">
                ⚡ Real-time alerts powered by Bun Vault Intelligence
             </span>
          </div>
        </div>
      )}
    </div>
  )
}
