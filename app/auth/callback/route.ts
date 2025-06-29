import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  console.log("🔄 Auth Callback: Processing callback")
  console.log("📝 Code present:", !!code)
  console.log("❌ Error:", error)
  console.log("📄 Error description:", errorDescription)

  // Handle error cases
  if (error) {
    console.error("❌ Auth Callback: Error in callback:", error, errorDescription)
    const errorMessage = errorDescription || error
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log("🔄 Auth Callback: Exchanging code for session")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("❌ Auth Callback: Error exchanging code:", exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log("✅ Auth Callback: Successfully exchanged code for session")
      console.log("👤 User ID:", data.user?.id)
      console.log("📧 Email confirmed:", !!data.user?.email_confirmed_at)

      if (data.user && data.session) {
        // Check if this is the user's first time logging in
        const isFirstLogin = !data.user.last_sign_in_at || data.user.created_at === data.user.last_sign_in_at

        console.log("🔍 Auth Callback: First login?", isFirstLogin)

        // Redirect to home page - the AuthContext will handle showing the display name modal if needed
        return NextResponse.redirect(`${requestUrl.origin}/`)
      } else {
        console.error("❌ Auth Callback: No user or session after exchange")
        return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`)
      }
    } catch (err) {
      console.error("💥 Auth Callback: Unexpected error:", err)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`)
    }
  }

  console.log("❌ Auth Callback: No code provided")
  return NextResponse.redirect(`${requestUrl.origin}/login?error=No authentication code provided`)
}
