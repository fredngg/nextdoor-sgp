"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

  // Get today's date without time for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

    try {
      setLoading(true)

      console.log("🔄 Creating group buy with data:", formData)

      const { data, error } = await supabase
        .from("group_buys")
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          target_quantity: Number.parseInt(formData.target_quantity),
          current_quantity: 1, // Organizer is automatically included
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

      if (error) {
        console.error("❌ Error creating group buy:", error)
        toast({
          title: "Error",
          description: "Failed to create group buy. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Group buy created:", data)

      // Add the organizer as a participant
      const { error: participantError } = await supabase.from("group_buy_participants").insert({
        group_buy_id: data.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (participantError) {
        console.error("⚠️ Error adding organizer as participant:", participantError)
        // Don't fail the whole operation for this
      }

      toast({
        title: "Group Buy Created!",
        description: "Your group buy has been created successfully",
      })

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
        description: "Failed to create group buy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormData({ ...formData, deadline: date })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Bulk Rice Purchase"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're buying and any important details..."
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food & Groceries</SelectItem>
                <SelectItem value="household">Household Items</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="health">Health & Beauty</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_quantity">Target Quantity</Label>
              <Input
                id="target_quantity"
                type="number"
                min="2"
                value={formData.target_quantity}
                onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
                placeholder="e.g., 10"
                required
              />
            </div>
            <div>
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                placeholder="e.g., Block 123 Void Deck"
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
                onChange={(e) => setFormData({ ...formData, price_individual: e.target.value })}
                placeholder="e.g., 25.00"
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
                onChange={(e) => setFormData({ ...formData, price_group: e.target.value })}
                placeholder="e.g., 20.00"
                required
              />
            </div>
          </div>

          <div>
            <Label>Deadline</Label>
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
                  {formData.deadline ? format(formData.deadline, "PPP") : "Select deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < today}
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Creating..." : "Create Group Buy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
