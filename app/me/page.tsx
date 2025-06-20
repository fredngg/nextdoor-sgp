"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "../components/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { User, LogOut, Mail, Users, MapPin, UserMinus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { DisplayNameForm } from "../components/display-name-form"
import { setUserDisplayName, getDisplayNameFallback } from "@/lib/display-name"

interface JoinedCommunity {
  id: string
  community_slug: string
  joined_at: string
  communities: {
    name: string
    area: string
    region: string
    slug: string
  }
}

export default function MePage() {
  const { user, signOut, isLoading, displayName, updateDisplayName } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunity[]>([])
  const [loadingCommunities, setLoadingCommunities] = useState(true)
  const [leavingCommunity, setLeavingCommunity] = useState<string | null>(null)
  const [editingDisplayName, setEditingDisplayName] = useState(false)

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchJoinedCommunities()
    }
  }, [user])

  const fetchJoinedCommunities = async () => {
    if (!user) return

    try {
      setLoadingCommunities(true)

      const { data, error } = await supabase
        .from("community_members")
        .select(`
         id,
         community_slug,
         joined_at,
         communities (
           name,
           area,
           region,
           slug
         )
       `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch communities: ${error.message}`)
      }

      setJoinedCommunities(data || [])
    } catch (error) {
      console.error("Error fetching joined communities:", error)
      toast({
        title: "Error loading communities",
        description: "We couldn't load your joined communities. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCommunities(false)
    }
  }

  const handleLeaveCommunity = async (communitySlug: string, communityName: string) => {
    if (!user) return

    try {
      setLeavingCommunity(communitySlug)

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_slug", communitySlug)

      if (error) {
        throw new Error(`Failed to leave community: ${error.message}`)
      }

      // Remove from local state
      setJoinedCommunities((prev) => prev.filter((community) => community.community_slug !== communitySlug))

      toast({
        title: "Left community",
        description: `You've successfully left ${communityName}.`,
      })
    } catch (error) {
      console.error("Error leaving community:", error)
      toast({
        title: "Failed to leave",
        description: "We couldn't remove you from this community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLeavingCommunity(null)
    }
  }

  const handleDisplayNameUpdate = async (newDisplayName: string): Promise<boolean> => {
    if (!user) return false

    const success = await setUserDisplayName(user.id, newDisplayName)

    if (success) {
      updateDisplayName(newDisplayName)
      setEditingDisplayName(false)
      toast({
        title: "Display name updated",
        description: `Your display name has been changed to "${newDisplayName}".`,
      })
      return true
    } else {
      toast({
        title: "Update failed",
        description: "Failed to update your display name. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const getUserDisplayName = () => {
    if (displayName) {
      return displayName
    }

    return getDisplayNameFallback(user?.email, user?.id)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-SG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Unknown"
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  // If no user after loading, show error message (fallback)
  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-red-600">Login expired or invalid</CardTitle>
                  <CardDescription>Please log in again to access your account.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/login">Log in again</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <User className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Welcome, {getUserDisplayName()}</CardTitle>
                    <CardDescription>Manage your nextdoor.sg account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </div>
                      <p className="font-medium">{user?.email || "No email available"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="h-4 w-4" />
                        Display Name
                      </div>
                      <p className="font-medium">{getUserDisplayName()}</p>
                    </div>
                  </div>

                  {/* Display Name Editing */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Update Display Name</h4>
                      {!editingDisplayName && (
                        <Button variant="outline" size="sm" onClick={() => setEditingDisplayName(true)}>
                          Edit
                        </Button>
                      )}
                    </div>

                    {editingDisplayName ? (
                      <DisplayNameForm
                        initialValue={displayName || ""}
                        onSubmit={handleDisplayNameUpdate}
                        onCancel={() => setEditingDisplayName(false)}
                        submitLabel="Update"
                        showCancel={true}
                      />
                    ) : (
                      <p className="text-sm text-gray-600">
                        This is how other community members will see you in posts and comments.
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Actions</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Communities */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Communities</CardTitle>
                    <CardDescription>Communities you've joined ({joinedCommunities.length})</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCommunities ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-9 w-20" />
                      </div>
                    ))}
                  </div>
                ) : joinedCommunities.length > 0 ? (
                  <div className="space-y-4">
                    {joinedCommunities.map((membership) => (
                      <div
                        key={membership.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{membership.communities.name}</h4>
                            {membership.communities.region !== "Unknown" && (
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                                {membership.communities.region}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{membership.communities.area}</span>
                            </div>
                            <span>Joined {formatDate(membership.joined_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/community/${membership.community_slug}`}>Visit</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleLeaveCommunity(membership.community_slug, membership.communities.name)}
                            disabled={leavingCommunity === membership.community_slug}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            {leavingCommunity === membership.community_slug ? "Leaving..." : "Leave"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
                    <p className="text-gray-600 mb-4">
                      You haven't joined any communities yet. Find your community to get started!
                    </p>
                    <Button asChild className="bg-red-600 hover:bg-red-700">
                      <Link href="/">Find Communities</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/">Find Communities</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/terms">Terms of Service</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/privacy">Privacy Policy</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
