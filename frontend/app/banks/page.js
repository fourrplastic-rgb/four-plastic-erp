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
  BuildingLibraryIcon
} from '@heroicons/react/24/outline'

export default function BanksPage() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    account_no: '',
    ifsc_code: '',
    branch: '',
    opening_balance: 0
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBanks()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await axios.get('/api/banks')
      setBanks(response.data)
    } catch (error) {
      toast.error('Failed to fetch banks')
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
      console.log('Submitting bank data:', formData)
      
      if (editingBank) {
        // Update
        const response = await axios.put(`/api/banks/${editingBank.id}`, formData)
        console.log('Update response:', response.data)
        toast.success('Bank updated successfully')
      } else {
        // Create
        const response = await axios.post('/api/banks', formData)
        console.log('Create response:', response.data)
        toast.success('Bank added successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchBanks()
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Operation failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (bank) => {
    setEditingBank(bank)
    setFormData({
      name: bank.name || '',
      account_no: bank.account_no || '',
      ifsc_code: bank.ifsc_code || '',
      branch: bank.branch || '',
      opening_balance: bank.opening_balance || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this bank?')) {
      try {
        await axios.delete(`/api/banks/${id}`)
        toast.success('Bank deleted successfully')
        fetchBanks()
      } catch (error) {
        toast.error('Delete failed')
      }
    }
  }

  const resetForm = () => {
    setEditingBank(null)
    setFormData({
      name: '',
      account_no: '',
      ifsc_code: '',
      branch: '',
      opening_balance: 0
    })
  }

  const filteredBanks = banks.filter(bank =>
    bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.account_no?.includes(searchTerm) ||
    bank.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
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
                <BuildingLibraryIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  BANK MASTER
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
                placeholder="Search banks by name, code, account, branch..."
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
              Add Bank
            </button>
          </div>

          {/* Banks Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Bank Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Account No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">IFSC Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredBanks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{bank.code}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{bank.name}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{bank.account_no}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{bank.ifsc_code}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{bank.branch}</td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        {formatCurrency(bank.current_balance || bank.opening_balance)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(bank)}
                          className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                          title="Edit Bank"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(bank.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Bank"
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
            {filteredBanks.length === 0 && (
              <div className="text-center py-16">
                <BuildingLibraryIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">No banks found</p>
                <p className="text-white/30 text-sm mt-2">Click "Add Bank" to create your first bank account</p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          {banks.length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Banks:</span>
                <span className="text-white font-semibold">{banks.length}</span>
                <span className="text-white/70">Total Balance:</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(banks.reduce((sum, bank) => sum + (bank.current_balance || bank.opening_balance || 0), 0))}
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bank Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <BuildingLibraryIcon className="h-6 w-6 text-pink-400" />
              <h2 className="text-xl font-semibold text-white">
                {editingBank ? 'Edit Bank' : 'Add New Bank'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bank Name */}
              <div>
                <label className="block text-white/80 text-sm mb-1">Bank Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., HDFC Bank"
                />
              </div>
              
              {/* Account Number */}
              <div>
                <label className="block text-white/80 text-sm mb-1">Account Number *</label>
                <input
                  type="text"
                  name="account_no"
                  value={formData.account_no}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter account number"
                />
              </div>
              
              {/* IFSC Code */}
              <div>
                <label className="block text-white/80 text-sm mb-1">IFSC Code *</label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., HDFC0001234"
                />
              </div>
              
              {/* Branch */}
              <div>
                <label className="block text-white/80 text-sm mb-1">Branch</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Mumbai Main"
                />
              </div>
              
              {/* Opening Balance - FIXED: Removed step validation */}
              <div>
                <label className="block text-white/80 text-sm mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  name="opening_balance"
                  value={formData.opening_balance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="0"
                  min="0"
                  step="any"  // Changed to "any" to allow decimal values
                />
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
                  {editingBank ? 'Update Bank' : 'Save Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}