"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyToggle() {
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const isPrivacyMode = localStorage.getItem("privacy") === "true"
    setIsPrivate(isPrivacyMode)
    if (isPrivacyMode) {
      document.documentElement.classList.add("privacy-mode")
    }
  }, [])

  const togglePrivacy = () => {
    if (isPrivate) {
      document.documentElement.classList.remove("privacy-mode")
      localStorage.setItem("privacy", "false")
      setIsPrivate(false)
    } else {
      document.documentElement.classList.add("privacy-mode")
      localStorage.setItem("privacy", "true")
      setIsPrivate(true)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={togglePrivacy} className="rounded-full text-muted-foreground hover:text-primary transition-colors">
      {isPrivate ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle privacy mode</span>
    </Button>
  )
}
