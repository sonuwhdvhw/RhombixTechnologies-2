import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get unique conversations (latest message per user pair)
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select(
        `
        *,
        sender:sender_id (id, username, full_name, avatar_url),
        receiver:receiver_id (id, username, full_name, avatar_url)
      `
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw createError(error.message, 400);

    // Group by conversation partner
    const conversationMap = new Map();
    data?.forEach((msg) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: msg,
          unreadCount: !msg.read && msg.receiver_id === userId ? 1 : 0,
        });
      } else if (!msg.read && msg.receiver_id === userId) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    res.json({ conversations: Array.from(conversationMap.values()) });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { partnerId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(
        `
        *,
        sender:sender_id (id, username, full_name, avatar_url)
      `
      )
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw createError(error.message, 400);

    // Mark messages as read
    await supabaseAdmin
      .from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('read', false);

    res.json({ messages: messages?.reverse() });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { receiverId, content } = req.body;

    if (!content?.trim()) throw createError('Message content is required', 400);
    if (!receiverId) throw createError('Receiver ID is required', 400);

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({ sender_id: userId, receiver_id: receiverId, content: content.trim() })
      .select(
        `
        *,
        sender:sender_id (id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) throw createError(error.message, 400);

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};
