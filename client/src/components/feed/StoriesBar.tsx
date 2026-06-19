import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { storiesApi } from '@/lib/api';
import { StoryGroup } from '@/types';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';

export default function StoriesBar() {
  const { profile } = useAuthStore();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ group: StoryGroup; idx: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    storiesApi.getAll().then(({ data }) => setGroups(data.storyGroups || [])).finally(() => setLoading(false));
  }, []);

  const startProgress = () => {
    clearInterval(timer.current); setProgress(0);
    timer.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { nextStory(); return 0; } return p + 2; });
    }, 100);
  };

  const openStory = (group: StoryGroup) => {
    setActive({ group, idx: 0 }); startProgress();
    storiesApi.view(group.stories[0]?.id).catch(() => {});
  };

  const closeStory = () => { setActive(null); setProgress(0); clearInterval(timer.current); };

  const nextStory = () => {
    setActive(prev => {
      if (!prev) return null;
      if (prev.idx + 1 >= prev.group.stories.length) { closeStory(); return null; }
      storiesApi.view(prev.group.stories[prev.idx + 1].id).catch(() => {});
      startProgress();
      return { ...prev, idx: prev.idx + 1 };
    });
  };

  const prevStory = () => {
    setActive(prev => { if (!prev || prev.idx === 0) return prev; startProgress(); return { ...prev, idx: prev.idx - 1 }; });
  };

  useEffect(() => () => clearInterval(timer.current), []);

  if (loading) return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="skel w-14 h-14 rounded-full" />
          <div className="skel w-10 h-2" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Add story */}
        <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
          <div className="relative">
            <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="lg" />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '2px solid #08080f' }}>
              <Plus size={10} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <p className="text-[11px] w-14 text-center truncate" style={{ color: '#6060a0' }}>Your story</p>
        </motion.div>

        {groups.map((g, i) => (
          <motion.div key={g.user.id}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
            onClick={() => openStory(g)}>
            <div className={g.hasUnviewed ? 'story-ring' : 'story-ring-seen'}>
              <div className="story-ring-inner">
                <Avatar src={g.user.avatar_url} name={g.user.full_name || g.user.username} size="lg" />
              </div>
            </div>
            <p className="text-[11px] w-14 text-center truncate"
              style={{ color: g.hasUnviewed ? '#fff' : '#6060a0' }}>
              {g.user.username}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}>
            <div className="relative w-full max-w-[380px] rounded-2xl overflow-hidden"
              style={{ height: '85vh', background: '#0d0d1a', border: '1px solid rgba(139,92,246,0.2)' }}>

              {/* Progress */}
              <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                {active.group.stories.map((_, i) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-full rounded-full transition-none"
                      style={{
                        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                        width: i < active.idx ? '100%' : i === active.idx ? `${progress}%` : '0%',
                      }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-5 left-0 right-0 z-10 flex items-center justify-between px-3">
                <Link to={`/profile/${active.group.user.username}`} className="flex items-center gap-2">
                  <Avatar src={active.group.user.avatar_url} name={active.group.user.username} size="sm" />
                  <span className="text-sm font-bold text-white">{active.group.user.username}</span>
                </Link>
                <button onClick={closeStory} className="w-8 h-8 flex items-center justify-center rounded-full text-white"
                  style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Media */}
              <img src={active.group.stories[active.idx]?.media_url} alt="Story"
                className="w-full h-full object-cover" />

              {/* Overlay gradient */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)' }} />

              {/* Caption */}
              {active.group.stories[active.idx]?.caption && (
                <div className="absolute bottom-6 left-4 right-4 z-10 text-center">
                  <p className="text-white text-sm px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                    {active.group.stories[active.idx].caption}
                  </p>
                </div>
              )}

              {/* Tap areas */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer flex items-center pl-2" onClick={prevStory}>
                {active.idx > 0 && <ChevronLeft className="text-white/50" size={20} />}
              </div>
              <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer flex items-center justify-end pr-2" onClick={nextStory}>
                <ChevronRight className="text-white/50" size={20} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
