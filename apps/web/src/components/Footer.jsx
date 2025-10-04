import React from 'react'

export function Footer(){
  return (
    <footer className="mt-12 pt-6 border-t border-brand-cloud">
      <div className="flex items-center justify-center gap-2 mb-2">
        <img src="/pawtimation-logo.png" alt="Pawtimation" className="w-6 h-6"/>
        <span className="text-sm text-brand-inkMuted">© 2025 Pawtimation — Built for British pet parents</span>
      </div>
      <div className="text-center text-xs text-brand-inkMuted">
        Founded by <span className="text-brand-teal font-medium">Andrew James</span>
      </div>
    </footer>
  )
}
