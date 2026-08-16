'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  FunnelIcon,
  ArrowPathIcon,
  HomeIcon,
  CalendarIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// API Base URL constant
const API_BASE_URL = '/api'

export default function DeliveryChallansPage() {
  const router = useRouter()
  const [challans, setChallans] = useState([])
  const [filteredChallans, setFilteredChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Date filter states
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showRates, setShowRates] = useState(false)
  
  const [stats, setStats] = useState({
    total: 0,
    totalQty: 0,
    inTransit: 0,
    delivered: 0
  })

  // State for filtered total quantity
  const [filteredTotalQty, setFilteredTotalQty] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchChallans()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [challans, searchTerm, statusFilter, fromDate, toDate])

  // Calculate filtered total quantity whenever filteredChallans changes
  useEffect(() => {
    calculateFilteredTotalQty()
  }, [filteredChallans])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  // Helper function to calculate total quantity from items
  const calculateTotalQuantity = (challan) => {
    if (challan.items && Array.isArray(challan.items) && challan.items.length > 0) {
      return challan.items.reduce((sum, item) => {
        return sum + (Number(item.qty) || Number(item.quantity) || 0);
      }, 0);
    }
    return Number(challan.total_quantity) || 0;
  }

  // NEW: Calculate total quantity from filtered challans only
  const calculateFilteredTotalQty = () => {
    let total = 0;
    for (const challan of filteredChallans) {
      if (challan.items && Array.isArray(challan.items) && challan.items.length > 0) {
        const challanTotal = challan.items.reduce((sum, item) => {
          const qty = Number(item.qty) || Number(item.quantity) || 0;
          return sum + qty;
        }, 0);
        total += challanTotal;
      } else {
        total += Number(challan.total_quantity) || 0;
      }
    }
    setFilteredTotalQty(total);
  }

  const fetchChallans = async () => {
    try {
      setLoading(true)
      console.log('Fetching challans...')
      
      // Fetch all challans
      const response = await axios.get(`${API_BASE_URL}/delivery-challans`)
      console.log('Challans received:', response.data)
      
      let challansData = response.data
      
      // Fetch each challan with its items
      console.log('Fetching complete details for each challan...')
      for (let i = 0; i < challansData.length; i++) {
        try {
          const challanDetail = await axios.get(`${API_BASE_URL}/delivery-challans/${challansData[i].id}`)
          challansData[i].items = challanDetail.data.items || []
          console.log(`Challan ${challansData[i].id}: ${challansData[i].items.length} items found`)
          
          if (challansData[i].items.length > 0) {
            challansData[i].items.forEach((item, idx) => {
              console.log(`  Item ${idx + 1}: ${item.item_name || item.name}, Qty: ${item.qty || item.quantity}`)
            })
          }
        } catch (itemError) {
          console.error(`Could not fetch details for challan ${challansData[i].id}:`, itemError.message)
          challansData[i].items = []
        }
      }
      
      // Check if challans already have customer_name
      const needsCustomers = challansData.length > 0 && !challansData[0].customer_name
      console.log('Needs customer mapping:', needsCustomers)
      
      if (needsCustomers) {
        try {
          console.log('Fetching customers for mapping...')
          const customersResponse = await axios.get(`${API_BASE_URL}/customers`)
          console.log('Customers received:', customersResponse.data)
          
          const customersMap = {}
          customersResponse.data.forEach(customer => {
            customersMap[customer.id] = customer.name
          })
          console.log('Customers map created:', customersMap)
          
          challansData = challansData.map(challan => {
            const customerName = customersMap[challan.customer_id]
            console.log(`Mapping challan ${challan.id}: customer_id=${challan.customer_id}, name=${customerName || 'Unknown'}`)
            return {
              ...challan,
              customer_name: customerName || 'Unknown Customer'
            }
          })
        } catch (customerError) {
          console.error('Error fetching customers:', customerError)
          toast.error('Failed to fetch customer details')
          challansData = challansData.map(challan => ({
            ...challan,
            customer_name: 'Unknown Customer'
          }))
        }
      }
      
      console.log('Final challans data with items:', challansData)
      setChallans(challansData)
      

      
      // Calculate total quantities from all challans (in KG)
      const total = challansData.length
      let totalQty = 0
      
      for (const challan of challansData) {
        if (challan.items && Array.isArray(challan.items) && challan.items.length > 0) {
          const challanTotal = challan.items.reduce((sum, item) => {
            const qty = Number(item.qty) || Number(item.quantity) || 0
            return sum + qty
          }, 0)
          totalQty += challanTotal
          console.log(`Challan ${challan.id} total quantity: ${challanTotal} KG`)
        }
      }
      
      const inTransit = challansData.filter(c => c.status === 'IN TRANSIT').length
      const delivered = challansData.filter(c => c.status === 'COMPLETED').length
      
      setStats({ total, totalQty, inTransit, delivered })
      
      console.log('Stats calculated:', { total, totalQty, inTransit, delivered })
    } catch (error) {
      console.error('Error fetching challans:', error)
      toast.error('Failed to fetch delivery challans')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...challans]
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(challan => 
        challan.challan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (challan.transporter_name && challan.transporter_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.vehicle_no && challan.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(challan => (challan.status || 'PENDING').toUpperCase() === statusFilter.toUpperCase())
    }
    
    // Apply Date Range filter
    if (fromDate) {
      filtered = filtered.filter(challan => {
        const date = new Date(challan.challan_date || challan.date || challan.created_at);
        return date >= new Date(fromDate);
      });
    }
    if (toDate) {
      filtered = filtered.filter(challan => {
        const date = new Date(challan.challan_date || challan.date || challan.created_at);
        // Set end of day for the toDate
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        return date <= toDateEnd;
      });
    }
    
    setFilteredChallans(filtered)
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark this delivery challan as COMPLETED?')) return
    
    try {
      await axios.put(`${API_BASE_URL}/delivery-challans/${id}/status`, { status: 'COMPLETED' })
      toast.success('Challan marked as completed successfully')
      fetchChallans()
    } catch (error) {
      console.error('Error completing challan:', error)
      toast.error('Failed to complete delivery challan')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this delivery challan?')) return
    
    try {
      await axios.delete(`${API_BASE_URL}/delivery-challans/${id}`)
      toast.success('Delivery challan deleted successfully')
      fetchChallans()
    } catch (error) {
      console.error('Error deleting challan:', error)
      toast.error('Failed to delete delivery challan')
    }
  }

  const handlePrint = (challan) => {
    sessionStorage.setItem('printChallan', JSON.stringify(challan))
    window.open(`/delivery-challans/print/${challan.id}`, '_blank')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setFromDate('')
    setToDate('')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/')
    } catch {
      return '-'
    }
  }

  const getStatusBadge = (status) => {
    const safeStatus = (status || 'PENDING').toUpperCase();
    const colors = {
      'PENDING': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'IN TRANSIT': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      'COMPLETED': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      'CANCELLED': 'bg-red-500/20 text-red-400 border border-red-500/30'
    }
    return colors[safeStatus] || 'bg-white/5 text-slate-400 border border-white/10'
  }

  const handleEdit = (challanId) => {
    console.log('Attempting to edit challan with ID:', challanId)
    if (!challanId) {
      console.error('No challan ID provided')
      toast.error('Cannot edit: Invalid challan ID')
      return
    }
    router.push(`/delivery-challans/edit/${challanId}`)
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-gray-500 mt-4">Loading delivery challans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-100">
      
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm sticky top-0 z-10 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 hover:bg-white/10 transition-colors group"
                  title="Back to Dashboard"
                >
                  <HomeIcon className="h-5 w-5 group-hover:text-pink-400 transition-colors" />
                </button>
                <TruckIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  DELIVERY CHALLANS
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchChallans}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 mr-2 print:hidden">
                  <input
                    type="checkbox"
                    id="showRates"
                    checked={showRates}
                    onChange={(e) => setShowRates(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/10 text-pink-500 focus:ring-pink-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="showRates" className="text-sm text-slate-400 whitespace-nowrap cursor-pointer">
                    Show Rate & Amount
                  </label>
                </div>
                <button
                  onClick={() => {
                    const query = new URLSearchParams({
                      from: fromDate,
                      to: toDate,
                      search: searchTerm,
                      status: statusFilter,
                      showRates: showRates
                    }).toString();
                    window.open(`/delivery-challans/print-report?${query}`, '_blank');
                  }}
                  className="px-4 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-lg hover:bg-white/10 flex items-center gap-2 transition-all print:hidden"
                  title="Print Report"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print Report
                </button>
                <button
                  onClick={() => router.push('/delivery-challans/new')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 print:hidden"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Challan
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0">
          


          {/* Search and Filters */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by challan no, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* From Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  
                />
              </div>

              {/* To Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none"
                  
                >
                  <option value="all" className="bg-[#0b0a12] text-white">All Status</option>
                  <option value="PENDING" className="bg-[#0b0a12] text-white">Pending</option>
                  <option value="IN TRANSIT" className="bg-[#0b0a12] text-white">In Transit</option>
                  <option value="COMPLETED" className="bg-[#0b0a12] text-white">Completed</option>
                  <option value="CANCELLED" className="bg-[#0b0a12] text-white">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'all' || fromDate || toDate) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Clear all filters</span>
                  <span>×</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards - Now shows FILTERED total quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
            <div className="holographic-card rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Challans</p>
              <p className="text-white text-2xl font-bold">{filteredChallans.length}</p>
            </div>
            <div className="holographic-card rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Qty (KG)</p>
              <p className="text-white text-2xl font-bold">{filteredTotalQty.toFixed(2)}</p>
            </div>
            <div className="holographic-card rounded-lg p-4">
              <p className="text-slate-400 text-sm">In Transit</p>
              <p className="text-white text-2xl font-bold">
                {filteredChallans.filter(c => c.status === 'IN TRANSIT').length}
              </p>
            </div>
            <div className="holographic-card rounded-lg p-4">
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-white text-2xl font-bold">
                {filteredChallans.filter(c => c.status === 'COMPLETED').length}
              </p>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-slate-400 text-sm print:hidden">
            Showing {filteredChallans.length} of {challans.length} challans
            {fromDate && ` • From: ${formatDate(fromDate)}`}
            {toDate && ` • To: ${formatDate(toDate)}`}
            {filteredTotalQty > 0 && ` • Total Qty: ${filteredTotalQty.toFixed(2)} KG`}
          </div>

          {/* Table */}
          <div className="holographic-card rounded-xl overflow-hidden print:bg-transparent print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Challan No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Transport Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Freight Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredChallans.length > 0 ? (
                    filteredChallans.map((challan, index) => {
                      const totalQty = calculateTotalQuantity(challan);
                      return (
                        <tr key={`challan-row-${challan.id}-${index}`} className="hover:bg-white/5 transition-colors print:border-b print:border-gray-300">
                          <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap print:text-black">
                            {formatDate(challan.date || challan.challan_date || challan.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200 font-mono whitespace-nowrap print:text-black">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="bg-white/5 border border-white/5 px-2 py-1 rounded print:bg-transparent print:font-bold">
                                {challan.challan_no}
                              </span>
                              {challan.challan_type === 'return' ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  RETURN
                                </span>
                              ) : (
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                                  OUTWARD
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200 print:text-black break-words max-w-[200px]">
                            {challan.customer_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400 print:text-black break-words max-w-[150px]">
                            {challan.transporter_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white whitespace-nowrap print:text-black font-semibold">
                            ₹{Number(challan.freight_charges || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200 print:text-black">
                            <div className="flex flex-col gap-1 items-start">
                              {challan.items?.map((item, itemIdx) => {
                                const itemQty = Number(item.qty) || Number(item.quantity) || 0;
                                return (
                                  <div key={itemIdx} className="text-[11px] text-slate-400 whitespace-nowrap">
                                    {item.item_name || item.name}: <span className="font-semibold text-white print:text-black">{itemQty.toFixed(2)} KG</span>
                                  </div>
                                )
                              })}
                              <div className="mt-0.5">
                                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-xs print:bg-transparent print:text-black print:font-bold">
                                  {totalQty.toFixed(2)} KG
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(challan.status)} print:bg-transparent print:border-none print:text-black`}>
                              {challan.status || 'PENDING'}
                            </span>
                            {challan.invoice_no && (
                              <div className="mt-1">
                                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full text-xs font-medium">
                                  Billed ({challan.invoice_no})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center whitespace-nowrap print:hidden">
                            <div className="flex items-center justify-center space-x-2">
                              {(challan.status === 'pending' || challan.status === 'PENDING' || !challan.status) && (
                                <button
                                  onClick={() => handleComplete(challan.id)}
                                  className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded transition-colors"
                                  title="Mark as Completed"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              {!challan.invoice_no && (
                                <button
                                  onClick={() => router.push(`/sales-invoices/new?challan_no=${encodeURIComponent(challan.challan_no)}`)}
                                  className="p-1 text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded transition-colors"
                                  title="Generate Sales Invoice"
                                >
                                  <DocumentTextIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/delivery-challans/${challan.id}`)}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded transition-colors"
                                title="View"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(challan.id)}
                                className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePrint(challan)}
                                className="p-1 text-green-400 hover:text-green-300 hover:bg-white/10 rounded transition-colors"
                                title="Print"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(challan.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <TruckIcon className="h-12 w-12 text-white/10 mx-auto mb-3" />
                        <p className="text-slate-400 text-lg">No delivery challans found</p>
                        <p className="text-slate-500 text-sm mt-1">
                          {challans.length === 0 
                            ? 'Click "New Challan" to create your first delivery challan'
                            : 'No challans match your filters'}
                        </p>
                        {(searchTerm || statusFilter !== 'all' || fromDate || toDate) && (
                          <button
                            onClick={clearFilters}
                            className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          {filteredChallans.length > 0 && (
            <div className="print:hidden">
            <div className="mt-4 flex justify-between items-center text-slate-400 text-sm">
              <span>Showing {filteredChallans.length} of {challans.length} challans</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                Back to Dashboard
              </button>
            </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}