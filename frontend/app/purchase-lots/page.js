'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function LotWisePurchasesReport() {
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLot, setSelectedLot] = useState(null)
  const [lotPayments, setLotPayments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [paymentData, setPaymentData] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
  const router = useRouter()
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({ 
    contentRef: printRef, 
    documentTitle: 'Lot_Wise_Purchases_Report'
  })

  useEffect(() => {
    fetchLots()
  }, [])

  const fetchLots = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/lots`)
      setLots(response.data)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load lot records')
    } finally {
      setLoading(false)
    }
  }

  const openPaymentModal = async (lot) => {
    setSelectedLot(lot)
    setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
    setShowModal(true)
    fetchLotPayments(lot.id)
  }

  const fetchLotPayments = async (lotId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/purchase-invoices/lots/${lotId}/payments`)
      setLotPayments(res.data)
    } catch (e) {
      toast.error('Failed to load lot payments')
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/purchase-invoices/lots/${selectedLot.id}/payments`, paymentData)
      toast.success('Payment added successfully')
      fetchLotPayments(selectedLot.id)
      fetchLots() 
      setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
    } catch (error) {
      toast.error('Failed to add payment')
    }
  }

  const handleDeletePayment = async (paymentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/purchase-invoices/lots/payments/${paymentId}`)
      toast.success('Payment deleted')
      fetchLotPayments(selectedLot.id)
      fetchLots()
    } catch (error) {
      toast.error('Failed to delete payment')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-pink-400" />
                  <h1 className="text-2xl font-bold text-white">
                    Lot Wise Purchases Record
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePrint()}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/30  rounded-lg text-purple-400 hover:bg-purple-500/30 flex items-center gap-2 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Save PDF / Print
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={printRef}>
          {/* Print Header */}
          <div className="hidden print:block text-center mb-8 text-black">
            <h1 className="text-2xl font-bold">FOUR (R) PLASTIC</h1>
            <h2 className="text-xl mt-2 font-semibold">Lot Wise Purchases Report</h2>
            <p className="text-sm mt-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden print:border-black print:bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Date/Inv</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Vendor/Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Lot No</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Billed vs Recv Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Short/Excess</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Lot Billed Amt</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Value Recv</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Net Loss/Gain</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Lot Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Inv. Total/Paid</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/60 print:text-black uppercase tracking-wider print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 print:divide-black/20 text-white print:text-black">
                  {lots.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-white/50 print:text-black text-sm">
                        No purchase lots found.
                      </td>
                    </tr>
                  ) : (
                    lots.map((lot, idx) => {
                      const isShort = lot.shortage > 0
                      const isExcess = lot.shortage < 0
                      
                      return (
                        <tr key={lot.id || idx} className="hover:bg-white/5 print:hover:bg-transparent">
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="font-semibold text-white print:text-black">{formatDate(lot.invoice_date)}</div>
                            <button 
                              onClick={() => router.push(`/purchase-invoices/${lot.invoice_id}`)}
                              className="text-pink-400 hover:text-pink-300 print:text-black mt-1 text-xs"
                            >
                              {lot.invoice_no}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-white print:text-black">{lot.item_name}</div>
                            <div className="text-white/60 print:text-gray-600 text-xs mt-1">{lot.vendor_name}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{lot.lot_no ? <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 print:text-black print:border-none">{lot.lot_no}</span> : '-'}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="text-white/60 print:text-gray-600">Billed: {lot.invoiced_qty}</div>
                            <div className="font-medium text-white print:text-black border-t border-white/10 pt-1 mt-1">Recv: {lot.received_quantity ?? lot.invoiced_qty}</div>
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            isShort ? 'text-red-400 print:text-red-700' : 
                            isExcess ? 'text-green-400 print:text-green-700' : 
                            'text-white/50 print:text-gray-500'
                          }`}>
                            {lot.shortage > 0 ? `-${lot.shortage}` : lot.shortage < 0 ? `+${Math.abs(lot.shortage)}` : '0'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(lot.lot_billed_amount)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-white print:text-black">{formatCurrency(lot.lot_received_value)}</td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            isShort ? 'text-red-400 print:text-red-700' : 
                            isExcess ? 'text-green-400 print:text-green-700' : 
                            'text-white/50 print:text-gray-500'
                          }`}>
                            {lot.lot_financial_diff > 0 ? `-${formatCurrency(lot.lot_financial_diff)}` : 
                             lot.lot_financial_diff < 0 ? `+${formatCurrency(Math.abs(lot.lot_financial_diff))}` : '0'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="font-semibold text-green-400 print:text-green-700">{formatCurrency(lot.lot_paid || 0)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="text-white/70 print:text-gray-600 mb-1">Tot: {formatCurrency(lot.invoice_total)}</div>
                            <div className={`font-semibold ${lot.invoice_paid >= lot.invoice_total ? 'text-green-400 print:text-green-700' : 'text-yellow-400 print:text-yellow-700'}`}>
                              Paid: {formatCurrency(lot.invoice_paid)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center print:hidden">
                            <button
                              onClick={() => openPaymentModal(lot)}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 text-xs font-medium transition-colors"
                            >
                              Ledger
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalEntrance {
          from { opacity: 0; transform: translateY(20px) scale(0.95); backdrop-filter: blur(0px); }
          to { opacity: 1; transform: translateY(0) scale(1); backdrop-filter: blur(24px); }
        }
        .premium-modal {
          animation: modalEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Premium Glassmorphic Lot Payment Modal */}
      {showModal && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500" 
            onClick={() => setShowModal(false)}
          />
          
          <div className="premium-modal relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)]">
            
            {/* Decorative background glows inside modal */}
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-500/30 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-5">
              <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Payment Ledger: <span className="text-pink-400 drop-shadow-md">{selectedLot.lot_no || 'NA'}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="group rounded-full bg-white/5 border border-white/10 p-2.5 text-white/60 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-white/10"
              >
                <XMarkIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>
            
            <div className="relative p-8">
              {/* Financial Summary Cards */}
              <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/50">Item Profile</div>
                  <div className="mt-2 text-lg font-semibold text-white truncate">{selectedLot.item_name}</div>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-transparent p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Value Received</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{formatCurrency(selectedLot.lot_received_value)}</div>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/20 to-transparent p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-300">Total Paid</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{formatCurrency(selectedLot.lot_paid || 0)}</div>
                </div>
                <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/20 to-transparent p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/20">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-300">Net Pending</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{formatCurrency(selectedLot.lot_received_value - (selectedLot.lot_paid || 0))}</div>
                </div>
              </div>

              {/* Add Payment Form */}
              <form onSubmit={handleAddPayment} className="group relative mb-8 grid grid-cols-1 md:grid-cols-4 gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-2xl transition-all hover:bg-white/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-pink-500/5 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Date</label>
                  <input type="date" required value={paymentData.payment_date} onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner" />
                </div>
                <div className="relative md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Amount Paid</label>
                  <input type="number" step="0.01" required value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner" placeholder="₹ 0.00" />
                </div>
                <div className="relative md:col-span-1">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Reference</label>
                  <input type="text" value={paymentData.reference_no} onChange={e => setPaymentData({...paymentData, reference_no: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner" placeholder="UPI / Check No." />
                </div>
                <div className="relative md:col-span-1 flex items-end">
                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 hover:from-pink-400 hover:to-purple-500 focus:outline-none active:scale-95">
                    <PlusIcon className="h-5 w-5" /> Push Payment
                  </button>
                </div>
              </form>

              {/* Past Payments List */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-2xl shadow-inner">
                <div className="bg-white/5 border-b border-white/10 px-6 py-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/80">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-pink-400" /> Transaction Trace
                  </h4>
                </div>
                <div className="max-h-60 overflow-y-auto p-3">
                  {lotPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 transition-all hover:bg-white/5">
                      <div className="rounded-full bg-white/5 p-4 mb-3">
                        <ClipboardDocumentListIcon className="h-8 w-8 text-white/30" />
                      </div>
                      <p className="text-sm font-medium text-white/50">No payments verified against this specific lot yet.</p>
                      <p className="text-xs text-white/30 mt-1">Add one above to see it dynamically trace here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lotPayments.map(pay => (
                        <div key={pay.id} className="group flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent p-4 transition-all duration-300 hover:border-white/20 hover:from-white/10 hover:shadow-lg">
                          <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 text-green-400 shadow-inner border border-green-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                              <span className="text-lg font-bold">₹</span>
                            </div>
                            <div>
                              <div className="text-sm font-bold tracking-wide text-white">{formatDate(pay.payment_date)}</div>
                              <div className="mt-1 text-xs font-medium text-white/50">Ref ID: {pay.reference_no || 'None Issued'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 outline-none">+{formatCurrency(pay.amount)}</div>
                            <button 
                              onClick={() => handleDeletePayment(pay.id)} 
                              className="rounded-full bg-black/20 p-2.5 text-white/20 backdrop-blur-md transition-all duration-300 hover:bg-rose-500 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-rose-500/20 opacity-0 group-hover:opacity-100" 
                              title="Delete record"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
