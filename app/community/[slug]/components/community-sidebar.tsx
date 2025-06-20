"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink, Users, Calendar, Recycle, LogIn, UserMinus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface CommunitySidebarProps {
  address: string
  area: string
  region: string
  communitySlug?: string
  onShowMembers?: () => void
}

export function CommunitySidebar({ address, area, region, communitySlug, onShowMembers }: CommunitySidebarProps) {
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
      console.log("🔍 DEBUG: Fetching member count for community:", communitySlug)

      const { count, error: countError } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .match({ community_slug: communitySlug })

      console.log("📡 DEBUG: Member count query result:", { count, countError })

      if (countError) {
        console.error("❌ DEBUG: Member count error:", countError)
      } else {
        console.log("✅ DEBUG: Member count:", count)
        setMemberCount(count || 0)
      }

      // Check if current user is a member
      if (user) {
        console.log("🔍 DEBUG: Checking membership for user:", user.id, "in community:", communitySlug)

        const { data: membership, error: membershipError } = await supabase
          .from("community_members")
          .select("*")
          .match({
            user_id: user.id,
            community_slug: communitySlug,
          })
          .maybeSingle()

        console.log("📡 DEBUG: Membership query result:", { membership, membershipError })

        if (membershipError) {
          console.error("❌ DEBUG: Membership query error:", membershipError)
        } else {
          console.log("✅ DEBUG: Membership status:", !!membership)
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
          // Unique constraint violation - user already joined
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

  return (
    <div className="space-y-4">
      {/* Address Badge */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-sm p-2 w-full justify-center mb-3">
            {address}
          </Badge>
        </CardContent>
      </Card>

      {/* Join/Leave Community */}
      <Card>
        <CardContent className="p-4">
          {user ? (
            hasJoined ? (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleLeaveCommunity}
                disabled={isJoining || loading}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                {isJoining ? "Leaving..." : "Leave Community"}
              </Button>
            ) : (
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleJoinCommunity}
                disabled={isJoining || loading}
              >
                <Users className="h-4 w-4 mr-2" />
                {isJoining ? "Joining..." : "Join This Community"}
              </Button>
            )
          ) : (
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login to Join
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Useful Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Useful Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Town Council
            </a>
          </Button>

          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Recycle className="h-4 w-4 mr-2" />
              Recycling Schedule
            </a>
          </Button>

          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4 mr-2" />
              Community Events
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Community Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Members</span>
            <button onClick={() => onShowMembers?.()} className="hover:bg-gray-100 px-2 py-1 rounded transition-colors">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                {loading ? "..." : memberCount}
              </Badge>
            </button>
          </div>
          {/* Only show region stat if it's not "Unknown" */}
          {region !== "Unknown" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Region</span>
              <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                {region}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be respectful to neighbors</li>
            <li>• No spam or advertising</li>
            <li>• Keep posts relevant to community</li>
            <li>• Use appropriate tags</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
