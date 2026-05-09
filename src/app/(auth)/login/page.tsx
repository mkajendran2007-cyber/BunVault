"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forgot password states
  const [isForgot, setIsForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError(null)
    setResetSuccess(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/settings`,
      })

      if (error) {
        setError(error.message)
      } else {
        setResetSuccess("Password reset link has been sent to your email! Please check your inbox.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push("/dashboard")
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-foreground">
          {isForgot ? "Reset your password" : "Sign in to your account"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isForgot ? (
            <>
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false)
                  setError(null)
                  setResetSuccess(null)
                }}
                className="font-semibold text-primary hover:text-primary/80"
              >
                Back to Sign in
              </button>
            </>
          ) : (
            <>
              Not a member?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:text-primary/80">
                Start a 14-day free trial
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-10">
        {!isForgot ? (
          <div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background px-3"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
                    Password
                  </label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true)
                        setError(null)
                        setResetSuccess(null)
                      }}
                      className="font-semibold text-primary hover:text-primary/80 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background px-3"
                  />
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium leading-6 text-foreground">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background px-3"
                  />
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              {resetSuccess && (
                <div className="text-emerald-500 text-sm font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  {resetSuccess}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? "Sending reset link..." : "Send reset link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsForgot(false)
                    setError(null)
                    setResetSuccess(null)
                  }}
                >
                  Back to Sign in
                </Button>
              </div>
            </form>
          </div>
        )}

        {!isForgot && (
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-background px-6 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                Google
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
