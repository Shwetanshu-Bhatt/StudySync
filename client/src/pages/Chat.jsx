import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

const Chat = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [usersToAdd, setUsersToAdd] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const isSocketInitialized = useRef(false);

  useEffect(() => {
    if (!user) return;
    
    if (!isSocketInitialized.current) {
      initializeSocket();
      isSocketInitialized.current = true;
    }
    
    fetchRooms();
    fetchAvailableUsers();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        isSocketInitialized.current = false;
      }
    };
  }, [user]);

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r._id === roomId);
      if (room) {
        joinRoom(room);
        setSearchParams({});
      }
    }
  }, [rooms, searchParams]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeSocket = () => {
    if (socketRef.current?.connected) {
      return;
    }
    
    const SOCKET_URL = (() => {
      const envUrl = import.meta.env.VITE_SOCKET_URL;
      if (envUrl) {
        return envUrl.replace(/\/$/, '');
      }
      return 'http://localhost:5000';
    })();
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('loadMessages', (msgs) => {
      const filteredMsgs = msgs.filter(msg => msg.content !== 'This message has been deleted' && msg.isDeleted !== true);
      setMessages(filteredMsgs);
    });

    socketRef.current.on('receiveMessage', (message) => {
      if (message.content !== 'This message has been deleted' && message.isDeleted !== true) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => {
        const msgId = msg.id || msg._id;
        return String(msgId) !== String(messageId);
      }));
    });

    socketRef.current.on('updateUsers', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('error', ({ message }) => {
      showError(message);
    });
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let accessibleRooms = [];
      
      if (user.role === 'student' && user.branch) {
        const courseRes = await api.get(`/courses/${user.branch}`);
        const courseRoom = {
          _id: user.branch,
          name: courseRes.data.course.name + ' Chat',
          type: 'course',
          isDefault: true
        };
        accessibleRooms = [courseRoom];
      } else if (user.role === 'teacher' && user.assignedCourses?.length > 0) {
        const courseIds = user.assignedCourses;
        accessibleRooms = await Promise.all(
          courseIds.map(async (courseId) => {
            try {
              const courseRes = await api.get(`/courses/${courseId}`);
              return {
                _id: courseId,
                name: courseRes.data.course.name + ' Chat',
                type: 'course',
                isDefault: true
              };
            } catch {
              return null;
            }
          })
        );
        accessibleRooms = accessibleRooms.filter(r => r);
      }
      
      try {
        const customRes = await api.get('/chat/rooms');
        const customRooms = customRes.data.rooms.filter(
          (room) => room.type === 'custom' && 
          (room.createdBy?._id === user._id || 
           room.invitedUsers?.some(u => u._id === user._id) ||
           room.members?.some(m => m.user?._id === user._id))
        );
        
        const dmRooms = customRes.data.rooms.filter(
          (room) => room.type === 'dm' && 
          room.participants?.some(p => p._id === user._id)
        );
        
        accessibleRooms = [...accessibleRooms, ...customRooms, ...dmRooms];
      } catch (e) {
        console.log('No custom rooms found');
      }
      
      setRooms(accessibleRooms);
      
      // Don't auto-join any room - let user select manually
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get('/users/search?q=');
      setAvailableUsers(res.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const joinRoom = (room) => {
    if (!socketRef.current || !user) return;

    if (currentRoom) {
      socketRef.current.emit('leaveRoom', {
        roomId: currentRoom._id
      });
    }

    socketRef.current.emit('joinRoom', {
      userId: user._id,
      name: user.name,
      role: user.role,
      roomId: room._id
    });

    setCurrentRoom(room);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      message: newMessage,
      room: currentRoom._id,
      replyTo: replyingTo ? {
        id: replyingTo.id || replyingTo._id,
        content: replyingTo.content,
        senderName: replyingTo.senderName || replyingTo.sender?.name
      } : null
    });

    setNewMessage('');
    setReplyingTo(null);
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setShowMessageActions(null);
  };

  const handleDelete = async (msg) => {
    confirm('Delete this message for everyone?', async () => {
      try {
        await api.delete(`/chat/messages/${msg.id || msg._id}`);
        setMessages(prev => prev.filter(m => (m.id || m._id) !== (msg.id || msg._id)));
        setShowMessageActions(null);
        success('Message deleted');
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete message');
      }
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const createCustomRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const res = await api.post('/chat/rooms', {
        name: roomName,
        invitedUsers: invitedUsers
      });
      
      setRooms((prev) => [...prev, res.data.room]);
      setShowCreateRoom(false);
      setRoomName('');
      setInvitedUsers([]);
      joinRoom(res.data.room);
      success('Room created successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create room');
    }
  };

  const toggleUserInvite = (userId) => {
    if (invitedUsers.includes(userId)) {
      setInvitedUsers(invitedUsers.filter((id) => id !== userId));
    } else {
      setInvitedUsers([...invitedUsers, userId]);
    }
  };

  const toggleUserToAdd = (userId) => {
    if (usersToAdd.includes(userId)) {
      setUsersToAdd(usersToAdd.filter((id) => id !== userId));
    } else {
      setUsersToAdd([...usersToAdd, userId]);
    }
  };

  const addUsersToRoom = async () => {
    if (usersToAdd.length === 0 || !currentRoom) return;
    
    try {
      await api.post(`/chat/rooms/${currentRoom._id}/add-users`, {
        userIds: usersToAdd
      });
      success('Users added successfully!');
      setShowAddUsers(false);
      setUsersToAdd([]);
      fetchRooms();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add users');
    }
  };

  const deleteRoom = async (roomId) => {
    confirm('Are you sure you want to delete this room? This cannot be undone.', async () => {
      try {
        await api.delete(`/chat/rooms/${roomId}`);
        success('Room deleted successfully!');
        fetchRooms();
        if (currentRoom?._id === roomId) {
          setCurrentRoom(null);
          setMessages([]);
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete room');
      }
    });
  };

  const getRoomDisplayName = (room) => {
    if (room.type === 'dm') {
      const otherParticipant = room.participants?.find(p => p._id !== user?._id);
      return otherParticipant?.name || room.name || 'DM Chat';
    }
    if (room.type === 'custom') {
      return room.name;
    }
    return room.name || 'Course Chat';
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDMStatus = () => {
    if (currentRoom?.type !== 'dm') return null;
    
    const otherUser = currentRoom.participants?.find(p => p._id !== user?._id);
    if (!otherUser) return null;
    
    const isOnline = onlineUsers.some(u => u.userId === otherUser._id);
    return {
      name: otherUser.name,
      isOnline
    };
  };

  const shouldShowDateSeparator = (msg, index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    const msgDate = new Date(msg.createdAt || msg.time).toDateString();
    const prevDate = new Date(prevMsg.createdAt || prevMsg.time).toDateString();
    return msgDate !== prevDate;
  };

  const getRoomIcon = (type) => {
    switch (type) {
      case 'course':
        return { bg: 'from-primary-500 to-primary-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
      case 'dm':
        return { bg: 'from-secondary-500 to-secondary-600', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' };
      case 'custom':
        return { bg: 'from-purple-500 to-pink-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' };
      default:
        return { bg: 'from-slate-500 to-slate-600', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' };
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 glass-card m-2 md:m-3 mr-0 md:mr-0 rounded-2xl flex flex-col overflow-hidden ${currentRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chats</h2>
            <button
              onClick={() => {
                setShowCreateRoom(true);
                fetchAvailableUsers();
              }}
              className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:scale-105"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-white/10 rounded" />
                  <div className="w-16 h-3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {rooms.filter(r => r.type === 'course').length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2 px-2">Your Courses</h3>
                {rooms.filter(r => r.type === 'course').map((room) => {
                  const roomIcon = getRoomIcon(room.type);
                  return (
                    <button
                      key={room._id}
                      onClick={() => joinRoom(room)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        currentRoom?._id === room._id
                          ? 'bg-brand-gradient/20 border border-brand-gradient/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roomIcon.bg} flex items-center justify-center shadow-lg`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roomIcon.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${currentRoom?._id === room._id ? 'text-white' : 'text-slate-300'}`}>{getRoomDisplayName(room)}</p>
                        <p className="text-xs text-slate-500">Course Chat</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {rooms.filter(r => r.type === 'dm').length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2 px-2">Direct Messages</h3>
                {rooms.filter(r => r.type === 'dm').map((room) => {
                  const roomIcon = getRoomIcon(room.type);
                  const dmStatus = () => {
                    const otherUser = room.participants?.find(p => p._id !== user?._id);
                    return otherUser ? onlineUsers.some(u => u.userId === otherUser._id) : false;
                  };
                  return (
                    <button
                      key={room._id}
                      onClick={() => joinRoom(room)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        currentRoom?._id === room._id
                          ? 'bg-brand-gradient/20 border border-brand-gradient/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roomIcon.bg} flex items-center justify-center shadow-lg`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roomIcon.icon} />
                          </svg>
                        </div>
                        {dmStatus() && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0f1a]" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${currentRoom?._id === room._id ? 'text-white' : 'text-slate-300'}`}>{getRoomDisplayName(room)}</p>
                        <p className="text-xs text-slate-500">{dmStatus() ? 'Online' : 'Offline'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {rooms.filter(r => r.type === 'custom').length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-2 px-2">Custom Rooms</h3>
                {rooms.filter(r => r.type === 'custom').map((room) => {
                  const roomIcon = getRoomIcon(room.type);
                  return (
                    <div key={room._id} className="relative group">
                      <button
                        onClick={() => joinRoom(room)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          currentRoom?._id === room._id
                            ? 'bg-brand-gradient/20 border border-brand-gradient/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roomIcon.bg} flex items-center justify-center shadow-lg`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roomIcon.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${currentRoom?._id === room._id ? 'text-white' : 'text-slate-300'}`}>{room.name}</p>
                          <p className="text-xs text-slate-500">Custom Room</p>
                        </div>
                      </button>
                      {room.createdBy?._id === user._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(room._id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {rooms.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">No chat rooms available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass-card m-3 ml-3 md:ml-0 rounded-2xl overflow-hidden">
        {currentRoom ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button 
                onClick={() => setCurrentRoom(null)}
                className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white">{getRoomDisplayName(currentRoom)}</h3>
                {(() => {
                  const dmStatus = getDMStatus();
                  if (dmStatus) {
                    return (
                      <p className={`text-xs ${dmStatus.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                        {dmStatus.isOnline ? '● Online' : '○ Offline'}
                      </p>
                    );
                  }
                  return (
                    <p className="text-xs text-slate-400">{currentRoom.type} • {onlineUsers.length} online</p>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messages.map((msg, index) => {
                const isOwn = msg.senderName === user.name || msg.sender?._id === user._id;
                const msgTime = msg.createdAt || msg.time;
                const showDateSeparator = shouldShowDateSeparator(msg, index);
                
                return (
                  <>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <span className="bg-white/5 text-slate-500 text-xs px-4 py-1.5 rounded-full">
                          {formatMessageDate(msgTime)}
                        </span>
                      </div>
                    )}
                    <div
                      key={msg.id || msg._id || index}
                      className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-md rounded-2xl p-3.5 relative transition-all ${
                          isOwn
                            ? 'bg-brand-gradient text-white rounded-br-md'
                            : 'bg-white/10 text-white rounded-bl-md'
                        }`}
                        onClick={() => setShowMessageActions(showMessageActions === (msg.id || msg._id) ? null : (msg.id || msg._id))}
                      >
                        {msg.replyTo && (
                          <div className={`border-l-2 pl-2.5 mb-2 text-xs ${isOwn ? 'border-white/30 text-white/70' : 'border-primary-500/50 text-primary-300'}`}>
                            <span className="font-medium">{msg.replyTo.senderName || 'Unknown'}</span>
                            <p className="truncate opacity-80">{msg.replyTo.content}</p>
                          </div>
                        )}
                        {!isOwn && (
                          <p className="text-xs text-primary-400 mb-1.5 font-medium">
                            {msg.senderName || msg.sender?.name || 'Unknown'}
                          </p>
                        )}
                        <p className="text-sm md:text-base break-words">{msg.content}</p>
                        <p className="text-[10px] mt-1.5 opacity-60 text-right">{formatTime(msgTime)}</p>
                        
                        {showMessageActions === (msg.id || msg._id) && (
                          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-0 -mt-10 flex bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                              className="px-3 py-2 hover:bg-white/20 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Reply
                            </button>
                            {isOwn && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(msg); }}
                                className="px-3 py-2 hover:bg-red-500/30 text-xs text-red-400 flex items-center gap-1.5 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
              {replyingTo && (
                <div className="flex items-center justify-between bg-white/5 rounded-t-xl px-4 py-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-xs text-slate-300">
                      Replying to <span className="text-primary-400 font-medium">{replyingTo.senderName || replyingTo.sender?.name || 'Unknown'}</span>
                    </span>
                  </div>
                  <button type="button" onClick={cancelReply} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 text-sm md:text-base transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-brand-gradient hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 flex items-center gap-2"
                >
                  <span className="hidden md:inline">Send</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-brand-gradient/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Select a chat</h2>
              <p className="text-slate-400">Choose a room to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-white mb-4">Create Custom Room</h2>
            <form onSubmit={createCustomRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
                  placeholder="e.g., Study Group"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Invite Users (optional)</label>
                <div className="max-h-40 overflow-y-auto bg-white/5 rounded-xl p-3 space-y-2">
                  {availableUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={invitedUsers.includes(u._id)}
                        onChange={() => toggleUserInvite(u._id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500/50"
                      />
                      <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-sm">{u.name}</span>
                      <span className="text-xs text-slate-500 capitalize">({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-gradient text-white rounded-xl hover:opacity-90 transition-all shadow-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Users Modal */}
      {showAddUsers && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-white mb-2">Add Users to Room</h2>
            <p className="text-sm text-slate-400 mb-4">Select users to add to "{currentRoom?.name}"</p>
            <div className="mb-6 max-h-60 overflow-y-auto bg-white/5 rounded-xl p-3 space-y-2">
              {availableUsers
                .filter(u => {
                  const memberIds = currentRoom?.members?.map(m => m.user?._id) || [];
                  return !memberIds.includes(u._id);
                })
                .map((u) => (
                  <label key={u._id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={usersToAdd.includes(u._id)}
                      onChange={() => toggleUserToAdd(u._id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500/50"
                    />
                    <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm">{u.name}</span>
                    <span className="text-xs text-slate-500 capitalize">({u.role})</span>
                  </label>
                ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddUsers(false);
                  setUsersToAdd([]);
                }}
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addUsersToRoom}
                disabled={usersToAdd.length === 0}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {usersToAdd.length > 0 && `(${usersToAdd.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
