'use client'

import React, { useState, useEffect } from 'react'
import { PaintBrushIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const themes = [
  { id: 'theme-lavender', name: 'Velvet Lavender', color: 'from-indigo-400 to-pink-400' },
  { id: 'theme-day', name: 'Classic Day', color: 'from-amber-400 to-blue-500' },
  { id: 'theme-sense', name: 'Sense Pastel', color: 'from-orange-300 to-emerald-300' },
  { id: 'theme-sapphire', name: 'Corporate Sapphire', color: 'from-blue-500 to-teal-400' },
  { id: 'theme-cyber', name: 'Cyber Amethyst', color: 'from-cyan-400 to-purple-500' },
  { id: 'theme-emerald', name: 'Emerald Aurora', color: 'from-emerald-400 to-cyan-500' },
  { id: 'theme-gold', name: 'Imperial Gold', color: 'from-yellow-400 to-amber-600' },
  { id: 'theme-sunset', name: 'Sunset Velvet', color: 'from-rose-400 to-indigo-600' },
  { id: 'theme-carbon', name: 'Carbon Cyber', color: 'from-lime-400 to-cyan-400' }
]

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState('theme-lavender')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('erp-theme') || 'theme-lavender'
    setCurrentTheme(savedTheme)
    
    // Apply class to documentElement
    const doc = document.documentElement
    themes.forEach(t => doc.classList.remove(t.id))
    doc.classList.add(savedTheme)
  }, [])

  const changeTheme = (themeId) => {
    const doc = document.documentElement
    themes.forEach(t => doc.classList.remove(t.id))
    doc.classList.add(themeId)
    localStorage.setItem('erp-theme', themeId)
    setCurrentTheme(themeId)
  }

  const activeTheme = themes.find(t => t.id === currentTheme) || themes[0]

  return (
    <div className="relative z-50 print:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all text-white text-sm shadow-lg shadow-black/20"
      >
        <PaintBrushIcon className="h-4 w-4 text-purple-400" />
        <span className="font-semibold">{activeTheme.name}</span>
        <ChevronDownIcon className={`h-3 w-3 opacity-70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden premium-modal">
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Theme</p>
            </div>
            <ul className="py-1.5">
              {themes.map((theme) => (
                <li key={theme.id}>
                  <button
                    onClick={() => {
                      changeTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                      currentTheme === theme.id 
                        ? 'bg-white/10 text-white font-bold' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{theme.name}</span>
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${theme.color} border border-white/20 shadow-sm`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
