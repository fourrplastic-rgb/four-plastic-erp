'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function AdvancesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [advances, setAdvances] = useState([])
  const [filteredAdvances, setFilteredAdvances] = useState([])
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [stats, setStats] = useState({
    totalAdvance: 0,
    pendingAmount: 0,
    repaidAmount: 0,
    pendingCount: 0,
    completedCount: 0,
    totalCount: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchAdvances()
  }, [])

  useEffect(() => {
    filterAdvances()
  }, [searchTerm, selectedStatus, selectedEmployee, dateRange, advances])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees')
      // Handle different response structures
      let employeeData = []
      if (response.data && response.data.employees) {
        employeeData = response.data.employees
      } else if (Array.isArray(response.data)) {
        employeeData = response.data
      }
      setEmployees(employeeData)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAdvances = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/advances')
      
      // Handle different response structures
      let advanceData = []
      if (response.data && response.data.advances) {
        advanceData = response.data.advances
      } else if (Array.isArray(response.data)) {
        advanceData = response.data
      }
      
      setAdvances(advanceData)
      
      // Calculate stats
      const totalAdvance = advanceData.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
      const repaidAmount = advanceData.reduce((sum, a) => sum + (parseFloat(a.repaid_amount) || 0), 0)
      const pendingAmount = advanceData.reduce((sum, a) => sum + (parseFloat(a.balance) || parseFloat(a.amount) || 0), 0)
      const pendingCount = advanceData.filter(a => a?.status === 'pending').length
      const completedCount = advanceData.filter(a => a?.status === 'completed').length

      setStats({
        totalAdvance,
        pendingAmount,
        repaidAmount,
        pendingCount,
        completedCount,
        totalCount: advanceData.length
      })
    } catch (error) {
      console.error('Error fetching advances:', error)
      toast.error('Failed to fetch advances')
    } finally {
      setLoading(false)
    }
  }

  const filterAdvances = () => {
    let filtered = [...advances]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        (a.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.employee_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(a => a?.status === selectedStatus)
    }

    // FIXED: Employee filter - compare as strings to handle type mismatch
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(a => 
        String(a?.employee_id) === String(selectedEmployee)
      )
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(a => a?.date >= dateRange.from)
    }
    if (dateRange.to) {
      filtered = filtered.filter(a => a?.date <= dateRange.to)
    }

    setFilteredAdvances(filtered)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this advance record?')) return

    try {
      await axios.delete(`/api/advances/${id}`)
      toast.success('Advance deleted successfully')
      fetchAdvances()
    } catch (error) {
      console.error('Error deleting advance:', error)
      toast.error('Failed to delete advance')
    }
  }

  const handleRepayment = async (advanceId, currentBalance) => {
    const repaymentAmount = prompt('Enter repayment amount:', currentBalance)
    if (!repaymentAmount) return

    try {
      await axios.post(`/api/advances/${advanceId}/repay`, {
        amount: parseFloat(repaymentAmount)
      })
      toast.success('Repayment recorded successfully')
      fetchAdvances()
    } catch (error) {
      console.error('Error recording repayment:', error)
      toast.error('Failed to record repayment')
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
          <ClockIcon className="h-3 w-3" /> Pending
        </span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" /> Completed
        </span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" /> Cancelled
        </span>
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (num) => {
    if (!num && num !== 0) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('all')
    setSelectedEmployee('all')
    setDateRange({ from: '', to: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading advances...</p>
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
                <button
                  onClick={() => router.push('/payroll')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <CurrencyRupeeIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Advance Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAdvances}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  href="/payroll/advances/new"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Advance
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Advance</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalAdvance)}</p>
              <p className="text-white/50 text-xs mt-1">{stats.totalCount} transactions</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Pending Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-yellow-400 text-xs mt-1">{stats.pendingCount} pending</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Repaid Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.repaidAmount)}</p>
              <p className="text-green-400 text-xs mt-1">{stats.completedCount} completed</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Recovery Rate</p>
              <p className="text-white text-2xl font-bold">
                {stats.totalAdvance > 0 ? ((stats.repaidAmount / stats.totalAdvance) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by employee, purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  placeholder="From Date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>

              {/* Date To */}
              <div>
                <input
                  type="date"
                  placeholder="To Date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Employee Filter */}
              <div className="md:col-span-1">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedStatus !== 'all' || selectedEmployee !== 'all' || dateRange.from || dateRange.to) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {filteredAdvances.length} of {advances.length} advance records
          </div>

          {/* Advances Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Date</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Purpose</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Amount</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Repaid</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Balance</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAdvances.length > 0 ? (
                    filteredAdvances.map((advance) => (
                      <tr key={advance.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white text-sm">
                          {formatDate(advance.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-400 text-sm font-semibold">
                                {advance.employee_name?.charAt(0) || 
                                 advance.first_name?.charAt(0) || 
                                 advance.employee_code?.charAt(0) || 'E'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">
                                {advance.employee_name || 
                                 (advance.first_name && advance.last_name ? 
                                  `${advance.first_name} ${advance.last_name}` : 
                                  advance.employee_code || `Employee #${advance.employee_id}`)}
                              </p>
                              <p className="text-white/50 text-xs">{advance.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {advance.purpose || '-'}
                        </td>
                        <td className="px-4 py-3 text-white text-right font-semibold">
                          {formatCurrency(advance.amount)}
                        </td>
                        <td className="px-4 py-3 text-green-400 text-right">
                          {formatCurrency(advance.repaid_amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-yellow-400 text-right font-semibold">
                          {formatCurrency(advance.balance || advance.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(advance.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {advance.status === 'pending' && (
                              <button
                                onClick={() => handleRepayment(advance.id, advance.balance || advance.amount)}
                                className="p-1.5 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                                title="Record Repayment"
                              >
                                <BanknotesIcon className="h-4 w-4" />
                              </button>
                            )}
                            <Link
                              href={`/payroll/advances/${advance.id}`}
                              className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/payroll/advances/${advance.id}/edit`}
                              className="p-1.5 bg-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/30"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(advance.id)}
                              className="p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-white/50">
                        <CurrencyRupeeIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No advance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}