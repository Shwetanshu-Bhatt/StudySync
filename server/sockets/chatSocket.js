const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Course = require('../models/Course');

// Store online users: { socketId: { userId, name, role, room } }
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room with course-based validation
    socket.on('joinRoom', async ({ userId, name, role, roomId }) => {
      if (!userId) {
        console.log('joinRoom received without userId');
        return;
      }

      let room;
      let roomType = 'unknown';
      let canJoin = false;

      try {
        // Get user with course info
        const user = await User.findById(userId).populate('branch assignedCourses');
        
        console.log('[DEBUG] joinRoom - userId:', userId);
        console.log('[DEBUG] joinRoom - user.branch:', user?.branch);
        console.log('[DEBUG] joinRoom - user.branch.toString():', user?.branch?.toString());
        console.log('[DEBUG] joinRoom - roomId:', roomId);
        console.log('[DEBUG] joinRoom - role:', role);
        
        if (!user) {
          console.log('User not found');
          return;
        }

        if (roomId) {
          // Specific room (course room, subject room, custom room, or DM room)
          room = roomId;
          
          // Check if it's a custom room, DM room, or course room
          const chatRoom = await ChatRoom.findById(roomId);
          console.log('[DEBUG] chatRoom found:', chatRoom);
          
          if (chatRoom) {
            // Check room type
            if (chatRoom.type === 'dm') {
              // DM room - check if user is a participant
              const participantIds = chatRoom.participants?.map(p => p.toString()) || [];
              canJoin = participantIds.includes(userId.toString());
              roomType = 'dm';
              console.log(`DM room access: isParticipant=${canJoin}`);
            } else if (chatRoom.type === 'custom') {
              // Custom room - check if user is invited OR is a member
              const invitedIds = chatRoom.invitedUsers?.map(u => u.toString()) || [];
              const memberIds = chatRoom.members?.map(m => m.user?.toString()) || [];
              const isInvited = invitedIds.includes(userId.toString());
              const isMember = memberIds.includes(userId.toString());
              const isOwner = chatRoom.createdBy?.toString() === userId.toString();
              canJoin = isInvited || isMember || isOwner;
              roomType = 'custom';
              console.log(`Custom room access: invited=${isInvited}, member=${isMember}, owner=${isOwner}`);
            } else {
              // Course room - validate access based on role
              if (role === 'student') {
                // Students can only join their enrolled course
                canJoin = user.branch?._id?.toString() === roomId;
                roomType = 'course';
              } else if (role === 'teacher') {
                // Teachers can join courses they are assigned to
                const assignedCourseIds = user.assignedCourses?.map(c => c._id.toString()) || [];
                canJoin = assignedCourseIds.includes(roomId);
                roomType = 'course';
              } else if (role === 'admin') {
                // Admins can access all course rooms
                canJoin = true;
                roomType = 'course';
              }
            }
          } else {
            // Check if it's a course room (course ID as room)
            const course = await Course.findById(roomId);
            console.log('[DEBUG] course found:', course);
            
            if (course) {
              // Course room - validate access based on role
              if (role === 'student') {
                // Students can only join their enrolled course
                canJoin = user.branch?._id?.toString() === roomId;
                roomType = 'course';
              } else if (role === 'teacher') {
                // Teachers can join courses they are assigned to
                const assignedCourseIds = user.assignedCourses?.map(c => c._id.toString()) || [];
                canJoin = assignedCourseIds.includes(roomId);
                roomType = 'course';
              } else if (role === 'admin') {
                // Admins can access all course rooms
                canJoin = true;
                roomType = 'course';
              }
            }
          }
        } else {
          // No room specified - default to user's course room
          if (user.branch) {
            room = user.branch.toString();
            canJoin = true;
            roomType = 'course';
          }
        }

        if (!canJoin) {
          console.log(`${name} (${role}) denied access to room: ${room}`);
          socket.emit('error', { message: 'You do not have access to this room' });
          return;
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
          message: `${name} has joined the chat`
        });

        // Send updated users list to room
        const roomUsers = getRoomUsers(room);
        io.to(room).emit('updateUsers', roomUsers);

        // Load previous messages
        try {
          let messages = await ChatMessage.find({ room: room })
            .sort({ createdAt: -1 })
            .limit(50);
          
          messages = await Promise.all(messages.map(async (msg) => {
            const msgObj = msg.toObject();
            if (msg.senderName) {
              msgObj.sender = { name: msg.senderName };
            } else if (msg.sender) {
              const sender = await User.findById(msg.sender).select('name email avatar');
              msgObj.sender = sender;
            }
            return msgObj;
          }));
          
          socket.emit('loadMessages', messages.reverse());
        } catch (error) {
          console.error('Error loading messages:', error);
        }

        console.log(`${name} (${role}) joined ${roomType} room: ${room}`);
      } catch (error) {
        console.error('Error in joinRoom:', error);
      }
    });

    // Leave room
    socket.on('leaveRoom', ({ roomId }) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      }
    });

    // Send message
    socket.on('sendMessage', async ({ message, room, replyTo }) => {
      const user = onlineUsers.get(socket.id);
      
      if (!user) {
        console.error('User not found in onlineUsers');
        return;
      }

      if (!room) {
        console.error('Room is undefined');
        return;
      }

      if (!message || !message.trim()) {
        console.error('Message is empty');
        return;
      }

      try {
        const newMessage = await ChatMessage.create({
          room: room,
          sender: user.userId,
          senderName: user.name,
          content: message.trim(),
          replyTo: replyTo ? replyTo.id : null
        });

        // Broadcast to room
        io.to(room).emit('receiveMessage', {
          id: newMessage._id,
          sender: user.userId,
          senderName: user.name,
          room: room,
          content: newMessage.content,
          time: newMessage.createdAt,
          replyTo: replyTo || null
        });

        console.log(`Message from ${user.name} (${user.role}) in room ${room}`);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        const room = user.room;
        
        socket.to(room).emit('userLeft', {
          userId: user.userId,
          name: user.name,
          message: `${user.name} has left the chat`
        });

        const roomUsers = getRoomUsers(room);
        io.to(room).emit('updateUsers', roomUsers);
        onlineUsers.delete(socket.id);
        
        console.log(`${user.name} (${user.role}) disconnected from ${room}`);
      } else {
        console.log(`Socket ${socket.id} disconnected`);
      }
    });
  });

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
