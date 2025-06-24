"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ShoppingCart, Clock, Users, MapPin, Send, ExternalLink, MessageCircle, Copy, Check } from "lucide-react"
import { CreateGroupBuyModal } from "./create-group-buy-modal"
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
  organizer_display_name?: string
}

interface GroupBuySectionProps {
  communitySlug: string
  highlightedGroupBuy?: string | null
}

export function GroupBuySection({ communitySlug, highlightedGroupBuy }: GroupBuySectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedGroupBuy, setCopiedGroupBuy] = useState<string | null>(null)

  useEffect(() => {
    fetchGroupBuys()
  }, [communitySlug])

  const fetchGroupBuys = async () => {
    try {
      setLoading(true)

      console.log("🔄 Fetching group buys for community:", communitySlug)

      const { data, error } = await supabase
        .from("group_buys")
        .select("*")
        .eq("community_slug", communitySlug)
        .in("status", ["pending", "successful"])
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching group buys:", error)
        toast({
          title: "Error",
          description: "Failed to load group buys",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Group buys fetched:", data)

      // Now fetch organizer display names for each group buy
      const groupBuysWithOrganizers = await Promise.all(
        (data || []).map(async (groupBuy) => {
          try {
            console.log("🔄 Fetching display name for organizer:", groupBuy.organizer_id)

            const { data: profileData, error: profileError } = await supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", groupBuy.organizer_id)
              .single()

            if (profileError) {
              console.log("⚠️ No profile found for organizer:", groupBuy.organizer_id, profileError)
              return {
                ...groupBuy,
                organizer_display_name: "Anonymous Organizer",
              }
            }

            console.log("✅ Found display name:", profileData?.display_name)
            return {
              ...groupBuy,
              organizer_display_name: profileData?.display_name || "Anonymous Organizer",
            }
          } catch (error) {
            console.error("Error fetching organizer profile:", error)
            return {
              ...groupBuy,
              organizer_display_name: "Anonymous Organizer",
            }
          }
        }),
      )

      console.log("✅ Group buys with organizer names:", groupBuysWithOrganizers)
      setGroupBuys(groupBuysWithOrganizers)
    } catch (error) {
      console.error("Error fetching group buys:", error)
    } finally {
      setLoading(false)
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

    console.log("📱 Opening Telegram with link:", telegramLink)
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

    console.log("📱 Opening WhatsApp with message")
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

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedGroupBuy(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      // Fallback: copy just the URL
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Group Buys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading group buys...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Group Buys
            </CardTitle>
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              New Group Buy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groupBuys.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Buys Yet</h3>
              <p className="text-gray-500 mb-4">Be the first to start a group buy in your community!</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Group Buy
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupBuys.map((groupBuy) => (
                <Card
                  key={groupBuy.id}
                  className={`border-l-4 border-l-red-500 ${
                    highlightedGroupBuy === groupBuy.id ? "ring-2 ring-red-200 bg-red-50" : ""
                  }`}
                >
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
                            <Clock className="h-4 w-4" />
                            {formatDeadline(groupBuy.deadline)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Share Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
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
                          {groupBuy.status.charAt(0).toUpperCase() + groupBuy.status.slice(1)}
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
                            <span className="line-through text-gray-400">${groupBuy.price_individual}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Group: </span>
                            <span className="font-semibold text-green-600">${groupBuy.price_group}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">
                              Save ${calculateSavings(groupBuy.price_individual, groupBuy.price_group)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pickup Location */}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{groupBuy.pickup_location}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/community/${communitySlug}/groupbuy/${groupBuy.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          asChild
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={groupBuy.status !== "pending"}
                        >
                          <Link href={`/community/${communitySlug}/groupbuy/${groupBuy.id}`}>
                            {groupBuy.status === "pending" ? "Join Group Buy" : "View Group Buy"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateGroupBuyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        communitySlug={communitySlug}
        onGroupBuyCreated={fetchGroupBuys}
      />
    </>
  )
}
