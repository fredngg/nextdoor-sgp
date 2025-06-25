"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "../../../components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Plus,
  ShoppingCart,
  Clock,
  Users,
  MapPin,
  Send,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Crown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CreateGroupBuyModal } from "../components/create-group-buy-modal"

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
  organizer_display_name?: string
}

interface Community {
  id: string
  slug: string
  name: string
  area: string
  region: string
}

export default function GroupBuysPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const communitySlug = params.slug as string

  const [community, setCommunity] = useState<Community | null>(null)
  const [activeGroupBuys, setActiveGroupBuys] = useState<GroupBuy[]>([])
  const [completedGroupBuys, setCompletedGroupBuys] = useState<GroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedGroupBuy, setCopiedGroupBuy] = useState<string | null>(null)
  const [participationStatus, setParticipationStatus] = useState<
    Record<string, { isParticipant: boolean; isOrganizer: boolean }>
  >({})

  useEffect(() => {
    if (communitySlug) {
      fetchData()
    }
  }, [communitySlug])

  const checkParticipationStatus = async (groupBuys: GroupBuy[]) => {
    if (!user) return

    const statusMap: Record<string, { isParticipant: boolean; isOrganizer: boolean }> = {}

    for (const groupBuy of groupBuys) {
      // Check if user is organizer
      const isOrganizer = user.id === groupBuy.organizer_id

      // Check if user is participant
      let isParticipant = false
      if (!isOrganizer) {
        try {
          const { data, error } = await supabase
            .from("group_buy_participants")
            .select("id")
            .eq("group_buy_id", groupBuy.id)
            .eq("user_id", user.id)
            .single()

          isParticipant = !!data && !error
        } catch (error) {
          isParticipant = false
        }
      }

      statusMap[groupBuy.id] = { isParticipant, isOrganizer }
    }

    setParticipationStatus(statusMap)
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .single()

      if (communityError) {
        console.error("Error fetching community:", communityError)
      } else {
        setCommunity(communityData)
      }

      // Fetch all group buys for this community
      const { data: groupBuysData, error: groupBuysError } = await supabase
        .from("group_buys")
        .select("*")
        .eq("community_slug", communitySlug)
        .order("created_at", { ascending: false })

      if (groupBuysError) {
        console.error("Error fetching group buys:", groupBuysError)
        toast({
          title: "Error",
          description: "Failed to load group buys",
          variant: "destructive",
        })
        return
      }

      // Fetch organizer display names
      const groupBuysWithOrganizers = await Promise.all(
        (groupBuysData || []).map(async (groupBuy) => {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", groupBuy.organizer_id)
              .single()

            return {
              ...groupBuy,
              organizer_display_name: profileData?.display_name || "Anonymous Organizer",
            }
          } catch (error) {
            return {
              ...groupBuy,
              organizer_display_name: "Anonymous Organizer",
            }
          }
        }),
      )

      // Separate active and completed group buys
      const now = new Date()
      const active: GroupBuy[] = []
      const completed: GroupBuy[] = []

      groupBuysWithOrganizers.forEach((groupBuy) => {
        const deadline = new Date(groupBuy.deadline)
        if (deadline > now && groupBuy.status !== "completed") {
          active.push(groupBuy)
        } else {
          completed.push(groupBuy)
        }
      })

      setActiveGroupBuys(active)
      setCompletedGroupBuys(completed)

      await checkParticipationStatus([...active, ...completed])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load group buys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroupBuy = async (groupBuy: GroupBuy) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to join group buys",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuy.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (error) {
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
        // Refresh participation status
        await checkParticipationStatus([...activeGroupBuys, ...completedGroupBuys])
      }
    } catch (error) {
      console.error("Error joining group buy:", error)
      toast({
        title: "Error",
        description: "Failed to join group buy",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroupBuy = async (groupBuy: GroupBuy) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("group_buy_participants")
        .delete()
        .eq("group_buy_id", groupBuy.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Left Group Buy",
        description: "You've left the group buy",
      })
      // Refresh participation status
      await checkParticipationStatus([...activeGroupBuys, ...completedGroupBuys])
    } catch (error) {
      console.error("Error leaving group buy:", error)
      toast({
        title: "Error",
        description: "Failed to leave group buy",
        variant: "destructive",
      })
    }
  }

  const generateShareMessage = (groupBuy: GroupBuy) => {
    const baseUrl = window.location.origin
    const groupBuyUrl = `${baseUrl}/community/${communitySlug}/groupbuy/${groupBuy.id}`

    const savings = groupBuy.price_individual - groupBuy.price_group
    const savingsPercent = Math.round((savings / groupBuy.price_individual) * 100)

    return `🛒 *Group Buy Alert!*

📦 *${groupBuy.title}*
${groupBuy.description}

💰 *Pricing:*
• Individual: S$${groupBuy.price_individual}
• Group Price: S$${groupBuy.price_group}
• *Save S$${savings.toFixed(2)} (${savingsPercent}% off!)*

👥 *Target:* ${groupBuy.target_quantity} people
📍 *Pickup:* ${groupBuy.pickup_location}
⏰ *Deadline:* ${new Date(groupBuy.deadline).toLocaleDateString()}

Join now: ${groupBuyUrl}`
  }

  const handleTelegramShare = (groupBuy: GroupBuy) => {
    const message = generateShareMessage(groupBuy)
    const encodedMessage = encodeURIComponent(message)
    const telegramLink = `tg://msg?text=${encodedMessage}`

    window.location.href = telegramLink
    toast({
      title: "Opening Telegram",
      description: "Telegram should open with the group buy message ready to share!",
    })
  }

  const handleWhatsAppShare = (groupBuy: GroupBuy) => {
    const message = generateShareMessage(groupBuy)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`

    window.open(whatsappUrl, "_blank")
    toast({
      title: "Opening WhatsApp",
      description: "WhatsApp should open with the group buy message ready to share!",
    })
  }

  const handleCopyLink = async (groupBuy: GroupBuy) => {
    const message = generateShareMessage(groupBuy)

    try {
      await navigator.clipboard.writeText(message)
      setCopiedGroupBuy(groupBuy.id)
      toast({
        title: "Copied to Clipboard!",
        description: "Share message copied. Perfect for WhatsApp, SMS, or any messaging app!",
      })

      setTimeout(() => setCopiedGroupBuy(null), 2000)
    } catch (error) {
      const baseUrl = window.location.origin
      const groupBuyUrl = `${baseUrl}/community/${communitySlug}/groupbuy/${groupBuy.id}`

      try {
        await navigator.clipboard.writeText(groupBuyUrl)
        toast({
          title: "Link Copied!",
          description: "Group buy link copied to clipboard",
        })
      } catch (fallbackError) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy to clipboard. Please copy the URL manually.",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "successful":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Expired"
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "1 day left"
    return `${diffDays} days left`
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const calculateSavings = (individual: number, group: number) => {
    return individual - group
  }

  const renderGroupBuyCard = (groupBuy: GroupBuy, isCompleted = false) => {
    const status = participationStatus[groupBuy.id] || { isParticipant: false, isOrganizer: false }
    const { isParticipant, isOrganizer } = status

    return (
      <Card key={groupBuy.id} className={`border-l-4 ${isCompleted ? "border-l-gray-400" : "border-l-red-500"}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-lg text-gray-900 mb-1">{groupBuy.title}</h4>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{groupBuy.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {groupBuy.organizer_display_name || "Anonymous Organizer"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(groupBuy.deadline).toLocaleDateString()}
                </span>
                {!isCompleted && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDeadline(groupBuy.deadline)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Send className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleTelegramShare(groupBuy)} className="cursor-pointer">
                    <Send className="h-4 w-4 mr-2 text-blue-500" />
                    Share on Telegram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleWhatsAppShare(groupBuy)} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyLink(groupBuy)} className="cursor-pointer">
                    {copiedGroupBuy === groupBuy.id ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2 text-gray-500" />
                    )}
                    {copiedGroupBuy === groupBuy.id ? "Copied!" : "Copy Message"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge className={getStatusColor(groupBuy.status)}>
                {isCompleted ? "Completed" : groupBuy.status.charAt(0).toUpperCase() + groupBuy.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>
                  {groupBuy.current_quantity}/{groupBuy.target_quantity} people
                </span>
              </div>
              <Progress
                value={calculateProgress(groupBuy.current_quantity, groupBuy.target_quantity)}
                className="h-2"
              />
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">Individual: </span>
                  <span className="line-through text-gray-400">S${groupBuy.price_individual}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Group: </span>
                  <span className="font-semibold text-green-600">S${groupBuy.price_group}</span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600 font-medium">
                    Save S${calculateSavings(groupBuy.price_individual, groupBuy.price_group)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{groupBuy.pickup_location}</span>
            </div>

            {/* Actions - Updated button logic */}
            <div className="flex gap-2 pt-2">
              <Link href={`/community/${communitySlug}/groupbuy/${groupBuy.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
              {!isCompleted && (
                <div className="flex-1">
                  {!user ? (
                    <Link href="/login" className="w-full">
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700">
                        Login to Join
                      </Button>
                    </Link>
                  ) : isOrganizer ? (
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                      <Crown className="h-4 w-4 mr-2" />
                      Organizer
                    </Button>
                  ) : isParticipant ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleLeaveGroupBuy(groupBuy)}
                    >
                      Leave Group Buy
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => handleJoinGroupBuy(groupBuy)}
                    >
                      Join Group Buy
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <Skeleton className="h-10 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
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
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {community?.name || "Community"}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Group Buys</h1>
                <p className="text-gray-600">Save money by buying together with your neighbors</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Group Buy
            </Button>
          </div>

          {/* Tabs for Active and Completed */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Active ({activeGroupBuys.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Completed ({completedGroupBuys.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Group Buys */}
            <TabsContent value="active">
              {activeGroupBuys.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Group Buys</h3>
                    <p className="text-gray-600 mb-6">Be the first to start a group buy in your community!</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group Buy
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeGroupBuys.map((groupBuy) => renderGroupBuyCard(groupBuy, false))}
                </div>
              )}
            </TabsContent>

            {/* Completed Group Buys */}
            <TabsContent value="completed">
              {completedGroupBuys.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Group Buys</h3>
                    <p className="text-gray-600">Completed group buys will appear here after their deadline passes.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {completedGroupBuys.map((groupBuy) => renderGroupBuyCard(groupBuy, true))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Group Buy Modal */}
        <CreateGroupBuyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          communitySlug={communitySlug}
          onGroupBuyCreated={fetchData}
        />
      </div>
    </>
  )
}
