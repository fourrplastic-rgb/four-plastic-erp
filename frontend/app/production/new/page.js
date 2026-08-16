'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BeakerIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function NewProductionPage() {
  const [finishedGoods, setFinishedGoods] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [materialRows, setMaterialRows] = useState([
    { raw_material_id: '', quantity_used: '', rate: '', batch_no: '' }
  ])
  
  const [formData, setFormData] = useState({
    production_date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    finished_good_id: '',
    quantity_produced: '',
    batch_no: '',
    machine_no: '',
    operator_name: '',
    supervisor_name: '',
    good_quantity: '',
    rejected_quantity: '0',
    rejection_reason: '',
    start_time: '',
    end_time: '',
    cost_center_name: '',
    overhead_hourly_rate: '',
    total_overhead_cost: '',
    notes: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchItems()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchItems = async () => {
    try {
      console.log('🔍 Fetching items from API...')
      
      // Fetch finished goods from dedicated endpoint
      const finishedResponse = await axios.get('/api/stock/finished-goods')
      console.log('✅ Finished Goods found:', finishedResponse.data.length)
      console.log('📋 Finished Goods list:', finishedResponse.data.map(f => ({ id: f.id, name: f.name })))
      
      // Fetch raw materials from dedicated endpoint
      const rawResponse = await axios.get('/api/stock/raw-materials')
      console.log('✅ Raw Materials found:', rawResponse.data.length)
      console.log('📋 Raw Materials list:', rawResponse.data.map(r => ({ id: r.id, name: r.name })))
      
      setFinishedGoods(finishedResponse.data)
      setRawMaterials(rawResponse.data)
      
      // Specifically check for Plastic Moulded Chair
      const chair = finishedResponse.data.find(f => f.name === 'Plastic Moulded Chair' || f.id === 6)
      console.log('🪑 Plastic Moulded Chair details:', chair || 'NOT FOUND!')
      
      if (finishedResponse.data.length === 0) {
        toast.error('No finished goods found. Please add items in Item Master.')
      }
      
      if (rawResponse.data.length === 0) {
        toast.error('No raw materials found. Please add items in Item Master.')
      }
      
    } catch (error) {
      console.error('❌ Error fetching items:', error)
      if (error.response) {
        toast.error(`Failed to fetch items: ${error.response.status}`)
      } else if (error.request) {
        toast.error('Cannot connect to server. Make sure backend is running on port 5001.')
      } else {
        toast.error('Error: ' + error.message)
      }
      setFinishedGoods([])
      setRawMaterials([])
    }
  }

  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { raw_material_id: '', quantity_used: '', rate: '', batch_no: '' }])
  }

  const removeMaterialRow = (index) => {
    if (materialRows.length > 1) {
      setMaterialRows(materialRows.filter((_, i) => i !== index))
    }
  }

  const updateMaterialRow = (index, field, value) => {
    const updatedRows = [...materialRows]
    updatedRows[index][field] = value
    setMaterialRows(updatedRows)
  }

  const handleBlendScrap = (index) => {
    const row = materialRows[index];
    if (!row.raw_material_id) {
      toast.error('Please select a virgin material first');
      return;
    }
    if (!row.quantity_used || parseFloat(row.quantity_used) <= 0) {
      toast.error('Please enter a quantity to blend');
      return;
    }
    
    const percentStr = prompt('Enter scrap/regrind blend percentage (e.g. 20 for 20% scrap):', '20');
    if (percentStr === null) return;
    
    const percent = parseFloat(percentStr);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }
    
    const originalQty = parseFloat(row.quantity_used);
    const scrapQty = (originalQty * percent) / 100;
    const remainingQty = originalQty - scrapQty;
    
    // Update current row quantity
    const updatedRows = [...materialRows];
    updatedRows[index].quantity_used = remainingQty.toFixed(2);
    
    // Find a suitable scrap material in rawMaterials (defaulting to PP Color Scrap ID 4 or PP Scrap ID 1)
    const scrapMaterial = rawMaterials.find(m => m.id === 4) || rawMaterials.find(m => m.id === 1) || rawMaterials[0];
    
    // Add new row with scrap material
    const newRow = {
      raw_material_id: scrapMaterial ? scrapMaterial.id.toString() : '1',
      quantity_used: scrapQty.toFixed(2),
      rate: scrapMaterial ? (scrapMaterial.purchase_rate || scrapMaterial.rate || '') : '',
      batch_no: row.batch_no || 'RECYCLED'
    };
    
    setMaterialRows([...updatedRows, newRow]);
    toast.success(`Blended ${percent}% (${scrapQty.toFixed(2)} KG) of ${scrapMaterial ? scrapMaterial.name : 'Scrap'}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.finished_good_id) {
        toast.error('Please select a finished good')
        setLoading(false)
        return
      }

      if (!formData.quantity_produced || parseFloat(formData.quantity_produced) <= 0) {
        toast.error('Please enter a valid quantity')
        setLoading(false)
        return
      }

      // Log the selected finished good for debugging
      const selectedFG = finishedGoods.find(fg => fg.id === parseInt(formData.finished_good_id))
      console.log('🎯 Selected Finished Good:', selectedFG)
      console.log('🆔 Selected Finished Good ID:', parseInt(formData.finished_good_id))
      
      // Generate production number
      const dateStr = new Date().toISOString().slice(2,10).replace(/-/g, '')
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const prodNo = `PROD${dateStr}${randomNum}`
      
      // Prepare materials data
      const materials = materialRows
        .filter(m => m.raw_material_id && m.quantity_used && parseFloat(m.quantity_used) > 0)
        .map(m => ({
          raw_material_id: parseInt(m.raw_material_id),
          quantity_used: parseFloat(m.quantity_used),
          rate: m.rate ? parseFloat(m.rate) : null,
          batch_no: m.batch_no || ''
        }))

      console.log('📦 Materials being used:', materials)

      const payload = {
        production_no: prodNo,
        production_date: formData.production_date,
        shift: formData.shift,
        finished_good_id: parseInt(formData.finished_good_id), // Make sure it's an integer
        quantity_produced: parseFloat(formData.quantity_produced),
        good_quantity: formData.good_quantity ? parseFloat(formData.good_quantity) : parseFloat(formData.quantity_produced),
        rejected_quantity: parseFloat(formData.rejected_quantity) || 0,
        rejection_reason: formData.rejection_reason || '',
        batch_no: formData.batch_no || '',
        machine_no: formData.machine_no || '',
        operator_name: formData.operator_name || '',
        supervisor_name: formData.supervisor_name || '',
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        cost_center_name: formData.cost_center_name || '',
        overhead_hourly_rate: formData.overhead_hourly_rate ? parseFloat(formData.overhead_hourly_rate) : 0,
        total_overhead_cost: formData.total_overhead_cost ? parseFloat(formData.total_overhead_cost) : 0,
        notes: formData.notes || '',
        status: 'pending',
        materials: materials
      }

      console.log('📤 Submitting payload:', JSON.stringify(payload, null, 2))
      
      const response = await axios.post('/api/production', payload)
      
      console.log('✅ Server response:', response.data)
      toast.success('Production entry created successfully!')
      
      // Redirect to production list
      setTimeout(() => {
        router.push('/production')
      }, 1500)
      
    } catch (error) {
      console.error('❌ Submission error:', error)
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        toast.error(`Failed: ${error.response.data.error || error.response.statusText}`)
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request)
        toast.error('No response from server. Is backend running?')
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message)
        toast.error('Error: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get item name by ID
  const getItemName = (id) => {
    const item = finishedGoods.find(f => f.id === id) || rawMaterials.find(r => r.id === id)
    return item ? item.name : 'Unknown'
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <BeakerIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">New Production Entry</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BeakerIcon className="h-5 w-5 text-pink-400" />
                Production Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Production Date *</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                    <input
                      type="date"
                      value={formData.production_date}
                      onChange={(e) => setFormData({...formData, production_date: e.target.value})}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Shift *</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({...formData, shift: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Finished Good *</label>
                  <select
                    value={formData.finished_good_id}
                    onChange={(e) => {
                      const id = e.target.value
                      console.log('🔵 Selected finished good ID:', id)
                      setFormData({...formData, finished_good_id: id})
                    }}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="">Select Finished Good</option>
                    {finishedGoods.length === 0 ? (
                      <option value="" disabled>No finished goods available</option>
                    ) : (
                      finishedGoods.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (ID: {item.id}) - Stock: {item.current_stock || 0} {item.unit || 'PCS'}
                        </option>
                      ))
                    )}
                  </select>
                  {formData.finished_good_id && (
                    <p className="text-green-400 text-xs mt-1">
                      Selected: {getItemName(parseInt(formData.finished_good_id))} (ID: {formData.finished_good_id})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Quantity Produced *</label>
                  <input
                    type="number"
                    value={formData.quantity_produced}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData({
                        ...formData, 
                        quantity_produced: val,
                        good_quantity: val // Auto-set good quantity
                      })
                    }}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Batch No</label>
                  <input
                    type="text"
                    value={formData.batch_no}
                    onChange={(e) => setFormData({...formData, batch_no: e.target.value})}
                    placeholder="e.g., B240301-01"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Machine No</label>
                  <input
                    type="text"
                    value={formData.machine_no}
                    onChange={(e) => setFormData({...formData, machine_no: e.target.value})}
                    placeholder="e.g., MACH-01"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Quality Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Quality Control</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Good Quantity</label>
                  <input
                    type="number"
                    value={formData.good_quantity}
                    onChange={(e) => setFormData({...formData, good_quantity: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Rejected Quantity</label>
                  <input
                    type="number"
                    value={formData.rejected_quantity}
                    onChange={(e) => setFormData({...formData, rejected_quantity: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    value={formData.rejection_reason}
                    onChange={(e) => setFormData({...formData, rejection_reason: e.target.value})}
                    placeholder="If any"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Raw Materials Consumed */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <BeakerIcon className="h-5 w-5 text-pink-400" />
                  Raw Materials Consumed
                </h2>
                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="flex items-center gap-1 px-3 py-1 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400 text-sm hover:bg-pink-500/30"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Material
                </button>
              </div>

              <div className="space-y-3">
                {materialRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className="block text-white/60 text-xs mb-1">Material</label>
                      <select
                        value={row.raw_material_id}
                        onChange={(e) => {
                          const val = e.target.value
                          const selectedMaterial = rawMaterials.find(m => m.id === parseInt(val))
                          const defaultRate = selectedMaterial ? selectedMaterial.purchase_rate || '' : ''
                          
                          const updatedRows = [...materialRows]
                          updatedRows[index]['raw_material_id'] = val
                          updatedRows[index]['rate'] = defaultRate
                          setMaterialRows(updatedRows)
                        }}
                        className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        style={{ backgroundColor: '#1f2937' }}
                      >
                        <option value="">Select Material</option>
                        {rawMaterials.length === 0 ? (
                          <option value="" disabled>No raw materials available</option>
                        ) : (
                          rawMaterials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} (ID: {m.id}) - Stock: {m.current_stock || 0} {m.unit || 'KG'}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => handleBlendScrap(index)}
                        className="w-full p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center"
                        title="Blend Recycled Scrap"
                        style={{ height: '38px' }}
                      >
                        ♻️
                      </button>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="block text-white/60 text-xs mb-1">Quantity</label>
                      <input
                        type="number"
                        value={row.quantity_used}
                        onChange={(e) => updateMaterialRow(index, 'quantity_used', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-white/60 text-xs mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(e) => updateMaterialRow(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="Auto"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-white/60 text-xs mb-1">Batch No</label>
                      <input
                        type="text"
                        value={row.batch_no}
                        onChange={(e) => updateMaterialRow(index, 'batch_no', e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeMaterialRow(index)}
                        className="p-2 bg-red-500/20 border border-red-500/30  rounded-lg text-red-400 hover:bg-red-500/30"
                        disabled={materialRows.length === 1}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Tracking */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Time Tracking</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Operator Name</label>
                  <input
                    type="text"
                    value={formData.operator_name}
                    onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    value={formData.supervisor_name}
                    onChange={(e) => setFormData({...formData, supervisor_name: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Cost Center Name</label>
                  <input
                    type="text"
                    value={formData.cost_center_name}
                    onChange={(e) => setFormData({...formData, cost_center_name: e.target.value})}
                    placeholder="e.g. Machine 1"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Rate per hour"
                    value={formData.overhead_hourly_rate}
                    onChange={(e) => setFormData({...formData, overhead_hourly_rate: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Manual Overhead (₹) <span className="text-white/40 text-xs">- Optional Override</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated if blank"
                    value={formData.total_overhead_cost}
                    onChange={(e) => setFormData({...formData, total_overhead_cost: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <label className="block text-white/80 text-sm mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Additional notes..."
                className="w-full px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Production Entry'
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}