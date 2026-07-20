"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getUserSetting, setUserSetting } from "@/lib/userSettings"

export default function HeaderUserName() {
  const [name, setName] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadName() {
      const localName = localStorage.getItem("bun_vault_name")
      if (localName) setName(localName)

      // Sync with cloud
      const cloudName = await getUserSetting("display_name")
      if (cloudName) {
        setName(cloudName)
        localStorage.setItem("bun_vault_name", cloudName)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fetchedName = user.user_metadata?.display_name || user.user_metadata?.full_name || ""
        if (fetchedName) {
          setName(fetchedName)
          setUserSetting("display_name", fetchedName)
          localStorage.setItem("bun_vault_name", fetchedName)
        } else if (!localName && user.email) {
          setName(user.email.split('@')[0])
        }
      }
    }
    loadName()
  }, [])

  if (!mounted) return <div className="h-6 w-32 bg-muted animate-pulse rounded" />

  return (
    <div className="flex items-center justify-between w-full min-w-0 pr-4">
      {/* Greeting & Executive Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
              {name ? `Welcome back, ${name}` : "Welcome back"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E676] animate-pulse" /> Live
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
