import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      // Redirect to an error page or login page with an error message
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed. Please try again.`)
    }
  }

  // URL to redirect to after sign in process completes
  // For new users, this will trigger the FirstLoginModal via the AuthContext
  return NextResponse.redirect(`${requestUrl.origin}/me`)
}
