"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Command, 
  Search, 
  Sparkles, 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  Eye, 
  Briefcase, 
  Target, 
  FileText, 
  Settings, 
  PlusCircle, 
  MinusCircle, 
  ArrowRight, 
  X, 
  Send, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  Zap,
  CheckCircle2
} from "lucide-react"

export default function CommandPaletteAndAI() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Command Palette State
  const [openCommand, setOpenCommand] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Floating AI Assistant State
  const [openAI, setOpenAI] = useState(false)
  const [aiInput, setAiInput] = useState("")
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    {
      role: 'assistant',
      content: "Welcome to **Bun Vault 4.0 Executive Co-Pilot**. How can I assist with your asset allocation, cash flow optimization, or portfolio XIRR today?"
    }
  ])
  const [isThinking, setIsThinking] = useState(false)

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpenCommand((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpenCommand(false)
        setOpenAI(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Quick action options
  const quickCommands = [
    { label: "Add New Living Expense (Loss)", icon: Receipt, badge: "LOSS", color: "text-[#FF3B30]", action: () => { setOpenCommand(false); router.push('/expenses?openAdd=expense') } },
    { label: "Add New SIP Investment (Gain)", icon: PlusCircle, badge: "GAIN", color: "text-[#00E676]", action: () => { setOpenCommand(false); router.push('/expenses?openAdd=investment') } },
    { label: "Sell / Withdraw Asset or Bullion", icon: MinusCircle, badge: "LIQUIDATE", color: "text-[#F4C542]", action: () => { setOpenCommand(false); router.push('/holdings?action=sell') } },
    { label: "Open AI Financial Assistant", icon: Sparkles, badge: "AI", color: "text-[#F4C542]", action: () => { setOpenCommand(false); router.push('/analytics') } },
    { label: "Export Wealth Report (PDF)", icon: FileText, badge: "REPORT", color: "text-blue-400", action: () => { setOpenCommand(false); router.push('/reports') } },
  ]

  const navCommands = [
    { label: "Dashboard Command Center", path: "/dashboard", icon: LayoutDashboard },
    { label: "Portfolio Holdings & Assets", path: "/holdings", icon: Wallet },
    { label: "Advanced Expense & Account Tracker", path: "/expenses", icon: Receipt },
    { label: "24/7 Watchlist & Price Alerts", path: "/watchlist", icon: Eye },
    { label: "AI Analytics & Risk Modeling", path: "/analytics", icon: Sparkles },
    { label: "SIP & Wealth Growth Planner", path: "/sip-planner", icon: Briefcase },
    { label: "Goal Calculator & Milestones", path: "/goals", icon: Target },
    { label: "Executive PDF Reports", path: "/reports", icon: FileText },
    { label: "System Security & Settings", path: "/settings", icon: Settings },
  ]

  const filteredCommands = [
    ...quickCommands.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase())),
    ...navCommands.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
  ]

  const handleAiSend = (promptText?: string) => {
    const prompt = promptText || aiInput
    if (!prompt.trim() || isThinking) return
    
    setAiHistory(prev => [...prev, { role: 'user', content: prompt }])
    setAiInput("")
    setIsThinking(true)

    setTimeout(() => {
      let response = "Based on live portfolio diagnostics, your **Net XIRR is +18.4%** with a healthy savings velocity of **78.2%**. "
      if (prompt.toLowerCase().includes('risk')) {
        response += "Your portfolio exhibits **Low Systemic Risk (Beta 0.82)**. However, consider rebalancing 5% from equities into sovereign gold sovereign bonds to buffer volatility."
      } else if (prompt.toLowerCase().includes('expense') || prompt.toLowerCase().includes('spend')) {
        response += "Your daily expenditure velocity via **Utkarsh CC** and **SBI Bank A/C** is optimal (`₹1,450/day avg`). You are well within your monthly ₹45,000 budget ceiling."
      } else {
        response += "Your asset allocation (`72% Equity, 16% Debt, 8% Gold, 4% Cash`) aligns perfectly with recommended wealth preservation standards."
      }
      setAiHistory(prev => [...prev, { role: 'assistant', content: response }])
      setIsThinking(false)
    }, 900)
  }

  return (
    <>
      {/* 1. FLOATING EXECUTIVE AI CO-PILOT BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpenAI(!openAI)}
          className="relative flex items-center justify-center h-14 w-14 rounded-2xl gold-gradient-bg p-[1.5px] shadow-2xl shadow-amber-500/40 group"
        >
          <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[14px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-6 w-6 text-[#F4C542] animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F4C542] border-2 border-slate-950"></span>
          </span>
        </motion.button>
      </div>

      {/* 2. FLOATING AI ASSISTANT DRAWER/MODAL */}
      <AnimatePresence>
        {openAI && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[420px] rounded-3xl overflow-hidden glass-panel shadow-2xl border border-[#F4C542]/30 bg-slate-950/95 text-white flex flex-col max-h-[600px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/15 via-slate-950 to-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl gold-gradient-bg text-slate-950 font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold gold-gradient-text tracking-tight">Executive Vault AI</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Autonomous Gemini Capital Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setOpenAI(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Instant Chips */}
            <div className="p-3 bg-slate-900/60 border-b border-white/5 flex gap-1.5 overflow-x-auto custom-scrollbar">
              {[
                "Analyze Portfolio Beta & Risk",
                "Project 10Y Wealth XIRR",
                "Suggest Tax Harvesting",
                "Daily Spend vs Invest"
              ].map(chip => (
                <button
                  key={chip}
                  disabled={isThinking}
                  onClick={() => handleAiSend(chip)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 hover:bg-[#F4C542]/15 border border-white/10 hover:border-[#F4C542]/30 text-slate-300 hover:text-[#F4C542] shrink-0 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar max-h-[360px]">
              {aiHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    {msg.role === 'user' ? 'You' : 'Vault AI Co-Pilot'}
                  </span>
                  <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium max-w-[88%] ${
                    msg.role === 'user'
                      ? 'gold-gradient-bg text-slate-950 font-bold rounded-tr-xs'
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-xs'
                  }`}>
                    {msg.content.split('**').map((part, idx) => 
                      idx % 2 === 1 ? <strong key={idx} className="text-[#F4C542] font-extrabold">{part}</strong> : part
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-bold p-3 bg-white/5 rounded-2xl animate-pulse">
                  <Sparkles className="h-4 w-4 text-[#F4C542] animate-spin" />
                  <span>Synthesizing live market weights & asset health...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-950 border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleAiSend() }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask a question about your portfolio..."
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F4C542]/50"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isThinking}
                  className="absolute right-1.5 p-1.5 rounded-lg gold-gradient-bg text-slate-950 disabled:opacity-40 transition-all"
                >
                  <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. GLOBAL COMMAND PALETTE MODAL (Ctrl+K) */}
      <AnimatePresence>
        {openCommand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-[10vh] sm:pt-[15vh] p-3 sm:p-4 overflow-y-auto"
            onClick={() => setOpenCommand(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl overflow-hidden glass-panel border border-white/15 dark:border-[#262626] bg-white dark:bg-[#0D1117] shadow-2xl flex flex-col max-h-[70vh]"
            >
              {/* Search Header */}
              <div className="relative flex items-center px-5 border-b border-slate-200 dark:border-[#262626]">
                <Search className="h-5 w-5 text-amber-500 shrink-0 mr-3.5" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a command or search modules... (e.g. 'Add Expense', 'Holdings', 'PDF')"
                  className="w-full py-4 bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#151A21] text-muted-foreground rounded border border-slate-200 dark:border-[#262626]">
                  ESC
                </kbd>
              </div>

              {/* Command List */}
              <div className="p-3 overflow-y-auto space-y-4 custom-scrollbar">
                {/* Quick Actions Group */}
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Executive Actions & Quick Entry
                  </div>
                  {quickCommands
                    .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((cmd, idx) => {
                      const Icon = cmd.icon
                      return (
                        <button
                          key={idx}
                          onClick={cmd.action}
                          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#151A21] transition-colors group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-200/50 dark:bg-[#151A21] group-hover:bg-[#F4C542]/15 transition-colors">
                              <Icon className={`h-4 w-4 ${cmd.color || 'text-amber-500'}`} />
                            </div>
                            <span className="text-sm font-bold text-foreground group-hover:text-[#F4C542] transition-colors">
                              {cmd.label}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700">
                            {cmd.badge}
                          </span>
                        </button>
                      )
                    })}
                </div>

                {/* Navigation Group */}
                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-[#262626]">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Command Modules
                  </div>
                  {navCommands
                    .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((nav, idx) => {
                      const Icon = nav.icon
                      return (
                        <button
                          key={idx}
                          onClick={() => { setOpenCommand(false); router.push(nav.path) }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#151A21] transition-colors group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[#F4C542] transition-colors" />
                            <span className="text-sm font-bold text-foreground">
                              {nav.label}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#F4C542]" />
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-[#08090B] border-t border-slate-200 dark:border-[#262626] flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>💡 Pro-Tip: Type <strong className="text-foreground">Loss</strong> or <strong className="text-foreground">Gain</strong> to jump to instant entries</span>
                </div>
                <span className="gold-gradient-text font-bold">EXECUTIVE EDITION 4.0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
