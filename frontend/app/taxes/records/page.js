'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { DocumentChartBarIcon, PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import AddTaxRecordModal from '@/components/AddTaxRecordModal'

export default function TaxRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [activeCategory, setActiveCategory] = useState('All') // 'All', 'GST', 'Income Tax', 'TDS'
  const [activeStatus, setActiveStatus] = useState('All') // 'All', 'pending', 'paid', 'filed'
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  useEffect(() => {
    checkAuth()
    fetchRecords()
  }, [activeCategory, activeStatus])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const headers = { 'Company-Id': localStorage.getItem('companyId') || 1 }
      let url = '/api/tax-records?'
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`
      if (activeStatus !== 'All') url += `status=${encodeURIComponent(activeStatus)}`
        
      const res = await axios.get(url, { headers })
      setRecords(res.data)
    } catch (error) {
      toast.error('Failed to load tax records')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const headers = { 'Company-Id': localStorage.getItem('companyId') || 1 }
      await axios.delete(`/api/tax-records/${id}`, { headers })
      toast.success('Record deleted successfully')
      fetchRecords()
    } catch (error) {
      toast.error('Failed to delete record')
    }
  }

  const openAddModal = () => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  // Filter by search query
  const filteredRecords = records.filter(record => 
    (record.tax_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.challan_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate totals for currently visible records
  const totalAmount = filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
  const pendingAmount = filteredRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0)
  const paidAmount = filteredRecords.filter(r => r.status !== 'pending').reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentChartBarIcon className="h-8 w-8 text-pink-400" />
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Tax Records</h1>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg text-white transition-all font-medium"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Record
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium"
                  >
                    ← Dashboard
                  </button>
                </div>
              </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Total Tracked</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 border-l-4 border-l-yellow-400">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Pending Payment/Filing</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(pendingAmount)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 border-l-4 border-l-green-400">
               <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Paid / Filed</h3>
               <p className="text-3xl font-bold text-white font-mono">{formatCurrency(paidAmount)}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl">
            {/* Toolbar: Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-white/10 gap-4 bg-white/5">
              
              <div className="flex gap-2">
                {['All', 'GST', 'Income Tax', 'TDS'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <select 
                  value={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.value)}
                  className="bg-gray-800 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="filed">Filed</option>
                </select>

                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search challan, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-0">
               {loading ? (
                 <div className="flex items-center justify-center h-64 text-white">Loading records...</div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/20 text-white/60 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Type / Desc</th>
                          <th className="py-3 px-4">Period</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Challan / PRN</th>
                          <th className="py-3 px-4">Payment Date</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredRecords.length === 0 ? (
                          <tr><td colSpan="8" className="py-8 text-center text-white/50">No tax records found</td></tr>
                        ) : filteredRecords.map((r, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-white font-medium">
                              <span className={`px-2 py-1 rounded text-xs ${r.tax_category === 'GST' ? 'bg-blue-500/20 text-blue-300' : r.tax_category === 'TDS' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
                                {r.tax_category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white/90">{r.tax_type || '-'}</td>
                            <td className="py-3 px-4 text-white/70 text-sm">
                              {r.period_start ? `${formatDate(r.period_start)} to ${formatDate(r.period_end)}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right text-white font-mono font-bold">{formatCurrency(r.amount)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${
                                r.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                r.status === 'filed' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-pink-400 font-mono text-sm">{r.challan_no || '-'}</td>
                            <td className="py-3 px-4 text-white/70 text-sm">{formatDate(r.payment_date)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-3">
                                <button onClick={() => openEditModal(r)} className="text-white/50 hover:text-white transition-colors">
                                  <PencilSquareIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleDelete(r.id)} className="text-white/50 hover:text-red-400 transition-colors">
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          </div>
        </main>
      </div>

      <AddTaxRecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={fetchRecords}
        editingRecord={editingRecord}
      />
    </div>
  )
}
