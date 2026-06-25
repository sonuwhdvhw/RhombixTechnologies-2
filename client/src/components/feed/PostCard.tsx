import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Share2 } from 'lucide-react';
import { Post, ReactionType } from '@/types';
import { postsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like',  emoji: '👍', label: 'Like'  },
  { type: 'love',  emoji: '❤️', label: 'Love'  },
  { type: 'haha',  emoji: '😂', label: 'Haha'  },
  { type: 'wow',   emoji: '😮', label: 'Wow'   },
  { type: 'sad',   emoji: '😢', label: 'Sad'   },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];
const R_EMOJI: Record<string, string> = {
  like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😠',
};

export default function PostCard({ post, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { user } = useAuthStore();
  const [liked, setLiked]       = useState(post.isLiked ?? false);
  const [reaction, setReaction] = useState<ReactionType | null>(post.userReaction ?? null);
  const [count, setCount]       = useState(post.likes_count);
  const [saved, setSaved]       = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const holdTimer  = useRef<ReturnType<typeof setTimeout>>();
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>();
  const isOwner = user?.id === post.user_id;

  const doLike = async (r: ReactionType = 'like') => {
    if (!user) { toast.error('Sign in to react'); return; }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    setShowReactions(false);
    const wasLiked = liked;
    const off = wasLiked && reaction === r;
    setLiked(!off);
    setReaction(off ? null : r);
    setCount(c => off ? Math.max(0, c - 1) : wasLiked ? c : c + 1);
    try { await postsApi.toggleLike(post.id, r); }
    catch {
      setLiked(wasLiked);
      setReaction(post.userReaction ?? null);
      setCount(post.likes_count);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      toast.success('Link copied!');
    } catch {}
  };

  return (
    <motion.article
      className="post-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <Link to={`/profile/${post.profiles?.username}`}
          className="flex items-center gap-3 group">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <div className="story-ring">
              <div className="story-ring-inner">
                <Avatar src={post.profiles?.avatar_url}
                  name={post.profiles?.full_name || post.profiles?.username}
                  size="sm" />
              </div>
            </div>
          </motion.div>
          <div>
            <p className="text-sm font-bold leading-tight transition-colors group-hover:text-[#a78bfa]"
              style={{ color: '#f0f0ff' }}>
              {post.profiles?.username}
            </p>
            <p className="text-[11px]" style={{ color: '#5c5c8a' }}>
              {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </Link>

        {/* More menu */}
        <div className="relative">
          <motion.button
            onClick={() => setShowMenu(v => !v)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: '#5c5c8a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#5c5c8a'; }}>
            <MoreHorizontal size={18} />
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'rgba(12,12,22,0.98)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                }}>
                {isOwner && (
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      if (!confirm('Delete this post?')) return;
                      try {
                        await postsApi.delete(post.id);
                        onDelete?.(post.id);
                        toast.success('Post deleted');
                      } catch { toast.error('Failed to delete'); }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all"
                    style={{ color: '#f87171', borderBottom: '1px solid rgba(139,92,246,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Trash2 size={14} /> Delete post
                  </button>
                )}
                <button
                  onClick={() => { handleShare(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all"
                  style={{ color: '#a8a8d0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f0f0ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#a8a8d0'; }}>
                  <Share2 size={14} /> Copy link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Media ── */}
      {post.image_url && (
        <div className="relative overflow-hidden" style={{ maxHeight: 560 }}>
          {!imgLoaded && (
            <div className="w-full skel" style={{ height: 320 }} />
          )}
          <motion.img
            src={post.image_url}
            alt="Post"
            className="w-full object-cover block"
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}
      {post.video_url && (
        <video src={post.video_url} controls
          className="w-full block"
          style={{ maxHeight: 500 }} />
      )}

      {/* ── Actions ── */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">

            {/* Like — hold for reactions */}
            <div className="relative">
              <motion.button
                onMouseDown={() => { holdTimer.current = setTimeout(() => setShowReactions(true), 500); }}
                onMouseUp={() => { clearTimeout(holdTimer.current); if (!showReactions) doLike(); }}
                onMouseLeave={() => clearTimeout(holdTimer.current)}
                onTouchStart={() => { holdTimer.current = setTimeout(() => setShowReactions(true), 500); }}
                onTouchEnd={() => { clearTimeout(holdTimer.current); if (!showReactions) doLike(); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                className="transition-all flex items-center justify-center"
                style={{ color: liked ? '#ec4899' : '#5c5c8a' }}
                aria-label={liked ? 'Unlike' : 'Like'}>
                {reaction && reaction !== 'like' ? (
                  <span className={cn('text-2xl', likeAnim && 'like-pop')}>{R_EMOJI[reaction]}</span>
                ) : (
                  <Heart size={24}
                    className={cn(likeAnim && 'like-pop', liked ? 'fill-current' : '')}
                    style={{ filter: liked ? 'drop-shadow(0 0 8px rgba(236,72,153,0.7))' : 'none' }} />
                )}
              </motion.button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: 12 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="reaction-bar"
                    onMouseLeave={() => { reactionTimer.current = setTimeout(() => setShowReactions(false), 500); }}
                    onMouseEnter={() => clearTimeout(reactionTimer.current)}>
                    {REACTIONS.map((r, i) => (
                      <motion.button
                        key={r.type}
                        className="reaction-btn"
                        onClick={() => doLike(r.type)}
                        title={r.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}>
                        {r.emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <Link to={`/posts/${post.id}`}
              className="transition-all flex items-center justify-center"
              style={{ color: '#5c5c8a' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5c5c8a'; }}>
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                <MessageCircle size={23} />
              </motion.div>
            </Link>

            {/* Share */}
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              className="transition-all"
              style={{ color: '#5c5c8a' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#06b6d4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5c5c8a'; }}>
              <Send size={21} />
            </motion.button>
          </div>

          {/* Bookmark */}
          <motion.button
            onClick={() => setSaved(v => !v)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            className="transition-all"
            style={{ color: saved ? '#a78bfa' : '#5c5c8a', filter: saved ? 'drop-shadow(0 0 6px rgba(167,139,250,0.6))' : 'none' }}>
            <Bookmark size={22} className={saved ? 'fill-current' : ''} />
          </motion.button>
        </div>

        {/* Likes count */}
        {count > 0 && (
          <motion.p
            key={count}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold mb-1.5"
            style={{
              color: '#f0f0ff',
              textShadow: liked ? '0 0 10px rgba(236,72,153,0.5)' : 'none',
            }}>
            {count.toLocaleString()} {count === 1 ? 'like' : 'likes'}
          </motion.p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm leading-relaxed mb-1" style={{ color: '#c0c0e0' }}>
            <Link to={`/profile/${post.profiles?.username}`}
              className="font-bold mr-1.5 hover:text-[#a78bfa] transition-colors"
              style={{ color: '#f0f0ff' }}>
              {post.profiles?.username}
            </Link>
            {post.content}
          </p>
        )}

        {/* Comments link */}
        {post.comments_count > 0 && (
          <Link to={`/posts/${post.id}`}
            className="text-sm block mt-1 hover:text-[#a78bfa] transition-colors"
            style={{ color: '#5c5c8a' }}>
            View all {post.comments_count} comments
          </Link>
        )}
      </div>
    </motion.article>
  );
}
