'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  DocumentCheckIcon,  // Changed from SaveIcon to DocumentCheckIcon
  TrashIcon,
  PlusIcon,
  BeakerIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function EditProductionPage() {
  const router = useRouter()
  const params = useParams()
  const productionId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [formData, setFormData] = useState({
    production_no: '',
    production_date: '',
    finished_good_id: '',
    quantity_produced: '',
    rejected_quantity: '0',
    batch_no: '',
    machine_no: '',
    operator_name: '',
    supervisor_name: '',
    shift: 'day',
    notes: '',
    status: 'pending'
  })
  
  const [consumptionItems, setConsumptionItems] = useState([])

  useEffect(() => {
    checkAuth()
    fetchItems()
    fetchRawMaterials()
    fetchProductionData()
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
      // Filter for finished goods
      const finishedGoods = response.data.filter(item => 
        (item.item_type || item.type || '').toLowerCase().includes('finished') ||
        (item.item_type || item.type || '').toLowerCase() === 'fg'
      )
      setItems(finishedGoods)
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to fetch finished goods')
    }
  }

  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get('/api/items')
      // Filter for raw materials
      const rawMats = response.data.filter(item => 
        (item.item_type || item.type || '').toLowerCase().includes('raw') ||
        (item.item_type || item.type || '').toLowerCase() === 'rm'
      )
      setRawMaterials(rawMats)
    } catch (error) {
      console.error('Error fetching raw materials:', error)
      toast.error('Failed to fetch raw materials')
    }
  }

  const fetchProductionData = async () => {
    try {
      setLoading(true)
      
      // Fetch production details
      const productionResponse = await axios.get(`/api/production/${productionId}`)
      const production = productionResponse.data.production || productionResponse.data
      
      setFormData({
        production_no: production.production_no || '',
        production_date: production.production_date ? production.production_date.split('T')[0] : new Date().toISOString().split('T')[0],
        finished_good_id: production.finished_good_id || '',
        quantity_produced: production.quantity_produced || '',
        rejected_quantity: production.rejected_quantity || '0',
        batch_no: production.batch_no || '',
        machine_no: production.machine_no || '',
        operator_name: production.operator_name || '',
        supervisor_name: production.supervisor_name || '',
        shift: production.shift || 'day',
        notes: production.notes || '',
        status: production.status || 'pending'
      })

      // Fetch consumption details
      const consumptionResponse = await axios.get(`/api/production/${productionId}/consumption`)
      const consumption = consumptionResponse.data.consumption || consumptionResponse.data || []
      
      const formattedConsumption = consumption.map(item => ({
        raw_material_id: item.raw_material_id || '',
        raw_material_name: item.raw_material_name || '',
        quantity_used: item.quantity_used || '',
        uom: item.uom || 'KG',
        batch_no: item.batch_no || '',
        rate: item.rate || '',
        total_cost: item.total_cost || 0
      }))
      
      setConsumptionItems(formattedConsumption)
      
    } catch (error) {
      console.error('Error fetching production data:', error)
      toast.error('Failed to fetch production data')
      router.push('/production')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleConsumptionChange = (index, field, value) => {
    const updated = [...consumptionItems]
    updated[index][field] = value
    
    // Calculate total cost if rate and quantity are present
    if (field === 'quantity_used' || field === 'rate') {
      const quantity = parseFloat(updated[index].quantity_used) || 0
      const rate = parseFloat(updated[index].rate) || 0
      updated[index].total_cost = quantity * rate
    }
    
    setConsumptionItems(updated)
  }

  const addConsumptionItem = () => {
    setConsumptionItems([
      ...consumptionItems,
      {
        raw_material_id: '',
        raw_material_name: '',
        quantity_used: '',
        uom: 'KG',
        batch_no: '',
        rate: '',
        total_cost: 0
      }
    ])
  }

  const removeConsumptionItem = (index) => {
    if (consumptionItems.length > 1) {
      setConsumptionItems(consumptionItems.filter((_, i) => i !== index))
    } else {
      toast.error('At least one consumption item is required')
    }
  }

  // FIXED: Updated handleSubmit to send 'materials' instead of 'consumption'
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.finished_good_id) {
      toast.error('Please select a finished good')
      return
    }
    
    if (!formData.quantity_produced || parseFloat(formData.quantity_produced) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    // Validate consumption items
    for (const item of consumptionItems) {
      if (!item.raw_material_id) {
        toast.error('Please select raw material for all consumption items')
        return
      }
      if (!item.quantity_used || parseFloat(item.quantity_used) <= 0) {
        toast.error('Please enter valid quantity for all consumption items')
        return
      }
    }

    try {
      setSaving(true)
      
      // Prepare payload - IMPORTANT: Send as 'materials' not 'consumption'
      const payload = {
        production_date: formData.production_date,
        shift: formData.shift,
        finished_good_id: parseInt(formData.finished_good_id),
        quantity_produced: parseFloat(formData.quantity_produced),
        good_quantity: parseFloat(formData.quantity_produced) - parseFloat(formData.rejected_quantity || 0),
        rejected_quantity: parseFloat(formData.rejected_quantity || 0),
        rejection_reason: '',
        batch_no: formData.batch_no || '',
        machine_no: formData.machine_no || '',
        operator_name: formData.operator_name || '',
        supervisor_name: formData.supervisor_name || '',
        start_time: '',
        end_time: '',
        notes: formData.notes || '',
        status: formData.status,
        materials: consumptionItems.map(item => ({
          raw_material_id: parseInt(item.raw_material_id),
          quantity_used: parseFloat(item.quantity_used),
          batch_no: item.batch_no || ''
        })).filter(item => item.raw_material_id && item.quantity_used > 0)
      }
      
      console.log('📤 Updating production payload:', payload)
      
      await axios.put(`/api/production/${productionId}`, payload)
      
      toast.success('Production entry updated successfully')
      router.push(`/production/${productionId}`)
      
    } catch (error) {
      console.error('Error updating production:', error)
      toast.error(error.response?.data?.error || 'Failed to update production')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this production entry? This action cannot be undone.')) {
      return
    }
    
    try {
      await axios.delete(`/api/production/${productionId}`)
      toast.success('Production entry deleted')
      router.push('/production')
    } catch (error) {
      toast.error('Failed to delete production')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading production data...</p>
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
                <Link
                  href={`/production/${productionId}`}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <BeakerIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Edit Production Entry</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  formData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  formData.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30  text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  <TrashIcon className="h-5 w-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Production Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <BeakerIcon className="h-5 w-5 text-pink-400" />
                Production Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Production No</label>
                  <input
                    type="text"
                    name="production_no"
                    value={formData.production_no}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Production Date *</label>
                  <input
                    type="date"
                    name="production_date"
                    value={formData.production_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Finished Good *</label>
                  <select
                    name="finished_good_id"
                    value={formData.finished_good_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                    required
                  >
                    <option value="">Select Finished Good</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.item_code || item.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Quantity Produced *</label>
                  <input
                    type="number"
                    name="quantity_produced"
                    value={formData.quantity_produced}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Rejected Quantity</label>
                  <input
                    type="number"
                    name="rejected_quantity"
                    value={formData.rejected_quantity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Batch/Lot No</label>
                  <input
                    type="text"
                    name="batch_no"
                    value={formData.batch_no}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., BATCH-001"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Machine No</label>
                  <input
                    type="text"
                    name="machine_no"
                    value={formData.machine_no}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., MACH-01"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Shift</label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="general">General</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Operator Name</label>
                  <input
                    type="text"
                    name="operator_name"
                    value={formData.operator_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    name="supervisor_name"
                    value={formData.supervisor_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Raw Materials Consumption */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                  <BeakerIcon className="h-5 w-5 text-pink-400" />
                  Raw Materials Consumed
                </h2>
                <button
                  type="button"
                  onClick={addConsumptionItem}
                  className="flex items-center gap-1 px-3 py-1 bg-pink-500/20 border border-pink-500/30  text-pink-400 rounded-lg hover:bg-pink-500/30 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Material
                </button>
              </div>
              
              <div className="space-y-3">
                {consumptionItems.map((item, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <select
                          value={item.raw_material_id}
                          onChange={(e) => handleConsumptionChange(index, 'raw_material_id', e.target.value)}
                          className="w-full px-2 py-1.5 bg-gray-800 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                          style={{ backgroundColor: '#1f2937' }}
                        >
                          <option value="">Select Material</option>
                          {rawMaterials.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              {rm.name} ({rm.item_code || rm.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Batch No"
                          value={item.batch_no}
                          onChange={(e) => handleConsumptionChange(index, 'batch_no', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity_used}
                          onChange={(e) => handleConsumptionChange(index, 'quantity_used', e.target.value)}
                          step="0.001"
                          min="0"
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <select
                          value={item.uom}
                          onChange={(e) => handleConsumptionChange(index, 'uom', e.target.value)}
                          className="w-full px-2 py-1.5 bg-gray-800 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                          style={{ backgroundColor: '#1f2937' }}
                        >
                          <option value="KG">KG</option>
                          <option value="G">G</option>
                          <option value="L">L</option>
                          <option value="ML">ML</option>
                          <option value="PCS">PCS</option>
                          <option value="BOX">BOX</option>
                        </select>
                      </div>
                      
                      <div className="col-span-1">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => handleConsumptionChange(index, 'rate', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Total Cost"
                          value={item.total_cost ? `₹${parseFloat(item.total_cost).toFixed(2)}` : '₹0.00'}
                          readOnly
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70 text-sm"
                        />
                      </div>
                      
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeConsumptionItem(index)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          disabled={consumptionItems.length === 1}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Cost Summary */}
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <div className="text-right">
                  <p className="text-white/50 text-sm">Total Material Cost</p>
                  <p className="text-white text-xl font-bold">
                    ₹{consumptionItems.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Link
                href={`/production/${productionId}`}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg  hover:bg-white/20 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}