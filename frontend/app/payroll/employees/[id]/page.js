'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  MapPinIcon,
  BriefcaseIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function ViewEmployee() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id

  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)
  const [advances, setAdvances] = useState([])
  const [attendance, setAttendance] = useState([])
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    checkAuth()
    fetchEmployeeData()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      
      // Fetch employee details
      const employeeRes = await axios.get(`/api/employees/${employeeId}`)
      setEmployee(employeeRes.data.employee || employeeRes.data)
      
      // Fetch employee advances
      try {
        const advancesRes = await axios.get(`/api/advances/employee/${employeeId}`)
        const advancesData = advancesRes.data.advances || advancesRes.data || []
        setAdvances(Array.isArray(advancesData) ? advancesData : [])
      } catch (error) {
        console.error('Error fetching advances:', error)
        setAdvances([])
      }
      
      // Fetch recent attendance
      try {
        const attendanceRes = await axios.get(`/api/attendance/employee/${employeeId}/recent`)
        const attendanceData = attendanceRes.data.attendance || attendanceRes.data || []
        setAttendance(Array.isArray(attendanceData) ? attendanceData : [])
      } catch (error) {
        console.error('Error fetching attendance:', error)
        setAttendance([])
      }
      
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast.error('Failed to fetch employee data')
      router.push('/payroll/employees')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return

    try {
      await axios.delete(`/api/employees/${employeeId}`)
      toast.success('Employee deleted successfully')
      router.push('/payroll/employees')
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error(error.response?.data?.message || 'Failed to delete employee')
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4" /> Active
        </span>
      case 'inactive':
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm flex items-center gap-1">
          <XCircleIcon className="h-4 w-4" /> Inactive
        </span>
      case 'onleave':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" /> On Leave
        </span>
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading employee details...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Employee Not Found</h3>
          <Link
            href="/payroll/employees"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Employees
          </Link>
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
                <Link
                  href="/payroll/employees"
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-pink-400 text-xl font-bold">
                      {employee.first_name?.[0]}{employee.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {employee.first_name} {employee.last_name}
                    </h1>
                    <p className="text-white/50 text-sm">{employee.employee_code}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(employee.status)}
                <Link
                  href={`/payroll/employees/${employeeId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30  text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                >
                  <PencilIcon className="h-5 w-5" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30  text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  <TrashIcon className="h-5 w-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Monthly Salary</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(employee.basic_salary)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Advances</p>
              <p className="text-white text-2xl font-bold">
                {formatCurrency(advances.reduce((sum, a) => sum + (a.amount || 0), 0))}
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Present Days (This Month)</p>
              <p className="text-white text-2xl font-bold">
                {attendance.filter(a => a.status === 'present').length}
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Join Date</p>
              <p className="text-white text-2xl font-bold">{formatDate(employee.join_date)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 mb-6">
            <nav className="flex gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('personal')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === 'personal'
                    ? 'text-pink-400 border-b-2 border-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('employment')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === 'employment'
                    ? 'text-pink-400 border-b-2 border-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Employment Details
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === 'salary'
                    ? 'text-pink-400 border-b-2 border-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Salary & Bank
              </button>
              <button
                onClick={() => setActiveTab('advances')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === 'advances'
                    ? 'text-pink-400 border-b-2 border-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Advances
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === 'attendance'
                    ? 'text-pink-400 border-b-2 border-pink-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Attendance
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div>
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-pink-400" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/50 text-sm">Full Name</p>
                    <p className="text-white font-medium">{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Employee Code</p>
                    <p className="text-white font-mono">{employee.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Email</p>
                    <p className="text-white flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-pink-400" />
                      {employee.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Phone</p>
                    <p className="text-white flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-pink-400" />
                      {employee.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Details Tab */}
            {activeTab === 'employment' && (
              <div>
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-pink-400" />
                  Employment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/50 text-sm">Department</p>
                    <p className="text-white font-medium">{employee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Designation</p>
                    <p className="text-white font-medium">{employee.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Join Date</p>
                    <p className="text-white">{formatDate(employee.join_date)}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Status</p>
                    <p className="text-white">{getStatusBadge(employee.status)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Salary & Bank Tab */}
            {activeTab === 'salary' && (
              <div>
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <BanknotesIcon className="h-5 w-5 text-pink-400" />
                  Salary Structure
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/70">Basic Salary</span>
                        <span className="text-white font-semibold">{formatCurrency(employee.basic_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">HRA</span>
                        <span className="text-white">{formatCurrency(employee.hra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Conveyance</span>
                        <span className="text-white">{formatCurrency(employee.conveyance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Medical Allowance</span>
                        <span className="text-white">{formatCurrency(employee.medical)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Special Allowance</span>
                        <span className="text-white">{formatCurrency(employee.special_allowance)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-white">Total Monthly</span>
                          <span className="text-pink-400">
                            {formatCurrency(
                              (parseFloat(employee.basic_salary) || 0) +
                              (parseFloat(employee.hra) || 0) +
                              (parseFloat(employee.conveyance) || 0) +
                              (parseFloat(employee.medical) || 0) +
                              (parseFloat(employee.special_allowance) || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">Bank Details</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-white/50 text-sm">Bank Name</p>
                        <p className="text-white">{employee.bank_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Account Number</p>
                        <p className="text-white font-mono">{employee.bank_account || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">IFSC Code</p>
                        <p className="text-white">{employee.ifsc_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advances Tab */}
            {activeTab === 'advances' && (
              <div>
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <CurrencyRupeeIcon className="h-5 w-5 text-pink-400" />
                  Advance History
                </h2>

                {advances.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Date</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Amount</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Purpose</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Repaid</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Balance</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {advances.map((advance) => (
                          <tr key={advance.id} className="hover:bg-white/5">
                            <td className="px-4 py-2 text-white">{formatDate(advance.date)}</td>
                            <td className="px-4 py-2 text-white font-semibold">{formatCurrency(advance.amount)}</td>
                            <td className="px-4 py-2 text-white/70">{advance.purpose || '-'}</td>
                            <td className="px-4 py-2 text-white">{formatCurrency(advance.repaid_amount || 0)}</td>
                            <td className="px-4 py-2 text-yellow-400">{formatCurrency(advance.balance || advance.amount)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                advance.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                advance.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {advance.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CurrencyRupeeIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                    <p className="text-white/50">No advance records found</p>
                  </div>
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div>
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-pink-400" />
                  Recent Attendance
                </h2>

                {attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Date</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Check In</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Check Out</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Hours</th>
                          <th className="px-4 py-2 text-left text-white/60 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {attendance.map((record) => (
                          <tr key={record.id} className="hover:bg-white/5">
                            <td className="px-4 py-2 text-white">{formatDate(record.date)}</td>
                            <td className="px-4 py-2 text-white/70">{record.check_in || '-'}</td>
                            <td className="px-4 py-2 text-white/70">{record.check_out || '-'}</td>
                            <td className="px-4 py-2 text-white">{record.hours || '-'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'present' ? 'bg-green-500/20 text-green-400' :
                                record.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                                record.status === 'late' ? 'bg-yellow-500/20 text-yellow-400' :
                                record.status === 'halfday' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                    <p className="text-white/50">No attendance records found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}