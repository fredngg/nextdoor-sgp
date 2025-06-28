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
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState("")

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validateEmail = (email: string) => {
    if (!email) {
      return "Email is required"
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    setLoading(true)
    setEmailError("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Login error:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to send login email",
          variant: "destructive",
        })
      } else {
        setEmailSent(true)
        toast({
          title: "Check your email!",
          description: "We've sent you a magic link to sign in",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isEmailValid = email && !validateEmail(email)

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Click the link in your email to sign in. The link will expire in 1 hour.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                }}
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center text-red-600 hover:text-red-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
          <CardTitle className="text-2xl">Welcome to NextDoor SG</CardTitle>
          <CardDescription>Enter your email to get started. We'll send you a magic link to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`pr-10 ${
                    emailError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : isEmailValid
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                  }`}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {emailError ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : isEmailValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              {emailError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading || !isEmailValid}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-red-600 hover:text-red-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-red-600 hover:text-red-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
