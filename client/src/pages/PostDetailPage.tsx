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

function CommentItem({ comment, postId, onDelete, onReply, depth = 0 }: {
  comment: Comment; postId: string; onDelete: (id: string) => void;
  onReply: (id: string, u: string) => void; depth?: number;
}) {
  const { user } = useAuthStore();
  const [showReplies, setShowReplies] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', depth > 0 && 'ml-10 pl-4')}
      style={depth > 0 ? { borderLeft: '2px solid rgba(124,58,237,0.12)' } : {}}>
      <Link to={`/profile/${comment.profiles?.username}`} className="shrink-0 mt-0.5">
        <Avatar src={comment.profiles?.avatar_url} name={comment.profiles?.username} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-full px-4 py-2.5 rounded-2xl rounded-tl-sm"
          style={{ background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.08)' }}>
          <Link to={`/profile/${comment.profiles?.username}`}>
            <span className="text-xs font-bold hover:opacity-70" style={{ color: '#7c3aed' }}>{comment.profiles?.full_name || comment.profiles?.username}</span>
          </Link>
          <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#0f0820' }}>{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[11px]" style={{ color: '#9585c5' }}>{formatRelativeTime(comment.created_at)}</span>
          {depth === 0 && (
            <button onClick={() => onReply(comment.id, comment.profiles?.username || '')}
              className="text-[11px] font-bold transition-opacity hover:opacity-70" style={{ color: '#7c3aed' }}>Reply</button>
          )}
          {user?.id === comment.user_id && (
            <button onClick={() => onDelete(comment.id)} className="text-[11px] transition-colors hover:text-red-400" style={{ color: '#9585c5' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowReplies(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold mb-2 transition-opacity hover:opacity-70" style={{ color: '#7c3aed' }}>
              <ChevronDown size={12} className={cn('transition-transform', showReplies && 'rotate-180')} />
              {showReplies ? 'Hide' : `View ${comment.replies.length}`} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            {showReplies && (
              <div className="space-y-3">
                {comment.replies.map(r => (
                  <CommentItem key={r.id} comment={r} postId={postId} onDelete={onDelete} onReply={onReply} depth={depth + 1} />
                ))}
              </div>
            )}
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
    postsApi.getById(id).then(({ data }) => setPost(data.post)).catch(() => {}).finally(() => setPostLoading(false));
    commentsApi.getByPost(id).then(({ data }) => setComments(data.comments || [])).finally(() => setCommentsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`comments:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, (payload) => {
        const c = payload.new as Comment;
        if (!c.parent_id) setComments(p => p.find(x => x.id === c.id) ? p : [...p, c]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    setSubmitting(true);
    try {
      const { data } = await commentsApi.create(id, { content: newComment.trim(), parent_id: replyTo?.id });
      const c = data.comment as Comment;
      if (replyTo) {
        setComments(p => p.map(x => x.id === replyTo.id ? { ...x, replies: [...(x.replies || []), c] } : x));
      } else {
        setComments(p => [...p, c]);
      }
      setPost(p => p ? { ...p, comments_count: p.comments_count + 1 } : p);
      setNewComment(''); setReplyTo(null);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId: string) => {
    if (!id) return;
    await commentsApi.delete(id, commentId);
    setComments(p => p.filter(c => c.id !== commentId));
    setPost(p => p ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p);
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-[614px] mx-auto px-2 sm:px-0 py-4 space-y-4">
      <Link to="/feed" className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 px-2"
        style={{ color: '#7c3aed' }}>
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {postLoading ? (
        <div className="g-card p-4 space-y-4">
          <div className="flex items-center gap-3"><div className="skel w-10 h-10 rounded-full" /><div className="flex-1 space-y-2"><div className="skel h-3 w-28" /><div className="skel h-2.5 w-20" /></div></div>
          <div className="skel h-64 rounded-xl" />
        </div>
      ) : post ? (
        <PostCard post={post} onDelete={() => window.history.back()} />
      ) : (
        <div className="g-card p-10 text-center" style={{ color: '#9585c5' }}>Post not found</div>
      )}

      {/* Comments */}
      <div className="g-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
          <h2 className="text-sm font-bold" style={{ color: '#0f0820' }}>
            Comments {post ? `· ${post.comments_count}` : ''}
          </h2>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {commentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3"><div className="skel w-8 h-8 rounded-full shrink-0" /><div className="skel h-14 flex-1 rounded-2xl" /></div>
            ))
          ) : comments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm" style={{ color: '#9585c5' }}>No comments yet. Be the first!</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} postId={id!} onDelete={handleDelete} onReply={handleReply} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {user && (
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(124,58,237,0.08)' }}>
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-xs" style={{ color: '#9585c5' }}>
                  Replying to <span style={{ color: '#7c3aed' }}>@{replyTo.username}</span>
                </span>
                <button onClick={() => { setReplyTo(null); setNewComment(''); }}
                  className="text-xs ml-auto transition-opacity hover:opacity-70" style={{ color: '#9585c5' }}>Cancel</button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
              <div className="flex-1 relative">
                <input ref={inputRef} type="text" placeholder="Write a comment..." value={newComment}
                  onChange={e => setNewComment(e.target.value)} className="c-input pr-10"
                  maxLength={500} aria-label="Comment" />
                <button type="submit" disabled={!newComment.trim() || submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-30 transition-colors"
                  style={{ color: '#7c3aed' }}>
                  {submitting ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
                    : <Send size={15} />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
