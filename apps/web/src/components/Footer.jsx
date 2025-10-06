import React from 'react'

export function Footer({ onNav }){
  return (
    <footer className="mt-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-white">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🐾</div>
                <span className="font-bold text-lg">Pawtimation</span>
              </div>
              <p className="text-emerald-50 text-sm">
                Trusted pet care for families — friends or professionals, your choice
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-emerald-50">
                <li>
                  {onNav ? (
                    <button onClick={()=>onNav('about')} className="hover:text-white transition">About Us</button>
                  ) : (
                    <a href="/about" className="hover:text-white transition">About Us</a>
                  )}
                </li>
                <li><a href="/careers" className="hover:text-white transition">Careers</a></li>
                <li><a href="/press" className="hover:text-white transition">Press</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-emerald-50">
                <li><a href="/help" className="hover:text-white transition">Help Centre</a></li>
                <li><a href="/safety" className="hover:text-white transition">Trust & Safety</a></li>
                <li><a href="/community" className="hover:text-white transition">Community</a></li>
                <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-emerald-50">
                <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="/cookies" className="hover:text-white transition">Cookie Policy</a></li>
                <li><a href="/legal" className="hover:text-white transition">Legal</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <span>© 2025 Pawtimation Ltd. All rights reserved.</span>
          </div>
          <div className="text-slate-500">
            Founded by <span className="text-emerald-400 font-medium">Andrew James</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
