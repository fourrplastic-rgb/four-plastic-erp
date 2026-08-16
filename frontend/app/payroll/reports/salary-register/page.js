'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  BanknotesIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function SalaryRegister() {
  const router = useRouter()
  const printRef = useRef()
  
  const [loading, setLoading] = useState(true)
  const [salaryData, setSalaryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [departments, setDepartments] = useState([])
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalBasic: 0,
    totalAllowances: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
    totalPF: 0,
    totalPT: 0,
    totalTax: 0,
    totalAdvances: 0
  })

  // Company Information
  const [companyInfo] = useState({
    name: 'FOUR (R) PLASTIC',
    address: '90 FEET ROAD, WIRE GALI, KHADI NO. 3',
    landmark: 'NEAR NATIONAL CHEMIST',
    area: 'SAKINAKA',
    city: 'MUMBAI - 400072',
    gst: 'GST: 27ABTPV9432F1ZX',
    phone: '+91 98765 43210',
    email: 'fourrplastic@gmail.com'
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchSalaryData()
  }, [])

  useEffect(() => {
    filterData()
  }, [selectedDepartment, salaryData])

  useEffect(() => {
    if (selectedMonth) {
      fetchSalaryData()
    }
  }, [selectedMonth])

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
      
      // Extract unique departments
      const depts = [...new Set(employeeData.map(e => e.department).filter(Boolean))]
      setDepartments(depts)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchSalaryData = async () => {
    try {
      setLoading(true)
      
      // Fetch payouts for the month
      const payoutsRes = await axios.get(`/api/payouts?month=${selectedMonth}`)
      let payoutData = payoutsRes.data.payouts || payoutsRes.data || []
      
      // Fetch advances for the month
      const advancesRes = await axios.get('/api/advances')
      let advanceData = advancesRes.data.advances || advancesRes.data || []
      
      // Combine data
      const salaryData = payoutData.map(payout => {
        const employee = employees.find(e => e.id === payout.employee_id) || {}
        const employeeAdvances = advanceData.filter(a => a.employee_id === payout.employee_id)
        
        return {
          ...payout,
          employee_name: payout.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
          employee_code: payout.employee_code || employee.employee_code,
          department: payout.department || employee.department || 'Not Assigned',
          advance_count: employeeAdvances.length,
          advance_total: employeeAdvances.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0)
        }
      })
      
      setSalaryData(salaryData)
      calculateSummary(salaryData)
      
    } catch (error) {
      console.error('Error fetching salary data:', error)
      toast.error('Failed to fetch salary data')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    if (selectedDepartment === 'all') {
      setFilteredData(salaryData)
    } else {
      setFilteredData(salaryData.filter(item => item.department === selectedDepartment))
    }
  }

  const calculateSummary = (data) => {
    const totalEmployees = data.length
    const totalBasic = data.reduce((sum, item) => sum + (parseFloat(item.basic_salary) || 0), 0)
    const totalAllowances = data.reduce((sum, item) => sum + (parseFloat(item.total_allowances) || 0), 0)
    const totalDeductions = data.reduce((sum, item) => sum + (parseFloat(item.total_deductions) || 0), 0)
    const totalNetSalary = data.reduce((sum, item) => sum + (parseFloat(item.net_salary) || 0), 0)
    const totalPF = data.reduce((sum, item) => sum + (parseFloat(item.pf_deduction) || 0), 0)
    const totalPT = data.reduce((sum, item) => sum + (parseFloat(item.pt_deduction) || 0), 0)
    const totalAdvances = data.reduce((sum, item) => sum + (parseFloat(item.advance_deduction) || 0), 0)

    setSummary({
      totalEmployees,
      totalBasic,
      totalAllowances,
      totalDeductions,
      totalNetSalary,
      totalPF,
      totalPT,
      totalTax: 0,
      totalAdvances
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Register - ${getMonthName(selectedMonth)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
              h1 { color: #333; text-align: center; font-size: 18px; }
              h2 { color: #666; margin-top: 20px; font-size: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f0f0f0; padding: 6px; border: 1px solid #ccc; text-align: center; font-size: 11px; }
              td { padding: 4px 6px; border: 1px solid #ccc; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
              .summary-card { background: #f9f9f9; padding: 8px; border: 1px solid #ddd; }
              .summary-label { color: #666; font-size: 10px; }
              .summary-value { font-size: 14px; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
              .signature { margin-top: 40px; display: flex; justify-content: space-between; }
              .signature-line { width: 200px; border-top: 1px solid #333; margin-top: 30px; }
              .grand-total { background: #e0e0e0; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h2>${companyInfo.name}</h2>
                <p>${companyInfo.address}</p>
                <p>${companyInfo.landmark}, ${companyInfo.area}</p>
                <p>${companyInfo.city}</p>
              </div>
              <div class="text-right">
                <p><strong>Salary Register</strong></p>
                <p>Month: ${getMonthName(selectedMonth)}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <h1>SALARY REGISTER - ${getMonthName(selectedMonth).toUpperCase()}</h1>
            
            <div class="summary">
              <div class="summary-card">
                <div class="summary-label">Total Employees</div>
                <div class="summary-value">${summary.totalEmployees}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Basic</div>
                <div class="summary-value">₹${summary.totalBasic.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Allowances</div>
                <div class="summary-value">₹${summary.totalAllowances.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Deductions</div>
                <div class="summary-value">₹${summary.totalDeductions.toLocaleString()}</div>
              </div>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="summary-label">PF Contribution</div>
                <div class="summary-value">₹${summary.totalPF.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Professional Tax</div>
                <div class="summary-value">₹${summary.totalPT.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Advance Recovery</div>
                <div class="summary-value">₹${summary.totalAdvances.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Net Payable</div>
                <div class="summary-value">₹${summary.totalNetSalary.toLocaleString()}</div>
              </div>
            </div>
            
            <h2>Department: ${selectedDepartment === 'all' ? 'ALL DEPARTMENTS' : selectedDepartment}</h2>
            
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Emp Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Basic</th>
                  <th>Allowances</th>
                  <th>PF</th>
                  <th>PT</th>
                  <th>Advance</th>
                  <th>Total Ded.</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.employee_code || ''}</td>
                    <td>${item.employee_name || 'N/A'}</td>
                    <td>${item.department || '-'}</td>
                    <td class="text-right">${(item.basic_salary || 0).toLocaleString()}</td>
                    <td class="text-right">${(item.total_allowances || 0).toLocaleString()}</td>
                    <td class="text-right">${(item.pf_deduction || 0).toLocaleString()}</td>
                    <td class="text-right">${(item.pt_deduction || 0).toLocaleString()}</td>
                    <td class="text-right">${(item.advance_deduction || 0).toLocaleString()}</td>
                    <td class="text-right">${(item.total_deductions || 0).toLocaleString()}</td>
                    <td class="text-right"><strong>${(item.net_salary || 0).toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
                
                <tr class="grand-total">
                  <td colspan="4" class="text-right"><strong>GRAND TOTAL</strong></td>
                  <td class="text-right"><strong>${summary.totalBasic.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalAllowances.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalPF.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalPT.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalAdvances.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalDeductions.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>${summary.totalNetSalary.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="signature">
              <div>
                <p>Prepared By</p>
                <div class="signature-line"></div>
                <p>Date: _______________</p>
              </div>
              <div>
                <p>Checked By</p>
                <div class="signature-line"></div>
                <p>Date: _______________</p>
              </div>
              <div>
                <p>Authorized Signatory</p>
                <div class="signature-line"></div>
                <p>For ${companyInfo.name}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is a computer generated report - No signature required</p>
              <p>${companyInfo.name} | ${companyInfo.address} | ${companyInfo.city}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToCSV = () => {
    const headers = ['S.No', 'Emp Code', 'Employee Name', 'Department', 'Basic', 'Allowances', 'PF', 'PT', 'Advance', 'Total Deductions', 'Net Salary']
    const csvData = filteredData.map((item, index) => [
      index + 1,
      item.employee_code || '',
      item.employee_name || 'N/A',
      item.department || '-',
      item.basic_salary || 0,
      item.total_allowances || 0,
      item.pf_deduction || 0,
      item.pt_deduction || 0,
      item.advance_deduction || 0,
      item.total_deductions || 0,
      item.net_salary || 0
    ])

    // Add summary row
    csvData.push([
      '', '', '', 'TOTAL',
      summary.totalBasic,
      summary.totalAllowances,
      summary.totalPF,
      summary.totalPT,
      summary.totalAdvances,
      summary.totalDeductions,
      summary.totalNetSalary
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `salary_register_${selectedMonth}.csv`
    a.click()
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading salary register...</p>
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
                  onClick={() => router.push('/payroll/reports')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <ChartBarIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Salary Register</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print Register
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-pink-400" />
              Report Filters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Month Selection */}
              <div>
                <label className="block text-white/70 text-sm mb-1">Select Month</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-white/70 text-sm mb-1">Department</label>
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

              {/* Summary Info */}
              <div className="bg-pink-500/10 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-xs">Total Employees</p>
                  <p className="text-white text-2xl font-bold">{filteredData.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs">Net Payable</p>
                  <p className="text-pink-400 text-xl font-bold">{formatCurrency(summary.totalNetSalary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Basic</p>
              <p className="text-white text-xl font-bold">{formatCurrency(summary.totalBasic)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Allowances</p>
              <p className="text-white text-xl font-bold">{formatCurrency(summary.totalAllowances)}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Deductions</p>
              <p className="text-white text-xl font-bold">{formatCurrency(summary.totalDeductions)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Net Salary</p>
              <p className="text-white text-xl font-bold">{formatCurrency(summary.totalNetSalary)}</p>
            </div>
          </div>

          {/* Deduction Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-xs">PF Deduction</p>
              <p className="text-white font-semibold">{formatCurrency(summary.totalPF)}</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-orange-400 text-xs">Professional Tax</p>
              <p className="text-white font-semibold">{formatCurrency(summary.totalPT)}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-xs">Advance Recovery</p>
              <p className="text-white font-semibold">{formatCurrency(summary.totalAdvances)}</p>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm flex justify-between items-center">
            <span>Showing {filteredData.length} employees for {getMonthName(selectedMonth)}</span>
            <span className="text-pink-400">Net Payable: {formatCurrency(summary.totalNetSalary)}</span>
          </div>

          {/* Salary Register Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">#</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Emp Code</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee Name</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Dept</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Basic</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Allowances</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">PF</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">PT</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Advance</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Total Ded.</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white/70 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-white/70 text-sm">{item.employee_code || '-'}</td>
                        <td className="px-4 py-3 text-white text-sm">{item.employee_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-white/70 text-sm">{item.department || '-'}</td>
                        <td className="px-4 py-3 text-white text-right text-sm">{formatCurrency(item.basic_salary)}</td>
                        <td className="px-4 py-3 text-green-400 text-right text-sm">{formatCurrency(item.total_allowances)}</td>
                        <td className="px-4 py-3 text-red-400 text-right text-sm">{formatCurrency(item.pf_deduction)}</td>
                        <td className="px-4 py-3 text-red-400 text-right text-sm">{formatCurrency(item.pt_deduction)}</td>
                        <td className="px-4 py-3 text-orange-400 text-right text-sm">{formatCurrency(item.advance_deduction)}</td>
                        <td className="px-4 py-3 text-red-400 text-right text-sm">{formatCurrency(item.total_deductions)}</td>
                        <td className="px-4 py-3 text-white font-bold text-right text-sm">{formatCurrency(item.net_salary)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-white/50">
                        <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No salary data found for {getMonthName(selectedMonth)}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot className="bg-white/5">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-white/70 text-right font-semibold">TOTAL</td>
                      <td className="px-4 py-3 text-white font-bold text-right">{formatCurrency(summary.totalBasic)}</td>
                      <td className="px-4 py-3 text-green-400 font-bold text-right">{formatCurrency(summary.totalAllowances)}</td>
                      <td className="px-4 py-3 text-red-400 font-bold text-right">{formatCurrency(summary.totalPF)}</td>
                      <td className="px-4 py-3 text-red-400 font-bold text-right">{formatCurrency(summary.totalPT)}</td>
                      <td className="px-4 py-3 text-orange-400 font-bold text-right">{formatCurrency(summary.totalAdvances)}</td>
                      <td className="px-4 py-3 text-red-400 font-bold text-right">{formatCurrency(summary.totalDeductions)}</td>
                      <td className="px-4 py-3 text-pink-400 font-bold text-right">{formatCurrency(summary.totalNetSalary)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}