"use client"

import { Button } from "@/components/ui/button"

interface PostTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  postCounts: Record<string, number>
}

const tabs = [
  { id: "All", label: "All" },
  { id: "General", label: "General" },
  { id: "Announcement", label: "Announcement" },
  { id: "Buy/Sell", label: "Buy/Sell" },
  { id: "Question", label: "Question" },
  { id: "Notice", label: "Notice" },
]

export function PostTabs({ activeTab, onTabChange, postCounts }: PostTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => {
        const count = tab.id === "All" ? postCounts.total : postCounts[tab.id] || 0
        const isActive = activeTab === tab.id

        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 transition-all ${
              isActive
                ? "bg-white shadow-sm text-gray-900 hover:bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
              }`}
            >
              {count}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
