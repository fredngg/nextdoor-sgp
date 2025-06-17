"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DisplayNameForm } from "./display-name-form"
import { setUserDisplayName } from "@/lib/display-name"
import { useToast } from "@/components/ui/use-toast"
import { User } from "lucide-react"

interface FirstLoginModalProps {
  isOpen: boolean
  onComplete: (displayName: string) => void
  userId: string
}

export function FirstLoginModal({ isOpen, onComplete, userId }: FirstLoginModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (displayName: string): Promise<boolean> => {
    try {
      setIsSubmitting(true)

      console.log("🔄 FirstLoginModal: Starting display name save process")
      console.log("📝 Display name:", displayName)
      console.log("👤 User ID:", userId)

      const success = await setUserDisplayName(userId, displayName)

      console.log("✅ Save result:", success)

      if (success) {
        console.log("🎉 Display name saved successfully, calling onComplete")
        toast({
          title: "Welcome to nextdoor.sg!",
          description: `Your display name has been set to "${displayName}".`,
        })
        onComplete(displayName)
        return true
      } else {
        console.error("❌ Failed to save display name")
        toast({
          title: "Error",
          description: "Failed to save your display name. Please try again.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("💥 Error in FirstLoginModal handleSubmit:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add debug logging
  console.log("🔍 FirstLoginModal render state:")
  console.log("- isOpen:", isOpen)
  console.log("- userId:", userId)
  console.log("- isSubmitting:", isSubmitting)

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-[425px]" hideClose>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <User className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Welcome to nextdoor.sg!</DialogTitle>
          <DialogDescription className="text-base">
            Let's set up your profile so your neighbors can recognize you in the community.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <DisplayNameForm onSubmit={handleSubmit} submitLabel="Complete Setup" isLoading={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
