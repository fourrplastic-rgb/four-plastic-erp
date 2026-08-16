'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

function NewAdvance() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedEmployee = searchParams.get('employee')

  const [loading, setLoading] = useState(false)
  const [fetchingEmployees, setFetchingEmployees] = useState(true)
  const [employees, setEmployees] = useState([])
  const [apiError, setApiError] = useState('')
  const [formData, setFormData] = useState({
    employee_id: preSelectedEmployee || '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    purpose: '',
    repayment_mode: 'monthly',
    repayment_installments: '1',
    remarks: '',
    status: 'pending'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    checkAuth()
    fetchEmployees()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true)
      setApiError('')
      
      console.log('Fetching employees for advance form...')
      const response = await axios.get('/api/employees')
      
      // Handle different response structures
      let employeeData = []
      if (response.data && response.data.employees) {
        employeeData = response.data.employees
      } else if (Array.isArray(response.data)) {
        employeeData = response.data
      } else if (response.data && response.data.data) {
        employeeData = response.data.data
      }
      
      // Filter active employees
      const activeEmployees = employeeData.filter(e => e?.status === 'active')
      setEmployees(activeEmployees)
      
      if (activeEmployees.length === 0) {
        setApiError('No active employees found. Please add employees first.')
      }
      
    } catch (error) {
      console.error('Error fetching employees:', error)
      setApiError('Failed to fetch employees. Please check your connection.')
      toast.error('Failed to fetch employees')
    } finally {
      setFetchingEmployees(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.employee_id) {
      newErrors.employee_id = 'Please select an employee'
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else {
      const amountNum = parseFloat(formData.amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Please enter a valid positive amount'
      } else if (amountNum > 1000000) {
        newErrors.amount = 'Amount cannot exceed ₹10,00,000'
      }
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        employee_id: parseInt(formData.employee_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose || '',
        repayment_mode: formData.repayment_mode,
        repayment_installments: parseInt(formData.repayment_installments) || 1,
        remarks: formData.remarks || ''
      }
      
      console.log('Submitting advance:', payload)
      
      const response = await axios.post('/api/advances', payload)
      console.log('Response:', response.data)
      
      toast.success('Advance recorded successfully')
      router.push('/payroll/advances')
    } catch (error) {
      console.error('Error recording advance:', error)
      const errorMessage = error.response?.data?.message || 'Failed to record advance'
      toast.error(errorMessage)
      setApiError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyInstallment = () => {
    if (!formData.amount || !formData.repayment_installments) return 0
    const amount = parseFloat(formData.amount)
    const installments = parseInt(formData.repayment_installments)
    if (isNaN(amount) || isNaN(installments) || installments <= 0) return 0
    return Math.round(amount / installments)
  }

  const getSelectedEmployeeName = () => {
    const emp = employees.find(e => e.id == formData.employee_id)
    if (!emp) return ''
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    return name ? `${name} (${emp.employee_code || `ID: ${emp.id}`})` : `Employee #${emp.id}`
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/payroll/advances"
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <CurrencyRupeeIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">New Advance</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {apiError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">Error</p>
                  <p className="text-red-400/90 text-sm mt-1">{apiError}</p>
                  <button
                    onClick={fetchEmployees}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30  text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-pink-400" />
                Employee Details
              </h2>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">
                  Select Employee <span className="text-pink-400">*</span>
                </label>
                
                {fetchingEmployees ? (
                  <div className="w-full px-3 py-4 bg-gray-800/50 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-pink-400 border-t-transparent"></div>
                      <p className="text-white/50 text-sm">Loading employees...</p>
                    </div>
                  </div>
                ) : employees.length > 0 ? (
                  <>
                    <select
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white 
                        focus:outline-none focus:ring-2 focus:ring-pink-500
                        ${errors.employee_id ? 'border-red-500' : 'border-white/20'}`}
                      style={{ backgroundColor: '#1f2937' }}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name || ''} {emp.last_name || ''} ({emp.employee_code || `ID: ${emp.id}`})
                        </option>
                      ))}
                    </select>
                    
                    {errors.employee_id && (
                      <p className="text-red-400 text-xs mt-1">{errors.employee_id}</p>
                    )}
                    
                    {formData.employee_id && !errors.employee_id && (
                      <p className="text-green-400 text-xs mt-1">
                        ✓ Selected: {getSelectedEmployeeName()}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="w-full px-3 py-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm text-center">
                      No active employees found. Please add employees first.
                    </p>
                    <div className="flex justify-center mt-3">
                      <Link
                        href="/payroll/employees/new"
                        className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30  text-yellow-400 rounded-lg hover:bg-yellow-500/30 text-sm"
                      >
                        Add Employee
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Advance Details - Only show if employees exist */}
            {employees.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <BanknotesIcon className="h-5 w-5 text-pink-400" />
                  Advance Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">
                      Date <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white 
                        focus:outline-none focus:ring-2 focus:ring-pink-500
                        ${errors.date ? 'border-red-500' : 'border-white/20'}`}
                      style={{ backgroundColor: '#1f2937' }}
                    />
                    {errors.date && (
                      <p className="text-red-400 text-xs mt-1">{errors.date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-white/70 text-sm mb-1">
                      Amount <span className="text-pink-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="any"
                        min="1"
                        placeholder="0.00"
                        className={`w-full pl-8 pr-3 py-2 bg-white/10 border rounded-lg text-white 
                          focus:outline-none focus:ring-2 focus:ring-pink-500
                          ${errors.amount ? 'border-red-500' : 'border-white/20'}`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-white/70 text-sm mb-1">Purpose</label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
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

                {/* Monthly Installment Calculation */}
                {formData.amount && formData.repayment_installments && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg border border-pink-500/30">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="h-5 w-5 text-pink-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white/70 text-sm">Monthly Installment Calculation</p>
                        <p className="text-white text-xl font-bold">
                          ₹{calculateMonthlyInstallment().toLocaleString()}
                          <span className="text-white/50 text-base ml-2">
                            per month for {formData.repayment_installments} month{parseInt(formData.repayment_installments) > 1 ? 's' : ''}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Link
                href="/payroll/advances"
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg  hover:bg-white/20 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || fetchingEmployees || employees.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CurrencyRupeeIcon className="h-5 w-5" />
                    Record Advance
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

export default function NewAdvancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-r-transparent"></div>
      </div>
    }>
      <NewAdvance />
    </Suspense>
  )
}