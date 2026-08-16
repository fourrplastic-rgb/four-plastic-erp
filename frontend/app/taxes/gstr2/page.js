'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { DocumentChartBarIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function GSTR2Page() {
  const router = useRouter()
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  
  const [data, setData] = useState({
    month: currentMonth,
    purchases: [],
    total_taxable: 0,
    total_itc: 0
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchGSTR2(selectedMonth)
  }, [selectedMonth])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchGSTR2 = async (month) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/taxes/gstr2?month=${month}`)
      setData(res.data)
    } catch (error) {
      toast.error('Failed to load GSTR-2 data')
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

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentChartBarIcon className="h-8 w-8 text-amber-400" />
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wider">GSTR-2/3B ITC REGISTRY</h1>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <FunnelIcon className="h-5 w-5 text-amber-400" />
                    <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent text-white border-none outline-none focus:ring-0"
                    />
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium"
                  >
                    ← Dashboard
                  </button>
                </div>
              </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Eligible Input Tax Credit (ITC)</h3>
               <p className="text-3xl font-bold text-white font-mono text-emerald-400">{formatCurrency(data.total_itc)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 border-l-4 border-l-amber-400">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Total Taxable Purchases</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(data.total_taxable)}</p>
               <p className="text-white/40 text-xs mt-2">{data.purchases.length} Purchase Invoices Inwarded</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 flex items-center justify-center">
               <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all font-medium w-full justify-center">
                 <ArrowDownTrayIcon className="h-5 w-5" />
                 Export Excel
               </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl p-6">
            <h2 className="text-xl text-white font-bold mb-4 uppercase tracking-wider">Purchase Inward Register (B2B)</h2>
               {loading ? (
                 <div className="flex items-center justify-center h-64 text-white">Loading register data...</div>
               ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 text-white/50 text-xs uppercase tracking-wider">
                              <th className="py-3 px-4">Invoice No</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Vendor Name</th>
                              <th className="py-3 px-4">Vendor GSTIN</th>
                              <th className="py-3 px-4 text-right">Taxable Value</th>
                              <th className="py-3 px-4 text-right">CGST Paid</th>
                              <th className="py-3 px-4 text-right">SGST Paid</th>
                              <th className="py-3 px-4 text-right">IGST Paid</th>
                              <th className="py-3 px-4 text-right">Invoice Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {data.purchases.length === 0 ? (
                              <tr><td colSpan="9" className="py-8 text-center text-white/50">No inbound purchases in this period</td></tr>
                            ) : data.purchases.map((inv, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-white font-mono">{inv.invoice_no}</td>
                                <td className="py-3 px-4 text-white/80">{inv.invoice_date}</td>
                                <td className="py-3 px-4 text-white">{inv.vendor_name}</td>
                                <td className="py-3 px-4 text-amber-400 font-mono text-sm">{inv.vendor_gst || 'Unregistered'}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">{formatCurrency(inv.taxable_amount)}</td>
                                <td className="py-3 px-4 text-right text-emerald-400 font-mono">{formatCurrency(inv.cgst_total)}</td>
                                <td className="py-3 px-4 text-right text-emerald-400 font-mono">{formatCurrency(inv.sgst_total)}</td>
                                <td className="py-3 px-4 text-right text-emerald-400 font-mono">{formatCurrency(inv.igst_total)}</td>
                                <td className="py-3 px-4 text-right text-white font-bold font-mono">{formatCurrency(inv.grand_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
               )}
          </div>
        </main>
      </div>
    </div>
  )
}
