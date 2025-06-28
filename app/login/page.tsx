"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "../components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState("")

  // Email validation function
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

  // Check if email is valid
  const isEmailValid = email && !validateEmail(email)

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

    // Validate email before submission
    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    setIsLoading(true)
    setEmailError("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
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
          title: "Email Sent!",
          description: "Check your email for the login link",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-16 max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Check Your Email</CardTitle>
                <CardDescription>
                  We've sent a login link to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Click the link in your email to complete the login process. The link will expire in 1 hour.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail("")
                  }}
                  className="w-full"
                >
                  Use Different Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your email to receive a login link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
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

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading || !isEmailValid}
                >
                  {isLoading ? "Sending..." : "Send Login Link"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Don't have an account? No problem! We'll create one for you automatically when you first log in.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
