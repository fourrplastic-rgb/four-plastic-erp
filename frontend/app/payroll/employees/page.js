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
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function EmployeeList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [departments, setDepartments] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onLeave: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [searchTerm, selectedDepartment, selectedStatus, employees])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/employees')
      const employeeData = response.data.employees || response.data || []
      setEmployees(employeeData)
      setFilteredEmployees(employeeData)
      
      // Extract unique departments
      const depts = [...new Set(employeeData.map(e => e.department).filter(Boolean))]
      setDepartments(depts)

      // Calculate stats
      setStats({
        total: employeeData.length,
        active: employeeData.filter(e => e.status === 'active').length,
        inactive: employeeData.filter(e => e.status === 'inactive').length,
        onLeave: employeeData.filter(e => e.status === 'onleave').length
      })
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = [...employees]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(e => 
        (e.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.first_name + ' ' + e.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.phone || '').includes(searchTerm) ||
        (e.department || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(e => e.department === selectedDepartment)
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(e => e.status === selectedStatus)
    }

    setFilteredEmployees(filtered)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return

    try {
      await axios.delete(`/api/employees/${id}`)
      toast.success('Employee deleted successfully')
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Failed to delete employee')
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" /> Active
        </span>
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" /> Inactive
        </span>
      case 'onleave':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> On Leave
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
    if (!num) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading employees...</p>
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
                <UserIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Employee Master</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchEmployees}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  href="/payroll/employees/new"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Employee
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Employees</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Active</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Inactive</p>
              <p className="text-white text-2xl font-bold">{stats.inactive}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">On Leave</p>
              <p className="text-white text-2xl font-bold">{stats.onLeave}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by name, code, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="onleave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedDepartment !== 'all' || selectedStatus !== 'all') && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDepartment('all')
                    setSelectedStatus('all')
                  }}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>

          {/* Employee Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee Code</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Name</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Department</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Designation</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Contact</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Salary</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Join Date</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white font-mono text-sm">
                          {employee.employee_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-400 text-sm font-semibold">
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {employee.first_name} {employee.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">{employee.department || '-'}</td>
                        <td className="px-4 py-3 text-white/70 text-sm">{employee.designation || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-white/70 flex items-center gap-1">
                              <EnvelopeIcon className="h-3 w-3" /> {employee.email || '-'}
                            </p>
                            <p className="text-white/70 flex items-center gap-1 mt-1">
                              <PhoneIcon className="h-3 w-3" /> {employee.phone || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white text-right font-semibold">
                          {formatCurrency(employee.basic_salary)}
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {formatDate(employee.join_date)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(employee.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/payroll/employees/${employee.id}`}
                              className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/payroll/employees/${employee.id}/edit`}
                              className="p-1.5 bg-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/30"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(employee.id)}
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
                      <td colSpan="9" className="px-4 py-8 text-center text-white/50">
                        <UserIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No employees found
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