"use client"

import { Button } from "@/components/ui/button"

interface PostTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  postCounts: Record<string, number>
}

const tags = [
  { name: "All", color: "slate" },
  { name: "General", color: "blue" },
  { name: "Announcement", color: "red" },
  { name: "Buy/Sell", color: "green" },
  { name: "Lost & Found", color: "orange" },
  { name: "RenoTalk", color: "amber" },
  { name: "Fur Kids", color: "purple" },
  { name: "Sports", color: "indigo" },
  { name: "Events/Parties", color: "pink" },
]

const getTagStyles = (color: string, isActive: boolean) => {
  const colorMap = {
    slate: {
      active: "bg-slate-600 text-white border-slate-600 hover:bg-slate-700",
      inactive: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
    blue: {
      active: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
      inactive: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    red: {
      active: "bg-red-600 text-white border-red-600 hover:bg-red-700",
      inactive: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
    green: {
      active: "bg-green-600 text-white border-green-600 hover:bg-green-700",
      inactive: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    },
    orange: {
      active: "bg-orange-600 text-white border-orange-600 hover:bg-orange-700",
      inactive: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    },
    amber: {
      active: "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
      inactive: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    purple: {
      active: "bg-purple-600 text-white border-purple-600 hover:bg-purple-700",
      inactive: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    },
    indigo: {
      active: "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
      inactive: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    },
    pink: {
      active: "bg-pink-600 text-white border-pink-600 hover:bg-pink-700",
      inactive: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
    },
  }

  return (
    colorMap[color as keyof typeof colorMap]?.[isActive ? "active" : "inactive"] ||
    colorMap.slate[isActive ? "active" : "inactive"]
  )
}

export function PostTabs({ activeTab, onTabChange, postCounts }: PostTabsProps) {
  return (
    <div className="bg-gray-50 rounded-lg border p-3 mb-6 shadow-sm">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {tags.map((tag) => {
          const isActive = activeTab === tag.name
          const count = postCounts[tag.name] || 0

          return (
            <Button
              key={tag.name}
              variant="outline"
              size="sm"
              onClick={() => onTabChange(tag.name)}
              className={`
                flex-shrink-0 transition-all duration-200 border
                ${getTagStyles(tag.color, isActive)}
              `}
            >
              <span className="font-medium">{tag.name}</span>
              {count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </Button>
          )
        })}
      </div>
      <div className="flex justify-center mt-2">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
