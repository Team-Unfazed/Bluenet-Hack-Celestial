import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Fish,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Mic,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../utils/api';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your BlueNet AI Assistant. I can help you with fishing regulations, market prices, weather forecasts, and best practices. What would you like to know?',
      timestamp: new Date(),
      suggestions: [
        'What are the current fishing regulations?',
        'Show me the best market prices today',
        'What\'s the weather forecast for fishing?',
        'Help me with catch compliance'
      ]
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText = null) => {
    const text = messageText || currentMessage.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.chatWithAssistant({
        query: text,
        conversation_id: conversationId
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.answer,
        timestamp: new Date(),
        suggestions: response.data.follow_up_questions || [],
        mandi_recommendations: response.data.mandi_recommendations,
        context_used: response.data.context_used || []
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I\'m having trouble connecting to my knowledge base right now. Please try again in a moment.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your BlueNet AI Assistant. I can help you with fishing regulations, market prices, weather forecasts, and best practices. What would you like to know?',
        timestamp: new Date(),
        suggestions: [
          'What are the current fishing regulations?',
          'Show me the best market prices today',
          'What\'s the weather forecast for fishing?',
          'Help me with catch compliance'
        ]
      }
    ]);
    setConversationId(null);
    setCurrentMessage('');
  };

  const quickQuestions = [
    { icon: Fish, text: 'Best fishing spots today?', category: 'forecast' },
    { icon: TrendingUp, text: 'Current pomfret prices?', category: 'market' },
    { icon: AlertTriangle, text: 'Weather warnings?', category: 'safety' },
    { icon: Lightbulb, text: 'Fishing tips for beginners', category: 'tips' }
  ];

  const formatMessage = (content) => {
    // Simple formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-gray-600 mt-1">
            Get expert guidance on fishing, regulations, and market insights
          </p>
        </div>
        <Button variant="outline" onClick={clearConversation}>
          <RefreshCw className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Quick Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Questions</CardTitle>
          <CardDescription>Get instant answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickQuestions.map((question, index) => {
              const IconComponent = question.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => handleSendMessage(question.text)}
                  disabled={isLoading}
                >
                  <IconComponent className="w-4 h-4 mr-2 text-sky-600" />
                  <span className="text-sm">{question.text}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-sky-600" />
              <CardTitle className="text-lg">Chat with AI Assistant</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Powered by RAG + Gemini
            </Badge>
          </div>
        </CardHeader>
        
        <Separator />
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-sky-600 text-white ml-2' 
                      : 'bg-gray-100 text-gray-600 mr-2'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-sky-600 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    
                    {/* Mandi Recommendations */}
                    {message.mandi_recommendations && !message.mandi_recommendations.error && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <p className="text-xs font-medium text-gray-600 mb-1">Best Mandi Recommendation:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {message.mandi_recommendations.mandi} ({message.mandi_recommendations.state})
                        </p>
                        <p className="text-xs text-gray-600">
                          ₹{message.mandi_recommendations.price_inr}/kg • {message.mandi_recommendations.distance_km} km away
                        </p>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium opacity-80">Suggested questions:</p>
                        <div className="flex flex-col space-y-1">
                          {message.suggestions.slice(0, 3).map((suggestion, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="h-auto p-2 text-xs text-left justify-start bg-white hover:bg-gray-50 text-gray-700"
                              onClick={() => handleSendMessage(suggestion)}
                              disabled={isLoading}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        {/* Input */}
        <div className="p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              placeholder="Ask me anything about fishing, regulations, prices, or weather..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Powered by advanced RAG technology with real-time fishing data • Press Enter to send
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;