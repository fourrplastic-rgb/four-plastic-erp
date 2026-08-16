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
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function ViewAdvance() {
  const router = useRouter()
  const params = useParams()
  const advanceId = params.id

  const [loading, setLoading] = useState(true)
  const [advance, setAdvance] = useState(null)
  const [repayments, setRepayments] = useState([])

  useEffect(() => {
    checkAuth()
    fetchAdvanceData()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchAdvanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch advance details
      const advanceRes = await axios.get(`/api/advances/${advanceId}`)
      setAdvance(advanceRes.data.advance || advanceRes.data)
      
      // Fetch repayment history if available
      try {
        const repaymentsRes = await axios.get(`/api/advances/${advanceId}/repayments`)
        setRepayments(repaymentsRes.data.repayments || [])
      } catch (error) {
        console.error('Error fetching repayments:', error)
        setRepayments([])
      }
      
    } catch (error) {
      console.error('Error fetching advance:', error)
      toast.error('Failed to fetch advance data')
      router.push('/payroll/advances')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this advance record?')) return

    try {
      await axios.delete(`/api/advances/${advanceId}`)
      toast.success('Advance deleted successfully')
      router.push('/payroll/advances')
    } catch (error) {
      console.error('Error deleting advance:', error)
      toast.error(error.response?.data?.message || 'Failed to delete advance')
    }
  }

  const handleRepayment = async () => {
    const amount = prompt('Enter repayment amount:', advance?.balance)
    if (!amount) return

    try {
      await axios.post(`/api/advances/${advanceId}/repay`, {
        amount: parseFloat(amount)
      })
      toast.success('Repayment recorded successfully')
      fetchAdvanceData()
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
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-1">
          <ClockIcon className="h-4 w-4" /> Pending
        </span>
      case 'completed':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4" /> Completed
        </span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1">
          <XCircleIcon className="h-4 w-4" /> Cancelled
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
          <p className="text-white/70 mt-4">Loading advance details...</p>
        </div>
      </div>
    )
  }

  if (!advance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Advance Not Found</h3>
          <Link
            href="/payroll/advances"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Advances
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
                  href="/payroll/advances"
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <CurrencyRupeeIcon className="h-8 w-8 text-pink-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Advance Details</h1>
                  <p className="text-white/50 text-sm">{advance.advance_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(advance.status)}
                {advance.status === 'pending' && (
                  <button
                    onClick={handleRepayment}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30  text-green-400 rounded-lg hover:bg-green-500/30"
                  >
                    <BanknotesIcon className="h-5 w-5" />
                    Record Repayment
                  </button>
                )}
                <Link
                  href={`/payroll/advances/${advanceId}/edit`}
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Amount</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(advance.amount)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Repaid</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(advance.repaid_amount || 0)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Balance</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(advance.balance || advance.amount)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Date</p>
              <p className="text-white text-2xl font-bold">{formatDate(advance.date)}</p>
            </div>
          </div>

          {/* Advance Details */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-pink-400" />
              Advance Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-white/50 text-sm">Employee</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-pink-400" />
                  {advance.employee_name || `Employee #${advance.employee_id}`}
                </p>
                <p className="text-white/50 text-xs mt-1">{advance.employee_code}</p>
              </div>
              
              <div>
                <p className="text-white/50 text-sm">Purpose</p>
                <p className="text-white">{advance.purpose || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-white/50 text-sm">Repayment Mode</p>
                <p className="text-white capitalize">{advance.repayment_mode || 'Monthly'}</p>
              </div>
              
              <div>
                <p className="text-white/50 text-sm">Installments</p>
                <p className="text-white">{advance.repayment_installments || 1}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-white/50 text-sm">Notes</p>
                <p className="text-white bg-white/5 p-3 rounded-lg">{advance.notes || 'No notes'}</p>
              </div>
            </div>
          </div>

          {/* Repayment History */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-pink-400" />
              Repayment History
            </h2>

            {repayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Date</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Amount</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Payment Mode</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Reference</th>
                      <th className="px-4 py-2 text-left text-white/60 text-sm">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {repayments.map((repayment) => (
                      <tr key={repayment.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-white">{formatDate(repayment.repayment_date)}</td>
                        <td className="px-4 py-2 text-green-400 font-semibold">{formatCurrency(repayment.amount)}</td>
                        <td className="px-4 py-2 text-white/70 capitalize">{repayment.payment_mode || 'Cash'}</td>
                        <td className="px-4 py-2 text-white/70">{repayment.reference_no || '-'}</td>
                        <td className="px-4 py-2 text-white/70">{repayment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                <p className="text-white/50">No repayment records found</p>
                {advance.status === 'pending' && (
                  <button
                    onClick={handleRepayment}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20  border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                    Record First Repayment
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}