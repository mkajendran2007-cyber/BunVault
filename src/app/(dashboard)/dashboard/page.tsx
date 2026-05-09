"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownRight, ArrowUpRight, ShieldAlert, Zap, Download, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from "@/lib/supabase"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const [totalInvestment, setTotalInvestment] = useState(0)
  const [currentValue, setCurrentValue] = useState(0)
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([])
  const [chartData, setChartData] = useState<{date: string, invested: number, current: number}[]>([])
  const [enrichedHoldings, setEnrichedHoldings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [age, setAge] = useState<number>(30)
  const [isAgeEditing, setIsAgeEditing] = useState(false)
  const [nifty, setNifty] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [gold, setGold] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [silver, setSilver] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    fetchDashboardData()
    fetchNifty()
    fetchMetals()
    setCurrentDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    
    const savedAge = localStorage.getItem('bun_vault_age')
    if (savedAge) {
       setAge(parseInt(savedAge, 10))
    }
  }, [])

  const handleSaveAge = () => {
    localStorage.setItem('bun_vault_age', age.toString())
    setIsAgeEditing(false)
  }

  const fetchNifty = async () => {
     try {
        const res = await fetch('/api/sync?symbol=^NSEI')
        if (res.ok) {
           const data = await res.json()
           setNifty({
              price: data.price || 0,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              loading: false
           })
        } else {
           setNifty(prev => ({ ...prev, loading: false }))
        }
     } catch (e) {
        setNifty(prev => ({ ...prev, loading: false }))
     }
  }

  const fetchMetals = async () => {
     try {
        const [gRes, sRes] = await Promise.all([
           fetch('/api/sync?symbol=GOLD_INR_1G'),
           fetch('/api/sync?symbol=SILVER_INR_1G')
        ])
        
        if (gRes.ok) {
           const gData = await gRes.json()
           setGold({ price: gData.price || 0, change: gData.change || 0, changePercent: gData.changePercent || 0, loading: false })
        } else {
           setGold(prev => ({ ...prev, loading: false }))
        }
        
        if (sRes.ok) {
           const sData = await sRes.json()
           setSilver({ price: sData.price || 0, change: sData.change || 0, changePercent: sData.changePercent || 0, loading: false })
        } else {
           setSilver(prev => ({ ...prev, loading: false }))
        }
     } catch (e) {
        setGold(prev => ({ ...prev, loading: false }))
        setSilver(prev => ({ ...prev, loading: false }))
     }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', user.id)
    
    if (!holdings || holdings.length === 0) {
      setLoading(false)
      return
    }

    let invested = 0
    let current = 0
    const allocation: Record<string, number> = { Equity: 0, "Mutual Fund": 0, Debt: 0, Crypto: 0, Commodity: 0 }
    const enriched = []

    for (const holding of holdings) {
      const holdingInv = holding.qty * holding.buy_price
      invested += holdingInv
      
      // Fetch live price
      let livePrice = holding.buy_price
      try {
         const res = await fetch(`/api/sync?symbol=${holding.symbol}`)
         const priceData = await res.json()
         if (priceData.price) livePrice = priceData.price
      } catch (e) {
         console.error("Failed to fetch price for", holding.symbol)
      }

      const holdingCurrentValue = holding.qty * livePrice
      current += holdingCurrentValue
      
      enriched.push({
         ...holding,
         livePrice,
         totalInvestment: holdingInv,
         currentValue: holdingCurrentValue
      })

      // Add to allocation
      if (allocation[holding.type] !== undefined) {
         allocation[holding.type] += holdingCurrentValue
      } else {
         allocation[holding.type] = holdingCurrentValue
      }
    }

    setEnrichedHoldings(enriched)
    setTotalInvestment(invested)
    setCurrentValue(current)

    // Format Pie Data
    const formattedPie = Object.keys(allocation)
      .filter(key => allocation[key] > 0)
      .map(key => ({ name: key, value: allocation[key] }))
    
    setPieData(formattedPie)
    setLoading(false)

    // Handle Daily Snapshots
    await handleDailySnapshot(user.id, invested, current)
  }

  const handleDailySnapshot = async (userId: string, invested: number, current: number) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if snapshot exists for today
    const { data: existingSnapshot } = await supabase
      .from('portfolio_snapshots')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      
    if (!existingSnapshot) {
      // Insert new snapshot
      await supabase.from('portfolio_snapshots').insert([{
         user_id: userId,
         date: today,
         total_investment: invested,
         current_value: current
      }])
    }
    
    // Fetch all snapshots for the current month
    const date = new Date()
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
    
    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('date', firstDay)
      .order('date', { ascending: true })
      
    if (snapshots) {
       // Format for chart: "May 01" etc
       const formatted = snapshots.map((s: any) => ({
          date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          invested: Number(s.total_investment),
          current: Number(s.current_value)
       }))
       
       setChartData(formatted)
    }
  }

  const handleManualSnapshot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         alert("Please login first.");
         return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingSnapshot, error: fetchErr } = await supabase
        .from('portfolio_snapshots')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (fetchErr) {
         alert("Database Error! Did you run the SQL script to create the table? Details: " + fetchErr.message);
         return;
      }

      if (existingSnapshot) {
         const { error: updateErr } = await supabase.from('portfolio_snapshots').update({
            total_investment: totalInvestment,
            current_value: currentValue
         }).eq('id', existingSnapshot.id)
         if (updateErr) throw updateErr;
      } else {
         const { error: insertErr } = await supabase.from('portfolio_snapshots').insert([{
            user_id: user.id,
            date: today,
            total_investment: totalInvestment,
            current_value: currentValue
         }])
         if (insertErr) throw insertErr;
      }
      
      // Re-fetch chart data
      const date = new Date()
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
      
      const { data: snapshots, error: snapErr } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .order('date', { ascending: true })
        
      if (snapErr) throw snapErr;

      if (snapshots) {
         const formatted = snapshots.map((s: any) => ({
            date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            invested: Number(s.total_investment),
            current: Number(s.current_value)
         }))
         setChartData(formatted)
         alert("Snapshot successfully captured with your latest real-time portfolio data!")
      }
    } catch (e: any) {
       alert("An error occurred: " + e.message);
    }
  }

  const exportToPDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         alert("Please login first.");
         return;
      }

      if (enrichedHoldings.length === 0) {
         alert("No holdings data available to export.");
         return;
      }

      // Fetch SIPs
      const { data: sips, error: sErr } = await supabase.from('sips').select('*').eq('user_id', user.id)
      if (sErr) throw sErr;

      // Initialize jsPDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height

      // --- Aesthetic Dark Background ---
      doc.setFillColor(15, 23, 42) // Slate 900 background
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // --- Generative Candlestick Pattern Background ---
      // We use GState to make it faint and blend into the background
      // @ts-ignore
      doc.setGState(new doc.GState({opacity: 0.04}))
      let startCandleX = 15;
      let startCandleY = pageHeight - 80;
      
      for (let i = 0; i < 15; i++) {
         const isGreen = Math.random() > 0.3; // Upward bias
         const bodyHeight = 10 + Math.random() * 30;
         const wickTop = 5 + Math.random() * 20;
         const wickBottom = 5 + Math.random() * 20;
         
         if (isGreen) {
            doc.setFillColor(16, 185, 129); // Emerald
            doc.setDrawColor(16, 185, 129);
            startCandleY -= (Math.random() * 15);
         } else {
            doc.setFillColor(239, 68, 68); // Red
            doc.setDrawColor(239, 68, 68);
            startCandleY += (Math.random() * 10);
         }

         doc.setLineWidth(0.8);
         doc.line(startCandleX + 4, startCandleY - wickTop, startCandleX + 4, startCandleY + bodyHeight + wickBottom);
         doc.rect(startCandleX, startCandleY, 8, bodyHeight, 'F');

         startCandleX += 14;
      }
      
      // Reset opacity for text
      // @ts-ignore
      doc.setGState(new doc.GState({opacity: 1.0}))

      // Title
      doc.setFontSize(26)
      doc.setTextColor(59, 130, 246)
      doc.text("BUN VAULT - AI WEALTH REPORT", pageWidth / 2, 22, { align: "center" })
      
      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184)
      doc.text(`Generated securely on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: "center" })

      // AI Insight Logic
      const safeAge = Math.min(100, Math.max(1, age));
      const equityPortion = (100 - safeAge) / 100;
      const safePortion = 1.0 - equityPortion;

      const targetAllocations: Record<string, number> = {
        "Equity": equityPortion * 0.6,
        "Mutual Fund": equityPortion * 0.4,
        "Debt": safePortion * 0.6,
        "Commodity": safePortion * 0.3,
        "Crypto": safePortion * 0.1,
      }

      const threshold = currentValue * 0.05
      let insightsText: string[] = []

      if (currentValue === 0) {
         insightsText.push("Your portfolio is currently empty. Start adding assets to get AI insights!")
      } else {
         Object.keys(targetAllocations).forEach(asset => {
           const targetVal = currentValue * targetAllocations[asset]
           const actualVal = pieData.find(p => p.name === asset)?.value || 0
           const diff = actualVal - targetVal

           if (Math.abs(diff) > threshold) {
              if (diff > 0) {
                 insightsText.push(`Overexposed in ${asset}: Consider moving Rs ${diff.toLocaleString(undefined, {maximumFractionDigits: 0})} to safer assets.`)
              } else {
                 insightsText.push(`Underexposed in ${asset}: Recommend investing Rs ${Math.abs(diff).toLocaleString(undefined, {maximumFractionDigits: 0})} here.`)
              }
           }
         })
         if (insightsText.length === 0) {
            insightsText.push("Perfectly Balanced! Your portfolio aligns perfectly with your age-based target.")
         }
      }

      // Section 1: AI Analysis
      let startY = 45
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text("1. AI Risk & Portfolio Health Analysis", 14, startY)
      
      doc.setFontSize(12)
      doc.setTextColor(200, 200, 200)
      startY += 10
      insightsText.forEach(text => {
         const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 28)
         doc.text(lines, 14, startY)
         startY += (lines.length * 7)
      })

      // Section 2: Portfolio Summary
      startY += 8
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text("2. Portfolio Summary", 14, startY)
      
      startY += 10
      doc.setFontSize(12)
      doc.setTextColor(200, 200, 200)
      doc.text(`Total Invested Capital: Rs ${totalInvestment.toLocaleString()}`, 14, startY)
      startY += 8
      doc.text(`Current Live Value: Rs ${currentValue.toLocaleString()}`, 14, startY)
      startY += 8
      const pl = currentValue - totalInvestment
      const plColor = pl >= 0 ? [16, 185, 129] : [239, 68, 68]
      doc.text("Overall Profit/Loss: ", 14, startY)
      doc.setTextColor(plColor[0], plColor[1], plColor[2])
      doc.text(`${pl >= 0 ? '+' : ''}Rs ${pl.toLocaleString()}`, 58, startY)

      // Section 3: Holdings Table
      startY += 18
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text("3. Current Holdings", 14, startY)
    
    const holdingsBody = enrichedHoldings.map(h => {
       const pl = h.currentValue - h.totalInvestment
       return [
         h.name,
         h.symbol,
         h.qty.toString(),
         `Rs ${h.buy_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
         `Rs ${h.totalInvestment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
         `Rs ${h.livePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
         `${pl >= 0 ? '+' : ''}Rs ${pl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
       ]
    })

      autoTable(doc, {
         startY: startY + 6,
         head: [['Asset', 'Symbol', 'Qty', 'Buy Price', 'Total Inv', 'Live Price', 'P&L']],
         body: holdingsBody,
         theme: 'grid',
         headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
         bodyStyles: { fillColor: [30, 41, 59], textColor: [200, 200, 200] },
         alternateRowStyles: { fillColor: [15, 23, 42] },
         margin: { left: 14, right: 14 },
         styles: { fontSize: 9 }
      })

      // Section 4: SIP Table
      // @ts-ignore
      let finalY = doc.lastAutoTable?.finalY || startY + 20
      
      if (sips && sips.length > 0) {
         finalY += 18
         doc.setFontSize(16)
         doc.setTextColor(255, 255, 255)
         doc.text("4. Active Systematic Investment Plans (SIPs)", 14, finalY)
         
         const sipsBody = sips.filter((s: any) => s.status === 'Active').map((s: any) => [
            s.name,
            s.type,
            `Rs ${s.amount.toLocaleString()}`,
            s.frequency,
            new Date(s.next_date).toLocaleDateString()
         ])

         autoTable(doc, {
            startY: finalY + 6,
            head: [['SIP Name', 'Type', 'Amount', 'Frequency', 'Next Date']],
            body: sipsBody,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
            bodyStyles: { fillColor: [30, 41, 59], textColor: [200, 200, 200] },
            alternateRowStyles: { fillColor: [15, 23, 42] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 }
         })
      }

      doc.save("bun_vault_ai_report_dark.pdf")
    } catch (e: any) {
       alert("Error generating PDF: " + e.message)
    }
  }

  const totalPL = currentValue - totalInvestment
  const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0

  return (
    <div className="flex-1 space-y-4">
      
      <div className="flex items-center justify-between pb-2">
         <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
         <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
               {currentDate}
            </span>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/10">
               <Download className="h-4 w-4" /> Export AI Report (PDF)
            </Button>
         </div>
      </div>

      {loading ? (
         <div className="p-12 text-center text-muted-foreground animate-pulse">Syncing live market data...</div>
      ) : (
      <>
      {/* Top Stats Row - Portfolio */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card className="glass-panel border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Portfolio Value</CardTitle>
            <Zap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight private-value">₹{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-primary flex items-center mt-2 font-medium">
              Live market sync active
            </p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investment</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-5 w-5 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight private-value">₹{totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Capital deployed
            </p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Profit/Loss</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className={`h-5 w-5 ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold tracking-tight private-value ${totalPL >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
               {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-sm mt-2 font-medium private-value ${totalPL >= 0 ? 'text-emerald-500/80' : 'text-destructive/80'}`}>
               {totalPL >= 0 ? '+' : ''}{plPercentage.toFixed(2)}% all time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats Row - Markets */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-card to-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
               <CardTitle className="text-sm font-semibold text-indigo-400 tracking-wide uppercase">NIFTY 50 Trend</CardTitle>
               <p className="text-[10px] text-muted-foreground">NSE Index • Live Feed</p>
            </div>
            {/* Beautiful Nifty50 Custom SVG Logo */}
            <div className="flex items-center bg-white/5 py-1 px-2 rounded-md border border-white/5 shadow-inner">
               <svg viewBox="0 0 160 50" className="h-7 w-auto flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <g transform="translate(5, 2)">
                    <path d="M12 40 V6" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M12 6 L28 34" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M28 34 V6" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M4 34 L12 24 L36 2" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" />
                    <rect x="12" y="44" width="4.5" height="4" fill="#312e81" />
                    <rect x="16.5" y="44" width="9" height="4" fill="#ef4444" />
                    <rect x="25.5" y="44" width="12" height="4" fill="#f97316" />
                    <rect x="37.5" y="44" width="13.5" height="4" fill="#eab308" />
                 </g>
                 <text x="60" y="32" fill="#e0e7ff" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="21" letter-spacing="-0.5">Nifty</text>
                 <text x="114" y="32" fill="#f87171" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="21" letter-spacing="-0.5">50</text>
               </svg>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {nifty.loading ? (
               <div className="space-y-2">
                 <div className="text-2xl font-bold text-muted-foreground animate-pulse">Syncing...</div>
                 <div className="h-4 w-24 bg-muted rounded animate-pulse" />
               </div>
            ) : (
               <>
                 <div>
                    <div className="text-3xl font-extrabold text-foreground">₹{(nifty.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${(nifty.change || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                       {(nifty.change || 0) >= 0 ? '▲' : '▼'} {(nifty.change || 0).toFixed(2)} ({(nifty.changePercent || 0) >= 0 ? '+' : ''}{(nifty.changePercent || 0).toFixed(2)}%)
                    </p>
                 </div>
                 
                 {/* Indian Market Indicator */}
                 <div className="pt-3 border-t border-indigo-500/10 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                          NSE India
                       </p>
                       <p className="text-[10px] text-muted-foreground">National Stock Exchange</p>
                    </div>
                    <div className="text-right">
                       <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${nifty.change >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {nifty.change >= 0 ? 'Bullish' : 'Bearish'}
                       </span>
                    </div>
                 </div>
               </>
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-card to-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.12)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
               <CardTitle className="text-sm font-semibold text-yellow-500 tracking-wide uppercase">Live Gold (1g)</CardTitle>
               <p className="text-[10px] text-muted-foreground">24 Karat • Live Rate</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
               <svg viewBox="0 0 24 24" className="h-6 w-6 text-yellow-500 filter drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                 <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="#eab308" strokeWidth="1" />
                 <circle cx="12" cy="12" r="7" fill="none" stroke="#ca8a04" strokeDasharray="3 2" />
                 <path d="M9 8h6M9 11h5.5M12 8c0 3-3 3-3 3h4.5M9.5 11l4.5 5" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                 <defs>
                   <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#fef08a" />
                     <stop offset="50%" stopColor="#eab308" />
                     <stop offset="100%" stopColor="#ca8a04" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {gold.loading ? (
               <div className="space-y-2">
                 <div className="text-2xl font-bold text-muted-foreground animate-pulse">Syncing...</div>
                 <div className="h-4 w-24 bg-muted rounded animate-pulse" />
               </div>
            ) : (
               <>
                 <div>
                    <div className="text-3xl font-extrabold text-foreground">₹{(gold.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${(gold.change || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                       {(gold.change || 0) >= 0 ? '▲' : '▼'} {(gold.change || 0).toFixed(2)} ({(gold.changePercent || 0) >= 0 ? '+' : ''}{(gold.changePercent || 0).toFixed(2)}%)
                    </p>
                 </div>
                 
                 {/* 10g Gold Coin details */}
                 <div className="pt-3 border-t border-yellow-500/10 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold text-yellow-500/90 flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="h-3 w-3 inline" fill="none" stroke="currentColor" strokeWidth="2">
                             <circle cx="12" cy="12" r="10" stroke="currentColor" />
                             <circle cx="12" cy="12" r="5" stroke="currentColor" />
                          </svg> 
                          Gold Coin (10g)
                       </p>
                       <p className="text-[10px] text-muted-foreground">Standard Investment Bar</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-foreground">₹{(gold.price * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                       <p className="text-[9px] text-emerald-500 font-medium">Prestige Grade</p>
                    </div>
                 </div>
               </>
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-slate-400/20 bg-gradient-to-br from-card to-slate-400/5 shadow-[0_0_15px_rgba(148,163,184,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(148,163,184,0.12)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
               <CardTitle className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Live Silver (1g)</CardTitle>
               <p className="text-[10px] text-muted-foreground">999 Fine • Live Rate</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-400/10 border border-slate-400/20">
               <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-300 filter drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                 <circle cx="12" cy="12" r="10" fill="url(#silverGradient)" stroke="#94a3b8" strokeWidth="1" />
                 <circle cx="12" cy="12" r="7" fill="none" stroke="#64748b" strokeDasharray="3 2" />
                 <path d="M9 8h6M9 11h5.5M12 8c0 3-3 3-3 3h4.5M9.5 11l4.5 5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                 <defs>
                   <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#f8fafc" />
                     <stop offset="50%" stopColor="#cbd5e1" />
                     <stop offset="100%" stopColor="#64748b" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {silver.loading ? (
               <div className="space-y-2">
                 <div className="text-2xl font-bold text-muted-foreground animate-pulse">Syncing...</div>
                 <div className="h-4 w-24 bg-muted rounded animate-pulse" />
               </div>
            ) : (
               <>
                 <div>
                    <div className="text-3xl font-extrabold text-foreground">₹{(silver.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${(silver.change || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                       {(silver.change || 0) >= 0 ? '▲' : '▼'} {(silver.change || 0).toFixed(2)} ({(silver.changePercent || 0) >= 0 ? '+' : ''}{(silver.changePercent || 0).toFixed(2)}%)
                    </p>
                 </div>
                 
                 {/* 100g Silver Coin/Bar details */}
                 <div className="pt-3 border-t border-slate-400/10 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="h-3 w-3 inline" fill="none" stroke="currentColor" strokeWidth="2">
                             <circle cx="12" cy="12" r="10" stroke="currentColor" />
                             <circle cx="12" cy="12" r="5" stroke="currentColor" />
                          </svg> 
                          Silver Coin (100g)
                       </p>
                       <p className="text-[10px] text-muted-foreground">Standard Minted Coin</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-foreground">₹{(silver.price * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                       <p className="text-[9px] text-emerald-500 font-medium">99.9% Pure</p>
                    </div>
                 </div>
               </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Growth Chart */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Portfolio Growth</CardTitle>
            <CardDescription>Daily snapshot of your invested capital vs current market value (This Month)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleManualSnapshot} className="gap-2">
             <Zap className="h-4 w-4 text-primary" /> Take Snapshot Now
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                   <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                     formatter={(value: number) => [`₹${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                   />
                   <Line type="monotone" name="Current Value" dataKey="current" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                   <Line type="monotone" name="Total Investment" dataKey="invested" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  Not enough historical data yet. A new snapshot was recorded today!
               </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Pie Chart */}
        <Card className="col-span-7 lg:col-span-4">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>
              Current distribution of your wealth based on live prices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">Add assets to see allocation</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                     <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium private-value">₹{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Insight */}
         <Card className="col-span-7 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle>AI Portfolio Health</CardTitle>
               <CardDescription>Smart insights based on your real data</CardDescription>
            </div>
            <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
               <span className="text-primary font-bold">
                  {pieData.length > 2 ? 'A' : 'B-'}
               </span>
            </div>
          </CardHeader>
           <CardContent>
             <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-sm font-medium">Target based on Age:</span>
                <div className="flex items-center gap-2">
                   {isAgeEditing ? (
                      <>
                         <input 
                            type="number" 
                            value={age} 
                            onChange={(e) => setAge(Number(e.target.value) || 0)} 
                            className="w-16 rounded-md border py-1 px-2 text-center text-sm bg-background" 
                            min="18" max="100" 
                         />
                         <span className="text-sm text-muted-foreground mr-2">Yrs</span>
                         <Button size="sm" variant="secondary" onClick={handleSaveAge}>Save</Button>
                      </>
                   ) : (
                      <>
                         <span className="font-bold">{age} <span className="text-muted-foreground font-normal text-sm">Yrs</span></span>
                         <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setIsAgeEditing(true)}>Edit</Button>
                      </>
                   )}
                </div>
             </div>
             <div className="space-y-4 max-h-[240px] overflow-auto pr-2">
               {(() => {
                  const safeAge = Math.min(100, Math.max(1, age));
                  const equityPortion = (100 - safeAge) / 100;
                  const safePortion = 1.0 - equityPortion;

                  const targetAllocations: Record<string, number> = {
                     "Equity": equityPortion * 0.6,
                     "Mutual Fund": equityPortion * 0.4,
                     "Debt": safePortion * 0.6,
                     "Commodity": safePortion * 0.3,
                     "Crypto": safePortion * 0.1,
                  }
                  
                  const actions: React.ReactNode[] = []
                  const threshold = currentValue * 0.05 // 5% tolerance
                  
                  let hasActions = false;

                  Object.keys(targetAllocations).forEach(asset => {
                     const targetVal = currentValue * targetAllocations[asset]
                     const actualVal = pieData.find(p => p.name === asset)?.value || 0
                     const diff = actualVal - targetVal

                     if (Math.abs(diff) > threshold && currentValue > 0) {
                        hasActions = true;
                        if (diff > 0) {
                           actions.push(
                              <div key={asset} className="flex items-start gap-3 rounded-lg border p-3 bg-destructive/5 border-destructive/20">
                                 <ArrowDownRight className="h-5 w-5 text-destructive mt-0.5" />
                                 <div>
                                    <p className="font-medium text-sm text-destructive">Reduce {asset} Exposure</p>
                                    <p className="text-xs text-muted-foreground mt-1">You are overexposed. Consider moving <strong className="private-value">₹{diff.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> into safer assets to maintain a balanced risk profile.</p>
                                 </div>
                              </div>
                           )
                        } else {
                           actions.push(
                              <div key={asset} className="flex items-start gap-3 rounded-lg border p-3 bg-emerald-500/5 border-emerald-500/20">
                                 <ArrowUpRight className="h-5 w-5 text-emerald-500 mt-0.5" />
                                 <div>
                                    <p className="font-medium text-sm text-emerald-500">Increase {asset} Allocation</p>
                                    <p className="text-xs text-muted-foreground mt-1">You are underexposed. We recommend investing <strong className="private-value">₹{Math.abs(diff).toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> here to reach the ideal portfolio target.</p>
                                 </div>
                              </div>
                           )
                        }
                     }
                  })

                  if (!hasActions && currentValue > 0) {
                     return (
                        <div className="flex items-start gap-3 rounded-lg border p-3 bg-primary/5 border-primary/20">
                           <Zap className="h-5 w-5 text-primary mt-0.5" />
                           <div>
                              <p className="font-medium text-sm text-primary">Perfectly Balanced!</p>
                              <p className="text-xs text-muted-foreground mt-1">Your portfolio is perfectly aligned with standard wealth management targets. No rebalancing needed right now.</p>
                           </div>
                        </div>
                     )
                  }

                  return actions;
               })()}
             </div>
           </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}
