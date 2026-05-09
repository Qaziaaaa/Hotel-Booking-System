import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatbotAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm your hotel booking assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Hide chatbot on auth pages
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isAuthPage) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.chat(userMessage, sessionId);
      const botResponse = response.data.data;
      setMessages(prev => [...prev, {
        role: 'bot',
        content: botResponse.message,
        actions: botResponse.actions,
        data: botResponse.data
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.link) {
      window.location.href = action.link;
    } else if (action.value) {
      setInput(action.value);
    }
  };

  const quickReplies = [
    'Find hotels in New York',
    'Check my bookings',
    'Get recommendations',
    'Help',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-primary-container text-on-primary px-5 py-3 rounded-full shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 font-sans font-semibold text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Ask Assistant
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-96 h-[520px] flex flex-col overflow-hidden border border-outline-variant/30">
          {/* Header */}
          <div className="bg-primary-container text-on-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h3 className="font-sans font-semibold text-sm">Booking Assistant</h3>
                <p className="font-sans text-xs text-white/70">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[82%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] ${
                      msg.role === 'user' ? 'text-on-primary' : 'text-on-surface-variant'
                    }`}>
                      {msg.role === 'user' ? 'person' : 'smart_toy'}
                    </span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-container text-on-primary rounded-tr-sm'
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.actions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => handleActionClick(action)}
                            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
                          >
                            {action.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length < 3 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-outline-variant/20 bg-surface-container-lowest">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(reply)}
                  className="font-sans text-xs bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface px-3 py-1.5 rounded-full transition-colors border border-outline-variant/30"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border border-outline-variant rounded-full font-sans text-sm text-on-surface bg-surface focus:outline-none focus:border-secondary transition-colors placeholder-on-surface-variant/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-primary-container text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
