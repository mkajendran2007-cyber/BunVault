"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Zap, TrendingUp, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Holding = {
  symbol: string
  name: string
  type: string
  qty: number
  buy_price: number
}

export default function AIAssistantPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('holdings').select('symbol, name, type, qty, buy_price').eq('user_id', user.id)
    if (data) {
       setHoldings(data)
    }
    setLoading(false)
  }

  if (loading) {
     return <div className="p-8 text-muted-foreground animate-pulse">Analyzing your live portfolio...</div>
  }

  if (holdings.length === 0) {
     return <div className="p-8 text-muted-foreground">Please add assets to your portfolio to generate AI insights.</div>
  }

  // --- AI LOGIC ENGINE ---
  let totalInvested = 0
  const allocation: Record<string, number> = { Equity: 0, "Mutual Fund": 0, Debt: 0, Crypto: 0, Commodity: 0 }
  const assetExposure: Record<string, number> = {}

  holdings.forEach(h => {
     const val = h.qty * h.buy_price
     totalInvested += val
     if (allocation[h.type] !== undefined) allocation[h.type] += val
     if (assetExposure[h.name]) assetExposure[h.name] += val
     else assetExposure[h.name] = val
  })

  // 1. Calculate Diversification & Risk
  let activeAssetClasses = 0
  Object.values(allocation).forEach(val => { if (val > 0) activeAssetClasses++ })
  
  let score = 50 // Base score
  score += (activeAssetClasses * 10) // +10 for each asset class used

  let riskLevel = "Medium"
  const equityPercentage = totalInvested > 0 ? (allocation['Equity'] + allocation['Mutual Fund']) / totalInvested : 0
  const cryptoPercentage = totalInvested > 0 ? allocation['Crypto'] / totalInvested : 0

  if (cryptoPercentage > 0.2) riskLevel = "High"
  else if (equityPercentage > 0.8) riskLevel = "High"
  else if (equityPercentage < 0.4 && cryptoPercentage === 0) riskLevel = "Low"

  // 2. Detect Overexposure (Any single asset > 30% of portfolio)
  const overexposedAssets = Object.entries(assetExposure)
     .filter(([name, val]) => (val / totalInvested) > 0.3)
     .map(([name]) => name)

  if (overexposedAssets.length > 0) score -= 15

  // 3. Predicted CAGR based on typical Indian market returns
  let predictedCAGR = 
     (allocation['Equity'] * 0.12) + 
     (allocation['Mutual Fund'] * 0.11) + 
     (allocation['Debt'] * 0.07) + 
     (allocation['Commodity'] * 0.05) + 
     (allocation['Crypto'] * 0.15); // Speculative
  
  predictedCAGR = totalInvested > 0 ? (predictedCAGR / totalInvested) * 100 : 0;

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score))

  return (
    <div className="flex-1 space-y-4">
      <div>
         <h2 className="text-2xl font-bold tracking-tight">AI Portfolio Assistant</h2>
         <p className="text-muted-foreground">Smart insights generated directly from your live portfolio data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
           <CardContent className="p-6">
              <div className="text-sm font-medium text-primary mb-2">Overall Health Score</div>
              <div className="text-5xl font-bold text-primary">{finalScore}/100</div>
              <p className="text-xs text-muted-foreground mt-2">
                 {finalScore > 80 ? "Your portfolio is exceptionally well structured." : "There is room for diversification."}
              </p>
           </CardContent>
        </Card>
        <Card className={`bg-opacity-5 ${riskLevel === 'High' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'}`}>
           <CardContent className="p-6">
              <div className="text-sm font-medium mb-2">Risk Level</div>
              <div className="text-5xl font-bold">{riskLevel}</div>
              <p className="text-xs mt-2 opacity-80">Based on your Equity and Crypto exposure.</p>
           </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
           <CardContent className="p-6">
              <div className="text-sm font-medium text-amber-500 mb-2">Predicted CAGR</div>
              <div className="text-5xl font-bold text-amber-500">{predictedCAGR.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Estimated annualized return based on current asset mix.</p>
           </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-4">Actionable Live Insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
         {overexposedAssets.length > 0 && (
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <AlertTriangle className="h-4 w-4 text-amber-500" />
                     Concentration Risk Detected
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground">
                     You have a heavy concentration in <strong>{overexposedAssets.join(", ")}</strong> (over 30% of your total capital). We highly recommend deploying future capital into other assets to reduce single-asset risk.
                  </p>
               </CardContent>
            </Card>
         )}

         {allocation['Debt'] === 0 && (
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <ShieldAlert className="h-4 w-4 text-destructive" />
                     Missing Safety Net
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground">
                     Your portfolio currently has <strong>0% Debt allocation</strong>. While Equities offer growth, Debt instruments (like FDs or Liquid Funds) protect your wealth during market crashes.
                  </p>
               </CardContent>
            </Card>
         )}

         {allocation['Mutual Fund'] === 0 && (
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <TrendingUp className="h-4 w-4 text-emerald-500" />
                     Opportunity: Mutual Funds
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground">
                     You are managing your own equities. Consider adding Index Mutual Funds to automatically diversify across the top 50 Indian companies without manual effort.
                  </p>
               </CardContent>
            </Card>
         )}

         {activeAssetClasses >= 3 && (
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <Zap className="h-4 w-4 text-primary" />
                     Excellent Diversification
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground">
                     You are invested across {activeAssetClasses} different asset classes. This is a textbook example of good risk management! Keep your SIPs running.
                  </p>
               </CardContent>
            </Card>
         )}
      </div>
    </div>
  )
}
