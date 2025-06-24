"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "../../../../components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  MapPin,
  Users,
  DollarSign,
  MessageCircle,
  Send,
  Clock,
  User,
  ShoppingCart,
  AlertCircle,
  Share2,
} from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface GroupBuy {
  id: string
  title: string
  description: string
  target_quantity: number
  current_quantity: number
  price_individual: number
  price_group: number
  deadline: string
  pickup_location: string
  status: "pending" | "successful" | "completed" | "expired"
  category: string
  organizer_id: string
  created_at: string
  community_slug: string
  organizer_display_name?: string
}

interface Community {
  id: string
  slug: string
  name: string
  area: string
  region: string
}

interface Participant {
  id: string
  user_id: string
  quantity_requested: number
  joined_at: string
  user_profiles: {
    display_name: string
  }
}

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  user_profiles: {
    display_name: string
  }
}

export default function GroupBuyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const communitySlug = params.slug as string
  const groupBuyId = params.id as string

  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (communitySlug && groupBuyId) {
      console.log("🔄 Loading group buy page:", { communitySlug, groupBuyId })
      fetchData()
    }
  }, [communitySlug, groupBuyId, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Fetching group buy details...")

      // Fetch group buy details with organizer info
      const { data: groupBuyData, error: groupBuyError } = await supabase
        .from("group_buys")
        .select("*")
        .eq("id", groupBuyId)
        .eq("community_slug", communitySlug)
        .single()

      console.log("📊 Group buy query result:", { groupBuyData, groupBuyError })

      if (groupBuyError) {
        console.error("❌ Group buy error:", groupBuyError)
        if (groupBuyError.code === "PGRST116") {
          setError("Group buy not found")
        } else {
          setError(`Database error: ${groupBuyError.message}`)
        }
        return
      }

      if (!groupBuyData) {
        setError("Group buy not found")
        return
      }

      // Fetch organizer display name separately
      console.log("🔄 Fetching organizer display name for:", groupBuyData.organizer_id)
      const { data: organizerData, error: organizerError } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", groupBuyData.organizer_id)
        .single()

      console.log("📊 Organizer query result:", { organizerData, organizerError })

      setGroupBuy({
        ...groupBuyData,
        organizer_display_name: organizerData?.display_name || "Anonymous Organizer",
      })

      // Fetch community details
      console.log("🔄 Fetching community details...")
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .single()

      console.log("📊 Community query result:", { communityData, communityError })

      if (communityError) {
        console.error("⚠️ Community error:", communityError)
      } else {
        setCommunity(communityData)
      }

      // Fetch participants
      await fetchParticipants()

      // Fetch comments
      await fetchComments()

      // Check if current user is a participant
      await checkParticipation()
    } catch (err) {
      console.error("❌ Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load group buy")
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      console.log("🔄 Fetching participants...")
      const { data, error } = await supabase
        .from("group_buy_participants")
        .select(`
          *,
          user_profiles!inner(display_name)
        `)
        .eq("group_buy_id", groupBuyId)
        .order("joined_at", { ascending: true })

      console.log("📊 Participants query result:", { data, error })

      if (error) {
        console.error("⚠️ Participants error:", error)
        // Don't throw error, just log it
      } else {
        setParticipants(data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching participants:", error)
    }
  }

  const fetchComments = async () => {
    try {
      console.log("🔄 Fetching comments...")
      const { data, error } = await supabase
        .from("group_buy_comments")
        .select(`
          *,
          user_profiles!inner(display_name)
        `)
        .eq("group_buy_id", groupBuyId)
        .order("created_at", { ascending: true })

      console.log("📊 Comments query result:", { data, error })

      if (error) {
        console.error("⚠️ Comments error:", error)
        // Don't throw error, just log it
      } else {
        setComments(data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching comments:", error)
    }
  }

  const checkParticipation = async () => {
    if (!user) return

    try {
      console.log("🔄 Checking participation for user:", user.id)
      const { data, error } = await supabase
        .from("group_buy_participants")
        .select("id")
        .eq("group_buy_id", groupBuyId)
        .eq("user_id", user.id)
        .single()

      console.log("📊 Participation check result:", { data, error })

      setIsParticipant(!!data && !error)
    } catch (error) {
      console.error("⚠️ Error checking participation:", error)
      setIsParticipant(false)
    }
  }

  const handleJoinGroupBuy = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to join group buys",
        variant: "destructive",
      })
      return
    }

    if (!groupBuy) return

    setActionLoading(true)
    try {
      console.log("🔄 Joining group buy:", groupBuy.id)
      const { error } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuy.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (error) {
        console.error("❌ Join error:", error)
        if (error.code === "23505") {
          toast({
            title: "Already Joined",
            description: "You're already part of this group buy",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Joined Successfully!",
          description: "You've joined the group buy",
        })
        await fetchParticipants()
        await checkParticipation()
      }
    } catch (error) {
      console.error("❌ Error joining group buy:", error)
      toast({
        title: "Error",
        description: "Failed to join group buy",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !groupBuy) return

    setActionLoading(true)
    try {
      console.log("🔄 Adding comment...")
      const { error } = await supabase.from("group_buy_comments").insert({
        group_buy_id: groupBuy.id,
        user_id: user.id,
        comment: newComment.trim(),
      })

      if (error) {
        console.error("❌ Comment error:", error)
        throw error
      }

      setNewComment("")
      await fetchComments()
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      })
    } catch (error) {
      console.error("❌ Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleTelegramShare = () => {
    if (!groupBuy) return

    const baseUrl = window.location.origin
    const groupBuyUrl = `${baseUrl}/community/${communitySlug}/groupbuy/${groupBuy.id}`

    const savings = groupBuy.price_individual - groupBuy.price_group
    const savingsPercent = Math.round((savings / groupBuy.price_individual) * 100)

    const categoryDisplayNames = {
      groceries: "Groceries",
      electronics: "Electronics",
      household: "Household Items",
      clothing: "Clothing & Fashion",
      books: "Books & Media",
      general: "General Items",
    }

    const message = `🛒 *Group Buy Alert!*

📦 *${groupBuy.title}*
${groupBuy.description}

💰 *Pricing:*
• Individual: S$${groupBuy.price_individual}
• Group Price: S$${groupBuy.price_group}
• *Save S$${savings.toFixed(2)} (${savingsPercent}% off!)*

👥 *Target:* ${groupBuy.target_quantity} people
📍 *Pickup:* ${groupBuy.pickup_location}
⏰ *Deadline:* ${new Date(groupBuy.deadline).toLocaleDateString()}

Join now: ${groupBuyUrl}

#GroupBuy #${categoryDisplayNames[groupBuy.category]?.replace(/\s+/g, "") || "General"}`

    const encodedMessage = encodeURIComponent(message)
    const telegramLink = `tg://msg?text=${encodedMessage}`

    window.location.href = telegramLink

    toast({
      title: "Opening Telegram",
      description: "Telegram should open with the group buy message ready to share!",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "successful":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Expired"
    if (diffDays === 0) return "Ends today"
    if (diffDays === 1) return "1 day left"
    return `${diffDays} days left`
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const calculateSavings = (individual: number, group: number) => {
    return individual - group
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Skeleton className="h-10 w-32 mb-6" />
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !groupBuy) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-medium">Group Buy Not Found</p>
                  <p className="text-sm text-gray-600">
                    {error || "The group buy you're looking for doesn't exist or has been removed."}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Debug info: Community: {communitySlug}, Group Buy ID: {groupBuyId}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => router.back()} variant="outline" size="sm">
                      Go Back
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/community/${communitySlug}`}>View Community</Link>
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {community?.name || "Community"}
          </Button>

          {/* Main Group Buy Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{groupBuy.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <Badge className={getStatusColor(groupBuy.status)}>
                      {groupBuy.status.charAt(0).toUpperCase() + groupBuy.status.slice(1)}
                    </Badge>
                    <span>Category: {groupBuy.category}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTelegramShare}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {groupBuy.current_quantity} of {groupBuy.target_quantity} people joined
                  </span>
                  <span>
                    {Math.round(calculateProgress(groupBuy.current_quantity, groupBuy.target_quantity))}% complete
                  </span>
                </div>
                <Progress value={calculateProgress(groupBuy.current_quantity, groupBuy.target_quantity)} />
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>Individual: S${groupBuy.price_individual.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <span>Group Price: S${groupBuy.price_group.toFixed(2)}</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800 font-medium">
                      Save S${calculateSavings(groupBuy.price_individual, groupBuy.price_group).toFixed(2)} per person!
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatDeadline(groupBuy.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{groupBuy.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Organized by {groupBuy.organizer_display_name || "Unknown"}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{groupBuy.description}</p>
              </div>

              {/* Join Button */}
              {user && !isParticipant && groupBuy.status === "pending" && (
                <Button
                  onClick={handleJoinGroupBuy}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Joining..." : "Join Group Buy"}
                </Button>
              )}

              {!user && groupBuy.status === "pending" && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Please log in to join this group buy</p>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/login">Log In to Join</Link>
                  </Button>
                </div>
              )}

              {isParticipant && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800 font-medium">✅ You're part of this group buy!</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.user_profiles.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{participant.user_profiles.display_name}</span>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full text-center py-4">
                    No participants yet. Be the first to join!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              {user && (
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                  />
                  <Button onClick={handleAddComment} disabled={actionLoading || !newComment.trim()} size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    {actionLoading ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              )}

              {!user && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-2">Please log in to comment</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              )}

              <Separator />

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.user_profiles.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user_profiles.display_name}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
