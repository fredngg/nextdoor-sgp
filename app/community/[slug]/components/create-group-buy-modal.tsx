"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface CreateGroupBuyModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupBuyCreated: () => void
  communitySlug: string
}

export function CreateGroupBuyModal({ isOpen, onClose, onGroupBuyCreated, communitySlug }: CreateGroupBuyModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    target_quantity: "",
    price_individual: "",
    price_group: "",
    deadline: "",
    pickup_location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create the group buy
      const { data: groupBuy, error: groupBuyError } = await supabase
        .from("group_buys")
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          target_quantity: Number.parseInt(formData.target_quantity),
          price_individual: Number.parseFloat(formData.price_individual),
          price_group: Number.parseFloat(formData.price_group),
          deadline: formData.deadline,
          pickup_location: formData.pickup_location,
          organizer_id: user.id,
          community_slug: communitySlug,
          status: "pending",
          current_quantity: 1, // Start with 1 to include organizer
        })
        .select()
        .single()

      if (groupBuyError) throw groupBuyError

      // Automatically add organizer as first participant
      const { error: participantError } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuy.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (participantError) {
        console.error("Error adding organizer as participant:", participantError)
        // Don't throw error here as group buy was created successfully
      }

      toast({
        title: "Group Buy Created",
        description: "Your group buy has been created successfully!",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        target_quantity: "",
        price_individual: "",
        price_group: "",
        deadline: "",
        pickup_location: "",
      })

      onGroupBuyCreated()
      onClose()
    } catch (error) {
      console.error("Error creating group buy:", error)
      toast({
        title: "Error",
        description: "Failed to create group buy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="What are you buying together?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide details about the item, brand, specifications, etc."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groceries">Food & Beverages</SelectItem>
                  <SelectItem value="household">Household Items</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing & Accessories</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_quantity">Target Participants</Label>
              <Input
                id="target_quantity"
                type="number"
                min="2"
                value={formData.target_quantity}
                onChange={(e) => handleInputChange("target_quantity", e.target.value)}
                placeholder="How many people needed?"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_individual">Individual Price (S$)</Label>
              <Input
                id="price_individual"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_individual}
                onChange={(e) => handleInputChange("price_individual", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="price_group">Group Price (S$)</Label>
              <Input
                id="price_group"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_group}
                onChange={(e) => handleInputChange("price_group", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="pickup_location">Pickup Location</Label>
            <Input
              id="pickup_location"
              value={formData.pickup_location}
              onChange={(e) => handleInputChange("pickup_location", e.target.value)}
              placeholder="Where will participants collect the items?"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Group Buy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
