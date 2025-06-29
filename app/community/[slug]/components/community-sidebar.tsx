"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Users, LogIn, UserMinus, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface CommunitySidebarProps {
  area: string
  region: string
  communitySlug?: string
  createdAt?: string
  onShowMembers?: () => void
}

export function CommunitySidebar({ area, region, communitySlug, createdAt, onShowMembers }: CommunitySidebarProps) {
  const { user } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (communitySlug) {
      fetchMembershipData()
    }
  }, [communitySlug, user])

  const fetchMembershipData = async () => {
    if (!communitySlug) return

    try {
      setLoading(true)

      // Get total member count
      const { count, error: countError } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .match({ community_slug: communitySlug })

      if (countError) {
        console.error("Member count error:", countError)
      } else {
        setMemberCount(count || 0)
      }

      // Check if current user is a member
      if (user) {
        const { data: membership, error: membershipError } = await supabase
          .from("community_members")
          .select("*")
          .match({
            user_id: user.id,
            community_slug: communitySlug,
          })
          .maybeSingle()

        if (membershipError) {
          console.error("Membership query error:", membershipError)
        } else {
          setHasJoined(!!membership)
        }
      }
    } catch (error) {
      console.error("Error fetching membership data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCommunity = async () => {
    if (!user || !communitySlug) return

    try {
      setIsJoining(true)

      const { error } = await supabase.from("community_members").insert({
        user_id: user.id,
        community_slug: communitySlug,
      })

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this community.",
          })
          setHasJoined(true)
        } else {
          throw new Error(`Failed to join community: ${error.message}`)
        }
      } else {
        setHasJoined(true)
        setMemberCount((prev) => prev + 1)
        toast({
          title: "Welcome to the community!",
          description: "You've successfully joined this community.",
        })
      }
    } catch (err) {
      console.error("Error joining community:", err)
      toast({
        title: "Failed to join",
        description: "We couldn't add you to this community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveCommunity = async () => {
    if (!user || !communitySlug) return

    try {
      setIsJoining(true)

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_slug", communitySlug)

      if (error) {
        throw new Error(`Failed to leave community: ${error.message}`)
      }

      setHasJoined(false)
      setMemberCount((prev) => Math.max(0, prev - 1))
      toast({
        title: "Left community",
        description: "You've successfully left this community.",
      })
    } catch (err) {
      console.error("Error leaving community:", err)
      toast({
        title: "Failed to leave",
        description: "We couldn't remove you from this community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleDateString("en-SG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Unknown"
    }
  }

  return (
    <div className="bg-gray-100 rounded-xl p-4 sm:p-6 space-y-6 shadow-sm">
      {/* Community Stats & Join Button */}
      <div className="space-y-4">
        {/* Stats Header */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Community Overview</h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Members */}
          <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="text-sm sm:text-base font-medium text-gray-700">Members</span>
            </div>
            <button
              onClick={() => onShowMembers?.()}
              className="hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
            >
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 text-lg font-bold">
                {loading ? "..." : memberCount}
              </Badge>
            </button>
          </div>

          {/* Created Date */}
          <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="text-sm sm:text-base font-medium text-gray-700">Created</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">{formatDate(createdAt)}</div>
          </div>
        </div>

        {/* Join/Leave Community Button */}
        <div className="pt-2">
          {user ? (
            hasJoined ? (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-white text-sm sm:text-base font-medium py-2 sm:py-3"
                onClick={handleLeaveCommunity}
                disabled={isJoining || loading}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                {isJoining ? "Leaving..." : "Leave Community"}
              </Button>
            ) : (
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-bold py-3 sm:py-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                onClick={handleJoinCommunity}
                disabled={isJoining || loading}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {isJoining ? "Joining..." : "Join This Community"}
              </Button>
            )
          ) : (
            <Button
              asChild
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-bold py-3 sm:py-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Login to Join
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Useful Links */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Useful Links</h3>

        <Button
          variant="outline"
          className="w-full justify-start bg-white hover:bg-gray-50 text-sm sm:text-base border-gray-200 py-2 sm:py-3"
          asChild
        >
          <a
            href="https://mylegacy.life.gov.sg/find-a-service/find-town-council/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Town Council
          </a>
        </Button>
      </div>

      {/* Community Guidelines */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Community Guidelines</h3>

        <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
          <div className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 text-sm">•</span>
            <span>Be respectful to neighbors</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 text-sm">•</span>
            <span>No spam or advertising</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 text-sm">•</span>
            <span>Keep posts relevant to community</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 text-sm">•</span>
            <span>Use appropriate tags</span>
          </div>
        </div>
      </div>
    </div>
  )
}
