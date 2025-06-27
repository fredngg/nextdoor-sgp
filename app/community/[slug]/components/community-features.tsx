import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ShoppingCart, Car, MapPin } from "lucide-react"
import Link from "next/link"

interface CommunityFeaturesProps {
  communitySlug: string
}

export function CommunityFeatures({ communitySlug }: CommunityFeaturesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <Link href={`/community/${communitySlug}/groupbuys`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Group Buys</h3>
                <p className="text-gray-600 text-sm">Save money by buying together with your neighbors</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Ride Sharing</h3>
              <p className="text-gray-600 text-sm">Share rides with neighbors for daily commutes</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <MapPin className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Local Businesses</h3>
              <p className="text-gray-600 text-sm">Support businesses in your community</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
