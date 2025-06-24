"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus } from "lucide-react"
import { useState } from "react"
import { GroupBuySection } from "./group-buy-section"

interface CommunityFeaturesProps {
  communitySlug: string
}

export function CommunityFeatures({ communitySlug }: CommunityFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(activeFeature === feature ? null : feature)
  }

  return (
    <div className="space-y-6">
      {/* Community Features Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">🏘️ Community Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group Buy Feature */}
            <Button
              variant={activeFeature === "group-buy" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border-2"
              onClick={() => handleFeatureClick("group-buy")}
            >
              <ShoppingCart className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">Group Buy</div>
                <div className="text-sm text-gray-600">Save together on bulk purchases</div>
              </div>
            </Button>

            {/* Placeholder for future features */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 bg-gray-50 border-2 border-dashed cursor-not-allowed opacity-50"
              disabled
            >
              <Plus className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <div className="font-semibold text-gray-500">More Features</div>
                <div className="text-sm text-gray-400">Coming Soon</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 bg-gray-50 border-2 border-dashed cursor-not-allowed opacity-50"
              disabled
            >
              <Plus className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <div className="font-semibold text-gray-500">More Features</div>
                <div className="text-sm text-gray-400">Coming Soon</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Feature Content */}
      {activeFeature === "group-buy" && <GroupBuySection communitySlug={communitySlug} />}
    </div>
  )
}
