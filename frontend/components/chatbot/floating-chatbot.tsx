'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Minimize2, Maximize2, Sparkles, RotateCcw } from 'lucide-react'

const N = '#0a2540'; const NL = '#00ABE4'; const L = '#E9F1FA'; const LD = '#c8dff0';

const SYSTEM_PROMPT = `You are LifeDecoder — a smart, friendly AI guide for young adults. You help with:
- Finance & budgeting (credit scores, saving, investing, taxes)
- Housing & renting (leases, tenant rights, deposits)
- Career & employment (job offers, pay stubs, interviews, salary)
- Healthcare (insurance, medical bills, finding doctors)
- Legal rights (contracts, tenant rights, consumer protection)
- Government & civic life (voting, taxes, passports)

Keep answers concise, practical, and friendly — like a knowledgeable older sibling. Use bullet points for lists. Always suggest professional advice for serious legal/medical/financial matters.`

const QUICK_CHIPS = [
  '💳 Build credit score',
  '🏠 Read a lease',
  '💼 Negotiate salary',
  '🧾 File taxes',
  '🏥 Health insurance',
  '⚖️ Tenant rights',
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

function formatContent(text: string) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Bullet points
  const lines = text.split('\n')
  return lines.map(line => {
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return `<div class="flex gap-2 my-0.5"><span class="text-navy-light mt-0.5 flex-shrink-0">•</span><span>${line.trim().slice(2)}</span></div>`
    }
    if (/^\d+\./.test(line.trim())) {
      return `<div class="my-0.5">${line.trim()}</div>`
    }
    if (line.trim() === '') return '<div class="h-1"></div>'
    return `<span>${line}</span><br/>`
  }).join('')
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full inline-block"
          style={{ background: NL, opacity: 0.5,
            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  )
}

export default function FloatingChatbot() {
  const [open, setOpen]           = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [unread, setUnread]       = useState(0)
  const [typingMsg, setTypingMsg] = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingMsg, loading])

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  // Increment unread when closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant') setUnread(u => u + 1)
    }
  }, [messages])

  const handleOpen = () => {
    setOpen(true)
    setMinimized(false)
    setUnread(0)
    // Show welcome message on first open
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey! 👋 I'm your LifeDecoder assistant. Ask me anything about finances, renting, jobs, healthcare, or any adult life skill. What's on your mind?",
        ts: Date.now(),
      }])
    }
  }

  const typeResponse = useCallback(async (text: string) => {
    setIsTyping(true)
    setTypingMsg('')
    const chunkSize = 4
    for (let i = 0; i <= text.length; i += chunkSize) {
      await new Promise(r => setTimeout(r, 10))
      setTypingMsg(text.slice(0, i))
    }
    setTypingMsg(text)
    setIsTyping(false)
    return text
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Build history for context (last 8 messages)
    const history = [...messages.slice(-8), userMsg].map(m => ({
      role: m.role, content: m.content
    }))

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, systemPrompt: SYSTEM_PROMPT }),
        signal: abortRef.current.signal,
      })

      const data = await res.json()
      const reply = data.response || "Sorry, I couldn't get a response. Please try again."

      setLoading(false)
      // Typewriter effect
      await typeResponse(reply)

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: reply,
        ts: Date.now(),
      }])
      setTypingMsg('')
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setLoading(false)
      setTypingMsg('')
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ Couldn't connect. Please check your connection and try again.",
        ts: Date.now(),
      }])
    }
  }, [input, loading, messages, typeResponse])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! Ask me anything about adult life skills. 😊",
      ts: Date.now(),
    }])
    setTypingMsg('')
    setIsTyping(false)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={handleOpen}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center btn-shimmer transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${N}, ${NL})`,
            boxShadow: '0 8px 32px rgba(17,20,57,0.35)' }}
          aria-label="Open AI Assistant">
          <MessageSquare className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: '#ef4444', animation: 'bounce-in 0.3s ease' }}>
              {unread}
            </span>
          )}
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${NL}`, animation: 'pulse-glow 2s ease-in-out infinite' }} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: minimized ? 280 : 380,
            height: minimized ? 56 : 560,
            background: '#fff',
            border: `1.5px solid ${LD}`,
            boxShadow: '0 24px 64px rgba(17,20,57,0.2)',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <img src="/logo.png" alt="LifeDecoder" className="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">LifeDecoder Assistant</p>
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Online · AI-powered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
                title="Clear chat">
                <RotateCcw className="w-3.5 h-3.5 text-white/70" />
              </button>
              <button onClick={() => setMinimized(m => !m)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20">
                {minimized
                  ? <Maximize2 className="w-3.5 h-3.5 text-white/70" />
                  : <Minimize2 className="w-3.5 h-3.5 text-white/70" />}
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20">
                <X className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: L }}>

                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
                        <img src="/logo.png" alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                      </div>
                    )}
                    <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm'
                    }`}
                      style={msg.role === 'user'
                        ? { background: `linear-gradient(135deg, ${N}, ${NL})`, color: '#fff' }
                        : { background: '#fff', color: N, border: `1px solid ${LD}`,
                            boxShadow: '0 1px 4px rgba(17,20,57,0.06)' }}>
                      {msg.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                        style={{ background: LD }}>
                        👤
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {(loading || isTyping) && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
                      <img src="/logo.png" alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                    </div>
                    <div className="max-w-[82%] rounded-2xl rounded-bl-sm"
                      style={{ background: '#fff', border: `1px solid ${LD}`, boxShadow: '0 1px 4px rgba(17,20,57,0.06)' }}>
                      {isTyping && typingMsg ? (
                        <div className="px-3 py-2.5 text-xs leading-relaxed"
                          style={{ color: N }}
                          dangerouslySetInnerHTML={{ __html: formatContent(typingMsg) }} />
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick chips — only show when no messages beyond welcome */}
              {messages.length <= 1 && (
                <div className="px-3 py-2 flex gap-1.5 flex-wrap" style={{ borderTop: `1px solid ${LD}`, background: '#fff' }}>
                  {QUICK_CHIPS.map(chip => (
                    <button key={chip} onClick={() => sendMessage(chip.slice(2).trim())}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(17,20,57,0.07)', color: N, border: `1px solid ${LD}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = `rgba(17,20,57,0.12)`; e.currentTarget.style.borderColor = NL }}
                      onMouseLeave={e => { e.currentTarget.style.background = `rgba(17,20,57,0.07)`; e.currentTarget.style.borderColor = LD }}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${LD}`, background: '#fff' }}>
                <div className="flex gap-2 items-end rounded-xl px-3 py-2"
                  style={{ border: `1.5px solid ${LD}`, background: L, transition: 'border-color 0.2s' }}
                  onFocusCapture={e => (e.currentTarget.style.borderColor = NL)}
                  onBlurCapture={e => (e.currentTarget.style.borderColor = LD)}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-xs leading-relaxed"
                    style={{ color: N, maxHeight: 80, minHeight: 20 }}
                    placeholder="Ask anything about adult life…"
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      // Auto-resize
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                    }}
                    onKeyDown={handleKey}
                  />
                  <button onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 hover:scale-110 active:scale-95 btn-shimmer"
                    style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <p className="text-center text-xs mt-1.5" style={{ color: '#9999b8' }}>
                  Powered by LifeDecoder AI · Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
