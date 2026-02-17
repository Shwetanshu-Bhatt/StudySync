import { createContext, useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const API_URL = (() => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '').replace(/\/api$/, '');
    }
    return 'http://localhost:5000';
  })();

  const getRoom = async () => {
    if (!user) return null;
    
    // For students - try to get their course-based chat room
    if (user.role === 'student' && user.course) {
      try {
        // Check if a course room exists, if not return null
        const response = await axios.get(`${API_URL}/api/chat/rooms`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Find a room where type is 'course' and it matches user's course
        const courseRoom = response.data.rooms?.find(
          r => r.type === 'course' && r.course?._id === user.course
        );
        
        if (courseRoom) {
          return courseRoom._id;
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    }
    
    return null;
  };

  const fetchMessages = async () => {
    const roomId = await getRoom();
    if (!roomId) {
      console.log('No chat room available for this user');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        params: {
          lastMessageId: lastMessageIdRef.current
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.messages && response.data.messages.length > 0) {
        setMessages((prev) => {
          const newMessages = response.data.messages.filter(
            (msg) => !prev.find((p) => p._id === msg._id)
          );
          return [...prev, ...newMessages];
        });

        // Update last message ID for polling
        const lastMsg = response.data.messages[response.data.messages.length - 1];
        if (lastMsg) {
          lastMessageIdRef.current = lastMsg._id;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (messageText) => {
    const roomId = await getRoom();
    if (!roomId || !messageText.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/rooms/${roomId}/messages`,
        { content: messageText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        lastMessageIdRef.current = response.data.message._id;
      }

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchMessages();

      // Set up polling (every 3 seconds)
      pollingIntervalRef.current = setInterval(fetchMessages, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      // Clear messages when user logs out
      setMessages([]);
      lastMessageIdRef.current = null;
    }
  }, [user]);

  const value = {
    messages,
    sendMessage,
    isLoading,
    setMessages,
    room: null // Room is fetched dynamically
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
