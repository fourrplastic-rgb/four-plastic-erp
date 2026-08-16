'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
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
    credit_limit: 0,
    credit_days: 30,
    opening_balance: 0
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      setCustomers(response.data)
    } catch (error) {
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  // Handle number inputs properly
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
      // Ensure numbers are sent as numbers
      const payload = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        credit_days: parseInt(formData.credit_days) || 30,
        opening_balance: parseFloat(formData.opening_balance) || 0
      }
      
      console.log('Submitting payload:', payload)
      
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, payload)
        toast.success('Customer updated successfully')
      } else {
        await axios.post('/api/customers', payload)
        toast.success('Customer added successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Operation failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gst: customer.gst || '',
      pan: customer.pan || '',
      contact_person: customer.contact_person || '',
      credit_limit: customer.credit_limit || 0,
      credit_days: customer.credit_days || 30,
      opening_balance: customer.opening_balance || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/api/customers/${id}`)
        toast.success('Customer deleted successfully')
        fetchCustomers()
      } catch (error) {
        toast.error('Delete failed')
      }
    }
  }

  const resetForm = () => {
    setEditingCustomer(null)
    setFormData({
      name: '', phone: '', mobile: '', email: '', address: '',
      city: '', state: '', pincode: '', gst: '', pan: '',
      contact_person: '', credit_limit: 0, credit_days: 30, opening_balance: 0
    })
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

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
              <h1 className="text-2xl font-bold text-white">
                CUSTOMER MASTER
              </h1>
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
                placeholder="Search customers..."
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
              Add Customer
            </button>
          </div>

          {/* Customers Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">City</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Opening Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{customer.code}</td>
                      <td className="px-6 py-4 text-sm text-white">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{customer.phone || customer.mobile}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{customer.city}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{customer.gst}</td>
                      <td className="px-6 py-4 text-sm text-white">₹{(customer.opening_balance || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                          title="Edit Customer"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Customer"
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
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">No customers found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h3 className="text-white/80 text-sm font-semibold mb-2">Basic Information</h3>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Mobile</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Mobile number"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="State"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Pincode"
                  />
                </div>
                
                {/* Tax Information */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-white/80 text-sm font-semibold mb-2">Tax Information</h3>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">GST Number</label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Contact person name"
                  />
                </div>
                
                {/* Financial Information */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-white/80 text-sm font-semibold mb-2">Financial Information</h3>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleInputChange}
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Credit Days</label>
                  <input
                    type="number"
                    name="credit_days"
                    value={formData.credit_days}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="30"
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
                    step="any"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="0"
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
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}