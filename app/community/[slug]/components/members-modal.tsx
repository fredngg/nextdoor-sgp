"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { getUserDisplayName, getDisplayNameFallback } from "@/lib/display-name"

interface Member {
  id: string
  user_id: string
  joined_at: string
  display_name?: string
  user_email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface MembersModalProps {
  isOpen: boolean
  onClose: () => void
  communitySlug: string
  memberCount: number
}

export function MembersModal({ isOpen, onClose, communitySlug, memberCount }: MembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && communitySlug) {
      fetchMembers()
    }
  }, [isOpen, communitySlug])

  const fetchMembers = async () => {
    try {
      setLoading(true)

      // First, get the community members
      const { data: memberData, error: memberError } = await supabase
        .from("community_members")
        .select("id, user_id, joined_at")
        .eq("community_slug", communitySlug)
        .order("joined_at", { ascending: false })

      if (memberError) {
        throw new Error(`Failed to fetch community members: ${memberError.message}`)
      }

      if (!memberData || memberData.length === 0) {
        setMembers([])
        return
      }

      // Get display names for all members
      const membersWithDisplayNames = await Promise.all(
        memberData.map(async (member) => {
          try {
            // Get display name from user_profiles table
            const displayName = await getUserDisplayName(member.user_id)

            // Try to get user email as fallback
            let userEmail: string | undefined
            try {
              const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.user_id)
              if (!userError && userData.user) {
                userEmail = userData.user.email
              }
            } catch (error) {
              console.error(`Failed to fetch user email for ${member.user_id}:`, error)
            }

            return {
              ...member,
              display_name: displayName,
              user_email: userEmail,
            }
          } catch (error) {
            console.error(`Failed to fetch display name for ${member.user_id}:`, error)
            return {
              ...member,
              display_name: null,
              user_email: undefined,
            }
          }
        }),
      )

      setMembers(membersWithDisplayNames)
    } catch (error) {
      console.error("Error fetching members:", error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (member: Member) => {
    if (member.display_name) {
      return member.display_name
    }

    return getDisplayNameFallback(member.user_email, member.user_id)
  }

  const getInitials = (member: Member) => {
    const name = getDisplayName(member)
    return name.substring(0, 2).toUpperCase()
  }

  const formatJoinDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Members
          </DialogTitle>
          <DialogDescription>
            {memberCount} {memberCount === 1 ? "member" : "members"} in this community
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-100 text-red-800 text-sm">{getInitials(member)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{getDisplayName(member)}</p>
                      {member.user_email && (
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {formatJoinDate(member.joined_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
              <p className="text-gray-600">No members yet. Be the first!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
