"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const supabase_1 = require("../lib/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = supabase_1.supabaseAdmin
            .from('notifications')
            .select(`
        *,
        actor:actor_id (id, username, full_name, avatar_url),
        post:post_id (id, content, image_url)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);
        if (type && type !== 'all') {
            query = query.eq('type', type);
        }
        const { data: notifications, error } = await query;
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        // Get unread count
        const { count: unreadCount } = await supabase_1.supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);
        res.json({ notifications, unreadCount });
    }
    catch (err) {
        next(err);
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { ids } = req.body; // array of notification IDs, or empty for all
        let query = supabase_1.supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', userId);
        if (ids && ids.length > 0) {
            query = query.in('id', ids);
        }
        const { error } = await query;
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.json({ message: 'Notifications marked as read' });
    }
    catch (err) {
        next(err);
    }
};
exports.markAsRead = markAsRead;
//# sourceMappingURL=notifications.js.map