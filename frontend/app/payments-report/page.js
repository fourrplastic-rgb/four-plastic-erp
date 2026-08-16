'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyRupeeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'
const PIE_COLORS = ['#00f5a0', '#00f3ff', '#fbbf24', '#ff007f']

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

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function PaymentsReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Date period state
  const [datePreset, setDatePreset] = useState('this-month')
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  })
  
  // Transaction filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [bankFilter, setBankFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [partySearch, setPartySearch] = useState('')
  
  // Master data
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [banks, setBanks] = useState([])
  const [companies, setCompanies] = useState([])
  
  // Raw and filtered transaction records
  const [allTransactions, setAllTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  
  // Forecast Data
  const [salesInvoices, setSalesInvoices] = useState([])
  const [purchaseInvoices, setPurchaseInvoices] = useState([])
  
  // Image Lightbox State
  const [chequeLightboxUrl, setChequeLightboxUrl] = useState(null)
  
  // Summary Stats
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalPayments: 0,
    netFlow: 0,
    receiptCount: 0,
    paymentCount: 0,
    cashReceipts: 0,
    bankReceipts: 0,
    cashPayments: 0,
    bankPayments: 0
  })

  // Set default dates on load based on default preset
  useEffect(() => {
    setMounted(true)
    applyPreset('this-month')
    fetchMasterData()
  }, [])

  // Refetch when dates change
  useEffect(() => {
    if (dateFilter.from && dateFilter.to) {
      fetchTransactionsAndInvoices()
    }
  }, [dateFilter, companyFilter])

  // Recalculate and filter on filters change
  useEffect(() => {
    applyFiltersAndStats()
  }, [allTransactions, typeFilter, modeFilter, bankFilter, partySearch])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const getBankName = (bankId) => {
    if (!bankId) return '-'
    const bank = banks.find(b => b.id === bankId)
    return bank ? `${bank.name} (${bank.account_no || ''})` : '-'
  }

  const fetchMasterData = async () => {
    try {
      const [customersRes, vendorsRes, banksRes, companiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customers`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/vendors`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/banks`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/company/list`).catch(() => ({ data: [] }))
      ])
      
      setCustomers(customersRes.data || [])
      setVendors(vendorsRes.data || [])
      setBanks(banksRes.data || [])
      setCompanies(companiesRes.data || [])
    } catch (err) {
      console.error('Error fetching master data:', err)
      toast.error('Failed to load support records')
    }
  }

  const applyPreset = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    let fromDate = ''
    let toDate = today.toISOString().split('T')[0]

    switch (preset) {
      case 'today':
        fromDate = today.toISOString().split('T')[0]
        break
      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)
        fromDate = yesterday.toISOString().split('T')[0]
        toDate = fromDate
        break
      case 'this-week':
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
        fromDate = firstDayOfWeek.toISOString().split('T')[0]
        break
      case 'this-month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        break
      case 'last-month':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
        toDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
        break
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        fromDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
        break
      case 'this-fy':
        const currentYear = today.getFullYear()
        const startYear = today.getMonth() >= 3 ? currentYear : currentYear - 1
        fromDate = `${startYear}-04-01`
        toDate = `${startYear + 1}-03-31`
        break
      case 'custom':
        return
      default:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    }

    setDateFilter({ from: fromDate, to: toDate })
  }

  const fetchTransactionsAndInvoices = async () => {
    setLoading(true)
    try {
      checkAuth()
      
      const companyParam = companyFilter !== 'all' ? `&company_id=${companyFilter}` : ''

      const [receiptsRes, paymentsRes, salesRes, purchasesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customer-payments?from=${dateFilter.from}&to=${dateFilter.to}${companyParam}`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/vendor-payments?from=${dateFilter.from}&to=${dateFilter.to}${companyParam}`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/sales-invoices`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/purchase-invoices`).catch(() => ({ data: [] }))
      ])

      // Store invoice data for cash flow forecasting
      setSalesInvoices(salesRes.data || [])
      setPurchaseInvoices(purchasesRes.data || [])

      // Map Receipts
      const receipts = (receiptsRes.data || []).map(r => ({
        id: `rcpt-${r.id}`,
        dbId: r.id,
        date: r.payment_date,
        type: 'receipt',
        docNo: r.receipt_no,
        partyId: r.customer_id,
        partyName: r.customer_name || customers.find(c => c.id === r.customer_id)?.name || 'Unknown Customer',
        mode: r.payment_mode || 'cash',
        bankId: r.bank_id,
        reference: r.reference_no,
        notes: r.notes,
        amount: r.amount || 0,
        invoice_no: r.invoice_no,
        cheque_image_path: r.cheque_image_path
      }))

      // Map Payments
      const payments = (paymentsRes.data || []).map(p => ({
        id: `pay-${p.id}`,
        dbId: p.id,
        date: p.payment_date,
        type: 'payment',
        docNo: p.payment_no,
        partyId: p.vendor_id,
        partyName: p.vendor_name || vendors.find(v => v.id === p.vendor_id)?.name || 'Unknown Vendor',
        mode: p.payment_mode || 'cash',
        bankId: p.bank_id,
        reference: p.reference_no,
        notes: p.notes,
        amount: p.amount || 0,
        invoice_no: p.invoice_no,
        cheque_image_path: p.cheque_image_path
      }))

      const combined = [...receipts, ...payments].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime()
        }
        return b.id.localeCompare(a.id)
      })

      setAllTransactions(combined)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      toast.error('Failed to load transaction data')
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndStats = () => {
    let filtered = [...allTransactions]

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter)
    }

    if (modeFilter !== 'all') {
      filtered = filtered.filter(t => t.mode.toLowerCase() === modeFilter.toLowerCase())
    }

    if (bankFilter !== 'all') {
      filtered = filtered.filter(t => t.bankId === parseInt(bankFilter))
    }

    if (partySearch.trim() !== '') {
      const search = partySearch.toLowerCase()
      filtered = filtered.filter(t => 
        t.partyName?.toLowerCase().includes(search) || 
        t.docNo?.toLowerCase().includes(search) ||
        (t.invoice_no && t.invoice_no.toLowerCase().includes(search)) ||
        (t.reference && t.reference.toLowerCase().includes(search))
      )
    }

    setFilteredTransactions(filtered)

    let totalReceipts = 0
    let totalPayments = 0
    let receiptCount = 0
    let paymentCount = 0
    let cashReceipts = 0
    let bankReceipts = 0
    let cashPayments = 0
    let bankPayments = 0

    filtered.forEach(t => {
      const amt = t.amount
      if (t.type === 'receipt') {
        totalReceipts += amt
        receiptCount++
        if (t.mode === 'cash') cashReceipts += amt
        else bankReceipts += amt
      } else {
        totalPayments += amt
        paymentCount++
        if (t.mode === 'cash') cashPayments += amt
        else bankPayments += amt
      }
    })

    setStats({
      totalReceipts,
      totalPayments,
      netFlow: totalReceipts - totalPayments,
      receiptCount,
      paymentCount,
      cashReceipts,
      bankReceipts,
      cashPayments,
      bankPayments
    })
  }

  const getChartTimelineData = () => {
    const dailyMap = {}
    
    // 1. Add historical days in selected range
    const start = new Date(dateFilter.from)
    const end = new Date(dateFilter.to)
    
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 31) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        dailyMap[dateStr] = { name: formatDateShort(dateStr), receipts: 0, payments: 0, isForecast: false }
      }
      
      filteredTransactions.forEach(t => {
        const dateStr = t.date
        if (dailyMap[dateStr]) {
          if (t.type === 'receipt') dailyMap[dateStr].receipts += t.amount
          else dailyMap[dateStr].payments += t.amount
        }
      })
    } else {
      // Group by Month-Year
      filteredTransactions.forEach(t => {
        const d = new Date(t.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
        
        if (!dailyMap[key]) {
          dailyMap[key] = { name: label, receipts: 0, payments: 0, orderKey: key, isForecast: false }
        }
        if (t.type === 'receipt') dailyMap[key].receipts += t.amount
        else dailyMap[key].payments += t.amount
      })
    }

    const sortedHistory = Object.values(dailyMap).sort((a, b) => (a.orderKey || a.name).localeCompare(b.orderKey || b.name))

    // 2. Compute 30-Day Cash Flow Forecast (Inflow/Outflow Projection)
    const forecastDays = []
    const today = new Date()
    
    // Fetch customer credit days or use default 30
    const getDueDate = (invDateStr) => {
      const invDate = new Date(invDateStr)
      invDate.setDate(invDate.getDate() + 30) // Assuming average 30 credit days
      return invDate.toISOString().split('T')[0]
    }

    // Map sales invoices to future collection dates
    const collectionsMap = {}
    salesInvoices.forEach(inv => {
      if (inv.payment_status !== 'paid' && inv.balance > 0) {
        const dueDate = getDueDate(inv.invoice_date)
        if (new Date(dueDate) >= today) {
          collectionsMap[dueDate] = (collectionsMap[dueDate] || 0) + inv.balance
        }
      }
    })

    // Map purchase invoices to future disbursement dates
    const disbursementsMap = {}
    purchaseInvoices.forEach(inv => {
      if (inv.payment_status !== 'paid' && inv.balance > 0) {
        const dueDate = getDueDate(inv.invoice_date)
        if (new Date(dueDate) >= today) {
          disbursementsMap[dueDate] = (disbursementsMap[dueDate] || 0) + inv.balance
        }
      }
    })

    // Populate next 30 days forecast
    const forecastStart = new Date(today)
    forecastStart.setDate(today.getDate() + 1)
    
    const forecastEnd = new Date(today)
    forecastEnd.setDate(today.getDate() + 30)

    for (let d = new Date(forecastStart); d <= forecastEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const incoming = collectionsMap[dateStr] || 0
      const outgoing = disbursementsMap[dateStr] || 0
      
      if (incoming > 0 || outgoing > 0) {
        forecastDays.push({
          name: `${formatDateShort(dateStr)} (F)`,
          receipts: incoming,
          payments: outgoing,
          isForecast: true,
          orderKey: dateStr
        })
      }
    }

    // Combine history and forecast
    return [...sortedHistory, ...forecastDays]
  }

  const getPieChartData = () => {
    const modes = {}
    filteredTransactions.forEach(t => {
      const mode = t.mode || 'cash'
      modes[mode] = (modes[mode] || 0) + t.amount
    })
    return Object.entries(modes).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }))
  }

  const getPieCellColor = (modeName) => {
    const colorMap = {
      'CASH': '#00f5a0',    // Neon Green
      'BANK': '#00f3ff',    // Neon Cyan
      'CHEQUE': '#fbbf24',  // Amber
      'CARD': '#ff007f'     // Hot Pink
    }
    return colorMap[modeName] || '#8b5cf6'
  }

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No data available to export')
      return
    }

    try {
      const dataRows = filteredTransactions.map((t, idx) => ({
        'S.No': idx + 1,
        'Date': formatDate(t.date),
        'Type': t.type === 'receipt' ? 'RECEIPT (INCOMING)' : 'PAYMENT (OUTGOING)',
        'Document No': t.docNo,
        'Party Name': t.partyName,
        'Allocated Invoice': t.invoice_no || 'On Account',
        'Payment Mode': t.mode.toUpperCase(),
        'Bank Name': t.bankId ? getBankName(t.bankId) : 'N/A',
        'Reference No': t.reference || '-',
        'Notes': t.notes || '-',
        'Receipt Amount (₹)': t.type === 'receipt' ? t.amount : 0,
        'Payment Amount (₹)': t.type === 'payment' ? t.amount : 0
      }))

      const ws = XLSX.utils.json_to_sheet(dataRows)

      XLSX.utils.sheet_add_aoa(ws, [
        [],
        ['SUMMARY STATISTICS'],
        ['Total Receipts', stats.totalReceipts],
        ['Total Payments', stats.totalPayments],
        ['Net Cash Flow', stats.netFlow],
        ['Cash Receipts', stats.cashReceipts],
        ['Bank Receipts', stats.bankReceipts],
        ['Cash Payments', stats.cashPayments],
        ['Bank Payments', stats.bankPayments]
      ], { origin: -1 })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Cash & Bank Statement')

      const fileName = `Payment_Receipt_Report_${dateFilter.from}_to_${dateFilter.to}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success('Report exported to Excel successfully!')
    } catch (err) {
      console.error('Excel export error:', err)
      toast.error('Failed to export report')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report')
      return
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment & Receipt Report (${formatDate(dateFilter.from)} - ${formatDate(dateFilter.to)})</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; background: white; color: #333; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0f766e; padding-bottom: 15px; }
          .company-name { font-size: 26px; font-weight: bold; color: #0f766e; letter-spacing: 1px; }
          .report-title { font-size: 18px; font-weight: bold; color: #4b5563; margin-top: 5px; text-transform: uppercase; }
          .report-date { font-size: 14px; color: #6b7280; margin-top: 5px; }
          
          .summary-container { background: #f0fdfa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ccfbf1; }
          .summary-title { margin-top: 0; color: #0f766e; border-bottom: 1px solid #99f6e4; padding-bottom: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .summary-box { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: bold; }
          .summary-value { font-size: 20px; font-weight: bold; color: #111827; margin-top: 4px; }
          .summary-value.incoming { color: #059669; }
          .summary-value.outgoing { color: #dc2626; }
          
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          th { background: #0f766e; color: white; padding: 10px 8px; text-align: left; font-weight: bold; border: 1px solid #0d9488; }
          td { padding: 9px 8px; border: 1px solid #e5e7eb; vertical-align: middle; }
          tr:nth-child(even) { background-color: #fcfcfc; }
          .receipt-row { color: #047857; font-weight: 500; }
          .payment-row { color: #b91c1c; font-weight: 500; }
          .type-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .type-badge.receipt { background: #d1fae5; color: #065f46; }
          .type-badge.payment { background: #fee2e2; color: #991b1b; }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-semibold { font-weight: bold; }
          .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #9c9c9c; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">FOUR (R) PLASTIC</div>
          <div class="report-title">Cash & Bank Statement (Period Wise)</div>
          <div class="report-date">Statement Period: ${formatDate(dateFilter.from)} to ${formatDate(dateFilter.to)}</div>
        </div>

        <div class="summary-container">
          <h3 class="summary-title">📊 Period Summary</h3>
          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-label">Total Receipts (Incoming)</div>
              <div class="summary-value incoming">${formatCurrency(stats.totalReceipts)}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Total Payments (Outgoing)</div>
              <div class="summary-value outgoing">${formatCurrency(stats.totalPayments)}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Net Flow</div>
              <div class="summary-value ${stats.netFlow >= 0 ? 'incoming' : 'outgoing'}">${formatCurrency(stats.netFlow)}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="10%">Date</th>
              <th width="12%">Type</th>
              <th width="15%">Doc No</th>
              <th width="20%">Party Name</th>
              <th width="13%">Allocated Invoice</th>
              <th width="10%">Mode</th>
              <th width="12%">Bank / Reference</th>
              <th class="text-right" width="13%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.length === 0 ? `
              <tr><td colspan="8" class="text-center" style="color: #888;">No transactions found in this period.</td></tr>
            ` : filteredTransactions.map(t => `
              <tr>
                <td>${formatDate(t.date)}</td>
                <td class="text-center">
                  <span class="type-badge ${t.type}">${t.type === 'receipt' ? 'Receipt' : 'Payment'}</span>
                </td>
                <td style="font-family: monospace;">${t.docNo}</td>
                <td>${t.partyName}</td>
                <td style="font-family: monospace; font-size: 11px;">${t.invoice_no || 'On Account'}</td>
                <td class="text-center" style="text-transform: uppercase;">${t.mode}</td>
                <td>${t.bankId ? getBankName(t.bankId).split(' (')[0] : (t.reference || '-')}</td>
                <td class="text-right font-semibold ${t.type === 'receipt' ? 'receipt-row' : 'payment-row'}">
                  ${t.type === 'receipt' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by FOUR (R) PLASTIC ERP | Date: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isForecast = payload[0].payload.isForecast
      return (
        <div className="bg-black/90 border border-cyan-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md">
          <p className="text-white text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>📅 {label}</span>
            {isForecast && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[8px] border border-yellow-500/30 rounded">
                FORECASTED
              </span>
            )}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-6 text-xs font-semibold py-0.5">
              <span className="text-slate-400" style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-white">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const chartDataList = getChartTimelineData()
  const pieDataList = getPieChartData()

  return (
    <div className="min-h-screen relative animate-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
                title="Back to Dashboard"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <CurrencyRupeeIcon className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Payment & Receipt Report</h1>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Cash Flow & Projections</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTransactionsAndInvoices}
                className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center gap-2 transition-all"
                title="Refresh Report Data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 flex items-center gap-2 transition-all text-sm font-semibold"
              >
                <PrinterIcon className="h-5 w-5 text-purple-400 animate-pulse" />
                Print Statement
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 transition-all text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export Excel
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Filter Panel */}
          <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-2xl transition-all duration-300 hover:border-cyan-500/20">
            <div className="flex items-center gap-2 text-cyan-400 mb-6 border-b border-white/10 pb-3">
              <FunnelIcon className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Statement Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Date Filters */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Period Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['today', 'yesterday', 'this-week', 'this-month', 'last-month', 'this-quarter', 'this-fy', 'custom'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all duration-200 ${
                          datePreset === preset
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                            : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {preset.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">From Date</label>
                    <div className="relative">
                      <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="date"
                        value={dateFilter.from}
                        onChange={(e) => {
                          setDateFilter(prev => ({ ...prev, from: e.target.value }))
                          setDatePreset('custom')
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <span className="text-white/30 mt-4 text-xs font-semibold">to</span>
                  <div className="flex-1">
                    <label className="block text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">To Date</label>
                    <div className="relative">
                      <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="date"
                        value={dateFilter.to}
                        onChange={(e) => {
                          setDateFilter(prev => ({ ...prev, to: e.target.value }))
                          setDatePreset('custom')
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Branch / Company</label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ backgroundColor: '#111' }}
                  >
                    <option className="bg-[#111] text-white" value="all">All Companies</option>
                    {companies.map(c => (
                      <option className="bg-[#111] text-white" key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Transaction Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ backgroundColor: '#111' }}
                  >
                    <option className="bg-[#111] text-white" value="all">All Transactions</option>
                    <option className="bg-[#111] text-white" value="receipt">Receipts (Money In)</option>
                    <option className="bg-[#111] text-white" value="payment">Payments (Money Out)</option>
                  </select>
                </div>
              </div>

              {/* Filters Column 3 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Payment Mode</label>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    style={{ backgroundColor: '#111' }}
                  >
                    <option className="bg-[#111] text-white" value="all">All Modes</option>
                    <option className="bg-[#111] text-white" value="cash">💵 Cash Only</option>
                    <option className="bg-[#111] text-white" value="bank">🏦 Bank Transfer</option>
                    <option className="bg-[#111] text-white" value="cheque">📝 Cheque</option>
                    <option className="bg-[#111] text-white" value="card">💳 Card</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Search Party / Doc / Inv</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Type to filter..."
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-white/30"
                    />
                    {partySearch && (
                      <button 
                        onClick={() => setPartySearch('')}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Receipts Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Receipts (Money In)</p>
              <h3 className="text-3xl font-black text-emerald-400">{formatCurrency(stats.totalReceipts)}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-2">
                <span>Transactions: <b>{stats.receiptCount}</b></span>
                <span>Cash: <b>{formatCurrency(stats.cashReceipts)}</b> | Bank: <b>{formatCurrency(stats.bankReceipts)}</b></span>
              </div>
            </div>

            {/* Payments Card */}
            <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30 rounded-2xl p-5 shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Total Payments (Money Out)</p>
              <h3 className="text-3xl font-black text-red-400">{formatCurrency(stats.totalPayments)}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-2">
                <span>Transactions: <b>{stats.paymentCount}</b></span>
                <span>Cash: <b>{formatCurrency(stats.cashPayments)}</b> | Bank: <b>{formatCurrency(stats.bankPayments)}</b></span>
              </div>
            </div>

            {/* Net Flow Card */}
            <div className={`bg-gradient-to-br ${stats.netFlow >= 0 ? 'from-cyan-500/10 to-teal-500/10 border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'from-amber-500/10 to-red-500/10 border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]'} border rounded-2xl p-5 shadow-inner transition-transform duration-300 hover:scale-[1.02]`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.netFlow >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>Net Period Flow</p>
              <h3 className={`text-3xl font-black ${stats.netFlow >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatCurrency(stats.netFlow)}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-white/50 border-t border-white/5 pt-2">
                <span>Direct Cashflow Balance</span>
                <span className="font-semibold">{stats.netFlow >= 0 ? 'Surplus' : 'Deficit'}</span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts */}
          {mounted && filteredTransactions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Composed Flow Timeline with 30-Day Forecast */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider text-cyan-400">Cash Flow Timeline & 30-Day Projections</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-sm"></div> Historical Inflow</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-sm"></div> Historical Outflow</span>
                    <span className="flex items-center gap-1"><div className="border-t-2 border-dashed border-red-500 w-4"></div> Projected Cash Flow</span>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartDataList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#fff', paddingTop: '10px' }} />
                      <Bar dataKey="receipts" name="Receipts" fill="#00f5a0" radius={[3, 3, 0, 0]} maxBarSize={20} />
                      <Line type="monotone" dataKey="payments" name="Payments" stroke="#ff007f" strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mode Share Pie Chart */}
              <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-cyan-500/20">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 text-cyan-400">Payment Modes Share</h3>
                <div className="h-64 flex flex-col justify-between">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataList}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieDataList.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={getPieCellColor(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center text-[9px] uppercase font-bold tracking-wider">
                    {pieDataList.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPieCellColor(entry.name) }}></div>
                        <span className="text-white/60">{entry.name}: {formatCurrency(entry.value).split('.')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 text-white/60 text-xs font-bold uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-left">Doc No</th>
                    <th className="px-6 py-4 text-left">Party Name</th>
                    <th className="px-6 py-4 text-left">Allocated Invoice</th>
                    <th className="px-6 py-4 text-center">Mode</th>
                    <th className="px-6 py-4 text-left">Bank / Account</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center text-white/40">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-cyan-400 border-r-transparent mr-2"></div>
                        Generating Report...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="max-w-md mx-auto py-6">
                          <XMarkIcon className="h-10 w-10 text-white/20 mx-auto mb-3" />
                          <h3 className="text-white font-semibold text-lg mb-1">No Transactions Found</h3>
                          <p className="text-white/40 text-xs mb-4">No records match the current filter criteria or selected date range.</p>
                          <button 
                            onClick={() => {
                              setTypeFilter('all')
                              setModeFilter('all')
                              setBankFilter('all')
                              setCompanyFilter('all')
                              setPartySearch('')
                              applyPreset('this-month')
                            }}
                            className="px-4 py-2 bg-white/10 border border-white/15 rounded-lg text-white hover:bg-white/20 text-xs font-semibold"
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-white/70">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            t.type === 'receipt' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {t.type === 'receipt' ? 'Receipt' : 'Payment'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-white flex items-center gap-2">
                          <span>{t.docNo}</span>
                          {t.cheque_image_path && (
                            <button
                              onClick={() => setChequeLightboxUrl(t.cheque_image_path)}
                              className="p-1 hover:bg-white/10 rounded text-cyan-400 hover:text-cyan-300 transition-colors"
                              title="Preview Scanned Cheque"
                            >
                              <CameraIcon className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {t.type === 'receipt' ? (
                            <Link 
                              href={`/customer-ledger/${t.partyId}?from_date=${dateFilter.from}&to_date=${dateFilter.to}`}
                              className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-all"
                            >
                              {t.partyName}
                            </Link>
                          ) : (
                            <Link 
                              href={`/vendor-ledger/${t.partyId}?from_date=${dateFilter.from}&to_date=${dateFilter.to}`}
                              className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-all"
                            >
                              {t.partyName}
                            </Link>
                          )}
                          {t.reference && (
                            <span className="block text-xs text-white/40 mt-0.5 font-mono">Ref: {t.reference}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-white/70 text-xs">
                          {t.invoice_no ? (
                            <span className="bg-white/5 px-2.5 py-1 rounded border border-white/5 font-semibold text-white/90">
                              🔗 {t.invoice_no}
                            </span>
                          ) : (
                            <span className="text-white/30 italic">On Account</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.mode === 'cash' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' 
                              : t.mode === 'bank' 
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/10'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10'
                          }`}>
                            {t.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/70">
                          {t.bankId ? getBankName(t.bankId).split(' (')[0] : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right font-bold text-base ${
                          t.type === 'receipt' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {t.type === 'receipt' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Cheque Lightbox Modal overlay */}
      {chequeLightboxUrl && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setChequeLightboxUrl(null)}
        >
          <div className="relative max-w-4xl w-full bg-[#111]/85 border border-white/10 rounded-2xl overflow-hidden p-4 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-white font-bold tracking-wide flex items-center gap-2">
                <CameraIcon className="h-5 w-5 text-cyan-400" />
                Scanned Cheque Preview
              </h3>
              <button 
                onClick={() => setChequeLightboxUrl(null)}
                className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="w-full flex items-center justify-center max-h-[70vh] overflow-hidden rounded-lg bg-black/50 border border-white/5">
              <img 
                src={chequeLightboxUrl} 
                alt="Scanned Cheque" 
                className="max-w-full max-h-[60vh] object-contain shadow-2xl transition-all duration-300"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
              />
            </div>
            <p className="text-white/40 text-xs mt-4">Click anywhere outside this window to close preview.</p>
          </div>
        </div>
      )}
    </div>
  )
}
