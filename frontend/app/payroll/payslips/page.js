'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  EyeIcon,
  PrinterIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  BanknotesIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function PayslipList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payslips, setPayslips] = useState([])
  const [filteredPayslips, setFilteredPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    generated: 0,
    sent: 0,
    totalAmount: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchPayslips()
  }, [])

  useEffect(() => {
    filterPayslips()
  }, [searchTerm, selectedMonth, selectedEmployee, selectedStatus, payslips])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees')
      const employeeData = response.data.employees || response.data || []
      setEmployees(employeeData)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    }
  }

  const fetchPayslips = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/payslips')
      const payslipData = response.data.payslips || response.data || []
      setPayslips(payslipData)
      
      // Calculate stats
      const total = payslipData.length
      const generated = payslipData.filter(p => p.status === 'generated').length
      const sent = payslipData.filter(p => p.status === 'sent').length
      const totalAmount = payslipData.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0)

      setStats({ total, generated, sent, totalAmount })
    } catch (error) {
      console.error('Error fetching payslips:', error)
      toast.error('Failed to fetch payslips')
    } finally {
      setLoading(false)
    }
  }

  const filterPayslips = () => {
    let filtered = [...payslips]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply month filter
    if (selectedMonth) {
      filtered = filtered.filter(p => p.month === selectedMonth)
    }

    // Apply employee filter
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(p => p.employee_id === selectedEmployee)
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus)
    }

    setFilteredPayslips(filtered)
  }

  const handleSendEmail = async (payslipId) => {
    try {
      await axios.post(`/api/payslips/${payslipId}/send-email`)
      toast.success('Payslip sent via email')
      fetchPayslips()
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }
  }

  const handleBulkGenerate = async () => {
    if (!confirm(`Generate payslips for ${selectedMonth}?`)) return

    try {
      await axios.post('/api/payslips/bulk-generate', {
        month: selectedMonth
      })
      toast.success('Payslips generated successfully')
      fetchPayslips()
    } catch (error) {
      console.error('Error generating payslips:', error)
      toast.error('Failed to generate payslips')
    }
  }

  const handleBulkEmail = async () => {
    const unsent = filteredPayslips.filter(p => p.status !== 'sent')
    if (unsent.length === 0) {
      toast.error('No unsent payslips for this month')
      return
    }

    if (!confirm(`Send ${unsent.length} payslips via email?`)) return

    try {
      await axios.post('/api/payslips/bulk-email', {
        month: selectedMonth
      })
      toast.success('Payslips sent successfully')
      fetchPayslips()
    } catch (error) {
      console.error('Error sending emails:', error)
      toast.error('Failed to send emails')
    }
  }

  const getMonthName = (monthStr) => {
    if (!monthStr) return 'N/A'
    const [year, month] = monthStr.split('-')
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const formatCurrency = (num) => {
    if (!num) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'generated':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Generated</span>
      case 'sent':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Sent</span>
      case 'printed':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Printed</span>
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payslips...</p>
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
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Payslip Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPayslips}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleBulkGenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30  text-blue-400 rounded-lg hover:bg-blue-500/30"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  Generate All
                </button>
                <button
                  onClick={handleBulkEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  Email All
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Payslips</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Generated</p>
              <p className="text-white text-2xl font-bold">{stats.generated}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Sent via Email</p>
              <p className="text-white text-2xl font-bold">{stats.sent}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
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
                  placeholder="Search by employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Month Filter */}
              <div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>

              {/* Employee Filter */}
              <div>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
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
                  <option value="generated">Generated</option>
                  <option value="sent">Sent</option>
                  <option value="printed">Printed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {filteredPayslips.length} of {payslips.length} payslips for {getMonthName(selectedMonth)}
          </div>

          {/* Payslips Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Month</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Basic</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Allowances</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Deductions</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Net Salary</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPayslips.length > 0 ? (
                    filteredPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-400 text-sm font-semibold">
                                {payslip.employee_name?.charAt(0) || 'E'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">
                                {payslip.employee_name || 'N/A'}
                              </p>
                              <p className="text-white/50 text-xs">{payslip.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {getMonthName(payslip.month)}
                        </td>
                        <td className="px-4 py-3 text-white text-right">
                          {formatCurrency(payslip.basic_salary)}
                        </td>
                        <td className="px-4 py-3 text-green-400 text-right">
                          {formatCurrency(payslip.total_allowances)}
                        </td>
                        <td className="px-4 py-3 text-red-400 text-right">
                          {formatCurrency(payslip.total_deductions)}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {formatCurrency(payslip.net_salary)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(payslip.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/payroll/payslips/${payslip.id}`}
                              className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                              title="View Payslip"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/payroll/payslips/${payslip.id}/print`}
                              className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/30"
                              title="Print Payslip"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Link>
                            {payslip.status !== 'sent' && (
                              <button
                                onClick={() => handleSendEmail(payslip.id)}
                                className="p-1.5 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                                title="Send Email"
                              >
                                <EnvelopeIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-white/50">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No payslips found for {getMonthName(selectedMonth)}
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