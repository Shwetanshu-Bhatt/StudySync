import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Chat = () => {
  const { user } = useAuth();
  const { messages, sendMessage, room } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isSending) {
      setIsSending(true);
      try {
        await sendMessage(inputMessage);
        setInputMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const getRoomName = () => {
    switch (user.role) {
      case 'student':
        return 'Student Room';
      case 'teacher':
        return 'Teacher Room';
      case 'admin':
        return 'Admin Room';
      default:
        return 'Chat Room';
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="card mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{getRoomName()}</h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Room` : 'Chat'}
          </span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
        ) : (
          <div ref={messagesContainerRef}>
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`mb-2 ${
                  msg.senderName === user?.name ? 'text-right' : ''
                }`}
              >
                <div
                  className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderName === user?.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 border'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderName === user?.name ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.senderName} • {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
          disabled={!user || isSending}
        />
        <button
          type="submit"
          disabled={!user || !inputMessage.trim() || isSending}
          className="btn btn-primary"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
