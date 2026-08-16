'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  BeakerIcon,
  CubeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function ViewProductionPage() {
  const router = useRouter()
  const params = useParams()
  const productionId = params.id

  const [loading, setLoading] = useState(true)
  const [production, setProduction] = useState(null)
  const [consumption, setConsumption] = useState([])
  const [items, setItems] = useState([])
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchItems()
    fetchProductionData()

    const handleAfterPrint = () => {
      setShowPrint(false)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

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
    }
  }

  const fetchProductionData = async () => {
    try {
      setLoading(true)
      
      const productionResponse = await axios.get(`/api/production/${productionId}`)
      setProduction(productionResponse.data.production || productionResponse.data)
      
      const consumptionResponse = await axios.get(`/api/production/${productionId}/consumption`)
      setConsumption(consumptionResponse.data.consumption || consumptionResponse.data || [])
      
    } catch (error) {
      console.error('Error fetching production data:', error)
      toast.error('Failed to fetch production data')
      router.push('/production')
    } finally {
      setLoading(false)
    }
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

  const getItemName = (itemId, type = 'finished_good') => {
    if (!items.length || !itemId) return 'N/A'
    
    const item = items.find(i => {
      if (i.id !== itemId) return false
      const itemType = (i.item_type || i.type || '').toLowerCase()
      const searchType = type.toLowerCase()
      
      if (searchType === 'finished_good') {
        return itemType.includes('finished') || itemType === 'fg'
      } else if (searchType === 'raw_material') {
        return itemType.includes('raw') || itemType === 'rm'
      }
      return false
    })
    
    return item ? item.name : `Item ${itemId}`
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Completed</span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">Pending</span>
      case 'verified':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Verified</span>
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">{status}</span>
    }
  }

  const handlePrint = () => {
    setShowPrint(true)
    // Small delay to ensure print content is rendered
    setTimeout(() => {
      window.print()
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading production details...</p>
        </div>
      </div>
    )
  }

  if (!production) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Production Entry Not Found</h3>
          <Link
            href="/production"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Production List
          </Link>
        </div>
      </div>
    )
  }

  // Calculate net production
  const netProduction = (parseFloat(production.quantity_produced) || 0) - (parseFloat(production.rejected_quantity) || 0)
  const totalMaterialCost = consumption.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0)

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/production"
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <BeakerIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Production Details</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
                <Link
                  href={`/production/${productionId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PencilIcon className="h-5 w-5" />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Production Info Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-white text-xl font-bold">{production.production_no}</h2>
                  <p className="text-white/50 text-sm mt-1">{formatDate(production.production_date)}</p>
                </div>
                {getStatusBadge(production.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Production Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Finished Good:</span>
                      <span className="text-white font-medium">
                        {getItemName(production.finished_good_id, 'finished_good')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Quantity Produced:</span>
                      <span className="text-white font-medium">{formatNumber(production.quantity_produced)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Rejected Quantity:</span>
                      <span className="text-red-400 font-medium">{formatNumber(production.rejected_quantity || 0)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Net Production:</span>
                      <span className="text-green-400 font-medium">{formatNumber(netProduction)} units</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Batch Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Batch/Lot No:</span>
                      <span className="text-white">{production.batch_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Machine No:</span>
                      <span className="text-white">{production.machine_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Shift:</span>
                      <span className="text-white capitalize">{production.shift || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Personnel</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Operator:</span>
                      <span className="text-white">{production.operator_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Supervisor:</span>
                      <span className="text-white">{production.supervisor_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {production.notes && (
                  <div className="md:col-span-2">
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Notes</h3>
                    <p className="text-white bg-white/5 p-3 rounded-lg">{production.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw Materials Consumption */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <CubeIcon className="h-5 w-5 text-pink-400" />
              Raw Materials Consumed
            </h2>
            
            {consumption.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Material</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Batch No</th>
                      <th className="px-4 py-2 text-right text-white/60 text-sm">Quantity Used</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">UOM</th>
                      <th className="px-4 py-2 text-right text-white/60 text-sm">Rate (₹)</th>
                      <th className="px-4 py-2 text-right text-white/60 text-sm">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {consumption.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-white">
                          {item.raw_material_name || getItemName(item.raw_material_id, 'raw_material')}
                        </td>
                        <td className="px-4 py-2 text-white/70">{item.batch_no || '-'}</td>
                        <td className="px-4 py-2 text-white text-right">{formatNumber(item.quantity_used)}</td>
                        <td className="px-4 py-2 text-white/70">{item.uom || 'KG'}</td>
                        <td className="px-4 py-2 text-white text-right">
                          {item.rate ? `₹${formatNumber(item.rate)}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-white font-semibold text-right">
                          {item.total_cost ? `₹${formatNumber(item.total_cost)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/5">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right text-white/70">Total Material Cost:</td>
                      <td className="px-4 py-3 text-white font-bold text-right">
                        ₹{formatNumber(totalMaterialCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-white/50 text-center py-8">No raw materials consumption recorded</p>
            )}
          </div>

          {/* Stock Update Status */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-green-400 text-sm">Finished Goods Stock</p>
                  <p className="text-white font-semibold">
                    {production.status === 'completed' ? 'Updated' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CubeIcon className="h-6 w-6 text-blue-400" />
                <div>
                  <p className="text-blue-400 text-sm">Raw Materials Stock</p>
                  <p className="text-white font-semibold">
                    {production.status === 'completed' ? 'Deducted' : 'Not Deducted'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Print Modal - Hidden by default, shown when printing */}
      {showPrint && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto" style={{ display: showPrint ? 'block' : 'none' }}>
          <div className="max-w-4xl mx-auto p-8">
            {/* Print Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Production Slip</h1>
              <p className="text-gray-600 mt-1">Production #: {production.production_no}</p>
            </div>

            {/* Company Info */}
            <div className="flex justify-between mb-8 pb-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-800">Your Company Name</h2>
                <p className="text-sm text-gray-600">123 Business Street</p>
                <p className="text-sm text-gray-600">City, State - 123456</p>
                <p className="text-sm text-gray-600">GST: 1234567890</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date: {formatDate(production.production_date)}</p>
                <p className="text-sm text-gray-600">Status: <span className="capitalize">{production.status}</span></p>
              </div>
            </div>

            {/* Production Details */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Production Details</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-600">Finished Good:</td>
                      <td className="py-1 font-medium">{getItemName(production.finished_good_id, 'finished_good')}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Quantity Produced:</td>
                      <td className="py-1 font-medium">{formatNumber(production.quantity_produced)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Rejected Quantity:</td>
                      <td className="py-1 font-medium">{formatNumber(production.rejected_quantity || 0)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Net Production:</td>
                      <td className="py-1 font-medium">{formatNumber(netProduction)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Batch Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-600">Batch/Lot No:</td>
                      <td className="py-1 font-medium">{production.batch_no || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Machine No:</td>
                      <td className="py-1 font-medium">{production.machine_no || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Shift:</td>
                      <td className="py-1 font-medium capitalize">{production.shift || 'General'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Operator:</td>
                      <td className="py-1 font-medium">{production.operator_name || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Materials Consumption */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">Raw Materials Consumed</h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-700">Material</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-700">Batch No</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-700">UOM</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-sm font-semibold text-gray-700">Rate (₹)</th>
                    <th className="border border-gray-200 px-3 py-2 text-right text-sm font-semibold text-gray-700">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {consumption.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        {item.raw_material_name || getItemName(item.raw_material_id, 'raw_material')}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{item.batch_no || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-right">{formatNumber(item.quantity_used)}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{item.uom || 'KG'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-right">
                        {item.rate ? `₹${formatNumber(item.rate)}` : '-'}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-right font-medium">
                        {item.total_cost ? `₹${formatNumber(item.total_cost)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="5" className="border border-gray-200 px-3 py-2 text-right text-sm font-semibold">
                      Total Material Cost:
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-sm font-bold">
                      ₹{formatNumber(totalMaterialCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {production.notes && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{production.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="flex justify-between mt-12 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Prepared By</p>
                <p className="font-medium mt-8">{production.operator_name || '______________'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Checked By</p>
                <p className="font-medium mt-8">{production.supervisor_name || '______________'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Authorized By</p>
                <p className="font-medium mt-8">______________</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>This is a system generated production slip</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}