"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function EditPaymentPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState([])
  const [banks, setBanks] = useState([])
  const [payment, setPayment] = useState(null)
  const [errors, setErrors] = useState({})
  const router = useRouter()
  const params = useParams()
  const paymentId = params.id

  const [formData, setFormData] = useState({
    date: '',
    vendor_id: '',
    amount: '',
    mode: 'cash',
    reference_no: '',
    bank_id: '',
    notes: ''
  })

  useEffect(() => {
    checkAuth()
    if (paymentId) {
      fetchData()
    }
  }, [paymentId])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('Fetching payment with ID:', paymentId)

      // Fetch payment details
      const paymentRes = await axios.get(`/api/vendor-payments/${paymentId}`)
      const paymentData = paymentRes.data
      console.log('Payment data from API:', paymentData)

      setPayment(paymentData)

      // Fetch vendors and banks for dropdowns
      const [vendorsRes, banksRes] = await Promise.all([
        axios.get('/api/vendors'),
        axios.get('/api/banks')
      ])

      setVendors(vendorsRes.data)
      setBanks(banksRes.data)

      // Set form data
      setFormData({
        date: paymentData.payment_date?.split('T')[0] || paymentData.payment_date || '',
        vendor_id: paymentData.vendor_id?.toString() || '',
        amount: paymentData.amount?.toString() || '',
        mode: paymentData.payment_mode || 'cash',
        reference_no: paymentData.reference_no || '',
        bank_id: paymentData.bank_id ? paymentData.bank_id.toString() : '',
        notes: paymentData.notes || ''
      })

    } catch (error) {
      console.error('Error fetching payment:', error)
      toast.error('Failed to fetch payment details')
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.vendor_id) newErrors.vendor_id = 'Vendor is required'
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
        vendor_id: parseInt(formData.vendor_id),
        amount: parseFloat(formData.amount),
        payment_mode: formData.mode,
        reference_no: formData.reference_no || null,
        bank_id: formData.bank_id ? parseInt(formData.bank_id) : null,
        notes: formData.notes || ''
      }

      console.log('Updating payment with payload:', payload)

      const response = await axios.put(`/api/vendor-payments/${paymentId}`, payload)

      console.log('Update response:', response.data)
      toast.success('Payment updated successfully')

      // Redirect back to payment view
      router.push(`/payments/payment/${paymentId}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update payment')
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

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === parseInt(vendorId))
    return vendor?.name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payment details...</p>
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
              <BanknotesIcon className="h-8 w-8 text-red-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Edit Payment
                </h1>
                <p className="text-white/50 text-sm">Update payment details</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Original Payment Info */}
          {payment && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-300 text-sm">Editing Payment</p>
                    <p className="text-white font-semibold text-lg">{payment.payment_no}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-sm">Original Amount</p>
                  <p className="text-red-400 font-bold text-xl">{formatCurrency(payment.amount)}</p>
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
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${errors.date ? 'border-red-500' : 'border-white/20'
                      } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  />
                </div>
                {errors.date && (
                  <p className="text-red-400 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-white/80 text-sm mb-2 font-medium flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-red-400" />
                  Vendor
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, vendor_id: e.target.value }))
                    if (errors.vendor_id) setErrors(prev => ({ ...prev, vendor_id: null }))
                  }}
                  required
                  className={`w-full px-4 py-3 bg-gray-800 border ${errors.vendor_id ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.code})
                    </option>
                  ))}
                </select>
                {errors.vendor_id && (
                  <p className="text-red-400 text-xs mt-1">{errors.vendor_id}</p>
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
                  className={`w-full px-4 py-3 bg-white/10 border ${errors.amount ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                )}
                {payment && payment.amount !== parseFloat(formData.amount) && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Original amount: {formatCurrency(payment.amount)}
                  </p>
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

              {/* Bank Selection */}
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
                    className={`w-full px-4 py-3 bg-gray-800 border ${errors.bank_id ? 'border-red-500' : 'border-white/20'
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
              {formData.amount && formData.vendor_id && (
                <div className="mt-6 p-5 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-300 text-sm font-medium">Updated Payment Summary</p>
                      <p className="text-white/80 text-sm mt-1">
                        Vendor: <span className="text-white font-medium">{getVendorName(formData.vendor_id)}</span>
                      </p>
                      <p className="text-white/80 text-sm">
                        Mode: <span className="text-white capitalize">{formData.mode}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-300 text-sm">Amount</p>
                      <p className="text-3xl font-bold text-red-400">
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium disabled:opacity-50 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Update Payment
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