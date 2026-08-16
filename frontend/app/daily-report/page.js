'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TruckIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  BeakerIcon,
  HomeIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function DailyReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyData, setDailyData] = useState({
    date: '',
    production: [],
    purchaseInvoices: [],
    deliveryChallans: [],
    customerReceipts: [],
    vendorPayments: [],
    summary: {
      totalProductionQty: 0,
      totalProductionValue: 0,
      totalPurchaseAmount: 0,
      totalDeliveryQty: 0,
      totalReceipts: 0,
      totalPayments: 0
    }
  })

  useEffect(() => {
    checkAuth()
    fetchDailyReport()
  }, [reportDate])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchDailyReport = async () => {
    try {
      setLoading(true)
      
      const response = await axios.get(`${API_BASE_URL}/daily-report?date=${reportDate}`)
      
      setDailyData({
        date: response.data.date,
        production: response.data.production || [],
        purchaseInvoices: response.data.purchaseInvoices || [],
        deliveryChallans: response.data.deliveryChallans || [],
        customerReceipts: response.data.customerReceipts || [],
        vendorPayments: response.data.vendorPayments || [],
        summary: response.data.summary || {
          totalProductionQty: 0,
          totalProductionValue: 0,
          totalPurchaseAmount: 0,
          totalDeliveryQty: 0,
          totalReceipts: 0,
          totalPayments: 0
        }
      })

    } catch (error) {
      console.error('Error fetching daily report:', error)
      toast.error('Failed to fetch daily report')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount || 0)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Report - ${formatDate(reportDate)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e3c72; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e3c72; }
          .report-title { font-size: 18px; color: #666; margin-top: 5px; }
          .report-date { font-size: 14px; color: #888; margin-top: 5px; }
          .summary-section { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }
          .summary-card { background: white; padding: 10px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .summary-label { font-size: 12px; color: #666; }
          .summary-value { font-size: 18px; font-weight: bold; color: #1e3c72; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; background: #1e3c72; color: white; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; text-align: right; padding-top: 20px; border-top: 1px solid #ddd; }
          .print-date { font-size: 10px; color: #999; margin-top: 20px; text-align: center; }
          .receipt-row { background-color: #e8f5e9; }
          .payment-row { background-color: #ffebee; }
          .receipt-text { color: #2e7d32; font-weight: bold; }
          .payment-text { color: #c62828; font-weight: bold; }
          .item-list { font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">FOUR (R) PLASTIC</div>
          <div class="report-title">Daily Activity Report</div>
          <div class="report-date">Date: ${formatDate(reportDate)}</div>
        </div>

        <div class="summary-section">
          <h3>📊 Day Summary</h3>
          <div class="summary-grid">
            <div class="summary-card"><div class="summary-label">🏭 Production Quantity</div><div class="summary-value">${dailyData.summary.totalProductionQty.toFixed(2)} units</div></div>
            <div class="summary-card"><div class="summary-label">💰 Production Value</div><div class="summary-value">${formatCurrency(dailyData.summary.totalProductionValue)}</div></div>
            <div class="summary-card"><div class="summary-label">📦 Delivery Challans</div><div class="summary-value">${dailyData.deliveryChallans.length} (${dailyData.summary.totalDeliveryQty.toFixed(2)} units)</div></div>
            <div class="summary-card"><div class="summary-label">🛒 Purchase Invoices</div><div class="summary-value">${dailyData.purchaseInvoices.length} (${formatCurrency(dailyData.summary.totalPurchaseAmount)})</div></div>
            <div class="summary-card"><div class="summary-label">💰 Receipts (Money In)</div><div class="summary-value">${formatCurrency(dailyData.summary.totalReceipts)}</div></div>
            <div class="summary-card"><div class="summary-label">💸 Payments (Money Out)</div><div class="summary-value">${formatCurrency(dailyData.summary.totalPayments)}</div></div>
          </div>
        </div>

        <!-- Production Section -->
        <div class="section">
          <div class="section-title">🏭 Finished Goods Production</div>
          ${dailyData.production.length > 0 ? `
            <table>
              <thead><tr><th>Item Name</th><th>Quantity</th><th>Unit</th><th>Rate</th><th class="text-right">Total Value</th></tr></thead>
              <tbody>
                ${dailyData.production.map(item => `
                  <tr><td>${item.item_name || '-'}</td><td>${(item.quantity_produced || 0).toFixed(2)}</td><td>${item.unit || 'NOS'}</td><td>${formatCurrency(item.rate || 0)}</td><td class="text-right">${formatCurrency((item.quantity_produced || 0) * (item.rate || 0))}</td></tr>
                `).join('')}
                <tr style="background:#f0f0f0;font-weight:bold;"><td colspan="4">Total</td><td class="text-right">${formatCurrency(dailyData.summary.totalProductionValue)}</td></tr>
              </tbody>
            </table>
          ` : '<p style="color:#888;">No production recorded for this day.</p>'}
        </div>

        <!-- Purchase Invoices Section -->
        <div class="section">
          <div class="section-title">🛒 Purchase Invoices</div>
          ${dailyData.purchaseInvoices.length > 0 ? `
            <table>
              <thead><tr><th>Invoice No</th><th>Party Name</th><th>Items (Qty & Unit)</th><th class="text-right">Total Amount</th></tr></thead>
              <tbody>
                ${dailyData.purchaseInvoices.map(inv => `
                  <tr>
                    <td>${inv.invoice_no || '-'}</td>
                    <td>${inv.vendor_name || '-'}</td>
                    <td class="item-list">${(inv.items || []).map(item => `${item.item_name}: ${item.quantity || 0} ${item.unit || ''}`).join('<br/>') || '-'}</td>
                    <td class="text-right">${formatCurrency(inv.grand_total || inv.total || 0)}</td>
                  </tr>
                `).join('')}
                <tr style="background:#f0f0f0;font-weight:bold;"><td colspan="3">Total</td><td class="text-right">${formatCurrency(dailyData.summary.totalPurchaseAmount)}</td></tr>
              </tbody>
            </table>
          ` : '<p style="color:#888;">No purchase invoices for this day.</p>'}
        </div>

        <!-- Delivery Challans Section -->
        <div class="section">
          <div class="section-title">📦 Delivery Challans</div>
          ${dailyData.deliveryChallans.length > 0 ? `
            <table>
              <thead><tr><th>Challan No</th><th>Customer Name</th><th>Items (Qty & Unit)</th><th class="text-right">Total Quantity</th><th>Narration</th></tr></thead>
              <tbody>
                ${dailyData.deliveryChallans.map(challan => {
                  const totalQty = (challan.items || []).reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0)
                  return `
                    <tr>
                      <td>${challan.challan_no || '-'}</td>
                      <td>${challan.customer_name || '-'}</td>
                      <td class="item-list">${(challan.items || []).map(item => `${item.item_name}: ${item.qty || item.quantity || 0} ${item.unit || ''}`).join('<br/>') || '-'}</td>
                      <td class="text-right">${totalQty.toFixed(2)}</td>
                      <td>${challan.notes || '-'}</td>
                    </tr>
                  `
                }).join('')}
                <tr style="background:#f0f0f0;font-weight:bold;"><td colspan="3">Total</td><td class="text-right">${dailyData.summary.totalDeliveryQty.toFixed(2)} units</td><td></td></tr>
              </tbody>
            </table>
          ` : '<p style="color:#888;">No delivery challans for this day.</p>'}
        </div>

        <!-- Payment Transactions Section -->
        <div class="section">
          <div class="section-title">💰 Payment Transactions</div>
          
          ${dailyData.customerReceipts && dailyData.customerReceipts.length > 0 ? `
            <h3 style="color:#2e7d32;">💰 Receipts (Money In - From Customers)</h3>
            <table>
              <thead><tr><th>Receipt No</th><th>Party Name</th><th>Payment Mode</th><th class="text-right">Amount</th></tr></thead>
              <tbody>
                ${dailyData.customerReceipts.map(payment => `
                  <tr class="receipt-row"><td>${payment.receipt_no || payment.reference_no || '-'}</td><td>${payment.party_name || '-'}</td><td>${payment.payment_mode || 'Cash'}</td><td class="text-right receipt-text">${formatCurrency(payment.amount || 0)}</td></tr>
                `).join('')}
                <tr style="background:#e8f5e9;font-weight:bold;"><td colspan="3">Total Receipts</td><td class="text-right receipt-text">${formatCurrency(dailyData.summary.totalReceipts)}</td></tr>
              </tbody>
            </table>
          ` : ''}
          
          ${dailyData.vendorPayments && dailyData.vendorPayments.length > 0 ? `
            <h3 style="color:#c62828; margin-top:20px;">💸 Payments (Money Out - To Vendors)</h3>
            <table>
              <thead><tr><th>Payment No</th><th>Party Name</th><th>Payment Mode</th><th class="text-right">Amount</th></tr></thead>
              <tbody>
                ${dailyData.vendorPayments.map(payment => `
                  <tr class="payment-row"><td>${payment.payment_no || payment.reference_no || '-'}</td><td>${payment.party_name || '-'}</td><td>${payment.payment_mode || 'Cash'}</td><td class="text-right payment-text">${formatCurrency(payment.amount || 0)}</td></tr>
                `).join('')}
                <tr style="background:#ffebee;font-weight:bold;"><td colspan="3">Total Payments</td><td class="text-right payment-text">${formatCurrency(dailyData.summary.totalPayments)}</td></tr>
              </tbody>
            </table>
          ` : ''}
          
          ${(!dailyData.customerReceipts || dailyData.customerReceipts.length === 0) && (!dailyData.vendorPayments || dailyData.vendorPayments.length === 0) ? '<p style="color:#888;">No payment transactions for this day.</p>' : ''}
        </div>

        <div class="footer">
          <div>For FOUR (R) PLASTIC</div>
          <div style="margin-top: 40px;">Authorised Signatory</div>
        </div>

        <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading daily report...</p>
        </div>
      </div>
    )
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
                  onClick={goToDashboard}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Back to Dashboard"
                >
                  <HomeIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Daily Activity Report
                  </h1>
                  <p className="text-white/60 text-sm">Complete daily summary of all activities</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDailyReport}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30 flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Date Selector */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-white/60" />
                <span className="text-white/80">Select Date:</span>
              </div>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
              <button
                onClick={fetchDailyReport}
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/30  rounded-lg text-pink-400 hover:bg-pink-500/30 flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Load Report
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BeakerIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Production Qty</p>
                  <p className="text-white font-bold text-lg">{dailyData.summary.totalProductionQty.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Production Value</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(dailyData.summary.totalProductionValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ShoppingCartIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Purchase Amount</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(dailyData.summary.totalPurchaseAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <TruckIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Delivery Qty</p>
                  <p className="text-white font-bold text-lg">{dailyData.summary.totalDeliveryQty.toFixed(2)} units</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ArrowDownIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Receipts (Money In)</p>
                  <p className="text-green-400 font-bold text-lg">{formatCurrency(dailyData.summary.totalReceipts)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ArrowUpIcon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Payments (Money Out)</p>
                  <p className="text-red-400 font-bold text-lg">{formatCurrency(dailyData.summary.totalPayments)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-green-400" />
              Finished Goods Production
            </h2>
            {dailyData.production.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60">Item Name</th>
                      <th className="px-4 py-2 text-right text-white/60">Quantity</th>
                      <th className="px-4 py-2 text-left text-white/60">Unit</th>
                      <th className="px-4 py-2 text-right text-white/60">Rate</th>
                      <th className="px-4 py-2 text-right text-white/60">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dailyData.production.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-white">{item.item_name || '-'}</td>
                        <td className="px-4 py-2 text-white text-right">{(item.quantity_produced || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-white/70">{item.unit || 'NOS'}</td>
                        <td className="px-4 py-2 text-white text-right">{formatCurrency(item.rate || 0)}</td>
                        <td className="px-4 py-2 text-green-400 text-right">{formatCurrency((item.quantity_produced || 0) * (item.rate || 0))}</td>
                      </tr>
                    ))}
                    <tr className="bg-white/5 font-bold">
                      <td className="px-4 py-2 text-white">Total</td>
                      <td className="px-4 py-2 text-white text-right">{dailyData.summary.totalProductionQty.toFixed(2)}</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-green-400 text-right">{formatCurrency(dailyData.summary.totalProductionValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/50 text-center py-8">No production recorded for this day.</p>
            )}
          </div>

          {/* Purchase Invoices Section with Items */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5 text-purple-400" />
              Purchase Invoices
            </h2>
            {dailyData.purchaseInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60">Invoice No</th>
                      <th className="px-4 py-2 text-left text-white/60">Party Name</th>
                      <th className="px-4 py-2 text-left text-white/60">Items (Qty & Unit)</th>
                      <th className="px-4 py-2 text-right text-white/60">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dailyData.purchaseInvoices.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-white font-mono">{inv.invoice_no || '-'}</td>
                        <td className="px-4 py-2 text-white">{inv.vendor_name || '-'}</td>
                        <td className="px-4 py-2">
                          {(inv.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="text-white/80 text-sm">
                              {item.item_name}: {item.quantity || 0} {item.unit || ''}
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-2 text-green-400 text-right font-semibold">
                          {formatCurrency(inv.grand_total || inv.total || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-white/5 font-bold">
                      <td className="px-4 py-2 text-white" colSpan="3">Total</td>
                      <td className="px-4 py-2 text-green-400 text-right">{formatCurrency(dailyData.summary.totalPurchaseAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/50 text-center py-8">No purchase invoices for this day.</p>
            )}
          </div>

          {/* Delivery Challans Section with Items and Units */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-yellow-400" />
              Delivery Challans
            </h2>
            {dailyData.deliveryChallans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60">Challan No</th>
                      <th className="px-4 py-2 text-left text-white/60">Customer Name</th>
                      <th className="px-4 py-2 text-left text-white/60">Items (Qty & Unit)</th>
                      <th className="px-4 py-2 text-right text-white/60">Total Quantity</th>
                      <th className="px-4 py-2 text-left text-white/60">Narration / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dailyData.deliveryChallans.map((challan, idx) => {
                      const totalQty = (challan.items || []).reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0)
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-white font-mono">{challan.challan_no || '-'}</td>
                          <td className="px-4 py-2 text-white">{challan.customer_name || '-'}</td>
                          <td className="px-4 py-2">
                            {(challan.items || []).map((item, itemIdx) => (
                              <div key={itemIdx} className="text-white/80 text-sm">
                                {item.item_name}: {item.qty || item.quantity || 0} {item.unit || ''}
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-2 text-white text-right font-semibold">{totalQty.toFixed(2)}</td>
                          <td className="px-4 py-2 text-green-400">{challan.notes || challan.narration || '-'}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-white/5 font-bold">
                      <td className="px-4 py-2 text-white" colSpan="3">Total</td>
                      <td className="px-4 py-2 text-white text-right">{dailyData.summary.totalDeliveryQty.toFixed(2)} units</td>
                      <td className="px-4 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/50 text-center py-8">No delivery challans for this day.</p>
            )}
          </div>

          {/* Payment Transactions Section - Separate Receipts and Payments */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-teal-400" />
              Payment Transactions
            </h2>
            
            {/* Receipts (Money Coming In) */}
            {dailyData.customerReceipts && dailyData.customerReceipts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <ArrowDownIcon className="h-4 w-4" />
                  Receipts (Money In - From Customers)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left text-white/60">Receipt No</th>
                        <th className="px-4 py-2 text-left text-white/60">Party Name</th>
                        <th className="px-4 py-2 text-left text-white/60">Payment Mode</th>
                        <th className="px-4 py-2 text-right text-white/60">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {dailyData.customerReceipts.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-green-500/5">
                          <td className="px-4 py-2 text-white font-mono">{payment.receipt_no || payment.reference_no || '-'}</td>
                          <td className="px-4 py-2 text-white">{payment.party_name || payment.customer_name || '-'}</td>
                          <td className="px-4 py-2 text-white">{payment.payment_mode || payment.payment_type || 'Cash'}</td>
                          <td className="px-4 py-2 text-green-400 text-right font-semibold">{formatCurrency(payment.amount || 0)}</td>
                        </tr>
                      ))}
                      <tr className="bg-green-500/10 font-bold">
                        <td className="px-4 py-2 text-white" colSpan="3">Total Receipts</td>
                        <td className="px-4 py-2 text-green-400 text-right">{formatCurrency(dailyData.summary.totalReceipts)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Payments (Money Going Out) */}
            {dailyData.vendorPayments && dailyData.vendorPayments.length > 0 && (
              <div>
                <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <ArrowUpIcon className="h-4 w-4" />
                  Payments (Money Out - To Vendors)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left text-white/60">Payment No</th>
                        <th className="px-4 py-2 text-left text-white/60">Party Name</th>
                        <th className="px-4 py-2 text-left text-white/60">Payment Mode</th>
                        <th className="px-4 py-2 text-right text-white/60">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {dailyData.vendorPayments.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-red-500/5">
                          <td className="px-4 py-2 text-white font-mono">{payment.payment_no || payment.reference_no || '-'}</td>
                          <td className="px-4 py-2 text-white">{payment.party_name || payment.vendor_name || '-'}</td>
                          <td className="px-4 py-2 text-white">{payment.payment_mode || payment.payment_type || 'Cash'}</td>
                          <td className="px-4 py-2 text-red-400 text-right font-semibold">{formatCurrency(payment.amount || 0)}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-500/10 font-bold">
                        <td className="px-4 py-2 text-white" colSpan="3">Total Payments</td>
                        <td className="px-4 py-2 text-red-400 text-right">{formatCurrency(dailyData.summary.totalPayments)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {(!dailyData.customerReceipts || dailyData.customerReceipts.length === 0) && 
             (!dailyData.vendorPayments || dailyData.vendorPayments.length === 0) && (
              <p className="text-white/50 text-center py-8">No payment transactions for this day.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}