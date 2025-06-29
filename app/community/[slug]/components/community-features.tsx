"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Car, MapPin, ChevronRight } from "lucide-react"
import Link from "next/link"

interface CommunityFeaturesProps {
  communitySlug: string
}

export function CommunityFeatures({ communitySlug }: CommunityFeaturesProps) {
  const features = [
    {
      id: "group-buys",
      title: "Group Buys",
      description: "Save money by buying together with your neighbors",
      icon: ShoppingCart,
      color: "text-red-600",
      iconBg: "bg-red-100",
      href: `/community/${communitySlug}/groupbuys`,
      available: true,
    },
    {
      id: "ride-sharing",
      title: "Ride Sharing",
      description: "Share rides with neighbors for daily commutes",
      icon: Car,
      color: "text-blue-600",
      iconBg: "bg-blue-100",
      href: "#",
      available: false,
    },
    {
      id: "local-businesses",
      title: "Local Businesses",
      description: "Support businesses in your community",
      icon: MapPin,
      color: "text-indigo-600",
      iconBg: "bg-indigo-100",
      href: "#",
      available: false,
    },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Community Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {features.map((feature) => {
          const IconComponent = feature.icon
          const content = (
            <Card
              className={`relative overflow-hidden transition-all duration-200 ${
                feature.available
                  ? "group hover:shadow-md cursor-pointer border-2 hover:border-gray-200"
                  : "cursor-not-allowed opacity-75 border border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.iconBg}`}>
                      <IconComponent className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{feature.title}</h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{feature.description}</p>
                    </div>
                  </div>
                  {feature.available && (
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardContent>

              {/* Coming Soon Overlay */}
              {!feature.available && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-300">
                    <span className="text-xs font-medium text-gray-600">Coming Soon</span>
                  </div>
                </div>
              )}
            </Card>
          )

          if (feature.available) {
            return (
              <Link key={feature.id} href={feature.href}>
                {content}
              </Link>
            )
          }

          return <div key={feature.id}>{content}</div>
        })}
      </div>
    </div>
  )
}
