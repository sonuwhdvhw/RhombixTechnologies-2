"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.setupSocketHandlers = void 0;
const supabase_1 = require("../lib/supabase");
const onlineUsers = new Map(); // userId -> socketId
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // User joins with their userId
        socket.on('user:join', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(`user:${userId}`);
            io.emit('users:online', Array.from(onlineUsers.keys()));
            console.log(`User ${userId} joined`);
        });
        // Join a room (for posts, etc.)
        socket.on('room:join', (roomId) => {
            socket.join(roomId);
        });
        socket.on('room:leave', (roomId) => {
            socket.leave(roomId);
        });
        // Real-time messaging
        socket.on('message:send', async (data) => {
            try {
                const { data: message, error } = await supabase_1.supabaseAdmin
                    .from('messages')
                    .insert({
                    sender_id: data.senderId,
                    receiver_id: data.receiverId,
                    content: data.content,
                })
                    .select(`
            *,
            sender:sender_id (id, username, full_name, avatar_url)
          `)
                    .single();
                if (!error && message) {
                    // Send to receiver
                    const receiverSocketId = onlineUsers.get(data.receiverId);
                    if (receiverSocketId) {
                        io.to(`user:${data.receiverId}`).emit('message:received', message);
                    }
                    // Confirm to sender
                    socket.emit('message:sent', message);
                }
            }
            catch (err) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Typing indicators
        socket.on('typing:start', (data) => {
            io.to(`user:${data.receiverId}`).emit('typing:start', { userId: data.senderId });
        });
        socket.on('typing:stop', (data) => {
            io.to(`user:${data.receiverId}`).emit('typing:stop', { userId: data.senderId });
        });
        // Post real-time (likes, comments)
        socket.on('post:like', (data) => {
            socket.to(`post:${data.postId}`).emit('post:liked', data);
        });
        socket.on('post:comment', (data) => {
            io.to(`post:${data.postId}`).emit('post:commented', data);
        });
        // Notifications
        socket.on('notification:send', (data) => {
            io.to(`user:${data.userId}`).emit('notification:new', data.notification);
        });
        // Disconnect
        socket.on('disconnect', () => {
            // Remove user from online list
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('user:offline', userId);
                    break;
                }
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
const getOnlineUsers = () => Array.from(onlineUsers.keys());
exports.getOnlineUsers = getOnlineUsers;
//# sourceMappingURL=handlers.js.map