'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function EditReceiptPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [banks, setBanks] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [errors, setErrors] = useState({})
  const router = useRouter()
  const params = useParams()
  const receiptId = params.id

  const [formData, setFormData] = useState({
    date: '',
    customer_id: '',
    amount: '',
    mode: 'cash',
    reference_no: '',
    bank_id: '',
    notes: ''
  })

  useEffect(() => {
    checkAuth()
    if (receiptId) {
      fetchData()
    }
  }, [receiptId])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('Fetching receipt with ID:', receiptId)
      
      // Fetch receipt details
      const receiptRes = await axios.get(`/api/customer-payments/${receiptId}`)
      const receiptData = receiptRes.data
      console.log('Receipt data:', receiptData)
      setReceipt(receiptData)
      
      // Fetch customers and banks for dropdowns
      const [customersRes, banksRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/banks')
      ])
      
      setCustomers(customersRes.data)
      setBanks(banksRes.data)
      
      // Set form data
      setFormData({
        date: receiptData.payment_date?.split('T')[0] || receiptData.payment_date || '',
        customer_id: receiptData.customer_id?.toString() || '',
        amount: receiptData.amount?.toString() || '',
        mode: receiptData.payment_mode || 'cash',
        reference_no: receiptData.reference_no || '',
        bank_id: receiptData.bank_id ? receiptData.bank_id.toString() : '',
        notes: receiptData.notes || ''
      })
      
    } catch (error) {
      console.error('Error fetching receipt:', error)
      toast.error('Failed to fetch receipt details')
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required'
    if (!formData.amount) newErrors.amount = 'Amount is required'
    else if (parseFloat(formData.amount) === 0) newErrors.amount = 'Amount cannot be 0'
    
    if (formData.mode === 'bank' && !formData.bank_id) {
      newErrors.bank_id = 'Bank is required for bank transfer'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setSaving(true)

    try {
      const payload = {
        payment_date: formData.date,
        customer_id: parseInt(formData.customer_id),
        amount: parseFloat(formData.amount),
        payment_mode: formData.mode,
        reference_no: formData.reference_no || null,
        bank_id: formData.bank_id ? parseInt(formData.bank_id) : null,
        notes: formData.notes || ''
      }

      console.log('Updating receipt with payload:', payload)
      
      const response = await axios.put(`/api/customer-payments/${receiptId}`, payload)
      
      console.log('Update response:', response.data)
      toast.success('Receipt updated successfully')
      
      // Redirect back to receipt view
      router.push(`/payments/receipt/${receiptId}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update receipt')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId))
    return customer?.name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading receipt details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <BanknotesIcon className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Edit Receipt
                </h1>
                <p className="text-white/50 text-sm">Update receipt details</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Original Receipt Info */}
          {receipt && (
            <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-300 text-sm">Editing Receipt</p>
                    <p className="text-white font-semibold text-lg">{receipt.receipt_no}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-sm">Original Amount</p>
                  <p className="text-green-400 font-bold text-xl">{formatCurrency(receipt.amount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, date: e.target.value }))
                      if (errors.date) setErrors(prev => ({ ...prev, date: null }))
                    }}
                    required
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                      errors.date ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  />
                </div>
                {errors.date && (
                  <p className="text-red-400 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              {/* Customer */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-green-400" />
                  Customer
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, customer_id: e.target.value }))
                    if (errors.customer_id) setErrors(prev => ({ ...prev, customer_id: null }))
                  }}
                  required
                  className={`w-full px-4 py-3 bg-gray-800 border ${
                    errors.customer_id ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="text-red-400 text-xs mt-1">{errors.customer_id}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, amount: e.target.value }))
                    if (errors.amount) setErrors(prev => ({ ...prev, amount: null }))
                  }}
                  required
                  step="any"
                  className={`w-full px-4 py-3 bg-white/10 border ${
                    errors.amount ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">Payment Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, mode: e.target.value, bank_id: '' }))
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* Bank Selection (only for bank mode) */}
              {formData.mode === 'bank' && (
                <div>
                  <label className="block text-white/80 text-sm mb-2 font-medium flex items-center gap-2">
                    <BuildingLibraryIcon className="h-4 w-4 text-blue-400" />
                    Bank Account
                  </label>
                  <select
                    value={formData.bank_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, bank_id: e.target.value }))
                      if (errors.bank_id) setErrors(prev => ({ ...prev, bank_id: null }))
                    }}
                    required={formData.mode === 'bank'}
                    className={`w-full px-4 py-3 bg-gray-800 border ${
                      errors.bank_id ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="">Select Bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - {bank.account_no}
                      </option>
                    ))}
                  </select>
                  {errors.bank_id && (
                    <p className="text-red-400 text-xs mt-1">{errors.bank_id}</p>
                  )}
                </div>
              )}

              {/* Reference Number */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-yellow-400" />
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_no: e.target.value }))}
                  placeholder="e.g., Cheque/Transaction Number"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Summary Preview */}
              {formData.amount && formData.customer_id && (
                <div className="mt-6 p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm font-medium">Updated Receipt Summary</p>
                      <p className="text-white/80 text-sm mt-1">
                        Customer: <span className="text-white font-medium">{getCustomerName(formData.customer_id)}</span>
                      </p>
                      <p className="text-white/80 text-sm">
                        Mode: <span className="text-white capitalize">{formData.mode}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-300 text-sm">Amount</p>
                      <p className="text-3xl font-bold text-green-400">
                        {formatCurrency(parseFloat(formData.amount) || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 transition-all flex items-center gap-2"
                  disabled={saving}
                >
                  <XCircleIcon className="h-5 w-5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium disabled:opacity-50 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Update Receipt
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
