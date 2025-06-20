"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "../components/navigation"
import { Footer } from "../components/footer"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { user, signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // If user is already logged in, redirect to /me
  if (user) {
    router.push("/me")
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)

    try {
      const { error } = await signIn(email)

      if (error) {
        toast({
          title: "Login failed",
          description: "We couldn't send the link. Please try again.",
          variant: "destructive",
        })
      } else {
        setIsSent(true)
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to log in.",
        })
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "We couldn't send the link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16 flex flex-col">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center flex-1">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome to nextdoor.sg</CardTitle>
              <CardDescription>Connect with your local HDB or condo community.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isSent ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Enter your email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send me a login link"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <h3 className="text-lg font-medium mb-2">Check your inbox</h3>
                  <p className="text-gray-600 mb-4">
                    We've sent a magic link to <span className="font-medium">{email}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the link in the email to log in to your account. The link will expire in 24 hours.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center border-t pt-4 space-y-3">
              <p className="text-sm text-gray-500 text-center">
                By continuing, you agree to nextdoor.sg's{" "}
                <Link href="/terms" className="text-red-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-red-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  )
}
