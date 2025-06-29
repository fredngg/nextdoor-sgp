"use client"

import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface PostTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  postCounts: Record<string, number>
}

export function PostTabs({ activeTab, onTabChange, postCounts }: PostTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { key: "All", label: "All", count: postCounts.total || 0 },
    { key: "General", label: "General", count: postCounts.General || 0 },
    { key: "Announcement", label: "Announcement", count: postCounts.Announcement || 0 },
    { key: "Buy/Sell", label: "Buy/Sell", count: postCounts["Buy/Sell"] || 0 },
    { key: "Lost & Found", label: "Lost & Found", count: postCounts["Lost & Found"] || 0 },
    { key: "RenoTalk", label: "RenoTalk", count: postCounts.RenoTalk || 0 },
    { key: "Fur Kids", label: "Fur Kids", count: postCounts["Fur Kids"] || 0 },
    { key: "Sports", label: "Sports", count: postCounts.Sports || 0 },
    { key: "Events/Parties", label: "Events/Parties", count: postCounts["Events/Parties"] || 0 },
  ]

  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitScrollbar: { display: "none" },
        }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.key)}
            className={`flex-shrink-0 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </Button>
        ))}
      </div>
    </div>
  )
}
