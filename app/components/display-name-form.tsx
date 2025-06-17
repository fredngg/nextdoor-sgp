"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateDisplayName } from "@/lib/display-name"
import { Loader2 } from "lucide-react"

interface DisplayNameFormProps {
  initialValue?: string
  onSubmit: (displayName: string) => Promise<boolean>
  onCancel?: () => void
  submitLabel?: string
  showCancel?: boolean
  isLoading?: boolean
}

export function DisplayNameForm({
  initialValue = "",
  onSubmit,
  onCancel,
  submitLabel = "Save",
  showCancel = false,
  isLoading = false,
}: DisplayNameFormProps) {
  const [displayName, setDisplayName] = useState(initialValue)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateDisplayName(displayName)
    if (!validation.isValid) {
      setError(validation.error || "Invalid display name")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      console.log("Submitting display name:", displayName)
      const success = await onSubmit(displayName.trim())

      if (!success) {
        setError("Failed to save display name. Please try again.")
      }
    } catch (err) {
      console.error("Error in display name form:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const isFormDisabled = submitting || isLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">What should we call you?</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter your display name"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value)
            setError("")
          }}
          maxLength={30}
          disabled={isFormDisabled}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-500">2-30 characters. This is how other community members will see you.</p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-red-600 hover:bg-red-700 flex-1"
          disabled={isFormDisabled || !displayName.trim()}
        >
          {isFormDisabled ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>

        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isFormDisabled}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
