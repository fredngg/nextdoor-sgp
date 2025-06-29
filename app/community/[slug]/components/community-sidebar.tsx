"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MembersModal } from "./members-modal"

interface CommunitySidebarProps {
  communitySlug: string
  communityName: string
  userId?: string
  isMember: boolean
  onMembershipChange: () => void
  memberCount: number
  createdAt?: string
}

export function CommunitySidebar({
  communitySlug,
  communityName,
  userId,
  isMember,
  onMembershipChange,
  memberCount,
  createdAt,
}: CommunitySidebarProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  const handleJoinLeave = async () => {
    if (!userId) return

    setIsJoining(true)
    try {
      if (isMember) {
        // Leave community
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("community_slug", communitySlug)
          .eq("user_id", userId)

        if (error) throw error
      } else {
        // Join community
        const { error } = await supabase.from("community_members").insert({
          community_slug: communitySlug,
          user_id: userId,
          joined_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      onMembershipChange()
    } catch (error) {
      console.error("Error updating membership:", error)
    } finally {
      setIsJoining(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently"
    try {
      return new Date(dateString).toLocaleDateString("en-SG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Recently"
    }
  }

  return (
    <>
      <div className="bg-gray-100 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
        {/* Community Overview Section */}
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Community Overview</h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Members Card */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="text-sm sm:text-base font-medium text-gray-700">Members</span>
              </div>
              <button
                onClick={() => setShowMembersModal(true)}
                className="text-lg sm:text-xl font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                {memberCount}
              </button>
            </div>

            {/* Created Date Card */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="text-sm sm:text-base font-medium text-gray-700">Created</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-tight">{formatDate(createdAt)}</div>
            </div>
          </div>

          {/* Join/Leave Button */}
          {userId && (
            <Button
              onClick={handleJoinLeave}
              disabled={isJoining}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isJoining ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="text-sm sm:text-base">{isMember ? "Leaving..." : "Joining..."}</span>
                </div>
              ) : (
                <span className="text-sm sm:text-base flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  {isMember ? "Leave Community" : "Join Community"}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Community Guidelines */}
        <div className="bg-white rounded-lg p-4 sm:p-5">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Community Guidelines</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Be respectful and kind to your neighbors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Keep posts relevant to your community</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>No spam, advertising, or inappropriate content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Help create a welcoming environment for all</span>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-base sm:text-lg font-bold text-gray-900">Quick Links</h4>
          <div className="space-y-2">
            <a
              href="https://mylegacy.life.gov.sg/find-a-service/find-town-council/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900">Town Council</span>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </a>
          </div>
        </div>
      </div>

      {/* Members Modal */}
      <MembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        communitySlug={communitySlug}
        communityName={communityName}
      />
    </>
  )
}
