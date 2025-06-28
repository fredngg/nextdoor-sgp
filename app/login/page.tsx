"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")

  // Email validation
  const validateEmail = (email: string) => {
    if (!email) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    // Clear errors when user starts typing
    if (error) setError("")
    if (emailError) setEmailError("")

    // Real-time validation
    if (value) {
      const validation = validateEmail(value)
      setEmailError(validation)
    }
  }

  const isEmailValid = email && !validateEmail(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email before submission
    const validation = validateEmail(email)
    if (validation) {
      setEmailError(validation)
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for the login link!")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to nextdoor.sg</CardTitle>
          <CardDescription>Enter your email to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="relative mt-1">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Enter your email"
                  className={`pr-10 ${
                    emailError
                      ? "border-red-500 focus:border-red-500"
                      : isEmailValid
                        ? "border-green-500 focus:border-green-500"
                        : ""
                  }`}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {email && (
                    <>
                      {emailError ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : isEmailValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </div>
              {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading || !isEmailValid}>
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>

          {message && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-red-600 hover:text-red-500">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-red-600 hover:text-red-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
