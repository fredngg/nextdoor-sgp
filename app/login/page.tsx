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
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState("")

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("")
    }

    // Validate email format
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setEmailError("Email is required")
      return
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    setLoading(true)
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
          description: error.message,
          variant: "destructive",
        })
      } else {
        setEmailSent(true)
        toast({
          title: "Check your email",
          description: "We've sent you a login link",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Failed to send login email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isEmailValid = email && validateEmail(email)

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a login link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>Click the link in your email to sign in. You can close this tab.</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false)
                setEmail("")
              }}
              className="w-full mt-4"
            >
              Use different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Enter your email to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Enter your email"
                  className={`${
                    emailError ? "border-red-500 pr-10" : isEmailValid ? "border-green-500 pr-10" : "pr-10"
                  }`}
                  disabled={loading}
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
              {emailError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading || !isEmailValid}>
              {loading ? "Sending..." : "Send login link"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an account? You'll be able to create one after clicking the login link.</p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-red-600 hover:text-red-700">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
