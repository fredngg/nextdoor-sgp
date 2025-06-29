"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { Eye } from "lucide-react"
import { UserProfileModal } from "./user-profile-modal"

interface Member {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

interface MembersModalProps {
  isOpen: boolean
  onClose: () => void
  communitySlug: string
}

export function MembersModal({ isOpen, onClose, communitySlug }: MembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<{ userId: string; displayName: string } | null>(null)

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
          user_profiles!inner(display_name)
        `)
        .eq("community_slug", communitySlug)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching members:", error)
        return
      }

      const formattedMembers = data.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        display_name: member.user_profiles?.display_name || "Unknown User",
        created_at: member.created_at,
      }))

      setMembers(formattedMembers)
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }

  const handleMemberClick = (userId: string, displayName: string) => {
    setSelectedMember({ userId, displayName })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Community Members</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => handleMemberClick(member.user_id, member.display_name)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm bg-red-100 text-red-800">
                      {member.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.display_name}</p>
                    <p className="text-xs text-gray-500">Joined {formatDate(member.created_at)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View profile</span>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No members found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      {selectedMember && (
        <UserProfileModal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          userId={selectedMember.userId}
          displayName={selectedMember.displayName}
        />
      )}
    </>
  )
}
