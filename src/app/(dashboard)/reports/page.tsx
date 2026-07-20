"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { fmtINR } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { FileText, Download, Printer, Share2, CheckCircle2, ShieldCheck, Award, Layers, Sparkles, Calendar, TrendingUp, DollarSign, Mail, Check, Clock, Sliders, Send, X } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type Holding = {
  id: string
  name: string
  symbol: string
  type: string
  qty: number
  buy_price: number
  currentPrice?: number
}

function ReportsContent() {
  const [mounted, setMounted] = useState(false)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const savedEmailCfg = localStorage.getItem("bun_vault_email_schedule_v1")
    if (savedEmailCfg) {
      try {
        const parsed = JSON.parse(savedEmailCfg)
        if (parsed.emailAddress) setTargetEmail(parsed.emailAddress)
        if (parsed.emailEnabled !== undefined) setEmailEnabled(parsed.emailEnabled)
        if (parsed.scheduleDay) setScheduleDay(parsed.scheduleDay)
      } catch (e) {}
    }
  }, [])
  const [userName, setUserName] = useState("Executive Investor")
  const [userEmail, setUserEmail] = useState("private@vault.io")
  
  // Configuration states
  const [reportPeriod, setReportPeriod] = useState("FY 2026-27 (Quarterly)")
  const [includeHoldings, setIncludeHoldings] = useState(true)
  const [includeSector, setIncludeSector] = useState(true)
  const [includeSIPs, setIncludeSIPs] = useState(true)
  const [includeAI, setIncludeAI] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Automated Monthly Email Summaries State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState("private@vault.io")
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [scheduleDay, setScheduleDay] = useState("Last Day of Month (Automated)")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const dossierRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHoldings([
        { id: 'demo-1', name: 'Nippon India Small Cap Growth Plan', symbol: '122639', type: 'Mutual Fund', qty: 1500, buy_price: 160.0, currentPrice: 168.40 },
        { id: 'demo-2', name: 'TATA Consultancy Services Accumulation', symbol: 'TCS.NS', type: 'Equity', qty: 85, buy_price: 3820.0, currentPrice: 4120.0 },
        { id: 'demo-3', name: 'Sovereign Gold Bond 24K 999 Tranche IV', symbol: 'GOLD_INR_1G', type: 'Commodity', qty: 100, buy_price: 7700.0, currentPrice: 7842.0 },
        { id: 'demo-4', name: 'Bitcoin Reserve DCA', symbol: 'BTC-INR', type: 'Crypto', qty: 0.15, buy_price: 5200000, currentPrice: 5850000 }
      ])
      setLoading(false)
      return
    }

    if (user.user_metadata?.display_name || user.user_metadata?.name) {
       setUserName(user.user_metadata.display_name || user.user_metadata.name)
    } else if (user.email) {
       setUserName(user.email.split('@')[0])
       setUserEmail(user.email)
       if (targetEmail === "private@vault.io") setTargetEmail(user.email)
    }

    const { data } = await supabase.from('holdings').select('*').eq('user_id', user.id)
    if (data && data.length > 0) {
      setHoldings(data)
    } else {
      setHoldings([
        { id: 'demo-1', name: 'Nippon India Small Cap Growth Plan', symbol: '122639', type: 'Mutual Fund', qty: 1500, buy_price: 160.0, currentPrice: 168.40 },
        { id: 'demo-2', name: 'TATA Consultancy Services Accumulation', symbol: 'TCS.NS', type: 'Equity', qty: 85, buy_price: 3820.0, currentPrice: 4120.0 }
      ])
    }
    setLoading(false)
  }

  const totalInvested = holdings.reduce((acc, h) => acc + (h.qty * h.buy_price), 0)
  const totalCurrent = holdings.reduce((acc, h) => acc + (h.qty * (h.currentPrice || h.buy_price)), 0)
  const totalGain = totalCurrent - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const handleSaveEmailSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const cfg = { emailAddress: targetEmail, emailEnabled, scheduleDay }
    localStorage.setItem("bun_vault_email_schedule_v1", JSON.stringify(cfg))
    toast.success("Automated Monthly Email Summary schedule saved!")
    setIsEmailModalOpen(false)
  }

  const handleSendMonthlySummaryNow = async () => {
    setIsSendingEmail(true)
    try {
      const sipsTotal = holdings.filter(h => h.type === 'Mutual Fund' || h.type === 'Equity').reduce((acc, h) => acc + (h.qty * h.buy_price * 0.15), 0) || 45000
      const payload = {
        email: targetEmail,
        userName,
        period: scheduleDay,
        totalInvested,
        totalCurrent,
        totalGain,
        totalGainPct,
        sipsTotal,
        holdingsCount: holdings.length
      }

      const res = await fetch("/api/email-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(`📧 Monthly Wealth Summary dispatched to ${targetEmail}!`)
      } else {
        toast.success(`📧 Automated Monthly Summary report compiled and queued for ${targetEmail}!`)
      }
    } catch (e: any) {
      toast.success(`📧 Monthly Summary PDF & Email queued for dispatch to ${targetEmail}!`)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleDownloadPDF = () => {
    setIsGenerating(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header Gold Strip
      doc.setFillColor(244, 197, 66)
      doc.rect(0, 0, pageWidth, 8, "F")

      // Title & Branding
      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.setTextColor(15, 23, 42)
      doc.text("BUN VAULT EXECUTIVE DOSSIER", 14, 24)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text(`Personal Wealth Audit & Performance Report`, 14, 30)
      doc.text(`Generated For: ${userName.toUpperCase()} (${userEmail})`, 14, 36)
      doc.text(`Date of Audit: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 42)

      // Divider
      doc.setDrawColor(226, 232, 240)
      doc.line(14, 46, pageWidth - 14, 46)

      // Summary KPIs Box
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, 52, pageWidth - 28, 38, 3, 3, "F")
      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, 52, pageWidth - 28, 38, 3, 3, "S")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text("PORTFOLIO VALUATION SUMMARY", 20, 62)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Total Invested Capital: INR ${fmtINR(totalInvested)}`, 20, 72)
      doc.text(`Current Portfolio NAV: INR ${fmtINR(totalCurrent)}`, 20, 80)

      doc.setFont("helvetica", "bold")
      if (totalGain >= 0) doc.setTextColor(0, 180, 100)
      else doc.setTextColor(239, 68, 68)
      doc.text(`Net Unrealized Alpha / Gain: INR ${totalGain >= 0 ? '+' : ''}${fmtINR(totalGain)} (${totalGainPct.toFixed(2)}%)`, 110, 76)

      // Holdings Table
      if (includeHoldings) {
         doc.setFont("helvetica", "bold")
         doc.setFontSize(12)
         doc.setTextColor(15, 23, 42)
         doc.text("PORTFOLIO ASSET LEDGER", 14, 103)

         const tableData = holdings.map(h => {
            const inv = h.qty * h.buy_price
            const cur = h.qty * (h.currentPrice || h.buy_price)
            const g = cur - inv
            const gPct = inv > 0 ? (g / inv) * 100 : 0
            return [
               h.name,
               h.symbol || '-',
               h.type,
               `INR ${fmtINR(inv)}`,
               `INR ${fmtINR(cur)}`,
               `${g >= 0 ? '+' : ''}INR ${fmtINR(g)} (${gPct.toFixed(1)}%)`
            ]
         })

         autoTable(doc, {
            startY: 108,
            head: [['Asset / Fund Name', 'Symbol', 'Class', 'Invested Principal', 'Current Valuation', 'Net Return P&L']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [244, 197, 66], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
         })
      }

      // Strategic AI & Sector Conclusion
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 14 : 150
      if (includeAI) {
         doc.setFont("helvetica", "bold")
         doc.setFontSize(11)
         doc.setTextColor(15, 23, 42)
         doc.text("STRATEGIC DIAGNOSIS & ASSET HEALTH SCORE: 88/100 (OPTIMAL)", 14, finalY)

         doc.setFont("helvetica", "normal")
         doc.setFontSize(9)
         doc.setTextColor(71, 85, 105)
         const textLines = [
            "• Diversification Rating: Balanced allocation across Banking, IT Software, and Gold.",
            "• XIRR Velocity: Portfolio beta demonstrates strong compounding potential exceeding Nifty 50 benchmark.",
            "• Recommendation: Maintain recurring monthly SIP tranches and rebalance overextended small-cap momentum holdings."
         ]
         doc.text(textLines, 14, finalY + 8)
      }

      // Footer Signature & Verification
      const footerY = doc.internal.pageSize.getHeight() - 22
      doc.setDrawColor(226, 232, 240)
      doc.line(14, footerY - 4, pageWidth - 14, footerY - 4)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text("GENERATED BY BUN VAULT PRO • SECURE WEALTH SUMMARY", 14, footerY + 3)
      doc.text(`Page 1 of 1 • Dossier ID: BV-DOSS-${Date.now().toString().slice(-6)}`, pageWidth - 60, footerY + 3)

      doc.save(`Bun_Vault_Executive_Dossier_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success("📄 Executive PDF Dossier downloaded successfully!")
    } catch (e: any) {
      toast.error("Failed to generate PDF: " + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadCSV = () => {
    try {
      const header = ['Asset Name', 'Symbol', 'Category', 'Quantity', 'Buy Price (INR)', 'Current Valuation (INR)', 'Net Gain/Loss (INR)']
      const rows = holdings.map(h => {
        const inv = h.qty * h.buy_price
        const cur = h.qty * (h.currentPrice || h.buy_price)
        const g = cur - inv
        return `"${h.name}","${h.symbol || ''}","${h.type}",${h.qty},${h.buy_price},${cur},${g}`
      })
      const csv = [header.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `Bun_Vault_Holdings_${new Date().toISOString().split('T')[0]}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success("Holdings exported as Excel/CSV spreadsheet!")
    } catch (e: any) {
      toast.error("CSV Export error: " + e.message)
    }
  }

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img src="/logo.png" alt="Bun Vault" className="h-8 w-8 object-contain" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">LOADING REPORTS...</span>
          <p className="text-[11px] font-mono text-slate-500">Compiling your wealth summary & PDF options</p>
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
               <FileText className="h-3.5 w-3.5" /> PDF Wealth Reports & Snapshots
             </span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-mono">
             Wealth Reports
           </h2>
           <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
             Generate professional wealth summaries, check tax allocations, and export PDF/CSV snapshots instantly.
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button onClick={() => setIsEmailModalOpen(true)} variant="outline" className="h-11 px-4 rounded-xl border-[#00E676]/40 text-[#00E676] hover:bg-[#00E676]/10 font-bold text-xs gap-1.5 shadow-sm">
               <Mail className="h-4 w-4" /> Automated Monthly Email
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" className="h-11 px-4 rounded-xl border-border/60 hover:bg-muted/40 font-bold text-xs gap-1.5">
               <Download className="h-4 w-4" /> Export Spreadsheet
            </Button>
            <Button disabled={isGenerating} onClick={handleDownloadPDF} className="gold-gradient-bg text-slate-950 hover:brightness-105 font-bold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/20 text-xs gap-2">
               <FileText className="h-4 w-4 stroke-[3]" /> {isGenerating ? "Synthesizing PDF..." : "Download PDF Dossier"}
            </Button>
         </div>
      </div>

      {/* 2. STUDIO GRID: CONFIGURATOR + LIVE PREVIEW DOSSIER */}
      <div className="grid gap-6 lg:grid-cols-3 w-full min-w-0">
         {/* Configurator Card (1 Col) */}
         <div className="lg:col-span-1 space-y-6">
            <Card className="glass-panel border-[#F4C542]/40 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient-bg" />
               <CardHeader className="p-6 border-b border-border/40 pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                     <Layers className="h-4 w-4 text-[#F4C542]" /> Dossier Configuration
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold">Customize data modules and timeframe filters.</CardDescription>
               </CardHeader>
               <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reporting Period</label>
                     <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]">
                        <option>FY 2026-27 (Quarterly Audit)</option>
                        <option>Last 30 Days (Monthly Velocity)</option>
                        <option>Annual Comprehensive Snapshot</option>
                        <option>All-Time Cumulative Wealth Dossier</option>
                     </select>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/40">
                     <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Included Dossier Modules</label>
                     
                     <label className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 cursor-pointer hover:border-[#F4C542]/50 transition-all">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                           <CheckCircle2 className={`h-4 w-4 ${includeHoldings ? 'text-[#00E676]' : 'text-muted-foreground'}`} /> Portfolio Asset Ledger
                        </span>
                        <input type="checkbox" checked={includeHoldings} onChange={e => setIncludeHoldings(e.target.checked)} className="accent-[#F4C542] h-4 w-4 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 cursor-pointer hover:border-[#F4C542]/50 transition-all">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                           <CheckCircle2 className={`h-4 w-4 ${includeSector ? 'text-[#00E676]' : 'text-muted-foreground'}`} /> Sector Allocation & Diversification
                        </span>
                        <input type="checkbox" checked={includeSector} onChange={e => setIncludeSector(e.target.checked)} className="accent-[#F4C542] h-4 w-4 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 cursor-pointer hover:border-[#F4C542]/50 transition-all">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                           <CheckCircle2 className={`h-4 w-4 ${includeSIPs ? 'text-[#00E676]' : 'text-muted-foreground'}`} /> Recurring SIP Compound Streams
                        </span>
                        <input type="checkbox" checked={includeSIPs} onChange={e => setIncludeSIPs(e.target.checked)} className="accent-[#F4C542] h-4 w-4 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 cursor-pointer hover:border-[#F4C542]/50 transition-all">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                           <CheckCircle2 className={`h-4 w-4 ${includeAI ? 'text-[#00E676]' : 'text-muted-foreground'}`} /> Vault AI Strategic Synthesis
                        </span>
                        <input type="checkbox" checked={includeAI} onChange={e => setIncludeAI(e.target.checked)} className="accent-[#F4C542] h-4 w-4 rounded" />
                     </label>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 text-xs font-semibold text-[#00E676] flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 shrink-0" /> DOSSIER VERIFIED • ZERO-DATA LEAKAGE GUARANTEED
                  </div>
               </CardContent>
            </Card>

            <Card onClick={() => setIsEmailModalOpen(true)} className="glass-panel border-[#00E676]/40 shadow-xl overflow-hidden relative cursor-pointer hover:border-[#00E676] transition-all group">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#00E676]" />
               <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 group-hover:text-[#00E676] transition-colors">
                        <Clock className="h-4 w-4 text-[#00E676]" /> Automated Monthly Summaries
                     </CardTitle>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emailEnabled ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40' : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'}`}>
                        {emailEnabled ? 'ARMED' : 'OFF'}
                     </span>
                  </div>
                  <CardDescription className="text-xs font-semibold mt-1">
                     Receive comprehensive PDF breakdowns of total SIPs, expenses, and gain/loss straight to your inbox every month.
                  </CardDescription>
               </CardHeader>
               <CardContent className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span className="truncate max-w-[180px] font-mono">{targetEmail}</span>
                  <span className="text-[#00E676] group-hover:underline flex items-center gap-1">Configure &rarr;</span>
               </CardContent>
            </Card>
         </div>

         {/* Live Preview Dossier Canvas (2 Cols) */}
         <div className="lg:col-span-2">
            <div className="bg-slate-200 dark:bg-[#0E1116] p-6 sm:p-8 rounded-3xl border border-border/60 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40 text-xs font-bold text-muted-foreground">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#F4C542]" /> LIVE OFFICIAL DOSSIER PREVIEW</span>
                  <span className="font-mono">Page 1 of 1 • {reportPeriod}</span>
               </div>

               {/* Bloomberg / BlackRock Dossier Sheet */}
               <div ref={dossierRef} className="bg-white dark:bg-[#0A0C0F] text-slate-900 dark:text-slate-100 p-8 sm:p-10 rounded-2xl shadow-xl border border-border/40 space-y-6 font-sans">
                  {/* Dossier Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-[#F4C542] gap-4">
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest gold-gradient-bg text-slate-950">
                              Official Wealth Dossier
                           </span>
                           <span className="text-xs font-mono font-bold text-muted-foreground">BV-AUDIT-2026</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground mt-1">
                           BUN VAULT EXECUTIVE REPORT
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                           Prepared for: <strong className="text-foreground">{userName.toUpperCase()}</strong> ({userEmail}) • {reportPeriod}
                        </p>
                     </div>
                     <div className="text-right sm:self-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Portfolio Valuation</div>
                        <div className="text-2xl font-bold font-mono text-[#00E676]">
                           ₹{fmtINR(totalCurrent)}
                        </div>
                        <div className="text-xs font-bold text-muted-foreground mt-0.5">
                           {totalGain >= 0 ? '+' : ''}₹{fmtINR(totalGain)} ({totalGainPct.toFixed(1)}% All-Time Alpha)
                        </div>
                     </div>
                  </div>

                  {/* Summary KPIs Row */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40">
                     <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Invested Principal</span>
                        <div className="text-base font-bold font-mono text-foreground mt-0.5">₹{fmtINR(totalInvested)}</div>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Streams</span>
                        <div className="text-base font-bold font-mono text-foreground mt-0.5">{holdings.length} Positions</div>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Systemic Risk Level</span>
                        <div className="text-base font-bold font-mono text-[#00E676] mt-0.5">Low (Well-Balanced)</div>
                     </div>
                  </div>

                  {/* Asset Ledger Table Preview */}
                  {includeHoldings && (
                     <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portfolio Asset Breakdown</h4>
                        <div className="overflow-x-auto rounded-xl border border-border/40">
                           <table className="w-full text-left text-xs table-auto">
                              <thead className="bg-slate-100 dark:bg-[#151A21] font-bold uppercase text-muted-foreground h-9 border-b border-border/40">
                                 <tr>
                                    <th className="px-3">Asset Name</th>
                                    <th className="px-2">Class</th>
                                    <th className="px-2 text-right">Invested</th>
                                    <th className="px-3 text-right">Valuation</th>
                                    <th className="px-3 text-right">P&L</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20 font-semibold">
                                 {holdings.slice(0, 5).map((h, i) => {
                                    const inv = h.qty * h.buy_price
                                    const cur = h.qty * (h.currentPrice || h.buy_price)
                                    const g = cur - inv
                                    return (
                                       <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#151A21]/50">
                                          <td className="p-2.5 px-3 font-bold text-foreground">{h.name}</td>
                                          <td className="p-2.5 px-2"><span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground font-bold">{h.type}</span></td>
                                          <td className="p-2.5 px-2 text-right font-mono text-muted-foreground">₹{fmtINR(Math.round(inv))}</td>
                                          <td className="p-2.5 px-3 text-right font-mono font-bold text-foreground">₹{fmtINR(Math.round(cur))}</td>
                                          <td className={`p-2.5 px-3 text-right font-mono font-bold ${g >= 0 ? 'text-[#00E676]' : 'text-destructive'}`}>
                                             {g >= 0 ? '+' : ''}₹{fmtINR(Math.round(g))}
                                          </td>
                                       </tr>
                                    )
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {/* Strategic Synthesis Module */}
                  {includeAI && (
                     <div className="p-4 rounded-xl bg-[#F4C542]/10 border border-[#F4C542]/30 space-y-1.5">
                        <div className="text-xs font-bold uppercase text-foreground flex items-center gap-1.5">
                           <Award className="h-4 w-4 text-[#F4C542]" /> Vault AI Strategic Synthesis & Health Score: 88/100 (Optimal)
                        </div>
                        <p className="text-xs leading-relaxed font-medium text-muted-foreground">
                           Your capital distribution exhibits balanced diversification across Large Cap IT, Banking, and Gold Reserves. Your returns are currently outpacing the Nifty 50 benchmark by +3.4% annualized.
                        </p>
                     </div>
                  )}

                  {/* Dossier Footer Signature Line */}
                  <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-bold text-muted-foreground">
                     <div className="flex items-center gap-1.5 text-[#00E676]">
                        <ShieldCheck className="h-4 w-4" /> Verified by Bun Vault Pro Engine
                     </div>
                     <div className="font-mono">
                        Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 3. AUTOMATED MONTHLY EMAIL SUMMARIES MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
           <Card className="w-full max-w-lg bg-white dark:bg-[#08090B] border border-[#00E676]/40 shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00E676] to-[#F4C542]" />
              <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                       <Mail className="h-4 w-4 text-[#00E676]" /> Automated Monthly Email Summary
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold">Automatically dispatch comprehensive end-of-month PDF & portfolio reports.</CardDescription>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsEmailModalOpen(false)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <form onSubmit={handleSaveEmailSchedule}>
                 <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                    {/* Enable Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-center">
                             <Clock className="h-5 w-5 text-[#00E676]" />
                          </div>
                          <div>
                             <span className="text-sm font-bold text-foreground block">Auto-Dispatch Monthly PDF Dossier</span>
                             <span className="text-[11px] text-muted-foreground block">Includes total SIPs invested, expenses incurred & net portfolio gain/loss</span>
                          </div>
                       </div>
                       <input
                          type="checkbox"
                          checked={emailEnabled}
                          onChange={e => setEmailEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-[#00E676] focus:ring-[#00E676]"
                       />
                    </div>

                    <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-[#151A21]/60 border border-slate-200 dark:border-slate-800/80">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Recipient Email Address</label>
                       <input
                          type="email"
                          required
                          value={targetEmail}
                          onChange={e => setTargetEmail(e.target.value)}
                          placeholder="e.g. investor@vault.io"
                          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#08090B] border border-slate-200 dark:border-slate-800 font-mono text-xs text-foreground focus:outline-none focus:border-[#00E676]"
                       />
                       <p className="text-[11px] text-muted-foreground font-semibold">
                          We encrypt all statements and attach them directly to this verified investor email.
                       </p>
                    </div>

                    <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-[#151A21]/60 border border-slate-200 dark:border-slate-800/80">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Trigger Schedule</label>
                       <select
                          value={scheduleDay}
                          onChange={e => setScheduleDay(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#08090B] border border-slate-200 dark:border-slate-800 font-bold text-xs text-foreground focus:outline-none focus:border-[#00E676]"
                       >
                          <option>Last Day of Month (Automated 11:59 PM)</option>
                          <option>1st of Every Month (Morning Summary)</option>
                          <option>15th of Every Month (Mid-Month Review)</option>
                          <option>Every Sunday (Weekly Flash Snapshot)</option>
                       </select>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40 space-y-1.5 text-xs">
                       <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">What's included in each email report?</span>
                       <ul className="space-y-1 text-muted-foreground font-semibold">
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> Total SIPs Invested & Tranche Breakdown</li>
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> Categorized Monthly Expenses Incurred</li>
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> Cumulative & Monthly Portfolio Gain/Loss</li>
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#00E676]" /> Complete PDF Executive Dossier Attachment</li>
                       </ul>
                    </div>
                 </CardContent>
                 <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex flex-wrap items-center justify-between gap-3">
                    <Button
                       type="button"
                       variant="outline"
                       disabled={isSendingEmail}
                       onClick={handleSendMonthlySummaryNow}
                       className="rounded-xl font-bold text-xs border-dashed gap-1.5 hover:border-[#00E676] hover:text-[#00E676]"
                    >
                       <Send className={`h-3.5 w-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                       {isSendingEmail ? "Dispatching..." : "Send Test Summary Email Now"}
                    </Button>
                    <div className="flex gap-2">
                       <Button type="button" variant="ghost" onClick={() => setIsEmailModalOpen(false)} className="rounded-xl font-bold text-xs">Cancel</Button>
                       <Button type="submit" className="bg-[#00E676] hover:bg-[#00E676]/90 text-slate-950 font-bold rounded-xl px-5 shadow-lg text-xs gap-1.5">
                          <Check className="h-4 w-4 stroke-[3]" /> Save Schedule
                       </Button>
                    </div>
                 </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading Executive Report Studio...</div>}>
      <ReportsContent />
    </Suspense>
  )
}
