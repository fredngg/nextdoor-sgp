import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Get OneMap token from environment variable
    const oneMapToken = process.env.ONEMAP_API_TOKEN

    if (!oneMapToken) {
      console.error("❌ ONEMAP_API_TOKEN not found in environment variables")
      return NextResponse.json({ error: "OneMap API token not configured" }, { status: 500 })
    }

    console.log("🔍 Searching OneMap for postal code:", query)

    // Search OneMap API
    const oneMapResponse = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y`,
      {
        headers: {
          Authorization: `Bearer ${oneMapToken}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!oneMapResponse.ok) {
      console.error("OneMap API error:", oneMapResponse.status, oneMapResponse.statusText)
      return NextResponse.json({ error: "OneMap API request failed" }, { status: oneMapResponse.status })
    }

    const data = await oneMapResponse.json()
    console.log("✅ OneMap API response received")

    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
