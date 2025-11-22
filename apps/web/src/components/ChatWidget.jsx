import React, { useState } from 'react'
import SupportChat from './SupportChat'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          style={{ backgroundColor: '#008080' }}
          aria-label="Open support chat"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" fill="white" viewBox="0 0 100 100">
            <ellipse cx="20" cy="35" rx="8" ry="12"/>
            <ellipse cx="40" cy="25" rx="8" ry="12"/>
            <ellipse cx="60" cy="25" rx="8" ry="12"/>
            <ellipse cx="80" cy="35" rx="8" ry="12"/>
            <ellipse cx="50" cy="65" rx="18" ry="20"/>
          </svg>
        </button>
      )}

      {isOpen && <SupportChat onClose={() => setIsOpen(false)} />}
    </>
  )
}
