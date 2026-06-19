import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export const getFeedPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        likes(user_id, reaction_type)
      `
      )
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw createError(error.message, 400);

    // Add isLiked flag if authenticated
    const userId = req.user?.id;
    const enriched = posts?.map((post) => ({
      ...post,
      isLiked: userId ? post.likes?.some((l: { user_id: string }) => l.user_id === userId) : false,
      userReaction: userId
        ? post.likes?.find((l: { user_id: string }) => l.user_id === userId)?.reaction_type || null
        : null,
    }));

    res.json({ posts: enriched, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content, image_url, video_url, privacy = 'public' } = req.body;
    const userId = req.user!.id;

    if (!content && !image_url && !video_url) {
      throw createError('Post must have content or media', 400);
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({ user_id: userId, content, image_url, video_url, privacy })
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) throw createError(error.message, 400);

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

export const getPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        comments(
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        ),
        likes(user_id, reaction_type)
      `
      )
      .eq('id', id)
      .single();

    if (error || !post) throw createError('Post not found', 404);

    const userId = req.user?.id;
    const enriched = {
      ...post,
      isLiked: userId ? post.likes?.some((l: { user_id: string }) => l.user_id === userId) : false,
      userReaction: userId
        ? post.likes?.find((l: { user_id: string }) => l.user_id === userId)?.reaction_type || null
        : null,
    };

    res.json({ post: enriched });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, privacy } = req.body;
    const userId = req.user!.id;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update({ content, privacy })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !post) throw createError('Post not found or unauthorized', 404);

    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw createError('Post not found or unauthorized', 404);

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: postId } = req.params;
    const { reaction_type = 'like' } = req.body;
    const userId = req.user!.id;

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Remove like
      await supabaseAdmin.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      res.json({ liked: false, reaction: null });
    } else {
      // Add like
      await supabaseAdmin.from('likes').insert({ post_id: postId, user_id: userId, reaction_type });

      // Create notification (if post owner is not the liker)
      const { data: post } = await supabaseAdmin
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== userId) {
        await supabaseAdmin.from('notifications').insert({
          user_id: post.user_id,
          actor_id: userId,
          type: 'like',
          post_id: postId,
        });
      }

      res.json({ liked: true, reaction: reaction_type });
    }
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw createError(error.message, 400);

    res.json({ posts });
  } catch (err) {
    next(err);
  }
};
