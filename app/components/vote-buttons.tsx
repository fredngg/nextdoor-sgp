"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface VoteButtonsProps {
  itemId: string
  itemType: "post" | "comment"
  initialVoteCount?: number
  initialUserVote?: "up" | "down" | null
}

export function VoteButtons({ itemId, itemType, initialVoteCount = 0, initialUserVote = null }: VoteButtonsProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Fetch current vote data when component mounts
  useEffect(() => {
    fetchVoteData()
  }, [itemId, user])

  const fetchVoteData = async () => {
    try {
      const tableName = itemType === "post" ? "post_votes" : "comment_votes"
      const columnName = itemType === "post" ? "post_id" : "comment_id"

      // Get total vote count
      const { data: votes, error: votesError } = await supabase
        .from(tableName)
        .select("vote_type")
        .eq(columnName, itemId)

      if (votesError) {
        console.error("Error fetching votes:", votesError)
        return
      }

      // Calculate vote count (upvotes - downvotes)
      const upvotes = votes?.filter(vote => vote.vote_type === "up").length || 0
      const downvotes = votes?.filter(vote => vote.vote_type === "down").length || 0
      setVoteCount(upvotes - downvotes)

      // Get user's current vote if logged in
      if (user) {
        const { data: userVoteData, error: userVoteError } = await supabase
          .from(tableName)
          .select("vote_type")
          .eq(columnName, itemId)
          .eq("user_id", user.id)
          .single()

        if (userVoteError && userVoteError.code !== "PGRST116") {
          console.error("Error fetching user vote:", userVoteError)
        } else {
          setUserVote(userVoteData?.vote_type || null)
        }
      }
    } catch (error) {
      console.error("Error in fetchVoteData:", error)
    }
  }

  const handleVote = async (voteType: "up" | "down") => {
    if (!user) {
      toast({
        title: "Please log in to vote",
        description: "You need to be logged in to vote on posts and comments.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const tableName = itemType === "post" ? "post_votes" : "comment_votes"
      const columnName = itemType === "post" ? "post_id" : "comment_id"

      // Check if user already voted
      const { data: existingVote, error: fetchError } = await supabase
        .from(tableName)
        .select("*")
        .eq(columnName, itemId)
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new Error(`Failed to fetch existing vote: ${fetchError.message}`)
      }

      let newUserVote: "up" | "down" | null = voteType
      let voteCountChange = 0

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Same vote clicked - remove it (toggle off)
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq("id", existingVote.id)

          if (deleteError) {
            throw new Error(`Failed to remove vote: ${deleteError.message}`)
          }

          newUserVote = null
          voteCountChange = voteType === "up" ? -1 : 1
        } else {
          // Different vote clicked - update it
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ vote_type: voteType })
            .eq("id", existingVote.id)

          if (updateError) {
            throw new Error(`Failed to update vote: ${updateError.message}`)
          }

          newUserVote = voteType
          // Change from previous vote to new vote
          voteCountChange = voteType === "up" ? 2 : -2
        }
      } else {
        // No existing vote - create new one
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            [columnName]: itemId,
            vote_type: voteType,
            user_id: user.id,
          })

        if (insertError) {
          throw new Error(`Failed to create vote: ${insertError.message}`)
        }

        newUserVote = voteType
        voteCountChange = voteType === "up" ? 1 : -1
      }

      // Update local state
      setUserVote(newUserVote)
      setVoteCount(prev => prev + voteCountChange)

    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Voting failed",
        description: "We couldn't record your vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-1 ml-auto">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 hover:bg-green-50 ${
          userVote === "up" ? "bg-green-100 text-green-600" : "text-gray-500"
        }`}
        onClick={() => handleVote("up")}
        disabled={isVoting}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      
      <span className={`text-sm font-medium min-w-[2rem] text-center ${
        voteCount > 0 ? "text-green-600" : 
        voteCount < 0 ? "text-red-600" : 
        "text-gray-500"
      }`}>
        {voteCount}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 hover:bg-red-50 ${
          userVote === "down" ? "bg-red-100 text-red-600" : "text-gray-500"
        }`}
        onClick={() => handleVote("down")}
        disabled={isVoting}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
