import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, MessageSquare, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config'
import './AIChatWidget.css'

const QUICK_PROMPTS = [
  { text: '🎮 Sản phẩm bán chạy', message: 'Cửa hàng đang có những sản phẩm nào bán chạy nhất vậy?' },
  { text: '📦 Kiểm tra đơn hàng', message: 'Tôi muốn kiểm tra tình trạng đơn hàng gần nhất của mình.' },
  { text: '🔥 Đội hình Long Hải', message: 'Đội hình thi đấu của Long Hải Esports gồm những ai?' }
]

// Simple helper to parse simple markdown to HTML safely
const parseMarkdown = (text) => {
  if (!text) return ''
  
  // Escape HTML tags to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Inline code `code`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // Bullet points
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>')
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Line breaks
  html = html.replace(/\n/g, '<br />')

  return html
}

export default function AIChatWidget() {
  const [config, setConfig] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()
  
  const messagesEndRef = useRef(null)
  const chatWindowRef = useRef(null)

  // 1. Fetch AI config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`${API_URL}/ai/config`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
          
          // Set initial greeting message
          setMessages([
            {
              id: 'welcome',
              role: 'model',
              content: data.welcome_message || 'Chào mừng bạn đến với Long Hải Esports! Mình có thể giúp gì cho bạn hôm nay? 🎮',
              timestamp: new Date()
            }
          ])
        }
      } catch (err) {
        console.error('[AIChatWidget] Failed to fetch AI config:', err)
      }
    }
    fetchConfig()
  }, [])

  // 2. Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  // 3. Handle Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    if (!textToSend) setInput('') // Clear input if sent from text box

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Build chat history for context (Gemini needs a specific format)
      // We pass the last 10 messages to keep the context clean
      const historyContext = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.content
        }))

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          history: historyContext
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date()
        }])
      } else {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to get AI response')
      }
    } catch (err) {
      console.error('[AIChatWidget] Chat error:', err)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: err.message && err.message !== 'Failed to get AI response'
          ? `🤖 **Thông báo hệ thống:** ${err.message}`
          : 'Hệ thống AI gặp sự cố nhỏ khi kết nối. Bạn vui lòng thử lại sau giây lát nhé! 🎮🤖',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  // If AI is disabled in backend config, do not render widget at all
  if (config && config.is_enabled === false) return null

  return (
    <div className="lhe-ai-chat-widget">
      {/* 1. Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="lhe-ai-chat-trigger-btn"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title={config?.bot_name || 'LHE Assistant'}
          >
            <div className="lhe-ai-trigger-pulse"></div>
            <Bot size={26} className="lhe-ai-bot-icon-glow" />
            <div className="lhe-ai-trigger-badge">AI</div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Chat Window Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lhe-ai-chat-window glass-card"
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 50, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* Header */}
            <div className="lhe-ai-chat-header">
              <div className="lhe-ai-bot-info">
                <div className="lhe-ai-avatar-wrapper">
                  <div className="lhe-ai-avatar-online-dot"></div>
                  <Bot size={20} className="lhe-ai-header-icon" />
                </div>
                <div>
                  <h4>{config?.bot_name || 'LHE Assistant'}</h4>
                  <span className="lhe-ai-status-text">
                    <Sparkles size={10} style={{ marginRight: '4px' }} />
                    Trợ lý ảo thông minh
                  </span>
                </div>
              </div>
              <button 
                className="lhe-ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Area */}
            <div className="lhe-ai-chat-messages">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`lhe-ai-msg-bubble-row ${msg.role === 'user' ? 'lhe-ai-row-user' : 'lhe-ai-row-bot'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="lhe-ai-msg-avatar">
                      <Bot size={14} />
                    </div>
                  )}
                  <div 
                    className={`lhe-ai-msg-bubble ${msg.role === 'user' ? 'lhe-ai-bubble-user' : 'lhe-ai-bubble-bot'}`}
                  >
                    <div 
                      className="lhe-ai-markdown-content"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                    />
                    <span className="lhe-ai-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {loading && (
                <div className="lhe-ai-msg-bubble-row lhe-ai-row-bot">
                  <div className="lhe-ai-msg-avatar">
                    <Bot size={14} />
                  </div>
                  <div className="lhe-ai-msg-bubble lhe-ai-bubble-bot lhe-ai-typing-bubble">
                    <div className="lhe-ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && !loading && (
              <div className="lhe-ai-quick-prompts-container">
                <p className="lhe-ai-quick-prompts-label">Gợi ý câu hỏi:</p>
                <div className="lhe-ai-quick-prompts-flex">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      className="lhe-ai-quick-prompt-btn glass-btn"
                      onClick={() => handleSendMessage(prompt.message)}
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form 
              className="lhe-ai-chat-input-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="lhe-ai-send-btn"
                disabled={!input.trim() || loading}
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
