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
    console.log("🔄 AuthContext: STARTING fetchDisplayName for user:", userId)

    try {
      console.log("🔄 AuthContext: About to call getUserDisplayName...")

      // Add a reasonable timeout but longer than before
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log("⏰ AuthContext: fetchDisplayName TIMEOUT after 30 seconds")
          reject(new Error("Display name fetch timeout"))
        }, 30000) // 30 seconds - much longer but not infinite
      })

      const displayNamePromise = getUserDisplayName(userId)
      console.log("🔄 AuthContext: Created promises, starting race...")

      const name = await Promise.race([displayNamePromise, timeoutPromise])
      console.log("✅ AuthContext: fetchDisplayName SUCCESS, result:", name)

      setDisplayName(name as string | null)
      const needsName = !name
      setNeedsDisplayName(needsName)

      console.log("🎯 AuthContext: needsDisplayName set to:", needsName)
    } catch (error) {
      console.error("💥 AuthContext: fetchDisplayName ERROR:", error)
      // On timeout or error, check if we already have a display name in state
      if (!displayName) {
        console.log("🔧 AuthContext: No existing display name, setting needsDisplayName=true")
        setDisplayName(null)
        setNeedsDisplayName(true)
      } else {
        console.log("🔧 AuthContext: Keeping existing display name, not showing modal")
      }
    }

    console.log("🏁 AuthContext: fetchDisplayName COMPLETED")
  }

  useEffect(() => {
    console.log("🚀 AuthContext: useEffect STARTING")

    // Get initial session
    const getInitialSession = async () => {
      console.log("🔄 AuthContext: getInitialSession STARTING")

      try {
        console.log("🔄 AuthContext: About to call supabase.auth.getSession()...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("✅ AuthContext: getSession SUCCESS:", session?.user?.id || "No session")

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log("🔄 AuthContext: User found, calling fetchDisplayName...")
          await fetchDisplayName(session.user.id)
          console.log("✅ AuthContext: fetchDisplayName completed in getInitialSession")
        } else {
          console.log("ℹ️ AuthContext: No user in initial session")
        }
      } catch (error) {
        console.error("💥 AuthContext: getInitialSession ERROR:", error)
        setSession(null)
        setUser(null)
        setDisplayName(null)
        setNeedsDisplayName(false)
      } finally {
        console.log("🏁 AuthContext: Setting isLoading to false")
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log("🔄 AuthContext: Setting up onAuthStateChange listener...")

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 AuthContext: onAuthStateChange TRIGGERED:", event, session?.user?.id || "No user")

      // Skip fetching display name on auth state changes to prevent loops
      if (event === "TOKEN_REFRESHED") {
        console.log("🔄 AuthContext: Token refresh - skipping display name fetch")
        return
      }

      console.log("🔔 AuthContext: Session details:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
      })

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && event !== "TOKEN_REFRESHED") {
        console.log("🔄 AuthContext: User found in auth change, calling fetchDisplayName...")
        await fetchDisplayName(session.user.id)
        console.log("✅ AuthContext: fetchDisplayName completed in onAuthStateChange")
      } else {
        console.log("ℹ️ AuthContext: No user in auth change, clearing display name")
        setDisplayName(null)
        setNeedsDisplayName(false)
      }

      console.log("🏁 AuthContext: Setting isLoading to false after auth change")
      setIsLoading(false)
    })

    console.log("✅ AuthContext: Auth listener setup complete")

    return () => {
      console.log("🧹 AuthContext: Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string) => {
    console.log("🔄 AuthContext: signIn called with email:", email)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log("✅ AuthContext: signInWithOtp completed, error:", error)
      return { error }
    } catch (error) {
      console.error("💥 AuthContext: signIn ERROR:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    console.log("🔄 AuthContext: signOut called")

    try {
      await supabase.auth.signOut()
      console.log("✅ AuthContext: signOut completed")
      router.push("/")
    } catch (error) {
      console.error("💥 AuthContext: signOut ERROR:", error)
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
