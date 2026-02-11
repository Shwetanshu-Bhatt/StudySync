import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Chat = () => {
  const { user } = useAuth();
  const { socket, messages, onlineUsers, sendMessage, isConnected } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage);
      setInputMessage('');
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

  return (
    <div className="card mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{getRoomName()}</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Online ({onlineUsers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((u) => (
            <span
              key={u.socketId}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {u.name}
            </span>
          ))}
        </div>
      </div>

      <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`mb-2 ${
                msg.senderName === user.name ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderName === user.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {msg.senderName} •{' '}
                  {new Date(msg.time).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
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
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
