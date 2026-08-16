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
  PlusIcon,
  ArchiveBoxArrowDownIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function StandaloneLotTracker() {
  const [lots, setLots] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Create Lot State
  const [showAddLotModal, setShowAddLotModal] = useState(false)
  const [newLot, setNewLot] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    vendor_name: '',
    item_name: '',
    lot_no: '',
    billed_qty: '',
    received_qty: 0, // Default to 0, parts come later
    rate: ''
  })

  // Ledger state (Receipts & Payments)
  const [selectedLot, setSelectedLot] = useState(null)
  const [activeTab, setActiveTab] = useState('receipts') // 'receipts' or 'payments'
  
  const [lotPayments, setLotPayments] = useState([])
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [paymentData, setPaymentData] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
  
  const [lotReceipts, setLotReceipts] = useState([])
  const [receiptData, setReceiptData] = useState({ quantity: '', receipt_date: new Date().toISOString().split('T')[0], reference_no: '' })

  const router = useRouter()
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({ 
    contentRef: printRef, 
    documentTitle: 'Standalone_Lot_Wise_Purchases_Report'
  })

  useEffect(() => {
    fetchLots()
    fetchVendors()
  }, [])

  const fetchLots = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/standalone-lots`)
      setLots(response.data)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Failed to load lot records')
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors`)
      setVendors(response.data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    }
  }

  const handleVendorSelect = (e) => {
    const vendorId = e.target.value;
    const vendor = vendors.find(v => v.id.toString() === vendorId);
    setNewLot({
      ...newLot,
      vendor_id: vendor ? vendor.id : '',
      vendor_name: vendor ? vendor.name : ''
    })
  }

  const handleAddLot = async (e) => {
    e.preventDefault()
    if (!newLot.vendor_name || !newLot.item_name) {
      toast.error("Vendor and Item Name are required");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/standalone-lots`, newLot)
      toast.success('Lot created successfully')
      fetchLots()
      setShowAddLotModal(false)
      setNewLot({
        date: new Date().toISOString().split('T')[0],
        vendor_id: '',
        vendor_name: '',
        item_name: '',
        lot_no: '',
        billed_qty: '',
        received_qty: 0,
        rate: ''
      })
    } catch (error) {
      toast.error('Failed to create lot')
    }
  }

  const handleDeleteLot = async (lotId) => {
    if(!window.confirm("Are you sure you want to delete this lot?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/standalone-lots/${lotId}`)
      toast.success('Lot deleted successfully')
      fetchLots()
    } catch (error) {
      toast.error('Failed to delete lot')
    }
  }

  const openLedgerModal = async (lot) => {
    setSelectedLot(lot)
    setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
    setReceiptData({ quantity: '', receipt_date: new Date().toISOString().split('T')[0], reference_no: '' })
    setShowLedgerModal(true)
    fetchLotPayments(lot.id)
    fetchLotReceipts(lot.id)
  }

  // --- Payments ---
  const fetchLotPayments = async (lotId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/standalone-lots/${lotId}/payments`)
      setLotPayments(res.data)
    } catch (e) {
      toast.error('Failed to load lot payments')
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/standalone-lots/${selectedLot.id}/payments`, paymentData)
      toast.success('Payment added successfully')
      fetchLotPayments(selectedLot.id)
      fetchLots() // Refresh main table
      // Update selected lot local state temporarily without closing modal
      setSelectedLot(prev => ({ ...prev, paid_amount: (prev.paid_amount || 0) + parseFloat(paymentData.amount) }))
      setPaymentData({ amount: '', payment_date: new Date().toISOString().split('T')[0], reference_no: '' })
    } catch (error) {
      toast.error('Failed to add payment')
    }
  }

  const handleDeletePayment = async (paymentId, amount) => {
    try {
      await axios.delete(`${API_BASE_URL}/standalone-lots/payments/${paymentId}`)
      toast.success('Payment deleted')
      fetchLotPayments(selectedLot.id)
      fetchLots()
      setSelectedLot(prev => ({ ...prev, paid_amount: (prev.paid_amount || 0) - parseFloat(amount) }))
    } catch (error) {
      toast.error('Failed to delete payment')
    }
  }

  // --- Receipts ---
  const fetchLotReceipts = async (lotId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/standalone-lots/${lotId}/receipts`)
      setLotReceipts(res.data)
    } catch (e) {
      toast.error('Failed to load lot receipts')
    }
  }

  const handleAddReceipt = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/standalone-lots/${selectedLot.id}/receipts`, receiptData)
      toast.success('Material partial receipt logged')
      fetchLotReceipts(selectedLot.id)
      fetchLots() // Refresh main table to update quantity stats
      
      const addedQty = parseFloat(receiptData.quantity)
      setSelectedLot(prev => ({
        ...prev,
        received_qty: prev.received_qty + addedQty,
        received_amount: prev.received_amount + (addedQty * prev.rate)
      }))
      
      setReceiptData({ quantity: '', receipt_date: new Date().toISOString().split('T')[0], reference_no: '' })
    } catch (error) {
      toast.error('Failed to add receipt')
    }
  }

  const handleDeleteReceipt = async (receiptId, quantity) => {
    try {
      await axios.delete(`${API_BASE_URL}/standalone-lots/receipts/${receiptId}`)
      toast.success('Receipt deleted')
      fetchLotReceipts(selectedLot.id)
      fetchLots()
      
      const removedQty = parseFloat(quantity)
      setSelectedLot(prev => ({
        ...prev,
        received_qty: prev.received_qty - removedQty,
        received_amount: prev.received_amount - (removedQty * prev.rate)
      }))
    } catch (error) {
      toast.error('Failed to delete receipt')
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

  if (loading && lots.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading isolated tracker...</div>
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
                    Lot Wise Purchases (Standalone)
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddLotModal(true)}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-white flex items-center gap-2 transition-colors font-semibold"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Manual Lot
                </button>
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
            <h2 className="text-xl mt-2 font-semibold">Standalone Lot Wise Purchases Report</h2>
            <p className="text-sm mt-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden print:border-black print:bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Vendor/Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Lot No</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Bil vs Recv</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Short/Excess</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Loss/Gain</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60 print:text-black uppercase tracking-wider">Lot Paid</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/60 print:text-black uppercase tracking-wider print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 print:divide-black/20 text-white print:text-black">
                  {lots.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-white/50 print:text-black text-sm">
                        No manual lot records found.
                      </td>
                    </tr>
                  ) : (
                    lots.map((lot) => {
                      const isShort = lot.shortage_surplus_qty < 0
                      const isExcess = lot.shortage_surplus_qty > 0
                      
                      return (
                        <tr key={lot.id} className="hover:bg-white/5 print:hover:bg-transparent">
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="font-semibold text-white print:text-black">{formatDate(lot.date)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-white print:text-black">{lot.item_name}</div>
                            <div className="text-white/60 print:text-gray-600 text-xs mt-1">{lot.vendor_name}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{lot.lot_no ? <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 print:text-black print:border-none">{lot.lot_no}</span> : '-'}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="text-white/60 print:text-gray-600">Billed: {lot.billed_qty}</div>
                            <div className="font-medium text-white print:text-black border-t border-white/10 pt-1 mt-1">Recv: {lot.received_qty}</div>
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            isShort ? 'text-red-400 print:text-red-700' : 
                            isExcess ? 'text-green-400 print:text-green-700' : 
                            'text-white/50 print:text-gray-500'
                          }`}>
                            {lot.shortage_surplus_qty > 0 ? `+${lot.shortage_surplus_qty}` : lot.shortage_surplus_qty < 0 ? `${lot.shortage_surplus_qty}` : '0'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-white/80 print:text-black">{formatCurrency(lot.rate)}</td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${
                            isShort ? 'text-red-400 print:text-red-700' : 
                            isExcess ? 'text-green-400 print:text-green-700' : 
                            'text-white/50 print:text-gray-500'
                          }`}>
                            {lot.financial_diff > 0 ? `+${formatCurrency(lot.financial_diff)}` : 
                             lot.financial_diff < 0 ? `-${formatCurrency(Math.abs(lot.financial_diff))}` : '0'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="font-semibold text-green-400 print:text-green-700">{formatCurrency(lot.paid_amount || 0)}</div>
                          </td>
                          <td className="px-4 py-3 text-center print:hidden flex gap-2 justify-center">
                            <button
                              onClick={() => openLedgerModal(lot)}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 text-xs font-medium transition-colors"
                            >
                              Ledger
                            </button>
                            <button
                              onClick={() => handleDeleteLot(lot.id)}
                              className="p-1 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
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
          animation: modalEntrance 0.3s ease-out forwards;
        }
      `}} />

      {/* Add Lot Modal */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowAddLotModal(false)}
          />
          <div className="premium-modal relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-gray-900 shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Create Standalone Lot</h2>
            <form onSubmit={handleAddLot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Date</label>
                  <input type="date" required value={newLot.date} onChange={e => setNewLot({...newLot, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Vendor Name</label>
                  <select required value={newLot.vendor_id} onChange={handleVendorSelect} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white">
                    <option value="" className="text-black">Select a Vendor from Master</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id} className="text-black">{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Item Name / Description</label>
                  <input type="text" required value={newLot.item_name} onChange={e => setNewLot({...newLot, item_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Lot Number (Optional)</label>
                  <input type="text" value={newLot.lot_no} onChange={e => setNewLot({...newLot, lot_no: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Billed Quantity</label>
                  <input type="number" step="any" required value={newLot.billed_qty} onChange={e => setNewLot({...newLot, billed_qty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Received Quantity (Optional upfront)</label>
                  <input type="number" step="any" value={newLot.received_qty} onChange={e => setNewLot({...newLot, received_qty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-white/70 mb-1 text-sm">Rate</label>
                  <input type="number" step="any" required value={newLot.rate} onChange={e => setNewLot({...newLot, rate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddLotModal(false)} className="px-5 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/10">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 font-medium">Save Offline Lot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic General Ledger Modal */}
      {showLedgerModal && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500" 
            onClick={() => setShowLedgerModal(false)}
          />
          
          <div className="premium-modal relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-gray-900 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)]">
            {/* Header */}
            <div className="relative flex flex-col border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between px-8 py-5">
                <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  Ledger Actions: <span className="text-pink-400 drop-shadow-md">{selectedLot.lot_no || 'NA'}</span>
                </h3>
                <button 
                  onClick={() => setShowLedgerModal(false)} 
                  className="group rounded-full bg-white/5 border border-white/10 p-2.5 text-white/60 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-white/10"
                >
                  <XMarkIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex border-t border-white/10">
                <button 
                  onClick={() => setActiveTab('receipts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold tracking-wider uppercase text-sm transition-all ${
                    activeTab === 'receipts' 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 border-b-2 border-pink-400' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <ArchiveBoxArrowDownIcon className="h-5 w-5" /> Partial Receipts
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold tracking-wider uppercase text-sm transition-all ${
                    activeTab === 'payments' 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-b-2 border-green-400' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <CurrencyRupeeIcon className="h-5 w-5" /> Offline Payments
                </button>
              </div>
            </div>
            
            <div className="relative p-8">
              {/* Common Financial Summary Cards */}
              <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/50">Total Billed Qty</div>
                  <div className="mt-2 text-lg font-semibold text-white">{selectedLot.billed_qty}</div>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 backdrop-blur-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Total Received Qty</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{selectedLot.received_qty}</div>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 backdrop-blur-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-300">Total Paid ₹</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{formatCurrency(selectedLot.paid_amount || 0)}</div>
                </div>
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 backdrop-blur-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-300">Net Pending ₹</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-md">{formatCurrency(selectedLot.received_amount - (selectedLot.paid_amount || 0))}</div>
                </div>
              </div>

              {/* TABS CONTENT */}
              {activeTab === 'receipts' ? (
                // --- RECEIPTS TAB VIEW ---
                <>
                  <form onSubmit={handleAddReceipt} className="group relative mb-8 grid grid-cols-1 md:grid-cols-4 gap-5 rounded-2xl border border-purple-500/20 bg-white/5 p-6 shadow-xl backdrop-blur-2xl transition-all hover:bg-white/10">
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Receipt Date</label>
                      <input type="date" required value={receiptData.receipt_date} onChange={e => setReceiptData({...receiptData, receipt_date: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20" />
                    </div>
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Qty Part Recv</label>
                      <input type="number" step="any" required value={receiptData.quantity} onChange={e => setReceiptData({...receiptData, quantity: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="e.g. 150.5" />
                    </div>
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Remarks/Prod</label>
                      <input type="text" value={receiptData.reference_no} onChange={e => setReceiptData({...receiptData, reference_no: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="Prod Room A" />
                    </div>
                    <div className="relative md:col-span-1 flex items-end">
                      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 hover:from-pink-400 hover:to-purple-500">
                        <ArchiveBoxArrowDownIcon className="h-5 w-5" /> Push Receipt Part
                      </button>
                    </div>
                  </form>

                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-2xl shadow-inner">
                    <div className="bg-white/5 border-b border-white/10 px-6 py-4">
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/80">
                        <ArchiveBoxArrowDownIcon className="h-5 w-5 text-purple-400" /> Receipt Parts Trace
                      </h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-3">
                      {lotReceipts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 transition-all hover:bg-white/5">
                          <p className="text-sm font-medium text-white/50">No additional partial receipts tracked yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lotReceipts.map(rec => (
                            <div key={rec.id} className="group flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent p-4 transition-all duration-300 hover:border-white/20 hover:from-white/10">
                              <div className="flex items-center gap-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/20">
                                  <ArchiveBoxArrowDownIcon className="h-6 w-6" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">{formatDate(rec.receipt_date)}</div>
                                  <div className="mt-1 text-xs text-white/50">Ref: {rec.reference_no || 'NA'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">+{rec.quantity}</div>
                                <button 
                                  onClick={() => handleDeleteReceipt(rec.id, rec.quantity)} 
                                  className="rounded-full bg-black/20 p-2.5 text-white/20 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all" 
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
                </>
              ) : (
                // --- PAYMENTS TAB VIEW ---
                <>
                  <form onSubmit={handleAddPayment} className="group relative mb-8 grid grid-cols-1 md:grid-cols-4 gap-5 rounded-2xl border border-green-500/20 bg-white/5 p-6 shadow-xl backdrop-blur-2xl transition-all hover:bg-white/10">
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Payment Date</label>
                      <input type="date" required value={paymentData.payment_date} onChange={e => setPaymentData({...paymentData, payment_date: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-green-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Amount Paid</label>
                      <input type="number" step="0.01" required value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-green-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/20" placeholder="₹ 0.00" />
                    </div>
                    <div className="relative md:col-span-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Reference</label>
                      <input type="text" value={paymentData.reference_no} onChange={e => setPaymentData({...paymentData, reference_no: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-green-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/20" placeholder="UPI / Check No." />
                    </div>
                    <div className="relative md:col-span-1 flex items-end">
                      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-105 hover:from-green-400 hover:to-emerald-500">
                        <CurrencyRupeeIcon className="h-5 w-5" /> Push Payment
                      </button>
                    </div>
                  </form>

                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-2xl shadow-inner">
                    <div className="bg-white/5 border-b border-white/10 px-6 py-4">
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/80">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-green-400" /> Transaction Trace
                      </h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-3">
                      {lotPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 transition-all hover:bg-white/5">
                          <p className="text-sm font-medium text-white/50">No payments verified against this lot yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lotPayments.map(pay => (
                            <div key={pay.id} className="group flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent p-4 transition-all duration-300 hover:border-white/20 hover:from-white/10">
                              <div className="flex items-center gap-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 text-green-400 border border-green-500/20">
                                  <span className="text-lg font-bold">₹</span>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">{formatDate(pay.payment_date)}</div>
                                  <div className="mt-1 text-xs text-white/50">Ref: {pay.reference_no || 'NA'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-5">
                                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">+{formatCurrency(pay.amount)}</div>
                                <button 
                                  onClick={() => handleDeletePayment(pay.id, pay.amount)} 
                                  className="rounded-full bg-black/20 p-2.5 text-white/20 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all" 
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
