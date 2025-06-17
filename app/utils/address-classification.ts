export interface AddressClassification {
  isCommercial: boolean
  isResidential: boolean
}

export function classifyAddress(buildingName: string, address: string, street: string): AddressClassification {
  const buildingNameLower = buildingName.toLowerCase()
  const addressLower = address.toLowerCase()
  const streetLower = street.toLowerCase()

  // Commercial building keywords
  const commercialKeywords = [
    "tower",
    "plaza",
    "centre",
    "center", // Alternative spelling
    "square",
    "business park",
    "mall",
    "hotel",
    "atrium",
    "arcade",
    "hub",
    "retail",
    "office",
    "commercial",
    "shopping",
    "complex",
  ]

  // Commercial street indicators
  const commercialStreets = [
    "clemenceau",
    "orchard",
    "raffles",
    "bugis",
    "marina",
    "shenton",
    "tampines central",
    "paya lebar",
    "tanjong pagar",
    "robinson",
    "cecil",
    "battery",
    "collyer",
    "boat quay",
    "clarke quay",
  ]

  // Check building name for commercial keywords
  const hasCommercialBuilding = commercialKeywords.some((keyword) => buildingNameLower.includes(keyword))

  // Check address for commercial keywords
  const hasCommercialAddress = commercialKeywords.some((keyword) => addressLower.includes(keyword))

  // Check street for commercial indicators
  const hasCommercialStreet = commercialStreets.some((street) => streetLower.includes(street))

  const isCommercial = hasCommercialBuilding || hasCommercialAddress || hasCommercialStreet

  return {
    isCommercial,
    isResidential: !isCommercial,
  }
}
