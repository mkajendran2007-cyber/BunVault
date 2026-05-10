"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Zap, TrendingUp, AlertTriangle, Sparkles, Loader2, Send, User, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Holding = {
  symbol: string
  name: string
  type: string
  qty: number
  buy_price: number
}

type Message = {
  role: 'user' | 'ai',
  content: string
}

export default function AIAssistantPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputPrompt, setInputPrompt] = useState("")
  const [aiError, setAiError] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (user?.user_metadata?.name) setUserName(user.user_metadata.name);
    else if (user.email) setUserName(user.email.split('@')[0]);

    const { data } = await supabase.from('holdings').select('symbol, name, type, qty, buy_price').eq('user_id', user.id)
    if (data) {
       setHoldings(data)
    }
    setLoading(false)
  }

  const runGenerativeAnalysis = async (specificQuestion: string | null = null) => {
     setAiLoading(true);
     setAiError("");
     
     // If it's a manual question, add user message instantly
     if (specificQuestion) {
        setMessages(prev => [...prev, { role: 'user', content: specificQuestion }]);
        setInputPrompt("");
     }

     try {
        const portfolioSummary = holdings.map(h => ({
           Asset: h.name,
           Type: h.type,
           EstValue: Math.round(h.qty * h.buy_price)
        }));

        // Pack overall derived stats into contextual memory so AI sees the "65/100" etc.
        const statsPayload = {
           finalScore,
           predictedCAGR,
           riskLevel,
           missingDebt: allocation['Debt'] === 0
        };

        const res = await fetch('/api/ai-generate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
              portfolioSummary, 
              name: userName, 
              userQuestion: specificQuestion,
              metrics: statsPayload
           })
        });

        const data = await res.json();

        if (!res.ok) {
           if (data.error === "API_KEY_MISSING") {
              setAiError("GEMINI_API_KEY missing in .env.local.");
           } else {
              setAiError(data.message || "Connection failed.");
           }
        } else {
           // Append AI reply to history
           setMessages(prev => [...prev, { role: 'ai', content: data.analysis }]);
        }
     } catch (err) {
        setAiError("Connection error with local relay.");
     } finally {
        setAiLoading(false);
     }
  };

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
      
      {/* GEMINI AI SECTION */}
      <div className="mt-8 relative group">
         {/* Aesthetic background glow behind the AI box */}
         <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur" />
         
         <Card className="relative border-transparent bg-slate-900/80 backdrop-blur-xl text-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5">
               <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                     <Sparkles className="h-5 w-5 text-purple-400" /> Dynamic Wealth Intelligence
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                     Review automated briefings or type custom questions directly below to deep-dive into your holdings.
                  </p>
               </div>
               
               <div className="flex gap-2 shrink-0 items-center">
                  {messages.length > 0 && (
                     <Button 
                        onClick={() => setMessages([])}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Clear Conversation"
                     >
                        <X className="h-4 w-4" />
                     </Button>
                  )}
                  <Button 
                     disabled={aiLoading}
                     onClick={() => runGenerativeAnalysis(null)}
                     variant="outline"
                     className="bg-white/5 text-white hover:bg-white/10 border-white/10 font-medium shadow-sm h-10 transition-all"
                  >
                     {aiLoading && messages.length === 0 ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reasoning...</>
                     ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Generate Briefing</>
                     )}
                  </Button>
               </div>
            </CardContent>
            
            {/* SCROLLABLE MESSAGE HISTORY */}
            {(messages.length > 0 || aiLoading || aiError) && (
               <div className="p-4 md:p-6 space-y-6 max-h-[500px] overflow-y-auto bg-slate-950/20 custom-scrollbar">
                  
                  {messages.map((msg, msgIdx) => (
                     <div key={msgIdx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        
                        {/* Icon + Role Tag */}
                        <div className="flex items-center gap-2 opacity-60 px-1">
                           {msg.role === 'user' ? (
                              <>
                                 <span className="text-[11px] font-medium uppercase tracking-wider">You</span>
                                 <div className="p-1 bg-white/10 rounded-full"><User className="h-3 w-3" /></div>
                              </>
                           ) : (
                              <>
                                 <div className="p-1 bg-indigo-600/30 rounded-full border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]"><Sparkles className="h-3 w-3 text-indigo-300" /></div>
                                 <span className="text-[11px] font-bold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent tracking-wider uppercase">Vault AI</span>
                              </>
                           )}
                        </div>

                        {/* Bubble Content */}
                        <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                           msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-sm' 
                              : 'bg-white/5 border border-white/10 rounded-tl-sm text-slate-200'
                        }`}>
                           {msg.role === 'user' ? (
                              <div className="text-sm md:text-[15px] font-medium leading-relaxed">{msg.content}</div>
                           ) : (
                              <div className="space-y-3">
                                 {msg.content.split('\n').filter(ln => ln.trim() !== '').map((line, idx) => {
                                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                                    const cleanText = line.trim().replace(/^[\*\-]\s+/, '');
                                    
                                    const parts = cleanText.split(/(\*\*.*?\*\*)/g);
                                    const renderedParts = parts.map((p, i) => {
                                       if (p.startsWith('**') && p.endsWith('**')) {
                                          return <strong key={i} className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded mx-0.5 text-[12px] uppercase tracking-wide">{p.slice(2, -2)}</strong>;
                                       }
                                       return p;
                                    });

                                    if (isBullet) {
                                       return (
                                          <div key={idx} className="flex gap-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                                             <div className="h-1.5 w-1.5 mt-2 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
                                             <div className="text-[14px] leading-relaxed">{renderedParts}</div>
                                          </div>
                                       );
                                    }

                                    if (cleanText.toLowerCase().includes('disclaimer')) {
                                       return <div key={idx} className="text-[10px] text-slate-500 border-t border-white/10 pt-3 mt-4 italic">{renderedParts}</div>
                                    }

                                    return <div key={idx} className="text-sm md:text-[15px] leading-relaxed">{renderedParts}</div>;
                                 })}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}

                  {/* Loading state while thinking */}
                  {aiLoading && (
                     <div className="flex items-start gap-3 animate-pulse">
                        <div className="p-1 bg-white/10 rounded-full shrink-0"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                        <div className="bg-white/5 rounded-2xl p-4 w-[120px] flex items-center gap-1">
                           <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{animationDelay:'0ms'}}></div>
                           <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{animationDelay:'150ms'}}></div>
                           <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{animationDelay:'300ms'}}></div>
                        </div>
                     </div>
                  )}

                  {/* Persistent Errors */}
                  {aiError && (
                     <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-200 text-sm mx-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="font-medium">{aiError}</p>
                     </div>
                  )}
               </div>
            )}

            {/* CHAT INPUT FOOTER */}
            <div className="p-4 bg-slate-950/50 border-t border-white/5">
               <form 
                  onSubmit={(e) => {
                     e.preventDefault();
                     if (inputPrompt.trim() && !aiLoading) {
                        runGenerativeAnalysis(inputPrompt.trim());
                     }
                  }}
                  className="relative flex items-center group"
               >
                  <div className="absolute left-4 text-indigo-400 group-focus-within:text-indigo-300 transition-colors">
                     <Zap className="h-4 w-4 fill-indigo-400/20" />
                  </div>
                  <Input 
                     value={inputPrompt}
                     onChange={(e) => setInputPrompt(e.target.value)}
                     disabled={aiLoading}
                     placeholder="Ask AI about your portfolio score, weights, or strategy..."
                     className="pl-11 pr-12 h-12 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 rounded-xl"
                  />
                  <Button 
                     type="submit" 
                     size="icon" 
                     disabled={aiLoading || !inputPrompt.trim()}
                     className="absolute right-1.5 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 text-white transition-all"
                  >
                     <Send className="h-4 w-4" />
                  </Button>
               </form>
               <div className="text-center text-[10px] text-slate-500 mt-2">Press Enter to send securely. Powered by Google Gemini.</div>
            </div>
         </Card>
      </div>
    </div>
  )
}
