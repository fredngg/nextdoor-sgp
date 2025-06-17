"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
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
  signIn: (email: string) => Promise<{ error: Error | null }>
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

  const fetchDisplayName = async (userId: string) => {
    try {
      console.log("🔄 AuthContext: Fetching display name for user:", userId)
      const name = await getUserDisplayName(userId)
      console.log("📝 AuthContext: Display name result:", name)

      setDisplayName(name)
      const needsName = !name
      setNeedsDisplayName(needsName)

      console.log("🎯 AuthContext: needsDisplayName set to:", needsName)
    } catch (error) {
      console.error("💥 AuthContext: Error fetching display name:", error)
      setNeedsDisplayName(true)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("🚀 AuthContext: Getting initial session")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("📋 AuthContext: Initial session:", session?.user?.id || "No session")

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchDisplayName(session.user.id)
        }
      } catch (error) {
        console.error("💥 AuthContext: Error getting initial session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthContext: Auth state change:", event, session?.user?.id || "No user")

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchDisplayName(session.user.id)
      } else {
        setDisplayName(null)
        setNeedsDisplayName(false)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateDisplayName = (name: string) => {
    console.log("🎯 AuthContext: updateDisplayName called with:", name)
    setDisplayName(name)
    setNeedsDisplayName(false)
    console.log("✅ AuthContext: Display name updated, needsDisplayName set to false")
  }

  const value = {
    user,
    session,
    isLoading,
    displayName,
    needsDisplayName,
    signIn,
    signOut,
    updateDisplayName,
  }

  // Debug logging
  console.log("🔍 AuthContext render state:")
  console.log("- user:", user?.id || "No user")
  console.log("- isLoading:", isLoading)
  console.log("- displayName:", displayName)
  console.log("- needsDisplayName:", needsDisplayName)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
