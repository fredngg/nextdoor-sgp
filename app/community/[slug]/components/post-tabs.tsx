"use client"

import { Button } from "@/components/ui/button"

interface PostTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  postCounts: Record<string, number>
}

export function PostTabs({ activeTab, onTabChange, postCounts }: PostTabsProps) {
  const tabs = [
    { key: "All", label: "All", count: postCounts.total || 0 },
    { key: "General", label: "General", count: postCounts.General || 0 },
    { key: "Announcement", label: "Announcement", count: postCounts.Announcement || 0 },
    { key: "Buy/Sell", label: "Buy/Sell", count: postCounts["Buy/Sell"] || 0 },
    { key: "Lost & Found", label: "Lost & Found", count: postCounts["Lost & Found"] || 0 },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab.key)}
          className={`${
            activeTab === tab.key
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {tab.label} {tab.count}
        </Button>
      ))}
    </div>
  )
}
