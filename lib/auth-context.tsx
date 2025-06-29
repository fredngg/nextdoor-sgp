"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { useRouter } from "next/navigation"
import { getUserDisplayName } from "./display-name"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  displayName: string | null
  needsDisplayName: boolean
  signOut: () => Promise<void>
  updateDisplayName: (name: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [needsDisplayName, setNeedsDisplayName] = useState(false)
  const router = useRouter()

  const fetchDisplayName = useCallback(async (userId: string) => {
    console.log("🔄 AuthContext: Fetching display name for user:", userId)
    try {
      const name = await getUserDisplayName(userId)
      console.log("✅ AuthContext: Fetched display name:", name)
      setDisplayName(name)
      setNeedsDisplayName(!name)

      if (!name) {
        console.log("🎯 AuthContext: No display name found, will show modal")
      }
    } catch (error) {
      console.error("💥 AuthContext: Error fetching display name:", error)
      setDisplayName(null)
      setNeedsDisplayName(true) // Assume name is needed if fetch fails
    }
  }, [])

  useEffect(() => {
    console.log("🚀 AuthContext: Initializing auth context")

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ AuthContext: Error getting initial session:", error)
        }

        console.log(
          "✅ AuthContext: Initial session:",
          session
            ? {
                userId: session.user.id,
                email: session.user.email,
                emailConfirmed: !!session.user.email_confirmed_at,
              }
            : "No session",
        )

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchDisplayName(session.user.id)
        }
      } catch (error) {
        console.error("💥 AuthContext: Error in getInitialSession:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 AuthContext: Auth state change:", event)
      console.log("👤 Session user:", session?.user?.id || "No user")

      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("🎉 AuthContext: User signed in, fetching display name")
        await fetchDisplayName(session.user.id)
      } else if (event === "SIGNED_OUT") {
        console.log("👋 AuthContext: User signed out, clearing state")
        setDisplayName(null)
        setNeedsDisplayName(false)
      }

      setIsLoading(false)
    })

    return () => {
      console.log("🧹 AuthContext: Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [fetchDisplayName])

  const signOut = async () => {
    console.log("🔄 AuthContext: Signing out")
    try {
      await supabase.auth.signOut()
      setDisplayName(null)
      setNeedsDisplayName(false)
      router.push("/")
    } catch (error) {
      console.error("💥 AuthContext: Error signing out:", error)
    }
  }

  const updateDisplayName = (name: string) => {
    console.log("🎯 AuthContext: Updating display name to:", name)
    setDisplayName(name)
    setNeedsDisplayName(false)
  }

  const value = {
    user,
    session,
    isLoading,
    displayName,
    needsDisplayName,
    signOut,
    updateDisplayName,
  }

  console.log("🔍 AuthContext: Current state:", {
    hasUser: !!user,
    isLoading,
    displayName,
    needsDisplayName,
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
