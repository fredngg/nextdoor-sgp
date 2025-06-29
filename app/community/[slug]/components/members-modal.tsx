"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { UserProfileModal } from "./user-profile-modal"

interface Member {
  id: string
  user_id: string
  created_at: string
  user_profiles: {
    display_name: string | null
    email: string | null
    email_verified: boolean
  } | null
}

interface MembersModalProps {
  communitySlug: string
  memberCount: number
}

export function MembersModal({ communitySlug, memberCount }: MembersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
    }
  }, [isOpen, communitySlug])

  const fetchMembers = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("community_members")
        .select(`
          id,
          user_id,
          created_at,
          user_profiles!community_members_user_id_fkey (
            display_name,
            email,
            email_verified
          )
        `)
        .eq("community_slug", communitySlug)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching members:", error)
        return
      }

      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (profile: Member["user_profiles"]) => {
    if (!profile) return "Anonymous"
    return profile.display_name || profile.email?.split("@")[0] || "Anonymous"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId)
    setProfileModalOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Users className="h-4 w-4" />
            {memberCount} members
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Members ({memberCount})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {loading ? (
              // Loading skeletons
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : members.length > 0 ? (
              members.map((member) => {
                const displayName = getDisplayName(member.user_profiles)
                return (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleViewProfile(member.user_id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-100 text-red-800">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">{displayName}</p>
                        {member.user_profiles?.email_verified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Joined {formatDate(member.created_at)}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewProfile(member.user_id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View profile</span>
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No members found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false)
            setSelectedUserId(null)
          }}
          userId={selectedUserId}
        />
      )}
    </>
  )
}
