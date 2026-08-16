'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function LedgersPage() {
  const [ledgers, setLedgers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    group_id: '',
    balance_type: 'DR'
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    try {
      const [ledgersRes, groupsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/accounting/ledgers`),
        axios.get(`${API_BASE_URL}/accounting/groups`)
      ])
      setLedgers(ledgersRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
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
    
    if(!formData.group_id) {
       toast.error('Please select a Ledger Group');
       return;
    }

    try {
      await axios.post(`${API_BASE_URL}/accounting/ledgers`, formData)
      toast.success('Ledger created successfully')
      
      setShowModal(false)
      setFormData({ name: '', group_id: '', balance_type: 'DR' })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed')
    }
  }

  const filteredLedgers = ledgers.filter(ledger =>
    ledger.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ledger.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="h-8 w-8 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">CHART OF ACCOUNTS</h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
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
                placeholder="Search ledgers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Ledger
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Ledger Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Balance Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredLedgers.map((ledger) => (
                    <tr key={ledger.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{ledger.name} {ledger.is_system ? <span className="ml-2 text-xs text-indigo-300">(System)</span> : null}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{ledger.group_name}</td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ledger.group_type === 'Asset' ? 'bg-green-500/20 text-green-400' :
                          ledger.group_type === 'Liability' ? 'bg-red-500/20 text-red-400' :
                          ledger.group_type === 'Income' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {ledger.group_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                         <span className={ledger.balance_type === 'DR' ? 'text-blue-400' : 'text-purple-400'}>{ledger.balance_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLedgers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/50 text-lg">No ledgers found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Ledger</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Ledger Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Office Supplies"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Under Group *</label>
                <select
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="text-black">Select Group...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id} className="text-black">{g.name} ({g.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Default Balance Type *</label>
                <select
                  name="balance_type"
                  value={formData.balance_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DR" className="text-black">Debit (DR)</option>
                  <option value="CR" className="text-black">Credit (CR)</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
