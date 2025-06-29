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
    } catch (error) {
      console.error("💥 AuthContext: Error fetching display name:", error)
      setDisplayName(null)
      setNeedsDisplayName(true) // Assume name is needed if fetch fails
    }
  }, [])

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchDisplayName(session.user.id)
      }
      setIsLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 AuthContext: onAuthStateChange event:", event)
      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchDisplayName(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setDisplayName(null)
        setNeedsDisplayName(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchDisplayName])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const updateDisplayName = (name: string) => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
