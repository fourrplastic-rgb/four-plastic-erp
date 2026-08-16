'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import TallyImportWizard from '@/components/TallyImportWizard'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  ShoppingCartIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleImportSuccess = (invoiceId) => {
    fetchInvoices()
    router.push(`/purchase-invoices/${invoiceId}`)
  }

  useEffect(() => {
    checkAuth()
    fetchInvoices()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/api/purchase-invoices')
      setInvoices(response.data)
    } catch (error) {
      toast.error('Failed to fetch purchase invoices')
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [invoices, searchTerm])

  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to export')
      return
    }
    
    import('xlsx').then(XLSX => {
      const exportData = filteredInvoices.map(inv => ({
        'Invoice Date': formatDate(inv.invoice_date),
        'Invoice No': inv.invoice_no,
        'Vendor': inv.vendor_name,
        'Subtotal': inv.subtotal,
        'CGST': inv.cgst_total,
        'SGST': inv.sgst_total,
        'IGST': inv.igst_total,
        'Total GST': inv.gst_total,
        'Grand Total': inv.grand_total,
        'Status': inv.payment_status?.toUpperCase() || 'PENDING'
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Invoices")
      XLSX.writeFile(workbook, "Purchase_Invoices.xlsx")
      toast.success('Excel downloaded successfully')
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const colors = {
      'paid': 'bg-green-500/20 text-green-400',
      'pending': 'bg-yellow-500/20 text-yellow-400',
      'partial': 'bg-blue-500/20 text-blue-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
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
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCartIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  PURCHASE INVOICES
                </h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search by invoice no or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                ⚡ Import Tally PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredInvoices.length === 0}
                className={`px-4 py-2 ${
                  filteredInvoices.length === 0 
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                } rounded-lg flex items-center justify-center gap-2`}
                title="Export to Excel"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={() => router.push('/purchase-invoices/new')}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                New Purchase Invoice
              </button>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-12 text-center">
              <ShoppingCartIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl text-white mb-2">No Purchase Invoices Yet</h3>
              <p className="text-white/50 mb-6">Create your first purchase invoice to get started</p>
              <button
                onClick={() => router.push('/purchase-invoices/new')}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Invoice No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">GST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-white/70">{formatDate(invoice.invoice_date)}</td>
                        <td className="px-6 py-4 text-sm text-white font-mono">{invoice.invoice_no}</td>
                        <td className="px-6 py-4 text-sm text-white">{invoice.vendor_name}</td>
                        <td className="px-6 py-4 text-sm text-white/70">{formatCurrency(invoice.subtotal)}</td>
                        <td className="px-6 py-4 text-sm text-green-400">{formatCurrency(invoice.gst_total)}</td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">{formatCurrency(invoice.grand_total)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(invoice.payment_status)}`}>
                              {invoice.payment_status?.toUpperCase() || 'PENDING'}
                            </span>
                            {invoice.payment_status?.toLowerCase() !== 'paid' && (
                              (() => {
                                const invDate = new Date(invoice.invoice_date)
                                const creditDays = invoice.vendor_credit_days || 30
                                invDate.setDate(invDate.getDate() + creditDays)
                                const isOverdue = invDate < new Date()
                                return isOverdue ? (
                                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-black tracking-wider animate-pulse">
                                    OVERDUE
                                  </span>
                                ) : null
                              })()
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => router.push(`/purchase-invoices/${invoice.id}`)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                            title="View Invoice"
                          >
                            <EyeIcon className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => {/* Print functionality */}}
                            className="text-green-400 hover:text-green-300"
                            title="Print Invoice"
                          >
                            <PrinterIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      <TallyImportWizard 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={handleImportSuccess} 
        defaultIsSales={false} 
      />
    </div>
  )
}