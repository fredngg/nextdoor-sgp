import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

export async function getUserDisplayName(userId: string): Promise<string | null> {
  try {
    console.log("🔍 getUserDisplayName: Fetching for userId:", userId)

    const { data, error } = await supabase.from("user_profiles").select("display_name").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ getUserDisplayName: Error fetching display name:", error)
      return null
    }

    const result = data?.display_name || null
    console.log("📝 getUserDisplayName: Result:", result)
    return result
  } catch (error) {
    console.error("💥 getUserDisplayName: Exception:", error)
    return null
  }
}

export async function setUserDisplayName(userId: string, displayName: string): Promise<boolean> {
  try {
    console.log("💾 setUserDisplayName: Starting save process")
    console.log("- userId:", userId)
    console.log("- displayName:", displayName)

    // First check if a profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single()

    console.log("🔍 setUserDisplayName: Existing profile check:", existingProfile ? "Found" : "Not found")
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ setUserDisplayName: Error checking existing profile:", fetchError)
    }

    let result

    if (existingProfile) {
      // Update existing profile
      console.log("🔄 setUserDisplayName: Updating existing profile")
      result = await supabase.from("user_profiles").update({ display_name: displayName }).eq("user_id", userId)
    } else {
      // Insert new profile
      console.log("➕ setUserDisplayName: Creating new profile")
      result = await supabase.from("user_profiles").insert({ user_id: userId, display_name: displayName })
    }

    if (result.error) {
      console.error("❌ setUserDisplayName: Database operation failed:", result.error)
      return false
    }

    console.log("✅ setUserDisplayName: Successfully saved display name")
    return true
  } catch (error) {
    console.error("💥 setUserDisplayName: Exception:", error)
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
