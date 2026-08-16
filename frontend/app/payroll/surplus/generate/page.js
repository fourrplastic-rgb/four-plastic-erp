'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BanknotesIcon,
  UserIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function GeneratePayouts() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [advances, setAdvances] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [calculations, setCalculations] = useState({})
  const [existingPayouts, setExistingPayouts] = useState([])

  // Check if payouts already exist for the selected month
  useEffect(() => {
    checkExistingPayouts()
  }, [selectedMonth])

  useEffect(() => {
    checkAuth()
    Promise.all([
      fetchEmployees(),
      fetchAdvanceData(),
      fetchAttendanceData()
    ]).then(() => {
      console.log('All data fetched, calculating salaries...')
    })
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      console.log('Data updated, recalculating salaries...')
      calculateSalaries()
    }
  }, [selectedMonth, employees, advances, attendance])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const checkExistingPayouts = async () => {
    try {
      const response = await axios.get(`/api/payouts?month=${selectedMonth}`)
      if (response.data && response.data.payouts) {
        setExistingPayouts(response.data.payouts)
        console.log(`Found ${response.data.payouts.length} existing payouts for ${selectedMonth}`)
      } else {
        setExistingPayouts([])
      }
    } catch (error) {
      console.error('Error checking existing payouts:', error)
      setExistingPayouts([])
    }
  }

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
          
      console.log('Fetching employees...')
      const response = await axios.get('/api/employees?status=active')
      console.log('Employees response:', response.data)
       
      let employeeData = []
      if (response.data && response.data.employees) {   
        employeeData = response.data.employees
      } else if (Array.isArray(response.data)) {
        employeeData = response.data
      }
    
      // Log employee data to debug
      console.log('Employee data sample:', employeeData[0])
        
      setEmployees(employeeData)
      // Only set selected employees if none are selected yet
      if (selectedEmployees.length === 0) {
        setSelectedEmployees(employeeData.map(e => e.id))
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setError(error.message)
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }, [selectedEmployees])

  const fetchAdvanceData = useCallback(async () => {
    try {
      console.log('Fetching advances...')
      const response = await axios.get('/api/advances')
      console.log('Advances response:', response.data)
      
      if (response.data && response.data.advances) {
        setAdvances(response.data.advances)
      }
    } catch (error) {
      console.error('Error fetching advances:', error)
    }
  }, [])

  const fetchAttendanceData = useCallback(async () => {
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = `${year}-${month}-31`
      console.log(`Fetching attendance for: ${startDate} to ${endDate}`)
      
      const response = await axios.get(`/api/attendance?from=${startDate}&to=${endDate}`)
      console.log('Attendance response:', response.data)
      
      if (response.data && response.data.attendance) {
        const grouped = response.data.attendance.reduce((acc, record) => {
          if (!acc[record.employee_id]) {
            acc[record.employee_id] = []
          }
          acc[record.employee_id].push(record)
          return acc
        }, {})
        setAttendance(grouped)
        console.log('Grouped attendance:', grouped)
      } else {
        setAttendance({})
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendance({})
    }
  }, [selectedMonth])

  const calculateSalaries = () => {
    const calculations = {}
    
    employees.forEach(emp => {
      if (!selectedEmployees.includes(emp.id)) return
      
      // Safely parse numeric values, handling empty strings
      const basicSalary = parseFloat(emp.basic_salary) || 0
      const hra = parseFloat(emp.hra) || 0
      const conveyance = parseFloat(emp.conveyance) || 0
      const medical = parseFloat(emp.medical) || 0
      const special = parseFloat(emp.special_allowance) || 0
      
      // Calculate total allowances
      const totalAllowances = hra + conveyance + medical + special
      
      // Calculate attendance-based deductions
      const empAttendance = attendance[emp.id] || { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0 }
      
      // Standard working days in month (assuming 26 working days)
      const workingDays = 26
      const perDaySalary = basicSalary > 0 ? basicSalary / workingDays : 0
      
      // Attendance deduction (absent + half day counts as 0.5 day)
      const attendanceDeduction = perDaySalary * (empAttendance.absent + (empAttendance.halfDay * 0.5))
      
      // Calculate advance deductions - Handle empty strings properly
      const employeeAdvances = advances.filter(a => 
        a && a.employee_id === emp.id && a.status === 'pending'
      )
      
      // Safely calculate advance deduction with null/empty checks
      const advanceDeduction = employeeAdvances.reduce((sum, a) => {
        if (!a) return sum
        const balance = a.balance
        // If balance is empty string, null, or undefined, treat as 0
        if (balance === '' || balance === null || balance === undefined) return sum
        const parsedBalance = parseFloat(balance)
        return sum + (isNaN(parsedBalance) ? 0 : parsedBalance)
      }, 0)
      
      // Calculate PF deduction (12% of basic, capped at 15000)
      const pfDeduction = Math.min(basicSalary * 0.12, 15000)
      
      // Professional Tax (₹200 if basic > 10000, otherwise ₹150)
      const ptDeduction = basicSalary > 10000 ? 200 : (basicSalary > 5000 ? 150 : 0)
      
      // Calculate totals
      const totalEarnings = basicSalary + totalAllowances
      const totalDeductions = attendanceDeduction + advanceDeduction + pfDeduction + ptDeduction
      const netSalary = totalEarnings - totalDeductions
      
      calculations[emp.id] = {
        employee_id: emp.id,
        employee_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${emp.id}`,
        employee_code: emp.employee_code,
        department: emp.department || 'Not Assigned',
        basic_salary: basicSalary,
        allowances: {
          hra,
          conveyance,
          medical,
          special
        },
        total_allowances: totalAllowances,
        deductions: {
          attendance: attendanceDeduction,
          advance: advanceDeduction,
          pf: pfDeduction,
          pt: ptDeduction
        },
        total_deductions: totalDeductions,
        attendance: empAttendance,
        net_salary: netSalary,
        month: selectedMonth,
        has_advance: employeeAdvances.length > 0,
        advance_count: employeeAdvances.length
      }
    })
    
    console.log('Final calculations:', calculations)
    setCalculations(calculations)
  }

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const selectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map(emp => emp.id))
    }
  }

  const deselectAll = () => {
    setSelectedEmployees([])
  }

  const generatePayouts = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee')
      return
    }

    // Check if payouts already exist
    if (existingPayouts.length > 0) {
      toast.error(`Payouts for ${getMonthName(selectedMonth)} already exist. Please select a different month.`)
      return
    }

    setGenerating(true)
    try {
      // The backend only needs the month - it generates payouts for all employees
      const payoutData = {
        month: selectedMonth
      }

      console.log('Sending payout data:', payoutData)
      
      const response = await axios.post('/api/payouts/generate', payoutData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data && response.data.success) {
        toast.success(`Generated ${response.data.count || 'payouts'} successfully for ${getMonthName(selectedMonth)}`)
        
        // IMPORTANT: Refresh the existing payouts data before navigating
        await checkExistingPayouts()
        
        // Clear selections after successful generation
        setSelectedEmployees([])
        
        // Navigate back to the main payout page
        setTimeout(() => {
          router.push('/payroll/surplus')
        }, 1500)
      } else {
        toast.error('Failed to generate payouts: ' + (response.data?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error generating payouts:', error)
      if (error.response) {
        console.error('Error response data:', error.response.data)
        // Check if the error is because payouts already exist
        if (error.response.data?.message === 'Payouts already exist for this month') {
          toast.error(`Payouts for ${getMonthName(selectedMonth)} already exist. Please select a different month.`)
          // Refresh the existing payouts list
          await checkExistingPayouts()
        } else {
          // Show more specific error message
          const errorMsg = error.response.data?.message || JSON.stringify(error.response.data)
          toast.error('Failed to generate payouts: ' + errorMsg)
          console.error('Detailed error:', error.response.data)
        }
      } else {
        toast.error('Failed to generate payouts: ' + error.message)
      }
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (num) => {
    if (num === undefined || num === null || num === '') return '₹0'
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(parsed)
  }

  const getMonthName = (monthStr) => {
    const [year, month] = monthStr.split('-')
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading data...</p>
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
                  onClick={() => router.push('/payroll/surplus')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <BanknotesIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Generate Payouts</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchEmployees()
                    fetchAdvanceData()
                    fetchAttendanceData()
                    checkExistingPayouts()
                  }}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Existing Payouts Warning */}
          {existingPayouts.length > 0 && (
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                <p className="text-yellow-400 text-xs">
                  ⚠️ Payouts for {getMonthName(selectedMonth)} already exist ({existingPayouts.length} employees). 
                  Select a different month to generate new payouts.
                </p>
              </div>
            </div>
          )}

          {/* Month Selection and Actions */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-pink-400" />
                <label className="text-white/70">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                  style={{ backgroundColor: '#1f2937' }}
                />
                {existingPayouts.length > 0 && (
                  <span className="text-xs text-yellow-400">(Payouts exist)</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20"
                >
                  Deselect All
                </button>
                <button
                  onClick={generatePayouts}
                  disabled={generating || selectedEmployees.length === 0 || existingPayouts.length > 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
                  title={existingPayouts.length > 0 ? "Payouts already exist for this month" : ""}
                >
                  {generating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5" />
                      Generate Payouts ({selectedEmployees.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-blue-400 text-sm">
              📊 Generating payouts for {getMonthName(selectedMonth)} • {employees.length} active employees • {selectedEmployees.length} selected
              {advances.length > 0 ? ` • ${advances.length} pending advances` : ''}
              {existingPayouts.length > 0 ? ` • ${existingPayouts.length} existing payouts` : ''}
            </p>
          </div>

          {/* Employee List with Calculations */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-pink-400" />
                Employee Salary Calculations
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                        onChange={selectAll}
                        disabled={existingPayouts.length > 0}
                        className="rounded border-white/20 bg-white/10"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Department</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Basic</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Allowances</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Advance</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">PF/PT</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {employees.length > 0 ? (
                    employees.map((emp) => {
                      const calc = calculations[emp.id] || {
                        total_allowances: 0,
                        deductions: { advance: 0, pf: 0, pt: 0 },
                        net_salary: parseFloat(emp.basic_salary) || 0,
                        has_advance: false,
                        advance_count: 0
                      }
                      
                      return (
                        <tr key={emp.id} className="hover:bg-white/5">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={() => handleEmployeeSelect(emp.id)}
                              disabled={existingPayouts.length > 0}
                              className="rounded border-white/20 bg-white/10"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                                <span className="text-pink-400 text-sm font-semibold">
                                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-white/50 text-xs">{emp.employee_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/70 text-sm">
                            {emp.department || '-'}
                            {calc.has_advance && (
                              <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                {calc.advance_count} advance
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white text-right">
                            {formatCurrency(emp.basic_salary)}
                          </td>
                          <td className="px-4 py-3 text-green-400 text-right">
                            {formatCurrency(calc.total_allowances)}
                          </td>
                          <td className="px-4 py-3 text-orange-400 text-right">
                            {formatCurrency(calc.deductions?.advance || 0)}
                          </td>
                          <td className="px-4 py-3 text-red-400 text-right">
                            {formatCurrency((calc.deductions?.pf || 0) + (calc.deductions?.pt || 0))}
                          </td>
                          <td className="px-4 py-3 text-white font-bold text-right">
                            {formatCurrency(calc.net_salary)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-white/50">
                        <UserIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No active employees found
                      </td>
                    </tr>
                  )}
                </tbody>
                {employees.length > 0 && (
                  <tfoot className="bg-white/5">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-white/70 text-right font-semibold">Totals:</td>
                      <td className="px-4 py-3 text-white font-bold text-right">
                        {formatCurrency(employees.reduce((sum, emp) => sum + (parseFloat(emp.basic_salary) || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-green-400 font-bold text-right">
                        {formatCurrency(Object.values(calculations).reduce((sum, c) => sum + (c.total_allowances || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-orange-400 font-bold text-right">
                        {formatCurrency(Object.values(calculations).reduce((sum, c) => sum + (c.deductions?.advance || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-red-400 font-bold text-right">
                        {formatCurrency(Object.values(calculations).reduce((sum, c) => sum + (c.deductions?.pf || 0) + (c.deductions?.pt || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-pink-400 font-bold text-right">
                        {formatCurrency(Object.values(calculations).reduce((sum, c) => sum + (c.net_salary || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-white/30 text-xs text-center">
            <p>Select employees and click "Generate Payouts" to create payouts for {getMonthName(selectedMonth)}</p>
          </div>
        </main>
      </div>
    </div>
  )
}