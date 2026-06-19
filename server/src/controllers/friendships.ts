import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export const sendFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { receiverId } = req.body;
    const requesterId = req.user!.id;

    if (requesterId === receiverId) {
      throw createError('Cannot send friend request to yourself', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('friendships')
      .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' })
      .select()
      .single();

    if (error) throw createError('Friend request already exists or failed', 400);

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      user_id: receiverId,
      actor_id: requesterId,
      type: 'friend_request',
    });

    res.status(201).json({ friendship: data });
  } catch (err) {
    next(err);
  }
};

export const respondToRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'
    const userId = req.user!.id;

    if (!['accepted', 'rejected'].includes(status)) {
      throw createError('Invalid status', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('friendships')
      .update({ status })
      .eq('id', id)
      .eq('receiver_id', userId)
      .select()
      .single();

    if (error || !data) throw createError('Friend request not found', 404);

    // Update follower counts if accepted
    if (status === 'accepted') {
      await supabaseAdmin.rpc('increment_followers', {
        user_id: data.receiver_id,
        friend_id: data.requester_id,
      });

      // Notify requester their request was accepted
      await supabaseAdmin.from('notifications').insert({
        user_id: data.requester_id,
        actor_id: userId,
        type: 'friend_accepted',
      });
    }

    res.json({ friendship: data });
  } catch (err) {
    next(err);
  }
};

export const removeFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabaseAdmin
      .from('friendships')
      .delete()
      .eq('id', id)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw createError('Friendship not found', 404);

    res.json({ message: 'Friendship removed' });
  } catch (err) {
    next(err);
  }
};

export const getFriends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status = 'accepted' } = req.query;

    const { data: friendships, error } = await supabaseAdmin
      .from('friendships')
      .select(
        `
        *,
        requester:requester_id(id, username, full_name, avatar_url),
        receiver:receiver_id(id, username, full_name, avatar_url)
      `
      )
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw createError(error.message, 400);

    // Normalize to return the "other" user
    const friends = friendships?.map((f) => ({
      friendshipId: f.id,
      status: f.status,
      isRequester: f.requester_id === userId,
      user: f.requester_id === userId ? f.receiver : f.requester,
      created_at: f.created_at,
    }));

    res.json({ friends });
  } catch (err) {
    next(err);
  }
};

export const getPendingRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('friendships')
      .select(
        `
        *,
        requester:requester_id(id, username, full_name, avatar_url)
      `
      )
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw createError(error.message, 400);

    res.json({ requests: data });
  } catch (err) {
    next(err);
  }
};
