import React, { useState, useRef, useEffect } from 'react'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! How can we help you today?", sender: 'agent', timestamp: new Date() }
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages([...messages, newMessage])
    setInputValue('')

    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: "Thanks for your message! Our team will respond shortly.",
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, reply])
    }, 1000)
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-teal to-brand-blue rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          aria-label="Open chat"
        >
          <img src="/pawtimation-paw.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200">
          <div className="bg-gradient-to-r from-brand-teal to-brand-blue text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/pawtimation-paw.png" alt="" className="w-8 h-8" />
              <div>
                <div className="font-semibold">Pawtimation Support</div>
                <div className="text-xs opacity-90">We're here to help</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-brand-teal text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="text-sm">{msg.text}</div>
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-teal"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="bg-brand-teal text-white rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
