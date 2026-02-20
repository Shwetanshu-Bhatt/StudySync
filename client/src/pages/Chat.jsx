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
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [showMessageActions, setShowMessageActions] = useState(null); // ID of message showing actions
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const isSocketInitialized = useRef(false);

  useEffect(() => {
    if (!user) return;
    
    // Only initialize socket once
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
      console.log('Socket already connected');
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
      console.log('Loaded messages:', msgs.length);
      // Filter out deleted messages completely
      const filteredMsgs = msgs.filter(msg => msg.content !== 'This message has been deleted' && msg.isDeleted !== true);
      console.log('Filtered messages:', filteredMsgs.length);
      setMessages(filteredMsgs);
    });

    socketRef.current.on('receiveMessage', (message) => {
      console.log('Received message via socket:', message);
      // Don't add deleted messages
      if (message.content !== 'This message has been deleted' && message.isDeleted !== true) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for message deletion (Telegram-style)
    socketRef.current.on('messageDeleted', ({ messageId }) => {
      console.log('Message deleted via socket, received ID:', messageId);
      setMessages((prev) => {
        console.log('Current messages before delete:', prev.map(m => ({ id: m.id || m._id, content: m.content?.substring(0, 20) })));
        const filtered = prev.filter((msg) => {
          const msgId = msg.id || msg._id;
          const shouldKeep = String(msgId) !== String(messageId);
          if (!shouldKeep) {
            console.log('Removing message:', msgId);
          }
          return shouldKeep;
        });
        console.log(`Messages after filter: ${prev.length} -> ${filtered.length}`);
        return filtered;
      });
    });

    socketRef.current.on('updateUsers', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('userJoined', ({ name, message }) => {
      console.log(name + message);
    });

    socketRef.current.on('userLeft', ({ name, message }) => {
      console.log(name + message);
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
      
      if (accessibleRooms.length > 0 && !currentRoom) {
        joinRoom(accessibleRooms[0]);
      }
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

  // WhatsApp/Instagram style date formatting
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

  // Get status for DM rooms
  const getDMStatus = () => {
    if (currentRoom?.type !== 'dm') return null;
    
    // Find the other participant
    const otherUser = currentRoom.participants?.find(p => p._id !== user?._id);
    if (!otherUser) return null;
    
    // Check if user is online
    const isOnline = onlineUsers.some(u => u.userId === otherUser._id);
    return {
      name: otherUser.name,
      isOnline
    };
  };

  // Check if we need to show date separator
  const shouldShowDateSeparator = (msg, index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    const msgDate = new Date(msg.createdAt || msg.time).toDateString();
    const prevDate = new Date(prevMsg.createdAt || prevMsg.time).toDateString();
    return msgDate !== prevDate;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-900 text-white overflow-hidden">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div className={`w-full md:w-72 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden ${currentRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Chat Rooms</h2>
          <button
            onClick={() => {
              setShowCreateRoom(true);
              fetchAvailableUsers();
            }}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors"
          >
            + Create Room
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-700 rounded-lg h-16" />
            ))}
          </div>
        )}

        {/* Room List */}
        {!loading && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Course Rooms */}
            {rooms.filter(r => r.type === 'course').length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase mb-2">Your Courses</h3>
                {rooms.filter(r => r.type === 'course').map((room) => (
                  <button
                    key={room._id}
                    onClick={() => joinRoom(room)}
                    className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
                      currentRoom?._id === room._id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <span className="font-medium">{getRoomDisplayName(room)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* DM Rooms */}
            {rooms.filter(r => r.type === 'dm').length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase mb-2">Direct Messages</h3>
                {rooms.filter(r => r.type === 'dm').map((room) => (
                  <button
                    key={room._id}
                    onClick={() => joinRoom(room)}
                    className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
                      currentRoom?._id === room._id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <span className="font-medium">{getRoomDisplayName(room)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom Rooms */}
            {rooms.filter(r => r.type === 'custom').length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase mb-2">Custom Rooms</h3>
                {rooms.filter(r => r.type === 'custom').map((room) => (
                  <div key={room._id} className="relative group">
                    <button
                      onClick={() => joinRoom(room)}
                      className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
                        currentRoom?._id === room._id
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <span className="font-medium">{room.name}</span>
                    </button>
                    {room.createdBy?._id === user._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoom(room._id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {rooms.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <p>No chat rooms available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area - full width on mobile */}
      <div className="flex-1 flex flex-col bg-slate-900 min-h-0">
        {currentRoom ? (
          <>
            {/* Header with back button for mobile */}
            <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800 flex items-center gap-3">
              <button 
                onClick={() => setCurrentRoom(null)}
                className="md:hidden p-2 hover:bg-slate-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white">{getRoomDisplayName(currentRoom)}</h3>
                {(() => {
                  const dmStatus = getDMStatus();
                  if (dmStatus) {
                    return (
                      <p className={`text-xs md:text-sm ${dmStatus.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                        {dmStatus.isOnline ? 'online' : 'offline'}
                      </p>
                    );
                  }
                  return (
                    <p className="text-xs md:text-sm text-slate-400">{currentRoom.type} • {onlineUsers.length} online</p>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, index) => {
                const isOwn = msg.senderName === user.name || msg.sender?._id === user._id;
                const msgTime = msg.createdAt || msg.time;
                const showDateSeparator = shouldShowDateSeparator(msg, index);
                
                return (
                  <>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full">
                          {formatMessageDate(msgTime)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] md:max-w-md rounded-lg p-3 relative ${
                          isOwn
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-700 text-white rounded-bl-none'
                        }`}
                        onClick={() => setShowMessageActions(showMessageActions === (msg.id || msg._id) ? null : (msg.id || msg._id))}
                      >
                        {/* Reply indicator */}
                        {msg.replyTo && (
                          <div className={`border-l-2 pl-2 mb-1 text-xs ${isOwn ? 'border-indigo-300 text-indigo-200' : 'border-indigo-400 text-indigo-300'}`}>
                            <span className="font-medium">{msg.replyTo.senderName || 'Unknown'}</span>
                            <p className="truncate opacity-80">{msg.replyTo.content}</p>
                          </div>
                        )}
                        {!isOwn && (
                          <p className="text-xs text-indigo-300 mb-1 font-medium">
                            {msg.senderName || msg.sender?.name || 'Unknown'}
                          </p>
                        )}
                        <p className="text-sm md:text-base break-words">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-60 text-right">{formatTime(msgTime)}</p>
                        
                        {/* Message Actions - show on click */}
                        {showMessageActions === (msg.id || msg._id) && (
                          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-0 -mt-8 flex bg-slate-800 rounded-lg shadow-lg overflow-hidden`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                              className="px-3 py-2 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Reply
                            </button>
                            {isOwn && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(msg); }}
                                className="px-3 py-2 hover:bg-red-600/20 text-xs text-red-400 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-slate-700 bg-slate-800">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-700/50 p-2 rounded-t-lg mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-xs text-slate-300">
                      Replying to <span className="text-indigo-300 font-medium">{replyingTo.senderName || replyingTo.sender?.name || 'Unknown'}</span>
                    </span>
                  </div>
                  <button type="button" onClick={cancelReply} className="text-slate-400 hover:text-white">
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
                  className="flex-1 px-3 md:px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm md:text-base"
                />
                <button
                  type="submit"
                  className="px-4 md:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="hidden md:inline">Send</span>
                  <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-4xl mb-4">💬</p>
              <h2 className="text-lg md:text-xl text-white">Select a chat room</h2>
              <p className="text-slate-400 mt-2 text-sm md:text-base">Choose a room to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Custom Room</h2>
            <form onSubmit={createCustomRoom}>
              <div className="mb-4">
                <label className="block text-slate-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Study Group"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-slate-300 mb-2">Invite Users (optional)</label>
                <div className="max-h-40 overflow-y-auto border border-slate-600 rounded p-2">
                  {availableUsers.map((u) => (
                    <label key={u._id} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitedUsers.includes(u._id)}
                        onChange={() => toggleUserInvite(u._id)}
                        className="mr-2"
                      />
                      <span className="text-white">{u.name} ({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Users to Room</h2>
            <p className="text-slate-400 mb-4">Select users to add to "{currentRoom?.name}"</p>
            <div className="mb-4 max-h-60 overflow-y-auto border border-slate-600 rounded p-2">
              {availableUsers
                .filter(u => {
                  const memberIds = currentRoom?.members?.map(m => m.user?._id) || [];
                  return !memberIds.includes(u._id);
                })
                .map((u) => (
                  <label key={u._id} className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usersToAdd.includes(u._id)}
                      onChange={() => toggleUserToAdd(u._id)}
                      className="mr-2"
                    />
                    <span className="text-white">{u.name} ({u.role})</span>
                  </label>
                ))}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddUsers(false);
                  setUsersToAdd([]);
                }}
                className="px-4 py-2 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addUsersToRoom}
                disabled={usersToAdd.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
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
