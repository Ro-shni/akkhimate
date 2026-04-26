import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Loader2, BookOpen } from 'lucide-react';
import { ChatMessage, LearningModule, ModelProvider } from '../types';
import { askQuestion } from '../services/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Mermaid } from './Mermaid';

interface ChatViewProps {
  modules: LearningModule[];
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onMessage?: () => void;
  modelProvider: ModelProvider;
}

export function ChatView({ modules, messages, onUpdateMessages, onMessage, modelProvider }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I've indexed your sources. What would you like to focus on today? I can explain complex diagrams from your scans or help you summarize your PDFs.",
      timestamp: Date.now()
    } as ChatMessage
  ] : messages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    onUpdateMessages(newMessages);
    setInput('');
    setIsLoading(true);
    onMessage?.();

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }]
      }));

      const answer = await askQuestion(input, modules, history, modelProvider);
      
      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: Date.now()
      };
      
      onUpdateMessages([...newMessages, assistantMsg]);
    } catch (error) {
      console.error(error);
      onUpdateMessages([...newMessages, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please ensure your modules are uploaded and try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {displayMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-2xl",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 text-[10px] font-bold uppercase tracking-widest",
                msg.role === 'user' ? "bg-brand-teal/20 text-brand-teal border border-brand-teal/40" : "bg-white/5 text-slate-400 border border-white/10"
              )}>
                {msg.role === 'user' ? "ME" : "AI"}
              </div>
              
              <div className={cn(
                "rounded-2xl px-5 py-4",
                msg.role === 'user' 
                  ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/10 rounded-tr-none" 
                  : "bg-bg-card text-slate-300 border border-white/5 rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match && match[1] === 'mermaid') {
                          return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </Markdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex gap-4 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Loader2 size={12} className="text-brand-teal animate-spin" />
            </div>
            <div className="bg-bg-card rounded-2xl px-6 py-4 border border-white/5 w-24 rounded-tl-none animate-pulse" />
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="relative bg-bg-card border border-white/10 rounded-2xl p-2 focus-within:border-brand-teal/50 transition-all shadow-xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about your documents..."
            className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 bg-brand-teal p-2 rounded-xl text-white hover:bg-brand-teal-dark disabled:opacity-50 transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
