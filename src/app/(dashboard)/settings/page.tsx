"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { User, LogOut, Palette, Database, ShieldAlert, Camera, Save, Key } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile states
  const [userEmail, setUserEmail] = useState<string>("")
  const [displayName, setDisplayName] = useState<string>("")
  const [avatar, setAvatar] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password states
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        // Attempt to fetch name from Supabase user_metadata or localStorage fallback
        const metaName = user.user_metadata?.display_name || user.user_metadata?.full_name || ""
        const localName = localStorage.getItem("bun_vault_name") || ""
        setDisplayName(metaName || localName || "")

        const localAvatar = localStorage.getItem("bun_vault_avatar") || ""
        setAvatar(localAvatar)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      // Save display name to Supabase Auth metadata
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      if (error) throw error

      localStorage.setItem("bun_vault_name", displayName)
      alert("Profile updated successfully!")
      window.location.reload() // Trigger refresh to update navbar avatar/name
    } catch (err: any) {
      alert("Failed to update profile: " + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 2MB to keep Base64 storage friendly
    if (file.size > 2 * 1024 * 1024) {
      alert("File size too large. Please select an image smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setAvatar(base64String)
      localStorage.setItem("bun_vault_avatar", base64String)
      alert("Profile photo updated! This change will take effect immediately.")
    };
    reader.readAsDataURL(file)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      alert("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      alert("Password updated successfully!")
      setPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      alert("Failed to change password: " + err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/login")
    } else {
      alert("Error signing out: " + error.message)
    }
  }

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear your local preferences?")) {
      localStorage.removeItem("bun_vault_age")
      localStorage.removeItem("bun_vault_name")
      localStorage.removeItem("bun_vault_avatar")
      alert("Preferences cleared successfully!")
      window.location.reload()
    }
  }

  return (
    <div className="flex-1 space-y-6 relative max-w-4xl mx-auto pb-12">
      <div>
         <h2 className="text-2xl font-bold tracking-tight">Account & Security</h2>
         <p className="text-muted-foreground">Manage your visual profile, update your passwords, and configure account parameters.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {/* Profile Card */}
         <Card className="glass-panel col-span-1 md:col-span-2">
            <CardHeader>
               <CardTitle>Profile Details</CardTitle>
               <CardDescription>Upload a profile photo and change your display name.</CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-primary/10">
                     <div className="relative group">
                        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/30">
                           {avatar ? (
                              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                           ) : (
                              <span className="text-3xl font-bold text-primary">
                                 {displayName ? displayName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : "U"}
                              </span>
                           )}
                        </div>
                        <button 
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow hover:scale-110 active:scale-95 transition-all duration-300"
                        >
                           <Camera className="h-4 w-4" />
                        </button>
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleAvatarUpload} 
                           accept="image/*" 
                           className="hidden" 
                        />
                     </div>
                     <div className="text-center sm:text-left space-y-1">
                        <h4 className="font-semibold text-lg">{displayName || "Anonymous User"}</h4>
                        <p className="text-sm text-muted-foreground">{userEmail || "Loading email..."}</p>
                        <p className="text-xs text-muted-foreground/60">Image file size must be less than 2MB.</p>
                     </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                     <div>
                        <label className="block text-sm font-medium mb-1">Display Name</label>
                        <input 
                           required
                           type="text"
                           value={displayName}
                           onChange={e => setDisplayName(e.target.value)}
                           placeholder="e.g. KAJENDRAN M"
                           className="w-full rounded-md border py-2 px-3 bg-background"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input 
                           disabled
                           type="email"
                           value={userEmail}
                           className="w-full rounded-md border py-2 px-3 bg-muted/50 text-muted-foreground cursor-not-allowed"
                        />
                        <span className="text-xs text-muted-foreground/60 mt-1 block">Email address cannot be changed.</span>
                     </div>
                  </div>

                  <div className="flex justify-end pt-2">
                     <Button type="submit" disabled={savingProfile} className="gap-2">
                        <Save className="h-4 w-4" /> {savingProfile ? "Saving..." : "Save Profile"}
                     </Button>
                  </div>
               </form>
            </CardContent>
         </Card>

         {/* Change Password Card */}
         <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center gap-4">
               <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <Key className="h-6 w-6" />
               </div>
               <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your Supabase credentials securely.</CardDescription>
               </div>
            </CardHeader>
            <CardContent>
               <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">New Password</label>
                     <input 
                        required
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full rounded-md border py-2 px-3 bg-background"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                     <input 
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-md border py-2 px-3 bg-background"
                     />
                  </div>
                  <div className="pt-2">
                     <Button type="submit" disabled={changingPassword} className="w-full">
                        {changingPassword ? "Updating Password..." : "Change Password"}
                     </Button>
                  </div>
               </form>
            </CardContent>
         </Card>

         {/* Preferences Card */}
         <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center gap-4">
               <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500">
                  <Palette className="h-6 w-6" />
               </div>
               <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Toggle light and dark modes.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Display Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                     <Button 
                        variant={theme === "light" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setTheme("light")}
                     >
                        Light
                     </Button>
                     <Button 
                        variant={theme === "dark" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setTheme("dark")}
                     >
                        Dark
                     </Button>
                     <Button 
                        variant={theme === "system" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setTheme("system")}
                     >
                        System
                     </Button>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Data Management Card */}
         <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center gap-4">
               <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                  <Database className="h-6 w-6" />
               </div>
               <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Reset local browser pref cached states.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between border border-emerald-500/20 bg-emerald-500/5 p-3 rounded-lg">
                  <div>
                     <p className="text-sm font-medium">Clear Cache</p>
                     <p className="text-xs text-muted-foreground mt-0.5">Clears profile photo, name, and age preferences.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearCache} className="text-emerald-500 hover:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                     Clear
                  </Button>
               </div>
            </CardContent>
         </Card>

         {/* Sign Out Card */}
         <Card className="glass-panel border-destructive/20">
            <CardHeader className="flex flex-row items-center gap-4">
               <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                  <LogOut className="h-6 w-6" />
               </div>
               <div>
                  <CardTitle>Sign Out</CardTitle>
                  <CardDescription>Log out of your Bun Vault session.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Sign out securely from this device. All of your synced database holdings and configurations will be safe.</p>
               <Button variant="destructive" onClick={handleSignOut} className="w-full flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" /> Log Out
               </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
