'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  MapPinIcon,
  BriefcaseIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function EditEmployee() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    blood_group: '',
    department: '',
    designation: '',
    join_date: '',
    confirmation_date: '',
    exit_date: '',
    status: 'active',
    basic_salary: '',
    hra: '',
    conveyance: '',
    medical: '',
    special_allowance: '',
    pf_number: '',
    esi_number: '',
    uan_number: '',
    pan_number: '',
    aadhar_number: '',
    bank_name: '',
    bank_account: '',
    ifsc_code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: ''
  })

  useEffect(() => {
    checkAuth()
    fetchEmployee()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchEmployee = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('Fetching employee:', employeeId)
      const response = await axios.get(`/api/employees/${employeeId}`)
      console.log('Employee data:', response.data)
      
      const employee = response.data.employee || response.data
      
      setFormData({
        employee_code: employee.employee_code || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        alternate_phone: employee.alternate_phone || '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        gender: employee.gender || '',
        marital_status: employee.marital_status || '',
        blood_group: employee.blood_group || '',
        department: employee.department || '',
        designation: employee.designation || '',
        join_date: employee.join_date ? employee.join_date.split('T')[0] : '',
        confirmation_date: employee.confirmation_date ? employee.confirmation_date.split('T')[0] : '',
        exit_date: employee.exit_date ? employee.exit_date.split('T')[0] : '',
        status: employee.status || 'active',
        basic_salary: employee.basic_salary || '',
        hra: employee.hra || '',
        conveyance: employee.conveyance || '',
        medical: employee.medical || '',
        special_allowance: employee.special_allowance || '',
        pf_number: employee.pf_number || '',
        esi_number: employee.esi_number || '',
        uan_number: employee.uan_number || '',
        pan_number: employee.pan_number || '',
        aadhar_number: employee.aadhar_number || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        ifsc_code: employee.ifsc_code || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        pincode: employee.pincode || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_relation: employee.emergency_contact_relation || ''
      })
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Failed to fetch employee data')
      toast.error('Failed to fetch employee data')
      
      // Don't redirect immediately, show error message
      setTimeout(() => {
        router.push('/payroll/employees')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateTotalSalary = () => {
    const basic = parseFloat(formData.basic_salary) || 0
    const hra = parseFloat(formData.hra) || 0
    const conveyance = parseFloat(formData.conveyance) || 0
    const medical = parseFloat(formData.medical) || 0
    const special = parseFloat(formData.special_allowance) || 0
    return basic + hra + conveyance + medical + special
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.first_name?.trim()) errors.push('First name is required')
    if (!formData.last_name?.trim()) errors.push('Last name is required')
    if (!formData.email?.trim()) errors.push('Email is required')
    if (!formData.phone?.trim()) errors.push('Phone number is required')
    
    const salary = parseFloat(formData.basic_salary)
    if (!formData.basic_salary || isNaN(salary) || salary <= 0) {
      errors.push('Valid basic salary is required')
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    try {
      setSaving(true)
      setError('')
      
      console.log('Updating employee:', employeeId, formData)
      
      const response = await axios.put(`/api/employees/${employeeId}`, formData)
      console.log('Update response:', response.data)
      
      toast.success('Employee updated successfully')
      
      // Use setTimeout to ensure toast is shown before navigation
      setTimeout(() => {
        router.push(`/payroll/employees/${employeeId}`)
      }, 500)
      
    } catch (error) {
      console.error('Error updating employee:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update employee'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/payroll/employees/${employeeId}`)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Loading employee data...</p>
          <p className="text-white/50 text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-8 max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/payroll/employees')}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
            >
              Go to Employees
            </button>
            <button
              onClick={() => {
                setError('')
                fetchEmployee()
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
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
                  onClick={handleCancel}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <UserIcon className="h-8 w-8 text-pink-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Edit Employee</h1>
                  <p className="text-white/50 text-sm">{formData.employee_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(formData.status)}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-pink-400" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70"
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    First Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Last Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Email <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Phone <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternate_phone"
                    value={formData.alternate_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5 text-pink-400" />
                Employment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Production, Sales"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Operator, Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Join Date</label>
                  <input
                    type="date"
                    name="join_date"
                    value={formData.join_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="onleave">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-pink-400" />
                Salary Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Basic Salary <span className="text-pink-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">HRA</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="hra"
                      value={formData.hra}
                      onChange={handleInputChange}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Conveyance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="conveyance"
                      value={formData.conveyance}
                      onChange={handleInputChange}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Medical Allowance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="medical"
                      value={formData.medical}
                      onChange={handleInputChange}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Special Allowance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="special_allowance"
                      value={formData.special_allowance}
                      onChange={handleInputChange}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white/70 text-sm">Total Monthly</span>
                  <span className="text-white font-bold text-lg">
                    ₹{calculateTotalSalary().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg  hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50  transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="h-5 w-5" />
                    Update Employee
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