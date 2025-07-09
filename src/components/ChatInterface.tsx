
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, ExternalLink, MapPin, FileText, Loader2 } from 'lucide-react';
import { RAGService } from '../services/RAGService';
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    confidence: number;
  }>;
  entities?: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
}

interface ChatInterfaceProps {
  isSystemReady: boolean;
  onSystemReady: (ready: boolean) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isSystemReady, onSystemReady }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm the MOSDAC AI Assistant. I can help you find information about ISRO satellites, oceanographic data, meteorological products, and more. Try asking me about INSAT-3D, rainfall data, or any specific mission!",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragService] = useState(() => new RAGService());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize RAG service
    const initializeSystem = async () => {
      if (isSystemReady) return;
      
      try {
        console.log('Initializing RAG Service...');
        await ragService.initialize();
        onSystemReady(true);
        
        toast({
          title: "System Initialized",
          description: "AI HelpBot is ready with Groq LLM support!",
        });
      } catch (error) {
        console.error('Failed to initialize RAG service:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize AI system. Some features may be limited.",
          variant: "destructive",
        });
      }
    };

    initializeSystem();
  }, [ragService, isSystemReady, onSystemReady]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await ragService.askQuestion(inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources,
        entities: response.entities,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error processing your question. Please try again or rephrase your query.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What is INSAT-3D and what data does it provide?",
    "How can I access rainfall data from MOSDAC?",
    "Tell me about Oceansat-3 mission",
    "What are the data access policies for MOSDAC?",
    "Show me information about Megha-Tropiques satellite",
    "How do I download satellite data?",
    "What instruments are on INSAT-3D?",
    "Explain ocean color monitoring"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Messages */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>MOSDAC AI Assistant</span>
              {!isSystemReady && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'bot' && <Bot className="h-4 w-4 mt-1 text-blue-600" />}
                        {message.sender === 'user' && <User className="h-4 w-4 mt-1" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Entities */}
                          {message.entities && message.entities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.entities.map((entity, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {entity.text} ({entity.label})
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="bg-white/10 rounded p-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{source.title}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(source.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs mt-1 opacity-80">{source.snippet}</p>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-xs hover:underline mt-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View Source</span>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs opacity-60 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Input Area */}
            <div className="mt-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isSystemReady ? "Ask me about MOSDAC data, satellites, or missions..." : "System initializing..."}
                  disabled={!isSystemReady || isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !isSystemReady || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Suggested Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="w-full text-left justify-start h-auto p-2 text-xs"
                  onClick={() => setInputValue(question)}
                  disabled={!isSystemReady}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Browse Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Geospatial Data
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit MOSDAC Portal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Knowledge Base</span>
                <Badge variant={isSystemReady ? "default" : "secondary"}>
                  {isSystemReady ? "Ready" : "Loading"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Model</span>
                <Badge variant={isSystemReady ? "default" : "secondary"}>
                  {isSystemReady ? "Online" : "Initializing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vector Search</span>
                <Badge variant={isSystemReady ? "default" : "secondary"}>
                  {isSystemReady ? "Active" : "Preparing"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
