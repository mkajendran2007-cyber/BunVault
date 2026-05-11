"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ChevronDown, User, LogOut, Moon, Sun } from "lucide-react"
import Link from "next/link"

export default function UserAvatar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    async function loadUser() {
      // 1. Instant render from local cache if we have a session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const localName = localStorage.getItem("bun_vault_name") || ""
        const localAvatar = localStorage.getItem(`bun_vault_avatar_${session.user.id}`) || ""
        if (localName) setName(localName)
        if (localAvatar) setAvatar(localAvatar)
      }

      // 2. Fetch fresh details from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        setEmail(user.email || "")
        const metaName = user.user_metadata?.display_name || user.user_metadata?.full_name || ""
        if (metaName) {
          setName(metaName)
          localStorage.setItem("bun_vault_name", metaName)
        }
        const metaAvatar = user.user_metadata?.avatar_url || ""
        if (metaAvatar) {
          setAvatar(metaAvatar)
          localStorage.setItem(`bun_vault_avatar_${user.id}`, metaAvatar)
        }
      } else {
        setIsLoggedIn(false)
        setName("")
        setAvatar("")
        setEmail("")
      }
    }
    loadUser()

    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-muted/50 p-1.5 rounded-lg transition-all duration-300 active:scale-95"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
          {isLoggedIn && avatar ? (
            <img src={avatar} alt="User Avatar" className="h-full w-full object-cover" />
          ) : isLoggedIn && name ? (
            <span>
              {name[0].toUpperCase()}
            </span>
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
        {/* Name label removed from header per user request */}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background border border-primary/25 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 divide-y divide-primary/10">
          {/* User Profile Summary */}
          <div className="px-3 py-2.5 border-b border-primary/10 mb-1">
            <p className="font-semibold text-card-foreground text-sm truncate">{name || "Anonymous User"}</p>
            <p className="text-xs text-muted-foreground truncate">{email || "Not logged in"}</p>
          </div>

          {/* Action List */}
          <div className="space-y-0.5 pt-1.5">
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted text-card-foreground transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile & Settings</span>
            </Link>

            <button 
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted text-card-foreground transition-colors text-left"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted text-destructive hover:bg-destructive/10 transition-colors text-left border-t border-primary/10 mt-1 pt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
