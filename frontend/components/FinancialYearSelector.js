'use client'

import React, { useState } from 'react'
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useFinancialYear } from '@/context/FinancialYearContext'

export default function FinancialYearSelector() {
  const { financialYears, selectedYear, changeYear, loading } = useFinancialYear()
  const [isOpen, setIsOpen] = useState(false)

  if (loading || !selectedYear) return null;

  return (
    <div className="relative z-50 print:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-500/50 transition-all text-white text-sm shadow-lg shadow-indigo-500/20"
      >
        <CalendarIcon className="h-4 w-4 text-indigo-300" />
        <span className="font-semibold">FY: {selectedYear.name}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden premium-modal">
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Financial Year</p>
            </div>
            <ul className="py-1">
              {financialYears.map((year) => (
                <li key={year.id}>
                  <button
                    onClick={() => {
                      changeYear(year);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedYear.id === year.id 
                        ? 'bg-indigo-500/30 text-indigo-200 font-bold' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {year.name}
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
