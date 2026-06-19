// ── User & Profile ─────────────────────────────────────────────
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

// ── Post ──────────────────────────────────────────────────────
export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  privacy: 'public' | 'friends' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  profiles?: Profile;
  isLiked?: boolean;
  userReaction?: ReactionType | null;
}

// ── Comment ───────────────────────────────────────────────────
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
  replies?: Comment[];
}

// ── Reaction ──────────────────────────────────────────────────
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// ── Friendship ────────────────────────────────────────────────
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface FriendWithUser {
  friendshipId: string;
  status: FriendshipStatus;
  isRequester: boolean;
  user: Profile;
  created_at: string;
}

// ── Notification ──────────────────────────────────────────────
export type NotificationType =
  | 'like'
  | 'comment'
  | 'friend_request'
  | 'friend_accepted'
  | 'mention'
  | 'post_share';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Partial<Post>;
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Conversation {
  partnerId: string;
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
}

// ── Story ─────────────────────────────────────────────────────
export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  profiles?: Profile;
}

export interface StoryGroup {
  user: Profile;
  stories: Story[];
  hasUnviewed: boolean;
}

// ── API Responses ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total?: number;
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}
