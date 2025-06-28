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

      // Get community data
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .single()

      if (communityError) {
        console.error("Error fetching community:", communityError)
        toast({
          title: "Error",
          description: "Failed to load community",
          variant: "destructive",
        })
        return
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
        ...communityData,
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

      // Fetch posts with vote data
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          votes:post_votes(vote_type),
          user_vote:post_votes!inner(vote_type)
        `)
        .eq("community_slug", communitySlug)
        .eq("user_vote.user_id", user?.id || "")
        .order("created_at", { ascending: false })

      if (postsError && postsError.code !== "PGRST116") {
        throw postsError
      }

      // Fetch posts without user vote data if user is not logged in
      const { data: allPostsData, error: allPostsError } = await supabase
        .from("posts")
        .select(`
          *,
          votes:post_votes(vote_type)
        `)
        .eq("community_slug", communitySlug)
        .order("created_at", { ascending: false })

      if (allPostsError) {
        throw allPostsError
      }

      // Process posts with vote counts and user votes
      const processedPosts = (allPostsData || []).map((post) => {
        const votes = post.votes || []
        const upvotes = votes.filter((v: any) => v.vote_type === "up").length
        const downvotes = votes.filter((v: any) => v.vote_type === "down").length
        const voteCount = upvotes - downvotes

        // Find user's vote if logged in
        const userVoteData = user ? postsData?.find((p) => p.id === post.id) : null
        const userVote = userVoteData?.user_vote?.[0]?.vote_type || null

        return {
          ...post,
          vote_count: voteCount,
          user_vote: userVote,
          comments: [], // Will be loaded when needed
        }
      })

      // Fetch comments for all posts
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(`
          *,
          votes:comment_votes(vote_type),
          user_vote:comment_votes!inner(vote_type)
        `)
        .in(
          "post_id",
          processedPosts.map((p) => p.id),
        )
        .eq("user_vote.user_id", user?.id || "")
        .order("created_at", { ascending: true })

      if (commentsError && commentsError.code !== "PGRST116") {
        console.error("Error fetching comments:", commentsError)
      }

      // Fetch all comments without user vote data
      const { data: allCommentsData, error: allCommentsError } = await supabase
        .from("comments")
        .select(`
          *,
          votes:comment_votes(vote_type)
        `)
        .in(
          "post_id",
          processedPosts.map((p) => p.id),
        )
        .order("created_at", { ascending: true })

      if (allCommentsError) {
        console.error("Error fetching all comments:", allCommentsError)
      }

      // Process comments with vote data
      const processedComments = (allCommentsData || []).map((comment) => {
        const votes = comment.votes || []
        const upvotes = votes.filter((v: any) => v.vote_type === "up").length
        const downvotes = votes.filter((v: any) => v.vote_type === "down").length
        const voteCount = upvotes - downvotes

        // Find user's vote if logged in
        const userVoteData = user ? commentsData?.find((c) => c.id === comment.id) : null
        const userVote = userVoteData?.user_vote?.[0]?.vote_type || null

        return {
          ...comment,
          vote_count: voteCount,
          user_vote: userVote,
        }
      })

      // Group comments by post_id
      const commentsByPost = processedComments.reduce(
        (acc, comment) => {
          if (!acc[comment.post_id]) {
            acc[comment.post_id] = []
          }
          acc[comment.post_id].push(comment)
          return acc
        },
        {} as Record<string, Comment[]>,
      )

      // Add comments to posts
      const postsWithComments = processedPosts.map((post) => ({
        ...post,
        comments: commentsByPost[post.id] || [],
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
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CommunitySidebar
                address={community.name}
                area={community.area}
                region={community.region}
                communitySlug={communitySlug}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
