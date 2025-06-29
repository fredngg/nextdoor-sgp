"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PostTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  postCounts: Record<string, number>
}

const tabs = [
  { name: "All", color: "bg-slate-500 hover:bg-slate-600" },
  { name: "General", color: "bg-blue-500 hover:bg-blue-600" },
  { name: "Announcement", color: "bg-red-500 hover:bg-red-600" },
  { name: "Buy/Sell", color: "bg-green-500 hover:bg-green-600" },
  { name: "Lost & Found", color: "bg-orange-500 hover:bg-orange-600" },
  { name: "RenoTalk", color: "bg-amber-500 hover:bg-amber-600" },
  { name: "Fur Kids", color: "bg-purple-500 hover:bg-purple-600" },
  { name: "Sports", color: "bg-indigo-500 hover:bg-indigo-600" },
  { name: "Events/Parties", color: "bg-pink-500 hover:bg-pink-600" },
]

export function PostTabs({ activeTab, onTabChange, postCounts }: PostTabsProps) {
  return (
    <div className="bg-gray-50 rounded-lg border p-4 mb-6 shadow-sm">
      {/* Container with horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 min-w-max pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name
            const count = tab.name === "All" ? postCounts.total || 0 : postCounts[tab.name] || 0

            return (
              <Button
                key={tab.name}
                onClick={() => onTabChange(tab.name)}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`
                  flex items-center gap-2 whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${
                    isActive
                      ? `${tab.color} text-white shadow-md hover:shadow-lg`
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }
                `}
              >
                <span className="font-medium">{tab.name}</span>
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className={`
                      text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center
                      ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    `}
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Visual indicator for scrollable content */}
      <div className="flex justify-center mt-2">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-300 rounded-full opacity-50"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
