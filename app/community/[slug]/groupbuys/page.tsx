"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Plus, Users, MapPin, DollarSign, Share2, LogIn, MoreVertical, Trash2, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { CreateGroupBuyModal } from "../components/create-group-buy-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

interface GroupBuy {
  id: string
  title: string
  description: string
  category: string
  target_quantity: number
  current_quantity: number
  price_individual: number
  price_group: number
  pickup_location: string
  deadline: string
  status: string
  organizer_id: string
  community_slug: string
  created_at: string
  organizer_name?: string
  actual_participants?: number
  is_expired?: boolean
}

interface Community {
  id: string
  slug: string
  name: string
  area: string
  region: string
}

interface Participant {
  user_id: string
  group_buy_id: string
  quantity_requested: number
}

export default function GroupBuysPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [community, setCommunity] = useState<Community | null>(null)
  const [allGroupBuys, setAllGroupBuys] = useState<GroupBuy[]>([])
  const [userParticipations, setUserParticipations] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteGroupBuyId, setDeleteGroupBuyId] = useState<string | null>(null)
  const [deletingGroupBuy, setDeletingGroupBuy] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  const communitySlug = params.slug as string

  const isExpired = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return deadlineDate < today
  }

  const activeGroupBuys = allGroupBuys.filter((gb) => !isExpired(gb.deadline))
  const completedGroupBuys = allGroupBuys.filter((gb) => isExpired(gb.deadline))

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

      // Fetch group buys
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

      if (!groupBuysData || groupBuysData.length === 0) {
        setAllGroupBuys([])
        setLoading(false)
        return
      }

      // Fetch organizer display names separately
      const organizerIds = [...new Set(groupBuysData.map((gb) => gb.organizer_id))]
      const organizerNames: Record<string, string> = {}

      if (organizerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("user_id, display_name")
          .in("user_id", organizerIds)

        profilesData?.forEach((profile) => {
          organizerNames[profile.user_id] = profile.display_name
        })
      }

      // Fetch actual participant counts for each group buy
      const groupBuyIds = groupBuysData.map((gb) => gb.id)
      const participantCounts: Record<string, number> = {}

      if (groupBuyIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("group_buy_participants")
          .select("group_buy_id")
          .in("group_buy_id", groupBuyIds)

        // Count participants per group buy
        participantsData?.forEach((participant) => {
          participantCounts[participant.group_buy_id] = (participantCounts[participant.group_buy_id] || 0) + 1
        })
      }

      // Combine group buys with organizer names and actual participant counts
      const groupBuysWithDetails = groupBuysData.map((groupBuy) => ({
        ...groupBuy,
        organizer_name: organizerNames[groupBuy.organizer_id] || "Anonymous Organizer",
        actual_participants: participantCounts[groupBuy.id] || 0,
        is_expired: isExpired(groupBuy.deadline),
      }))

      setAllGroupBuys(groupBuysWithDetails)

      // Fetch user's participations if logged in
      if (user) {
        const { data: userParticipationsData } = await supabase
          .from("group_buy_participants")
          .select("user_id, group_buy_id, quantity_requested")
          .eq("user_id", user.id)
          .in("group_buy_id", groupBuyIds)

        setUserParticipations(userParticipationsData || [])
      }
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

  useEffect(() => {
    fetchData()
  }, [communitySlug, user])

  const handleJoinGroupBuy = async (groupBuyId: string, groupBuy: GroupBuy) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a group buy",
        variant: "destructive",
      })
      return
    }

    // Check if group buy is expired
    if (isExpired(groupBuy.deadline)) {
      toast({
        title: "Group Buy Expired",
        description: "This group buy has already expired and is no longer accepting new members",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuyId,
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
          console.error("Error joining group buy:", error)
          toast({
            title: "Error",
            description: "Failed to join group buy",
            variant: "destructive",
          })
        }
        return
      }

      toast({
        title: "Joined Group Buy!",
        description: "You have successfully joined the group buy",
      })

      // Refresh data to get updated counts
      fetchData()
    } catch (error) {
      console.error("Error joining group buy:", error)
      toast({
        title: "Error",
        description: "Failed to join group buy",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroupBuy = async () => {
    if (!deleteGroupBuyId || !user) return

    setDeletingGroupBuy(true)
    try {
      // First delete all participants
      const { error: participantsError } = await supabase
        .from("group_buy_participants")
        .delete()
        .eq("group_buy_id", deleteGroupBuyId)

      if (participantsError) {
        console.error("Error deleting participants:", participantsError)
      }

      // Then delete all comments
      const { error: commentsError } = await supabase
        .from("group_buy_comments")
        .delete()
        .eq("group_buy_id", deleteGroupBuyId)

      if (commentsError) {
        console.error("Error deleting comments:", commentsError)
      }

      // Finally delete the group buy
      const { error: groupBuyError } = await supabase
        .from("group_buys")
        .delete()
        .eq("id", deleteGroupBuyId)
        .eq("organizer_id", user.id) // Extra security check

      if (groupBuyError) {
        console.error("Error deleting group buy:", groupBuyError)
        toast({
          title: "Error",
          description: "Failed to delete group buy",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Group Buy Deleted",
        description: "Your group buy has been deleted successfully",
      })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error deleting group buy:", error)
      toast({
        title: "Error",
        description: "Failed to delete group buy",
        variant: "destructive",
      })
    } finally {
      setDeletingGroupBuy(false)
      setDeleteGroupBuyId(null)
    }
  }

  const handleCreateGroupBuy = () => {
    if (!user) {
      // Redirect to login page
      router.push("/login")
      return
    }
    setShowCreateModal(true)
  }

  const isUserParticipant = (groupBuyId: string) => {
    return userParticipations.some((p) => p.group_buy_id === groupBuyId)
  }

  const isUserOrganizer = (organizerId: string) => {
    return user?.id === organizerId
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: "Expired", color: "text-red-600" }
    if (diffDays === 0) return { text: "Ends today", color: "text-orange-600" }
    if (diffDays === 1) return { text: "1 day left", color: "text-yellow-600" }
    if (diffDays <= 3) return { text: `${diffDays} days left`, color: "text-yellow-600" }
    return { text: `${diffDays} days left`, color: "text-green-600" }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      groceries: "bg-green-100 text-green-800",
      electronics: "bg-blue-100 text-blue-800",
      household: "bg-purple-100 text-purple-800",
      clothing: "bg-pink-100 text-pink-800",
      books: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.general
  }

  const shareGroupBuy = (groupBuy: GroupBuy, type: "telegram" | "generic") => {
    const url = `${window.location.origin}/community/${communitySlug}/groupbuy/${groupBuy.id}`
    const text = `Check out this group buy: ${groupBuy.title}`

    if (type === "telegram") {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      window.open(telegramUrl, "_blank")
    } else {
      navigator.clipboard.writeText(url)
      toast({
        title: "Link Copied!",
        description: "Group buy link has been copied to clipboard",
      })
    }
  }

  const renderGroupBuyCard = (groupBuy: GroupBuy) => {
    const deadlineStatus = getDeadlineStatus(groupBuy.deadline)
    const expired = isExpired(groupBuy.deadline)

    return (
      <Card key={groupBuy.id} className={`hover:shadow-lg transition-shadow ${expired ? "opacity-75" : ""}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => shareGroupBuy(groupBuy, "telegram")}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Telegram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareGroupBuy(groupBuy, "generic")}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                {/* Delete option - only show for organizer */}
                {user && isUserOrganizer(groupBuy.organizer_id) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteGroupBuyId(groupBuy.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group Buy
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(groupBuy.category)} variant="secondary">
              {groupBuy.category}
            </Badge>
            {expired && (
              <Badge variant="outline" className="text-red-600 border-red-200">
                Expired
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2">{groupBuy.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>
                {groupBuy.actual_participants}/{groupBuy.target_quantity} people
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>
                S${groupBuy.price_individual} → S${groupBuy.price_group}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="truncate">{groupBuy.pickup_location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className={deadlineStatus.color}>
                {expired ? `Expired on ${formatDate(groupBuy.deadline)}` : deadlineStatus.text}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500">Organized by {groupBuy.organizer_name}</div>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
              <Link href={`/community/${communitySlug}/groupbuy/${groupBuy.id}`}>View Details</Link>
            </Button>

            {/* Join button logic based on login status, participation, and expiry */}
            {!user ? (
              <Button asChild size="sm" className="flex-1 bg-red-600 hover:bg-red-700" disabled={expired}>
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  {expired ? "Expired" : "Login to Join Group Buy"}
                </Link>
              </Button>
            ) : isUserOrganizer(groupBuy.organizer_id) ? (
              <Badge variant="default" className="flex-1 justify-center bg-red-600">
                Organizer
              </Badge>
            ) : isUserParticipant(groupBuy.id) ? (
              <Badge variant="secondary" className="flex-1 justify-center">
                {expired ? "Participated" : "Joined"}
              </Badge>
            ) : (
              <Button
                onClick={() => handleJoinGroupBuy(groupBuy.id, groupBuy)}
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={expired}
              >
                {expired ? "Expired" : "Join Group Buy"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGroupBuyGrid = (groupBuys: GroupBuy[], emptyMessage: string) => {
    if (groupBuys.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
            {activeTab === "active" && (
              <>
                <p className="text-gray-500 mb-4">Be the first to create a group buy in this community!</p>
                <Button onClick={handleCreateGroupBuy} className="bg-red-600 hover:bg-red-700">
                  {user ? (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group Buy
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login to Create Group Buy
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )
    }

    return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{groupBuys.map(renderGroupBuyCard)}</div>
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Group Buys</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
        <div className="container mx-auto px-4 py-8">
          {/* Header with Create Group Buy button */}
          <div className="space-y-4 mb-6">
            {/* Back button - full width on mobile */}
            <Button variant="ghost" onClick={() => router.back()} className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="truncate max-w-[200px] sm:max-w-none">Back to {community?.name || "Community"}</span>
            </Button>

            {/* Title and Create Button - stacked on mobile, side by side on desktop */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold">Group Buys</h1>
                <p className="text-sm sm:text-base text-gray-600">Save money by buying together with your neighbors</p>
              </div>

              {/* Create Group Buy Button - full width on mobile, auto width on desktop */}
              <Button onClick={handleCreateGroupBuy} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shrink-0">
                {user ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group Buy
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login to Create Group Buy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs for Active and Completed Group Buys */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active ({activeGroupBuys.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Completed ({completedGroupBuys.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">{renderGroupBuyGrid(activeGroupBuys, "No active group buys yet")}</TabsContent>

            <TabsContent value="completed">
              {renderGroupBuyGrid(completedGroupBuys, "No completed group buys yet")}
            </TabsContent>
          </Tabs>

          {/* Create Group Buy Modal - Only show if user is logged in */}
          {user && (
            <CreateGroupBuyModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              communitySlug={communitySlug}
              onGroupBuyCreated={fetchData}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteGroupBuyId} onOpenChange={() => setDeleteGroupBuyId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group Buy</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this group buy? This action cannot be undone and will remove all
                  participants and comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteGroupBuy}
                  disabled={deletingGroupBuy}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingGroupBuy ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  )
}
