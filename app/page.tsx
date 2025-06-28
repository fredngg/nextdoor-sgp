"use client"
import { MapPin, Building, Users, Globe } from "lucide-react"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "./components/navigation"
import { Footer } from "./components/footer"
import { CommercialFallback } from "./components/commercial-fallback"
import { classifyAddress, type AddressClassification } from "./utils/address-classification"
import {
  getPostalSectorFromCode,
  generateCommunityName,
  generateCommunitySlug,
  type PostalSector,
} from "@/lib/postal-sectors"

interface LocationData {
  postalCode: string
  block: string
  street: string
  area: string
  community: string
  communitySlug: string
  region: string
  latitude: number
  longitude: number
  fullAddress: string
  buildingName: string
  addressClassification: AddressClassification
  postalSector: PostalSector
}

interface FeatureProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  reverse?: boolean
}

function FeatureSection({ title, description, imageSrc, imageAlt, reverse = false }: FeatureProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`py-16 px-4 transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="container mx-auto max-w-6xl">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}
        >
          {/* Text Content */}
          <div className={`space-y-6 ${reverse ? "lg:col-start-2" : ""} order-2 lg:order-none`}>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">{title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Image Content */}
          <div className={`${reverse ? "lg:col-start-1" : ""} order-1 lg:order-none`}>
            <div className="relative">
              <img
                src={imageSrc || "/placeholder.svg"}
                alt={imageAlt}
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NextDoorSG() {
  const [postalCode, setPostalCode] = useState("")
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showHero, setShowHero] = useState(true)

  // Effect to handle hero visibility based on search results
  useEffect(() => {
    console.log("👁️ DEBUG [page.tsx]: Hero visibility effect triggered:", {
      hasLocationData: !!locationData,
      showHero: locationData ? false : true,
    })
    if (locationData) {
      setShowHero(false)
    } else {
      // Small delay to allow fade-in animation
      const timer = setTimeout(() => {
        setShowHero(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [locationData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postalCode.trim()) return

    setLoading(true)
    setError("")
    setLocationData(null)

    console.log("🔍 DEBUG [page.tsx]: Starting search for postal code:", postalCode.trim())
    console.log("🔍 DEBUG [page.tsx]: Form submission triggered")

    try {
      // Validate postal code format
      if (!/^\d{6}$/.test(postalCode.trim())) {
        setError("Please enter a valid 6-digit Singapore postal code")
        return
      }

      console.log("✅ DEBUG [page.tsx]: Postal code validation passed:", postalCode.trim())

      console.log("Searching for postal code:", postalCode)

      // First, get postal sector information
      const postalSector = await getPostalSectorFromCode(postalCode)
      if (!postalSector) {
        setError("Invalid postal code. Please check and try again.")
        return
      }

      console.log("✅ DEBUG [page.tsx]: Postal sector lookup successful:", {
        sector: postalSector.sector_code,
        district: postalSector.district_name,
        region: postalSector.region,
        postalCode: postalCode,
      })

      // Then fetch detailed address information from OneMap via our API route
      console.log("🌐 DEBUG [page.tsx]: About to call OneMap API via /api/onemap-search")
      console.log("🌐 DEBUG [page.tsx]: API URL:", `/api/onemap-search?postalCode=${postalCode}`)

      const response = await fetch(`/api/onemap-search?postalCode=${postalCode}`)

      console.log("📡 DEBUG [page.tsx]: OneMap API response received:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch location data. Status: ${response.status}`)
      }

      const data = await response.json()

      const resultsCount = data.results?.length || 0

      console.log("📊 DEBUG [page.tsx]: OneMap response data:", {
        resultsCount: resultsCount,
        firstResult: data.results?.[0] || null,
        rawData: data,
      })

      if (!data.results || data.results.length === 0) {
        setError("We couldn't find detailed information for this postal code. Please try again.")
        return
      }

      const result = data.results[0]
      const block = result.BLK_NO || ""
      const street = result.ROAD_NAME || "Unknown Street"
      const roadName = result.ROAD_NAME || ""
      const fullAddress = result.ADDRESS || "Unknown Address"
      const buildingName = result.BUILDING || ""
      const latitude = Number.parseFloat(result.LATITUDE)
      const longitude = Number.parseFloat(result.LONGITUDE)

      console.log("🏠 DEBUG [page.tsx]: Extracted address data:", {
        block,
        street,
        roadName,
        fullAddress,
        buildingName,
        latitude,
        longitude,
        coordinates: `${latitude}, ${longitude}`,
      })

      // Classify the address type
      const addressClassification = classifyAddress(buildingName, fullAddress, street)

      console.log("🏷️ DEBUG [page.tsx]: Address classification result:", {
        isCommercial: addressClassification.isCommercial,
        isHDB: addressClassification.isHDB,
        isCondo: addressClassification.isCondo,
        buildingType: addressClassification.buildingType,
        confidence: addressClassification.confidence,
      })

      // Generate community information based on postal sector
      const community = generateCommunityName(
        postalSector,
        block,
        buildingName,
        roadName,
        addressClassification.isCommercial,
      )
      const communitySlug = generateCommunitySlug(community)

      console.log("🏘️ DEBUG [page.tsx]: Community generation complete:", {
        community,
        communitySlug,
        region: postalSector.region,
        district: postalSector.district_name,
      })

      console.log("✅ DEBUG [page.tsx]: Final location data object:", {
        postalCode,
        block,
        street,
        area: postalSector.district_name,
        community,
        communitySlug,
        region: postalSector.region,
        fullAddress,
        buildingName,
        addressClassification,
        coordinates: { latitude, longitude },
      })

      setLocationData({
        postalCode,
        block,
        street,
        area: postalSector.district_name,
        community,
        communitySlug,
        region: postalSector.region,
        latitude,
        longitude,
        fullAddress,
        buildingName,
        addressClassification,
        postalSector,
      })
    } catch (err) {
      console.error("❌ DEBUG [page.tsx]: Error in handleSubmit:", {
        error: err,
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        postalCode: postalCode.trim(),
      })
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      console.log("🏁 DEBUG [page.tsx]: Search process completed, loading state set to false")
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    console.log("🧹 DEBUG [page.tsx]: Clearing search results and resetting form")
    setPostalCode("")
    setLocationData(null)
    setError("")
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white pt-16 flex flex-col">
        {/* Hero Section with Split Layout */}
        <div className="bg-white">
          <div className="container mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
            {/* Hero Split Layout - Only show when no search results */}
            <div
              className={`transition-opacity duration-500 ease-in-out ${
                showHero ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Main CTA */}
                <div className="flex flex-col justify-center h-full order-2 lg:order-1">
                  <div className="space-y-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight lg:text-5xl">
                      Discover and Connect With Your Neighbours
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      MyNextDoor.sg helps you find and join real communities based on your HDB or condo address. Ask for
                      help, share updates, borrow something, or just say hello! 👋
                    </p>
                  </div>

                  {/* Search Form */}
                  <div className="space-y-4 mt-8">
                    <div className="mb-0">
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-0">Find Your Community</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-3">
                        <label htmlFor="postal-code" className="text-sm font-medium text-gray-700 block">
                          Enter your Singapore postal code
                        </label>
                        <div className="flex gap-3">
                          <input
                            id="postal-code"
                            type="text"
                            placeholder="e.g., 520123"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            maxLength={6}
                            pattern="[0-9]{6}"
                            className="text-lg px-4 py-5 w-56 h-16 bg-gray-100 border-0 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all duration-200 placeholder:text-gray-500"
                            aria-label="Postal Code"
                          />
                          {locationData && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleClearSearch}
                              className="px-4 py-3 bg-transparent h-16"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-56 bg-red-600 hover:bg-red-700 text-base py-4 h-12 font-semibold"
                        disabled={loading || !postalCode.trim()}
                      >
                        {loading ? "Searching..." : "Discover Community"}
                      </Button>
                    </form>

                    {/* Error Message */}
                    {error && (
                      <Alert variant="destructive" className="max-w-md">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Right Column - Hero Illustration */}
                <div className="order-1 lg:order-2">
                  <div className="relative">
                    <img
                      src="/hero-illustration.png"
                      alt="Diverse community of families and neighbors in Singapore HDB estate with colorful buildings and playground"
                      className="w-full h-[500px] object-cover object-center rounded-2xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results with background container */}
            {locationData && (
              <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow-sm">
                <div className="space-y-6">
                  {/* Section 1: Community or Commercial Fallback */}
                  <div>
                    {locationData.addressClassification.isCommercial ? (
                      <CommercialFallback />
                    ) : (
                      <>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Community</h2>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-red-200 overflow-hidden">
                          <a href={`/community/${locationData.communitySlug}`}>
                            <CardContent className="p-6">
                              <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                  <div className="bg-red-100 p-3 rounded-full">
                                    <Users className="h-8 w-8 text-red-600" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{locationData.community}</h3>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-gray-600">
                                      <Building className="h-4 w-4" />
                                      <span className="font-medium">District:</span>
                                      <span>{locationData.area}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-gray-600">
                                      <Globe className="h-4 w-4" />
                                      <span className="font-medium">Region:</span>
                                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                                        {locationData.region}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                                      <MapPin className="h-3 w-3" />
                                      <span>Postal Sector {locationData.postalSector.sector_code}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </a>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Section 2: Your Address - Always show for both residential and commercial */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Address</h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                <MapPin className="h-4 w-4" />
                                Postal Code
                              </div>
                              <p className="text-lg font-semibold">{locationData.postalCode}</p>
                            </div>
                            {locationData.block && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                  <Building className="h-4 w-4" />
                                  Block Number
                                </div>
                                <p className="text-lg font-semibold">{locationData.block}</p>
                              </div>
                            )}
                            {locationData.buildingName && locationData.buildingName !== "NIL" && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                  <Building className="h-4 w-4" />
                                  Building Name
                                </div>
                                <p className="text-lg font-semibold">{locationData.buildingName}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                <MapPin className="h-4 w-4" />
                                Street Name
                              </div>
                              <p className="text-lg font-semibold">{locationData.street}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                                <MapPin className="h-4 w-4" />
                                Full Address
                              </div>
                              <p className="text-sm text-gray-700">{locationData.fullAddress}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights Section - Only show when no search results */}
        {!locationData && (
          <div className="bg-white">
            {/* Feature 1: Join Real Communities by Address - Image Left, Text Right */}
            <div className="bg-white">
              <FeatureSection
                title="Join Real Communities by Address"
                description="Find your exact HDB or condo community just by entering your postal code."
                imageSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.jpg-YVycUu9L5bTzrw0EbhhJNK3U3oi2ZX.png"
                imageAlt="Woman with smartphone standing in front of Singapore HDB buildings with location markers"
                reverse={true}
              />
            </div>

            {/* Feature 2: Get Help, Lend a Hand - Text Left, Image Right */}
            <div className="bg-gray-50">
              <FeatureSection
                title="Get Help, Lend a Hand, or Just Say Hi"
                description="Ask neighbors for help, share updates, or simply introduce yourself. Every block is a community."
                imageSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2.jpg-T7o82GkY85rKLpMwOntlgLrRX8Zj3i.jpeg"
                imageAlt="Neighbors helping each other in HDB corridor - man with package, woman waving, and another neighbor"
                reverse={false}
              />
            </div>

            {/* Feature 3: Stay Updated - Image Left, Text Right */}
            <div className="bg-white">
              <FeatureSection
                title="Stay Updated with Real-Time Conversations"
                description="See what's happening in your block — from lost pets to community events, all in one place."
                imageSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3.jpg-VgdKkNyHKZiKwYT7C98QN4eamg6S9d.png"
                imageAlt="Two neighbors using phones in evening HDB setting with community notification bubbles"
                reverse={true}
              />
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  )
}
