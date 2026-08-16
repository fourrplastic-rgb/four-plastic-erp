'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    unit: 'KG',
    hsn_code: '',
    gst_rate: 18,
    purchase_rate: 0,
    opening_stock: 0,
    min_stock: 0,
    max_stock: 0,
    location: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchMaterials()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/raw-materials')
      setMaterials(response.data)
    } catch (error) {
      toast.error('Failed to fetch raw materials')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      console.log('Submitting raw material data:', formData)
      
      if (editingMaterial) {
        // Update
        const response = await axios.put(`/api/raw-materials/${editingMaterial.id}`, formData)
        console.log('Update response:', response.data)
        toast.success('Raw material updated successfully')
      } else {
        // Create
        const response = await axios.post('/api/raw-materials', formData)
        console.log('Create response:', response.data)
        toast.success('Raw material added successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchMaterials()
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Operation failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name || '',
      unit: material.unit || 'KG',
      hsn_code: material.hsn_code || '',
      gst_rate: material.gst_rate || 18,
      purchase_rate: material.purchase_rate || 0,
      opening_stock: material.opening_stock || 0,
      min_stock: material.min_stock || 0,
      max_stock: material.max_stock || 0,
      location: material.location || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this raw material?')) {
      try {
        await axios.delete(`/api/raw-materials/${id}`)
        toast.success('Raw material deleted successfully')
        fetchMaterials()
      } catch (error) {
        toast.error('Delete failed')
      }
    }
  }

  const resetForm = () => {
    setEditingMaterial(null)
    setFormData({
      name: '',
      unit: 'KG',
      hsn_code: '',
      gst_rate: 18,
      purchase_rate: 0,
      opening_stock: 0,
      min_stock: 0,
      max_stock: 0,
      location: ''
    })
  }

  const filteredMaterials = materials.filter(material =>
    material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.hsn_code?.includes(searchTerm) ||
    material.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStockStatus = (current, min) => {
    if (current <= 0) return 'text-red-400'
    if (current <= min) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CubeIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  RAW MATERIAL MASTER
                </h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 transition-all duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search materials by name, code, HSN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            {/* Add Button */}
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Raw Material
            </button>
          </div>

          {/* Materials Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Material Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">HSN Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{material.code}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{material.name}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{material.unit}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{material.hsn_code}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{material.gst_rate}%</td>
                      <td className="px-6 py-4 text-sm text-green-400">{formatCurrency(material.purchase_rate)}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${getStockStatus(material.current_stock, material.min_stock)}`}>
                        {material.current_stock} {material.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">{material.location}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                          title="Edit Material"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Material"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {filteredMaterials.length === 0 && (
              <div className="text-center py-16">
                <CubeIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">No raw materials found</p>
                <p className="text-white/30 text-sm mt-2">Click "Add Raw Material" to create your first material</p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          {materials.length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Materials:</span>
                <span className="text-white font-semibold">{materials.length}</span>
                <span className="text-white/70">Total Stock Value:</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(materials.reduce((sum, m) => sum + (m.current_stock * m.purchase_rate), 0))}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Raw Material Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <CubeIcon className="h-6 w-6 text-pink-400" />
              <h2 className="text-xl font-semibold text-white">
                {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material Name */}
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Material Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Plastic Granules - HDPE"
                  />
                </div>
                
                {/* Unit */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="KG">Kilogram (KG)</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="MTR">Meter (MTR)</option>
                    <option value="LTR">Liter (LTR)</option>
                    <option value="BOX">Box</option>
                  </select>
                </div>
                
                {/* HSN Code */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">HSN Code</label>
                  <input
                    type="text"
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., 39269099"
                  />
                </div>
                
                {/* GST Rate */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">GST Rate (%)</label>
                  <select
                    name="gst_rate"
                    value={formData.gst_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                
                {/* Purchase Rate */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">Purchase Rate (₹)</label>
                  <input
                    type="number"
                    name="purchase_rate"
                    value={formData.purchase_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </div>
                
                {/* Opening Stock */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">Opening Stock</label>
                  <input
                    type="number"
                    name="opening_stock"
                    value={formData.opening_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </div>
                
                {/* Min Stock */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </div>
                
                {/* Max Stock */}
                <div>
                  <label className="block text-white/80 text-sm mb-1">Max Stock Level</label>
                  <input
                    type="number"
                    name="max_stock"
                    value={formData.max_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </div>
                
                {/* Location */}
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Storage Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Warehouse A, Rack 1"
                  />
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  {editingMaterial ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}