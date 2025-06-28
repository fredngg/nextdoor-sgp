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

  // Get today's date without time component for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    "Food & Groceries",
    "Electronics",
    "Home & Garden",
    "Health & Beauty",
    "Sports & Recreation",
    "Books & Education",
    "Clothing & Accessories",
    "Services",
    "Other",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

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

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.target_quantity ||
      !formData.price_individual ||
      !formData.price_group ||
      !formData.pickup_location ||
      !formData.deadline
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const targetQuantity = Number.parseInt(formData.target_quantity)
    const priceIndividual = Number.parseFloat(formData.price_individual)
    const priceGroup = Number.parseFloat(formData.price_group)

    if (targetQuantity < 2) {
      toast({
        title: "Invalid Target Quantity",
        description: "Target quantity must be at least 2 people",
        variant: "destructive",
      })
      return
    }

    if (priceGroup >= priceIndividual) {
      toast({
        title: "Invalid Pricing",
        description: "Group price must be lower than individual price",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create the group buy
      const { data: groupBuyData, error: groupBuyError } = await supabase
        .from("group_buys")
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          target_quantity: targetQuantity,
          current_quantity: 1, // Organizer is automatically included
          price_individual: priceIndividual,
          price_group: priceGroup,
          pickup_location: formData.pickup_location,
          deadline: formData.deadline.toISOString(),
          status: "pending",
          community_slug: communitySlug,
          organizer_id: user.id,
        })
        .select()
        .single()

      if (groupBuyError) {
        console.error("Error creating group buy:", groupBuyError)
        toast({
          title: "Error",
          description: "Failed to create group buy. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Add the organizer as a participant
      const { error: participantError } = await supabase.from("group_buy_participants").insert({
        group_buy_id: groupBuyData.id,
        user_id: user.id,
        quantity_requested: 1,
      })

      if (participantError) {
        console.error("Error adding organizer as participant:", participantError)
        // Don't fail the entire operation for this
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
      console.error("Error creating group buy:", error)
      toast({
        title: "Error",
        description: "Failed to create group buy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Bulk Rice Purchase"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what you're buying and any important details..."
              rows={3}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Quantity and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_quantity">Target People *</Label>
              <Input
                id="target_quantity"
                type="number"
                min="2"
                value={formData.target_quantity}
                onChange={(e) => handleInputChange("target_quantity", e.target.value)}
                placeholder="e.g., 10"
                required
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="price_group">Group Price (S$) *</Label>
              <Input
                id="price_group"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_group}
                onChange={(e) => handleInputChange("price_group", e.target.value)}
                placeholder="e.g., 20.00"
                required
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location *</Label>
            <Input
              id="pickup_location"
              value={formData.pickup_location}
              onChange={(e) => handleInputChange("pickup_location", e.target.value)}
              placeholder="e.g., Block 123 Void Deck"
              required
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline *</Label>
            <Popover modal={false}>
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
                  onSelect={(date) => setFormData((prev) => ({ ...prev, deadline: date }))}
                  disabled={(date) => date < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Savings Preview */}
          {formData.price_individual && formData.price_group && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Savings Preview</h4>
              <div className="text-sm text-green-700">
                <p>
                  Individual Price: S${Number.parseFloat(formData.price_individual).toFixed(2)} → Group Price: S$
                  {Number.parseFloat(formData.price_group).toFixed(2)}
                </p>
                <p className="font-medium">
                  Save S$
                  {(Number.parseFloat(formData.price_individual) - Number.parseFloat(formData.price_group)).toFixed(2)}{" "}
                  per person (
                  {Math.round(
                    ((Number.parseFloat(formData.price_individual) - Number.parseFloat(formData.price_group)) /
                      Number.parseFloat(formData.price_individual)) *
                      100,
                  )}
                  % off)
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Creating..." : "Create Group Buy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
