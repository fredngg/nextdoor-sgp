"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface PostalSectorStats {
  sector_code: string
  district_name: string
  region: string
  member_count: number
  community_count: number
}

interface RegionStats {
  region: string
  total_members: number
  total_communities: number
  sectors: PostalSectorStats[]
}

export function SingaporeMap() {
  const [regionStats, setRegionStats] = useState<RegionStats[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  useEffect(() => {
    fetchMapStats()
  }, [])

  const fetchMapStats = async () => {
    try {
      setLoading(true)

      // Get all postal sectors with their stats
      const { data: sectors, error: sectorsError } = await supabase
        .from("postal_sectors")
        .select("sector_code, district_name, region")
        .order("region", { ascending: true })

      if (sectorsError) {
        console.error("Error fetching postal sectors:", sectorsError)
        return
      }

      // Get community stats by postal sector
      const { data: communityStats, error: communityError } = await supabase
        .from("communities")
        .select("slug, region, member_count")

      if (communityError) {
        console.error("Error fetching community stats:", communityError)
        return
      }

      // Get total member count across all communities
      const { data: memberData, error: memberError } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })

      if (!memberError) {
        setTotalMembers(memberData || 0)
      }

      // Aggregate stats by region and sector
      const regionMap = new Map<string, RegionStats>()

      // Initialize regions
      sectors?.forEach((sector) => {
        if (!regionMap.has(sector.region)) {
          regionMap.set(sector.region, {
            region: sector.region,
            total_members: 0,
            total_communities: 0,
            sectors: [],
          })
        }
      })

      // Add sector stats
      sectors?.forEach((sector) => {
        const regionData = regionMap.get(sector.region)!

        // Count communities and members for this sector
        const sectorCommunities = communityStats?.filter((c) => c.region === sector.region) || []
        const sectorMemberCount = sectorCommunities.reduce((sum, c) => sum + (c.member_count || 0), 0)

        const sectorStats: PostalSectorStats = {
          sector_code: sector.sector_code,
          district_name: sector.district_name,
          region: sector.region,
          member_count: sectorMemberCount,
          community_count: sectorCommunities.length,
        }

        regionData.sectors.push(sectorStats)
        regionData.total_members += sectorMemberCount
        regionData.total_communities += sectorCommunities.length
      })

      setRegionStats(Array.from(regionMap.values()))
    } catch (error) {
      console.error("Error fetching map stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRegionColor = (memberCount: number) => {
    if (memberCount === 0) return "bg-gray-100 text-gray-600 border-gray-200"
    if (memberCount < 10) return "bg-red-50 text-red-700 border-red-200"
    if (memberCount < 25) return "bg-orange-50 text-orange-700 border-orange-200"
    if (memberCount < 50) return "bg-yellow-50 text-yellow-700 border-yellow-200"
    if (memberCount < 100) return "bg-green-50 text-green-700 border-green-200"
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  const getRegionIntensity = (memberCount: number) => {
    if (memberCount === 0) return "opacity-30"
    if (memberCount < 10) return "opacity-50"
    if (memberCount < 25) return "opacity-65"
    if (memberCount < 50) return "opacity-80"
    if (memberCount < 100) return "opacity-90"
    return "opacity-100"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Singapore Community Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Singapore Community Map
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span className="font-medium">{totalMembers} total members</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Discover active communities across Singapore! Darker colors indicate more members.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {regionStats.map((region) => (
            <button
              key={region.region}
              onClick={() => setSelectedRegion(selectedRegion === region.region ? null : region.region)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getRegionColor(
                region.total_members,
              )} ${getRegionIntensity(region.total_members)} ${
                selectedRegion === region.region ? "ring-2 ring-red-500 ring-offset-2" : ""
              }`}
            >
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-sm">{region.region}</h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-medium">{region.total_members}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {region.total_communities} {region.total_communities === 1 ? "community" : "communities"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity Level
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded opacity-30"></div>
              <span>0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded opacity-50"></div>
              <span>1-9</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded opacity-65"></div>
              <span>10-24</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded opacity-80"></div>
              <span>25-49</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded opacity-90"></div>
              <span>50-99</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded opacity-100"></div>
              <span>100+</span>
            </div>
          </div>
        </div>

        {/* Selected Region Details */}
        {selectedRegion && (
          <div className="bg-white border-2 border-red-100 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-3 text-red-800">{selectedRegion} Region Details</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {regionStats.find((r) => r.region === selectedRegion)?.total_members || 0}
                </div>
                <div className="text-sm text-red-700">Total Members</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {regionStats.find((r) => r.region === selectedRegion)?.total_communities || 0}
                </div>
                <div className="text-sm text-red-700">Communities</div>
              </div>
            </div>

            {/* Top Districts in Selected Region */}
            <div>
              <h5 className="font-medium text-sm mb-2">Popular Districts:</h5>
              <div className="space-y-2">
                {regionStats
                  .find((r) => r.region === selectedRegion)
                  ?.sectors.filter((s) => s.member_count > 0)
                  .sort((a, b) => b.member_count - a.member_count)
                  .slice(0, 3)
                  .map((sector) => (
                    <div key={sector.sector_code} className="flex items-center justify-between text-sm">
                      <span className="truncate">{sector.district_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {sector.member_count} members
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500 italic">No active communities yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
          <h4 className="font-semibold text-red-800 mb-2">Join the Movement!</h4>
          <p className="text-sm text-red-700">
            Be part of Singapore's growing neighborhood community. Enter your postal code above to get started! 🚀
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
