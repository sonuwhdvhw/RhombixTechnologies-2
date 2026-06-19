import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, X, Globe, Users, Lock, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { postsApi, uploadApi } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Privacy = 'public' | 'friends' | 'private';
const PRIVACY_OPTS: { v: Privacy; icon: React.ElementType; label: string }[] = [
  { v: 'public', icon: Globe, label: 'Everyone' },
  { v: 'friends', icon: Users, label: 'Friends' },
  { v: 'private', icon: Lock, label: 'Only me' },
];

interface Props { isOpen: boolean; onClose: () => void; onSuccess?: (p: object) => void; }

export default function CreatePostModal({ isOpen, onClose, onSuccess }: Props) {
  const { profile } = useAuthStore();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 2200;

  const pickFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]);
  }, []);

  const submit = async () => {
    if (!content.trim() && !file) { toast.error('Add a photo or write something'); return; }
    setLoading(true);
    try {
      let image_url: string | undefined;
      let video_url: string | undefined;
      if (file) {
        const { data } = await uploadApi.upload(file, 'media', 'posts');
        if (file.type.startsWith('video/')) video_url = data.url;
        else image_url = data.url;
      }
      const { data } = await postsApi.create({ content: content.trim(), image_url, video_url, privacy });
      onSuccess?.(data.post);
      toast.success('Post shared!');
      setContent(''); setFile(null); setPreview(null); onClose();
    } catch { toast.error('Failed to share'); }
    finally { setLoading(false); }
  };

  const PrivIcon = PRIVACY_OPTS.find(o => o.v === privacy)!.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[468px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: '#1c1c1c', border: '1px solid #363636' }}
            role="dialog" aria-modal="true" aria-label="Create post">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
              <button onClick={onClose} className="text-[#a8a8a8] hover:text-white transition-colors">
                <X size={20} />
              </button>
              <p className="text-sm font-semibold text-white">Create post</p>
              <button onClick={submit} disabled={loading || (!content.trim() && !file)}
                className="text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ color: '#0095f6' }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-[#0095f6]/30 border-t-[#0095f6] rounded-full animate-spin" />
                  : 'Share'}
              </button>
            </div>

            {/* Author + privacy */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="md" />
              <div>
                <p className="text-sm font-semibold text-white">{profile?.full_name || profile?.username}</p>
                <div className="relative">
                  <button onClick={() => setShowPrivacy(v => !v)}
                    className="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-xs font-semibold"
                    style={{ background: '#262626', color: '#a8a8a8' }}>
                    <PrivIcon size={10} />
                    {PRIVACY_OPTS.find(o => o.v === privacy)!.label}
                    <ChevronDown size={10} />
                  </button>
                  <AnimatePresence>
                    {showPrivacy && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        className="absolute left-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-20 shadow-xl"
                        style={{ background: '#262626', border: '1px solid #363636' }}>
                        {PRIVACY_OPTS.map(o => (
                          <button key={o.v} onClick={() => { setPrivacy(o.v); setShowPrivacy(false); }}
                            className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-[#363636]',
                              privacy === o.v ? 'text-white' : 'text-[#a8a8a8]')}>
                            <o.icon size={12} /> {o.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Text area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, MAX))}
              placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || profile?.username}?`}
              rows={preview ? 3 : 5}
              className="w-full px-4 pb-3 text-sm text-white placeholder-[#737373] resize-none outline-none leading-relaxed"
              style={{ background: 'transparent' }}
              aria-label="Post content"
            />

            {/* Image preview */}
            {preview && (
              <div className="relative mx-4 mb-3 rounded-xl overflow-hidden">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} className="w-full max-h-64 rounded-xl" controls />
                ) : (
                  <img src={preview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl" />
                )}
                <button onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Drop zone (when no preview) */}
            {!preview && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="mx-4 mb-3 border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                style={{ borderColor: dragging ? '#0095f6' : '#363636', background: dragging ? 'rgba(0,149,246,0.05)' : 'transparent' }}>
                <Image size={28} className="text-[#737373]" />
                <p className="text-sm text-[#737373]">Add photo/video</p>
                <p className="text-xs text-[#525252]">or drag and drop</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626]">
              <div className="flex items-center gap-3">
                <button onClick={() => fileRef.current?.click()}
                  className="text-[#737373] hover:text-white transition-colors" aria-label="Add media">
                  <Image size={22} />
                </button>
              </div>
              <span className={cn('text-xs', content.length > MAX * 0.9 ? 'text-[#ff3040]' : 'text-[#737373]')}>
                {MAX - content.length}
              </span>
            </div>

            <input ref={fileRef} type="file" accept="image/*,video/mp4" className="hidden"
              onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])}
              aria-label="Upload media file" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
