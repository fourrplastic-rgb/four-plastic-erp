'use client'
import { useState, useEffect, useRef } from 'react'
import { useFinancialYear } from '@/context/FinancialYearContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useReactToPrint } from "react-to-print";
import { PresentationChartLineIcon, PrinterIcon } from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function ProfitLossPage() {
  const [data, setData] = useState({ incomes: [], expenses: [], total_income: 0, total_expense: 0, net_profit: 0 })
  const [loading, setLoading] = useState(true)
  const printRef = useRef(null)
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: "Profit_Loss_Statement" })

  const router = useRouter()
  const { selectedYear } = useFinancialYear()

  useEffect(() => {
    checkAuth()
    if (selectedYear) {
      fetchPL()
    }
  }, [selectedYear])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchPL = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/accounting/profit-loss?from_date=${selectedYear.start_date}&to_date=${selectedYear.end_date}`)
      setData(res.data)
    } catch (error) {
      toast.error('Failed to load P&L')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Calculate row differences for rendering UI (T-Shape formatting)
  const maxRows = Math.max(data.incomes.length, data.expenses.length)

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PresentationChartLineIcon className="h-8 w-8 text-pink-400" />
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Profit & Loss A/c</h1>
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

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" ref={printRef}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
            {/* Header Details */}
            <div className="px-6 py-6 border-b border-white/10 text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
               <h2 className="text-xl font-bold text-white mb-2">FOUR (R) PLASTIC</h2>
               <p className="text-pink-400 font-mono tracking-widest text-sm uppercase">Statement of Profit & Loss</p>
               <p className="text-white/50 text-xs mt-1">
                 For the Period: {selectedYear ? `${new Date(selectedYear.start_date).toLocaleDateString('en-IN')} to ${new Date(selectedYear.end_date).toLocaleDateString('en-IN')}` : 'Loading...'}
               </p>
            </div>

            <div className="p-0 sm:p-4">
               {/* T Shape Layout for Desktop, Stacked for Mobile */}
               <div className="grid grid-cols-1 md:grid-cols-2">
                 
                 {/* LEFT SIDE: EXPENSES (Dr.) */}
                 <div className="border-b md:border-b-0 md:border-r border-white/20">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/20 font-bold tracking-widest uppercase text-sm text-center text-white/80">
                       Particulars (Expenses Dt.)
                    </div>
                    <div className="p-4">
                       <table className="w-full">
                          <tbody>
                             {Array.from({length: maxRows}).map((_, i) => {
                                const exp = data.expenses[i]
                                return (
                                   <tr key={`exp-${i}`} className="hover:bg-white/5">
                                      <td className="py-2 text-white/90 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-2/3">
                                         {exp ? exp.ledger_name : '\u00A0'}
                                      </td>
                                      <td className="py-2 text-right text-white font-mono text-sm w-1/3 border-l border-white/10">
                                         {exp ? formatCurrency(exp.amount) : ''}
                                      </td>
                                   </tr>
                                )
                             })}
                             
                             {/* Net Profit Balancing entry */}
                             {data.net_profit > 0 && (
                                <tr className="border-t border-dashed border-white/30 hover:bg-white/5 bg-green-500/10">
                                   <td className="py-3 text-green-400 font-bold uppercase text-sm tracking-widest">To Net Profit</td>
                                   <td className="py-3 text-right text-green-400 font-bold font-mono border-l border-white/10">
                                      {formatCurrency(data.net_profit)}
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
                 
                 {/* RIGHT SIDE: INCOME (Cr.) */}
                 <div>
                    <div className="bg-white/5 px-6 py-3 border-b border-white/20 font-bold tracking-widest uppercase text-sm text-center text-white/80">
                       Particulars (Income Cr.)
                    </div>
                    <div className="p-4">
                       <table className="w-full">
                          <tbody>
                             {Array.from({length: maxRows}).map((_, i) => {
                                const inc = data.incomes[i]
                                return (
                                   <tr key={`inc-${i}`} className="hover:bg-white/5">
                                      <td className="py-2 text-white/90 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-2/3">
                                         {inc ? inc.ledger_name : '\u00A0'}
                                      </td>
                                      <td className="py-2 text-right text-white font-mono text-sm w-1/3 border-l border-white/10">
                                         {inc ? formatCurrency(inc.amount) : ''}
                                      </td>
                                   </tr>
                                )
                             })}
                             
                             {/* Net Loss Balancing entry */}
                             {data.net_profit < 0 && (
                                <tr className="border-t border-dashed border-white/30 hover:bg-white/5 bg-red-500/10">
                                   <td className="py-3 text-red-500 font-bold uppercase text-sm tracking-widest">By Net Loss</td>
                                   <td className="py-3 text-right text-red-500 font-bold font-mono border-l border-white/10">
                                      {formatCurrency(Math.abs(data.net_profit))}
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>

               </div>
               
               {/* TOTALS ROW */}
               <div className="grid grid-cols-1 md:grid-cols-2 border-t-4 border-double border-white/40 bg-black/30 w-full">
                  <div className="border-b md:border-b-0 md:border-r border-white/20 p-4 w-full flex justify-between uppercase font-bold text-lg text-white">
                     <span>Total</span>
                     <span className="font-mono text-pink-400">
                        {formatCurrency(data.total_expense + (data.net_profit > 0 ? data.net_profit : 0))}
                     </span>
                  </div>
                  <div className="p-4 w-full flex justify-between uppercase font-bold text-lg text-white">
                     <span>Total</span>
                     <span className="font-mono text-pink-400">
                        {formatCurrency(data.total_income + (data.net_profit < 0 ? Math.abs(data.net_profit) : 0))}
                     </span>
                  </div>
               </div>
               
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}
