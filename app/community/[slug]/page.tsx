"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "../../components/navigation"
import { CommunityFeatures } from "./components/community-features"
import { PostFeed } from "./components/post-feed"
import { CommunitySidebar } from "./components/community-sidebar"
import { MembersModal } from "./components/members-modal"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

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

interface Comment {
  id: string
  post_id: string
  author: string
  body: string
  created_at: string
  user_id?: string
  vote_count?: number
  user_vote?: "up" | "down" | null
}

interface Post {
  id: string
  community_slug: string
  author: string
  title: string
  body: string
  tag: string
  created_at: string
  comments?: Comment[]
  user_id?: string
  vote_count?: number
  user_vote?: "up" | "down" | null
}

export default function CommunityPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const communitySlug = params.slug as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("All")
  const [showMembersModal, setShowMembersModal] = useState(false)

  useEffect(() => {
    if (communitySlug) {
      fetchCommunity()
      fetchPosts()
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

      // First, try to fetch the community
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .maybeSingle()

      if (communityError) {
        console.error("Error fetching community:", communityError)
        toast({
          title: "Error",
          description: "Failed to load community",
          variant: "destructive",
        })
        return
      }

      let selectedCommunity: Community

      if (!communityData) {
        // Community doesn't exist, create it
        const name = communitySlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        const area = communitySlug.split("-")[0].charAt(0).toUpperCase() + communitySlug.split("-")[0].slice(1)

        const { data: newCommunity, error: createError } = await supabase
          .from("communities")
          .insert({
            name,
            slug: communitySlug,
            area,
            region: "Singapore",
            member_count: 0,
          })
          .select()
          .maybeSingle()

        if (createError) {
          console.error("Error creating community:", createError)
          toast({
            title: "Error",
            description: "Failed to create community",
            variant: "destructive",
          })
          return
        }

        if (!newCommunity) {
          // Race condition: someone else created it, try fetching again
          const { data: refetchedCommunity, error: refetchError } = await supabase
            .from("communities")
            .select("*")
            .eq("slug", communitySlug)
            .maybeSingle()

          if (refetchError || !refetchedCommunity) {
            console.error("Error refetching community after race condition:", refetchError)
            toast({
              title: "Error",
              description: "Failed to load community",
              variant: "destructive",
            })
            return
          }

          selectedCommunity = refetchedCommunity
        } else {
          selectedCommunity = newCommunity
          toast({
            title: "Community Created",
            description: `Welcome to ${name}! You're the first member.`,
          })
        }
      } else {
        selectedCommunity = communityData
      }

      // Get member count
      const { count: memberCount, error: countError } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_slug", communitySlug)

      if (countError) {
        console.error("Error fetching member count:", countError)
      }

      // Update community data with current member count
      const updatedCommunity = {
        ...selectedCommunity,
        member_count: memberCount || 0,
      }

      setCommunity(updatedCommunity)
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

  const fetchPosts = async () => {
    try {
      setPostsLoading(true)

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("community_slug", communitySlug)
        .order("created_at", { ascending: false })

      if (postsError) {
        throw postsError
      }

      // Fetch comments for all posts
      const postIds = postsData?.map((p) => p.id) || []
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })

      if (commentsError) {
        console.error("Error fetching comments:", commentsError)
      }

      // Group comments by post_id
      const commentsByPost = (commentsData || []).reduce(
        (acc, comment) => {
          if (!acc[comment.post_id]) {
            acc[comment.post_id] = []
          }
          acc[comment.post_id].push({
            ...comment,
            vote_count: 0,
            user_vote: null,
          })
          return acc
        },
        {} as Record<string, Comment[]>,
      )

      // Add comments to posts
      const postsWithComments = (postsData || []).map((post) => ({
        ...post,
        comments: commentsByPost[post.id] || [],
        vote_count: 0,
        user_vote: null as "up" | "down" | null,
      }))

      setPosts(postsWithComments)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setPostsLoading(false)
    }
  }

  const checkMembership = async () => {
    if (!user || !community) return

    try {
      const { data, error } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_slug", communitySlug)
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
        community_slug: communitySlug,
        user_id: user.id,
      })

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a Member",
            description: "You're already a member of this community",
          })
          setIsMember(true)
        } else {
          throw error
        }
      } else {
        setIsMember(true)
        // Update local member count
        setCommunity((prev) => (prev ? { ...prev, member_count: prev.member_count + 1 } : null))
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

  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts])
  }

  const handleCommentAdded = (postId: string, newComment: Comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment],
            }
          : post,
      ),
    )
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="lg:col-span-3">
                <Skeleton className="h-32 w-full mb-8" />
                <Skeleton className="h-64 w-full mb-8" />
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="lg:col-span-1">
                <div className="bg-gray-100 rounded-xl p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
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

  // Helper function to format location display
  const formatLocationDisplay = () => {
    const parts = []

    if (community.area && community.area !== "Unknown") {
      parts.push(community.area)
    }

    if (community.region && community.region !== "Unknown" && community.region !== "Singapore") {
      parts.push(community.region)
    } else if (community.region === "Singapore" && parts.length === 0) {
      parts.push("Singapore")
    }

    return parts.join(", ")
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          {/* Community Header */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{community.name}</h1>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{community.description}</p>
                <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                  {formatLocationDisplay() && (
                    <>
                      <span>{formatLocationDisplay()}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{community.member_count} members</span>
                </div>
              </div>
              {user && !isMember && (
                <Button
                  onClick={handleJoinCommunity}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3"
                >
                  Join Community
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Community Features */}
              <CommunityFeatures communitySlug={communitySlug} />

              {/* Post Feed */}
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                {postsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <PostFeed
                    posts={posts}
                    communitySlug={communitySlug}
                    onPostCreated={handlePostCreated}
                    onCommentAdded={handleCommentAdded}
                    onPostDeleted={handlePostDeleted}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CommunitySidebar
                area={community.area}
                region={community.region}
                communitySlug={communitySlug}
                createdAt={community.created_at}
                onShowMembers={() => setShowMembersModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Members Modal */}
        <MembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          communitySlug={communitySlug}
        />
      </div>
    </>
  )
}
