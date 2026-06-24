import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../lib/supabase';

interface OnlineUser {
  userId: string;
  socketId: string;
}

const onlineUsers = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins with their userId
    socket.on('user:join', (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socketUsers.set(socket.id, userId); // track reverse map for auth
      socket.join(`user:${userId}`);
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`User ${userId} joined`);
    });

    // Join a room (for posts, etc.)
    socket.on('room:join', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId);
    });

    // Real-time messaging — derive senderId from authenticated socket map
    socket.on('message:send', async (data: {
      senderId: string;
      receiverId: string;
      content: string;
    }) => {
      try {
        // Use server-tracked userId, not client-supplied senderId (prevents spoofing)
        const authenticatedSenderId = socketUsers.get(socket.id);
        if (!authenticatedSenderId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { data: message, error } = await supabaseAdmin
          .from('messages')
          .insert({
            sender_id: authenticatedSenderId,
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
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { senderId: string; receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', { userId: data.senderId });
    });

    socket.on('typing:stop', (data: { senderId: string; receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', { userId: data.senderId });
    });

    // Post real-time (likes, comments)
    socket.on('post:like', (data: { postId: string; userId: string; reaction: string }) => {
      socket.to(`post:${data.postId}`).emit('post:liked', data);
    });

    socket.on('post:comment', (data: { postId: string; comment: object }) => {
      io.to(`post:${data.postId}`).emit('post:commented', data);
    });

    // Notifications
    socket.on('notification:send', (data: { userId: string; notification: object }) => {
      io.to(`user:${data.userId}`).emit('notification:new', data.notification);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        socketUsers.delete(socket.id);
        io.emit('user:offline', userId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());
