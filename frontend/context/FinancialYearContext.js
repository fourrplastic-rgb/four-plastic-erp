'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

const FinancialYearContext = createContext(null)

export function FinancialYearProvider({ children }) {
  const [financialYears, setFinancialYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      if (financialYears.length === 0) {
        fetchFinancialYears()
      }
    } else {
      setLoading(false)
    }
  }, [pathname])

  const fetchFinancialYears = async () => {
    try {
      const res = await axios.get('/api/financial-years?t=1')
      setFinancialYears(res.data)
      
      // Try to get from local storage first
      const storedYearId = localStorage.getItem('selectedFinancialYearId')
      
      if (storedYearId) {
        const found = res.data.find(y => y.id.toString() === storedYearId)
        if (found) {
          setSelectedYear(found)
          setLoading(false)
          return
        }
      }
      
      // Otherwise use the active one
      const active = res.data.find(y => y.is_active === 1) || res.data[0]
      setSelectedYear(active)
      if (active) localStorage.setItem('selectedFinancialYearId', active.id)
      
    } catch (error) {
      console.error('Error fetching financial years:', error)
      toast.error('Failed to load financial years')
    } finally {
      setLoading(false)
    }
  }

  const changeYear = (year) => {
    setSelectedYear(year)
    localStorage.setItem('selectedFinancialYearId', year.id)
    toast.success(`Financial Year changed to ${year.name}`)
    // Optional: could reload window here to forcefully refresh all queries, but letting components react is cleaner
    // window.location.reload(); 
  }

  const value = {
    financialYears,
    selectedYear,
    changeYear,
    loading
  }

  return (
    <FinancialYearContext.Provider value={value}>
      {children}
    </FinancialYearContext.Provider>
  )
}

export function useFinancialYear() {
  const context = useContext(FinancialYearContext)
  if (!context) {
    throw new Error('useFinancialYear must be used within a FinancialYearProvider')
  }
  return context
}
