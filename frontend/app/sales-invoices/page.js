'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TallyImportWizard from '@/components/TallyImportWizard'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  PrinterIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

// API Base URL constant
const API_BASE_URL = '/api'

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('all')
  const [dateRange, setDateRange] = useState({
    from_date: '',
    to_date: ''
  })
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [availableYears, setAvailableYears] = useState([])
  
  // Summary stats
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalGST: 0,
    totalGrandTotal: 0
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchInvoices()
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [invoices, searchTerm, selectedCustomer, dateRange, selectedYear, selectedMonth])

  const handleImportSuccess = (invoiceId) => {
    fetchInvoices()
    router.push(`/sales-invoices/${invoiceId}`)
  }

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/sales-invoices`)
      setInvoices(response.data)
      
      // Extract available years
      const years = [...new Set(response.data.map(inv => 
        new Date(inv.invoice_date).getFullYear()
      ))].sort((a, b) => b - a)
      setAvailableYears(years)
      
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers`)
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...invoices]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(inv => 
        inv.invoice_no?.toLowerCase().includes(searchLower) ||
        inv.customer_name?.toLowerCase().includes(searchLower)
      )
    }

    // Apply customer filter
    if (selectedCustomer !== 'all') {
      filtered = filtered.filter(inv => inv.customer_id === parseInt(selectedCustomer))
    }

    // Apply date range filter
    if (dateRange.from_date && dateRange.to_date) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoice_date)
        return invDate >= new Date(dateRange.from_date) && invDate <= new Date(dateRange.to_date)
      })
    }

    // Apply year/month filters
    if (selectedYear !== 'all') {
      filtered = filtered.filter(inv => 
        new Date(inv.invoice_date).getFullYear().toString() === selectedYear
      )

      if (selectedMonth !== 'all') {
        filtered = filtered.filter(inv => 
          (new Date(inv.invoice_date).getMonth() + 1).toString() === selectedMonth
        )
      }
    }

    setFilteredInvoices(filtered)
    
    // Calculate stats
    const totalInvoices = filtered.length
    const totalAmount = filtered.reduce((sum, inv) => sum + (inv.subtotal || 0), 0)
    const totalGST = filtered.reduce((sum, inv) => sum + (inv.gst_total || 0), 0)
    const totalGrandTotal = filtered.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
    
    setStats({ totalInvoices, totalAmount, totalGST, totalGrandTotal })
  }

  const applyDateFilter = () => {
    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      const year = parseInt(selectedYear)
      const month = parseInt(selectedMonth) - 1
      const fromDate = new Date(year, month, 1)
      const toDate = new Date(year, month + 1, 0)
      
      setDateRange({
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0]
      })
    } else if (selectedYear !== 'all') {
      const year = parseInt(selectedYear)
      setDateRange({
        from_date: `${year}-01-01`,
        to_date: `${year}-12-31`
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCustomer('all')
    setSelectedYear('all')
    setSelectedMonth('all')
    setShowCustomDate(false)
    setDateRange({ from_date: '', to_date: '' })
  }

  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to export')
      return
    }
    
    import('xlsx').then(XLSX => {
      const exportData = filteredInvoices.map(inv => ({
        'Invoice Date': formatDate(inv.invoice_date),
        'Invoice No': inv.invoice_no,
        'Customer': inv.customer_name,
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Invoices")
      XLSX.writeFile(workbook, "Sales_Invoices.xlsx")
      toast.success('Excel downloaded successfully')
    })
  }

  const handlePrintReport = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to print')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    // Get customer name for report
    let customerName = 'All Customers'
    if (selectedCustomer !== 'all') {
      const customer = customers.find(c => c.id === parseInt(selectedCustomer))
      customerName = customer?.name || 'Selected Customer'
    }

    // Get period description
    let periodDesc = 'All Time'
    if (dateRange.from_date && dateRange.to_date) {
      periodDesc = `${formatDate(dateRange.from_date)} to ${formatDate(dateRange.to_date)}`
    } else if (selectedYear !== 'all') {
      if (selectedMonth !== 'all') {
        const monthName = months.find(m => m.value === selectedMonth)?.label
        periodDesc = `${monthName} ${selectedYear}`
      } else {
        periodDesc = `Year ${selectedYear}`
      }
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Invoice Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 30px;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e3c72;
          }
          .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e3c72;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 20px;
            color: #666;
            margin-bottom: 10px;
          }
          .filter-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .filter-info p {
            margin: 5px 0;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin: 20px 0; 
          }
          .stat-card { 
            border: 1px solid #ddd; 
            padding: 15px;
            border-radius: 5px;
            background: #f9f9f9;
          }
          .stat-label { 
            font-size: 12px; 
            color: #666; 
            margin-bottom: 5px;
          }
          .stat-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e3c72;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 13px;
          }
          th { 
            background: #1e3c72; 
            color: white; 
            padding: 12px; 
            text-align: left;
            font-size: 12px;
          }
          td { 
            padding: 10px; 
            border-bottom: 1px solid #ddd;
          }
          .text-right { 
            text-align: right; 
          }
          .amount {
            font-weight: 500;
          }
          .grand-total {
            background: #f0f0f0;
            font-weight: bold;
          }
          .footer { 
            margin-top: 40px; 
            text-align: right;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .print-date { 
            color: #666; 
            font-size: 11px; 
            margin-top: 20px;
            text-align: center;
          }
          .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-partial { background: #d1ecf1; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">FOUR (R) PLASTIC</div>
          <div class="report-title">Sales Invoice Report</div>
        </div>
        
        <div class="filter-info">
          <p><strong>Period:</strong> ${periodDesc}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Invoices:</strong> ${filteredInvoices.length}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Invoice Amount</div>
            <div class="stat-value">${formatCurrency(stats.totalAmount)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total GST</div>
            <div class="stat-value">${formatCurrency(stats.totalGST)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Grand Total</div>
            <div class="stat-value">${formatCurrency(stats.totalGrandTotal)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Invoice</div>
            <div class="stat-value">${formatCurrency(stats.totalInvoices > 0 ? stats.totalGrandTotal / stats.totalInvoices : 0)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th class="text-right">Amount</th>
              <th class="text-right">GST</th>
              <th class="text-right">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredInvoices.map(inv => {
              const statusClass = inv.payment_status === 'paid' ? 'status-paid' : 
                                 inv.payment_status === 'pending' ? 'status-pending' : 
                                 'status-partial'
              return `
              <tr>
                <td>${formatDate(inv.invoice_date)}</td>
                <td>${inv.invoice_no}</td>
                <td>${inv.customer_name}</td>
                <td class="text-right amount">${formatCurrency(inv.subtotal)}</td>
                <td class="text-right amount">${formatCurrency(inv.gst_total)}</td>
                <td class="text-right amount">${formatCurrency(inv.grand_total)}</td>
                <td><span class="status-badge ${statusClass}">${inv.payment_status?.toUpperCase() || 'PENDING'}</span></td>
              </tr>
            `}).join('')}
          </tbody>
          <tfoot>
            <tr class="grand-total">
              <td colspan="3" class="text-right"><strong>Grand Total:</strong></td>
              <td class="text-right"><strong>${formatCurrency(stats.totalAmount)}</strong></td>
              <td class="text-right"><strong>${formatCurrency(stats.totalGST)}</strong></td>
              <td class="text-right"><strong>${formatCurrency(stats.totalGrandTotal)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <div>For FOUR (R) PLASTIC</div>
          <div style="margin-top: 40px;">Authorised Signatory</div>
        </div>

        <div class="print-date">
          Printed on: ${new Date().toLocaleString()}
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
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
    return colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
  }

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  SALES INVOICES
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="px-4 py-2 bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 rounded-lg flex items-center gap-2 transition-colors print:hidden"
                >
                  ⚡ Import Tally PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={filteredInvoices.length === 0}
                  className={`px-4 py-2 ${
                    filteredInvoices.length === 0 
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  } rounded-lg flex items-center gap-2 transition-colors print:hidden`}
                  title="Export to Excel"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Excel
                </button>
                <button
                  onClick={handlePrintReport}
                  disabled={filteredInvoices.length === 0}
                  className={`px-4 py-2 ${
                    filteredInvoices.length === 0 
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                  } rounded-lg flex items-center gap-2 transition-colors`}
                  title="Print Report"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Print Report
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by invoice no or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Customer Filter */}
              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                  disabled={selectedYear === 'all'}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Apply Filter Button */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={applyDateFilter}
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/30  rounded-lg text-pink-400 hover:bg-pink-500/30 flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Apply Date Filter
              </button>

              {/* Custom Date Range Toggle */}
              <button
                onClick={() => setShowCustomDate(!showCustomDate)}
                className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
              >
                <CalendarIcon className="h-4 w-4" />
                {showCustomDate ? 'Hide' : 'Show'} Custom Date Range
              </button>
            </div>

            {/* Custom Date Range */}
            {showCustomDate && (
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="date"
                  value={dateRange.from_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <span className="text-white">to</span>
                <input
                  type="date"
                  value={dateRange.to_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            )}

            {/* Clear Filters */}
            {(searchTerm || selectedCustomer !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || dateRange.from_date) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Invoices</p>
              <p className="text-white text-2xl font-bold">{stats.totalInvoices}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total GST</p>
              <p className="text-green-400 text-2xl font-bold">{formatCurrency(stats.totalGST)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-sm">Grand Total</p>
              <p className="text-pink-400 text-2xl font-bold">{formatCurrency(stats.totalGrandTotal)}</p>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-white/60 text-sm">
              Showing {filteredInvoices.length} of {invoices.length} invoices
              {selectedCustomer !== 'all' && ` • Filtered by customer`}
              {selectedYear !== 'all' && ` • Year: ${selectedYear}`}
              {selectedMonth !== 'all' && ` • Month: ${months.find(m => m.value === selectedMonth)?.label}`}
              {dateRange.from_date && ` • Custom Range: ${formatDate(dateRange.from_date)} to ${formatDate(dateRange.to_date)}`}
            </p>
            <button
              onClick={fetchInvoices}
              className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Invoices Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-white/70">{formatDate(invoice.invoice_date)}</td>
                        <td className="px-6 py-4 text-sm text-white font-mono">{invoice.invoice_no}</td>
                        <td className="px-6 py-4 text-sm text-white">{invoice.customer_name}</td>
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
                                const creditDays = invoice.customer_credit_days || 30
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
                            onClick={() => router.push(`/sales-invoices/${invoice.id}`)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                            title="View Invoice"
                          >
                            <EyeIcon className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => window.open(`${API_BASE_URL}/sales-invoices/${invoice.id}/print`)}
                            className="text-green-400 hover:text-green-300"
                            title="Print Invoice"
                          >
                            <PrinterIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <DocumentTextIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50 text-lg">No invoices found</p>
                        <p className="text-white/30 text-sm mt-2">
                          {invoices.length === 0 
                            ? 'Click "New Invoice" to create your first invoice'
                            : 'No invoices match your filters'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Invoice Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => router.push('/sales-invoices/new')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2 shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              New Invoice
            </button>
          </div>
        </main>
      </div>
      <TallyImportWizard 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={handleImportSuccess} 
        defaultIsSales={true} 
      />
    </div>
  )
}