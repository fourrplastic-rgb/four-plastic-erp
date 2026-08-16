'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BeakerIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckIcon,
  CameraIcon
} from '@heroicons/react/24/outline'

export default function ProductionPage() {
  const [productions, setProductions] = useState([])
  const [filteredProductions, setFilteredProductions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [expandedProduction, setExpandedProduction] = useState(null)
  const [consumptionDetails, setConsumptionDetails] = useState({})
  const [items, setItems] = useState([]) // For item names and units lookup
  const [summary, setSummary] = useState({
    total_produced: 0,
    total_rejected: 0,
    total_entries: 0,
    total_material_used: 0
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchItems()
    fetchProductions()
  }, [])

  useEffect(() => {
    filterProductions()
  }, [searchTerm, selectedDate, selectedStatus, productions])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchItems = async () => {
    try {
      console.log('Fetching items from API...')
      const response = await axios.get('/api/items')
      
      console.log('Items API Response:', response.data)
      const allItems = response.data
      
      if (!allItems || allItems.length === 0) {
        console.warn('No items returned from API')
        toast.error('No items found in database')
        setItems([])
        return
      }
      
      // Create lookup maps for quick access
      const itemMap = {}
      allItems.forEach(item => {
        itemMap[item.id] = item
      })
      
      console.log('Item map created:', itemMap)
      setItems(itemMap)
      
    } catch (error) {
      console.error('Error fetching items:', error)
      if (error.response) {
        toast.error(`Failed to fetch items: ${error.response.status}`)
      } else if (error.request) {
        toast.error('Cannot connect to server. Make sure backend is running.')
      } else {
        toast.error('Error: ' + error.message)
      }
      setItems({})
    }
  }

  const fetchProductions = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/production')
      console.log('Production data:', response.data)
      
      const productionData = response.data.productions || response.data || []
      setProductions(productionData)
      setFilteredProductions(productionData)
      
      // Calculate summary
      const totalProduced = productionData.reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
      const totalRejected = productionData.reduce((sum, p) => sum + (p.rejected_quantity || 0), 0)
      
      setSummary({
        total_produced: totalProduced,
        total_rejected: totalRejected,
        total_entries: productionData.length,
        total_material_used: 0
      })
      
    } catch (error) {
      console.error('Error fetching productions:', error)
      toast.error('Failed to fetch production data')
    } finally {
      setLoading(false)
    }
  }

  const filterProductions = () => {
    let filtered = [...productions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.production_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.finished_good_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.batch_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.machine_no || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(p => p.production_date === selectedDate)
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus)
    }

    setFilteredProductions(filtered)
  }

  const fetchConsumptionDetails = async (productionId) => {
    if (consumptionDetails[productionId]) {
      setExpandedProduction(expandedProduction === productionId ? null : productionId)
      return
    }

    try {
      const response = await axios.get(`/api/production/${productionId}/consumption`)
      console.log('Consumption data:', response.data)
      
      setConsumptionDetails(prev => ({
        ...prev,
        [productionId]: response.data.consumption || response.data || []
      }))
      setExpandedProduction(expandedProduction === productionId ? null : productionId)
    } catch (error) {
      console.error('Error fetching consumption:', error)
      toast.error('Failed to fetch material consumption')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this production entry?')) return
    
    try {
      await axios.delete(`/api/production/${id}`)
      toast.success('Production entry deleted')
      fetchProductions()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark this production as completed? This will update stock.')) return
    
    try {
      await axios.put(`/api/production/${id}/complete`)
      toast.success('Production completed and stock updated')
      fetchProductions()
    } catch (error) {
      toast.error('Failed to complete production')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDate('')
    setSelectedStatus('all')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  // NEW: Get unit for a finished good from items map
  const getFinishedGoodUnit = (finishedGoodId) => {
    if (!items || !items[finishedGoodId]) return 'units'
    return items[finishedGoodId].unit || 'units'
  }

  // NEW: Get unit for a raw material from items map
  const getRawMaterialUnit = (rawMaterialId) => {
    if (!items || !items[rawMaterialId]) return 'units'
    return items[rawMaterialId].unit || 'units'
  }

  // UPDATED: Get item name from items map
  const getItemName = (itemId) => {
    if (!items || !items[itemId]) return `Item ${itemId}`
    return items[itemId].name || `Item ${itemId}`
  }

  // UPDATED: Get item code from items map
  const getItemCode = (itemId) => {
    if (!items || !items[itemId]) return '-'
    return items[itemId].code || '-'
  }

  // NEW: Format quantity with unit
  const formatQuantityWithUnit = (quantity, itemId, type = 'finished_good') => {
    const unit = type === 'finished_good' ? getFinishedGoodUnit(itemId) : getRawMaterialUnit(itemId)
    return `${formatNumber(quantity)} ${unit}`
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading production entries...</p>
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
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <BeakerIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Production Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/production/report"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  Report
                </Link>
                <button
                  onClick={fetchProductions}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  href="/production/scan"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-lg hover:from-teal-600 hover:to-indigo-700"
                >
                  <CameraIcon className="h-5 w-5" />
                  Scan Handwritten Log
                </Link>
                <Link
                  href="/production/new"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Production
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Produced</p>
              <p className="text-white text-2xl font-bold">{formatNumber(summary.total_produced)}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Rejected</p>
              <p className="text-white text-2xl font-bold">{formatNumber(summary.total_rejected)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Entries</p>
              <p className="text-white text-2xl font-bold">{formatNumber(summary.total_entries)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Efficiency</p>
              <p className="text-white text-2xl font-bold">
                {summary.total_produced > 0 
                  ? Math.round((summary.total_produced - summary.total_rejected) / summary.total_produced * 100) 
                  : 0}%
              </p>
            </div>
          </div>

          {/* Recycling & Production Loop Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="text-xl animate-spin" style={{ animationDuration: '6s' }}>♻️</span>
              Closed-Loop Scrap Recycling & Yield Analytics
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Yield Meter Column */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white/5 rounded-xl p-4 border border-white/5 relative">
                {/* Circular Yield Progress Gauge */}
                <div className="relative flex items-center justify-center" style={{ width: '120px', height: '120px' }}>
                  {/* Outer circle background track */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="text-slate-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="text-pink-500"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={
                        2 * Math.PI * 50 * (1 - (summary.total_produced > 0 
                          ? (summary.total_produced - summary.total_rejected) / summary.total_produced 
                          : 1))
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    />
                  </svg>
                  {/* Inside Center text */}
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-white">
                      {summary.total_produced > 0 
                        ? Math.round((summary.total_produced - summary.total_rejected) / summary.total_produced * 100) 
                        : 100}%
                    </span>
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Net Yield</p>
                  </div>
                </div>
                
                <div className="text-center mt-3">
                  <div className="text-xs text-white/60">Good Output Quality Index</div>
                  <div className="text-[10px] text-pink-400 font-bold mt-1 uppercase tracking-widest">Efficiency Target: 95%+</div>
                </div>
              </div>

              {/* Recovery Loop Diagram Column */}
              <div className="lg:col-span-8 flex flex-col justify-between h-full bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase font-bold mb-1">Plastic Input</div>
                    <div className="text-lg font-black text-blue-400 font-mono">
                      {formatNumber(summary.total_produced)} <span className="text-xs">KG</span>
                    </div>
                    <div className="text-[9px] text-white/40 mt-1">Virgin / Recycled feed</div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase font-bold mb-1">Molded Products</div>
                    <div className="text-lg font-black text-green-400 font-mono">
                      {formatNumber(summary.total_produced - summary.total_rejected)} <span className="text-xs">KG</span>
                    </div>
                    <div className="text-[9px] text-white/40 mt-1">Good Finished Goods</div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500/10 rounded-bl-full flex items-center justify-center text-[10px] text-orange-400 font-black animate-pulse">♻️</div>
                    <div className="text-[10px] text-white/50 uppercase font-bold mb-1">Scrap Recovered</div>
                    <div className="text-lg font-black text-orange-400 font-mono">
                      {formatNumber(summary.total_rejected)} <span className="text-xs">KG</span>
                    </div>
                    <div className="text-[9px] text-orange-300 font-bold mt-1">Auto-Returned to Granules</div>
                  </div>
                </div>

                {/* Micro flow diagram */}
                <div className="mt-4 border-t border-white/10 pt-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-[10px] text-white/60 flex items-center gap-1.5 leading-relaxed">
                    <span className="text-lg">📢</span>
                    <span><strong>Four (R) Plastic Loop:</strong> Ground rejections automatically replenish PP Scrap/PP Color Scrap stocks immediately upon completing production batches.</span>
                  </div>
                  <button
                    onClick={() => router.push('/stock-report')}
                    className="shrink-0 text-[10px] font-black text-pink-400 hover:text-pink-300 border border-pink-500/20 hover:border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
                  >
                    🔍 View Scrap Inventory
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by production no, item, batch, machine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedDate || selectedStatus !== 'all') && (
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
          <div className="mb-3 text-white/60 text-sm">
            Showing {filteredProductions.length} of {productions.length} production entries
          </div>

          {/* Production List */}
          <div className="space-y-4">
            {filteredProductions.map((production) => (
              <div key={production.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                {/* Production Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => fetchConsumptionDetails(production.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">{production.production_no}</h3>
                        {getStatusBadge(production.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-white/50 text-xs">Date</p>
                          <p className="text-white text-sm">{formatDate(production.production_date)}</p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs">Item Produced</p>
                          <p className="text-white text-sm font-medium">
                            {getItemName(production.finished_good_id)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs">Quantity</p>
                          <p className="text-white text-sm">
                            {/* FIXED: Show dynamic unit from item master */}
                            {formatQuantityWithUnit(production.quantity_produced, production.finished_good_id, 'finished_good')}
                            {production.rejected_quantity > 0 && 
                              <span className="text-red-400 ml-2">
                                ({formatQuantityWithUnit(production.rejected_quantity, production.finished_good_id, 'finished_good')} rejected)
                              </span>
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs">Batch/Machine</p>
                          <p className="text-white text-sm">{production.batch_no || 'N/A'} | {production.machine_no || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Financials Row */}
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/10 rounded-lg p-3">
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Material Cost</p>
                          <p className="text-pink-400 font-mono text-sm">₹{formatNumber(production.total_material_cost || 0)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Overheads {production.cost_center_name ? `(${production.cost_center_name})` : ''}</p>
                          <p className="text-orange-400 font-mono text-sm">₹{formatNumber(production.total_overhead_cost || 0)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Total Actual Cost</p>
                          <p className="text-indigo-400 font-bold font-mono text-sm">₹{formatNumber(production.actual_cost || 0)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Per Unit Cost</p>
                          <p className="text-emerald-400 font-bold font-mono text-sm">₹{formatNumber(production.per_unit_cost || 0)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/production/${production.id}`}
                        className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      {production.status !== 'completed' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleComplete(production.id)
                            }}
                            className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                            title="Complete Production"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <Link
                            href={`/production/${production.id}/edit`}
                            className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(production.id)
                            }}
                            className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {expandedProduction === production.id ? (
                        <ChevronUpIcon className="h-5 w-5 text-white/50" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-white/50" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Material Consumption Details */}
                {expandedProduction === production.id && consumptionDetails[production.id] && (
                  <div className="border-t border-white/10 p-4 bg-white/5">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <CubeIcon className="h-5 w-5 text-pink-400" />
                      Raw Materials Consumed
                    </h4>
                    
                    {consumptionDetails[production.id].length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60">Material</th>
                              <th className="px-3 py-2 text-left text-white/60">Code</th>
                              <th className="px-3 py-2 text-right text-white/60">Quantity Used</th>
                              <th className="px-3 py-2 text-left text-white/60">UOM</th>
                              <th className="px-3 py-2 text-left text-white/60">Batch No</th>
                              <th className="px-3 py-2 text-right text-white/60">Rate</th>
                              <th className="px-3 py-2 text-right text-white/60">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {consumptionDetails[production.id].map((item, idx) => {
                              const unit = getRawMaterialUnit(item.raw_material_id)
                              return (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="px-3 py-2 text-white">{item.raw_material_name || getItemName(item.raw_material_id)}</td>
                                  <td className="px-3 py-2 text-white/70">{item.material_code || getItemCode(item.raw_material_id)}</td>
                                  <td className="px-3 py-2 text-white text-right">{formatNumber(item.quantity_used)}</td>
                                  <td className="px-3 py-2 text-white/70">{unit}</td>
                                  <td className="px-3 py-2 text-white/70">{item.batch_no || '-'}</td>
                                  <td className="px-3 py-2 text-white text-right">{item.rate ? `₹${formatNumber(item.rate)}` : '-'}</td>
                                  <td className="px-3 py-2 text-white font-semibold text-right">
                                    {item.total_cost ? `₹${formatNumber(item.total_cost)}` : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-white/5">
                            <tr>
                              <td colSpan="6" className="px-3 py-2 text-right text-white/70">Total Material Cost:</td>
                              <td className="px-3 py-2 text-white font-bold text-right">
                                ₹{formatNumber(consumptionDetails[production.id].reduce((sum, i) => sum + (i.total_cost || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-white/50 text-center py-4">No material consumption records found</p>
                    )}
                    
                    {/* Stock Update Info */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-green-400 text-xs mb-1">Stock Updated</p>
                        <p className="text-white text-sm">
                          {production.status === 'completed' ? 'Yes - Added to Finished Goods' : 'Pending'}
                        </p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-400 text-xs mb-1">Materials Deducted</p>
                        <p className="text-white text-sm">
                          {production.status === 'completed' ? 'Yes - From Raw Materials' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredProductions.length === 0 && (
              <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl">
                <BeakerIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No Production Entries Found</h3>
                <p className="text-white/50 mb-4">Start by adding a new production entry</p>
                <Link
                  href="/production/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add New Production
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}