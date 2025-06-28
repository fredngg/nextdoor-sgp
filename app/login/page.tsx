"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Navigation } from "../components/navigation"
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = emailRegex.test(email)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Clear errors when user starts typing
    if (error) setError("")
    if (message) setMessage("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setEmailSent(true)
        setMessage(`Check your email! We've sent a login link to ${email}`)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>

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
                      Click the link in your email to sign in. The link will expire in 1 hour.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">Didn't receive the email? Check your spam folder.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEmailSent(false)
                        setEmail("")
                        setMessage("")
                      }}
                      className="w-full"
                    >
                      Try Different Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>

            <Card>
              <CardHeader className="text-center">
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your email to receive a secure login link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Enter your email"
                        className={`pr-10 ${
                          email && !isEmailValid
                            ? "border-red-500 focus:border-red-500"
                            : email && isEmailValid
                              ? "border-green-500 focus:border-green-500"
                              : ""
                        }`}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {email &&
                          (isEmailValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ))}
                        {!email && <Mail className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    {email && !isEmailValid && (
                      <p className="text-sm text-red-600">Please enter a valid email address</p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {message && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={loading || !isEmailValid}
                  >
                    {loading ? "Sending..." : "Send Login Link"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>
                    New to our community?{" "}
                    <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
                      Explore communities
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
