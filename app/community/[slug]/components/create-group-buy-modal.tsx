"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    target_quantity: "",
    price_individual: "",
    price_group: "",
    pickup_location: "",
    deadline: undefined as Date | undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a group buy",
        variant: "destructive",
      })
      return
    }

    if (!formData.deadline) {
      toast({
        title: "Deadline Required",
        description: "Please select a deadline for the group buy",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("🔄 Creating group buy with data:", formData)

      // Create the group buy
      const { data: groupBuyData, error: groupBuyError } = await supabase
        .from("group_buys")
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          target_quantity: Number.parseInt(formData.target_quantity),
          current_quantity: 1, // Start with 1 since organizer is automatically included
          price_individual: Number.parseFloat(formData.price_individual),
          price_group: Number.parseFloat(formData.price_group),
          pickup_location: formData.pickup_location,
          deadline: formData.deadline.toISOString(),
          status: "pending",
          organizer_id: user.id,
          community_slug: communitySlug,
        })
        .select()
        .single()

      if (groupBuyError) {
        console.error("❌ Group buy creation error:", groupBuyError)
        throw groupBuyError
      }

      console.log("✅ Group buy created:", groupBuyData)

      // Automatically add the organizer as a participant
      const { error: participantError } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuyData.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (participantError) {
        console.error("❌ Error adding organizer as participant:", participantError)
        // Don't throw error here, just log it - the group buy was created successfully
        toast({
          title: "Group Buy Created",
          description:
            "Group buy created successfully, but there was an issue adding you as a participant. You can join manually.",
        })
      } else {
        console.log("✅ Organizer added as participant")
        toast({
          title: "Group Buy Created!",
          description: "Your group buy has been created and you've been automatically added as a participant.",
        })
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        target_quantity: "",
        price_individual: "",
        price_group: "",
        pickup_location: "",
        deadline: undefined,
      })

      onClose()
      onGroupBuyCreated()
    } catch (error) {
      console.error("❌ Error creating group buy:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group buy",
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
          <DialogTitle>Create New Group Buy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., iPhone 15 Cases (Bulk Order)"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the item, quality, specifications, etc."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="household">Household Items</SelectItem>
                  <SelectItem value="clothing">Clothing & Fashion</SelectItem>
                  <SelectItem value="books">Books & Media</SelectItem>
                  <SelectItem value="general">General Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_quantity">Target People *</Label>
              <Input
                id="target_quantity"
                type="number"
                min="2"
                max="100"
                value={formData.target_quantity}
                onChange={(e) => handleInputChange("target_quantity", e.target.value)}
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <Label htmlFor="price_individual">Individual Price (S$) *</Label>
              <Input
                id="price_individual"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_individual}
                onChange={(e) => handleInputChange("price_individual", e.target.value)}
                placeholder="e.g., 25.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="price_group">Group Price (S$) *</Label>
              <Input
                id="price_group"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_group}
                onChange={(e) => handleInputChange("price_group", e.target.value)}
                placeholder="e.g., 18.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="pickup_location">Pickup Location *</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location}
                onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                placeholder="e.g., Block 123 Lobby, Community Center"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label>Deadline *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, "PPP") : "Pick a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, deadline: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700">
              {loading ? "Creating..." : "Create Group Buy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
