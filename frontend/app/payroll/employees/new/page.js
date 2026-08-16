'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  BriefcaseIcon,
  IdentificationIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

export default function NewEmployee() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(true)
  const [apiError, setApiError] = useState('')
  const [existingEmails, setExistingEmails] = useState([])
  const [emailError, setEmailError] = useState('')
  
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    gender: '', // Male, Female, Other
    marital_status: 'single', // single, married, divorced, widowed
    date_of_birth: '',
    blood_group: '', // A+, A-, B+, B-, O+, O-, AB+, AB-
    department: '',
    designation: '',
    join_date: new Date().toISOString().split('T')[0],
    basic_salary: '',
    hra: '',
    conveyance: '',
    medical: '',
    special_allowance: '',
    pf_number: '',
    esi_number: '',
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
    emergency_contact_relation: '',
    status: 'active'
  })

  useEffect(() => {
    // Check authentication
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
      return
    }
    
    // Generate employee code only once
    generateEmployeeCode()
    fetchExistingEmails()
  }, [])

  const generateEmployeeCode = async () => {
    try {
      setGeneratingCode(true)
      setApiError('')
      
      console.log('Fetching last employee code...')
      const response = await axios.get('/api/employees/last-code')
      console.log('Last code response:', response.data)
      
      const lastCode = response.data.lastCode || 'EMP000'
      const num = parseInt(lastCode.replace('EMP', '')) + 1
      const newCode = `EMP${num.toString().padStart(3, '0')}`
      setFormData(prev => ({ ...prev, employee_code: newCode }))
      
    } catch (error) {
      console.error('Error generating code:', error)
      // Fallback code using timestamp
      const fallbackCode = `EMP${Date.now().toString().slice(-5)}`
      setFormData(prev => ({ ...prev, employee_code: fallbackCode }))
      setApiError('Could not generate employee code automatically')
    } finally {
      setGeneratingCode(false)
    }
  }

  const fetchExistingEmails = async () => {
    try {
      const response = await axios.get('/api/employees')
      let employees = []
      if (response.data && response.data.employees) {
        employees = response.data.employees
      } else if (Array.isArray(response.data)) {
        employees = response.data
      }
      const emails = employees.map(emp => emp.email).filter(Boolean)
      setExistingEmails(emails)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear email error when typing
    if (name === 'email') {
      setEmailError('')
    }
  }

  const checkEmailAvailability = (email) => {
    if (!email) return true
    if (existingEmails.includes(email)) {
      setEmailError('This email is already registered. Please use a different email.')
      return false
    }
    return true
  }

  const suggestEmail = () => {
    const firstName = formData.first_name?.toLowerCase().replace(/\s+/g, '') || 'user'
    const lastName = formData.last_name?.toLowerCase().replace(/\s+/g, '') || ''
    const randomNum = Math.floor(Math.random() * 1000)
    
    const suggestions = [
      `${firstName}.${lastName}@company.com`,
      `${firstName}${lastName}@gmail.com`,
      `${firstName}.${lastName}${randomNum}@email.com`,
      `${firstName}${randomNum}@work.com`
    ]
    
    // Find first unused email
    for (const suggestion of suggestions) {
      if (!existingEmails.includes(suggestion)) {
        return suggestion
      }
    }
    return `${firstName}${lastName}${Date.now()}@email.com`
  }

  const handleSuggestEmail = () => {
    const suggested = suggestEmail()
    setFormData(prev => ({ ...prev, email: suggested }))
    setEmailError('')
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
    
    // Check if email exists
    if (existingEmails.includes(formData.email)) {
      errors.push('This email is already registered')
      setEmailError('This email is already registered')
    }
    
    const salary = parseFloat(formData.basic_salary)
    if (!formData.basic_salary || isNaN(salary) || salary <= 0) {
      errors.push('Valid basic salary is required')
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    // Final email check
    if (!checkEmailAvailability(formData.email)) {
      toast.error('Please use a different email address')
      return
    }

    try {
      setLoading(true)
      setApiError('')
      
      // Prepare data - remove any empty strings to avoid validation issues
      const submitData = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData[key] = formData[key]
        }
      })
      
      // Ensure required fields are present
      submitData.first_name = formData.first_name
      submitData.last_name = formData.last_name
      submitData.email = formData.email
      submitData.phone = formData.phone
      submitData.basic_salary = parseFloat(formData.basic_salary)
      submitData.status = formData.status || 'active'
      
      console.log('Submitting employee data:', submitData)
      
      const response = await axios.post('/api/employees', submitData)
      
      console.log('Success response:', response.data)
      toast.success('Employee added successfully')
      router.push('/payroll/employees')
      
    } catch (error) {
      console.error('Error adding employee:', error)
      
      let errorMessage = 'Failed to add employee'
      
      if (error.response) {
        console.error('Error status:', error.response.status)
        console.error('Error data:', error.response.data)
        
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`
        
        // Special handling for email error
        if (errorMessage.toLowerCase().includes('email')) {
          setEmailError('This email is already taken. Please use a different email.')
          fetchExistingEmails() // Refresh email list
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.'
      } else {
        errorMessage = error.message
      }
      
      setApiError(errorMessage)
      toast.error(errorMessage)
      
    } finally {
      setLoading(false)
    }
  }

  // Show loading while generating code
  if (generatingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Generating employee code...</p>
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
            <div className="flex items-center gap-4">
              <Link
                href="/payroll/employees"
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <UserIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">Add New Employee</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {apiError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            </div>
          )}

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
                    name="employee_code"
                    value={formData.employee_code}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    required
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

                <div>
                  <label className="block text-white/70 text-sm mb-1">Marital Status</label>
                  <select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
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
                  <label className="block text-white/70 text-sm mb-1">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-pink-400" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Email *</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white ${
                          emailError ? 'border-red-500' : 'border-white/20'
                        }`}
                        placeholder="employee@company.com"
                        required
                      />
                      {emailError && (
                        <p className="text-red-400 text-xs mt-1">{emailError}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSuggestEmail}
                      className="px-3 py-2 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg hover:bg-pink-500/30 text-sm whitespace-nowrap"
                    >
                      Suggest Email
                    </button>
                  </div>
                  <p className="text-white/50 text-xs mt-1">
                    Click "Suggest Email" to get a unique email suggestion
                  </p>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="10-digit mobile number"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Optional"
                  />
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                  <label className="block text-white/70 text-sm mb-1">Basic Salary *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₹</span>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      step="any"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                      step="any"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                      step="any"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                      step="any"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
                      step="any"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                <div className="bg-pink-500/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white/70 text-sm">Total Monthly</span>
                  <span className="text-white font-bold text-lg">
                    ₹{calculateTotalSalary().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-pink-400" />
                Emergency Contact
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Emergency phone number"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Relation</label>
                  <input
                    type="text"
                    name="emergency_contact_relation"
                    value={formData.emergency_contact_relation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="e.g., Father, Mother, Spouse"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Link
                href="/payroll/employees"
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <UserIcon className="h-5 w-5" />
                    Add Employee
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