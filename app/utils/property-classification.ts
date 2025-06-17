export interface PropertyClassification {
  propertyType: "HDB" | "Condo" | "Landed"
  zoningType: "Residential" | "Industrial"
}

export function classifyProperty(buildingName: string, address: string): PropertyClassification {
  const buildingNameLower = buildingName.toLowerCase()
  const addressLower = address.toLowerCase()

  // Determine Property Type
  let propertyType: "HDB" | "Condo" | "Landed" = "HDB"

  if (buildingNameLower.includes("blk") || buildingName === "") {
    propertyType = "HDB"
  } else if (
    buildingNameLower.includes("residences") ||
    buildingNameLower.includes("condominium") ||
    buildingNameLower.includes("suites") ||
    buildingNameLower.includes("ville")
  ) {
    propertyType = "Condo"
  } else if (!buildingName || buildingName.trim() === "") {
    // If address is just a street name without building
    propertyType = "Landed"
  }

  // Determine Zoning Type
  let zoningType: "Residential" | "Industrial" = "Residential"

  if (
    addressLower.includes("industrial park") ||
    addressLower.includes("factory") ||
    addressLower.includes("technopark")
  ) {
    zoningType = "Industrial"
  }

  return { propertyType, zoningType }
}

export function getPropertyTypeIcon(type: "HDB" | "Condo" | "Landed"): string {
  switch (type) {
    case "HDB":
      return "🏠"
    case "Condo":
      return "🏢"
    case "Landed":
      return "🏡"
  }
}

export function getZoningTypeIcon(type: "Residential" | "Industrial"): string {
  switch (type) {
    case "Residential":
      return "🏘️"
    case "Industrial":
      return "🏭"
  }
}

export function getPropertyTypeColor(type: "HDB" | "Condo" | "Landed"): string {
  switch (type) {
    case "HDB":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Condo":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "Landed":
      return "bg-green-100 text-green-800 border-green-200"
  }
}

export function getZoningTypeColor(type: "Residential" | "Industrial"): string {
  switch (type) {
    case "Residential":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "Industrial":
      return "bg-orange-100 text-orange-800 border-orange-200"
  }
}
