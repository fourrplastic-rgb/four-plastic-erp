'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    adjustment_date: new Date().toISOString().split('T')[0],
    item_type: 'raw_material',
    item_id: '',
    adjustment_type: 'DEDUCTION',
    quantity: '',
    rate: '',
    reason: ''
  })

  useEffect(() => {
    fetchAdjustments()
    fetchItems()
  }, [])

  const fetchAdjustments = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/stock-adjustments/`)
      setAdjustments(res.data)
    } catch (error) {
      toast.error('Failed to fetch stock adjustments')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/items`)
      setItems(res.data)
    } catch (error) {
      toast.error('Failed to fetch items')
    }
  }

  const handleItemSelect = (e) => {
    const selectedId = e.target.value
    if (!selectedId) {
      setFormData(prev => ({ ...prev, item_id: '', rate: '' }))
      return
    }

    // items array has compound_id (e.g., RM_1 or FG_2)
    const selectedItem = items.find(i => i.compound_id === selectedId)
    if (selectedItem) {
      const type = selectedItem.item_type
      const id = selectedItem.id
      const rate = type === 'raw_material' ? selectedItem.purchase_rate : selectedItem.sales_rate
      
      setFormData(prev => ({
        ...prev,
        item_id: id,
        item_type: type,
        rate: rate || 0
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.item_id || !formData.quantity || formData.quantity <= 0) {
      toast.error('Please fill in required fields correctly')
      return
    }

    setSubmitting(true)
    try {
      await axios.post(`${API_BASE_URL}/stock-adjustments/`, formData)
      toast.success('Stock adjustment created successfully')
      setShowModal(false)
      fetchAdjustments()
      fetchItems() // refresh items stock
      setFormData({
        adjustment_date: new Date().toISOString().split('T')[0],
        item_type: 'raw_material',
        item_id: '',
        adjustment_type: 'DEDUCTION',
        quantity: '',
        rate: '',
        reason: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create adjustment')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAdjustments = adjustments.filter(adj => 
    adj.adjustment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString) => {
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
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AdjustmentsHorizontalIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Stock Adjustments</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAdjustments}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700  flex items-center gap-2 font-medium shadow-lg shadow-pink-500/20"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Adjustment
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search adjustments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">No. & Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Quantity</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-white/60">Loading adjustments...</td>
                    </tr>
                  ) : filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-white/60">No adjustments found</td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{adj.adjustment_no}</div>
                          <div className="text-white/60 text-sm">{formatDate(adj.adjustment_date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{adj.item_name}</div>
                          <div className="text-white/60 text-xs uppercase">{adj.item_type.replace('_', ' ')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            adj.adjustment_type === 'ADDITION' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {adj.adjustment_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-white">
                          {adj.quantity}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-white">{formatCurrency(adj.amount)}</div>
                          <div className="text-white/60 text-xs">@ {formatCurrency(adj.rate)}</div>
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm">
                          {adj.reason || '-'}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">New Stock Adjustment</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.adjustment_date}
                  onChange={e => setFormData(prev => ({ ...prev, adjustment_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Item</label>
                <select
                  required
                  value={formData.item_id ? `${formData.item_type === 'raw_material' ? 'RM' : 'FG'}_${formData.item_id}` : ''}
                  onChange={handleItemSelect}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="">-- Select Item --</option>
                  {items.map(item => (
                    <option key={item.compound_id} value={item.compound_id}>
                      {item.name} ({item.item_type === 'raw_material' ? 'RM' : 'FG'}) - Stock: {item.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Type</label>
                  <select
                    required
                    value={formData.adjustment_type}
                    onChange={e => setFormData(prev => ({ ...prev, adjustment_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="DEDUCTION">Deduction (Decrease)</option>
                    <option value="ADDITION">Addition (Increase)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.rate}
                    onChange={e => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Total Amount</label>
                  <div className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white/50">
                    {formatCurrency((parseFloat(formData.quantity || 0) * parseFloat(formData.rate || 0)))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Reason / Notes</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  rows="2"
                  placeholder="e.g., Wastage, Physical count difference"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
