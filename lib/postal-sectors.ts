import { supabase } from "./supabase"

export interface PostalSector {
  id: number
  sector_code: string
  postal_district: number
  district_name: string
  region: string
  general_locations: string
  created_at: string
}

/**
 * Get postal sector information from a 6-digit postal code
 * Uses the first two digits to identify the sector
 */
export async function getPostalSectorFromCode(postalCode: string): Promise<PostalSector | null> {
  try {
    // Extract first two digits from postal code
    const sectorCode = postalCode.substring(0, 2)

    console.log(`Looking up postal sector for code: ${postalCode}, sector: ${sectorCode}`)

    const { data, error } = await supabase.from("postal_sectors").select("*").eq("sector_code", sectorCode).single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`No postal sector found for sector code: ${sectorCode}`)
        return null
      }
      throw new Error(`Failed to fetch postal sector: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error fetching postal sector:", error)
    return null
  }
}

/**
 * Generate community name based on postal sector and OneMap address details
 */
export function generateCommunityName(
  postalSector: PostalSector,
  block: string,
  buildingName: string,
  roadName: string,
  isCommercial: boolean,
): string {
  if (isCommercial) {
    return `${postalSector.district_name} Commercial`
  }

  // For buildings with proper names (condos, newer developments)
  if (buildingName && buildingName !== "NIL" && buildingName.trim() !== "") {
    return `${buildingName} Residents`
  }

  // For HDB blocks with road names (older estates)
  if (block && roadName) {
    const blockMatch = block.match(/\d+/)
    if (blockMatch) {
      const blockNum = Number.parseInt(blockMatch[0])
      const rangeStart = Math.floor(blockNum / 10) * 10
      const rangeEnd = rangeStart + 9

      // Use road name for older estates
      const cleanRoadName = roadName
        .replace(/\b(STREET|ROAD|AVENUE|LANE|DRIVE|CLOSE|CRESCENT|PLACE|WALK|PARK|TERRACE)\b/gi, "")
        .trim()

      return `${cleanRoadName} Blk ${rangeStart}–${rangeEnd}`
    }
  }

  // For landed properties or cases where we only have road name
  if (roadName) {
    const cleanRoadName = roadName
      .replace(/\b(STREET|ROAD|AVENUE|LANE|DRIVE|CLOSE|CRESCENT|PLACE|WALK|PARK|TERRACE)\b/gi, "")
      .trim()
    return `${cleanRoadName} Community`
  }

  // Fallback to district-based community
  return `${postalSector.district_name} Community`
}

/**
 * Generate community slug from community name
 */
export function generateCommunitySlug(communityName: string): string {
  return communityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/–/g, "-") // Replace em-dash with hyphen
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

/**
 * Get all postal sectors in a specific region
 */
export async function getPostalSectorsByRegion(region: string): Promise<PostalSector[]> {
  try {
    const { data, error } = await supabase
      .from("postal_sectors")
      .select("*")
      .eq("region", region)
      .order("postal_district", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch postal sectors by region: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error fetching postal sectors by region:", error)
    return []
  }
}

/**
 * Get all unique regions
 */
export async function getAllRegions(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("postal_sectors").select("region").order("region", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch regions: ${error.message}`)
    }

    // Get unique regions
    const uniqueRegions = [...new Set(data?.map((item) => item.region) || [])]
    return uniqueRegions
  } catch (error) {
    console.error("Error fetching regions:", error)
    return []
  }
}
