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

  console.log("🔍 FirstLoginModal: Rendering with isOpen:", isOpen, "userId:", userId)

  const handleSubmit = async (displayName: string): Promise<boolean> => {
    try {
      setIsSubmitting(true)

      console.log("🔄 FirstLoginModal: Setting display name for user:", userId)
      console.log("📝 Display name:", displayName)

      const success = await setUserDisplayName(userId, displayName)

      if (success) {
        console.log("✅ FirstLoginModal: Display name set successfully")
        toast({
          title: "Welcome to nextdoor.sg!",
          description: `Your display name has been set to "${displayName}".`,
        })
        onComplete(displayName)
        return true
      } else {
        console.error("❌ FirstLoginModal: Failed to set display name")
        toast({
          title: "Error",
          description: "Failed to save your display name. Please try again.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("💥 FirstLoginModal: Error setting display name:", error)
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
