"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle } from "lucide-react"

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

  const [loading, setLoading] = useState(false)
  const [dateError, setDateError] = useState("")

  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "")

    // Format as DD/MM/YYYY
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  const validateDate = (dateString: string) => {
    if (!dateString || dateString.length !== 10) {
      return "Please enter a complete date (DD/MM/YYYY)"
    }

    const [day, month, year] = dateString.split("/").map(Number)

    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2024) {
      return "Please enter a valid date"
    }

    const inputDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (inputDate <= today) {
      return "Deadline must be in the future"
    }

    return ""
  }

  const handleDateChange = (value: string) => {
    const formatted = formatDateInput(value)
    setFormData((prev) => ({ ...prev, deadline: formatted }))

    if (formatted.length === 10) {
      const error = validateDate(formatted)
      setDateError(error)
    } else {
      setDateError("")
    }
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

    // Validate date
    const dateValidationError = validateDate(formData.deadline)
    if (dateValidationError) {
      setDateError(dateValidationError)
      return
    }

    // Validate required fields
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

    // Validate prices
    const individualPrice = Number.parseFloat(formData.price_individual)
    const groupPrice = Number.parseFloat(formData.price_group)

    if (isNaN(individualPrice) || isNaN(groupPrice) || individualPrice <= 0 || groupPrice <= 0) {
      toast({
        title: "Invalid Prices",
        description: "Please enter valid prices",
        variant: "destructive",
      })
      return
    }

    if (groupPrice >= individualPrice) {
      toast({
        title: "Invalid Pricing",
        description: "Group price must be lower than individual price",
        variant: "destructive",
      })
      return
    }

    // Validate target quantity
    const targetQuantity = Number.parseInt(formData.target_quantity)
    if (isNaN(targetQuantity) || targetQuantity < 2) {
      toast({
        title: "Invalid Target Quantity",
        description: "Target quantity must be at least 2 people",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      const [day, month, year] = formData.deadline.split("/")
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`

      const { error } = await supabase.from("group_buys").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        target_quantity: targetQuantity,
        current_quantity: 0,
        price_individual: individualPrice,
        price_group: groupPrice,
        pickup_location: formData.pickup_location,
        deadline: isoDate,
        status: "pending",
        organizer_id: user.id,
        community_slug: communitySlug,
      })

      if (error) {
        console.error("Error creating group buy:", error)
        toast({
          title: "Error",
          description: "Failed to create group buy",
          variant: "destructive",
        })
        return
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
      setDateError("")

      onGroupBuyCreated()
      onClose()
    } catch (error) {
      console.error("Error creating group buy:", error)
      toast({
        title: "Error",
        description: "Failed to create group buy",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isDateValid = formData.deadline.length === 10 && !dateError

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group Buy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Bulk Rice Purchase"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you're buying and any important details..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="household">Household Items</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_quantity">Target People *</Label>
              <Input
                id="target_quantity"
                type="number"
                min="2"
                value={formData.target_quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_quantity: e.target.value }))}
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
                min="0.01"
                value={formData.price_individual}
                onChange={(e) => setFormData((prev) => ({ ...prev, price_individual: e.target.value }))}
                placeholder="e.g., 15.00"
                required
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
                onChange={(e) => setFormData((prev) => ({ ...prev, price_group: e.target.value }))}
                placeholder="e.g., 12.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="pickup_location">Pickup Location *</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location}
                onChange={(e) => setFormData((prev) => ({ ...prev, pickup_location: e.target.value }))}
                placeholder="e.g., Block 123 Void Deck"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <div className="relative">
                <Input
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className={`pr-10 ${dateError ? "border-red-500" : isDateValid ? "border-green-500" : ""}`}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {formData.deadline.length === 10 &&
                    (isDateValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ))}
                </div>
              </div>
              {dateError && <p className="text-sm text-red-600 mt-1">{dateError}</p>}
            </div>
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
