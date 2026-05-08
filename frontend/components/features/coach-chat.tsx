'use client'

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

const SYSTEM_PROMPT = `You are LifeDecoder — a smart, friendly, and deeply knowledgeable AI guide built specifically for young adults turning 18. You help them navigate adult life with confidence and clarity.

Your areas of expertise:
1. **Legal Rights & Laws** — voting rights, contracts, age of majority, criminal vs civil law, tenant rights, consumer protection laws, ID/documents, NDAs, liability, what to do if arrested, rights during police interactions
2. **Rent & Housing** — how to read a lease/rental agreement, red flags in contracts, security deposits, tenant vs landlord rights, eviction process, renters insurance, utility setup, roommate agreements
3. **Jobs & Employment** — how to apply for jobs, interview tips, understanding an offer letter, pay stubs, taxes (W-2, W-4, 1099), minimum wage, overtime, workplace rights, how to quit properly, unemployment
4. **Finance & Banking** — opening a bank account, credit cards, credit scores, budgeting, loans, student debt, FAFSA, savings, investing basics, scams to avoid
5. **Healthcare** — health insurance basics, how to find a doctor, prescription coverage, mental health resources, understanding medical bills, HIPAA privacy rights
6. **Education** — college applications, financial aid, community college options, trade school, navigating student loans, academic rights
7. **Government & Civic Life** — voter registration, taxes (how to file), getting a passport, Social Security, benefits programs, jury duty
8. **Relationships & Safety** — understanding consent laws, domestic abuse resources, online safety, privacy rights, stalking laws, harassment reporting
9. **Transportation** — driver's license, car insurance, understanding auto loans, public transit

Your tone: Like a brilliant older sibling or mentor — warm, honest, non-judgmental, clear, and empowering. Never preachy. Use plain language. Break things down step by step. Always encourage them to seek a licensed professional (lawyer, doctor, accountant) for serious matters, but still give them the knowledge to understand what's going on.

When asked about laws, mention that laws vary by country/state, and ask for their location if needed for accuracy.

Start every first response with energy and welcome them to adulthood!`;

const SUGGESTIONS = [
  { icon: "🏠", text: "Explain a rental agreement to me", category: "Housing" },
  { icon: "⚖️", text: "What are my rights if police stop me?", category: "Legal" },
  { icon: "💼", text: "How do I understand my first job offer?", category: "Jobs" },
  { icon: "💳", text: "How do I build credit from scratch?", category: "Finance" },
  { icon: "🏥", text: "How does health insurance work?", category: "Healthcare" },
  { icon: "🗳️", text: "How do I register to vote?", category: "Civic" },
  { icon: "🚗", text: "What should I know about car insurance?", category: "Transportation" },
  { icon: "📝", text: "Help me understand my W-4 form", category: "Taxes" },
];

interface Message {
  type: 'user' | 'ai';
  text: string;
  typing?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<ConversationMessage[]>([]);
  const textareaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Test backend connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/health`);
        if (response.ok) {
          console.log('✅ Backend connection successful');
        } else {
          console.error('❌ Backend connection failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Backend connection error:', error);
      }
    };
    
    testConnection();
  }, []);

  const typeMessage = async (text: string, onComplete: (text: string) => void) => {
    setIsTyping(true);
    setTypingText("");
    const chunkSize = 3;
    for (let i = 0; i <= text.length; i += chunkSize) {
      await new Promise(r => setTimeout(r, 8));
      setTypingText(text.slice(0, i));
    }
    setTypingText(text);
    setIsTyping(false);
    onComplete(text);
  };

  const sendMessage = async (messageText?: string) => {
    const userMsg = messageText || input.trim();
    if (!userMsg || loading) return;

    setInput("");
    setStarted(true);

    const userMessage: ConversationMessage = { role: "user", content: userMsg };
    conversationHistory.current.push(userMessage);
    setMessages(prev => [...prev, { type: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await api.sendCoachMessage(userMsg, conversationHistory.current.length > 2 ? 'current' : undefined);
      
      const aiText = response.response || "Sorry, I couldn't get a response. Please try again.";

      const assistantMessage: ConversationMessage = { role: "assistant", content: aiText };
      conversationHistory.current.push(assistantMessage);

      setLoading(false);
      setMessages(prev => [...prev, { type: "ai", text: "", typing: true }]);

      await typeMessage(aiText, (finalText: string) => {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { type: "ai", text: finalText, typing: false } : m
          )
        );
      });
    } catch (err) {
      console.error('Coach chat error:', err);
      setLoading(false);
      
      let errorMessage = "⚠️ Connection error. Please check your internet and try again.";
      
      if (err instanceof Error) {
        if (err.message.includes('Cannot connect to server')) {
          errorMessage = "⚠️ Cannot connect to the AI coach. Please make sure the backend server is running.";
        } else if (err.message.includes('Not authorized')) {
          errorMessage = "⚠️ Please sign in to use the AI coach.";
        } else if (err.message.includes('HTTP 500')) {
          errorMessage = "⚠️ The AI coach is temporarily unavailable. Please try again in a moment.";
        }
      }
      
      setMessages(prev => [...prev, {
        type: "ai",
        text: errorMessage,
        typing: false
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line: string, i: number) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return `<div class="ml-4 my-1">• ${line.trim().slice(2)}</div>`;
      }
      if (/^\d+\./.test(line.trim())) {
        return `<div class="my-1">${line.trim()}</div>`;
      }
      if (line.trim() === "") return '<div class="h-2"></div>';
      return `<span>${line}</span><br/>`;
    }).join("");
  };
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#FFFFFF] via-[#F8F8F9] to-[#DDDDE6] dark:from-[#111439] dark:via-[#111439] ">
      {/* Hero / Landing */}
      {!started && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-6xl mb-6 animate-bounce">🚀</div>
          <h2 className="text-4xl font-bold text-center mb-4 text-[#111439]">
            Welcome to <span className="text-[#252866]">Adulthood.</span>
          </h2>
          <h3 className="text-xl font-semibold text-center mb-4 text-[#252866]">
            Don&apos;t worry — we&apos;ve got you covered.
          </h3>
          <p className="text-[#111439] text-center max-w-2xl mb-8 text-base leading-relaxed">
            Ask me anything about rent, laws, jobs, taxes, health insurance, and all the essential life skills you need to master.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-4xl px-6">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.text)}
                className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-200 text-left group border border-[#DDDDE6] hover:border-[#111439] dark:hover:border-gray-500 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{s.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1 text-[#111439]">{s.text}</div>
                  <div className="text-xs text-[#111439] uppercase tracking-wide font-semibold">{s.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {started && (
        <div className="p-4 pb-32">
          <div className="space-y-4 w-full max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                {msg.type === "ai" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#111439] to-[#111439] rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    🎓
                  </div>
                )}
                <div className={`max-w-2xl px-4 py-3 rounded-xl ${
                  msg.type === "user"
                    ? "bg-gradient-to-r from-[#252866] to-[#111439] text-white rounded-br-md shadow-lg"
                    : "bg-white/90 backdrop-blur-sm text-[#111439] rounded-bl-md border border-[#DDDDE6] shadow-lg"
                }`}>
                  {msg.type === "ai" ? (
                    <div 
                      className="prose prose-sm max-w-none text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: formatText(msg.typing && i === messages.length - 1 ? typingText : msg.text)
                      }} 
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
                {msg.type === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#DDDDE6] to-[#F8F8F9] rounded-lg flex items-center justify-center text-sm flex-shrink-0 border border-[#111439]">
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#111439] to-[#111439] rounded-lg flex items-center justify-center text-sm">
                  🎓
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl rounded-bl-md border border-[#DDDDE6] shadow-lg flex gap-2">
                  <div className="w-2 h-2 bg-[#111439] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#111439] rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-[#111439] rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Fixed Input Area - Borderless */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-sm z-50 border-t border-[#F8F8F9]">
        <div className="px-4 py-3 max-w-4xl mx-auto">
          <div className="flex gap-2 items-center bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 border border-[#DDDDE6] shadow-lg">
            <MessageSquare className="w-4 h-4 text-[#111439] flex-shrink-0" />
            <input
              ref={textareaRef as any}
              className="flex-1 bg-transparent border-none outline-none text-[#111439] placeholder-[#111439] dark:placeholder-gray-400 text-sm py-1"
              placeholder="Ask about rent, laws, jobs, taxes, or anything adulting..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-gradient-to-r from-[#252866] to-[#111439] hover:from-[#111439] hover:to-[#111439] dark:hover:from-blue-600 dark:hover:to-blue-700 rounded-full flex items-center justify-center disabled:opacity-50 transition-all duration-200 disabled:hover:from-[#252866] disabled:hover:to-[#111439] flex-shrink-0 group shadow-md"
            >
              <Sparkles className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}