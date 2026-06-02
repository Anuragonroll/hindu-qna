import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMessageSquare, FiExternalLink, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [sessions, setSessions] = useState([]);
  const [activeSessionLabel, setActiveSessionLabel] = useState('New chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/ai/sessions');
      setSessions(res.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const loadSession = async (sid) => {
    setSessionId(sid);
    setActiveSessionLabel(new Date(sid.replace('session_', '')).toLocaleString());
    try {
      const res = await api.get(`/ai/history/${sid}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const startNewChat = () => {
    const sid = `session_${Date.now()}`;
    setSessionId(sid);
    setActiveSessionLabel('New chat');
    setMessages([]);
  };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      await api.delete(`/ai/sessions/${sid}`);
      setSessions(prev => prev.filter(s => s.sessionId !== sid));
      if (sid === sessionId) startNewChat();
    } catch {
      toast.error('Could not delete session');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage, sessionId });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data.message,
        relatedQuestions: res.data.relatedQuestions,
        sources: res.data.sources || []
      }]);
    } catch (error) {
      toast.error('Error getting response from AI');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        sources: []
      }]);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">AI Hindu Assistant</h1>
        <p className="text-gray-600 mb-6">Please login to use the AI chat feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">AI Hindu Assistant</h1>
      <p className="text-sm text-gray-500 mb-6">Chatting in: <span className="font-medium">{activeSessionLabel}</span></p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <button
              onClick={startNewChat}
              className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 mb-3"
            >
              + New chat
            </button>
            <h3 className="font-bold mb-2 text-sm text-gray-700">Past sessions</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-500">No previous chats</p>
              ) : sessions.map(session => (
                <div
                  key={session.sessionId}
                  onClick={() => loadSession(session.sessionId)}
                  className={`flex items-center justify-between text-sm px-2 py-1.5 rounded cursor-pointer group ${
                    session.sessionId === sessionId
                      ? 'bg-orange-100 text-orange-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => deleteSession(session.sessionId, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-md h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <FiMessageSquare size={48} className="mx-auto mb-4 text-orange-300" />
                  <p>Ask me anything about Hinduism, scriptures, or practices.</p>
                  <p className="text-sm mt-2">I can cite verses from Bhagavad Gita, Upanishads, Puranas, and more.</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    
                    {msg.sources?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2">References:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full hover:bg-orange-100 border border-orange-200"
                            >
                              <FiExternalLink size={10} />
                              {src.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {msg.relatedQuestions?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Related questions:</p>
                        <ul className="text-xs space-y-1">
                          {msg.relatedQuestions.map(q => (
                            <li key={q._id}>
                              <a href={`/questions/${q._id}`} className="text-orange-600 hover:underline">
                                {q.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2"
                  placeholder="Ask about Hinduism..."
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <FiSend />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
