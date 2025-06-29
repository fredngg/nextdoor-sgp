"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function createGroupBuy(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const targetPrice = Number.parseFloat(formData.get("targetPrice") as string)
    const minParticipants = Number.parseInt(formData.get("minParticipants") as string)
    const maxParticipants = Number.parseInt(formData.get("maxParticipants") as string)
    const endDate = formData.get("endDate") as string
    const communitySlug = formData.get("communitySlug") as string
    const organizerId = formData.get("organizerId") as string

    if (
      !title ||
      !description ||
      !targetPrice ||
      !minParticipants ||
      !maxParticipants ||
      !endDate ||
      !communitySlug ||
      !organizerId
    ) {
      return {
        success: false,
        error: "All fields are required",
      }
    }

    const { data, error } = await supabase
      .from("group_buys")
      .insert({
        title,
        description,
        target_price: targetPrice,
        min_participants: minParticipants,
        max_participants: maxParticipants,
        end_date: endDate,
        community_slug: communitySlug,
        organizer_id: organizerId,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating group buy:", error)
      return {
        success: false,
        error: "Failed to create group buy",
      }
    }

    revalidatePath(`/community/${communitySlug}`)
    revalidatePath(`/community/${communitySlug}/groupbuys`)

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error in createGroupBuy:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
