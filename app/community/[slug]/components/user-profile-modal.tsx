"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle, FileText, Users, CheckCircle } from "lucide-react"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  displayName: string
}

interface UserProfile {
  id: string
  display_name: string
  email?: string
  created_at: string
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

export function UserProfileModal({ isOpen, onClose, userId, displayName }: UserProfileModalProps) {
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
        console.error("Error fetching user profile:", profileError)
        return
      }

      setProfile(profileData)

      // Fetch user activity
      const [postsResult, commentsResult, communitiesResult] = await Promise.all([
        // Recent posts
        supabase
          .from("posts")
          .select(`
            id, title, body, tag, created_at, community_slug,
            communities!inner(name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        // Recent comments
        supabase
          .from("comments")
          .select(`
            id, body, created_at, post_id,
            posts!inner(title, community_slug),
            posts.communities!inner(name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        // Communities joined
        supabase
          .from("community_members")
          .select(`
            created_at,
            communities!inner(slug, name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ])

      const posts =
        postsResult.data?.map((post) => ({
          ...post,
          community_name: (post as any).communities?.name || "Unknown Community",
        })) || []

      const comments =
        commentsResult.data?.map((comment) => ({
          ...comment,
          post_title: (comment as any).posts?.title || "Unknown Post",
          community_slug: (comment as any).posts?.community_slug || "",
          community_name: (comment as any).posts?.communities?.name || "Unknown Community",
        })) || []

      const communities =
        communitiesResult.data?.map((member) => ({
          slug: (member as any).communities.slug,
          name: (member as any).communities.name,
          joined_at: member.created_at,
        })) || []

      setActivity({
        posts,
        comments,
        communities,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
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

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      Announcement: "bg-blue-100 text-blue-800",
      "Buy/Sell": "bg-green-100 text-green-800",
      "Lost & Found": "bg-red-100 text-red-800",
      General: "bg-gray-100 text-gray-800",
      RenoTalk: "bg-orange-100 text-orange-800",
      "Fur Kids": "bg-purple-100 text-purple-800",
      Sports: "bg-indigo-100 text-indigo-800",
      "Events/Parties": "bg-pink-100 text-pink-800",
    }
    return colors[tag] || "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-red-100 text-red-800">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{displayName}</h3>
                  {profile?.email && <CheckCircle className="h-5 w-5 text-green-500" title="Verified member" />}
                </div>
                <p className="text-gray-600">
                  Member since {profile?.created_at ? formatDate(profile.created_at) : "recently"}
                </p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activity?.posts.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activity?.comments.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Communities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activity?.communities.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Recent Activity</h4>

              {/* Recent Posts */}
              {activity?.posts && activity.posts.length > 0 && (
                <div>
                  <h5 className="text-md font-medium mb-3 text-gray-700">Recent Posts</h5>
                  <div className="space-y-3">
                    {activity.posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h6 className="font-medium text-sm">{post.title}</h6>
                          <Badge variant="secondary" className={`text-xs ${getTagColor(post.tag)}`}>
                            {post.tag}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {post.body.length > 100 ? `${post.body.slice(0, 100)}...` : post.body}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{post.community_name}</span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Comments */}
              {activity?.comments && activity.comments.length > 0 && (
                <div>
                  <h5 className="text-md font-medium mb-3 text-gray-700">Recent Comments</h5>
                  <div className="space-y-3">
                    {activity.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">
                          {comment.body.length > 100 ? `${comment.body.slice(0, 100)}...` : comment.body}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>on "{comment.post_title}"</span>
                          <span>•</span>
                          <span>{comment.community_name}</span>
                          <span>•</span>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {activity?.communities && activity.communities.length > 0 && (
                <div>
                  <h5 className="text-md font-medium mb-3 text-gray-700">Communities</h5>
                  <div className="flex flex-wrap gap-2">
                    {activity.communities.map((community) => (
                      <Badge key={community.slug} variant="outline" className="text-xs">
                        {community.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* No activity message */}
              {(!activity?.posts || activity.posts.length === 0) &&
                (!activity?.comments || activity.comments.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity to show.</p>
                  </div>
                )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
