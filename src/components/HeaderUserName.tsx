"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HeaderUserName() {
  const [name, setName] = useState("")

  useEffect(() => {
    async function loadName() {
      // Check cache first
      const localName = localStorage.getItem("bun_vault_name")
      if (localName) setName(localName)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fetchedName = user.user_metadata?.display_name || user.user_metadata?.full_name || ""
        if (fetchedName) {
          setName(fetchedName)
          localStorage.setItem("bun_vault_name", fetchedName)
        } else if (!localName && user.email) {
          // Fallback if no meta name
          setName(user.email.split('@')[0])
        }
      }
    }
    loadName()
  }, [])

  if (!name) return <div className="h-6 w-32 bg-muted animate-pulse rounded" />;

  return (
    <h1 className="font-bold text-lg tracking-tight text-foreground">
      {name}
    </h1>
  )
}
