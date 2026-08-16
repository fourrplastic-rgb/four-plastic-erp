'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  PaintBrushIcon, 
  AdjustmentsHorizontalIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const themePresets = [
  { id: 'theme-lavender', name: 'Velvet Lavender', color: 'from-indigo-400 to-pink-400', desc: 'Soft lavender canvas with glass cards (Light mode)' },
  { id: 'theme-day', name: 'Classic Day', color: 'from-amber-400 to-blue-500', desc: 'Sunlight white canvas with high contrast azure accents (Light mode)' },
  { id: 'theme-sense', name: 'Sense Pastel', color: 'from-orange-300 to-emerald-300', desc: 'Warm mist canvas with soft coral orange & mint glass elements (Light mode)' },
  { id: 'theme-sapphire', name: 'Corporate Sapphire', color: 'from-blue-500 to-teal-400', desc: 'Obsidian navy canvas with cobalt accent (Dark mode)' },
  { id: 'theme-cyber', name: 'Cyber Amethyst', color: 'from-cyan-400 to-purple-500', desc: 'Dark amethyst canvas with cyan highlights (Dark mode)' },
  { id: 'theme-emerald', name: 'Emerald Aurora', color: 'from-emerald-400 to-cyan-500', desc: 'Deep forest canvas with emerald auroras (Dark mode)' },
  { id: 'theme-gold', name: 'Imperial Gold', color: 'from-yellow-400 to-amber-600', desc: 'Royal obsidian canvas with golden highlights (Dark mode)' },
  { id: 'theme-sunset', name: 'Sunset Velvet', color: 'from-rose-400 to-indigo-600', desc: 'Crimson sky canvas with velvet violet accents (Dark mode)' },
  { id: 'theme-carbon', name: 'Carbon Cyber', color: 'from-lime-400 to-cyan-400', desc: 'Jet carbon canvas with radioactive lime glow (Dark mode)' }
]

export default function ThemeSettings() {
  const router = useRouter()
  const [selectedTheme, setSelectedTheme] = useState('theme-lavender')
  const [fontSize, setFontSize] = useState('')
  const [glassBlur, setGlassBlur] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('erp-theme') || 'theme-lavender'
    const savedFontSize = localStorage.getItem('erp-font-size') || ''
    const savedGlassBlur = localStorage.getItem('erp-glass-blur') || ''
    
    setSelectedTheme(savedTheme)
    setFontSize(savedFontSize)
    setGlassBlur(savedGlassBlur)
  }, [])

  const handleApply = () => {
    // 1. Save theme selection
    localStorage.setItem('erp-theme', selectedTheme)
    
    // 2. Save font selection
    if (fontSize) {
      localStorage.setItem('erp-font-size', fontSize)
    } else {
      localStorage.removeItem('erp-font-size')
    }

    // 3. Save blur selection
    if (glassBlur) {
      localStorage.setItem('erp-glass-blur', glassBlur)
    } else {
      localStorage.removeItem('erp-glass-blur')
    }

    // 4. Force update documentElement class list
    // Clear all theme classes
    themePresets.forEach(preset => {
      document.documentElement.classList.remove(preset.id)
    })
    document.documentElement.classList.remove('font-size-large', 'font-size-xlarge', 'blur-none', 'blur-ultra')

    // Add selected classes
    document.documentElement.className = selectedTheme
    if (fontSize) document.documentElement.classList.add(fontSize)
    if (glassBlur) document.documentElement.classList.add(glassBlur)

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen text-slate-100 py-8 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back navigation header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Theme & style Customizer</h1>
              <p className="text-[var(--text-secondary)] text-sm">Personalize the dashboard color palette, typography sizes, and glassmorphism levels.</p>
            </div>
          </div>
          <button 
            onClick={handleApply}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            Apply Settings
          </button>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-center rounded-2xl animate-pulse">
            Style settings applied successfully! Redirecting... ✨
          </div>
        )}

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Preset list (Col span 2) */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <PaintBrushIcon className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Available Themes</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themePresets.map(theme => {
                const isSelected = selectedTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-5 text-left rounded-3xl border transition-all relative overflow-hidden bg-white/5 ${
                      isSelected 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`h-8 w-12 rounded-xl bg-gradient-to-br ${theme.color}`} />
                      {isSelected && (
                        <span className="p-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-full">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">{theme.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{theme.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tweak Desk (Col span 1) */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Appearance Settings</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
              {/* Font Size Selector */}
              <div className="space-y-3">
                <label className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Typography Zoom</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setFontSize('')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      fontSize === '' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Normal (Default)</span>
                    {fontSize === '' && <CheckIcon className="h-4 w-4" />}
                  </button>

                  <button 
                    onClick={() => setFontSize('font-size-large')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      fontSize === 'font-size-large' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Large (+2px Font Size)</span>
                    {fontSize === 'font-size-large' && <CheckIcon className="h-4 w-4" />}
                  </button>

                  <button 
                    onClick={() => setFontSize('font-size-xlarge')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      fontSize === 'font-size-xlarge' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Extra Large (+4px)</span>
                    {fontSize === 'font-size-xlarge' && <CheckIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Glassmorphic blur slider */}
              <div className="space-y-3">
                <label className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Glassmorphism Intensity</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setGlassBlur('blur-none')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      glassBlur === 'blur-none' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Flat (No blur / faster)</span>
                    {glassBlur === 'blur-none' && <CheckIcon className="h-4 w-4" />}
                  </button>

                  <button 
                    onClick={() => setGlassBlur('')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      glassBlur === '' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Medium (Default Glass)</span>
                    {glassBlur === '' && <CheckIcon className="h-4 w-4" />}
                  </button>

                  <button 
                    onClick={() => setGlassBlur('blur-ultra')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border text-left flex justify-between items-center ${
                      glassBlur === 'blur-ultra' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Ultra Blur (Heavy Glass)</span>
                    {glassBlur === 'blur-ultra' && <CheckIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
