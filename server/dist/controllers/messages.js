"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.getConversations = void 0;
const supabase_1 = require("../lib/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Get unique conversations (latest message per user pair)
        const { data, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        *,
        sender:sender_id (id, username, full_name, avatar_url),
        receiver:receiver_id (id, username, full_name, avatar_url)
      `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
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
            }
            else if (!msg.read && msg.receiver_id === userId) {
                conversationMap.get(partnerId).unreadCount++;
            }
        });
        res.json({ conversations: Array.from(conversationMap.values()) });
    }
    catch (err) {
        next(err);
    }
};
exports.getConversations = getConversations;
const getMessages = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { partnerId } = req.params;
        const { page = 1, limit = 30 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { data: messages, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .select(`
        *,
        sender:sender_id (id, username, full_name, avatar_url)
      `)
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        // Mark messages as read
        await supabase_1.supabaseAdmin
            .from('messages')
            .update({ read: true })
            .eq('sender_id', partnerId)
            .eq('receiver_id', userId)
            .eq('read', false);
        res.json({ messages: messages?.reverse() });
    }
    catch (err) {
        next(err);
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { receiverId, content } = req.body;
        if (!content?.trim())
            throw (0, errorHandler_1.createError)('Message content is required', 400);
        if (!receiverId)
            throw (0, errorHandler_1.createError)('Receiver ID is required', 400);
        const { data: message, error } = await supabase_1.supabaseAdmin
            .from('messages')
            .insert({ sender_id: userId, receiver_id: receiverId, content: content.trim() })
            .select(`
        *,
        sender:sender_id (id, username, full_name, avatar_url)
      `)
            .single();
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.status(201).json({ message });
    }
    catch (err) {
        next(err);
    }
};
exports.sendMessage = sendMessage;
//# sourceMappingURL=messages.js.map