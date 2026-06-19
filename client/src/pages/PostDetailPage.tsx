import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Trash2, ChevronDown } from 'lucide-react';
import { postsApi, commentsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Post, Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import PostCard from '@/components/feed/PostCard';
import Avatar from '@/components/ui/Avatar';
import { PostCardSkeleton, Skeleton } from '@/components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

function CommentItem({
  comment,
  postId,
  onDelete,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  postId: string;
  onDelete: (id: string) => void;
  onReply: (id: string, username: string) => void;
  depth?: number;
}) {
  const { user } = useAuthStore();
  const [showReplies, setShowReplies] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', depth > 0 && 'ml-10 pl-4 border-l border-white/6')}
    >
      <Link to={`/profile/${comment.profiles?.username}`} className="shrink-0 mt-0.5">
        <Avatar
          src={comment.profiles?.avatar_url}
          name={comment.profiles?.full_name || comment.profiles?.username}
          size="sm"
        />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="inline-block max-w-full bg-white/4 rounded-2xl rounded-tl-sm px-4 py-2.5">
          <Link to={`/profile/${comment.profiles?.username}`}>
            <span className="text-xs font-semibold text-white hover:text-indigo-400 transition-colors">
              {comment.profiles?.full_name || comment.profiles?.username}
            </span>
          </Link>
          <p className="text-sm text-slate-300 mt-0.5 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[11px] text-slate-600">{formatRelativeTime(comment.created_at)}</span>
          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id, comment.profiles?.username || '')}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-400 transition-colors"
            >
              Reply
            </button>
          )}
          {user?.id === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-[11px] text-slate-600 hover:text-red-400 transition-colors"
              aria-label="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-2"
            >
              <ChevronDown className={cn('w-3 h-3 transition-transform', showReplies && 'rotate-180')} />
              {showReplies ? 'Hide' : `View ${comment.replies.length}`} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      onDelete={onDelete}
                      onReply={onReply}
                      depth={depth + 1}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [postLoading, setPostLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;

    // Load post
    postsApi.getById(id)
      .then(({ data }) => setPost(data.post))
      .catch(() => toast.error('Post not found'))
      .finally(() => setPostLoading(false));

    // Load comments
    commentsApi.getByPost(id)
      .then(({ data }) => setComments(data.comments || []))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  // Real-time comment updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`post-comments:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${id}`,
      }, (payload) => {
        const newC = payload.new as Comment;
        // Only add if not already in list and not a reply (parent_id = null)
        if (!newC.parent_id) {
          setComments((prev) => {
            if (prev.find((c) => c.id === newC.id)) return prev;
            return [...prev, newC];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    setSubmitting(true);

    try {
      const { data } = await commentsApi.create(id, {
        content: newComment.trim(),
        parent_id: replyTo?.id,
      });
      const comment = data.comment as Comment;

      if (replyTo) {
        // Add reply to parent
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          )
        );
      } else {
        setComments((prev) => [...prev, comment]);
      }

      // Update count on post
      setPost((prev) => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
      setNewComment('');
      setReplyTo(null);
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!id) return;
    try {
      await commentsApi.delete(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      {/* Post */}
      {postLoading ? (
        <PostCardSkeleton />
      ) : post ? (
        <PostCard post={post} onDelete={() => window.history.back()} />
      ) : (
        <div className="glass-card p-10 text-center text-slate-500">Post not found</div>
      )}

      {/* Comments Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Comments{post ? ` · ${post.comments_count}` : ''}
          </h2>
        </div>

        {/* Comment list */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {commentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm text-slate-500">No comments yet. Be the first!</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={id!}
                  onDelete={handleDelete}
                  onReply={handleReply}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Comment input */}
        {user && (
          <div className="px-5 py-4 border-t border-white/6">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-xs text-slate-500">
                  Replying to <span className="text-indigo-400">@{replyTo.username}</span>
                </span>
                <button
                  onClick={() => { setReplyTo(null); setNewComment(''); }}
                  className="text-xs text-slate-600 hover:text-slate-400 ml-auto"
                >
                  Cancel
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name || profile?.username}
                size="sm"
              />
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="input-field pr-10 text-sm"
                  aria-label="Write a comment"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors"
                  aria-label="Post comment"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
