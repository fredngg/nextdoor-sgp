import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get("postalCode")

    if (!postalCode) {
      return NextResponse.json({ error: "Postal code is required" }, { status: 400 })
    }

    // Debug environment variable
    console.log("🔍 DEBUG: Checking ONEMAP_API_TOKEN environment variable...")
    const oneMapToken = process.env.ONEMAP_API_TOKEN

    if (!oneMapToken) {
      console.error("❌ ERROR: ONEMAP_API_TOKEN environment variable is not set!")
      return NextResponse.json(
        { error: "OneMap API token is not configured. Please contact support." },
        { status: 500 },
      )
    }

    console.log("✅ DEBUG: ONEMAP_API_TOKEN found, length:", oneMapToken.length)
    console.log("🔍 DEBUG: Searching for postal code:", postalCode)

    const oneMapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
    console.log("🌐 DEBUG: OneMap URL:", oneMapUrl)

    const response = await fetch(oneMapUrl, {
      headers: {
        Authorization: `Bearer ${oneMapToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 DEBUG: OneMap response status:", response.status)
    console.log("📡 DEBUG: OneMap response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ ERROR: OneMap API failed with status:", response.status)
      console.error("❌ ERROR: OneMap error response:", errorText)

      return NextResponse.json(
        {
          error: `OneMap API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ DEBUG: OneMap response data:", JSON.stringify(data, null, 2))

    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 ERROR: Unexpected error in onemap-search API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
