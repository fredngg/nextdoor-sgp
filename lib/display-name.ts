import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

export async function getUserDisplayName(userId: string): Promise<string | null> {
  console.log("🔍 getUserDisplayName: STARTING for userId:", userId)
  const startTime = Date.now()

  try {
    console.log("🔍 getUserDisplayName: About to query user_profiles table...")

    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log("⏰ getUserDisplayName: TIMEOUT after 20 seconds")
        reject(new Error("getUserDisplayName timeout"))
      }, 20000)
    })

    const queryPromise = supabase.from("user_profiles").select("display_name").eq("user_id", userId).single()

    const result = await Promise.race([queryPromise, timeoutPromise])
    const { data, error } = result as any

    const duration = Date.now() - startTime
    console.log(`✅ getUserDisplayName: Query completed in ${duration}ms`)
    console.log("- data:", data)
    console.log("- error:", error)
    console.log("- error code:", error?.code)

    // PGRST116 means "no rows returned" - that's expected for new users
    if (error && error.code !== "PGRST116") {
      console.error("❌ getUserDisplayName: Unexpected error:", error)
      return null
    }

    // If no error or just "no rows" error, check data
    const displayName = data?.display_name || null
    console.log("📝 getUserDisplayName: Final result:", displayName)
    return displayName
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`💥 getUserDisplayName: Exception after ${duration}ms:`, error)
    return null
  }
}

export async function setUserDisplayName(userId: string, displayName: string): Promise<boolean> {
  console.log("💾 setUserDisplayName: STARTING")
  console.log("- userId:", userId)
  console.log("- displayName:", displayName)
  const startTime = Date.now()

  try {
    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log("⏰ setUserDisplayName: TIMEOUT after 20 seconds")
        reject(new Error("setUserDisplayName timeout"))
      }, 20000)
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
      console.log("🔄 setUserDisplayName: Updating existing profile with id:", existingProfile.id)

      const updatePromise = supabase.from("user_profiles").update({ display_name: displayName }).eq("user_id", userId)
      result = await Promise.race([updatePromise, timeoutPromise])

      console.log("🔄 setUserDisplayName: Update result:", result)
    } else {
      // Insert new profile
      console.log("➕ setUserDisplayName: Creating new profile")

      const insertPromise = supabase.from("user_profiles").insert({
        user_id: userId,
        display_name: displayName,
      })
      result = await Promise.race([insertPromise, timeoutPromise])

      console.log("➕ setUserDisplayName: Insert result:", result)
    }

    const { error } = result as any

    if (error) {
      console.error("❌ setUserDisplayName: Database operation failed:", error)
      return false
    }

    const duration = Date.now() - startTime
    console.log(`✅ setUserDisplayName: Successfully saved display name in ${duration}ms`)

    return true
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`💥 setUserDisplayName: Exception after ${duration}ms:`, error)
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
