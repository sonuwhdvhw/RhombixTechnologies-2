import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { Post, ReactionType } from '@/types';
import { postsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😠' },
];
const R_EMOJI: Record<string, string> = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😠' };

export default function PostCard({ post, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [reaction, setReaction] = useState<ReactionType | null>(post.userReaction ?? null);
  const [count, setCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>();
  const isOwner = user?.id === post.user_id;

  const doLike = async (r: ReactionType = 'like') => {
    if (!user) { toast.error('Sign in to react'); return; }
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 350);
    setShowReactions(false);
    const wasLiked = liked;
    const off = wasLiked && reaction === r;
    setLiked(!off); setReaction(off ? null : r);
    setCount(c => off ? Math.max(0, c - 1) : wasLiked ? c : c + 1);
    try { await postsApi.toggleLike(post.id, r); }
    catch { setLiked(wasLiked); setReaction(post.userReaction ?? null); setCount(post.likes_count); }
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`); toast.success('Link copied!'); }
    catch {}
  };

  return (
    <article className="post-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.profiles?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="story-ring">
            <div className="story-ring-inner">
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name || post.profiles?.username} size="sm" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{post.profiles?.username}</p>
            <p className="text-[11px]" style={{ color: '#6060a0' }}>{formatRelativeTime(post.created_at)}</p>
          </div>
        </Link>

        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: '#6060a0' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6060a0'; }}>
            <MoreHorizontal size={18} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-44 rounded-xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'rgba(20,20,40,0.97)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
                {isOwner && (
                  <button onClick={async () => { setShowMenu(false); if (!confirm('Delete?')) return; try { await postsApi.delete(post.id); onDelete?.(post.id); toast.success('Deleted'); } catch { toast.error('Failed'); } }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button onClick={() => { handleShare(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Send size={14} /> Copy link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="overflow-hidden" style={{ maxHeight: 540 }}>
          <img src={post.image_url} alt="Post" className="w-full object-cover block" loading="lazy" />
        </div>
      )}
      {post.video_url && (
        <video src={post.video_url} controls className="w-full block" style={{ maxHeight: 500 }} />
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            {/* Like / hold for reactions */}
            <div className="relative">
              <motion.button
                onMouseDown={() => { holdTimer.current = setTimeout(() => setShowReactions(true), 500); }}
                onMouseUp={() => { clearTimeout(holdTimer.current); if (!showReactions) doLike(); }}
                onMouseLeave={() => clearTimeout(holdTimer.current)}
                onTouchStart={() => { holdTimer.current = setTimeout(() => setShowReactions(true), 500); }}
                onTouchEnd={() => { clearTimeout(holdTimer.current); if (!showReactions) doLike(); }}
                className="transition-all"
                style={{ color: liked ? '#ec4899' : '#6060a0' }}
                aria-label={liked ? 'Unlike' : 'Like'}>
                {reaction && reaction !== 'like'
                  ? <span className={cn('text-2xl', likeAnim && 'like-pop')}>{R_EMOJI[reaction]}</span>
                  : <Heart size={24} className={cn(likeAnim && 'like-pop', liked ? 'fill-current' : '')}
                      style={liked ? { filter: 'drop-shadow(0 0 6px #ec4899)' } : {}} />
                }
              </motion.button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 10 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="reaction-bar"
                    onMouseLeave={() => { reactionTimer.current = setTimeout(() => setShowReactions(false), 400); }}
                    onMouseEnter={() => clearTimeout(reactionTimer.current)}>
                    {REACTIONS.map(r => (
                      <button key={r.type} className="reaction-btn" onClick={() => doLike(r.type)} title={r.type}>
                        {r.emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to={`/posts/${post.id}`} className="transition-all"
              style={{ color: '#6060a0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6060a0'; }}>
              <MessageCircle size={22} />
            </Link>

            <button onClick={handleShare} className="transition-all" style={{ color: '#6060a0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#06b6d4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6060a0'; }}>
              <Send size={20} />
            </button>
          </div>

          <button onClick={() => setSaved(v => !v)} className="transition-all"
            style={{ color: saved ? '#a78bfa' : '#6060a0' }}>
            <Bookmark size={21} className={saved ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Likes */}
        {count > 0 && (
          <p className="text-sm font-bold text-white mb-1"
            style={{ textShadow: liked ? '0 0 8px rgba(236,72,153,0.4)' : 'none' }}>
            {count.toLocaleString()} {count === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm leading-relaxed mb-1" style={{ color: '#c0c0e0' }}>
            <Link to={`/profile/${post.profiles?.username}`}
              className="font-bold text-white mr-1.5 hover:opacity-80">
              {post.profiles?.username}
            </Link>
            {post.content}
          </p>
        )}

        {/* Comments link */}
        {post.comments_count > 0 && (
          <Link to={`/posts/${post.id}`} className="text-sm block mb-1 hover:opacity-80"
            style={{ color: '#6060a0' }}>
            View all {post.comments_count} comments
          </Link>
        )}
      </div>
    </article>
  );
}
