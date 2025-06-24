"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Send } from "lucide-react"

interface CreateGroupBuyModalProps {
  isOpen: boolean
  onClose: () => void
  communitySlug: string
  onGroupBuyCreated: () => void
}

export function CreateGroupBuyModal({ isOpen, onClose, communitySlug, onGroupBuyCreated }: CreateGroupBuyModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deadline, setDeadline] = useState<Date>()
  const [createdGroupBuy, setCreatedGroupBuy] = useState<any>(null)
  const [showShareOptions, setShowShareOptions] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_quantity: "",
    price_individual: "",
    price_group: "",
    pickup_location: "",
    category: "",
  })

  // Categories that match the database constraint exactly
  const categories = ["groceries", "electronics", "household", "clothing", "books", "general"]

  // Display names for categories
  const categoryDisplayNames = {
    groceries: "Groceries",
    electronics: "Electronics",
    household: "Household Items",
    clothing: "Clothing & Fashion",
    books: "Books & Media",
    general: "General Items",
  }

  const handleInputChange = (field: string, value: string) => {
    console.log(`Input changed: ${field} = ${value}`)
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    console.log("🔍 Starting form validation...")
    const errors = []

    if (!formData.title.trim()) errors.push("Title is required")
    if (!formData.description.trim()) errors.push("Description is required")
    if (!formData.target_quantity || Number.parseInt(formData.target_quantity) < 2) {
      errors.push("Target quantity must be at least 2")
    }
    if (!formData.price_individual || Number.parseFloat(formData.price_individual) <= 0) {
      errors.push("Individual price must be greater than 0")
    }
    if (!formData.price_group || Number.parseFloat(formData.price_group) <= 0) {
      errors.push("Group price must be greater than 0")
    }
    if (Number.parseFloat(formData.price_group) >= Number.parseFloat(formData.price_individual)) {
      errors.push("Group price must be less than individual price")
    }
    if (!formData.pickup_location.trim()) errors.push("Pickup location is required")
    if (!formData.category) errors.push("Category is required")
    if (!deadline) errors.push("Deadline is required")
    if (deadline && deadline <= new Date()) errors.push("Deadline must be in the future")

    console.log("✅ Validation complete. Errors:", errors)
    return errors
  }

  const generateTelegramLink = (groupBuy: any) => {
    const baseUrl = window.location.origin
    const groupBuyUrl = `${baseUrl}/community/${communitySlug}?groupbuy=${groupBuy.id}`

    const savings = Number.parseFloat(formData.price_individual) - Number.parseFloat(formData.price_group)
    const savingsPercent = Math.round((savings / Number.parseFloat(formData.price_individual)) * 100)

    const message = `🛒 *Group Buy Alert!*

📦 *${formData.title}*
${formData.description}

💰 *Pricing:*
• Individual: S$${formData.price_individual}
• Group Price: S$${formData.price_group}
• *Save S$${savings.toFixed(2)} (${savingsPercent}% off!)*

👥 *Target:* ${formData.target_quantity} people
📍 *Pickup:* ${formData.pickup_location}
⏰ *Deadline:* ${deadline?.toLocaleDateString()}

Join now: ${groupBuyUrl}

#GroupBuy #${categoryDisplayNames[formData.category].replace(/\s+/g, "")}`

    const encodedMessage = encodeURIComponent(message)
    return `tg://msg?text=${encodedMessage}`
  }

  const handleTelegramShare = () => {
    if (!createdGroupBuy) return

    const telegramLink = generateTelegramLink(createdGroupBuy)
    console.log("📱 Opening Telegram with link:", telegramLink)

    // Try to open Telegram app
    window.location.href = telegramLink

    toast({
      title: "Opening Telegram",
      description: "Telegram should open with your group buy message ready to share!",
    })
  }

  const handleCopyLink = () => {
    if (!createdGroupBuy) return

    const baseUrl = window.location.origin
    const groupBuyUrl = `${baseUrl}/community/${communitySlug}?groupbuy=${createdGroupBuy.id}`

    navigator.clipboard
      .writeText(groupBuyUrl)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "Group buy link copied to clipboard",
        })
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Please copy the link manually",
          variant: "destructive",
        })
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🚀 Form submit triggered!")
    e.preventDefault()

    if (!user) {
      console.log("❌ No user found - showing auth error")
      toast({
        title: "Authentication Required",
        description: "Please log in to create a group buy",
        variant: "destructive",
      })
      return
    }

    const errors = validateForm()
    if (errors.length > 0) {
      console.log("❌ Validation failed:", errors[0])
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validation passed - starting database insert")
    setLoading(true)

    try {
      const insertData = {
        community_slug: communitySlug,
        organizer_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_quantity: Number.parseInt(formData.target_quantity),
        price_individual: Number.parseFloat(formData.price_individual),
        price_group: Number.parseFloat(formData.price_group),
        deadline: deadline!.toISOString(),
        pickup_location: formData.pickup_location.trim(),
        category: formData.category,
        status: "pending",
      }

      console.log("📤 Sending to Supabase:", insertData)

      const { data, error } = await supabase.from("group_buys").insert(insertData).select()

      console.log("📥 Supabase response:", { data, error })

      if (error) {
        console.error("❌ Supabase error details:", error)
        throw error
      }

      console.log("🎉 Group buy created successfully:", data)
      setCreatedGroupBuy(data[0])
      setShowShareOptions(true)

      toast({
        title: "Group Buy Created!",
        description: "Your group buy has been created successfully. Share it to get participants!",
      })
    } catch (error) {
      console.error("💥 Error creating group buy:", error)
      toast({
        title: "Error",
        description: `Failed to create group buy: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      console.log("🏁 Setting loading to false")
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      title: "",
      description: "",
      target_quantity: "",
      price_individual: "",
      price_group: "",
      pickup_location: "",
      category: "",
    })
    setDeadline(undefined)
    setCreatedGroupBuy(null)
    setShowShareOptions(false)
    onClose()
    onGroupBuyCreated()
  }

  const calculateSavings = () => {
    const individual = Number.parseFloat(formData.price_individual) || 0
    const group = Number.parseFloat(formData.price_group) || 0
    return individual - group
  }

  const calculateSavingsPercentage = () => {
    const individual = Number.parseFloat(formData.price_individual) || 0
    const group = Number.parseFloat(formData.price_group) || 0
    if (individual === 0) return 0
    return Math.round(((individual - group) / individual) * 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showShareOptions ? "Share Your Group Buy" : "Create New Group Buy"}</DialogTitle>
        </DialogHeader>

        {showShareOptions ? (
          // Share Options Screen
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-green-600 text-lg font-semibold mb-2">🎉 Group Buy Created Successfully!</div>
              <p className="text-gray-600">Share your group buy to get participants and reach your target quantity.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">{formData.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
              <div className="text-sm">
                <span className="text-green-600 font-medium">
                  Save S${calculateSavings().toFixed(2)} ({calculateSavingsPercentage()}% off)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleTelegramShare}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Share on Telegram
              </Button>

              <Button onClick={handleCopyLink} variant="outline" className="w-full" size="lg">
                Copy Group Buy Link
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose} variant="outline">
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Original Form
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product/Item Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., iPhone 15 Cases (Bulk Order)"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the item, brand, specifications, etc."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryDisplayNames[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity and Pricing */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="target_quantity">Target Quantity *</Label>
                <Input
                  id="target_quantity"
                  type="number"
                  min="2"
                  max="100"
                  value={formData.target_quantity}
                  onChange={(e) => handleInputChange("target_quantity", e.target.value)}
                  placeholder="How many people needed?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_individual">Individual Price (S$) *</Label>
                  <Input
                    id="price_individual"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price_individual}
                    onChange={(e) => handleInputChange("price_individual", e.target.value)}
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <Label htmlFor="price_group">Group Price (S$) *</Label>
                  <Input
                    id="price_group"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price_group}
                    onChange={(e) => handleInputChange("price_group", e.target.value)}
                    placeholder="18.00"
                  />
                </div>
              </div>

              {/* Savings Display */}
              {formData.price_individual && formData.price_group && calculateSavings() > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-800">
                    <strong>Savings per person:</strong> S${calculateSavings().toFixed(2)} (
                    {calculateSavingsPercentage()}% off)
                  </div>
                </div>
              )}
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickup_location">Pickup Location *</Label>
                <Input
                  id="pickup_location"
                  value={formData.pickup_location}
                  onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                  placeholder="e.g., Block 123 Lobby, Community Center"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline ? deadline.toISOString().split("T")[0] : ""}
                  onChange={(e) => {
                    console.log("📅 Date changed:", e.target.value)
                    if (e.target.value) {
                      const newDate = new Date(e.target.value + "T23:59:59")
                      console.log("📅 Setting deadline to:", newDate)
                      setDeadline(newDate)
                    } else {
                      console.log("📅 Clearing deadline")
                      setDeadline(undefined)
                    }
                  }}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">Select when participants need to join by</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Group Buy"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
