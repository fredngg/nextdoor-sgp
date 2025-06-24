"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { MapPin, Users, DollarSign, MessageCircle, Send, Clock, User, ShoppingCart } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

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
  organizer?: {
    display_name: string
  }
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

interface GroupBuyDetailsModalProps {
  groupBuy: GroupBuy | null
  isOpen: boolean
  onClose: () => void
  onJoin: (groupBuyId: string) => void
}

export function GroupBuyDetailsModal({ groupBuy, isOpen, onClose, onJoin }: GroupBuyDetailsModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [isParticipant, setIsParticipant] = useState(false)

  useEffect(() => {
    if (groupBuy && isOpen) {
      fetchParticipants()
      fetchComments()
      checkParticipation()
    }
  }, [groupBuy, isOpen, user])

  const fetchParticipants = async () => {
    if (!groupBuy) return

    try {
      const { data, error } = await supabase
        .from("group_buy_participants")
        .select(`
          *,
          user_profiles!inner(display_name)
        `)
        .eq("group_buy_id", groupBuy.id)
        .order("joined_at", { ascending: true })

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  const fetchComments = async () => {
    if (!groupBuy) return

    try {
      const { data, error } = await supabase
        .from("group_buy_comments")
        .select(`
          *,
          user_profiles!inner(display_name)
        `)
        .eq("group_buy_id", groupBuy.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const checkParticipation = async () => {
    if (!groupBuy || !user) return

    try {
      const { data, error } = await supabase
        .from("group_buy_participants")
        .select("id")
        .eq("group_buy_id", groupBuy.id)
        .eq("user_id", user.id)
        .single()

      setIsParticipant(!!data && !error)
    } catch (error) {
      setIsParticipant(false)
    }
  }

  const handleAddComment = async () => {
    if (!groupBuy || !user || !newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from("group_buy_comments").insert({
        group_buy_id: groupBuy.id,
        user_id: user.id,
        comment: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      fetchComments()
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  if (!groupBuy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{groupBuy.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(groupBuy.status)}>
                {groupBuy.status.charAt(0).toUpperCase() + groupBuy.status.slice(1)}
              </Badge>
              <div className="text-sm text-gray-600">Category: {groupBuy.category}</div>
            </div>

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
          </div>

          {/* Key Information */}
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
                <span>Organized by {groupBuy.organizer?.display_name || "Unknown"}</span>
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
            <Button onClick={() => onJoin(groupBuy.id)} className="w-full" size="lg">
              Join Group Buy
            </Button>
          )}

          {isParticipant && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800 font-medium">✅ You're part of this group buy!</div>
            </div>
          )}

          <Separator />

          {/* Participants */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participants.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {participant.user_profiles.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{participant.user_profiles.display_name}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </h3>

            {/* Add Comment */}
            {user && (
              <div className="space-y-2 mb-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
                <Button onClick={handleAddComment} disabled={loading || !newComment.trim()} size="sm">
                  <Send className="h-4 w-4 mr-1" />
                  Post Comment
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
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
                <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
