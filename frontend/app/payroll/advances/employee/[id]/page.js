'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function EmployeeAdvanceHistory() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id

  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)
  const [advances, setAdvances] = useState([])
  const [summary, setSummary] = useState({
    totalAdvance: 0,
    repaidAmount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    completedCount: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployeeData()
    fetchAdvances()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`/api/employees/${employeeId}`)
      setEmployee(response.data.employee || response.data)
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast.error('Failed to fetch employee data')
    }
  }

  const fetchAdvances = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/advances/employee/${employeeId}`)
      const advanceData = response.data.advances || response.data || []
      setAdvances(advanceData)
      
      // Calculate summary
      const totalAdvance = advanceData.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
      const repaidAmount = advanceData.reduce((sum, a) => sum + (parseFloat(a.repaid) || 0), 0)
      const pendingAmount = advanceData.reduce((sum, a) => sum + (parseFloat(a.balance) || parseFloat(a.amount) || 0), 0)
      const pendingCount = advanceData.filter(a => a.status === 'pending').length
      const completedCount = advanceData.filter(a => a.status === 'completed').length

      setSummary({
        totalAdvance,
        repaidAmount,
        pendingAmount,
        pendingCount,
        completedCount
      })
    } catch (error) {
      console.error('Error fetching advances:', error)
      toast.error('Failed to fetch advance history')
    } finally {
      setLoading(false)
    }
  }

  const handleRepayment = async (advanceId, amount) => {
    const repaymentAmount = prompt('Enter repayment amount:', amount)
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
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Cancelled</span>
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading advance history...</p>
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
                  onClick={() => router.push('/payroll/advances')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                {employee && (
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
                )}
              </div>
              <Link
                href={`/payroll/advances/new?employee=${employeeId}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
              >
                <CurrencyRupeeIcon className="h-5 w-5" />
                New Advance
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Advance</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(summary.totalAdvance)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Repaid Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(summary.repaidAmount)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Pending Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Recovery Rate</p>
              <p className="text-white text-2xl font-bold">
                {summary.totalAdvance > 0 ? ((summary.repaidAmount / summary.totalAdvance) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Advance History Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-pink-400" />
                Advance History ({advances.length} records)
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Date</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Purpose</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Amount</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Repaid</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Balance</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {advances.length > 0 ? (
                    advances.map((advance) => (
                      <tr key={advance.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white text-sm">
                          {formatDate(advance.date)}
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {advance.purpose || '-'}
                        </td>
                        <td className="px-4 py-3 text-white text-right font-semibold">
                          {formatCurrency(advance.amount)}
                        </td>
                        <td className="px-4 py-3 text-green-400 text-right">
                          {formatCurrency(advance.repaid || 0)}
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
                              title="View Details"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-white/50">
                        <CurrencyRupeeIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No advance records found for this employee
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repayment Schedule */}
          {advances.filter(a => a.status === 'pending').length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-pink-400" />
                Upcoming Repayments
              </h2>
              
              <div className="space-y-3">
                {advances.filter(a => a.status === 'pending').map(advance => {
                  const monthlyAmount = advance.repayment_installments 
                    ? (parseFloat(advance.amount) / parseInt(advance.repayment_installments)).toFixed(0)
                    : parseFloat(advance.amount)
                  
                  return (
                    <div key={advance.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{advance.purpose || 'Advance'}</p>
                          <p className="text-white/50 text-xs">Taken on {formatDate(advance.date)}</p>
                        </div>
                        <span className="text-yellow-400 font-semibold">{formatCurrency(advance.balance || advance.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Monthly repayment: {formatCurrency(monthlyAmount)}</span>
                        <span className="text-white/70">Next due: {formatDate(new Date())}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}