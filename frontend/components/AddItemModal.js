import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function AddItemModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    type: 'finished_good',
    name: '',
    code: '',
    hsn_code: '',
    unit: 'kg',
    opening_stock: 0,
    rate: 0,
    min_stock_level: 0,
    gst_rate: 18
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post('/api/items', {
        ...formData,
        opening_stock: parseFloat(formData.opening_stock) || 0,
        rate: parseFloat(formData.rate) || 0,
        min_stock_level: parseFloat(formData.min_stock_level) || 0,
        gst_rate: parseFloat(formData.gst_rate) || 18
      })
      toast.success('Item created successfully')
      onAdd(response.data)
      onClose()
    } catch (error) {
      toast.error('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">Add New Item</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Item Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="finished_good">Finished Good</option>
                  <option value="raw_material">Raw Material</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Item Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">HSN Code</label>
                <input
                  type="text"
                  value={formData.hsn_code}
                  onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Unit of Measure *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="ltr">Liters (ltr)</option>
                  <option value="nos">Numbers (nos)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Base Price / Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Default GST Rate (%)</label>
                <select
                  value={formData.gst_rate}
                  onChange={(e) => setFormData({...formData, gst_rate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                >
                  <option value="0">0%</option>
                  <option value="3">3%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Opening Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_stock}
                  onChange={(e) => setFormData({...formData, opening_stock: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
