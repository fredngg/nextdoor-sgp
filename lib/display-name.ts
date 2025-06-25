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

    // Direct query without timeout to see if that's the issue
    const { data, error } = await supabase.from("user_profiles").select("display_name").eq("user_id", userId).single()

    console.log("✅ getUserDisplayName: Query completed")
    console.log("- data:", data)
    console.log("- error:", error)
    console.log("- error code:", error?.code)
    console.log("- error message:", error?.message)

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
    console.error("💥 getUserDisplayName: Exception caught:", error)
    return null
  }
}

export async function setUserDisplayName(userId: string, displayName: string): Promise<boolean> {
  console.log("💾 setUserDisplayName: STARTING")
  console.log("- userId:", userId)
  console.log("- displayName:", displayName)

  try {
    // First check if a profile already exists
    console.log("🔍 setUserDisplayName: Checking for existing profile...")

    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single()

    console.log("🔍 setUserDisplayName: Existing profile check result:")
    console.log("- existingProfile:", existingProfile)
    console.log("- fetchError:", fetchError)
    console.log("- fetchError code:", fetchError?.code)

    let result

    if (existingProfile) {
      // Update existing profile
      console.log("🔄 setUserDisplayName: Updating existing profile with id:", existingProfile.id)

      result = await supabase.from("user_profiles").update({ display_name: displayName }).eq("user_id", userId)

      console.log("🔄 setUserDisplayName: Update result:", result)
    } else {
      // Insert new profile
      console.log("➕ setUserDisplayName: Creating new profile")

      result = await supabase.from("user_profiles").insert({
        user_id: userId,
        display_name: displayName,
      })

      console.log("➕ setUserDisplayName: Insert result:", result)
    }

    const { error } = result

    if (error) {
      console.error("❌ setUserDisplayName: Database operation failed:", error)
      console.error("❌ Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return false
    }

    console.log("✅ setUserDisplayName: Successfully saved display name")

    // Let's verify it was actually saved by reading it back
    console.log("🔍 setUserDisplayName: Verifying save by reading back...")
    const verifyResult = await supabase.from("user_profiles").select("display_name").eq("user_id", userId).single()

    console.log("🔍 setUserDisplayName: Verification result:", verifyResult)

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
