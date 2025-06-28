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
      color: "bg-red-50 text-red-600",
      iconBg: "bg-red-100",
      href: `/community/${communitySlug}/groupbuys`,
      available: true,
    },
    {
      id: "ride-sharing",
      title: "Ride Sharing",
      description: "Share rides with neighbors for daily commutes",
      icon: Car,
      color: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
      href: "#",
      available: false,
    },
    {
      id: "local-businesses",
      title: "Local Businesses",
      description: "Support businesses in your community",
      icon: MapPin,
      color: "bg-indigo-50 text-indigo-600",
      iconBg: "bg-indigo-100",
      href: "#",
      available: false,
    },
  ]

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const IconComponent = feature.icon
          const content = (
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.iconBg} mb-4`}
                    >
                      <IconComponent className={`h-6 w-6 ${feature.color.split(" ")[1]}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    {!feature.available && (
                      <span className="inline-block mt-3 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-4" />
                </div>
              </CardContent>
            </Card>
          )

          if (feature.available) {
            return (
              <Link key={feature.id} href={feature.href}>
                {content}
              </Link>
            )
          }

          return (
            <div key={feature.id} className="cursor-not-allowed opacity-75">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
