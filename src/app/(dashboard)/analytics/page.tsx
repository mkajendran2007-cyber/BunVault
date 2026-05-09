"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { Settings, Maximize2, ChevronDown, Info, Plus } from "lucide-react"

export default function AnalyticsPage() {
  const [userName, setUserName] = useState("Kajendran")
  const [activeView, setActiveView] = useState<"Account value" | "Portfolio performance">("Account value")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Checkbox states
  const [showEquity, setShowEquity] = useState(true)
  const [showMutualFunds, setShowMutualFunds] = useState(true)
  const [showPortfolio, setShowPortfolio] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name)
      } else if (user?.email) {
        setUserName(user.email.split("@")[0])
      }
    })
  }, [])

  // Data matching the stepped growth of Image 1
  const accountValueData = [
    { name: "Sep", "Account value": 200, Equity: 50, "Mutual funds": 180 },
    { name: "Oct", "Account value": 800, Equity: 70, "Mutual funds": 750 },
    { name: "Nov", "Account value": 1400, Equity: 80, "Mutual funds": 1350 },
    { name: "Dec", "Account value": 2000, Equity: 100, "Mutual funds": 1950 },
    { name: "2026", "Account value": 3500, Equity: 150, "Mutual funds": 3400 },
    { name: "Feb", "Account value": 5100, Equity: 120, "Mutual funds": 4900 },
    { name: "Mar", "Account value": 5600, Equity: 130, "Mutual funds": 5400 },
    { name: "Apr", "Account value": 7200, Equity: 140, "Mutual funds": 7100 },
    { name: "May", "Account value": 8000, Equity: 150, "Mutual funds": 7900 },
  ]

  // Data matching the dips of Image 2
  const performanceData = [
    { name: "Sep", Portfolio: 520, Equity: 10, "Mutual funds": 510 },
    { name: "Oct", Portfolio: 550, Equity: 12, "Mutual funds": 540 },
    { name: "Nov", Portfolio: 560, Equity: 11, "Mutual funds": 555 },
    { name: "Dec", Portfolio: 570, Equity: 15, "Mutual funds": 562 },
    { name: "2026", Portfolio: 450, Equity: 10, "Mutual funds": 440 },
    { name: "Feb", Portfolio: 540, Equity: 12, "Mutual funds": 530 },
    { name: "Mar", Portfolio: 510, Equity: 14, "Mutual funds": 505 },
    { name: "Apr", Portfolio: 525, Equity: 11, "Mutual funds": 520 },
    { name: "May", Portfolio: 535, Equity: 15, "Mutual funds": 530 },
  ]

  const currentData = activeView === "Account value" ? accountValueData : performanceData

  return (
    <div className="flex-1 space-y-6 pb-8">
      {/* Top Welcome Header & Promo Ad */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text">
            Hi {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here is a deep look into your asset growth and performance over time.</p>
        </div>

        {/* Kids Demat Promo Ad matching the image */}
        <div className="relative group overflow-hidden flex items-center justify-between p-3.5 rounded-xl border border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-transparent hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300 max-w-sm">
          <div className="flex flex-col">
            <span className="inline-flex items-center self-start rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-1">
              Minor demat account
            </span>
            <span className="text-sm font-bold text-amber-500/90 flex items-center gap-1">
              Invest for your kids
            </span>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 scale-95 group-hover:scale-100 transition-all duration-300 ml-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm-5 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm2.5-4c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm3.5-3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-7 0c.83 0 1.5.67 1.5 1.5S10.33 13 9.5 13 8 12.33 8 11.5s.67-1.5 1.5-1.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Card */}
      <Card className="border-border/40 bg-gradient-to-b from-card to-card/50 shadow-xl overflow-visible">
        <CardContent className="p-6 space-y-6 overflow-visible">
          
          {/* Chart Options Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/10 overflow-visible">
            
            {/* Left Interactive Dropdown Menu */}
            <div className="relative overflow-visible">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-base font-bold text-foreground hover:bg-white/5 rounded-lg transition-all border border-border/10 shadow-sm"
              >
                <span>{activeView}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Real-time Interactive Menu Overlay matching the image checkboxes */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border/40 bg-popover text-popover-foreground shadow-2xl p-4 z-50 space-y-3 animate-in fade-in-50 slide-in-from-top-1">
                  
                  {/* Radio 1: Account Value */}
                  <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-all">
                    <input
                      type="radio"
                      name="viewMode"
                      checked={activeView === "Account value"}
                      onChange={() => {
                        setActiveView("Account value")
                        setIsDropdownOpen(false)
                      }}
                      className="accent-blue-500 h-4 w-4"
                    />
                    <span className="text-sm font-semibold">Account value</span>
                  </label>

                  {/* Radio 2: Portfolio Performance */}
                  <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-all">
                    <input
                      type="radio"
                      name="viewMode"
                      checked={activeView === "Portfolio performance"}
                      onChange={() => {
                        setActiveView("Portfolio performance")
                        setIsDropdownOpen(false)
                      }}
                      className="accent-blue-500 h-4 w-4"
                    />
                    <span className="text-sm font-semibold">Portfolio performance</span>
                  </label>

                  <div className="border-t border-border/10 pt-2.5 space-y-2">
                    {/* Checkbox 1: Equity */}
                    <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-all">
                      <input
                        type="checkbox"
                        checked={showEquity}
                        onChange={(e) => setShowEquity(e.target.checked)}
                        className="accent-blue-500 rounded h-4 w-4"
                      />
                      <span className="text-xs font-medium text-muted-foreground">Equity</span>
                    </label>

                    {/* Checkbox 2: Mutual Funds */}
                    <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-all">
                      <input
                        type="checkbox"
                        checked={showMutualFunds}
                        onChange={(e) => setShowMutualFunds(e.target.checked)}
                        className="accent-blue-500 rounded h-4 w-4"
                      />
                      <span className="text-xs font-medium text-muted-foreground">Mutual funds</span>
                    </label>

                    {/* Checkbox 3: Portfolio/Account Value Series */}
                    <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1 rounded transition-all">
                      <input
                        type="checkbox"
                        checked={showPortfolio}
                        onChange={(e) => setShowPortfolio(e.target.checked)}
                        className="accent-blue-500 rounded h-4 w-4"
                      />
                      <span className="text-xs font-medium text-muted-foreground">Portfolio Series</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Extra Info & Compare Action buttons */}
              {activeView === "Portfolio performance" && (
                <div className="inline-flex items-center gap-3 ml-4">
                  <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                  <button className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground border border-border/10 px-2 py-1 rounded transition-all">
                    <Plus className="h-3 w-3" /> Compare
                  </button>
                </div>
              )}
            </div>

            {/* Right Side Legends matching the Image */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 ml-auto">
              {showPortfolio && (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="h-1.5 w-4 rounded bg-blue-500 block" />
                  <span className="text-muted-foreground">{activeView === "Account value" ? "Account value" : "Portfolio"}</span>
                </div>
              )}
              {showEquity && (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="h-1.5 w-4 rounded bg-teal-500 block" />
                  <span className="text-muted-foreground">Equity</span>
                </div>
              )}
              {showMutualFunds && (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="h-1.5 w-4 rounded bg-amber-500 block" />
                  <span className="text-muted-foreground">Mutual funds</span>
                </div>
              )}

              {/* Right Settings and Full Screen Icons */}
              <div className="flex items-center gap-2 border-l border-border/10 pl-4 text-muted-foreground">
                <Settings className="h-4 w-4 cursor-pointer hover:text-foreground transition-all" />
                <Maximize2 className="h-4 w-4 cursor-pointer hover:text-foreground transition-all" />
              </div>
            </div>
          </div>

          {/* Recharts High-Fidelity Chart */}
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (activeView === "Account value" ? `${val / 1000}k` : val.toFixed(2))}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                  }}
                  itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                  labelStyle={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginBottom: "4px" }}
                />

                {/* Live Checkbox Toggled Line Series with matching colors */}
                {showPortfolio && (
                  <Line
                    type="monotone"
                    dataKey={activeView === "Account value" ? "Account value" : "Portfolio"}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showEquity && (
                  <Line
                    type="monotone"
                    dataKey="Equity"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showMutualFunds && (
                  <Line
                    type="monotone"
                    dataKey="Mutual funds"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
