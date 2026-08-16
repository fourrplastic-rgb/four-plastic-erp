import { Outfit } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ToastProvider'
import AxiosSetup from '@/components/AxiosSetup'
import { FinancialYearProvider } from '@/context/FinancialYearContext'
import FinancialYearSelector from '@/components/FinancialYearSelector'
import ThemeSelector from '@/components/ThemeSelector'
import CommandPalette from '@/components/CommandPalette'

const outfit = Outfit({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'FOUR (R) PLASTIC - ERP System',
  description: 'Manufacturing Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('erp-theme') || 'theme-lavender';
                  document.documentElement.className = theme;
                  
                  var fontSize = localStorage.getItem('erp-font-size');
                  if (fontSize) {
                    document.documentElement.classList.add(fontSize);
                  }
                  
                  var glassBlur = localStorage.getItem('erp-glass-blur');
                  if (glassBlur) {
                    document.documentElement.classList.add(glassBlur);
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${outfit.className} min-h-screen bg-transparent antialiased selection:bg-cyan-500/30`}>
        <div className="fixed inset-0 -z-50 bg-[var(--background)] overflow-hidden print:hidden cyber-grid transition-colors duration-500">
          {/* Cyber-Core Ambient Orbs */}
          <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full orb-1 blur-[150px] animate-float-slow mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full orb-2 blur-[150px] animate-float-slow-reverse mix-blend-screen pointer-events-none" />
          <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full orb-3 blur-[120px] animate-float-slow mix-blend-screen pointer-events-none" />
          {/* Subtle noise overlay for texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-10 mix-blend-overlay pointer-events-none" />
        </div>

        <FinancialYearProvider>
          <AxiosSetup />
          <ToastProvider />
          
          {/* Main App Container */}
          <div className="relative z-0 min-h-screen">
            {/* Floating Global Theme & Financial Year Selectors Dock */}
            <div className="fixed bottom-6 right-6 z-50 print:hidden flex items-center gap-3 bg-slate-950/40 backdrop-blur-lg px-3 py-2 rounded-full border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/20">
              <ThemeSelector />
              <div className="w-px h-5 bg-white/10" />
              <FinancialYearSelector />
            </div>

            <CommandPalette />

            {children}
          </div>
        </FinancialYearProvider>
      </body>
    </html>
  )
}