"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, MessageSquare, Users, FileText, MapPin, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"

interface UserProfile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  avatar_url: string | null
}

interface UserActivity {
  id: string
  type: "post" | "comment"
  content: string
  created_at: string
  community_name: string
  community_slug: string
}

interface UserStats {
  total_posts: number
  total_comments: number
  communities_joined: number
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile()
    }
  }, [userId, isOpen])

  const fetchUserProfile = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)

      // Fetch user stats
      const [postsResult, commentsResult, communitiesResult] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("comments").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("community_members").select("id", { count: "exact" }).eq("user_id", userId),
      ])

      setStats({
        total_posts: postsResult.count || 0,
        total_comments: commentsResult.count || 0,
        communities_joined: communitiesResult.count || 0,
      })

      // Fetch recent activity (posts and comments)
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          communities!inner(name, slug)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3)

      const { data: commentsData } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          posts!inner(
            communities!inner(name, slug)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3)

      // Combine and sort activities
      const activities: UserActivity[] = []

      if (postsData) {
        activities.push(
          ...postsData.map((post) => ({
            id: post.id,
            type: "post" as const,
            content: post.content,
            created_at: post.created_at,
            community_name: post.communities.name,
            community_slug: post.communities.slug,
          })),
        )
      }

      if (commentsData) {
        activities.push(
          ...commentsData.map((comment) => ({
            id: comment.id,
            type: "comment" as const,
            content: comment.content,
            created_at: comment.created_at,
            community_name: comment.posts.communities.name,
            community_slug: comment.posts.communities.slug,
          })),
        )
      }

      // Sort by date and take top 5
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (err) {
      console.error("Error fetching user profile:", err)
      setError("Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = (profile: UserProfile) => {
    return profile.display_name || profile.email?.split("@")[0] || `User ${profile.id.slice(0, 8)}`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}

        {error && <div className="text-center py-8 text-red-600">{error}</div>}

        {profile && !loading && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-red-100 text-red-600 text-lg font-semibold">
                  {getInitials(getDisplayName(profile))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">{getDisplayName(profile)}</h3>
                  {profile.email && <CheckCircle className="h-4 w-4 text-green-500" title="Verified email" />}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(profile.created_at))} ago</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Stats */}
            {stats && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Activity Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.total_posts}</div>
                      <div className="text-sm text-gray-500">Posts</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.total_comments}</div>
                      <div className="text-sm text-gray-500">Comments</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.communities_joined}</div>
                      <div className="text-sm text-gray-500">Communities</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <Separator />

            {/* Recent Activity */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h4>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <Card key={`${activity.type}-${activity.id}`} className="border-l-4 border-l-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {activity.type === "post" ? (
                                <FileText className="h-4 w-4 text-blue-600" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-green-600" />
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {activity.type === "post" ? "Post" : "Comment"}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{activity.community_name}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{truncateContent(activity.content)}</p>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(activity.created_at))} ago
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
