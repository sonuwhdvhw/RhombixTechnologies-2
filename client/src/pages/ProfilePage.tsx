import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Film, Lock, Camera, Link as LinkIcon, MapPin, Settings } from 'lucide-react';
import { profilesApi, postsApi, friendshipsApi, uploadApi } from '@/lib/api';
import { Profile, Post, Friendship } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'posts' | 'reels' | 'about';

function PostGrid({ posts, loading }: { posts: Post[]; loading: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="skel aspect-square" />
      ))}
    </div>
  );
  if (posts.length === 0) return (
    <div className="py-16 text-center">
      <Camera className="w-12 h-12 text-[#737373] mx-auto mb-3" />
      <p className="text-white font-semibold mb-1">No posts yet</p>
      <p className="text-[#737373] text-sm">When you share photos, they'll appear here.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map(p => (
        <div key={p.id} className="aspect-square relative overflow-hidden cursor-pointer group">
          {p.image_url ? (
            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1c1c1c] flex items-center justify-center">
              <p className="text-[#737373] text-xs px-2 text-center line-clamp-3">{p.content}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <span className="text-white text-sm font-semibold">❤️ {p.likes_count}</span>
            <span className="text-white text-sm font-semibold">💬 {p.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: me, setProfile: setMe } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendship, setFriendship] = useState<Partial<Friendship> | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', website: '', location: '' });
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    profilesApi.getByUsername(username)
      .then(({ data }) => {
        setProfile(data.profile);
        setFriendship(data.friendshipStatus);
        setEditForm({
          full_name: data.profile.full_name || '',
          bio: data.profile.bio || '',
          website: data.profile.website || '',
          location: data.profile.location || '',
        });
      })
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    postsApi.getUserPosts(profile.id)
      .then(({ data }) => setPosts(data.posts || []))
      .finally(() => setPostsLoading(false));
  }, [profile?.id]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (!friendship) {
        const { data } = await friendshipsApi.sendRequest(profile.id);
        setFriendship(data.friendship);
        toast.success('Friend request sent!');
      } else if (friendship.status === 'accepted') {
        await friendshipsApi.remove(friendship.id!);
        setFriendship(null);
        toast.success('Unfollowed');
      }
    } catch { toast.error('Action failed'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await profilesApi.update(editForm);
      setProfile(data.profile);
      if (isOwner) setMe(data.profile);
      toast.success('Profile updated!');
      setEditOpen(false);
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { data } = await uploadApi.upload(f, 'media', 'avatars');
      await profilesApi.update({ avatar_url: data.url });
      setProfile(p => p ? { ...p, avatar_url: data.url } : p);
      // Safe update — fetch latest me from store at call time
      if (isOwner && me) setMe({ ...me, avatar_url: data.url });
      toast.success('Photo updated!');
    } catch { toast.error('Failed to update photo'); }
  };

  /* ── Follow button label ── */
  const btnLabel = !friendship ? 'Follow'
    : friendship.status === 'pending' ? 'Requested'
    : friendship.status === 'accepted' ? 'Following'
    : 'Follow';

  const btnStyle = friendship?.status === 'accepted'
    ? { background: '#262626', color: '#fff' }
    : friendship?.status === 'pending'
    ? { background: '#262626', color: '#a8a8a8' }
    : { background: '#0095f6', color: '#fff' };

  if (loading) {
    return (
      <div className="max-w-[614px] mx-auto px-4 pt-8">
        <div className="flex items-center gap-8 mb-6">
          <div className="skel w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skel h-4 w-32" />
            <div className="flex gap-4">
              <div className="skel h-3 w-16" />
              <div className="skel h-3 w-16" />
              <div className="skel h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="skel h-3 w-40 mb-2" />
        <div className="skel h-3 w-64" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-[614px] mx-auto">
      {/* Profile header */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center gap-6 md:gap-10 mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="profile-ring">
              <div className="w-1.5 h-1.5" />
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=0095f6&color=ffffff&size=150&bold=true`}
                alt={profile.username}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover block"
                style={{ border: '2px solid #000' }}
              />
            </div>
            {isOwner && (
              <button onClick={() => avatarRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0095f6] flex items-center justify-center border-2 border-black"
                aria-label="Change profile photo">
                <Camera size={11} className="text-white" />
              </button>
            )}
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
              {profile.is_private && <Lock size={14} className="text-[#737373]" />}
            </div>

            <div className="flex gap-4 mb-4">
              {[
                { label: 'posts', value: profile.posts_count },
                { label: 'followers', value: profile.followers_count },
                { label: 'following', value: profile.following_count },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-sm font-bold text-white">{formatNumber(s.value)}</p>
                  <p className="text-xs text-[#a8a8a8]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  <button onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:bg-[#363636]"
                    style={{ background: '#262626' }}>
                    Edit profile
                  </button>
                  <button className="p-1.5 rounded-lg transition-colors hover:bg-[#363636]"
                    style={{ background: '#262626' }}>
                    <Settings size={18} className="text-white" />
                  </button>
                </>
              ) : (
                <button onClick={handleFollow}
                  disabled={friendship?.status === 'pending'}
                  className="px-6 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-default"
                  style={btnStyle}>
                  {btnLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-0.5">
          {profile.full_name && <p className="text-sm font-semibold text-white">{profile.full_name}</p>}
          {profile.bio && <p className="text-sm text-white whitespace-pre-wrap leading-snug">{profile.bio}</p>}
          {profile.location && (
            <p className="text-sm text-[#0095f6] flex items-center gap-1">
              <MapPin size={12} /> {profile.location}
            </p>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[#0095f6] flex items-center gap-1 hover:underline">
              <LinkIcon size={12} /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <p className="text-xs text-[#737373]">Joined {formatDate(profile.created_at, 'MMMM yyyy')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-[#262626]">
        {[
          { id: 'posts' as Tab, icon: Grid3X3, label: 'POSTS' },
          { id: 'reels' as Tab, icon: Film, label: 'REELS' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-widest transition-colors',
              tab === t.id ? 'tab-on' : 'tab-off')}>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === 'posts' && <PostGrid posts={posts} loading={postsLoading} />}
          {tab === 'reels' && (
            <div className="py-16 text-center">
              <Film className="w-12 h-12 text-[#737373] mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No reels yet</p>
              <p className="text-[#737373] text-sm">Videos shared here will appear here.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] rounded-xl overflow-hidden shadow-2xl"
              style={{ background: '#1c1c1c', border: '1px solid #363636' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <button onClick={() => setEditOpen(false)} className="text-[#a8a8a8] hover:text-white text-sm">Cancel</button>
                <p className="text-sm font-semibold text-white">Edit profile</p>
                <button onClick={handleSave} disabled={saving}
                  className="text-sm font-semibold disabled:opacity-40"
                  style={{ color: '#0095f6' }}>
                  {saving ? '...' : 'Done'}
                </button>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { k: 'full_name', label: 'Name', type: 'text', placeholder: 'Your name' },
                  { k: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
                  { k: 'website', label: 'Website', type: 'url', placeholder: 'https://yoursite.com' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-medium text-[#a8a8a8] mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={editForm[f.k as keyof typeof editForm]}
                      onChange={e => setEditForm(ef => ({ ...ef, [f.k]: e.target.value }))}
                      className="c-input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-[#a8a8a8] mb-1.5">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(ef => ({ ...ef, bio: e.target.value }))}
                    rows={3} placeholder="Tell people about yourself"
                    className="c-input resize-none" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
