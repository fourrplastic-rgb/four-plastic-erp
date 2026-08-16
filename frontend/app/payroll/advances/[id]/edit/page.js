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
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

export default function EditAdvance() {
  const router = useRouter()
  const params = useParams()
  const advanceId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    amount: '',
    purpose: '',
    repayment_mode: 'monthly',
    repayment_installments: '1',
    remarks: '',
    status: 'pending'
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchAdvance()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees')
      let employeeData = []
      if (response.data && response.data.employees) {
        employeeData = response.data.employees
      } else if (Array.isArray(response.data)) {
        employeeData = response.data
      }
      setEmployees(employeeData.filter(e => e?.status === 'active'))
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAdvance = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/advances/${advanceId}`)
      const advance = response.data.advance || response.data
      
      setFormData({
        employee_id: advance.employee_id || '',
        date: advance.date ? advance.date.split('T')[0] : '',
        amount: advance.amount || '',
        purpose: advance.purpose || '',
        repayment_mode: advance.repayment_mode || 'monthly',
        repayment_installments: advance.repayment_installments || '1',
        remarks: advance.notes || '',
        status: advance.status || 'pending'
      })
    } catch (error) {
      console.error('Error fetching advance:', error)
      toast.error('Failed to fetch advance data')
      router.push('/payroll/advances')
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

    if (!formData.employee_id) {
      toast.error('Please select an employee')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid amount')
      return
    }

    try {
      setSaving(true)
      await axios.put(`/api/advances/${advanceId}`, {
        ...formData,
        amount: parseFloat(formData.amount)
      })
      toast.success('Advance updated successfully')
      router.push(`/payroll/advances/${advanceId}`)
    } catch (error) {
      console.error('Error updating advance:', error)
      toast.error(error.response?.data?.message || 'Failed to update advance')
    } finally {
      setSaving(false)
    }
  }

  const calculateMonthlyInstallment = () => {
    if (!formData.amount || !formData.repayment_installments) return 0
    const amount = parseFloat(formData.amount)
    const installments = parseInt(formData.repayment_installments)
    if (isNaN(amount) || isNaN(installments) || installments <= 0) return 0
    return Math.round(amount / installments)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading advance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/payroll/advances/${advanceId}`}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <CurrencyRupeeIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">Edit Advance</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-pink-400" />
                Employee Details
              </h2>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Employee</label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                  style={{ backgroundColor: '#1f2937' }}
                  disabled
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
                <p className="text-white/50 text-xs mt-1">Employee cannot be changed</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-pink-400" />
                Advance Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="any"
                      min="1"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Purpose</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., Medical, Travel, Personal"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Repayment Mode</label>
                  <select
                    name="repayment_mode"
                    value={formData.repayment_mode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="monthly">Monthly Deduction</option>
                    <option value="one-time">One Time</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Installments</label>
                  <input
                    type="number"
                    name="repayment_installments"
                    value={formData.repayment_installments}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              {formData.amount && formData.repayment_installments && (
                <div className="mt-4 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg">
                  <p className="text-white/70 text-sm">Monthly Installment</p>
                  <p className="text-white text-xl font-bold">
                    ₹{calculateMonthlyInstallment().toLocaleString()}
                    <span className="text-white/50 text-base ml-2">
                      per month for {formData.repayment_installments} months
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={`/payroll/advances/${advanceId}`}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="h-5 w-5" />
                    Update Advance
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}