"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPosts = exports.toggleLike = exports.deletePost = exports.updatePost = exports.getPost = exports.createPost = exports.getFeedPosts = void 0;
const supabase_1 = require("../lib/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const getFeedPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { data: posts, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        likes(user_id, reaction_type)
      `)
            .eq('privacy', 'public')
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        // Add isLiked flag if authenticated
        const userId = req.user?.id;
        const enriched = posts?.map((post) => ({
            ...post,
            isLiked: userId ? post.likes?.some((l) => l.user_id === userId) : false,
            userReaction: userId
                ? post.likes?.find((l) => l.user_id === userId)?.reaction_type || null
                : null,
        }));
        res.json({ posts: enriched, page: Number(page), limit: Number(limit) });
    }
    catch (err) {
        next(err);
    }
};
exports.getFeedPosts = getFeedPosts;
const createPost = async (req, res, next) => {
    try {
        const { content, image_url, video_url, privacy = 'public' } = req.body;
        const userId = req.user.id;
        if (!content && !image_url && !video_url) {
            throw (0, errorHandler_1.createError)('Post must have content or media', 400);
        }
        const { data: post, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .insert({ user_id: userId, content, image_url, video_url, privacy })
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
            .single();
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.status(201).json({ post });
    }
    catch (err) {
        next(err);
    }
};
exports.createPost = createPost;
const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data: post, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        comments(
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        ),
        likes(user_id, reaction_type)
      `)
            .eq('id', id)
            .single();
        if (error || !post)
            throw (0, errorHandler_1.createError)('Post not found', 404);
        const userId = req.user?.id;
        const enriched = {
            ...post,
            isLiked: userId ? post.likes?.some((l) => l.user_id === userId) : false,
            userReaction: userId
                ? post.likes?.find((l) => l.user_id === userId)?.reaction_type || null
                : null,
        };
        res.json({ post: enriched });
    }
    catch (err) {
        next(err);
    }
};
exports.getPost = getPost;
const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, privacy } = req.body;
        const userId = req.user.id;
        const { data: post, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .update({ content, privacy })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !post)
            throw (0, errorHandler_1.createError)('Post not found or unauthorized', 404);
        res.json({ post });
    }
    catch (err) {
        next(err);
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { error } = await supabase_1.supabaseAdmin
            .from('posts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw (0, errorHandler_1.createError)('Post not found or unauthorized', 404);
        res.json({ message: 'Post deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deletePost = deletePost;
const toggleLike = async (req, res, next) => {
    try {
        const { id: postId } = req.params;
        const { reaction_type = 'like' } = req.body;
        const userId = req.user.id;
        // Check if already liked
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();
        if (existing) {
            // Remove like
            await supabase_1.supabaseAdmin.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
            res.json({ liked: false, reaction: null });
        }
        else {
            // Add like
            await supabase_1.supabaseAdmin.from('likes').insert({ post_id: postId, user_id: userId, reaction_type });
            // Create notification (if post owner is not the liker)
            const { data: post } = await supabase_1.supabaseAdmin
                .from('posts')
                .select('user_id')
                .eq('id', postId)
                .single();
            if (post && post.user_id !== userId) {
                await supabase_1.supabaseAdmin.from('notifications').insert({
                    user_id: post.user_id,
                    actor_id: userId,
                    type: 'like',
                    post_id: postId,
                });
            }
            res.json({ liked: true, reaction: reaction_type });
        }
    }
    catch (err) {
        next(err);
    }
};
exports.toggleLike = toggleLike;
const getUserPosts = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 12 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { data: posts, error } = await supabase_1.supabaseAdmin
            .from('posts')
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.json({ posts });
    }
    catch (err) {
        next(err);
    }
};
exports.getUserPosts = getUserPosts;
//# sourceMappingURL=posts.js.map