"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { Calendar, MessageSquare, FileText, Users } from "lucide-react"

interface UserProfile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  email_verified: boolean
}

interface UserActivity {
  posts: Array<{
    id: string
    title: string
    body: string
    tag: string
    created_at: string
    community_slug: string
    community_name?: string
  }>
  comments: Array<{
    id: string
    body: string
    created_at: string
    post_id: string
    post_title?: string
    community_slug: string
    community_name?: string
  }>
  communities: Array<{
    slug: string
    name: string
    joined_at: string
  }>
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activity, setActivity] = useState<UserActivity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile()
    }
  }, [isOpen, userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        return
      }

      setProfile(profileData)

      // Fetch user activity
      const [postsResponse, commentsResponse, communitiesResponse] = await Promise.all([
        // Fetch recent posts
        supabase
          .from("posts")
          .select(`
            id, title, body, tag, created_at, community_slug,
            communities!posts_community_slug_fkey (name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        // Fetch recent comments
        supabase
          .from("comments")
          .select(`
            id, body, created_at, post_id,
            posts!comments_post_id_fkey (title, community_slug),
            posts!comments_post_id_fkey (communities!posts_community_slug_fkey (name))
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        // Fetch communities
        supabase
          .from("community_members")
          .select(`
            created_at,
            communities!community_members_community_slug_fkey (slug, name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ])

      const activityData: UserActivity = {
        posts:
          postsResponse.data?.map((post) => ({
            ...post,
            community_name: post.communities?.name || "Unknown Community",
          })) || [],
        comments:
          commentsResponse.data?.map((comment) => ({
            ...comment,
            post_title: comment.posts?.title || "Unknown Post",
            community_slug: comment.posts?.community_slug || "",
            community_name: comment.posts?.communities?.name || "Unknown Community",
          })) || [],
        communities:
          communitiesResponse.data?.map((member) => ({
            slug: member.communities?.slug || "",
            name: member.communities?.name || "Unknown Community",
            joined_at: member.created_at,
          })) || [],
      }

      setActivity(activityData)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = () => {
    if (!profile) return "Unknown User"
    return profile.display_name || profile.email?.split("@")[0] || "Anonymous"
  }

  const getInitials = () => {
    const name = getDisplayName()
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-red-100 text-red-800">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{getDisplayName()}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Joined {profile ? formatDate(profile.created_at) : "recently"}
                  </span>
                  {profile?.email_verified && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{activity?.posts.length || 0}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{activity?.comments.length || 0}</div>
                  <div className="text-sm text-gray-500">Comments</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{activity?.communities.length || 0}</div>
                  <div className="text-sm text-gray-500">Communities</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>

              {/* Recent Posts */}
              {activity?.posts && activity.posts.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Posts</h5>
                  <div className="space-y-2">
                    {activity.posts.map((post) => (
                      <Card key={post.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-medium text-sm text-gray-900">{post.title}</h6>
                              <p className="text-xs text-gray-600 mt-1">{truncateText(post.body, 100)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {post.tag}
                                </Badge>
                                <span className="text-xs text-gray-500">in {post.community_name}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">{formatDate(post.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Comments */}
              {activity?.comments && activity.comments.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Comments</h5>
                  <div className="space-y-2">
                    {activity.comments.map((comment) => (
                      <Card key={comment.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600">{truncateText(comment.body, 100)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  on "{truncateText(comment.post_title || "", 30)}"
                                </span>
                                <span className="text-xs text-gray-500">in {comment.community_name}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">{formatDate(comment.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {activity?.communities && activity.communities.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Communities</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activity.communities.map((community) => (
                      <Card key={community.slug} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">{community.name}</span>
                            <span className="text-xs text-gray-500">{formatDate(community.joined_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Activity Message */}
              {(!activity?.posts || activity.posts.length === 0) &&
                (!activity?.comments || activity.comments.length === 0) && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No recent activity to display.</p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
