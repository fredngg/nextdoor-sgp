"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "../components/navigation"
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react" // Import useEffect for useReactEffect

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check for error from URL params (e.g., from auth callback)
  useEffect(() => {
    // Replace useReactEffect with useEffect
    const urlError = searchParams.get("error")
    if (urlError) {
      if (urlError === "auth_callback_error") {
        setError("Authentication failed. Please try signing in again.")
      } else {
        setError(decodeURIComponent(urlError))
      }
    }
  }, [searchParams])

  const handlePasswordSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🔄 Login: Attempting sign in for:", email)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      console.log("✅ Login: Supabase response:", {
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at,
            }
          : null,
        session: data.session ? "Session created" : "No session",
        error: signInError,
      })

      if (signInError) {
        console.error("❌ Login: Sign in error:", signInError)

        if (signInError.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.")
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user && data.session) {
        console.log("🎉 Login: Sign in successful")
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })
        router.push("/")
      } else {
        console.error("❌ Login: No user or session returned")
        setError("Sign in failed. Please try again.")
      }
    } catch (err) {
      console.error("💥 Login: Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
                  <p>
                    Don't have an account?{" "}
                    <Link href="/register" className="text-red-600 hover:text-red-700 font-medium">
                      Create one
                    </Link>
                  </p>
                  <p>
                    <Link href="/forgot-password" className="text-red-600 hover:text-red-700 font-medium">
                      Forgot your password?
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
