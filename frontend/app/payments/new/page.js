'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BanknotesIcon,
  CalendarIcon,
  CameraIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

export default function NewPaymentPage() {
  const [transactionType, setTransactionType] = useState('receipt')
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [banks, setBanks] = useState([])
  const [openInvoices, setOpenInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [chequeImage, setChequeImage] = useState(null)
  const [chequePreview, setChequePreview] = useState(null)
  
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    party_id: '',
    amount: '',
    mode: 'cash',
    reference_no: '',
    bank_id: '',
    notes: '',
    invoice_id: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchParties()
    fetchBanks()
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const type = params.get('type')
      const partyId = params.get('party_id')
      if (type) {
        setTransactionType(type)
      }
      if (partyId) {
        setFormData(prev => ({ ...prev, party_id: partyId }))
      }
      setIsInitialLoad(false)
    }
  }, [])

  const [bankBalance, setBankBalance] = useState(null)

  useEffect(() => {
    if (!isInitialLoad) {
      setFormData(prev => ({ ...prev, party_id: '', invoice_id: '', amount: '' }))
      setOpenInvoices([])
    }
  }, [transactionType])

  useEffect(() => {
    if (formData.bank_id) {
      fetchBankBalance(formData.bank_id)
    } else {
      setBankBalance(null)
    }
  }, [formData.bank_id])

  const fetchBankBalance = async (bankId) => {
    try {
      const response = await axios.get(`/api/banks/${bankId}/balance`)
      setBankBalance(response.data.balance)
    } catch (error) {
      console.error('Error fetching bank balance:', error)
      setBankBalance(null)
    }
  }

  useEffect(() => {
    if (formData.party_id) {
      fetchOpenInvoices(formData.party_id)
    } else {
      setOpenInvoices([])
      setFormData(prev => ({ ...prev, invoice_id: '', amount: '' }))
    }
  }, [formData.party_id])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchParties = async () => {
    try {
      const [custRes, vendRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/vendors')
      ])
      setCustomers(custRes.data)
      setVendors(vendRes.data)
    } catch (error) {
      toast.error('Failed to fetch parties')
      console.error('Fetch parties error:', error)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await axios.get('/api/banks')
      setBanks(response.data)
    } catch (error) {
      toast.error('Failed to fetch banks')
    }
  }

  const fetchOpenInvoices = async (partyId) => {
    try {
      const endpoint = transactionType === 'receipt' 
        ? `/api/customer-payments/open-invoices/${partyId}`
        : `/api/vendor-payments/open-invoices/${partyId}`
      
      const response = await axios.get(endpoint)
      setOpenInvoices(response.data || [])
    } catch (err) {
      console.error('Error fetching open invoices:', err)
      setOpenInvoices([])
    }
  }

  const handleInvoiceChange = (e) => {
    const invId = e.target.value
    setFormData(prev => {
      const updated = { ...prev, invoice_id: invId }
      if (invId) {
        const inv = openInvoices.find(i => i.id === parseInt(invId))
        if (inv) {
          updated.amount = inv.balance.toString()
        }
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = transactionType === 'receipt' 
        ? '/api/customer-payments/'
        : '/api/vendor-payments/'

      let cheque_image_path = null

      if (formData.mode === 'cheque' && chequeImage) {
        const uploadData = new FormData()
        uploadData.append('file', chequeImage)
        
        try {
          const uploadRes = await axios.post('/api/upload-cheque', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          cheque_image_path = uploadRes.data.path
        } catch (uploadError) {
          toast.error('Failed to upload cheque image')
          setLoading(false)
          return
        }
      }

      const payload = {
        payment_date: formData.date,
        [transactionType === 'receipt' ? 'customer_id' : 'vendor_id']: parseInt(formData.party_id),
        amount: parseFloat(formData.amount),
        payment_mode: formData.mode,
        reference_no: formData.reference_no || null,
        bank_id: formData.bank_id ? parseInt(formData.bank_id) : null,
        notes: formData.notes || '',
        cheque_image_path: cheque_image_path,
        invoice_id: formData.invoice_id ? parseInt(formData.invoice_id) : null
      }

      await axios.post(endpoint, payload)
      toast.success(`${transactionType === 'receipt' ? 'Receipt' : 'Payment'} recorded successfully`)
      router.push('/payments')
    } catch (error) {
      toast.error(`Failed to record ${transactionType}`)
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <BanknotesIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">
                New Transaction
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setTransactionType('receipt')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  transactionType === 'receipt'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Customer Receipt
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('payment')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  transactionType === 'payment'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Vendor Payment
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">
                  {transactionType === 'receipt' ? 'Customer' : 'Vendor'}
                </label>
                <select
                  value={formData.party_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, party_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="" style={{ color: 'black', backgroundColor: 'white' }}>
                    Select {transactionType === 'receipt' ? 'Customer' : 'Vendor'}
                  </option>
                  {(transactionType === 'receipt' ? customers : vendors).map(party => (
                    <option 
                      key={party.id} 
                      value={party.id}
                      style={{ color: 'black', backgroundColor: 'white' }}
                    >
                      {party.name} ({party.code})
                    </option>
                  ))}
                </select>
              </div>

              {formData.party_id && (
                <div>
                  <label className="block text-white/80 text-sm mb-1">Invoice Allocation (Optional)</label>
                  <select
                    value={formData.invoice_id}
                    onChange={handleInvoiceChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="" style={{ color: 'black', backgroundColor: 'white' }}>
                      On Account (General Payment / Unallocated)
                    </option>
                    {openInvoices.map(inv => (
                      <option 
                        key={inv.id} 
                        value={inv.id}
                        style={{ color: 'black', backgroundColor: 'white' }}
                      >
                        {inv.invoice_no} ({inv.invoice_date}) - Total: ₹{inv.grand_total.toFixed(2)} - Bal: ₹{inv.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-white/80 text-sm mb-1">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  step="any"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Payment Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="cash" style={{ color: 'black', backgroundColor: 'white' }}>Cash</option>
                  <option value="bank" style={{ color: 'black', backgroundColor: 'white' }}>Bank Transfer</option>
                  <option value="cheque" style={{ color: 'black', backgroundColor: 'white' }}>Cheque</option>
                  <option value="card" style={{ color: 'black', backgroundColor: 'white' }}>Card</option>
                </select>
              </div>

              {formData.mode === 'bank' && (
                <div>
                  <label className="block text-white/80 text-sm mb-1">Bank Account</label>
                  <select
                    value={formData.bank_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_id: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="" style={{ color: 'black', backgroundColor: 'white' }}>Select Bank</option>
                    {banks.map(bank => (
                      <option 
                        key={bank.id} 
                        value={bank.id}
                        style={{ color: 'black', backgroundColor: 'white' }}
                      >
                        {bank.name} - {bank.account_no}
                      </option>
                    ))}
                  </select>
                  {bankBalance !== null && (
                    <p className="mt-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider animate-pulse">
                      Live Balance: ₹{bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}

              {formData.mode === 'cheque' && (
                <div>
                  <label className="block text-white/80 text-sm mb-1">Scan Cheque (Optional)</label>
                  
                  {chequePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/20 mt-2">
                      <img src={chequePreview} alt="Cheque Preview" className="w-full object-contain max-h-48" />
                      <button 
                        type="button" 
                        onClick={() => { setChequeImage(null); setChequePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 mt-2">
                      <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <CameraIcon className="h-8 w-8 text-white/50 group-hover:text-pink-400 transition-colors mb-2" />
                        <span className="text-sm text-white/70">Take Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setChequeImage(e.target.files[0])
                              setChequePreview(URL.createObjectURL(e.target.files[0]))
                            }
                          }}
                        />
                      </label>
                      <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <PhotoIcon className="h-8 w-8 text-white/50 group-hover:text-cyan-400 transition-colors mb-2" />
                        <span className="text-sm text-white/70">Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setChequeImage(e.target.files[0])
                              setChequePreview(URL.createObjectURL(e.target.files[0]))
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-white/80 text-sm mb-1">Reference No (Optional)</label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_no: e.target.value }))}
                  placeholder="e.g., Cheque/Transaction No"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Record ${transactionType === 'receipt' ? 'Receipt' : 'Payment'}`}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
