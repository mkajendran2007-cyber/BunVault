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
  const [ageInput, setAgeInput] = useState<string>("30")
  const [isAgeEditing, setIsAgeEditing] = useState(false)
  const [nifty, setNifty] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [gold, setGold] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [silver, setSilver] = useState({ price: 0, change: 0, changePercent: 0, loading: true })
  const [currentDate, setCurrentDate] = useState("")
  const [isMarketOpen, setIsMarketOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchMarketData()
    setCurrentDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    
    const savedAge = localStorage.getItem('bun_vault_age')
    if (savedAge) {
       setAge(parseInt(savedAge, 10))
    }

    // Determine if Indian market is currently trading
    const checkMarketStatus = () => {
       const istNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
       const istDate = new Date(istNow);
       const day = istDate.getDay(); // 0 (Sun) to 6 (Sat)
       const hours = istDate.getHours();
       const mins = istDate.getMinutes();
       const absoluteMins = (hours * 60) + mins;

       // Mon(1) to Fri(5) and 9:15 AM to 3:30 PM IST
       const isOpen = (day >= 1 && day <= 5) && (absoluteMins >= 555 && absoluteMins <= 930);
       setIsMarketOpen(isOpen);
    }

    checkMarketStatus();

    // Background sync ticker every 60 seconds
    const ticker = setInterval(() => {
       fetchDashboardData()
       fetchMarketData()
       checkMarketStatus()
    }, 60000);

    return () => clearInterval(ticker);
  }, [])

  const handleSaveAge = () => {
    const parsed = parseInt(ageInput, 10) || 30
    setAge(parsed)
    localStorage.setItem('bun_vault_age', parsed.toString())
    setIsAgeEditing(false)
  }

  const fetchMarketData = async () => {
     try {
        const res = await fetch('/api/sync?symbols=^NSEI,GOLD_INR_1G,SILVER_INR_1G');
        if (!res.ok) {
           throw new Error("Network fail");
        }
        const data = await res.json();
        
        // Extract Nifty
        const niftyData = data['^NSEI'];
        if (niftyData) {
           setNifty({
              price: niftyData.price || 0,
              change: niftyData.change || 0,
              changePercent: niftyData.changePercent || 0,
              loading: false
           });
        } else {
           setNifty(prev => ({ ...prev, loading: false }));
        }

        // Extract Gold
        const goldData = data['GOLD_INR_1G'];
        if (goldData) {
           setGold({
              price: goldData.price || 0,
              change: goldData.change || 0,
              changePercent: goldData.changePercent || 0,
              loading: false
           });
        } else {
           setGold(prev => ({ ...prev, loading: false }));
        }

        // Extract Silver
        const silverData = data['SILVER_INR_1G'];
        if (silverData) {
           setSilver({
              price: silverData.price || 0,
              change: silverData.change || 0,
              changePercent: silverData.changePercent || 0,
              loading: false
           });
        } else {
           setSilver(prev => ({ ...prev, loading: false }));
        }
     } catch (e) {
        setNifty(prev => ({ ...prev, loading: false }));
        setGold(prev => ({ ...prev, loading: false }));
        setSilver(prev => ({ ...prev, loading: false }));
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

    // Fetch all unique symbols in bulk to maximize speed
    const uniqueSymbols = Array.from(new Set(
      holdings
        .filter(h => !(h.type === 'Debt' && h.symbol?.startsWith('FDRD_')))
        .map(h => h.symbol)
        .filter(Boolean)
    ));

    let priceMap: Record<string, any> = {};
    
    if (uniqueSymbols.length > 0) {
       try {
          const res = await fetch(`/api/sync?symbols=${uniqueSymbols.map(encodeURIComponent).join(',')}`)
          if (res.ok) {
             priceMap = await res.json();
          }
       } catch (e) {
          console.error("Dashboard bulk sync error:", e);
       }
    }

    // Enrich data with batch resolved prices
    const enriched = holdings.map((holding) => {
      const holdingInv = holding.qty * holding.buy_price
      
      let livePrice = holding.buy_price
      if (holding.type === 'Debt' && holding.symbol?.startsWith('FDRD_')) {
         livePrice = parseFloat(holding.symbol.replace('FDRD_', '')) || holding.buy_price;
      } else {
         const priceData = priceMap[holding.symbol];
         if (priceData?.price) livePrice = priceData.price;
      }

      const holdingCurrentValue = holding.qty * livePrice

      return {
         ...holding,
         livePrice,
         totalInvestment: holdingInv,
         currentValue: holdingCurrentValue
      }
    })

    // Aggregate values synchronously
    for (const h of enriched) {
       invested += h.totalInvestment
       current += h.currentValue

       if (allocation[h.type] !== undefined) {
          allocation[h.type] += h.currentValue
       } else {
          allocation[h.type] = h.currentValue
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

    // Handle Daily Snapshots with full breakdown
    await handleDailySnapshot(user.id, invested, current, allocation)
  }

  const handleDailySnapshot = async (userId: string, invested: number, current: number, allocationMap: any) => {
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
         current_value: current,
         asset_breakdown: allocationMap
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

      // Construct runtime breakdown object for manual save too
      const currentBreakdown: Record<string, number> = { Equity: 0, "Mutual Fund": 0, Debt: 0, Crypto: 0, Commodity: 0 };
      enrichedHoldings.forEach(h => {
         if (currentBreakdown[h.type] !== undefined) {
            currentBreakdown[h.type] += h.currentValue;
         } else {
            currentBreakdown[h.type] = h.currentValue;
         }
      });

      if (existingSnapshot) {
         const { error: updateErr } = await supabase.from('portfolio_snapshots').update({
            total_investment: totalInvestment,
            current_value: currentValue,
            asset_breakdown: currentBreakdown
         }).eq('id', existingSnapshot.id)
         if (updateErr) throw updateErr;
      } else {
         const { error: insertErr } = await supabase.from('portfolio_snapshots').insert([{
            user_id: user.id,
            date: today,
            total_investment: totalInvestment,
            current_value: currentValue,
            asset_breakdown: currentBreakdown
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

      // Fetch and embed app logo
      const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      let logoBase64 = "";
      try {
         logoBase64 = await getBase64ImageFromUrl('/logo.png');
      } catch (e) {
         console.warn("Could not fetch logo for PDF", e);
      }

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

      // Logo and Title Section
      let titleY = 26;
      if (logoBase64) {
         // Draw a small logo circle or square next to title
         doc.setFillColor(255, 255, 255);
         doc.roundedRect(14, 12, 12, 12, 2, 2, 'F');
         doc.addImage(logoBase64, 'PNG', 15, 13, 10, 10);
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(24)
      doc.setTextColor(59, 130, 246) // Royal Blue
      doc.text("BUN VAULT", logoBase64 ? 30 : 14, 21)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184) // Muted text
      doc.text("INTELLIGENT WEALTH REPORT", logoBase64 ? 30 : 14, 26)
      
      doc.setFontSize(9)
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 14, 21, { align: "right" })

      // Decorative separating line
      doc.setDrawColor(51, 65, 85)
      doc.setLineWidth(0.5)
      doc.line(14, 32, pageWidth - 14, 32)

      // --- RENDER START ---
      let startY = 42;

      // Section 1: Executive Summary
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text("1. EXECUTIVE PORTFOLIO SUMMARY", 14, startY)
      startY += 10

      // Calculation logic
      const pl = currentValue - totalInvestment
      const plColor = pl >= 0 ? [16, 185, 129] : [239, 68, 68]
      const plPercent = totalInvestment > 0 ? ((pl / totalInvestment) * 100).toFixed(2) : "0.00"

      // --- Visual Scorecards Section ---
      const boxW = (pageWidth - 36) / 3;
      let cardX = 14;
      
      // Card 1: Invested
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(cardX, startY, boxW, 28, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("TOTAL INVESTED", cardX + (boxW / 2), startY + 8, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Rs ${totalInvestment.toLocaleString()}`, cardX + (boxW / 2), startY + 20, { align: 'center' });
      
      cardX += boxW + 4;

      // Card 2: Current
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(cardX, startY, boxW, 28, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("CURRENT VALUE", cardX + (boxW / 2), startY + 8, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246); // Blue
      doc.text(`Rs ${currentValue.toLocaleString()}`, cardX + (boxW / 2), startY + 20, { align: 'center' });

      cardX += boxW + 4;

      // Card 3: Returns
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(cardX, startY, boxW, 28, 2, 2, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("OVERALL P&L", cardX + (boxW / 2), startY + 8, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(plColor[0], plColor[1], plColor[2]);
      doc.text(`${pl >= 0 ? '+' : ''}Rs ${pl.toLocaleString()}`, cardX + (boxW / 2), startY + 18, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`(${plPercent}%)`, cardX + (boxW / 2), startY + 24, { align: 'center' });

      startY += 40

      // --- Asset Class Breakdown Subtable ---
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(200, 200, 200)
      doc.text("Asset Allocation Mix", 14, startY)
      startY += 4

      const allocationBody = pieData.map(item => {
         const pct = currentValue > 0 ? ((item.value / currentValue) * 100).toFixed(1) : "0"
         return [item.name, `Rs ${item.value.toLocaleString()}`, `${pct}%`]
      })

      autoTable(doc, {
         startY: startY,
         head: [['Asset Category', 'Current Valuation', 'Portfolio Weight %']],
         body: allocationBody,
         theme: 'plain',
         headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontStyle: 'bold', cellPadding: 2 },
         bodyStyles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], fontSize: 9, cellPadding: 2 },
         columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right', fontStyle: 'bold' }
         },
         margin: { left: 14, right: 14 }
      })

      // @ts-ignore
      startY = doc.lastAutoTable?.finalY + 14 || startY + 40

      // Section 2: Holdings Table
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text("2. ITEMISED CURRENT HOLDINGS", 14, startY)
    
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
         headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
         bodyStyles: { fillColor: [30, 41, 59], textColor: [226, 232, 240], font: 'helvetica' },
         columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right', fontStyle: 'bold' }
         },
         alternateRowStyles: { fillColor: [15, 23, 42] },
         margin: { left: 14, right: 14 },
         styles: { fontSize: 8.5, cellPadding: 3 }
      })

      // Section 3: SIP Table
      // @ts-ignore
      let finalY = doc.lastAutoTable?.finalY || startY + 20
      
      if (sips && sips.length > 0) {
         finalY += 15
         doc.setFont("helvetica", "bold")
         doc.setFontSize(14)
         doc.setTextColor(255, 255, 255)
         doc.text("3. ACTIVE SYSTEMATIC INVESTMENT PLANS (SIPs)", 14, finalY)
         
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
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fillColor: [30, 41, 59], textColor: [226, 232, 240], font: 'helvetica' },
            columnStyles: {
               2: { halign: 'right', fontStyle: 'bold' },
               3: { halign: 'center' },
               4: { halign: 'center' }
            },
            alternateRowStyles: { fillColor: [15, 23, 42] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 8.5, cellPadding: 3 }
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
                <div className="flex items-center gap-2">
                   <CardTitle className="text-sm font-semibold text-indigo-400 tracking-wide uppercase">NIFTY 50 Trend</CardTitle>
                   {isMarketOpen && (
                      <div className="flex items-center gap-1 animate-pulse bg-rose-500/10 px-1.5 rounded py-0.5 border border-rose-500/20">
                         <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                         </span>
                         <span className="text-[8px] text-rose-400 font-black tracking-tighter">LIVE</span>
                      </div>
                   )}
                </div>
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
                <div className="flex items-center gap-2">
                   <CardTitle className="text-sm font-semibold text-yellow-500 tracking-wide uppercase">Live Gold (1g)</CardTitle>
                   {isMarketOpen && (
                      <div className="flex items-center gap-1 animate-pulse bg-rose-500/10 px-1.5 rounded py-0.5 border border-rose-500/20">
                         <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                         </span>
                         <span className="text-[8px] text-rose-400 font-black tracking-tighter">LIVE</span>
                      </div>
                   )}
                </div>
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
                <div className="flex items-center gap-2">
                   <CardTitle className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Live Silver (1g)</CardTitle>
                   {isMarketOpen && (
                      <div className="flex items-center gap-1 animate-pulse bg-rose-500/10 px-1.5 rounded py-0.5 border border-rose-500/20">
                         <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                         </span>
                         <span className="text-[8px] text-rose-400 font-black tracking-tighter">LIVE</span>
                      </div>
                   )}
                </div>
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
                            value={ageInput}
                             onChange={(e) => setAgeInput(e.target.value)} 
                            className="w-16 rounded-md border py-1 px-2 text-center text-sm bg-background" 
                            min="18" max="100" 
                         />
                         <span className="text-sm text-muted-foreground mr-2">Yrs</span>
                         <Button size="sm" variant="secondary" onClick={handleSaveAge}>Save</Button>
                      </>
                   ) : (
                      <>
                         <span className="font-bold">{age} <span className="text-muted-foreground font-normal text-sm">Yrs</span></span>
                         <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setAgeInput(age.toString()); setIsAgeEditing(true); }}>Edit</Button>
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
