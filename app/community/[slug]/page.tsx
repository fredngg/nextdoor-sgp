"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "../../components/navigation"
import { CommunityFeatures } from "./components/community-features"
import { PostFeed } from "./components/post-feed"
import { CommunitySidebar } from "./components/community-sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Community {
  id: string
  slug: string
  name: string
  area: string
  region: string
  description: string
  member_count: number
  created_at: string
}

export default function CommunityPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const communitySlug = params.slug as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    if (communitySlug) {
      fetchCommunity()
    }
  }, [communitySlug])

  useEffect(() => {
    if (user && community) {
      checkMembership()
    }
  }, [user, community])

  const fetchCommunity = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("communities").select("*").eq("slug", communitySlug).single()

      if (error) {
        console.error("Error fetching community:", error)
        toast({
          title: "Error",
          description: "Failed to load community",
          variant: "destructive",
        })
        return
      }

      setCommunity(data)
    } catch (error) {
      console.error("Error fetching community:", error)
      toast({
        title: "Error",
        description: "Failed to load community",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkMembership = async () => {
    if (!user || !community) return

    try {
      const { data, error } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .single()

      setIsMember(!!data && !error)
    } catch (error) {
      setIsMember(false)
    }
  }

  const handleJoinCommunity = async () => {
    if (!user || !community) return

    try {
      const { error } = await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: user.id,
      })

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a Member",
            description: "You're already a member of this community",
          })
        } else {
          throw error
        }
      } else {
        setIsMember(true)
        toast({
          title: "Joined Successfully!",
          description: `Welcome to ${community.name}`,
        })
      }
    } catch (error) {
      console.error("Error joining community:", error)
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <Skeleton className="h-32 w-full mb-8" />
                <Skeleton className="h-64 w-full mb-8" />
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!community) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
              <p className="text-gray-600">The community you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Community Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{community.name}</h1>
                <p className="text-gray-600 mb-4">{community.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {community.area}, {community.region}
                  </span>
                  <span>•</span>
                  <span>{community.member_count} members</span>
                </div>
              </div>
              {user && !isMember && (
                <Button onClick={handleJoinCommunity} className="bg-red-600 hover:bg-red-700">
                  Join Community
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Community Features */}
              <CommunityFeatures communitySlug={communitySlug} />

              {/* Community Feed Section with proper spacing */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Community Feed</h2>
                    {isMember && (
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                    )}
                  </div>
                </div>

                {/* Post Feed with proper padding */}
                <div className="p-6 pt-4">
                  <PostFeed communitySlug={communitySlug} />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CommunitySidebar community={community} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
