"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { UserProfileModal } from "./user-profile-modal"

interface CommunityMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user_profiles: {
    display_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface MembersModalProps {
  communityId: string
  isOpen: boolean
  onClose: () => void
}

export function MembersModal({ communityId, isOpen, onClose }: MembersModalProps) {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)

  useEffect(() => {
    if (isOpen && communityId) {
      fetchMembers()
    }
  }, [isOpen, communityId])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles!inner (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (member: CommunityMember) => {
    return (
      member.user_profiles.display_name ||
      member.user_profiles.email?.split("@")[0] ||
      `User ${member.user_id.slice(0, 8)}`
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleMemberClick = (userId: string) => {
    setSelectedUserId(userId)
    setShowUserProfile(true)
  }

  const handleCloseUserProfile = () => {
    setShowUserProfile(false)
    setSelectedUserId(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Members ({members.length})
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleMemberClick(member.user_id)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user_profiles.avatar_url || undefined} />
                      <AvatarFallback className="bg-red-100 text-red-600 text-sm font-medium">
                        {getInitials(getDisplayName(member))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{getDisplayName(member)}</p>
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Joined {formatDistanceToNow(new Date(member.joined_at))} ago
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMemberClick(member.user_id)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="ml-1">View</span>
                  </Button>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No members found</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UserProfileModal userId={selectedUserId} isOpen={showUserProfile} onClose={handleCloseUserProfile} />
    </>
  )
}
