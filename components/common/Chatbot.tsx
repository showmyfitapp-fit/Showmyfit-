import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Sparkles,
  ShoppingBag,
  Search,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'quick-action';
  suggestions?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    icon: React.ReactNode;
  }>;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! 👋 Welcome to Showmyfit! I\'m here to help you find the perfect products from local stores. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      suggestions: [
        'Find products near me',
        'Help with an order',
        'Store recommendations',
        'Track my package'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = generateBotResponse(text.trim());
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const generateBotResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();
    let response: Message;

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      response = {
        id: Date.now().toString(),
        text: 'Hello! 😊 I\'m excited to help you discover amazing products from local stores. What are you looking for today?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        suggestions: [
          'Show me electronics',
          'Find fashion stores',
          'Best deals today',
          'Track my order'
        ]
      };
    } else if (input.includes('product') || input.includes('buy') || input.includes('shop')) {
      response = {
        id: Date.now().toString(),
        text: 'Great! I can help you find products from our local stores. Here are some popular categories:',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        quickActions: [
          {
            label: 'Electronics',
            action: 'electronics',
            icon: <Sparkles className="w-4 h-4" />
          },
          {
            label: 'Fashion',
            action: 'fashion',
            icon: <ShoppingBag className="w-4 h-4" />
          },
          {
            label: 'Search Products',
            action: 'search',
            icon: <Search className="w-4 h-4" />
          }
        ]
      };
    } else if (input.includes('order') || input.includes('track') || input.includes('delivery')) {
      response = {
        id: Date.now().toString(),
        text: 'I can help you with your order! To track your package, I\'ll need your order number. You can also check your order status in your profile.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        suggestions: [
          'Check order status',
          'Update delivery address',
          'Cancel order',
          'Contact seller'
        ]
      };
    } else if (input.includes('help') || input.includes('support')) {
      response = {
        id: Date.now().toString(),
        text: 'I\'m here to help! You can reach our support team through these channels:',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        quickActions: [
          {
            label: 'Call Support',
            action: 'call',
            icon: <Phone className="w-4 h-4" />
          },
          {
            label: 'Email Support',
            action: 'email',
            icon: <Mail className="w-4 h-4" />
          },
          {
            label: 'FAQ',
            action: 'faq',
            icon: <HelpCircle className="w-4 h-4" />
          }
        ]
      };
    } else if (input.includes('near') || input.includes('location') || input.includes('local')) {
      response = {
        id: Date.now().toString(),
        text: 'Perfect! I can help you find stores near your location. Just allow location access or tell me your city, and I\'ll show you the closest stores with great products!',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        suggestions: [
          'Allow location access',
          'Enter my city',
          'Show all stores',
          'Best rated stores'
        ]
      };
    } else if (input.includes('deal') || input.includes('offer') || input.includes('sale')) {
      response = {
        id: Date.now().toString(),
        text: 'Awesome! We have amazing deals running right now! 🎉 Check out our current offers:',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        suggestions: [
          'Electronics up to 50% off',
          'Fashion week specials',
          'Home & Living deals',
          'Flash sales'
        ]
      };
    } else {
      response = {
        id: Date.now().toString(),
        text: 'I understand you\'re asking about "' + userInput + '". While I\'m still learning, I can definitely help you with product searches, order tracking, store recommendations, and general support. What would you like to explore?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        suggestions: [
          'Find products',
          'Help with orders',
          'Store recommendations',
          'Contact support'
        ]
      };
    }

    return response;
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'electronics':
        handleSendMessage('Show me electronics');
        break;
      case 'fashion':
        handleSendMessage('Show me fashion items');
        break;
      case 'search':
        handleSendMessage('Help me search for products');
        break;
      case 'call':
        handleSendMessage('I need to call support');
        break;
      case 'email':
        handleSendMessage('I want to email support');
        break;
      case 'faq':
        handleSendMessage('Show me frequently asked questions');
        break;
      default:
        handleSendMessage(action);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-6 z-[9999] bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group chatbot-button-pulse"
          aria-label="Need help? Chat with us!"
        >
          {/* Better Chat Icon with Speech Bubble */}
          <div className="relative">
            <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            {/* Animated dots inside chat */}
            <div className="absolute -bottom-1 -right-1 flex space-x-0.5">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Simple notification dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center chatbot-notification-badge">
            <span className="text-xs text-white font-bold">1</span>
          </div>
          
          {/* Floating "Hi!" text */}
          <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <div className="text-sm font-medium">Hi! Need help? 👋</div>
            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></div>
          </div>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`fixed bottom-32 right-6 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 chatbot-container chatbot-window ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Showmyfit Assistant</h3>
                <p className="text-xs text-blue-100">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-4 chatbot-messages">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-r from-green-500 to-blue-500'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-2xl px-4 py-3 chatbot-message-bubble ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white user'
                          : 'bg-gray-100 text-gray-800 bot'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>

                        {/* Suggestions */}
                        {message.suggestions && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors chatbot-suggestion"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick Actions */}
                        {message.quickActions && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {message.quickActions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuickAction(action.action)}
                                className="flex items-center space-x-2 text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors chatbot-quick-action"
                              >
                                {action.icon}
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="chatbot-typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm chatbot-input chatbot-transition"
                  />
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
