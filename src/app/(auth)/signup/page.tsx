"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Check, ShieldCheck, Terminal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const PASSWORD_RULES = [
  { label: "At least 8 characters length", test: (p: string) => p.length >= 8 },
  { label: "Contains numeric character",   test: (p: string) => /\d/.test(p) },
  { label: "Contains uppercase character", test: (p: string) => /[A-Z]/.test(p) },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, display_name: name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) router.push("/dashboard")
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="w-full space-y-6">
      {/* Mobile Logo Header */}
      <div className="lg:hidden flex items-center justify-between pb-6 border-b border-[#242C3E]">
         <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gold-gradient-bg p-[1.5px]">
               <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <img src="/logo.png" className="h-5 w-5" alt="Logo" />
               </div>
            </div>
            <span className="font-bold text-white font-mono text-lg">BUN VAULT</span>
         </Link>
         <span className="px-2 py-0.5 rounded text-[10px] font-mono gold-gradient-bg text-slate-950 font-bold">SECURE</span>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E676]">
           <Terminal className="h-3.5 w-3.5" /> GET STARTED TODAY
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white font-mono">
          Create Your Account
        </h2>
        <p className="text-sm text-slate-400 font-medium font-sans">
          Start managing your personal wealth, expenses, and investments right now.
        </p>
      </div>

      {/* Google first */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-12 rounded-xl border border-[#242C3E] hover:border-[#F4C542]/40 bg-[#111622] hover:bg-[#161D2D] font-bold text-sm flex items-center justify-center gap-3 transition-all text-white font-sans shadow-lg"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#242C3E]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#070A0F] px-4 text-xs font-mono text-slate-500 uppercase tracking-widest">or sign up with email</span>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSignup}
        className="space-y-4"
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full h-12 rounded-xl bg-[#111622] border border-[#242C3E] text-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#F4C542] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full h-12 rounded-xl bg-[#111622] border border-[#242C3E] text-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#F4C542] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
            Create Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 rounded-xl bg-[#111622] border border-[#242C3E] text-white pl-11 pr-11 text-sm font-medium focus:outline-none focus:border-[#F4C542] transition-colors font-mono"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Rules Check */}
          <div className="pt-2 space-y-1.5">
            {PASSWORD_RULES.map((rule, idx) => {
              const passed = rule.test(password)
              return (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${passed ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-[#1A2234] text-slate-600'}`}>
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className={passed ? "text-slate-300 font-medium" : "text-slate-500"}>{rule.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2.5 text-destructive text-xs font-mono font-bold bg-destructive/10 border border-destructive/30 px-4 py-3.5 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !PASSWORD_RULES.every(r => r.test(password))}
          className="w-full h-12 rounded-xl gold-gradient-bg text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-mono mt-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
          ) : (
            <>Create Account <ArrowRight className="h-4 w-4 stroke-[3]" /></>
          )}
        </button>

        {/* Sign in link */}
        <p className="text-center text-xs text-slate-400 font-sans pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-[#F4C542] font-mono font-bold hover:underline">
            Sign In Here →
          </Link>
        </p>

        <div className="pt-4 border-t border-[#1C2332] flex items-center justify-between text-[11px] font-mono text-slate-500">
           <span className="flex items-center gap-1.5 text-[#00E676]">
              <ShieldCheck className="h-3.5 w-3.5" /> BANK-GRADE SECURITY ACTIVE
           </span>
           <span>ENCRYPTED & PRIVATE</span>
        </div>
      </motion.form>
    </div>
  )
}
