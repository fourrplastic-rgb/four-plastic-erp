'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BanknotesIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ViewReceiptPage() {
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [bank, setBank] = useState(null)
  const router = useRouter()
  const params = useParams()
  const receiptId = params.id

  useEffect(() => {
    checkAuth()
    if (receiptId) {
      fetchReceipt()
    }
  }, [receiptId])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchReceipt = async () => {
    try {
      setLoading(true)
      console.log('Fetching receipt with ID:', receiptId)
      
      const response = await axios.get(`/api/customer-payments/${receiptId}`)
      console.log('Receipt data:', response.data)
      
      setReceipt(response.data)
      
      // Fetch customer details
      if (response.data.customer_id) {
        try {
          const customerRes = await axios.get(`/api/customers/${response.data.customer_id}`)
          setCustomer(customerRes.data)
        } catch (err) {
          console.error('Error fetching customer:', err)
        }
      }
      
      // Fetch bank details
      if (response.data.bank_id) {
        try {
          const bankRes = await axios.get(`/api/banks/${response.data.bank_id}`)
          setBank(bankRes.data)
        } catch (err) {
          console.error('Error fetching bank:', err)
        }
      }
      
    } catch (error) {
      console.error('Error fetching receipt:', error)
      toast.error('Failed to fetch receipt')
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/customer-payments/${receiptId}`)
      toast.success('Receipt deleted successfully')
      router.push('/payments')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.error || 'Failed to delete receipt')
    }
    setShowDeleteModal(false)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${receipt?.receipt_no}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; background: #fff; }
          .receipt { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-name { font-size: 28px; font-weight: bold; color: #1e3c72; }
          .receipt-title { font-size: 24px; font-weight: bold; margin: 20px 0; color: #059669; }
          .details { margin: 20px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 10px; border-bottom: 1px solid #ddd; }
          .label { font-weight: bold; width: 40%; color: #666; }
          .value { color: #333; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: right; margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .status { display: inline-block; padding: 5px 15px; background: #05966920; color: #059669; border-radius: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">FOUR (R) PLASTIC</div>
            <div>90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA</div>
            <div>GST: 27ABTPV9432F1ZX | PAN: AAAAA0000A</div>
          </div>
          
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <strong>Receipt No:</strong> ${receipt?.receipt_no}<br>
              <strong>Date:</strong> ${formatDate(receipt?.payment_date)}
            </div>
            <div>
              <span class="status">${receipt?.status || 'COMPLETED'}</span>
            </div>
          </div>
          
          <div class="details">
            <table>
              <tr>
                <td class="label">Received From:</td>
                <td class="value"><strong>${customer?.name || receipt?.customer_name || 'N/A'}</strong></td>
              </tr>
              <tr>
                <td class="label">Customer Code:</td>
                <td class="value">${customer?.code || receipt?.customer_code || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Amount:</td>
                <td class="value"><strong>₹${(receipt?.amount || 0).toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td class="label">Payment Mode:</td>
                <td class="value capitalize">${receipt?.payment_mode || 'N/A'} ${getPaymentModeIcon(receipt?.payment_mode)}</td>
              </tr>
              ${receipt?.reference_no ? `
              <tr>
                <td class="label">Reference No:</td>
                <td class="value">${receipt.reference_no}</td>
              </tr>
              ` : ''}
              ${bank ? `
              <tr>
                <td class="label">Bank:</td>
                <td class="value">${bank.name} (${bank.account_no})</td>
              </tr>
              ` : ''}
              ${receipt?.notes ? `
              <tr>
                <td class="label">Notes:</td>
                <td class="value">${receipt.notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="amount">
            Total: ₹${(receipt?.amount || 0).toFixed(2)}
          </div>
          
          <div style="margin: 30px 0; text-align: right;">
            <p>For <strong>FOUR (R) PLASTIC</strong></p>
            <div style="margin-top: 50px;">Authorised Signatory</div>
          </div>
          
          <div class="footer">
            <p>This is a computer generated receipt - valid without signature</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentModeIcon = (mode) => {
    const icons = {
      'cash': '💵',
      'bank': '🏦',
      'cheque': '📝',
      'card': '💳'
    }
    return icons[mode] || '💰'
  }

  const getPaymentModeClass = (mode) => {
    const classes = {
      'cash': 'bg-green-500/20 text-green-400 border-green-500/30',
      'bank': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'cheque': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'card': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
    return classes[mode] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 max-w-md text-center">
          <BanknotesIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Receipt Not Found</h2>
          <p className="text-white/70 mb-6">The receipt you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/payments')}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            Back to Payments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/payments')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <BanknotesIcon className="h-8 w-8 text-green-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Receipt Details
                    </h1>
                    <p className="text-white/50 text-sm">{receipt.receipt_no}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${getPaymentModeClass(receipt.payment_mode)}`}>
                  {getPaymentModeIcon(receipt.payment_mode)} {receipt.payment_mode}
                </span>
                <button
                  onClick={() => router.push(`/payments/receipt/edit/${receiptId}`)}
                  className="p-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 bg-purple-500/20 border border-purple-500/30  rounded-lg text-purple-400 hover:bg-purple-500/30"
                  title="Print"
                >
                  <PrinterIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 bg-red-500/20 border border-red-500/30  rounded-lg text-red-400 hover:bg-red-500/30"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Banner */}
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Payment Received Successfully</p>
                <p className="text-green-400/70 text-sm">This receipt has been recorded and is valid</p>
              </div>
            </div>
          </div>

          {/* Main Receipt Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">PAYMENT RECEIPT</h2>
                  <p className="text-white/50 text-sm mt-1">Official Receipt Voucher</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs">Receipt No</p>
                  <p className="text-white font-mono text-lg">{receipt.receipt_no}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Company Info */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <h3 className="text-white font-semibold text-lg">FOUR (R) PLASTIC</h3>
                <p className="text-white/50 text-sm">90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA</p>
                <p className="text-white/50 text-sm">GST: 27ABTPV9432F1ZX | PAN: AAAAA0000A</p>
              </div>

              {/* Date and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-white/50" />
                  <div>
                    <p className="text-white/50 text-xs">Receipt Date</p>
                    <p className="text-white">{formatDate(receipt.payment_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-white/50" />
                  <div>
                    <p className="text-white/50 text-xs">Status</p>
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {receipt.status || 'COMPLETED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-5 w-5 text-blue-400" />
                  <h3 className="text-white font-semibold">Customer Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/50 text-xs">Name</p>
                    <p className="text-white font-medium">{customer?.name || receipt.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Code</p>
                    <p className="text-white">{customer?.code || receipt.customer_code}</p>
                  </div>
                  {customer?.gst && (
                    <div>
                      <p className="text-white/50 text-xs">GST</p>
                      <p className="text-white">{customer.gst}</p>
                    </div>
                  )}
                  {customer?.phone && (
                    <div>
                      <p className="text-white/50 text-xs">Phone</p>
                      <p className="text-white">{customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-white/50 text-xs">Amount</p>
                    <p className="text-green-400 font-bold text-2xl">{formatCurrency(receipt.amount)}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-white/50 text-xs">Payment Mode</p>
                    <p className="text-white flex items-center gap-1 mt-1 text-lg">
                      <span>{getPaymentModeIcon(receipt.payment_mode)}</span>
                      <span className="capitalize">{receipt.payment_mode}</span>
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-white/50 text-xs">Reference No</p>
                    <p className="text-white font-mono">{receipt.reference_no || '-'}</p>
                  </div>
                  {bank && (
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/50 text-xs">Bank</p>
                      <p className="text-white">{bank.name}</p>
                      <p className="text-white/50 text-xs mt-1">{bank.account_no}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {receipt.notes && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2">Notes</h3>
                  <p className="text-white/70 bg-white/5 p-4 rounded-lg">{receipt.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/50 text-xs">Created</p>
                    <p className="text-white/70 text-sm">{formatDateTime(receipt.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-xs">For FOUR (R) PLASTIC</p>
                    <p className="text-white/70 text-sm mt-4">Authorised Signatory</p>
                  </div>
                </div>
                <p className="text-white/30 text-xs text-center mt-6">
                  This is a computer generated receipt - valid without signature
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-full">
                <TrashIcon className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Delete Receipt</h3>
            </div>
            
            <p className="text-white/70 mb-6">
              Are you sure you want to delete receipt{' '}
              <span className="text-white font-semibold bg-white/10 px-2 py-1 rounded">
                {receipt.receipt_no}
              </span>
              ?<br />
              <span className="text-sm text-white/50 mt-2 block">
                This action cannot be undone. All associated records will also be deleted.
              </span>
            </p>
            
            <div className="bg-white/5 rounded-lg p-3 mb-6">
              <p className="text-white/60 text-sm">Amount: {formatCurrency(receipt.amount)}</p>
              <p className="text-white/60 text-sm">Date: {formatDate(receipt.payment_date)}</p>
              <p className="text-white/60 text-sm">Customer: {customer?.name || receipt.customer_name}</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}