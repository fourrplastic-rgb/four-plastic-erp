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
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

export default function EditEmployee() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    department: '',
    designation: '',
    join_date: '',
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
    status: 'active'
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
      const response = await axios.get(`/api/employees/${employeeId}`)
      const employee = response.data.employee || response.data
      
      setFormData({
        employee_code: employee.employee_code || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        alternate_phone: employee.alternate_phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        join_date: employee.join_date ? employee.join_date.split('T')[0] : '',
        basic_salary: employee.basic_salary || '',
        hra: employee.hra || '',
        conveyance: employee.conveyance || '',
        medical: employee.medical || '',
        special_allowance: employee.special_allowance || '',
        pf_number: employee.pf_number || '',
        esi_number: employee.esi_number || '',
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
        status: employee.status || 'active'
      })
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast.error('Failed to fetch employee data')
      router.push('/payroll/employees')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.first_name || !formData.last_name) {
      toast.error('Please enter employee name')
      return
    }
    if (!formData.email) {
      toast.error('Please enter email')
      return
    }
    if (!formData.phone) {
      toast.error('Please enter phone number')
      return
    }
    if (!formData.basic_salary || parseFloat(formData.basic_salary) <= 0) {
      toast.error('Please enter valid basic salary')
      return
    }

    try {
      setSaving(true)
      await axios.put(`/api/employees/${employeeId}`, formData)
      toast.success('Employee updated successfully')
      router.push(`/payroll/employees/${employeeId}`)
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error(error.response?.data?.message || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading employee data...</p>
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
                href={`/payroll/employees/${employeeId}`}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <UserIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">Edit Employee</h1>
              <span className="text-white/50 text-sm ml-2">{formData.employee_code}</span>
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
                    name="employee_code"
                    value={formData.employee_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Email *</label>
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
                  <label className="block text-white/70 text-sm mb-1">Phone *</label>
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
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  <input
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">HRA</label>
                  <input
                    type="number"
                    name="hra"
                    value={formData.hra}
                    onChange={handleInputChange}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Conveyance</label>
                  <input
                    type="number"
                    name="conveyance"
                    value={formData.conveyance}
                    onChange={handleInputChange}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Medical Allowance</label>
                  <input
                    type="number"
                    name="medical"
                    value={formData.medical}
                    onChange={handleInputChange}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Special Allowance</label>
                  <input
                    type="number"
                    name="special_allowance"
                    value={formData.special_allowance}
                    onChange={handleInputChange}
                    step="100"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="bg-pink-500/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white/70 text-sm">Total Monthly Salary</span>
                  <span className="text-white font-bold text-lg">
                    ₹{calculateTotalSalary().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank & Statutory Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <IdentificationIcon className="h-5 w-5 text-pink-400" />
                Bank & Statutory Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">PF Number</label>
                  <input
                    type="text"
                    name="pf_number"
                    value={formData.pf_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">ESI Number</label>
                  <input
                    type="text"
                    name="esi_number"
                    value={formData.esi_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadhar_number"
                    value={formData.aadhar_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Account Number</label>
                  <input
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-pink-400" />
                Address & Emergency Contact
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Link
                href={`/payroll/employees/${employeeId}`}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg  hover:bg-white/20 transition-colors"
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