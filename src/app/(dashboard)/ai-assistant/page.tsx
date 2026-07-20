"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"

export default function AIAssistantRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect cleanly to our unified AI & Analytics Studio hub
    router.replace("/analytics")
  }, [router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
      <div className="relative flex items-center justify-center h-16 w-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 p-[2px] shadow-2xl shadow-amber-500/20 animate-pulse">
        <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[22px]">
          <Sparkles className="h-8 w-8 text-amber-500" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Opening AI Financial Assistant...</h2>
        <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-center gap-2">
           <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /> Connecting your personalized AI advice with market charts
        </p>
      </div>
    </div>
  )
}
