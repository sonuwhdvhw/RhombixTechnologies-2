import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RefreshCw, ExternalLink, Clock, Flame } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  emoji: string;
}

// RSS to JSON via public API (no key needed)
const RSS_SOURCES = [
  {
    url: 'https://rss.cnn.com/rss/edition.rss',
    source: 'CNN',
    category: 'World',
    emoji: '🌍',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC News',
    category: 'World',
    emoji: '📰',
  },
  {
    url: 'https://techcrunch.com/feed/',
    source: 'TechCrunch',
    category: 'Tech',
    emoji: '💻',
  },
  {
    url: 'https://feeds.feedburner.com/TheHackersNews',
    source: 'Hacker News',
    category: 'Tech',
    emoji: '🔥',
  },
];

const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'AI transforms global workforce as automation accelerates',
    description: 'Experts predict major shifts in employment as AI tools become mainstream across industries.',
    url: '#',
    source: 'Tech Today',
    category: 'Tech',
    emoji: '🤖',
    publishedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'TikTok reaches 2 billion monthly active users milestone',
    description: 'The short-video platform continues its meteoric rise, surpassing all expectations.',
    url: '#',
    source: 'Social Media',
    category: 'Entertainment',
    emoji: '🎵',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: 'Instagram launches new AI-powered content creation tools',
    description: 'Meta announces suite of AI features to help creators produce more engaging content.',
    url: '#',
    source: 'Meta News',
    category: 'Social',
    emoji: '📸',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    title: 'Climate summit reaches historic carbon-neutral agreement',
    description: '195 countries sign landmark deal to achieve carbon neutrality by 2040.',
    url: '#',
    source: 'World News',
    category: 'World',
    emoji: '🌱',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '5',
    title: 'SpaceX successfully launches 100th mission to ISS',
    description: 'Milestone achieved as private space exploration reaches new heights.',
    url: '#',
    source: 'Space News',
    category: 'Science',
    emoji: '🚀',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '6',
    title: 'Bitcoin surges 20% as institutional adoption grows',
    description: 'Major banks announce Bitcoin custody services as crypto goes mainstream.',
    url: '#',
    source: 'Finance',
    category: 'Finance',
    emoji: '💰',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: '7',
    title: 'New study reveals social media boosts creativity',
    description: 'Research shows moderate social media use enhances creative thinking in young adults.',
    url: '#',
    source: 'Science Daily',
    category: 'Science',
    emoji: '🧠',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: '8',
    title: 'FIFA announces 2026 World Cup schedule changes',
    description: 'Tournament organizers reveal updated match schedule across three host countries.',
    url: '#',
    source: 'Sports',
    category: 'Sports',
    emoji: '⚽',
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
  },
];

const CATEGORIES = ['All', 'Tech', 'World', 'Entertainment', 'Sports', 'Finance', 'Science'];
const CATEGORY_COLORS: Record<string, string> = {
  Tech: '#6366f1',
  World: '#06b6d4',
  Entertainment: '#ec4899',
  Sports: '#10b981',
  Finance: '#f59e0b',
  Science: '#8b5cf6',
  Social: '#ec4899',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DailyFeed() {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const results: NewsItem[] = [];

    // Try fetching from RSS sources
    const fetches = RSS_SOURCES.slice(0, 2).map(async (src) => {
      try {
        const res = await fetch(`${PROXY}${encodeURIComponent(src.url)}&count=5`, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          data.items.slice(0, 4).forEach((item: {
            title: string;
            description: string;
            link: string;
            pubDate: string;
            thumbnail?: string;
          }) => {
            results.push({
              id: `${src.source}-${item.link}`,
              title: item.title?.replace(/<[^>]+>/g, '').slice(0, 100) || '',
              description: item.description?.replace(/<[^>]+>/g, '').slice(0, 150) || '',
              url: item.link,
              source: src.source,
              category: src.category,
              emoji: src.emoji,
              publishedAt: item.pubDate || new Date().toISOString(),
              imageUrl: item.thumbnail || undefined,
            });
          });
        }
      } catch {
        // silently use fallback
      }
    });

    await Promise.allSettled(fetches);

    if (results.length > 0) {
      setNews(results.sort(() => Math.random() - 0.5));
    } else {
      setNews(FALLBACK_NEWS);
    }

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch on mount
    fetchNews();

    // Auto refresh every 10 minutes
    const interval = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const filtered = filter === 'All' ? news : news.filter(n => n.category === filter);

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-sm font-bold text-white">Trending Now</span>
          <Flame size={14} className="text-orange-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6060a0]">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[rgba(139,92,246,0.15)] transition-colors"
            aria-label="Refresh feed"
          >
            <RefreshCw
              size={13}
              className={`text-[#a78bfa] ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={filter === cat ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(139,92,246,0.5)',
              color: '#a78bfa',
            } : {
              background: 'rgba(26,26,46,0.6)',
              border: '1px solid rgba(139,92,246,0.15)',
              color: '#6060a0',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News cards */}
      <div className="px-2 space-y-2">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="g-card p-4">
                <div className="flex gap-3">
                  <div className="skel w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skel h-3.5 w-3/4" />
                    <div className="skel h-3 w-full" />
                    <div className="skel h-2.5 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            filtered.slice(0, 8).map((item, i) => (
              <motion.a
                key={item.id}
                href={item.url !== '#' ? item.url : undefined}
                target={item.url !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="g-card block p-3.5 hover:scale-[1.01] transition-transform cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex gap-3 items-start">
                  {/* Emoji / thumbnail */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${CATEGORY_COLORS[item.category] || '#6366f1'}22, ${CATEGORY_COLORS[item.category] || '#6366f1'}11)`,
                      border: `1px solid ${CATEGORY_COLORS[item.category] || '#6366f1'}33`,
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full rounded-xl object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      item.emoji
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{
                          background: `${CATEGORY_COLORS[item.category] || '#6366f1'}22`,
                          color: CATEGORY_COLORS[item.category] || '#a78bfa',
                        }}
                      >
                        {item.category}
                      </span>
                      <span className="text-[10px] text-[#6060a0] flex items-center gap-0.5">
                        <Clock size={9} />
                        {timeAgo(item.publishedAt)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-2">
                      {item.title}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Globe size={10} className="text-[#6060a0]" />
                        <span className="text-[11px] text-[#6060a0]">{item.source}</span>
                      </div>
                      {item.url !== '#' && (
                        <ExternalLink size={11} className="text-[#8b5cf6]" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.a>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="glow-sep mx-4 mt-4" />
    </div>
  );
}
