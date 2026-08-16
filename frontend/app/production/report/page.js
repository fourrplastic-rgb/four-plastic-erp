'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  BeakerIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  CubeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function ProductionReportPage() {
  const router = useRouter()
  const printRef = useRef()
  
  const [loading, setLoading] = useState(true)
  const [productions, setProductions] = useState([])
  const [filteredProductions, setFilteredProductions] = useState([])
  const [items, setItems] = useState([])
  const [consumptionData, setConsumptionData] = useState({})
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedItem, setSelectedItem] = useState('all')
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  
  // Company Information - UPDATED with correct GST number
  const [companyInfo, setCompanyInfo] = useState({
    name: 'FOUR (R) PLASTIC',
    address: '90 FEET ROAD, WIRE GALI, KHADI NO. 3',
    landmark: 'NEAR NATIONAL CHEMIST',
    area: 'SAKINAKA',
    city: 'MUMBAI - 400072',
    gst: 'GST: 27ABTPV9432F1ZX',  // Updated GST number
    phone: 'Phone: +91 98765 43210',
    email: 'fourrplastic@gmail.com',
  })
  
  const [summary, setSummary] = useState({
    total_productions: 0,
    total_quantity: 0,
    total_rejected: 0,
    total_material_cost: 0,
    avg_efficiency: 0,
    completed_count: 0,
    pending_count: 0,
    verified_count: 0
  })

  useEffect(() => {
    checkAuth()
    fetchItems()
    fetchProductions()
  }, [])

  useEffect(() => {
    if (productions.length > 0) {
      filterAndSummarize()
    }
  }, [productions, dateRange.from, dateRange.to, selectedStatus, selectedItem, consumptionData])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/items')
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to fetch items')
    }
  }

  const fetchProductions = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/production')
      const productionData = response.data.productions || response.data || []
      setProductions(productionData)
      
      // Fetch consumption data for each production
      const consumptionMap = {}
      for (const prod of productionData) {
        try {
          const consResponse = await axios.get(`/api/production/${prod.id}/consumption`)
          consumptionMap[prod.id] = consResponse.data.consumption || consResponse.data || []
        } catch (error) {
          consumptionMap[prod.id] = []
        }
      }
      setConsumptionData(consumptionMap)
      
    } catch (error) {
      console.error('Error fetching productions:', error)
      toast.error('Failed to fetch production data')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSummarize = () => {
    let filtered = [...productions]

    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(p => {
        const prodDate = p.production_date.split('T')[0]
        return prodDate >= dateRange.from && prodDate <= dateRange.to
      })
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus)
    }

    // Apply item filter
    if (selectedItem !== 'all') {
      filtered = filtered.filter(p => p.finished_good_id === selectedItem)
    }

    setFilteredProductions(filtered)

    // Calculate summary
    const totalQuantity = filtered.reduce((sum, p) => sum + (parseFloat(p.quantity_produced) || 0), 0)
    const totalRejected = filtered.reduce((sum, p) => sum + (parseFloat(p.rejected_quantity) || 0), 0)
    const completedCount = filtered.filter(p => p.status === 'completed').length
    const pendingCount = filtered.filter(p => p.status === 'pending').length
    const verifiedCount = filtered.filter(p => p.status === 'verified').length
    
    // Calculate total material cost
    let totalMaterialCost = 0
    filtered.forEach(prod => {
      const consumption = consumptionData[prod.id] || []
      totalMaterialCost += consumption.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0)
    })
    
    // Calculate average efficiency
    const avgEfficiency = totalQuantity > 0 
      ? ((totalQuantity - totalRejected) / totalQuantity * 100).toFixed(2)
      : 0

    setSummary({
      total_productions: filtered.length,
      total_quantity: totalQuantity,
      total_rejected: totalRejected,
      total_material_cost: totalMaterialCost,
      avg_efficiency: avgEfficiency,
      completed_count: completedCount,
      pending_count: pendingCount,
      verified_count: verifiedCount
    })
  }

  const handlePrint = () => {
    if (filteredProductions.length === 0) {
      toast.error('No data to print')
      return
    }
    setShowPrintPreview(true)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleAfterPrint = () => {
    setShowPrintPreview(false)
  }

  useEffect(() => {
    if (showPrintPreview) {
      window.addEventListener('afterprint', handleAfterPrint)
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint)
      }
    }
  }, [showPrintPreview])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0'
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatCurrency = (num) => {
    if (!num && num !== 0) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const getItemName = (itemId) => {
    if (!items.length || !itemId) return 'N/A'
    const item = items.find(i => i.id === itemId)
    return item ? item.name : `Item ${itemId}`
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
      case 'verified':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Verified</span>
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>
    }
  }

  const clearFilters = () => {
    setDateRange({
      from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    })
    setSelectedStatus('all')
    setSelectedItem('all')
  }

  const exportToCSV = () => {
    if (filteredProductions.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const headers = ['Date', 'Production No', 'Item', 'Batch No', 'Machine No', 'Quantity', 'Rejected', 'Net', 'Status', 'Material Cost']
    const csvData = filteredProductions.map(p => [
      formatDate(p.production_date),
      p.production_no,
      getItemName(p.finished_good_id),
      p.batch_no || '',
      p.machine_no || '',
      formatNumber(p.quantity_produced),
      formatNumber(p.rejected_quantity || 0),
      formatNumber((parseFloat(p.quantity_produced) || 0) - (parseFloat(p.rejected_quantity) || 0)),
      p.status,
      formatCurrency(consumptionData[p.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0)
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production_report_${dateRange.from}_to_${dateRange.to}.csv`
    a.click()
  }

  // Quick filters
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setDateRange({ from: today, to: today })
  }

  const setThisWeek = () => {
    const today = new Date()
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6))
    setDateRange({
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    })
  }

  const setThisMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    setDateRange({
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    })
  }

  // Group productions by date for day-wise report
  const getProductionsByDate = () => {
    const grouped = {}
    filteredProductions.forEach(prod => {
      const date = prod.production_date.split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(prod)
    })
    return grouped
  }

  // Format YYYY-MM into Month Year label
  const formatMonthLabel = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  // Group productions by month for monthly cost report
  const getProductionsByMonth = () => {
    const grouped = {}
    filteredProductions.forEach(prod => {
      const datePart = prod.production_date.split('T')[0]
      const yearMonth = datePart.substring(0, 7) // YYYY-MM
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = []
      }
      grouped[yearMonth].push(prod)
    })
    
    // Sort keys descending (most recent first)
    const sorted = {}
    Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(key => {
      sorted[key] = grouped[key]
    })
    return sorted
  }

  // Group productions by product for product-wise report
  const getProductionsByProduct = () => {
    const grouped = {}
    filteredProductions.forEach(prod => {
      const productId = prod.finished_good_id
      if (!grouped[productId]) {
        grouped[productId] = {
          productName: getItemName(productId),
          productions: []
        }
      }
      grouped[productId].productions.push(prod)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading report data...</p>
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
                  onClick={() => router.push('/production')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <BuildingOfficeIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Production Report - FOUR (R) PLASTIC</h1>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="daywise">Day-wise Report</option>
                  <option value="productwise">Product-wise Report</option>
                  <option value="monthwise">Monthly Cost Report</option>
                </select>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                  disabled={filteredProductions.length === 0}
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                  disabled={filteredProductions.length === 0}
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-pink-400" />
              Filter Report
            </h2>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={setToday}
                className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30"
              >
                Today
              </button>
              <button
                onClick={setThisWeek}
                className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30"
              >
                This Week
              </button>
              <button
                onClick={setThisMonth}
                className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30"
              >
                This Month
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-white/70 text-sm mb-1">Finished Good</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Items</option>
                  {items
                    .filter(item => 
                      (item.item_type || item.type || '').toLowerCase().includes('finished') ||
                      (item.item_type || item.type || '').toLowerCase() === 'fg'
                    )
                    .map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>
            
            {/* Clear Filters */}
            {(dateRange.from !== new Date(new Date().setDate(1)).toISOString().split('T')[0] ||
              dateRange.to !== new Date().toISOString().split('T')[0] ||
              selectedStatus !== 'all' ||
              selectedItem !== 'all') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Summary Cards - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Productions</p>
              <p className="text-white text-2xl font-bold">{summary.total_productions}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Quantity</p>
              <p className="text-white text-2xl font-bold">{formatNumber(summary.total_quantity)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Rejected</p>
              <p className="text-white text-2xl font-bold">{formatNumber(summary.total_rejected)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Efficiency</p>
              <p className="text-white text-2xl font-bold">{summary.avg_efficiency}%</p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-400 text-sm">Completed</p>
                  <p className="text-white text-2xl font-bold">{summary.completed_count}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-400/50" />
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-yellow-400 text-sm">Pending</p>
                  <p className="text-white text-2xl font-bold">{summary.pending_count}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-400/50" />
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-400 text-sm">Verified</p>
                  <p className="text-white text-2xl font-bold">{summary.verified_count}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-blue-400/50" />
              </div>
            </div>
          </div>

          {/* Material Cost Summary */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-purple-400 text-sm">Total Material Cost</p>
                <p className="text-white text-3xl font-bold">{formatCurrency(summary.total_material_cost)}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-400/70 text-sm">Average Cost per Production</p>
                <p className="text-white text-lg">
                  {formatCurrency(summary.total_productions > 0 ? summary.total_material_cost / summary.total_productions : 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Report Table - Changes based on report type */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white font-semibold flex items-center gap-2">
                {reportType === 'summary' && <DocumentTextIcon className="h-5 w-5 text-pink-400" />}
                {reportType === 'detailed' && <TableCellsIcon className="h-5 w-5 text-pink-400" />}
                {reportType === 'daywise' && <CalendarDaysIcon className="h-5 w-5 text-pink-400" />}
                {reportType === 'productwise' && <CubeIcon className="h-5 w-5 text-pink-400" />}
                {reportType === 'summary' && 'Summary Report'}
                {reportType === 'detailed' && 'Detailed Production Report'}
                {reportType === 'daywise' && 'Day-wise Production Report'}
                {reportType === 'productwise' && 'Product-wise Production Report'}
                ({filteredProductions.length} entries)
              </h2>
              <span className="text-white/50 text-sm">
                Period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
            </div>
            
            <div className="overflow-x-auto p-4">
              {/* Summary Report */}
              {reportType === 'summary' && (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Date</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Prod No</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Item</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Quantity</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Rejected</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Net</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Material Cost</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredProductions.length > 0 ? (
                      filteredProductions.map((production) => {
                        const materialCost = consumptionData[production.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0
                        return (
                          <tr key={production.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-white">{formatDate(production.production_date)}</td>
                            <td className="px-4 py-3 text-white font-mono">{production.production_no}</td>
                            <td className="px-4 py-3 text-white">{getItemName(production.finished_good_id)}</td>
                            <td className="px-4 py-3 text-white text-right">{formatNumber(production.quantity_produced)}</td>
                            <td className="px-4 py-3 text-red-400 text-right">{formatNumber(production.rejected_quantity || 0)}</td>
                            <td className="px-4 py-3 text-green-400 text-right">
                              {formatNumber((parseFloat(production.quantity_produced) || 0) - (parseFloat(production.rejected_quantity) || 0))}
                            </td>
                            <td className="px-4 py-3 text-purple-400 text-right">{formatCurrency(materialCost)}</td>
                            <td className="px-4 py-3">{getStatusBadge(production.status)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-white/50">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                          No production entries found for the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredProductions.length > 0 && (
                    <tfoot className="bg-white/5">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-white/70 text-right font-semibold">Totals:</td>
                        <td className="px-4 py-3 text-white font-bold text-right">{formatNumber(summary.total_quantity)}</td>
                        <td className="px-4 py-3 text-red-400 font-bold text-right">{formatNumber(summary.total_rejected)}</td>
                        <td className="px-4 py-3 text-green-400 font-bold text-right">
                          {formatNumber(summary.total_quantity - summary.total_rejected)}
                        </td>
                        <td className="px-4 py-3 text-purple-400 font-bold text-right">{formatCurrency(summary.total_material_cost)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {/* Detailed Report */}
              {reportType === 'detailed' && (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Date/Time</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Prod No</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Item</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Batch</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Machine</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Operator</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Quantity</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Rejected</th>
                      <th className="px-4 py-3 text-right text-white/60 text-sm">Material Cost</th>
                      <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredProductions.map((production) => {
                      const materialCost = consumptionData[production.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0
                      return (
                        <tr key={production.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-white">{formatDateTime(production.production_date)}</td>
                          <td className="px-4 py-3 text-white font-mono">{production.production_no}</td>
                          <td className="px-4 py-3 text-white">{getItemName(production.finished_good_id)}</td>
                          <td className="px-4 py-3 text-white/70">{production.batch_no || '-'}</td>
                          <td className="px-4 py-3 text-white/70">{production.machine_no || '-'}</td>
                          <td className="px-4 py-3 text-white/70">{production.operator_name || '-'}</td>
                          <td className="px-4 py-3 text-white text-right">{formatNumber(production.quantity_produced)}</td>
                          <td className="px-4 py-3 text-red-400 text-right">{formatNumber(production.rejected_quantity || 0)}</td>
                          <td className="px-4 py-3 text-purple-400 text-right">{formatCurrency(materialCost)}</td>
                          <td className="px-4 py-3">{getStatusBadge(production.status)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {/* Day-wise Report */}
              {reportType === 'daywise' && (
                <div>
                  {Object.entries(getProductionsByDate()).map(([date, dayProductions]) => {
                    const dayTotal = dayProductions.reduce((sum, p) => sum + (parseFloat(p.quantity_produced) || 0), 0)
                    const dayRejected = dayProductions.reduce((sum, p) => sum + (parseFloat(p.rejected_quantity) || 0), 0)
                    
                    return (
                      <div key={date} className="mb-6">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CalendarDaysIcon className="h-4 w-4 text-pink-400" />
                          {formatDate(date)} - Total: {formatNumber(dayTotal)} units
                        </h3>
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Prod No</th>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Item</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Quantity</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Rejected</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Material Cost</th>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {dayProductions.map(prod => {
                              const materialCost = consumptionData[prod.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0
                              return (
                                <tr key={prod.id} className="hover:bg-white/5">
                                  <td className="px-3 py-2 text-white text-sm">{prod.production_no}</td>
                                  <td className="px-3 py-2 text-white text-sm">{getItemName(prod.finished_good_id)}</td>
                                  <td className="px-3 py-2 text-white text-sm text-right">{formatNumber(prod.quantity_produced)}</td>
                                  <td className="px-3 py-2 text-red-400 text-sm text-right">{formatNumber(prod.rejected_quantity || 0)}</td>
                                  <td className="px-3 py-2 text-purple-400 text-sm text-right">{formatCurrency(materialCost)}</td>
                                  <td className="px-3 py-2 text-sm">{getStatusBadge(prod.status)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-white/5">
                            <tr>
                              <td colSpan="2" className="px-3 py-2 text-white/70 text-right">Day Total:</td>
                              <td className="px-3 py-2 text-white font-bold text-right">{formatNumber(dayTotal)}</td>
                              <td className="px-3 py-2 text-red-400 font-bold text-right">{formatNumber(dayRejected)}</td>
                              <td className="px-3 py-2 text-purple-400 font-bold text-right">
                                {formatCurrency(dayProductions.reduce((sum, p) => {
                                  const cost = consumptionData[p.id]?.reduce((s, i) => s + (parseFloat(i.total_cost) || 0), 0) || 0
                                  return sum + cost
                                }, 0))}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Product-wise Report */}
              {reportType === 'productwise' && (
                <div>
                  {Object.entries(getProductionsByProduct()).map(([productId, { productName, productions: prodProductions }]) => {
                    const productTotal = prodProductions.reduce((sum, p) => sum + (parseFloat(p.quantity_produced) || 0), 0)
                    const productRejected = prodProductions.reduce((sum, p) => sum + (parseFloat(p.rejected_quantity) || 0), 0)
                    
                    return (
                      <div key={productId} className="mb-6">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CubeIcon className="h-4 w-4 text-pink-400" />
                          {productName} - Total: {formatNumber(productTotal)} units
                        </h3>
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Date</th>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Prod No</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Quantity</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Rejected</th>
                              <th className="px-3 py-2 text-right text-white/60 text-xs">Material Cost</th>
                              <th className="px-3 py-2 text-left text-white/60 text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {prodProductions.map(prod => {
                              const materialCost = consumptionData[prod.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0
                              return (
                                <tr key={prod.id} className="hover:bg-white/5">
                                  <td className="px-3 py-2 text-white text-sm">{formatDate(prod.production_date)}</td>
                                  <td className="px-3 py-2 text-white text-sm">{prod.production_no}</td>
                                  <td className="px-3 py-2 text-white text-sm text-right">{formatNumber(prod.quantity_produced)}</td>
                                  <td className="px-3 py-2 text-red-400 text-sm text-right">{formatNumber(prod.rejected_quantity || 0)}</td>
                                  <td className="px-3 py-2 text-purple-400 text-sm text-right">{formatCurrency(materialCost)}</td>
                                  <td className="px-3 py-2 text-sm">{getStatusBadge(prod.status)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-white/5">
                            <tr>
                              <td colSpan="2" className="px-3 py-2 text-white/70 text-right">Product Total:</td>
                              <td className="px-3 py-2 text-white font-bold text-right">{formatNumber(productTotal)}</td>
                              <td className="px-3 py-2 text-red-400 font-bold text-right">{formatNumber(productRejected)}</td>
                              <td className="px-3 py-2 text-purple-400 font-bold text-right">
                                {formatCurrency(prodProductions.reduce((sum, p) => {
                                  const cost = consumptionData[p.id]?.reduce((s, i) => s + (parseFloat(i.total_cost) || 0), 0) || 0
                                  return sum + cost
                                }, 0))}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Monthly Cost Report */}
              {reportType === 'monthwise' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs uppercase bg-white/5 text-white border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3 text-center">Batches Run</th>
                        <th className="px-4 py-3 text-right">Good Qty (KG)</th>
                        <th className="px-4 py-3 text-right">Rejected Qty (KG)</th>
                        <th className="px-4 py-3 text-right">Material Cost</th>
                        <th className="px-4 py-3 text-right">Overhead Cost</th>
                        <th className="px-4 py-3 text-right font-bold text-white">Total Cost</th>
                        <th className="px-4 py-3 text-right font-bold text-pink-400">Avg Cost / KG</th>
                        <th className="px-4 py-3 text-center">Yield Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(getProductionsByMonth()).map(([yearMonth, monthProductions]) => {
                        const totalProduced = monthProductions.reduce((sum, p) => sum + (parseFloat(p.quantity_produced) || 0), 0)
                        const totalRejected = monthProductions.reduce((sum, p) => sum + (parseFloat(p.rejected_quantity) || 0), 0)
                        const totalGood = totalProduced - totalRejected
                        
                        const materialCost = monthProductions.reduce((sum, p) => {
                          const cost = consumptionData[p.id]?.reduce((s, i) => s + (parseFloat(i.total_cost) || 0), 0) || 0
                          return sum + cost
                        }, 0)
                        
                        const overheadCost = monthProductions.reduce((sum, p) => sum + (parseFloat(p.total_overhead_cost) || 0), 0)
                        const totalCost = materialCost + overheadCost
                        const costPerKg = totalProduced > 0 ? (totalCost / totalProduced) : 0
                        const yieldRate = totalProduced > 0 ? (totalGood / totalProduced * 100).toFixed(1) : '100'
                        
                        return (
                          <tr key={yearMonth} className="hover:bg-white/5 border-b border-white/5">
                            <td className="px-4 py-3 font-semibold text-white">
                              {formatMonthLabel(yearMonth)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono">
                              {monthProductions.length}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-green-400">
                              {formatNumber(totalGood)} KG
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-red-400">
                              {formatNumber(totalRejected)} KG
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {formatCurrency(materialCost)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {formatCurrency(overheadCost)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-white">
                              {formatCurrency(totalCost)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-pink-400">
                              {formatCurrency(costPerKg)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                parseFloat(yieldRate) >= 95 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : (parseFloat(yieldRate) >= 85 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400')
                              }`}>
                                {yieldRate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Print Preview Modal - Professional Print Layout with Updated GST Number */}
      {showPrintPreview && filteredProductions.length > 0 && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto" style={{ display: showPrintPreview ? 'block' : 'none' }}>
          <div ref={printRef} className="max-w-7xl mx-auto p-8 print:p-4">
            {/* Letterhead with Company Details - UPDATED GST */}
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
              <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-wide">{companyInfo.name}</h1>
              <p className="text-gray-600 mt-1">{companyInfo.address}</p>
              <p className="text-gray-600">{companyInfo.landmark}</p>
              <p className="text-gray-600">{companyInfo.area}, {companyInfo.city}</p>
              <div className="flex justify-center gap-6 mt-3 text-sm text-gray-500">
                <span>{companyInfo.gst}</span>  {/* Updated GST displays here */}
                <span>{companyInfo.phone}</span>
                <span>{companyInfo.email}</span>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {reportType === 'summary' && 'PRODUCTION SUMMARY REPORT'}
                {reportType === 'detailed' && 'DETAILED PRODUCTION REPORT'}
                {reportType === 'daywise' && 'DAY-WISE PRODUCTION REPORT'}
                {reportType === 'productwise' && 'PRODUCT-WISE PRODUCTION REPORT'}
                {reportType === 'monthwise' && 'MONTH-WISE PRODUCTION COST REPORT'}
              </h2>
              <p className="text-gray-600 mt-1">Period: {formatDate(dateRange.from)} to {formatDate(dateRange.to)}</p>
              <p className="text-gray-500 text-sm">Generated on: {formatDateTime(new Date().toISOString())}</p>
            </div>

            {/* Executive Summary */}
            <div className="mb-8 grid grid-cols-5 gap-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-600 text-xs uppercase">Total Productions</p>
                <p className="text-xl font-bold text-gray-800">{summary.total_productions}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-600 text-xs uppercase">Total Quantity</p>
                <p className="text-xl font-bold text-gray-800">{formatNumber(summary.total_quantity)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-600 text-xs uppercase">Rejected</p>
                <p className="text-xl font-bold text-red-600">{formatNumber(summary.total_rejected)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-600 text-xs uppercase">Net Production</p>
                <p className="text-xl font-bold text-green-600">{formatNumber(summary.total_quantity - summary.total_rejected)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-600 text-xs uppercase">Efficiency</p>
                <p className="text-xl font-bold text-blue-600">{summary.avg_efficiency}%</p>
              </div>
            </div>

            {/* Status Summary */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-600 text-xs uppercase">Completed</p>
                <p className="text-2xl font-bold text-green-700">{summary.completed_count}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-yellow-600 text-xs uppercase">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{summary.pending_count}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-blue-600 text-xs uppercase">Verified</p>
                <p className="text-2xl font-bold text-blue-700">{summary.verified_count}</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-8 bg-purple-50 p-4 rounded border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-purple-600 text-sm uppercase">Total Material Cost</p>
                  <p className="text-3xl font-bold text-purple-700">{formatCurrency(summary.total_material_cost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-600 text-sm uppercase">Average Cost per Production</p>
                  <p className="text-2xl font-semibold text-purple-700">
                    {formatCurrency(summary.total_productions > 0 ? summary.total_material_cost / summary.total_productions : 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Tables based on report type */}
            <div className="mb-8">
              {reportType === 'summary' && (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Prod No</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Item</th>
                      <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Qty</th>
                      <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Rej</th>
                      <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Net</th>
                      <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Cost</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductions.map((production) => {
                      const materialCost = consumptionData[production.id]?.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0) || 0
                      return (
                        <tr key={production.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-sm">{formatDate(production.production_date)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm font-mono">{production.production_no}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{getItemName(production.finished_good_id)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right">{formatNumber(production.quantity_produced)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right text-red-600">{formatNumber(production.rejected_quantity || 0)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right text-green-600">
                            {formatNumber((parseFloat(production.quantity_produced) || 0) - (parseFloat(production.rejected_quantity) || 0))}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right text-purple-600">{formatCurrency(materialCost)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm capitalize">{production.status}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="border border-gray-300 px-4 py-2 text-right font-semibold">Totals:</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold">{formatNumber(summary.total_quantity)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold text-red-600">{formatNumber(summary.total_rejected)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">
                        {formatNumber(summary.total_quantity - summary.total_rejected)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold text-purple-600">{formatCurrency(summary.total_material_cost)}</td>
                      <td className="border border-gray-300 px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* Add similar print layouts for other report types */}
              {reportType === 'daywise' && (
                <div>
                  {Object.entries(getProductionsByDate()).map(([date, dayProductions]) => (
                    <div key={date} className="mb-6">
                      <h3 className="text-lg font-bold text-gray-700 mb-2">{formatDate(date)}</h3>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Prod No</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Item</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Qty</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Rej</th>
                            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Cost</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayProductions.map(prod => (
                            <tr key={prod.id}>
                              <td className="border border-gray-300 px-3 py-1 text-sm">{prod.production_no}</td>
                              <td className="border border-gray-300 px-3 py-1 text-sm">{getItemName(prod.finished_good_id)}</td>
                              <td className="border border-gray-300 px-3 py-1 text-sm text-right">{formatNumber(prod.quantity_produced)}</td>
                              <td className="border border-gray-300 px-3 py-1 text-sm text-right text-red-600">{formatNumber(prod.rejected_quantity || 0)}</td>
                              <td className="border border-gray-300 px-3 py-1 text-sm text-right text-purple-600">
                                {formatCurrency(consumptionData[prod.id]?.reduce((sum, i) => sum + (parseFloat(i.total_cost) || 0), 0) || 0)}
                              </td>
                              <td className="border border-gray-300 px-3 py-1 text-sm capitalize">{prod.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Monthly Cost Report - Print Layout */}
              {reportType === 'monthwise' && (
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Month-wise Production Cost Details</h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Month</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold">Batches Run</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Good Qty (KG)</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Rejected (KG)</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Material Cost</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Overhead Cost</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Total Cost</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Avg Cost/KG</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold">Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(getProductionsByMonth()).map(([yearMonth, monthProductions]) => {
                        const totalProduced = monthProductions.reduce((sum, p) => sum + (parseFloat(p.quantity_produced) || 0), 0)
                        const totalRejected = monthProductions.reduce((sum, p) => sum + (parseFloat(p.rejected_quantity) || 0), 0)
                        const totalGood = totalProduced - totalRejected
                        
                        const materialCost = monthProductions.reduce((sum, p) => {
                          const cost = consumptionData[p.id]?.reduce((s, i) => s + (parseFloat(i.total_cost) || 0), 0) || 0
                          return sum + cost
                        }, 0)
                        
                        const overheadCost = monthProductions.reduce((sum, p) => sum + (parseFloat(p.total_overhead_cost) || 0), 0)
                        const totalCost = materialCost + overheadCost
                        const costPerKg = totalProduced > 0 ? (totalCost / totalProduced) : 0
                        const yieldRate = totalProduced > 0 ? (totalGood / totalProduced * 100).toFixed(1) : '100'
                        
                        return (
                          <tr key={yearMonth}>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm font-semibold">{formatMonthLabel(yearMonth)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-center">{monthProductions.length}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right text-green-600 font-semibold">{formatNumber(totalGood)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right text-red-600">{formatNumber(totalRejected)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right">{formatCurrency(materialCost)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right">{formatCurrency(overheadCost)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right font-bold">{formatCurrency(totalCost)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-right font-bold text-purple-600">{formatCurrency(costPerKg)}</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-sm text-center">{yieldRate}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t-2 border-gray-300">
              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Prepared By</p>
                  <p className="mt-8 font-semibold">____________________</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Checked By</p>
                  <p className="mt-8 font-semibold">____________________</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Authorized By</p>
                  <p className="mt-8 font-semibold">____________________</p>
                  <p className="text-xs text-gray-400 mt-1">For FOUR (R) PLASTIC</p>
                </div>
              </div>
            </div>

            {/* Footer - UPDATED with correct GST number */}
            <div className="text-center mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>FOUR (R) PLASTIC - 90 FEET ROAD, WIRE GALI, KHADI NO. 3, NEAR NATIONAL CHEMIST, SAKINAKA, MUMBAI - 400072</p>
              <p className="mt-1">GST: 27ABTPV9432F1ZX | Phone: +91 98765 43210 | Email: fourrplastic@gmail.com</p>
              <p className="mt-1">This is a computer generated report - No signature required</p>
              <p>Page 1 of 1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}