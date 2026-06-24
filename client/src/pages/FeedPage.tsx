import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowUp, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { postsApi } from '@/lib/api';
import { Post } from '@/types';
import PostCard from '@/components/feed/PostCard';
import StoriesBar from '@/components/feed/StoriesBar';
import DailyFeed from '@/components/feed/DailyFeed';
import toast from 'react-hot-toast';

function PostSkeleton() {
  return (
    <div className="post-card rounded-2xl mb-3 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="skel w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skel h-3 w-28" />
          <div className="skel h-2.5 w-20" />
        </div>
      </div>
      <div className="skel w-full rounded-xl mb-3" style={{ height: '280px' }} />
      <div className="space-y-2">
        <div className="skel h-3 w-24" />
        <div className="skel h-3 w-48" />
        <div className="skel h-2.5 w-16" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const { ref: bottomRef, inView } = useInView({ threshold: 0.1 });

  const loadPosts = useCallback(async (pg: number, reset = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await postsApi.getFeed(pg, 10);
      const fresh: Post[] = data.posts || [];
      if (reset || pg === 1) {
        setPosts(fresh);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...fresh.filter((p: Post) => !ids.has(p.id))];
        });
      }
      setHasMore(fresh.length === 10);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPosts(1); }, [loadPosts]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      setPage(prev => {
        const next = prev + 1;
        loadPosts(next);
        return next;
      });
    }
  }, [inView, hasMore, loadingMore, loading, loadPosts]);

  useEffect(() => {
    const ch = supabase.channel('feed-new')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        setNewCount(c => c + 1);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const refresh = () => { setPage(1); setNewCount(0); loadPosts(1, true); };

  return (
    <div className="feed-container mx-auto py-4 px-2 sm:px-0">

      {/* Stories */}
      <div className="g-card mb-3 overflow-hidden">
        <StoriesBar />
      </div>

      {/* Daily auto feed — trending news */}
      <div className="g-card mb-3 overflow-hidden">
        <DailyFeed />
      </div>

      {/* New posts pill */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={refresh}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl mb-3 text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#a78bfa',
            }}
          >
            <ArrowUp size={14} />
            {newCount} new {newCount === 1 ? 'post' : 'posts'} · Tap to refresh
          </motion.button>
        )}
      </AnimatePresence>

      {/* Posts header */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <Sparkles size={14} className="text-[#a78bfa]" />
        <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>Your Feed</span>
      </div>

      {/* Posts */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
      ) : posts.length === 0 ? (
        <div className="g-card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-white font-bold text-lg mb-2">Welcome to Connectify!</p>
          <p className="text-sm" style={{ color: '#6060a0' }}>
            Follow people or create your first post to fill your feed
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < 3 ? i * 0.08 : 0 }}
              className="mb-3"
            >
              <PostCard post={p} onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Infinite scroll */}
      <div ref={bottomRef} className="py-4">
        {loadingMore && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-[rgba(139,92,246,0.3)] border-t-[#8b5cf6] rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs py-2" style={{ color: '#6060a0' }}>
            All caught up ✓
          </p>
        )}
      </div>
    </div>
  );
}
