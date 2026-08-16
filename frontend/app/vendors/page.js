'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function VendorsPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst: '',
    pan: '',
    contact_person: '',
    opening_balance: 0
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchVendors()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/api/vendors')
      setVendors(response.data)
    } catch (error) {
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance) || 0
      }
      
      if (editingVendor) {
        await axios.put(`/api/vendors/${editingVendor.id}`, payload)
        toast.success('Vendor updated successfully')
      } else {
        await axios.post('/api/vendors', payload)
        toast.success('Vendor added successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchVendors()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Operation failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      code: vendor.code || '',
      name: vendor.name || '',
      phone: vendor.phone || '',
      mobile: vendor.mobile || '',
      email: vendor.email || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
      gst: vendor.gst || '',
      pan: vendor.pan || '',
      contact_person: vendor.contact_person || '',
      opening_balance: vendor.opening_balance || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/api/vendors/${id}`)
        toast.success('Vendor deleted successfully')
        fetchVendors()
      } catch (error) {
        toast.error('Delete failed')
      }
    }
  }

  const resetForm = () => {
    setEditingVendor(null)
    setFormData({
      code: '', name: '', phone: '', mobile: '', email: '',
      address: '', city: '', state: '', pincode: '',
      gst: '', pan: '', contact_person: '', opening_balance: 0
    })
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone?.includes(searchTerm) ||
    vendor.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  VENDOR MASTER
                </h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Vendor
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">Opening Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{vendor.code}</td>
                      <td className="px-6 py-4 text-sm text-white">{vendor.name}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{vendor.phone}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{vendor.city}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{vendor.gst}</td>
                      <td className="px-6 py-4 text-sm text-white">₹{(vendor.opening_balance || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Mobile</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">GST Number</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                    placeholder="AAAAA0000A"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    name="opening_balance"
                    value={formData.opening_balance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  {editingVendor ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}