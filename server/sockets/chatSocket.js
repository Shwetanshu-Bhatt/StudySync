const ChatMessage = require('../models/ChatMessage');

// Store online users: { socketId: { userId, name, role, room } }
const onlineUsers = new Map();

module.exports = (io) => {
  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room event
    socket.on('joinRoom', async ({ userId, name, role }) => {
      // Determine room based on role
      let room;
      switch (role) {
        case 'student':
          room = 'student-room';
          break;
        case 'teacher':
          room = 'teacher-room';
          break;
        case 'admin':
          room = 'admin-room';
          break;
        default:
          room = 'student-room';
      }

      // Store user info
      onlineUsers.set(socket.id, { userId, name, role, room });

      // Join the room
      socket.join(room);

      // Notify others in room
      socket.to(room).emit('userJoined', {
        userId,
        name,
        role,
        message: `${name} has joined the ${role} room`
      });

      // Send updated users list to room
      const roomUsers = getRoomUsers(room);
      io.to(room).emit('updateUsers', roomUsers);

      // Load previous messages
      try {
        const messages = await ChatMessage.find({ room })
          .sort({ createdAt: -1 })
          .limit(50);
        
        socket.emit('loadMessages', messages.reverse());
      } catch (error) {
        console.error('Error loading messages:', error);
      }

      console.log(`${name} joined ${room}`);
    });

    // Send message event
    socket.on('sendMessage', async ({ message }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      try {
        const newMessage = await ChatMessage.create({
          sender: user.userId,
          senderName: user.name,
          room: user.room,
          message
        });

        // Broadcast to room
        io.to(user.room).emit('receiveMessage', {
          id: newMessage._id,
          sender: user.userId,
          senderName: user.name,
          room: user.room,
          message: newMessage.message,
          time: newMessage.createdAt
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        // Notify others
        socket.to(user.room).emit('userLeft', {
          userId: user.userId,
          name: user.name,
          message: `${user.name} has left the chat`
        });

        // Update users list
        const roomUsers = getRoomUsers(user.room);
        io.to(user.room).emit('updateUsers', roomUsers);

        // Remove from online users
        onlineUsers.delete(socket.id);

        console.log(`${user.name} disconnected`);
      }
    });
  });

  // Helper function to get users in a room
  function getRoomUsers(room) {
    const users = [];
    onlineUsers.forEach((user, socketId) => {
      if (user.room === room) {
        users.push({
          socketId,
          userId: user.userId,
          name: user.name,
          role: user.role
        });
      }
    });
    return users;
  }
};
