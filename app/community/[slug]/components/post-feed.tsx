"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, LogIn, Trash2, MoreHorizontal } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { VoteButtons } from "@/app/components/vote-buttons"
import { PostTabs } from "./post-tabs"
import { getUserDisplayName } from "@/lib/display-name"

interface Comment {
  id: string
  post_id: string
  author: string
  body: string
  created_at: string
  user_id?: string
  vote_count?: number
  user_vote?: "up" | "down" | null
}

interface Post {
  id: string
  community_slug: string
  author: string
  title: string
  body: string
  tag: string
  created_at: string
  comments?: Comment[]
  user_id?: string
  vote_count?: number
  user_vote?: "up" | "down" | null
}

interface PostFeedProps {
  posts: Post[]
  communitySlug: string
  onPostCreated: (post: Post) => void
  onCommentAdded: (postId: string, comment: Comment) => void
  onPostDeleted: (postId: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

function PostCard({
  post,
  onCommentAdded,
  onPostDeleted,
}: {
  post: Post
  onCommentAdded: (postId: string, comment: Comment) => void
  onPostDeleted: (postId: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentBody, setCommentBody] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      Announcement: "bg-blue-100 text-blue-800",
      "Buy/Sell": "bg-green-100 text-green-800",
      "Lost & Found": "bg-red-100 text-red-800",
      General: "bg-gray-100 text-gray-800",
      RenoTalk: "bg-orange-100 text-orange-800",
      "Fur Kids": "bg-purple-100 text-purple-800",
      Sports: "bg-indigo-100 text-indigo-800",
      "Events/Parties": "bg-pink-100 text-pink-800",
    }
    return colors[tag] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "recently"
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim() || !user) return

    try {
      setSubmittingComment(true)

      // Get user display name from user_profiles table
      let displayName = await getUserDisplayName(user.id)

      // If no display name exists, this shouldn't happen due to first login modal
      // but we'll handle it as a fallback
      if (!displayName) {
        displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: post.id,
          author: displayName,
          body: commentBody,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add comment: ${error.message}`)
      }

      // Add vote data to new comment
      const commentWithVotes = {
        ...data,
        vote_count: 0,
        user_vote: null as "up" | "down" | null,
      }

      onCommentAdded(post.id, commentWithVotes)
      setCommentBody("")
    } catch (err) {
      console.error("Error adding comment:", err)
      toast({
        title: "Comment failed",
        description: "We couldn't add your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    // Show confirmation dialog
    const confirmed = window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")
    if (!confirmed) return

    try {
      setDeletingCommentId(commentId)

      // Delete comment from database
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id) // Security: only allow users to delete their own comments

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`)
      }

      // Update local state by removing the deleted comment
      const updatedComments = (post.comments || []).filter((comment) => comment.id !== commentId)

      // We need to update the parent component's state
      // For now, we'll trigger a page refresh to show the updated comments
      window.location.reload()

      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully removed.",
      })
    } catch (err) {
      console.error("Error deleting comment:", err)
      toast({
        title: "Delete failed",
        description: "We couldn't delete your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleDeletePost = async () => {
    if (!user) return

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.",
    )
    if (!confirmed) return

    try {
      setDeletingPost(true)

      // First delete all comments associated with the post
      const { error: commentsError } = await supabase.from("comments").delete().eq("post_id", post.id)

      if (commentsError) {
        console.warn("Error deleting comments:", commentsError)
        // Continue with post deletion even if comment deletion fails
      }

      // Delete the post from database
      const { error: postError } = await supabase.from("posts").delete().eq("id", post.id).eq("user_id", user.id) // Security: only allow users to delete their own posts

      if (postError) {
        throw new Error(`Failed to delete post: ${postError.message}`)
      }

      // Update parent component state
      onPostDeleted(post.id)

      toast({
        title: "Post deleted",
        description: "Your post and all its comments have been successfully removed.",
      })
    } catch (err) {
      console.error("Error deleting post:", err)
      toast({
        title: "Delete failed",
        description: "We couldn't delete your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingPost(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-red-100 text-red-800">
                {post.author.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{post.author}</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-500 text-xs">{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Post options menu - only show for post author */}
          {user && post.user_id === user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  disabled={deletingPost}
                >
                  {deletingPost ? (
                    <span className="animate-spin text-sm">⟳</span>
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleDeletePost}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  disabled={deletingPost}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mt-2">{post.title}</h3>

        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className={`text-xs ${getTagColor(post.tag)}`}>
            {post.tag}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-700 mb-4 whitespace-pre-line">{post.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex items-center gap-1"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments?.length || 0} comments
            </Button>
          </div>

          {/* Post voting buttons */}
          <VoteButtons
            itemId={post.id}
            itemType="post"
            initialVoteCount={post.vote_count}
            initialUserVote={post.user_vote}
          />
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* Comments list */}
            <div className="space-y-4 mb-4">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {comment.author.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
                        {/* Delete button - only show for comment author */}
                        {user && comment.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto text-gray-400 hover:text-red-600"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            title="Delete comment"
                          >
                            {deletingCommentId === comment.id ? (
                              <span className="animate-spin text-xs">⟳</span>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{comment.body}</p>

                      {/* Comment voting buttons */}
                      <VoteButtons
                        itemId={comment.id}
                        itemType="comment"
                        initialVoteCount={comment.vote_count}
                        initialUserVote={comment.user_vote}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No comments yet. Be the first to comment!</p>
              )}
            </div>

            {/* Add comment form */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  className="min-h-[60px] flex-1"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="self-end"
                  disabled={!commentBody.trim() || submittingComment}
                >
                  {submittingComment ? <span className="animate-pulse">...</span> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-sm text-gray-600 mb-2">Login to participate in the discussion</p>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to comment
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PostFeed({
  posts = [],
  communitySlug,
  onPostCreated,
  onCommentAdded,
  onPostDeleted,
  activeTab,
  onTabChange,
}: PostFeedProps) {
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostBody, setNewPostBody] = useState("")
  const [newPostTag, setNewPostTag] = useState("General")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Filter posts based on active tab - now safe with default empty array
  const filteredPosts = activeTab === "All" ? posts : posts.filter((post) => post.tag === activeTab)

  // Calculate post counts for each tag
  const postCounts = posts.reduce(
    (counts, post) => {
      counts[post.tag] = (counts[post.tag] || 0) + 1
      counts.total = (counts.total || 0) + 1
      return counts
    },
    {} as Record<string, number>,
  )

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostBody.trim() || !user) return

    try {
      setSubmitting(true)

      // Get user display name from user_profiles table
      let displayName = await getUserDisplayName(user.id)

      // If no display name exists, this shouldn't happen due to first login modal
      // but we'll handle it as a fallback
      if (!displayName) {
        displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          community_slug: communitySlug,
          author: displayName,
          title: newPostTitle,
          body: newPostBody,
          tag: newPostTag,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create post: ${error.message}`)
      }

      // Add empty comments array and vote data to match our Post interface
      const newPost = {
        ...data,
        comments: [],
        vote_count: 0,
        user_vote: null as "up" | "down" | null,
      }

      onPostCreated(newPost)
      setNewPostTitle("")
      setNewPostBody("")
      setNewPostTag("General")
      setIsDialogOpen(false)

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      })
    } catch (err) {
      console.error("Error creating post:", err)
      toast({
        title: "Post creation failed",
        description: "We couldn't create your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Community Feed</h2>
        {user ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">New Post</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a New Post</DialogTitle>
                <DialogDescription>
                  Share something with your community. Be respectful and follow community guidelines.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePost}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="title"
                      placeholder="Post title"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="body" className="text-sm font-medium">
                      Content
                    </label>
                    <Textarea
                      id="body"
                      placeholder="Write your post here..."
                      className="min-h-[100px]"
                      value={newPostBody}
                      onChange={(e) => setNewPostBody(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="tag" className="text-sm font-medium">
                      Tag
                    </label>
                    <Select value={newPostTag} onValueChange={setNewPostTag}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Announcement">Announcement</SelectItem>
                        <SelectItem value="Buy/Sell">Buy/Sell</SelectItem>
                        <SelectItem value="Lost & Found">Lost & Found</SelectItem>
                        <SelectItem value="RenoTalk">RenoTalk</SelectItem>
                        <SelectItem value="Fur Kids">Fur Kids</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Events/Parties">Events/Parties</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={submitting || !newPostTitle.trim() || !newPostBody.trim()}
                  >
                    {submitting ? "Posting..." : "Post"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Login to post
            </Link>
          </Button>
        )}
      </div>

      <PostTabs activeTab={activeTab} onTabChange={onTabChange} postCounts={postCounts} />

      <div>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onCommentAdded={onCommentAdded} onPostDeleted={onPostDeleted} />
          ))
        ) : posts.length > 0 ? (
          // Show message when no posts match the filter
          <Card className="p-6 text-center">
            <p className="text-gray-500 mb-4">No posts under this category yet. Start the conversation!</p>
            {user ? (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsDialogOpen(true)}>
                Create the First Post
              </Button>
            ) : (
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login to create the first post
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          // Show message when no posts exist at all
          <Card className="p-6 text-center">
            <p className="text-gray-500 mb-4">No posts yet in this community.</p>
            {user ? (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsDialogOpen(true)}>
                Create the First Post
              </Button>
            ) : (
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login to create the first post
                </Link>
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
