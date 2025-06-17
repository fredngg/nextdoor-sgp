"use client"

import { useAuth } from "@/lib/auth-context"
import { FirstLoginModal } from "./first-login-modal"

export function FirstLoginWrapper() {
  const { user, needsDisplayName, updateDisplayName } = useAuth()

  if (!user || !needsDisplayName) {
    return null
  }

  return <FirstLoginModal isOpen={needsDisplayName} onComplete={updateDisplayName} userId={user.id} />
}
