import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';

export const getStories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get active stories grouped by user (not expired)
    const { data: stories, error } = await supabaseAdmin
      .from('stories')
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `
      )
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw createError(error.message, 400);

    // Group by user
    const grouped = new Map();
    stories?.forEach((story) => {
      const uid = story.user_id;
      if (!grouped.has(uid)) {
        grouped.set(uid, {
          user: story.profiles,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = grouped.get(uid);
      group.stories.push(story);
    });

    // Check viewed status if authenticated
    if (userId) {
      const storyIds = stories?.map((s) => s.id) || [];
      if (storyIds.length > 0) {
        const { data: views } = await supabaseAdmin
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', userId)
          .in('story_id', storyIds);

        const viewedIds = new Set(views?.map((v) => v.story_id));
        grouped.forEach((group) => {
          group.hasUnviewed = group.stories.some((s: { id: string }) => !viewedIds.has(s.id));
        });
      }
    }

    res.json({ storyGroups: Array.from(grouped.values()) });
  } catch (err) {
    next(err);
  }
};

export const createStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { media_url, media_type = 'image', caption } = req.body;

    if (!media_url) throw createError('Media URL is required', 400);

    const { data: story, error } = await supabaseAdmin
      .from('stories')
      .insert({ user_id: userId, media_url, media_type, caption })
      .select(
        `
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) throw createError(error.message, 400);

    res.status(201).json({ story });
  } catch (err) {
    next(err);
  }
};

export const viewStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const viewerId = req.user!.id;

    await supabaseAdmin
      .from('story_views')
      .upsert({ story_id: id, viewer_id: viewerId }, { onConflict: 'story_id,viewer_id' });

    // Increment views_count safely
    const { data: storyData } = await supabaseAdmin
      .from('stories')
      .select('views_count')
      .eq('id', id)
      .single();
    if (storyData) {
      await supabaseAdmin
        .from('stories')
        .update({ views_count: (storyData.views_count || 0) + 1 })
        .eq('id', id);
    }

    res.json({ message: 'Story viewed' });
  } catch (err) {
    next(err);
  }
};
