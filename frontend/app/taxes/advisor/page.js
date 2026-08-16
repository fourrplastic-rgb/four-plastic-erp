'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { SparklesIcon, PaperAirplaneIcon, KeyIcon, AcademicCapIcon, DocumentTextIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline'

// Helper to format markdown roughly
const formatMessage = (text) => {
  if (!text) return ''
  // First escape HTML to prevent tags from breaking rendering
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  
  return safeText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

export default function TaxAdvisorPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Tax Advisor. I can explain Indian tax laws (GST, Income Tax, TDS) in simple terms. What would you like to know today?"
    }
  ])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    checkAuth()
    const storedKey = localStorage.getItem('gemini_api_key')
    if (storedKey) setApiKey(storedKey)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid key')
      return
    }
    localStorage.setItem('gemini_api_key', apiKey.trim())
    setShowKeyModal(false)
    toast.success('API Key saved successfully!')
  }

  const handleSend = async (textToSend) => {
    const text = textToSend || query
    if (!text.trim()) return

    // Check if key exists
    const storedKey = localStorage.getItem('gemini_api_key')
    if (!storedKey) {
      setShowKeyModal(true)
      toast('Please provide a Gemini API Key first', { icon: '🔑' })
      return
    }

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setQuery('')
    setLoading(true)

    try {
      const response = await axios.post('/api/tax-advisor/ask', 
        { query: text },
        { headers: { 'X-Gemini-Key': storedKey } }
      )
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }])
    } catch (error) {
      if (error.response?.status === 401) {
        setShowKeyModal(true)
        toast.error('API Key is missing or invalid')
      } else {
        toast.error(error.response?.data?.details || 'Failed to get response')
      }
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I encountered an error while searching for the answer. Please check your API key or internet connection." }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQueries = [
    { icon: BuildingLibraryIcon, text: "Explain TDS on contract payments (194C)" },
    { icon: DocumentTextIcon, text: "What is the GST rate for Transport Services?" },
    { icon: AcademicCapIcon, text: "Explain New Income Tax Slabs for 2024-25" }
  ]

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 shrink-0 z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider">AI Tax Advisor</h1>
                    <p className="text-white/50 text-sm">Powered by Google Gemini</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowKeyModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white text-sm transition-all"
                  >
                    <KeyIcon className="h-4 w-4" />
                    API Key
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium text-sm"
                  >
                    ← Dashboard
                  </button>
                </div>
              </div>
            </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto space-y-6 pb-4 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tr-sm shadow-lg' 
                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-tl-sm shadow-2xl'
                }`}>
                  <div 
                    className="text-[15px] leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-5 bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-white/50 text-sm">Searching tax laws...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only show if no user messages yet) */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 shrink-0">
              {suggestedQueries.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sq.text)}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group"
                >
                  <div className="p-2 bg-white/10 rounded-lg group-hover:bg-pink-500/20 group-hover:text-pink-400 text-white/70">
                    <sq.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">{sq.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 pt-2 pb-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend()
                }}
                placeholder="Ask about GST, TDS, Income Tax... (e.g. 'Translate section 194Q to simple English')"
                className="w-full bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl pl-5 pr-14 py-4 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-2xl transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !query.trim()}
                className="absolute right-2 p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
              </button>
            </div>
            <p className="text-center text-white/30 text-xs mt-3">
              AI Advisor provides simple translations and guidance, but please consult a certified CA for final decisions.
            </p>
          </div>

        </main>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <KeyIcon className="h-5 w-5 text-pink-400" />
              Setup Gemini AI
            </h2>
            <p className="text-white/60 text-sm mb-6">
              To use the Tax Advisor, you need a free Google Gemini API key. 
              Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">Google AI Studio</a>.
            </p>
            
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API Key here..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white mb-6 focus:outline-none focus:border-pink-500"
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-white"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
