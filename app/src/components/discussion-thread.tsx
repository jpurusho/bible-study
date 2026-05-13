'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MessageSquare, Reply, Trash2, Send } from 'lucide-react'

interface Profile {
  display_name: string | null
  avatar_url: string | null
}

interface DiscussionPost {
  id: string
  session_id: string | null
  chapter_id: string | null
  user_id: string
  parent_id: string | null
  content: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  profiles: Profile
}

interface ThreadedPost extends DiscussionPost {
  replies: DiscussionPost[]
}

interface DiscussionThreadProps {
  sessionId: string
  userId: string
  userRole: 'user' | 'admin'
}

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

export function DiscussionThread({ sessionId, userId, userRole }: DiscussionThreadProps) {
  const [posts, setPosts] = useState<ThreadedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('discussion_posts')
      .select('*, profiles(display_name, avatar_url)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Failed to load comments')
      return
    }

    const allPosts = (data ?? []) as unknown as DiscussionPost[]

    // Organize into threads
    const topLevel: ThreadedPost[] = []
    const repliesMap = new Map<string, DiscussionPost[]>()

    for (const post of allPosts) {
      if (post.parent_id === null) {
        topLevel.push({ ...post, replies: [] })
      } else {
        const existing = repliesMap.get(post.parent_id) ?? []
        existing.push(post)
        repliesMap.set(post.parent_id, existing)
      }
    }

    for (const thread of topLevel) {
      thread.replies = repliesMap.get(thread.id) ?? []
    }

    setPosts(topLevel)
    setLoading(false)
  }, [sessionId, supabase])

  useEffect(() => {
    void fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  async function handleSubmitComment() {
    const trimmed = newComment.trim()
    if (!trimmed) return

    setSubmitting(true)

    const { error } = await supabase.from('discussion_posts').insert({
      user_id: userId,
      session_id: sessionId,
      content: trimmed,
    })

    if (error) {
      toast.error('Failed to post comment')
    } else {
      setNewComment('')
      toast.success('Comment posted')
      await fetchPosts()
    }

    setSubmitting(false)
  }

  async function handleSubmitReply(parentId: string) {
    const trimmed = replyContent.trim()
    if (!trimmed) return

    setReplySubmitting(true)

    const { error } = await supabase.from('discussion_posts').insert({
      user_id: userId,
      session_id: sessionId,
      parent_id: parentId,
      content: trimmed,
    })

    if (error) {
      toast.error('Failed to post reply')
    } else {
      setReplyContent('')
      setReplyingTo(null)
      toast.success('Reply posted')
      await fetchPosts()
    }

    setReplySubmitting(false)
  }

  async function handleDelete(postId: string) {
    const { error } = await supabase
      .from('discussion_posts')
      .update({ is_deleted: true })
      .eq('id', postId)

    if (error) {
      toast.error('Failed to delete comment')
    } else {
      toast.success('Comment removed')
      await fetchPosts()
    }
  }

  function renderPost(post: DiscussionPost, isReply = false) {
    const profile = post.profiles
    const displayName = profile?.display_name ?? 'Unknown'
    const avatarUrl = profile?.avatar_url ?? undefined

    return (
      <div
        key={post.id}
        className={cn(
          'flex gap-3 py-3',
          isReply && 'ml-8 border-l-2 border-muted pl-4'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{displayName}</span>
            <span className="text-muted-foreground text-xs">
              {getRelativeTime(post.created_at)}
            </span>
          </div>

          {post.is_deleted ? (
            <p className="text-sm text-muted-foreground italic mt-1">
              [This comment has been removed]
            </p>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {!post.is_deleted && (
            <div className="flex items-center gap-2 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() =>
                    setReplyingTo(replyingTo === post.id ? null : post.id)
                  }
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {userRole === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="h-4 w-4 mr-2 animate-pulse" />
        Loading discussion...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Discussion
        {posts.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({posts.length} {posts.length === 1 ? 'comment' : 'comments'})
          </span>
        )}
      </h3>

      {/* New comment form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No comments yet. Be the first to start the discussion!
        </p>
      ) : (
        <div className="divide-y">
          {posts.map((thread) => (
            <div key={thread.id}>
              {renderPost(thread)}

              {/* Replies */}
              {thread.replies.map((reply) => renderPost(reply, true))}

              {/* Reply form */}
              {replyingTo === thread.id && (
                <div className="ml-8 border-l-2 border-muted pl-4 pb-3 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleSubmitReply(thread.id)}
                      disabled={!replyContent.trim() || replySubmitting}
                      size="sm"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {replySubmitting ? 'Posting...' : 'Reply'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
