"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "../../../components/navigation"
import { ArrowLeft, Plus, Users, Calendar, MapPin, DollarSign, Share2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { CreateGroupBuyModal } from "../components/create-group-buy-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const communitySlug = params.slug as string

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

      // Fetch organizer display names separately
      const organizerIds = [...new Set(groupBuysData?.map((gb) => gb.organizer_id) || [])]
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

      // Combine group buys with organizer names
      const groupBuysWithOrganizers =
        groupBuysData?.map((groupBuy) => ({
          ...groupBuy,
          organizer_name: organizerNames[groupBuy.organizer_id] || "Anonymous Organizer",
        })) || []

      setGroupBuys(groupBuysWithOrganizers)

      // Fetch participants if user is logged in
      if (user) {
        const { data: participantsData } = await supabase
          .from("group_buy_participants")
          .select("user_id, group_buy_id, quantity_requested")
          .eq("user_id", user.id)

        setParticipants(participantsData || [])
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

  const handleJoinGroupBuy = async (groupBuyId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a group buy",
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
        console.error("Error joining group buy:", error)
        toast({
          title: "Error",
          description: "Failed to join group buy",
          variant: "destructive",
        })
        return
      }

      // Update current quantity
      const groupBuy = groupBuys.find((gb) => gb.id === groupBuyId)
      if (groupBuy) {
        const { error: updateError } = await supabase
          .from("group_buys")
          .update({ current_quantity: groupBuy.current_quantity + 1 })
          .eq("id", groupBuyId)

        if (updateError) {
          console.error("Error updating quantity:", updateError)
        }
      }

      toast({
        title: "Joined Group Buy!",
        description: "You have successfully joined the group buy",
      })

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

  const isUserParticipant = (groupBuyId: string) => {
    return participants.some((p) => p.group_buy_id === groupBuyId)
  }

  const isUserOrganizer = (organizerId: string) => {
    return user?.id === organizerId
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {community?.name || "Community"}
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Group Buys</h1>
                <p className="text-gray-600">Save money by buying together with your neighbors</p>
              </div>
            </div>
            {/* Create Group Buy Button - This was missing! */}
            <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Group Buy
            </Button>
          </div>

          {groupBuys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No group buys yet</h3>
                <p className="text-gray-500 mb-4">Be the first to create a group buy in this community!</p>
                <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group Buy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupBuys.map((groupBuy) => (
                <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => shareGroupBuy(groupBuy, "telegram")}>
                            Share on Telegram
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareGroupBuy(groupBuy, "generic")}>
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge className={getCategoryColor(groupBuy.category)} variant="secondary">
                      {groupBuy.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{groupBuy.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>
                          {groupBuy.current_quantity}/{groupBuy.target_quantity} people
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
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Deadline: {formatDate(groupBuy.deadline)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">Organized by {groupBuy.organizer_name}</div>

                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href={`/community/${communitySlug}/groupbuy/${groupBuy.id}`}>View Details</Link>
                      </Button>
                      {user && !isUserOrganizer(groupBuy.organizer_id) && !isUserParticipant(groupBuy.id) && (
                        <Button
                          onClick={() => handleJoinGroupBuy(groupBuy.id)}
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          Join Group Buy
                        </Button>
                      )}
                      {isUserParticipant(groupBuy.id) && (
                        <Badge variant="secondary" className="flex-1 justify-center">
                          Joined
                        </Badge>
                      )}
                      {isUserOrganizer(groupBuy.organizer_id) && (
                        <Badge variant="default" className="flex-1 justify-center bg-red-600">
                          Organizer
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Group Buy Modal */}
          <CreateGroupBuyModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            communitySlug={communitySlug}
            onGroupBuyCreated={fetchData}
          />
        </div>
      </div>
    </>
  )
}
