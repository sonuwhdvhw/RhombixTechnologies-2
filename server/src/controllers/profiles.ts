import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) throw createError('Profile not found', 404);

    // Check friendship status if authenticated
    let friendshipStatus = null;
    if (req.user && req.user.id !== profile.id) {
      const { data: friendship } = await supabaseAdmin
        .from('friendships')
        .select('status, requester_id')
        .or(
          `and(requester_id.eq.${req.user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${req.user.id})`
        )
        .single();

      friendshipStatus = friendship || null;
    }

    res.json({ profile, friendshipStatus });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { full_name, bio, website, location, is_private, avatar_url, cover_url } = req.body;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, bio, website, location, is_private, avatar_url, cover_url })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw createError(error.message, 400);

    res.json({ profile });
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || String(q).length < 2) {
      res.json({ users: [] });
      return;
    }

    let query = supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(Number(limit));

    // Exclude current user only if authenticated
    if (req.user?.id) {
      query = query.neq('id', req.user.id);
    }

    const { data: users, error } = await query;

    if (error) throw createError(error.message, 400);

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const getSuggestedUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = 8 } = req.query;

    // Get users that the current user is NOT friends with
    const { data: friendIds } = await supabaseAdmin
      .from('friendships')
      .select('requester_id, receiver_id')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');

    const excludeIds = [
      userId,
      ...(friendIds?.map((f) => (f.requester_id === userId ? f.receiver_id : f.requester_id)) ||
        []),
    ];

    const { data: suggestions, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, avatar_url, followers_count')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('followers_count', { ascending: false })
      .limit(Number(limit));

    if (error) throw createError(error.message, 400);

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
};
