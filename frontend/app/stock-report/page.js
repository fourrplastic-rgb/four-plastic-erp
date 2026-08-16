'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  CubeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PencilIcon,
  BeakerIcon,
  ScaleIcon,
  EyeIcon,
  XMarkIcon,
  InformationCircleIcon,
  ClockIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { useFinancialYear } from '@/context/FinancialYearContext'
import { exportToCSV } from '@/utils/exportToCSV'

// API Base URL
const API_BASE_URL = '/api'

export default function StockReportPage() {
  const [rawMaterials, setRawMaterials] = useState([])
  const [finishedGoods, setFinishedGoods] = useState([])
  const [productions, setProductions] = useState([])
  const [consumptions, setConsumptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedFinishedGood, setSelectedFinishedGood] = useState(null)
  const [showProductionModal, setShowProductionModal] = useState(false)
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    totalProductionQty: 0,
    totalRawConsumed: 0
  })
  const router = useRouter()
  const { selectedYear: activeFY } = useFinancialYear()

  useEffect(() => {
    console.log("🔍 StockReportPage mounted");
    checkAuth()
    if (activeFY) {
      fetchAllData()
    }
  }, [activeFY])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    console.log("🔐 Auth check - user:", user);
    if (!user) {
      router.push('/')
    }
  }

  const fetchAllData = async (showRefreshToast = false) => {
    console.log("=".repeat(60));
    console.log("🚀 fetchAllData STARTED", showRefreshToast ? '(Refresh)' : '(Initial)');
    console.log("=".repeat(60));
    
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      console.log(`📡 Timestamp for cache busting: ${timestamp}`);
      
      // Fetch raw materials stock with cache-busting
      console.log(`📡 Fetching raw materials from: ${API_BASE_URL}/stock/raw-materials?_=${timestamp}`);
      const rawResponse = await axios.get(`${API_BASE_URL}/stock/raw-materials?_=${timestamp}`)
      console.log("✅ Raw materials response status:", rawResponse.status);
      console.log("✅ Raw materials data received:", rawResponse.data);
      console.log("✅ Raw materials count:", rawResponse.data.length);
      const rawData = rawResponse.data
      
      // Fetch finished goods stock with cache-busting
      console.log(`📡 Fetching finished goods from: ${API_BASE_URL}/stock/finished-goods?_=${timestamp}`);
      const finishedResponse = await axios.get(`${API_BASE_URL}/stock/finished-goods?_=${timestamp}`)
      console.log("✅ Finished goods response status:", finishedResponse.status);
      console.log("✅ Finished goods data received:", finishedResponse.data);
      console.log("✅ Finished goods count:", finishedResponse.data.length);
      const finishedData = finishedResponse.data
      
      // Fetch production entries with cache-busting
      let productionsData = []
      let consumptionsData = []
      try {
        console.log(`📡 Fetching production from: ${API_BASE_URL}/production?_=${timestamp}`);
        const prodResponse = await axios.get(`${API_BASE_URL}/production?_=${timestamp}`)
        productionsData = prodResponse.data
        console.log('✅ Production data received:', productionsData);
        console.log('✅ Productions count:', productionsData.length);
        
        // Extract consumptions from productions
        if (productionsData.length > 0) {
          productionsData.forEach(p => {
            if (p.consumptions && p.consumptions.length > 0) {
              console.log(`📦 Production ${p.id} has ${p.consumptions.length} consumptions`);
              consumptionsData = [...consumptionsData, ...p.consumptions.map(c => ({
                ...c,
                production_id: p.id,
                finished_good_id: p.finished_good_id
              }))]
            }
          })
          console.log('✅ Consumptions extracted:', consumptionsData.length);
        }
      } catch (error) {
        console.log('⚠️ No production data found', error.message);
      }
      
      console.log("📊 Setting state with data...");
      setRawMaterials(rawData)
      setFinishedGoods(finishedData)
      setProductions(productionsData)
      setConsumptions(consumptionsData)
      
      // Calculate summary
      const allItems = [...rawData, ...finishedData]
      console.log("📊 All items for summary:", allItems);
      
      const lowStock = allItems.filter(item => 
        item.alert_level === 'Low Stock' || item.alert_level === 'Critical'
      )
      const totalValue = allItems.reduce((sum, item) => sum + (item.stock_value || 0), 0)
      
      // Filter productions by Active FY
      const fromDate = activeFY ? new Date(activeFY.start_date) : new Date('2000-01-01')
      const toDate = activeFY ? new Date(activeFY.end_date) : new Date()
      toDate.setHours(23, 59, 59, 999)

      const filteredProductions = productionsData.filter(p => {
        const pDate = new Date(p.production_date)
        return pDate >= fromDate && pDate <= toDate
      })
      
      const filteredConsumptions = consumptionsData.filter(c => {
        const parentProduction = productionsData.find(p => p.id === c.production_id)
        if (!parentProduction) return false
        const pDate = new Date(parentProduction.production_date)
        return pDate >= fromDate && pDate <= toDate
      })

      const totalProductionQty = filteredProductions.reduce((sum, p) => 
        sum + (p.good_quantity || 0), 0)
      
      const totalRawConsumed = filteredConsumptions.reduce((sum, c) => 
        sum + (c.quantity_used || c.quantity || 0), 0)
      
      const newSummary = {
        totalItems: allItems.length,
        lowStockItems: lowStock.length,
        totalValue: totalValue,
        totalProductionQty,
        totalRawConsumed
      }
      
      console.log("📊 Summary calculated:", newSummary);
      setSummary(newSummary)
      
      setLastUpdated(new Date())
      
      if (showRefreshToast) {
        toast.success('Stock data refreshed!')
      }
      
      console.log("✅ fetchAllData COMPLETED SUCCESSFULLY");
      console.log("=".repeat(60));
      
    } catch (error) {
      console.error("❌ ERROR in fetchAllData:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      toast.error('Failed to fetch stock data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Calculate production capacity for a finished good
  const calculateProductionCapacity = (finishedGood) => {
    if (!finishedGood) return { possible: 0, limiting: null, details: [] }
    
    console.log(`🔢 Calculating production capacity for: ${finishedGood.name} (ID: ${finishedGood.id})`);
    
    // Get all productions for this finished good
    const relevantProductions = productions.filter(p => 
      p.finished_good_id === finishedGood.id
    )
    
    if (relevantProductions.length === 0) {
      console.log(`⚠️ No productions found for ${finishedGood.name}`);
      return { possible: 0, limiting: null, details: [] }
    }
    
    // Get all consumptions for this finished good
    const relevantConsumptions = consumptions.filter(c => 
      c.finished_good_id === finishedGood.id
    )
    
    if (relevantConsumptions.length === 0) {
      console.log(`⚠️ No consumptions found for ${finishedGood.name}`);
      return { possible: 0, limiting: null, details: [] }
    }
    
    // Calculate average consumption per raw material
    const consumptionPerUnit = {}
    const rawMaterialUsage = {}
    
    relevantConsumptions.forEach(cons => {
      const production = relevantProductions.find(p => p.id === cons.production_id)
      if (production) {
        const producedQty = production.good_quantity || 1
        const perUnit = cons.quantity_used / producedQty
        
        if (!consumptionPerUnit[cons.raw_material_id]) {
          consumptionPerUnit[cons.raw_material_id] = []
          rawMaterialUsage[cons.raw_material_id] = {
            name: '',
            totalConsumed: 0,
            totalProduced: 0
          }
        }
        
        consumptionPerUnit[cons.raw_material_id].push(perUnit)
        rawMaterialUsage[cons.raw_material_id].totalConsumed += cons.quantity_used
        rawMaterialUsage[cons.raw_material_id].totalProduced += producedQty
      }
    })
    
    // Calculate average per unit
    const avgPerUnit = {}
    Object.keys(consumptionPerUnit).forEach(matId => {
      const values = consumptionPerUnit[matId]
      avgPerUnit[matId] = values.reduce((a, b) => a + b, 0) / values.length
      
      // Get material name from raw materials
      const material = rawMaterials.find(r => r.id === parseInt(matId))
      if (material) {
        rawMaterialUsage[matId].name = material.name
      }
    })
    
    // Calculate how many units can be produced
    let possibleUnits = Infinity
    let limitingMaterial = null
    
    const details = []
    
    Object.keys(avgPerUnit).forEach(matId => {
      const material = rawMaterials.find(r => r.id === parseInt(matId))
      if (material) {
        const availableStock = material.current_stock || 0
        const neededPerUnit = avgPerUnit[matId]
        const possible = Math.floor(availableStock / neededPerUnit)
        
        details.push({
          materialName: material.name,
          availableStock,
          neededPerUnit,
          possible,
          unit: material.unit
        })
        
        if (possible < possibleUnits) {
          possibleUnits = possible
          limitingMaterial = material.name
        }
      }
    })
    
    const result = {
      possible: possibleUnits === Infinity ? 0 : possibleUnits,
      limiting: limitingMaterial,
      details
    }
    
    console.log(`✅ Capacity for ${finishedGood.name}:`, result);
    return result
  }

  const handleEditItem = (item) => {
    router.push(`/items/edit/${item.id}?type=${item.type || 'raw_material'}`)
  }

  const handleViewProduction = (item) => {
    setSelectedFinishedGood(item)
    setShowProductionModal(true)
  }

  const handleRefresh = () => {
    fetchAllData(true)
  }

  const handleExportCSV = () => {
    const dataToExport = []
    
    if (activeTab === 'all' || activeTab === 'raw') {
      filteredRawMaterials.forEach(item => {
        dataToExport.push({
          'Type': 'Raw Material',
          'Code': item.code || `RM${item.id}`,
          'Name': item.name,
          'Unit': item.unit || 'KG',
          'Current Stock': item.current_stock,
          'Min Stock': item.min_stock || 0,
          'Max Stock': item.max_stock || 0,
          'Rate': item.purchase_rate,
          'Stock Value': item.stock_value,
          'Location': item.location || '-',
          'Status': item.alert_level || 'Good'
        })
      })
    }
    
    if (activeTab === 'all' || activeTab === 'finished') {
      filteredFinishedGoods.forEach(item => {
        const capacity = calculateProductionCapacity(item)
        dataToExport.push({
          'Type': 'Finished Good',
          'Code': item.code || `FG${item.id}`,
          'Name': item.name,
          'Unit': item.unit || 'PCS',
          'Current Stock': item.current_stock,
          'Min Stock': item.min_stock || 0,
          'Max Stock': item.max_stock || 0,
          'Rate': item.sales_rate,
          'Stock Value': item.stock_value,
          'Location': item.location || '-',
          'Status': item.alert_level || 'Good',
          'Can Produce': capacity.possible > 0 ? capacity.possible : 0,
          'Limiting Material': capacity.limiting || '-'
        })
      })
    }
    
    exportToCSV(dataToExport, `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV Exported Successfully')
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Low Stock':
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Reorder Level':
      case 'Warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Normal':
      case 'Good':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Low Stock':
      case 'Critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
      case 'Reorder Level':
      case 'Warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
      default:
        return <CubeIcon className="h-4 w-4 text-green-400" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2
    }).format(num || 0)
  }

  const formatDateTime = (date) => {
    if (!date) return 'Never'
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredRawMaterials = rawMaterials.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFinishedGoods = finishedGoods.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading stock data...</p>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <ChartBarIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  STOCK REPORT
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <div className="flex items-center gap-1 text-white/50 text-sm">
                    <ClockIcon className="h-4 w-4" />
                    <span>Last updated: {formatDateTime(lastUpdated)}</span>
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-white/10 border border-white/20 
                    rounded-lg text-white hover:bg-white/20
                    flex items-center gap-2 transition-all print:hidden
                    ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 transition-all print:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30 flex items-center gap-2 transition-all print:hidden"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Items</p>
                  <p className="text-3xl font-bold text-white mt-2">{summary.totalItems}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CubeIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Low Stock Items</p>
                  <p className="text-3xl font-bold text-white mt-2">{summary.lowStockItems}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Stock Value</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{formatCurrency(summary.totalValue)}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <ScaleIcon className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Production Stats</p>
                  <p className="text-3xl font-bold text-orange-400 mt-2">{formatNumber(summary.totalProductionQty)}</p>
                  <p className="text-white/40 text-xs">Raw Used: {formatNumber(summary.totalRawConsumed)}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <BeakerIcon className="h-8 w-8 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search by name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'all' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'raw' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Raw Materials
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'finished' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Finished Goods
              </button>
            </div>
          </div>

          {/* Raw Materials Table */}
          {(activeTab === 'all' || activeTab === 'raw') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-blue-400" />
                Raw Materials
              </h2>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Unit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Current Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Min Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Max Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Stock Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredRawMaterials.length > 0 ? (
                        filteredRawMaterials.map((item) => (
                          <tr key={`raw-${item.id}`} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-sm text-white font-mono">{item.code || `RM${item.id}`}</td>
                            <td className="px-4 py-3 text-sm text-white">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-white/70">{item.unit || 'KG'}</td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${
                              item.current_stock <= item.min_stock ? 'text-red-400' : 'text-white'
                            }`}>
                              {formatNumber(item.current_stock)}
                            </td>
                            <td className="px-4 py-3 text-sm text-white/70 text-right">{item.min_stock || 0}</td>
                            <td className="px-4 py-3 text-sm text-white/70 text-right">{item.max_stock || 0}</td>
                            <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.purchase_rate)}</td>
                            <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.stock_value)}</td>
                            <td className="px-4 py-3 text-sm text-white/70">{item.location || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(item.alert_level)} flex items-center gap-1 w-fit`}>
                                {getStatusIcon(item.alert_level)}
                                {item.alert_level || 'Good'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                onClick={() => handleEditItem({...item, type: 'raw_material'})}
                                className="text-blue-400 hover:text-blue-300 transition-colors mx-1"
                                title="Edit Item"
                              >
                                <PencilIcon className="h-5 w-5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="11" className="px-4 py-8 text-center text-white/50">
                            No raw materials found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Finished Goods Table */}
          {(activeTab === 'all' || activeTab === 'finished') && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-green-400" />
                Finished Goods
              </h2>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Unit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Current Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Min Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Max Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Sales Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">MRP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Stock Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Can Produce</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Limiting Material</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredFinishedGoods.length > 0 ? (
                        filteredFinishedGoods.map((item) => {
                          const capacity = calculateProductionCapacity(item)
                          
                          return (
                            <tr key={`fg-${item.id}`} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-sm text-white font-mono">{item.code || `FG${item.id}`}</td>
                              <td className="px-4 py-3 text-sm text-white">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-white/70">{item.unit || 'PCS'}</td>
                              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                                item.current_stock <= item.min_stock ? 'text-red-400' : 'text-white'
                              }`}>
                                {formatNumber(item.current_stock)}
                              </td>
                              <td className="px-4 py-3 text-sm text-white/70 text-right">{item.min_stock || 0}</td>
                              <td className="px-4 py-3 text-sm text-white/70 text-right">{item.max_stock || 0}</td>
                              <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.sales_rate)}</td>
                              <td className="px-4 py-3 text-sm text-purple-400 text-right">{formatCurrency(item.mrp)}</td>
                              <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.stock_value)}</td>
                              <td className="px-4 py-3 text-sm text-blue-400 text-right font-bold">
                                {capacity.possible > 0 ? formatNumber(capacity.possible) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-white/70">
                                {capacity.limiting || '-'}
                                {capacity.possible > 0 && (
                                  <button
                                    onClick={() => handleViewProduction(item)}
                                    className="ml-2 text-blue-400 hover:text-blue-300"
                                    title="View Production Details"
                                  >
                                    <InformationCircleIcon className="h-4 w-4 inline" />
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-white/70">{item.location || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(item.alert_level)} flex items-center gap-1 w-fit`}>
                                  {getStatusIcon(item.alert_level)}
                                  {item.alert_level || 'Good'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <button
                                  onClick={() => handleEditItem({...item, type: 'finished_good'})}
                                  className="text-blue-400 hover:text-blue-300 transition-colors mx-1"
                                  title="Edit Item"
                                >
                                  <PencilIcon className="h-5 w-5 inline" />
                                </button>
                                <button
                                  onClick={() => handleViewProduction(item)}
                                  className="text-purple-400 hover:text-purple-300 transition-colors mx-1"
                                  title="View Production Details"
                                >
                                  <EyeIcon className="h-5 w-5 inline" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="14" className="px-4 py-8 text-center text-white/50">
                            No finished goods found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Production Details Modal */}
          {showProductionModal && selectedFinishedGood && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Production Analysis: {selectedFinishedGood.name}
                    </h3>
                    <p className="text-white/50 text-sm">
                      Current Stock: {formatNumber(selectedFinishedGood.current_stock)} {selectedFinishedGood.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowProductionModal(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Production Capacity */}
                {(() => {
                  const capacity = calculateProductionCapacity(selectedFinishedGood)
                  return (
                    <div className="mb-6">
                      <h4 className="text-white/80 font-semibold mb-3">Production Capacity</h4>
                      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4">
                        <p className="text-white text-lg">
                          Can produce <span className="text-pink-400 font-bold text-2xl">{formatNumber(capacity.possible)}</span> more units
                        </p>
                        {capacity.limiting && (
                          <p className="text-white/70 text-sm mt-1">
                            Limited by: <span className="text-yellow-400">{capacity.limiting}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Raw Material Requirements */}
                <div className="mb-6">
                  <h4 className="text-white/80 font-semibold mb-3">Raw Material Requirements</h4>
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white/60">Material</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Required per Unit</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Available Stock</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Can Produce</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white/60">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {(() => {
                          const capacity = calculateProductionCapacity(selectedFinishedGood)
                          return capacity.details.length > 0 ? (
                            capacity.details.map((detail, idx) => (
                              <tr key={`detail-${idx}`}>
                                <td className="px-4 py-2 text-sm text-white">{detail.materialName}</td>
                                <td className="px-4 py-2 text-sm text-white/70 text-right">{formatNumber(detail.neededPerUnit)}</td>
                                <td className="px-4 py-2 text-sm text-white text-right">{formatNumber(detail.availableStock)}</td>
                                <td className="px-4 py-2 text-sm text-blue-400 text-right font-bold">{formatNumber(detail.possible)}</td>
                                <td className="px-4 py-2 text-sm text-white/70">{detail.unit}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-4 py-4 text-center text-white/50">
                                No consumption data available
                              </td>
                            </tr>
                          )
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Production History */}
                <div>
                  <h4 className="text-white/80 font-semibold mb-3">Production History</h4>
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white/60">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Quantity Produced</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Raw Materials Used</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white/60">Batch No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {productions
                          .filter(p => p.finished_good_id === selectedFinishedGood.id)
                          .map((prod, idx) => {
                            const relatedConsumptions = consumptions.filter(c => c.production_id === prod.id)
                            const totalRawUsed = relatedConsumptions.reduce((sum, c) => sum + (c.quantity_used || c.quantity || 0), 0)
                            
                            return (
                              <tr key={`prod-${idx}`}>
                                <td className="px-4 py-2 text-sm text-white/70">
                                  {new Date(prod.production_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-green-400 text-right font-bold">
                                  {formatNumber(prod.good_quantity)}
                                </td>
                                <td className="px-4 py-2 text-sm text-white/70 text-right">
                                  {formatNumber(totalRawUsed)}
                                </td>
                                <td className="px-4 py-2 text-sm text-white/70">
                                  {prod.batch_no || '-'}
                                </td>
                              </tr>
                            )
                          })}
                        {productions.filter(p => p.finished_good_id === selectedFinishedGood.id).length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-white/50">
                              No production history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowProductionModal(false)}
                    className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}