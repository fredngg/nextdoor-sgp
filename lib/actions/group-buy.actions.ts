"use server"

import { supabase } from "@/lib/supabase"

interface CreateGroupBuyData {
  title: string
  description: string
  category: string
  target_quantity: string
  price_individual: string
  price_group: string
  deadline: string
  pickup_location: string
}

export async function createGroupBuy(formData: CreateGroupBuyData, communitySlug: string, organizerId: string) {
  try {
    const { data: groupBuy, error: groupBuyError } = await supabase
      .from("group_buys")
      .insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        target_quantity: Number.parseInt(formData.target_quantity),
        price_individual: formData.price_individual ? Number.parseFloat(formData.price_individual) : null,
        price_group: Number.parseFloat(formData.price_group),
        deadline: formData.deadline,
        pickup_location: formData.pickup_location,
        organizer_id: organizerId,
        community_slug: communitySlug,
        status: "pending",
        current_quantity: 1,
      })
      .select()
      .maybeSingle()

    if (groupBuyError) {
      console.error("Error creating group buy:", groupBuyError)
      return { success: false, error: groupBuyError.message }
    }

    if (!groupBuy) {
      return { success: false, error: "Failed to create group buy" }
    }

    return { success: true, data: groupBuy }
  } catch (error) {
    console.error("Unexpected error creating group buy:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
