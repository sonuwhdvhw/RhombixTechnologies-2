"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.createComment = exports.getComments = void 0;
const supabase_1 = require("../lib/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const getComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { data: comments, error } = await supabase_1.supabaseAdmin
            .from('comments')
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        replies:comments!parent_id (
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        )
      `)
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true })
            .range(offset, offset + Number(limit) - 1);
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.json({ comments });
    }
    catch (err) {
        next(err);
    }
};
exports.getComments = getComments;
const createComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { content, parent_id } = req.body;
        const userId = req.user.id;
        if (!content?.trim())
            throw (0, errorHandler_1.createError)('Comment content is required', 400);
        const { data: comment, error } = await supabase_1.supabaseAdmin
            .from('comments')
            .insert({ post_id: postId, user_id: userId, content: content.trim(), parent_id })
            .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
            .single();
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        // Notify post owner
        const { data: post } = await supabase_1.supabaseAdmin
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();
        if (post && post.user_id !== userId) {
            await supabase_1.supabaseAdmin.from('notifications').insert({
                user_id: post.user_id,
                actor_id: userId,
                type: 'comment',
                post_id: postId,
                comment_id: comment.id,
            });
        }
        res.status(201).json({ comment });
    }
    catch (err) {
        next(err);
    }
};
exports.createComment = createComment;
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { error } = await supabase_1.supabaseAdmin
            .from('comments')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw (0, errorHandler_1.createError)('Comment not found or unauthorized', 404);
        res.json({ message: 'Comment deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=comments.js.map