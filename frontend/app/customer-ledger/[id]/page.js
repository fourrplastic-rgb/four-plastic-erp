'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarIcon,
  PrinterIcon,
  UserIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline'

const WhatsAppIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
)
import { useFinancialYear } from '@/context/FinancialYearContext'

export default function CustomerLedgerPage() {
  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [customDateRange, setCustomDateRange] = useState({
    from_date: '',
    to_date: ''
  })
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [availableYears, setAvailableYears] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [dateRange, setDateRange] = useState({
    from_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPayments: 0,
    totalInvoices: 0,
    averageInvoice: 0,
    outstanding: 0,
    lastTransactionDate: null
  })
  
  const router = useRouter()
  const params = useParams()
  const customerId = params.id
  
  const { selectedYear: activeFY } = useFinancialYear()

  useEffect(() => {
    if (activeFY) {
      setDateRange({
        from_date: activeFY.start_date,
        to_date: activeFY.end_date
      })
    }
  }, [activeFY])

  useEffect(() => {
    checkAuth()
    if (customerId && dateRange.from_date && dateRange.to_date) {
      fetchLedger()
    }
  }, [customerId, dateRange])

  useEffect(() => {
    if (ledger?.transactions) {
      const years = [...new Set(ledger.transactions.map(t => 
        new Date(t.transaction_date).getFullYear()
      ))].sort((a, b) => b - a)
      setAvailableYears(years)
      applyFilters()
      calculateStats()
    }
  }, [ledger, searchTerm, selectedYear, selectedMonth, dateRange])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `/api/customer-ledger/${customerId}?from_date=${dateRange.from_date}&to_date=${dateRange.to_date}`
      )
      setLedger(response.data)
    } catch (error) {
      console.error('Error fetching ledger:', error)
      toast.error('Failed to fetch ledger')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!ledger?.transactions) return

    const sales = ledger.transactions.filter(t => t.transaction_type === 'SALES')
    const payments = ledger.transactions.filter(t => t.transaction_type === 'PAYMENT')
    
    const totalSales = sales.reduce((sum, t) => sum + t.debit, 0)
    const totalPayments = payments.reduce((sum, t) => sum + t.credit, 0)
    const totalInvoices = sales.length
    const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0
    const outstanding = ledger.customer?.current_balance || 0
    const lastTransactionDate = ledger.transactions.length > 0 
      ? ledger.transactions[ledger.transactions.length - 1]?.transaction_date 
      : null

    setStats({
      totalSales,
      totalPayments,
      totalInvoices,
      averageInvoice,
      outstanding,
      lastTransactionDate
    })
  }

  const applyFilters = () => {
    if (!ledger?.transactions) return

    let filtered = [...ledger.transactions]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.reference_no?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        formatDate(t.transaction_date).includes(searchTerm)
      )
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date).getFullYear().toString() === selectedYear
      )

      if (selectedMonth !== 'all') {
        filtered = filtered.filter(t => 
          (new Date(t.transaction_date).getMonth() + 1).toString() === selectedMonth
        )
      }
    }

    setFilteredTransactions(filtered)
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
    } else if (showCustomDate && customDateRange.from_date && customDateRange.to_date) {
      setDateRange(customDateRange)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedYear('all')
    setSelectedMonth('all')
    setShowCustomDate(false)
    setCustomDateRange({ from_date: '', to_date: '' })
    setDateRange({
      from_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0]
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // ✅ UPDATED: Format description with Qty × Rate for each item
  const formatDescription = (transaction) => {
    if (!transaction) return '-'
    
    // If it's a sales transaction with items, show each item with Qty × Rate
    if (transaction.transaction_type === 'SALES' && transaction.items && transaction.items.length > 0) {
      return (
        <div className="space-y-1">
          {transaction.items.map((item, idx) => {
            const qty = Number(item.quantity) || 0
            const rate = Number(item.rate) || 0
            const amount = qty * rate
            return (
              <div key={idx} className="text-sm">
                <span className="text-white">{item.item_name}</span>
                <span className="text-white/50 mx-1">→</span>
                <span className="text-yellow-400">{qty}</span>
                <span className="text-white/50"> × </span>
                <span className="text-green-400">{formatCurrency(rate)}</span>
                <span className="text-white/50"> = </span>
                <span className="text-blue-400">{formatCurrency(amount)}</span>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Return regular description or fallback
    const desc = transaction.description || '-'
    return <span className="text-white/70">{desc}</span>
  }
  const handleWhatsAppReminder = () => {
    if (!ledger?.customer) return;
    const phone = ledger.customer.phone || ledger.customer.mobile;
    if (!phone) {
      toast.error('No phone number available for this customer');
      return;
    }
    
    // Format currency inline
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount || 0);
    };

    const balance = ledger.customer.current_balance;
    // Don't remind if balance is not positive (meaning we don't owe, or they don't owe)
    // Positive balance in customer ledger means they owe money (debit > credit).
    
    if (balance <= 0) {
      toast.success('No outstanding balance for this customer');
      // They can still send a message, but let's warn
    }
    
    // Calculate total quantity across visible transactions
    let totalQty = 0;
    if (ledger?.transactions) {
      ledger.transactions.forEach(t => {
        if (t.transaction_type === 'SALES' && t.items) {
          t.items.forEach(item => { totalQty += Number(item.quantity) || 0; });
        }
      });
    }
    
    const customerName = ledger.customer.name;
    const date = new Date().toLocaleDateString('en-IN');
    
    const qtyText = totalQty > 0 ? ` (in relation to ${totalQty} units/kg)` : '';
    
    let text = '';
    if (balance > 0) {
      text = `Dear ${customerName},\n\nThis is a friendly reminder from FOUR (R) PLASTIC regarding your outstanding payment of *${formatCurrency(balance)}*${qtyText} as of ${date}.\n\nPlease arrange to clear the dues at your earliest convenience.\n\nThank you for your business!`;
    } else {
      text = `Dear ${customerName},\n\nGreetings from FOUR (R) PLASTIC! Your account statement as of ${date} shows a nil or advance balance of *${formatCurrency(Math.abs(balance))}*${qtyText}.\n\nThank you for your business!`;
    }
    
    const encodedText = encodeURIComponent(text);
    
    // Clean phone number (remove spaces, ensure country code)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Fallback to Indian code if exactly 10 digits
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

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
        <title>Customer Ledger - ${ledger?.customer?.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #1f2937; font-size: 12px; }
          
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .company-details h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 4px 0; letter-spacing: -0.5px; }
          .company-details p { margin: 0 0 2px 0; color: #4b5563; font-size: 11px; }
          .document-title { text-align: right; }
          .document-title h2 { font-size: 20px; color: #3b82f6; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px; }
          .document-title p { margin: 0; color: #6b7280; font-size: 11px; }
          
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .party-info h3 { margin: 0 0 8px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .party-info p { margin: 2px 0; color: #111827; }
          .period-info { text-align: right; }
          .period-info p { margin: 2px 0; color: #4b5563; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .stat-value { font-size: 16px; font-weight: 600; color: #111827; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f3f4f6; color: #374151; padding: 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #d1d5db; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          tr:nth-child(even) { background-color: #f9fafb; }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .debit { color: #dc2626; font-weight: 500; }
          .credit { color: #059669; font-weight: 500; }
          .balance-val { font-weight: 600; }
          
          .type-badge { display: inline-block; padding: 2px 6px; background: #e5e7eb; border-radius: 4px; font-size: 10px; color: #374151; font-weight: 500; }
          .type-badge.sales { background: #dbeafe; color: #1d4ed8; }
          .type-badge.payment { background: #d1fae5; color: #047857; }
          .type-badge.opening { background: #f3f4f6; color: #4b5563; }
          
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #9ca3af; margin-top: 50px; padding-top: 8px; font-size: 11px; color: #4b5563; }
          .print-date { color: #9ca3af; font-size: 10px; margin-top: 20px; text-align: center; }
          
          .item-line { margin: 4px 0; font-size: 11px; color: #4b5563; }
          .ref-text { font-family: monospace; color: #374151; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header-section">
          <div class="company-details">
            <h1>FOUR (R) PLASTIC</h1>
            <p>Customer Ledger Statement</p>
          </div>
          <div class="document-title">
            <h2>Ledger Account</h2>
            <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="party-info">
            <h3>Customer Details</h3>
            <p style="font-weight: 600; font-size: 14px;">${ledger?.customer?.name}</p>
            <p style="font-family: monospace; color: #6b7280;">${ledger?.customer?.code}</p>
          </div>
          <div class="period-info">
            <p><strong>Period From:</strong> ${formatDate(dateRange.from_date)}</p>
            <p><strong>Period To:</strong> ${formatDate(dateRange.to_date)}</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Opening Balance</div>
            <div class="stat-value">${formatCurrency(ledger?.customer?.opening_balance || 0)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Current Balance</div>
            <div class="stat-value ${ledger?.customer?.current_balance > 0 ? 'debit' : 'credit'}">${formatCurrency(ledger?.customer?.current_balance || 0)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Sales</div>
            <div class="stat-value">${formatCurrency(stats.totalSales)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Payments</div>
            <div class="stat-value">${formatCurrency(stats.totalPayments)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reference No</th>
              <th>Description / Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Debit (Sales)</th>
              <th class="text-right">Credit (Payment)</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(trans => {
              let itemsHtml = ''
              let qtyHtml = ''
              let rateHtml = ''
              
              if (trans.transaction_type === 'SALES' && trans.items && trans.items.length > 0) {
                itemsHtml = trans.items.map(item => `<div class="item-line"><strong>${item.item_name || item.name || ''}</strong></div>`).join('')
                qtyHtml = trans.items.map(item => `<div class="item-line">${item.quantity || item.qty || 0} ${item.unit || ''}</div>`).join('')
                rateHtml = trans.items.map(item => `<div class="item-line">${formatCurrency(item.rate || 0)}</div>`).join('')
              } else {
                itemsHtml = `<div class="item-line">${trans.description || '-'}</div>`
                qtyHtml = `<div class="item-line">-</div>`
                rateHtml = `<div class="item-line">-</div>`
              }
              
              const badgeClass = trans.transaction_type === 'SALES' ? 'sales' : trans.transaction_type === 'PAYMENT' ? 'payment' : 'opening';
              
              return '<tr>' +
                '<td style="white-space: nowrap;">' + formatDate(trans.transaction_date) + '</td>' +
                '<td><span class="type-badge ' + badgeClass + '">' + trans.transaction_type + '</span></td>' +
                '<td><div class="ref-text">' + (trans.reference_no || '-') + '</div></td>' +
                '<td>' + itemsHtml + '</td>' +
                '<td class="text-right">' + qtyHtml + '</td>' +
                '<td class="text-right">' + rateHtml + '</td>' +
                '<td class="text-right debit">' + (trans.debit != null && trans.debit !== 0 ? formatCurrency(trans.debit) : '-') + '</td>' +
                '<td class="text-right credit">' + (trans.credit != null && trans.credit !== 0 ? formatCurrency(trans.credit) : '-') + '</td>' +
                '<td class="text-right balance-val">' + formatCurrency(trans.balance) + '</td>' +
              '</tr>'
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p style="color: #6b7280; font-size: 11px; margin: 0;">This is a computer generated statement.</p>
          </div>
          <div class="signature-box">
            <div class="signature-line">For FOUR (R) PLASTIC<br/>Authorised Signatory</div>
          </div>
        </div>

        <div class="print-date">
          Printed on: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading ledger...</p>
        </div>
      </div>
    )
  }

  if (!ledger) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Customer not found</div>
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
                  onClick={() => router.push('/outstanding-report')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Customer Ledger
                  </h1>
                  <p className="text-white/60 text-sm">{ledger.customer?.name} ({ledger.customer?.code})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/payments/new?type=receipt&party_id=${customerId}`)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 flex items-center gap-2 transition-all font-semibold shadow-[0_0_15px_rgba(219,39,119,0.3)] hover:scale-105 mr-2"
                >
                  ➕ Record Receipt
                </button>
                <button
                  onClick={handleWhatsAppReminder}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 transition-colors mr-2 font-medium"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Reminder
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30 flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={fetchLedger}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShoppingCartIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Sales</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(stats.totalSales)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CreditCardIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Payments</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(stats.totalPayments)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Invoices</p>
                  <p className="text-white font-bold text-lg">{stats.totalInvoices}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Outstanding</p>
                  <p className="text-red-400 font-bold text-lg">{formatCurrency(stats.outstanding)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-xs">Opening Balance</p>
              <p className="text-white font-bold text-lg">{formatCurrency(ledger.customer?.opening_balance || 0)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-xs">Current Balance</p>
              <p className={`font-bold text-lg ${ledger.customer?.current_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(ledger.customer?.current_balance || 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-xs">Credit Limit</p>
              <p className="text-white font-bold text-lg">{formatCurrency(ledger.customer?.credit_limit || 0)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <p className="text-white/60 text-xs">Average Invoice</p>
              <p className="text-white font-bold text-lg">{formatCurrency(stats.averageInvoice)}</p>
            </div>
          </div>

          {/* Date Range Display */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm">
                Showing transactions from <span className="text-white">{formatDate(dateRange.from_date)}</span> to <span className="text-white">{formatDate(dateRange.to_date)}</span>
              </p>
              {stats.lastTransactionDate && (
                <p className="text-white/60 text-sm">
                  Last Transaction: <span className="text-white">{formatDate(stats.lastTransactionDate)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by reference, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

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

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                  disabled={selectedYear === 'all'}
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={applyDateFilter}
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/30  rounded-lg text-pink-400 hover:bg-pink-500/30 flex items-center justify-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Apply Filter
              </button>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setShowCustomDate(!showCustomDate)}
                className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
              >
                <CalendarIcon className="h-4 w-4" />
                {showCustomDate ? 'Hide' : 'Show'} Custom Date Range
              </button>
            </div>

            {showCustomDate && (
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="date"
                  value={customDateRange.from_date}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <span className="text-white">to</span>
                <input
                  type="date"
                  value={customDateRange.to_date}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <button
                  onClick={applyDateFilter}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30"
                >
                  Apply
                </button>
              </div>
            )}

            {(searchTerm || selectedYear !== 'all' || selectedMonth !== 'all' || showCustomDate) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-white/60 text-sm">
              Showing {filteredTransactions.length} of {ledger.transactions?.length || 0} transactions
              {selectedYear !== 'all' && ` • Year: ${selectedYear}`}
              {selectedMonth !== 'all' && ` • Month: ${new Date(2000, parseInt(selectedMonth) - 1, 1).toLocaleString('default', { month: 'long' })}`}
            </p>
            <p className="text-white/60 text-sm">
              Running Balance: <span className="text-white font-semibold">{formatCurrency(filteredTransactions[filteredTransactions.length - 1]?.balance || ledger.customer?.opening_balance || 0)}</span>
            </p>
          </div>

          {/* Transactions Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Reference No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Description / Item</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Debit (Sales)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Credit (Payment)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {/* Transactions */}
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-white/50">
                        No transactions in this period
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((trans, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white/70 align-top">{formatDate(trans.transaction_date)}</td>
                        <td className="px-4 py-3 text-sm align-top">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            trans.transaction_type === 'SALES' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : trans.transaction_type === 'PAYMENT'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {trans.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-mono align-top">{trans.reference_no || '-'}</td>
                        
                        {trans.transaction_type === 'SALES' && trans.items && trans.items.length > 0 ? (
                          <>
                            <td className="px-4 py-3 text-sm align-top">
                              <div className="space-y-1">
                                {trans.items.map((item, idx) => (
                                  <div key={idx} className="text-white">{item.item_name}</div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm align-top text-right">
                              <div className="space-y-1">
                                {trans.items.map((item, idx) => (
                                  <div key={idx} className="text-yellow-400">{item.quantity} {item.unit || ''}</div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm align-top text-right">
                              <div className="space-y-1">
                                {trans.items.map((item, idx) => (
                                  <div key={idx} className="text-green-400">{formatCurrency(item.rate)}</div>
                                ))}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm align-top text-white/70">{trans.description || '-'}</td>
                            <td className="px-4 py-3 text-sm align-top text-right text-white/50">-</td>
                            <td className="px-4 py-3 text-sm align-top text-right text-white/50">-</td>
                          </>
                        )}
                        
                        <td className="px-4 py-3 text-sm text-red-400 text-right align-top">{trans.debit != null && trans.debit !== 0 ? formatCurrency(trans.debit) : '-'}</td>
                        <td className="px-4 py-3 text-sm text-green-400 text-right align-top">{trans.credit != null && trans.credit !== 0 ? formatCurrency(trans.credit) : '-'}</td>
                        <td className="px-4 py-3 text-sm text-white font-semibold text-right align-top">{formatCurrency(trans.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/50 text-xs">Total Sales (Debit)</p>
                  <p className="text-red-400 font-semibold">
                    {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.debit || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Total Payments (Credit)</p>
                  <p className="text-green-400 font-semibold">
                    {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.credit || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Net Change</p>
                  <p className="text-white font-semibold">
                    {formatCurrency(
                      filteredTransactions.reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}