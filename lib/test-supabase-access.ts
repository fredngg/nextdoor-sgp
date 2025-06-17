// Test file to verify Supabase access without authentication
import { createClient } from "@supabase/supabase-js"

// Create a client without any authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const testClient = createClient(supabaseUrl, supabaseAnonKey)

export async function testUnauthenticatedAccess() {
  console.log("🧪 Testing unauthenticated access...")

  try {
    // Test 1: Postal sectors
    console.log("📍 Testing postal_sectors access...")
    const { data: sectors, error: sectorsError } = await testClient
      .from("postal_sectors")
      .select("sector_code, district_name")
      .limit(1)

    if (sectorsError) {
      console.error("❌ Postal sectors error:", sectorsError)
    } else {
      console.log("✅ Postal sectors accessible:", sectors?.length || 0, "records")
    }

    // Test 2: Communities
    console.log("🏘️ Testing communities access...")
    const { data: communities, error: communitiesError } = await testClient
      .from("communities")
      .select("slug, name")
      .limit(1)

    if (communitiesError) {
      console.error("❌ Communities error:", communitiesError)
    } else {
      console.log("✅ Communities accessible:", communities?.length || 0, "records")
    }

    // Test 3: Posts
    console.log("📝 Testing posts access...")
    const { data: posts, error: postsError } = await testClient.from("posts").select("id, title").limit(1)

    if (postsError) {
      console.error("❌ Posts error:", postsError)
    } else {
      console.log("✅ Posts accessible:", posts?.length || 0, "records")
    }

    // Test 4: Try to insert a community (should work)
    console.log("➕ Testing community creation...")
    const { data: newCommunity, error: insertError } = await testClient
      .from("communities")
      .insert({
        slug: "test-community-" + Date.now(),
        name: "Test Community",
        area: "Test Area",
        region: "Central",
        member_count: 0,
      })
      .select()

    if (insertError) {
      console.error("❌ Community creation error:", insertError)
    } else {
      console.log("✅ Community creation works:", newCommunity)
    }
  } catch (error) {
    console.error("💥 Test failed:", error)
  }
}
