'use client'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useReactToPrint } from "react-to-print";
import { useState, useEffect, useRef } from "react";
import { useFinancialYear } from '@/context/FinancialYearContext';
import { ScaleIcon, PrinterIcon } from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function TrialBalancePage() {
  const [data, setData] = useState([])
  const [totals, setTotals] = useState({ total_debit: 0, total_credit: 0 })
  const [loading, setLoading] = useState(true)
  const printRef = useRef(null)
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: "Trial_Balance_Report" })

  const router = useRouter()

  const { selectedYear } = useFinancialYear()

  useEffect(() => {
    checkAuth()
    if (selectedYear) {
      fetchTrialBalance()
    }
  }, [selectedYear])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchTrialBalance = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/accounting/trial-balance?from_date=${selectedYear.start_date}&to_date=${selectedYear.end_date}`)
      setData(res.data.data)
      setTotals(res.data.totals)
    } catch (error) {
      toast.error('Failed to load Trial Balance')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if(!amount) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Group by "group_name" -> "type" 
  const groupedData = data.reduce((acc, row) => {
    const key = `${row.group_type} : ${row.group_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScaleIcon className="h-8 w-8 text-emerald-400" />
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Trial Balance</h1>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint()}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all font-medium flex items-center gap-2 print:hidden"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    Save PDF
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium print:hidden"
                  >
                    ← Dashboard
                  </button>
                </div>
              </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" ref={printRef}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
            {/* Header Details */}
            <div className="px-6 py-6 border-b border-white/10 text-center">
               <h2 className="text-xl font-bold text-white mb-2">FOUR (R) PLASTIC</h2>
               <p className="text-emerald-400 font-mono tracking-widest text-sm uppercase">Statement of Trial Balance</p>
               <p className="text-white/50 text-xs mt-1">
                 For the Period: {selectedYear ? `${new Date(selectedYear.start_date).toLocaleDateString('en-IN')} to ${new Date(selectedYear.end_date).toLocaleDateString('en-IN')}` : 'Loading...'}
               </p>
            </div>

            <div className="p-0 sm:p-4">
              <table className="w-full">
                <thead className="bg-white/5 border-y border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider w-1/2">Particulars</th>
                    <th className="px-6 py-4 text-right font-bold text-blue-300 uppercase tracking-wider w-1/4 border-l border-white/10">Debit Balance (₹)</th>
                    <th className="px-6 py-4 text-right font-bold text-fuchsia-300 uppercase tracking-wider w-1/4 border-l border-white/10">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 border-b border-white/20">
                  {Object.keys(groupedData).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-white/50">
                        No transactions registered in the ledger yet.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(groupedData).map((groupKey) => (
                      <optgroup key={groupKey} className="contents">
                        {/* Group Header Row */}
                        <tr className="bg-white/5">
                          <td colSpan={3} className="px-6 py-2 text-sm font-bold text-emerald-300">
                            {groupKey}
                          </td>
                        </tr>
                        {/* Individual Ledgers */}
                        {groupedData[groupKey].map((ledger, idx) => (
                          <tr key={`${ledger.ledger_id}-${idx}`} className="hover:bg-white/5">
                            <td className="px-6 py-3 pl-10 text-sm text-white">{ledger.ledger_name}</td>
                            <td className="px-6 py-3 text-right font-mono text-sm text-blue-200 border-l border-transparent transition-colors hover:border-white/10">
                               {ledger.debit_balance > 0 ? formatCurrency(ledger.debit_balance) : '-'}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-sm text-fuchsia-200 border-l border-transparent hover:border-white/10">
                               {ledger.credit_balance > 0 ? formatCurrency(ledger.credit_balance) : '-'}
                            </td>
                          </tr>
                        ))}
                      </optgroup>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-black/30 font-bold border-t border-double border-white border-b-4">
                   <tr>
                      <td className="px-6 py-4 text-right text-white uppercase font-black text-lg">Grand Total :</td>
                      <td className="px-6 py-4 text-right text-blue-400 font-mono text-lg border-l border-white/10">{formatCurrency(totals.total_debit)}</td>
                      <td className="px-6 py-4 text-right text-fuchsia-400 font-mono text-lg border-l border-white/10">{formatCurrency(totals.total_credit)}</td>
                   </tr>
                </tfoot>
              </table>
              
              <div className="flex justify-center mt-4">
                 {Math.abs(totals.total_debit - totals.total_credit) < 0.01 && totals.total_debit > 0 ? (
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm flex items-center">
                       <ScaleIcon className="h-5 w-5 mr-2" /> Trial Balance is fully balanced
                    </div>
                 ) : totals.total_debit > 0 ? (
                    <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm">
                       Suspense Detected: ₹{Math.abs(totals.total_debit - totals.total_credit).toFixed(2)}
                    </div>
                 ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
