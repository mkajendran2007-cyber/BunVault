"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Loader2 } from "lucide-react"

export default function ProfileRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect cleanly to our unified Account & Security settings hub
    router.replace("/settings")
  }, [router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
      <div className="relative flex items-center justify-center h-16 w-16 rounded-3xl gold-gradient-bg p-[2px] shadow-2xl shadow-amber-500/20 animate-pulse">
        <div className="flex items-center justify-center h-full w-full bg-slate-950 rounded-[22px]">
          <User className="h-8 w-8 text-[#F4C542]" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Accessing Profile & Settings...</h2>
        <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-center gap-2">
           <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F4C542]" /> Opening your profile and app settings
        </p>
      </div>
    </div>
  )
}
