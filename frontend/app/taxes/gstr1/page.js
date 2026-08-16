'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { DocumentChartBarIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function GSTR1Page() {
  const router = useRouter()
  
  // Set default month to current month YYYY-MM
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  
  const [data, setData] = useState({
    month: currentMonth,
    b2b: [],
    b2c: [],
    hsn_summary: [],
    b2b_total: 0,
    b2c_total: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('b2b') // b2b, b2c, hsn

  useEffect(() => {
    checkAuth()
    fetchGSTR1(selectedMonth)
  }, [selectedMonth])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchGSTR1 = async (month) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/taxes/gstr1?month=${month}`)
      setData(res.data)
    } catch (error) {
      toast.error('Failed to load GSTR-1 data')
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

  // Derived totals
  const totalB2B = data.b2b.reduce((acc, curr) => acc + (curr.grand_total || 0), 0)
  const totalB2BTax = data.b2b.reduce((acc, curr) => acc + (curr.cgst_total || 0) + (curr.sgst_total || 0) + (curr.igst_total || 0), 0)
  
  const totalB2C = data.b2c.reduce((acc, curr) => acc + (curr.grand_total || 0), 0)
  const totalB2CTax = data.b2c.reduce((acc, curr) => acc + (curr.cgst_total || 0) + (curr.sgst_total || 0) + (curr.igst_total || 0), 0)

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentChartBarIcon className="h-8 w-8 text-indigo-400" />
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wider">GSTR-1 Returns</h1>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <FunnelIcon className="h-5 w-5 text-indigo-400" />
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
          
          {/* Top Line Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Total Output Tax</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(totalB2BTax + totalB2CTax)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 border-l-4 border-l-green-400">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">B2B Sales (Registered)</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(totalB2B)}</p>
               <p className="text-white/40 text-xs mt-2">{data.b2b.length} Invoices</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 border-l-4 border-l-orange-400">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">B2C Sales (Unreg.)</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(totalB2C)}</p>
               <p className="text-white/40 text-xs mt-2">{data.b2c.length} Invoices</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 flex items-center justify-center">
               <button className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all font-medium w-full justify-center">
                 <ArrowDownTrayIcon className="h-5 w-5" />
                 Download JSON
               </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button 
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'b2b' ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('b2b')}
              >
                B2B Invoices (4A, 4B, 4C, 6B, 6C)
              </button>
              <button 
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'b2c' ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('b2c')}
              >
                B2C Invoices (7)
              </button>
              <button 
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'hsn' ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                onClick={() => setActiveTab('hsn')}
              >
                HSN Summary (12)
              </button>
            </div>

            <div className="p-6">
               {loading ? (
                 <div className="flex items-center justify-center h-64 text-white">Loading register data...</div>
               ) : (
                 <>
                   {/* B2B TAB */}
                   {activeTab === 'b2b' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 text-white/50 text-xs uppercase tracking-wider">
                              <th className="py-3 px-4">Invoice No</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Customer Name</th>
                              <th className="py-3 px-4">GSTIN/UIN</th>
                              <th className="py-3 px-4 text-right">Taxable Value</th>
                              <th className="py-3 px-4 text-right">CGST</th>
                              <th className="py-3 px-4 text-right">SGST</th>
                              <th className="py-3 px-4 text-right">IGST</th>
                              <th className="py-3 px-4 text-right">Invoice Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {data.b2b.length === 0 ? (
                              <tr><td colSpan="9" className="py-8 text-center text-white/50">No B2B sales in this period</td></tr>
                            ) : data.b2b.map((inv, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-white font-mono">{inv.invoice_no}</td>
                                <td className="py-3 px-4 text-white/80">{inv.invoice_date}</td>
                                <td className="py-3 px-4 text-white">{inv.customer_name}</td>
                                <td className="py-3 px-4 text-green-400 font-mono text-sm">{inv.customer_gst}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">{formatCurrency(inv.subtotal)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(inv.cgst_total)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(inv.sgst_total)}</td>
                                <td className="py-3 px-4 text-right text-purple-400 font-mono">{formatCurrency(inv.igst_total)}</td>
                                <td className="py-3 px-4 text-right text-white font-bold font-mono">{formatCurrency(inv.grand_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   )}

                   {/* B2C TAB */}
                   {activeTab === 'b2c' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 text-white/50 text-xs uppercase tracking-wider">
                              <th className="py-3 px-4">Invoice No</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Customer Name</th>
                              <th className="py-3 px-4">PoS (State)</th>
                              <th className="py-3 px-4 text-right">Taxable Value</th>
                              <th className="py-3 px-4 text-right">Central Tax</th>
                              <th className="py-3 px-4 text-right">State Tax</th>
                              <th className="py-3 px-4 text-right">Interstate Tax</th>
                              <th className="py-3 px-4 text-right">Total Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {data.b2c.length === 0 ? (
                              <tr><td colSpan="9" className="py-8 text-center text-white/50">No B2C sales in this period</td></tr>
                            ) : data.b2c.map((inv, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-white font-mono">{inv.invoice_no}</td>
                                <td className="py-3 px-4 text-white/80">{inv.invoice_date}</td>
                                <td className="py-3 px-4 text-white">{inv.customer_name}</td>
                                <td className="py-3 px-4 text-yellow-400 text-sm">{inv.pos_state || 'Not Specified'}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">{formatCurrency(inv.subtotal)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(inv.cgst_total)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(inv.sgst_total)}</td>
                                <td className="py-3 px-4 text-right text-purple-400 font-mono">{formatCurrency(inv.igst_total)}</td>
                                <td className="py-3 px-4 text-right text-white font-bold font-mono">{formatCurrency(inv.grand_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   )}

                   {/* HSN TAB */}
                   {activeTab === 'hsn' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 text-white/50 text-xs uppercase tracking-wider">
                              <th className="py-3 px-4">HSN/SAC Code</th>
                              <th className="py-3 px-4 text-right">Total Quantity</th>
                              <th className="py-3 px-4 text-right">Total Taxable Value</th>
                              <th className="py-3 px-4 text-right">Integrated Tax</th>
                              <th className="py-3 px-4 text-right">Central Tax</th>
                              <th className="py-3 px-4 text-right">State/UT Tax</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {data.hsn_summary.length === 0 ? (
                              <tr><td colSpan="6" className="py-8 text-center text-white/50">No HSN data reported</td></tr>
                            ) : data.hsn_summary.map((hsn, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-orange-400 font-mono font-bold">{hsn.hsn || 'Missing'}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">{hsn.total_qty}</td>
                                <td className="py-3 px-4 text-right text-white font-mono">{formatCurrency(hsn.total_value)}</td>
                                <td className="py-3 px-4 text-right text-purple-400 font-mono">{formatCurrency(hsn.igst)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(hsn.cgst)}</td>
                                <td className="py-3 px-4 text-right text-pink-400 font-mono">{formatCurrency(hsn.sgst)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   )}
                 </>
               )}
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}
