"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "../../components/navigation"
import { PostFeed } from "./components/post-feed"
import { CommunitySidebar } from "./components/community-sidebar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Globe, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { MembersModal } from "./components/members-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Community {
  id: string
  slug: string
  name: string
  area: string
  region: string
  member_count: number
  created_at: string
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

export default function CommunityPage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()

  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [showMembersModal, setShowMembersModal] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchCommunityData()
    }
  }, [slug, user])

  async function fetchCommunityData() {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching community data for slug:", slug)

      console.log("DEBUG: NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const testUrl = `${supabaseUrl}/rest/v1/communities?select=slug&limit=1`; // A simple, lightweight query
        console.log("DEBUG: Attempting direct fetch to:", testUrl);
        try {
          const response = await fetch(testUrl, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}` // Standard for Supabase REST
            }
          });
          console.log("DEBUG: Direct fetch response status:", response.status);
          const responseData = await response.json();
          console.log("DEBUG: Direct fetch response data:", responseData);
          if (!response.ok) {
            console.error("DEBUG: Direct fetch failed with status:", response.status, responseData);
          }
        } catch (e) {
          console.error("DEBUG: Direct fetch threw an error:", e);
        }
      } else {
        console.warn("DEBUG: Supabase URL or Anon Key is missing, skipping direct fetch test.");
      }

      // Check if community exists
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single()

      if (communityError) {
        if (communityError.code === "PGRST116") {
          // Community not found, create it with mock data
          console.log("Community not found, creating new community")

          const communityName = slug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
            .replace(/blk-(\d+)-(\d+)/, "Blk $1–$2")

          const area = communityName.split(" Blk ")[0]
          const region = determineRegion(area)

          const { data: newCommunity, error: insertError } = await supabase
            .from("communities")
            .insert({
              slug,
              name: communityName,
              area,
              region,
              member_count: 0,
            })
            .select()
            .single()

          if (insertError) {
            console.error("Failed to create community:", insertError)
            throw new Error(`Failed to create community: ${insertError.message}`)
          }

          setCommunity(newCommunity)
        } else {
          console.error("Error fetching community:", communityError)
          throw new Error(`Failed to fetch community: ${communityError.message}`)
        }
      } else {
        setCommunity(communityData)
      }

      // Get real member count from community_members table
      const { count, error: countError } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_slug", slug)

      if (countError) {
        console.error("Error fetching member count:", countError)
        setMemberCount(0)
      } else {
        setMemberCount(count || 0)
      }

      // Fetch posts for this community
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("community_slug", slug)
        .order("created_at", { ascending: false })

      if (postsError) {
        console.error("Error fetching posts:", postsError)
        // Don't throw error for posts, just set empty array
        setPosts([])
      } else {
        // Fetch comments and vote data for each post
        const postsWithCommentsAndVotes = await Promise.all(
          (postsData || []).map(async (post) => {
            try {
              // Fetch comments for this post
              const { data: comments, error: commentsError } = await supabase
                .from("comments")
                .select("*")
                .eq("post_id", post.id)
                .order("created_at", { ascending: true })

              if (commentsError) {
                console.error(`Failed to fetch comments for post ${post.id}:`, commentsError)
              }

              // Fetch vote data for the post
              const { data: postVotes, error: postVotesError } = await supabase
                .from("post_votes")
                .select("vote_type, user_id")
                .eq("post_id", post.id)

              let postVoteCount = 0
              let userPostVote: "up" | "down" | null = null

              if (!postVotesError && postVotes) {
                const upvotes = postVotes.filter((vote) => vote.vote_type === "up").length
                const downvotes = postVotes.filter((vote) => vote.vote_type === "down").length
                postVoteCount = upvotes - downvotes

                // Find user's vote if logged in
                if (user) {
                  const userVote = postVotes.find((vote) => vote.user_id === user.id)
                  userPostVote = userVote?.vote_type || null
                }
              }

              // Fetch vote data for each comment
              const commentsWithVotes = await Promise.all(
                (comments || []).map(async (comment) => {
                  try {
                    const { data: commentVotes, error: commentVotesError } = await supabase
                      .from("comment_votes")
                      .select("vote_type, user_id")
                      .eq("comment_id", comment.id)

                    let commentVoteCount = 0
                    let userCommentVote: "up" | "down" | null = null

                    if (!commentVotesError && commentVotes) {
                      const upvotes = commentVotes.filter((vote) => vote.vote_type === "up").length
                      const downvotes = commentVotes.filter((vote) => vote.vote_type === "down").length
                      commentVoteCount = upvotes - downvotes

                      // Find user's vote if logged in
                      if (user) {
                        const userVote = commentVotes.find((vote) => vote.user_id === user.id)
                        userCommentVote = userVote?.vote_type || null
                      }
                    }

                    return {
                      ...comment,
                      vote_count: commentVoteCount,
                      user_vote: userCommentVote,
                    }
                  } catch (error) {
                    console.error(`Error processing comment ${comment.id}:`, error)
                    return {
                      ...comment,
                      vote_count: 0,
                      user_vote: null,
                    }
                  }
                }),
              )

              return {
                ...post,
                comments: commentsWithVotes,
                vote_count: postVoteCount,
                user_vote: userPostVote,
              }
            } catch (error) {
              console.error(`Error processing post ${post.id}:`, error)
              return {
                ...post,
                comments: [],
                vote_count: 0,
                user_vote: null,
              }
            }
          }),
        )

        setPosts(postsWithCommentsAndVotes)
      }
    } catch (err) {
      console.error("Error fetching community data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred while loading the community")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine region based on area
  function determineRegion(area: string): string {
    const regionMap: Record<string, string> = {
      "Ang Mo Kio": "Central",
      Bedok: "East",
      Bishan: "Central",
      "Bukit Batok": "West",
      "Bukit Merah": "Central",
      "Bukit Panjang": "Central West",
      "Bukit Timah": "Central",
      "Central Area": "Central",
      "Choa Chu Kang": "West",
      Clementi: "West",
      Geylang: "East",
      "Geylang Serai": "East",
      Hougang: "Northeast",
      "Jurong East": "West",
      "Jurong West": "West",
      "Kallang/Whampoa": "Central",
      "Marine Parade": "East",
      "Pasir Ris": "East",
      Punggol: "Northeast",
      Queenstown: "Central",
      Sembawang: "North",
      Sengkang: "Northeast",
      Serangoon: "Northeast",
      Tampines: "East",
      "Toa Payoh": "Central",
      Woodlands: "North",
      Yishun: "North",
    }

    return regionMap[area] || "Unknown"
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-40 w-full mb-4" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-60 w-full mb-4" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-6">
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-medium">Error Loading Community</p>
                  <p className="text-sm text-gray-600">{error}</p>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => fetchCommunityData()} variant="outline" size="sm">
                      Try Again
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/">Go Home</Link>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
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
          <div className="container mx-auto px-4 py-6">
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-medium">Community Not Found</p>
                  <p className="text-sm text-gray-600">The community you're looking for doesn't exist.</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/">Find Communities</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{community.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Area:</span>
                    <span>{community.area}</span>
                  </div>
                  {/* Only show region if it's not "Unknown" */}
                  {community.region !== "Unknown" && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Region:</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {community.region}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500 ml-4">
                <Users className="h-5 w-5" />
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="text-sm hover:text-red-600 transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Post Feed */}
            <div className="lg:col-span-2">
              <PostFeed
                posts={posts}
                communitySlug={slug}
                onPostCreated={(newPost) => setPosts([newPost, ...posts])}
                onCommentAdded={(postId, newComment) => {
                  setPosts(
                    posts.map((post) => {
                      if (post.id === postId) {
                        return {
                          ...post,
                          comments: [...(post.comments || []), newComment],
                        }
                      }
                      return post
                    }),
                  )
                }}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1">
              <CommunitySidebar
                address={`${community.area}, Singapore`}
                area={community.area}
                region={community.region}
                communitySlug={slug}
                onShowMembers={() => setShowMembersModal(true)}
              />
            </div>
          </div>
        </div>
        {/* Members Modal */}
        <MembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          communitySlug={slug}
          memberCount={memberCount}
        />
      </div>
    </>
  )
}
