import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('joinRoom', {
          userId: user.id,
          name: user.name,
          role: user.role
        });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('updateUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('loadMessages', (msgs) => {
        setMessages(msgs);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = (message) => {
    if (socket) {
      socket.emit('sendMessage', { message });
    }
  };

  const value = {
    socket,
    messages,
    setMessages,
    onlineUsers,
    isConnected,
    sendMessage
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
