import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserMessages,
  getThread,
  sendMessage,
  type MessageResponse,
} from '../lib/messageService';
import { MessageSquare, Send, Inbox, Plus, X } from 'lucide-react';

interface ThreadPreview {
  threadId: string;
  subject: string;
  lastMessage: MessageResponse;
  messageCount: number;
  hasUnread: boolean;
}

export function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageResponse[]>([]);
  const [replyText, setReplyText] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const messages = await getUserMessages(user.id);

      // Group by threadId
      const threadMap = new Map<string, MessageResponse[]>();
      for (const msg of messages) {
        const existing = threadMap.get(msg.threadId) || [];
        existing.push(msg);
        threadMap.set(msg.threadId, existing);
      }

      const previews: ThreadPreview[] = Array.from(threadMap.entries()).map(([threadId, msgs]) => {
        const sorted = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
          threadId,
          subject: sorted[sorted.length - 1].subject,
          lastMessage: sorted[0],
          messageCount: msgs.length,
          hasUnread: msgs.some(m => !m.read),
        };
      });

      previews.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
      setThreads(previews);
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const handleSelectThread = async (threadId: string) => {
    setSelectedThread(threadId);
    setShowNewMessage(false);
    try {
      const msgs = await getThread(threadId);
      setThreadMessages(msgs);
    } catch {
      setError('Failed to load thread');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setError('');
    try {
      const thread = threads.find(t => t.threadId === selectedThread);
      await sendMessage({
        subject: thread?.subject || 'Reply',
        body: replyText,
        threadId: selectedThread,
      });
      setReplyText('');
      handleSelectThread(selectedThread);
      fetchMessages();
    } catch {
      setError('Failed to send reply');
    }
  };

  const handleNewMessage = async () => {
    if (!newSubject.trim() || !newBody.trim()) return;
    setError('');
    try {
      const msg = await sendMessage({ subject: newSubject, body: newBody });
      setNewSubject('');
      setNewBody('');
      setShowNewMessage(false);
      fetchMessages();
      handleSelectThread(msg.threadId);
    } catch {
      setError('Failed to send message');
    }
  };

  const unreadCount = threads.filter(t => t.hasUnread).length;

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with parking support and manage notifications</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Thread List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">{unreadCount}</span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  onClick={() => handleSelectThread(thread.threadId)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedThread === thread.threadId ? 'bg-blue-50' : ''
                  } ${thread.hasUnread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`font-medium text-sm ${thread.hasUnread ? 'text-blue-600' : ''}`}>
                      {thread.lastMessage.senderName}
                    </p>
                    {thread.hasUnread && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </div>
                  <p className="text-sm font-medium mb-1">{thread.subject}</p>
                  <p className="text-xs text-gray-600 truncate">{thread.lastMessage.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(thread.lastMessage.createdAt).toLocaleDateString()} {' '}
                    {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
              {threads.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No messages yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Detail / New Message */}
        <div className="md:col-span-2">
          {showNewMessage ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">New Message</h2>
                <button onClick={() => setShowNewMessage(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="What do you need help with?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Message</label>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    rows={6}
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  onClick={handleNewMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          ) : selectedThread && threadMessages.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold mb-2">{threads.find(t => t.threadId === selectedThread)?.subject}</h2>
                <p className="text-sm text-gray-600">{threadMessages.length} message{threadMessages.length > 1 ? 's' : ''}</p>
              </div>
              <div className="p-6 flex-1 space-y-4 max-h-[400px] overflow-y-auto">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-lg ${msg.fromSupport ? 'bg-blue-50 ml-0 mr-8' : 'bg-gray-50 ml-8 mr-0'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{msg.fromSupport ? 'Support' : msg.senderName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleReply}
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
      {!showNewMessage && (
        <div className="mt-6">
          <button
            onClick={() => { setShowNewMessage(true); setSelectedThread(null); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
        </div>
      )}
    </div>
  );
}
