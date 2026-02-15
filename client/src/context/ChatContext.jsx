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

  const API_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : 'http://localhost:5000';

  const getRoom = () => {
    if (!user) return null;
    return `${user.role}-room`;
  };

  const fetchMessages = async () => {
    const room = getRoom();
    if (!room) return;

    try {
      const response = await axios.get(`${API_URL}/api/chat/messages`, {
        params: {
          room,
          lastMessageId: lastMessageIdRef.current
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.data.length > 0) {
        setMessages((prev) => {
          const newMessages = response.data.data.filter(
            (msg) => !prev.find((p) => p._id === msg._id)
          );
          return [...prev, ...newMessages];
        });

        // Update last message ID for polling
        const lastMsg = response.data.data[response.data.data.length - 1];
        if (lastMsg) {
          lastMessageIdRef.current = lastMsg._id;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (messageText) => {
    const room = getRoom();
    if (!room || !messageText.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/send`,
        { message: messageText, room },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data]);
        lastMessageIdRef.current = response.data.data._id;
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
    room: getRoom()
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
