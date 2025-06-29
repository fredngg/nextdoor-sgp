"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Navigation } from "../components/navigation"
import { Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("🔄 Registration: Starting signup process")
    console.log("📧 Email:", email)
    console.log("🌐 Current origin:", window.location.origin)

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🔄 Registration: Calling supabase.auth.signUp")

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirm: true,
          },
        },
      })

      console.log("✅ Registration: Supabase response:", {
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at,
              confirmation_sent_at: data.user.confirmation_sent_at,
            }
          : null,
        session: data.session ? "Session created" : "No session",
        error: signUpError,
      })

      if (signUpError) {
        console.error("❌ Registration: Signup error:", signUpError)

        // Handle specific error cases
        if (signUpError.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else if (signUpError.message.includes("Invalid email")) {
          setError("Please enter a valid email address.")
        } else if (signUpError.message.includes("Password")) {
          setError("Password must be at least 6 characters long.")
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        console.log("🎉 Registration: User created successfully")
        console.log("📧 Email confirmed:", !!data.user.email_confirmed_at)
        console.log("📤 Confirmation sent:", !!data.user.confirmation_sent_at)

        setRegisteredEmail(email.trim().toLowerCase())
        setSuccess(true)

        // If user is immediately confirmed (shouldn't happen with email confirmation enabled)
        if (data.user.email_confirmed_at) {
          console.log("⚠️ Registration: User was immediately confirmed - email confirmation might be disabled")
        }
      } else {
        console.error("❌ Registration: No user returned from signup")
        setError("Registration failed. Please try again.")
      }
    } catch (err) {
      console.error("💥 Registration: Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return

    setResendLoading(true)
    setError("")

    try {
      console.log("🔄 Resend: Attempting to resend confirmation email to:", registeredEmail)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("❌ Resend: Error resending confirmation:", error)
        setError(`Failed to resend confirmation email: ${error.message}`)
      } else {
        console.log("✅ Resend: Confirmation email resent successfully")
        // Show a temporary success message
        const originalError = error
        setError("")
        setTimeout(() => {
          if (!originalError) {
            // Only show success if there wasn't already an error
          }
        }, 3000)
      }
    } catch (err) {
      console.error("💥 Resend: Unexpected error:", err)
      setError("Failed to resend confirmation email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  // Success state - show confirmation message
  if (success) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Check Your Email</CardTitle>
                  <CardDescription>
                    We've sent a confirmation email to <strong>{registeredEmail}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Please check your email and click the confirmation link to activate your account.
                  </p>
                  <p className="text-sm text-gray-600">
                    Once confirmed, you can{" "}
                    <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
                      sign in to your account
                    </Link>
                    .
                  </p>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <p className="text-xs text-gray-500">Didn't receive the email? Check your spam folder.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                      className="w-full bg-transparent"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Confirmation Email
                        </>
                      )}
                    </Button>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Use a different email address
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Registration form
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>Join the community today!</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSignUp} className="space-y-4">
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
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Must be at least 6 characters"
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>
                    Already have an account?{" "}
                    <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
                      Sign in
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
