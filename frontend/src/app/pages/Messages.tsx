import { useState } from 'react';
import { userMessages } from '../data/mockData';
import { Message } from '../types';
import { MessageSquare, Send, Inbox } from 'lucide-react';

export function Messages() {
  const [messages, setMessages] = useState<Message[]>(userMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    // Mark as read
    setMessages(prev =>
      prev.map(m =>
        m.id === message.id ? { ...m, read: true } : m
      )
    );
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: String(messages.length + 1),
        from: 'You',
        subject: 'Customer Inquiry',
        message: newMessage,
        timestamp: new Date(),
        read: true,
      };
      setMessages([message, ...messages]);
      setNewMessage('');
      setSelectedMessage(message);
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">Messages</h1>
        <p className="text-gray-600">
          Communicate with parking support and manage notifications
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`font-medium text-sm ${!message.read ? 'text-blue-600' : ''}`}>
                      {message.from}
                    </p>
                    {!message.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{message.subject}</p>
                  <p className="text-xs text-gray-600 truncate">{message.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleDateString()} •{' '}
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold mb-2">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>From: {selectedMessage.from}</span>
                  <span>•</span>
                  <span>
                    {selectedMessage.timestamp.toLocaleDateString()} at{' '}
                    {selectedMessage.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Inbox className="w-16 h-16 mx-auto mb-4" />
                <p>Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Button */}
      <div className="mt-6">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          New Message
        </button>
      </div>
    </div>
  );
}
