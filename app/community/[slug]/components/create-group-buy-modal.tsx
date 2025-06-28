"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"

interface CreateGroupBuyModalProps {
  isOpen: boolean
  onClose: () => void
  communitySlug: string
  onGroupBuyCreated: () => void
}

export function CreateGroupBuyModal({ isOpen, onClose, communitySlug, onGroupBuyCreated }: CreateGroupBuyModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    target_quantity: "",
    price_individual: "",
    price_group: "",
    pickup_location: "",
    deadline: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-format date input as DD/MM/YYYY
  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "")

    // Limit to 8 digits (DDMMYYYY)
    const limited = numbers.slice(0, 8)

    // Add slashes at appropriate positions
    if (limited.length >= 5) {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`
    } else {
      return limited
    }
  }

  // Validate date format and ensure it's not in the past
  const validateDate = (dateString: string) => {
    if (dateString.length !== 10) return false

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(dateRegex)

    if (!match) return false

    const [, day, month, year] = match
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    // Check if the date is valid
    if (
      date.getDate() !== Number.parseInt(day) ||
      date.getMonth() !== Number.parseInt(month) - 1 ||
      date.getFullYear() !== Number.parseInt(year)
    ) {
      return false
    }

    // Check if date is today or in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    return date >= today
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "deadline") {
      const formatted = formatDateInput(value)
      setFormData((prev) => ({ ...prev, [field]: formatted }))

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }))
      }

      // Validate when complete
      if (formatted.length === 10) {
        if (!validateDate(formatted)) {
          setErrors((prev) => ({
            ...prev,
            [field]: "Please enter a valid date that is today or in the future",
          }))
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.target_quantity || Number.parseInt(formData.target_quantity) < 2) {
      newErrors.target_quantity = "Target quantity must be at least 2"
    }
    if (!formData.price_individual || Number.parseFloat(formData.price_individual) <= 0) {
      newErrors.price_individual = "Individual price must be greater than 0"
    }
    if (!formData.price_group || Number.parseFloat(formData.price_group) <= 0) {
      newErrors.price_group = "Group price must be greater than 0"
    }
    if (
      formData.price_individual &&
      formData.price_group &&
      Number.parseFloat(formData.price_group) >= Number.parseFloat(formData.price_individual)
    ) {
      newErrors.price_group = "Group price must be less than individual price"
    }
    if (!formData.pickup_location.trim()) newErrors.pickup_location = "Pickup location is required"
    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required"
    } else if (formData.deadline.length !== 10) {
      newErrors.deadline = "Please enter a complete date (DD/MM/YYYY)"
    } else if (!validateDate(formData.deadline)) {
      newErrors.deadline = "Please enter a valid date that is today or in the future"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Convert DD/MM/YYYY to ISO format for database
      const [day, month, year] = formData.deadline.split("/")
      const isoDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day)).toISOString()

      const { error } = await supabase.from("group_buys").insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        target_quantity: Number.parseInt(formData.target_quantity),
        current_quantity: 1, // Organizer is automatically included
        price_individual: Number.parseFloat(formData.price_individual),
        price_group: Number.parseFloat(formData.price_group),
        pickup_location: formData.pickup_location.trim(),
        deadline: isoDate,
        status: "pending",
        organizer_id: user.id,
        community_slug: communitySlug,
      })

      if (error) {
        console.error("Error creating group buy:", error)
        toast({
          title: "Error",
          description: "Failed to create group buy. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Get the created group buy to add organizer as participant
      const { data: groupBuyData, error: fetchError } = await supabase
        .from("group_buys")
        .select("id")
        .eq("organizer_id", user.id)
        .eq("community_slug", communitySlug)
        .eq("title", formData.title.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!fetchError && groupBuyData) {
        // Add organizer as participant
        await supabase.from("group_buy_participants").insert({
          group_buy_id: groupBuyData.id,
          user_id: user.id,
          quantity_requested: 1,
        })
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
        deadline: "",
      })
      setErrors({})

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
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      target_quantity: "",
      price_individual: "",
      price_group: "",
      pickup_location: "",
      deadline: "",
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Bulk Rice Purchase"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </div>
            )}
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
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="household">Household Items</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="books">Books & Stationery</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.category}
              </div>
            )}
          </div>

          {/* Target Quantity */}
          <div className="space-y-2">
            <Label htmlFor="target_quantity">Target Number of People *</Label>
            <Input
              id="target_quantity"
              type="number"
              min="2"
              value={formData.target_quantity}
              onChange={(e) => handleInputChange("target_quantity", e.target.value)}
              placeholder="e.g., 10"
              className={errors.target_quantity ? "border-red-500" : ""}
            />
            {errors.target_quantity && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.target_quantity}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_individual">Individual Price (S$) *</Label>
              <Input
                id="price_individual"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price_individual}
                onChange={(e) => handleInputChange("price_individual", e.target.value)}
                placeholder="e.g., 25.00"
                className={errors.price_individual ? "border-red-500" : ""}
              />
              {errors.price_individual && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.price_individual}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_group">Group Price (S$) *</Label>
              <Input
                id="price_group"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price_group}
                onChange={(e) => handleInputChange("price_group", e.target.value)}
                placeholder="e.g., 20.00"
                className={errors.price_group ? "border-red-500" : ""}
              />
              {errors.price_group && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.price_group}
                </div>
              )}
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location *</Label>
            <Input
              id="pickup_location"
              value={formData.pickup_location}
              onChange={(e) => handleInputChange("pickup_location", e.target.value)}
              placeholder="e.g., Void deck of Block 123"
              className={errors.pickup_location ? "border-red-500" : ""}
            />
            {errors.pickup_location && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.pickup_location}
              </div>
            )}
          </div>

          {/* Deadline with auto-formatting */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (DD/MM/YYYY) *</Label>
            <div className="relative">
              <Input
                id="deadline"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className={`${errors.deadline ? "border-red-500" : ""} ${
                  formData.deadline.length === 10 && validateDate(formData.deadline) ? "border-green-500" : ""
                }`}
              />
              {formData.deadline.length === 10 && validateDate(formData.deadline) && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.deadline && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.deadline}
              </div>
            )}
            <p className="text-xs text-gray-500">Enter numbers only - slashes will be added automatically</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Creating..." : "Create Group Buy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
