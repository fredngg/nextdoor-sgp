"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Loader2 } from "lucide-react"

export function Navigation() {
  const { user, signOut, isLoading, displayName } = useAuth()

  // Get user display name (email username or full name if available)
  const getUserDisplayName = () => {
    if (!user) return ""

    // Use display name from context if available
    if (displayName) {
      return displayName
    }

    // Try to get name from user metadata
    const metadata = user.user_metadata
    if (metadata && metadata.full_name) {
      return metadata.full_name
    }

    // Fall back to email username
    if (user.email) {
      return user.email.split("@")[0]
    }

    return "User"
  }

  // Get initials for avatar
  const getInitials = () => {
    const name = getUserDisplayName()
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-red-600">nextdoor.sg</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-red-100 text-red-800">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/me" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
