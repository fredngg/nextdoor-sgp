/**
 * Singapore Administrative Areas and their Regions
 * Based on Singapore's official planning areas and regions
 */
export const SINGAPORE_REGIONS = {
  // Central Region
  "Ang Mo Kio": "Central",
  Bishan: "Central",
  "Bukit Merah": "Central",
  "Bukit Timah": "Central",
  "Central Area": "Central",
  Geylang: "Central",
  Kallang: "Central",
  "Marine Parade": "Central",
  Novena: "Central",
  Queenstown: "Central",
  "Singapore River": "Central",
  "Toa Payoh": "Central",

  // East Region
  Bedok: "East",
  Changi: "East",
  "Pasir Ris": "East",
  Tampines: "East",

  // North Region
  "Central Water Catchment": "North",
  "Lim Chu Kang": "North",
  Mandai: "North",
  Sembawang: "North",
  Simpang: "North",
  "Sungei Kadut": "North",
  Woodlands: "North",
  Yishun: "North",

  // Northeast Region
  Hougang: "Northeast",
  "North-Eastern Islands": "Northeast",
  Punggol: "Northeast",
  Seletar: "Northeast",
  Sengkang: "Northeast",
  Serangoon: "Northeast",

  // West Region
  "Boon Lay": "West",
  "Bukit Batok": "West",
  "Bukit Panjang": "West",
  "Choa Chu Kang": "West",
  Clementi: "West",
  "Jurong East": "West",
  "Jurong West": "West",
  Pioneer: "West",
  Tengah: "West",
  Tuas: "West",
  "Western Islands": "West",
  "Western Water Catchment": "West",
} as const

export type SingaporeArea = keyof typeof SINGAPORE_REGIONS
export type SingaporeRegion = (typeof SINGAPORE_REGIONS)[SingaporeArea]

/**
 * Get region for a given area name
 */
export function getRegionForArea(areaName: string): SingaporeRegion | "Unknown" {
  return SINGAPORE_REGIONS[areaName as SingaporeArea] || "Unknown"
}

/**
 * Get all areas in a specific region
 */
export function getAreasInRegion(region: SingaporeRegion): SingaporeArea[] {
  return Object.keys(SINGAPORE_REGIONS).filter(
    (area) => SINGAPORE_REGIONS[area as SingaporeArea] === region,
  ) as SingaporeArea[]
}

/**
 * Extract area from street name using Singapore regions
 */
export function extractAreaFromStreet(streetName: string): string {
  const streetUpper = streetName.toUpperCase()

  // Check each area name
  for (const area of Object.keys(SINGAPORE_REGIONS)) {
    if (streetUpper.includes(area.toUpperCase())) {
      return area
    }
  }

  // Handle special cases and common variations
  const specialMappings: Record<string, string> = {
    ORCHARD: "Central Area",
    MARINA: "Central Area",
    RAFFLES: "Central Area",
    "BOAT QUAY": "Central Area",
    "CLARKE QUAY": "Central Area",
    SENTOSA: "Central Area",
    "EAST COAST": "Marine Parade",
    "WEST COAST": "Clementi",
  }

  for (const [keyword, area] of Object.entries(specialMappings)) {
    if (streetUpper.includes(keyword)) {
      return area
    }
  }

  return "Unknown"
}
