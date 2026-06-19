import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { messagesApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import { Conversation, Message, Profile } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/SkeletonLoader';

// ── Online Status Hook ──────────────────────────────────────
function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('users:online', (users: string[]) => setOnlineUsers(new Set(users)));
    socket.on('user:offline', (userId: string) =>
      setOnlineUsers((prev) => { const next = new Set(prev); next.delete(userId); return next; })
    );

    return () => {
      socket.off('users:online');
      socket.off('user:offline');
    };
  }, []);

  return onlineUsers;
}

// ── Message Bubble ─────────────────────────────────────────
function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex gap-2 max-w-[80%]', isMine ? 'ml-auto flex-row-reverse' : '')}
    >
      {!isMine && (
        <Avatar
          src={message.sender?.avatar_url}
          name={message.sender?.full_name || message.sender?.username}
          size="xs"
          className="mt-auto mb-1"
        />
      )}
      <div className="space-y-0.5">
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
            isMine
              ? 'bg-indigo-gradient text-white rounded-br-sm'
              : 'bg-white/6 text-slate-200 rounded-bl-sm border border-white/6'
          )}
        >
          {message.content}
        </div>
        <p className={cn('text-[11px] text-slate-600 px-1', isMine && 'text-right')}>
          {formatRelativeTime(message.created_at)}
          {isMine && (
            <span className="ml-1">{message.read ? '✓✓' : '✓'}</span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId?: string }>();
  const { user, profile } = useAuthStore();
  const onlineUsers = useOnlineUsers();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [convsLoading, setConvsLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Load conversations
    messagesApi.getConversations()
      .then(({ data }) => setConversations(data.conversations || []))
      .finally(() => setConvsLoading(false));
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    setMsgsLoading(true);

    // Find partner info from conversations
    const conv = conversations.find((c) => c.partnerId === partnerId);
    if (conv) setPartner(conv.partner);

    messagesApi.getMessages(partnerId)
      .then(({ data }) => {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      })
      .finally(() => setMsgsLoading(false));
  }, [partnerId, conversations.length]);

  // Socket events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('message:received', (msg: Message) => {
      if (msg.sender_id === partnerId || msg.receiver_id === partnerId) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
      // Update conversation list
      setConversations((prev) =>
        prev.map((c) => c.partnerId === msg.sender_id ? { ...c, lastMessage: msg } : c)
      );
    });

    socket.on('message:sent', (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
    });

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      if (userId === partnerId) setPartnerTyping(true);
    });

    socket.on('typing:stop', ({ userId }: { userId: string }) => {
      if (userId === partnerId) setPartnerTyping(false);
    });

    return () => {
      socket.off('message:received');
      socket.off('message:sent');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [user?.id, partnerId]);

  // Real-time via Supabase as fallback
  useEffect(() => {
    if (!user || !partnerId) return;
    const channel = supabase
      .channel(`messages:${user.id}:${partnerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === partnerId) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 50);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, partnerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId || !user) return;
    setSending(true);

    // Optimistic
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partnerId,
      content: newMessage.trim(),
      read: false,
      created_at: new Date().toISOString(),
      sender: profile as Profile,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    setTimeout(scrollToBottom, 50);

    // Emit via socket
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('message:send', {
        senderId: user.id,
        receiverId: partnerId,
        content: optimistic.content,
      });
    } else {
      // Fallback to REST
      try {
        const { data } = await messagesApi.send(partnerId, optimistic.content);
        setMessages((prev) =>
          prev.map((m) => m.id === optimistic.id ? data.message : m)
        );
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    }

    setSending(false);
    // Stop typing
    if (typing && socket) {
      socket.emit('typing:stop', { senderId: user.id, receiverId: partnerId });
      setTyping(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    const socket = getSocket();
    if (!socket || !user || !partnerId) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing:start', { senderId: user.id, receiverId: partnerId });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing:stop', { senderId: user.id, receiverId: partnerId });
    }, 2000);
  };

  const isPartnerOnline = partnerId ? onlineUsers.has(partnerId) : false;

  return (
    <div className="-mx-4 -mt-6" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex h-full">
        {/* Conversation List */}
        <div className={cn(
          'w-full md:w-72 lg:w-80 border-r border-white/5 flex flex-col glass-strong',
          partnerId ? 'hidden md:flex' : 'flex'
        )}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-white/5">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              Messages
            </h1>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="py-16 text-center">
                <MessageCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <Link
                  key={conv.partnerId}
                  to={`/messages/${conv.partnerId}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors',
                    partnerId === conv.partnerId && 'bg-indigo-500/10 border-r-2 border-indigo-500'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={conv.partner.avatar_url}
                      name={conv.partner.full_name || conv.partner.username}
                      size="md"
                    />
                    {onlineUsers.has(conv.partnerId) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">
                        {conv.partner.full_name || conv.partner.username}
                      </p>
                      <span className="text-[11px] text-slate-600 shrink-0 ml-2">
                        {formatRelativeTime(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate max-w-[160px]">
                        {conv.lastMessage.sender_id === user?.id && 'You: '}
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-indigo-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0 ml-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={cn(
          'flex-1 flex flex-col',
          !partnerId ? 'hidden md:flex' : 'flex'
        )}>
          {!partnerId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 glass-strong">
                <Link to="/messages" className="md:hidden text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                {partner && (
                  <>
                    <div className="relative">
                      <Avatar src={partner.avatar_url} name={partner.full_name || partner.username} size="md" />
                      {isPartnerOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full" />
                      )}
                    </div>
                    <div>
                      <Link to={`/profile/${partner.username}`}>
                        <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">
                          {partner.full_name || partner.username}
                        </p>
                      </Link>
                      <p className={cn(
                        'text-xs',
                        isPartnerOnline ? 'text-green-400' : 'text-slate-500'
                      )}>
                        {partnerTyping ? (
                          <span className="text-indigo-400 animate-pulse">typing...</span>
                        ) : isPartnerOnline ? (
                          'Online'
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
                {msgsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn('flex gap-2 max-w-[70%]', i % 2 === 0 ? '' : 'ml-auto flex-row-reverse')}>
                      <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                      <Skeleton className={cn('h-10 rounded-2xl', i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-64' : 'w-32')} />
                    </div>
                  ))
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-2xl mb-2">👋</p>
                      <p className="text-sm text-slate-500">Send a message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMine={msg.sender_id === user?.id}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {partnerTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-center gap-2"
                    >
                      <Avatar src={partner?.avatar_url} name={partner?.username} size="xs" />
                      <div className="px-3.5 py-2.5 bg-white/6 rounded-2xl rounded-bl-sm border border-white/6">
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 bg-slate-500 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/5 glass-strong">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Message..."
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      className="input-field pr-10 text-sm"
                      aria-label="Type a message"
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:text-slate-700 transition-colors"
                      aria-label="Send message"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
