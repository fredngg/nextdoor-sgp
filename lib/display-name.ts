import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

export async function getUserDisplayName(userId: string): Promise<string | null> {
  console.log("🔍 getUserDisplayName: STARTING for userId:", userId)

  try {
    console.log("🔍 getUserDisplayName: About to query user_profiles table...")

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log("⏰ getUserDisplayName: TIMEOUT after 5 seconds")
        reject(new Error("getUserDisplayName timeout"))
      }, 5000)
    })

    const queryPromise = supabase.from("user_profiles").select("display_name").eq("user_id", userId).single()

    console.log("🔍 getUserDisplayName: Starting Promise.race...")

    const result = await Promise.race([queryPromise, timeoutPromise])
    const { data, error } = result as any

    console.log("✅ getUserDisplayName: Query completed")
    console.log("- data:", data)
    console.log("- error:", error)

    if (error && error.code !== "PGRST116") {
      console.error("❌ getUserDisplayName: Error fetching display name:", error)
      return null
    }

    const displayName = data?.display_name || null
    console.log("📝 getUserDisplayName: Final result:", displayName)
    return displayName
  } catch (error) {
    console.error("💥 getUserDisplayName: Exception caught:", error)
    return null
  }
}

export async function setUserDisplayName(userId: string, displayName: string): Promise<boolean> {
  console.log("💾 setUserDisplayName: STARTING")
  console.log("- userId:", userId)
  console.log("- displayName:", displayName)

  try {
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log("⏰ setUserDisplayName: TIMEOUT after 5 seconds")
        reject(new Error("setUserDisplayName timeout"))
      }, 5000)
    })

    // First check if a profile already exists
    console.log("🔍 setUserDisplayName: Checking for existing profile...")

    const existingProfilePromise = supabase.from("user_profiles").select("id").eq("user_id", userId).single()

    const existingResult = await Promise.race([existingProfilePromise, timeoutPromise])
    const { data: existingProfile, error: fetchError } = existingResult as any

    console.log("🔍 setUserDisplayName: Existing profile check result:")
    console.log("- existingProfile:", existingProfile)
    console.log("- fetchError:", fetchError)

    let result

    if (existingProfile) {
      // Update existing profile
      console.log("🔄 setUserDisplayName: Updating existing profile")
      const updatePromise = supabase.from("user_profiles").update({ display_name: displayName }).eq("user_id", userId)

      result = await Promise.race([updatePromise, timeoutPromise])
    } else {
      // Insert new profile
      console.log("➕ setUserDisplayName: Creating new profile")
      const insertPromise = supabase.from("user_profiles").insert({ user_id: userId, display_name: displayName })

      result = await Promise.race([insertPromise, timeoutPromise])
    }

    const { error } = result as any

    if (error) {
      console.error("❌ setUserDisplayName: Database operation failed:", error)
      return false
    }

    console.log("✅ setUserDisplayName: Successfully saved display name")
    return true
  } catch (error) {
    console.error("💥 setUserDisplayName: Exception caught:", error)
    return false
  }
}

export function validateDisplayName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Display name cannot be empty" }
  }

  const trimmedName = name.trim()
  if (trimmedName.length < 2) {
    return { isValid: false, error: "Display name must be at least 2 characters" }
  }

  if (trimmedName.length > 30) {
    return { isValid: false, error: "Display name must be 30 characters or less" }
  }

  return { isValid: true }
}

export function getDisplayNameFallback(email?: string, userId?: string): string {
  if (email) {
    return email.split("@")[0]
  }

  if (userId) {
    const shortId = userId.slice(-4).toUpperCase()
    return `Resident${shortId}`
  }

  return "Anonymous User"
}
