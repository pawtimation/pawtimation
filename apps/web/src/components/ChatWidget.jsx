import React, { useState } from 'react'
import SupportChat from './SupportChat'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          aria-label="Open support chat"
        >
          <img 
            src="/brand/paw.svg" 
            alt="Pawtimation chat" 
            className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform"
          />
        </button>
      )}

      {isOpen && <SupportChat onClose={() => setIsOpen(false)} />}
    </>
  )
}
