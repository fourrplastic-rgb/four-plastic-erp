'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  EyeIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'

export default function PayoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [advances, setAdvances] = useState([])
  const [processedPayouts, setProcessedPayouts] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showGenerated, setShowGenerated] = useState(false)
  
  // Deduction control settings
  const [deductionSettings, setDeductionSettings] = useState({
    chargePF: true,
    pfRate: 12,
    pfMaxAmount: 15000,
    chargePT: true,
    ptAmount: 200,
    pfThreshold: 15000,
  })

  // Fetch data when month changes - FIXED
  useEffect(() => {
    checkAuth()
    fetchData()
    fetchProcessedPayouts()
  }, [selectedMonth]) // ✅ Added selectedMonth dependency

  // Re-filter when search, employees, deduction settings, or month changes
  useEffect(() => {
    filterEmployees()
  }, [searchTerm, employees, deductionSettings, selectedMonth]) // ✅ Added selectedMonth

  useEffect(() => {
    console.log('Selected employees:', selectedEmployees)
  }, [selectedEmployees])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) router.push('/')
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch ALL active employees
      const empRes = await axios.get('/api/employees?status=active')
      let empData = []
      if (empRes.data && empRes.data.employees) {
        empData = empRes.data.employees
      } else if (Array.isArray(empRes.data)) {
        empData = empRes.data
      }
      setEmployees(empData)

      // Fetch advances for calculations
      const advRes = await axios.get('/api/advances')
      let advData = []
      if (advRes.data && advRes.data.advances) {
        advData = advRes.data.advances
      } else if (Array.isArray(advRes.data)) {
        advData = advRes.data
      }
      setAdvances(advData)

    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProcessedPayouts = async () => {
    try {
      const res = await axios.get(`/api/payouts?month=${selectedMonth}`)
      let payoutData = []
      if (res.data && res.data.payouts) {
        payoutData = res.data.payouts
      } else if (Array.isArray(res.data)) {
        payoutData = res.data
      }
      setProcessedPayouts(payoutData)
      console.log(`Fetched ${payoutData.length} payouts for ${selectedMonth}`)
    } catch (error) {
      console.error('Error fetching payouts:', error)
      setProcessedPayouts([])
    }
  }

  // Calculate PF deduction with rules
  const calculatePFDeduction = (basic) => {
    if (!deductionSettings.chargePF) return 0
    if (basic <= deductionSettings.pfThreshold) return 0
    let pf = basic * (deductionSettings.pfRate / 100)
    if (deductionSettings.pfMaxAmount > 0) {
      pf = Math.min(pf, deductionSettings.pfMaxAmount)
    }
    return Math.round(pf)
  }

  // Calculate PT deduction
  const calculatePTDeduction = (basic) => {
    if (!deductionSettings.chargePT) return 0
    return deductionSettings.ptAmount
  }

  // Calculate payout for a single employee
  const calculateEmployeePayout = (employee) => {
    const basic = parseFloat(employee.basic_salary) || 0
    const hra = parseFloat(employee.hra) || 0
    const conveyance = parseFloat(employee.conveyance) || 0
    const medical = parseFloat(employee.medical) || 0
    const special = parseFloat(employee.special_allowance) || 0
    
    const totalAllowances = hra + conveyance + medical + special
    const totalEarnings = basic + totalAllowances
    
    // Get pending advances
    const employeeAdvances = advances.filter(a => 
      a && a.employee_id === employee.id && a.status === 'pending'
    )
    const advanceDeduction = employeeAdvances.reduce((sum, a) => 
      sum + (parseFloat(a.balance) || 0), 0
    )
    
    // Calculate PF and PT with rules
    const pfDeduction = calculatePFDeduction(basic)
    const ptDeduction = calculatePTDeduction(basic)
    const otherDeductions = pfDeduction + ptDeduction
    const totalDeductions = otherDeductions + advanceDeduction
    const netSalary = totalEarnings - totalDeductions
    
    // Find if there's a payout for this employee in the selected month
    const employeePayout = processedPayouts.find(p => p.employee_id === employee.id)
    
    // Check if already processed (status === 'processed') or just pending
    const alreadyProcessed = employeePayout ? employeePayout.status === 'processed' : false
    const hasPendingPayout = employeePayout ? employeePayout.status === 'pending' : false
    
    return {
      id: employee.id,
      name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || `Employee #${employee.id}`,
      code: employee.employee_code,
      department: employee.department || 'Not Assigned',
      basic,
      allowances: totalAllowances,
      advanceDeduction,
      pfDeduction,
      ptDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      advanceCount: employeeAdvances.length,
      alreadyProcessed, // true only if status is 'processed'
      hasPendingPayout, // true if status is 'pending'
      pfApplied: pfDeduction > 0,
      ptApplied: ptDeduction > 0,
      // Add payout_id if exists for linking to detail page
      payout_id: employeePayout?.id,
      payout_status: employeePayout?.status
    }
  }

  const filterEmployees = () => {
    let filtered = employees.map(emp => calculateEmployeePayout(emp))

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEmployees(filtered)
    
    // Log counts for debugging
    const pending = filtered.filter(e => !e.alreadyProcessed && !e.hasPendingPayout).length
    const hasPending = filtered.filter(e => e.hasPendingPayout).length
    const processed = filtered.filter(e => e.alreadyProcessed).length
    console.log(`Month ${selectedMonth}: ${pending} not generated, ${hasPending} pending, ${processed} processed`)
  }

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAll = () => {
    // Only select employees with no payout at all (not pending, not processed)
    const availableForSelection = filteredEmployees
      .filter(emp => !emp.alreadyProcessed && !emp.hasPendingPayout)
      .map(emp => emp.id)
    setSelectedEmployees(availableForSelection)
  }

  const deselectAll = () => {
    setSelectedEmployees([])
  }

  const generatePayouts = async () => {
    const employeesToProcess = filteredEmployees.filter(emp => 
      selectedEmployees.includes(emp.id) && !emp.alreadyProcessed && !emp.hasPendingPayout
    )

    if (employeesToProcess.length === 0) {
      toast.error('No pending employees selected')
      return
    }

    if (!confirm(`Generate payouts for ${employeesToProcess.length} employees for ${getMonthName(selectedMonth)}?`)) return

    setGenerating(true)
    try {
      const payoutData = {
        month: selectedMonth,
        employees: employeesToProcess.map(emp => ({
          employee_id: emp.id,
          basic_salary: emp.basic,
          total_allowances: emp.allowances,
          pf_deduction: emp.pfDeduction,
          pt_deduction: emp.ptDeduction,
          advance_deduction: emp.advanceDeduction,
          total_deductions: emp.totalDeductions,
          net_salary: emp.netSalary,
          status: 'pending'
        }))
      }

      console.log('Generating payouts with data:', payoutData)

      // Call the actual backend API
      const response = await axios.post('/api/payouts/generate', payoutData)

      if (response.data && response.data.success) {
        toast.success(`Successfully generated ${response.data.count || employeesToProcess.length} payouts`)
        
        // Reset selections and refresh data
        setSelectedEmployees([])
        await fetchProcessedPayouts()
        await fetchData()
        
        setTimeout(() => {
          if (confirm('Payouts generated successfully! Would you like to view them?')) {
            router.push('/payroll/surplus')
          }
        }, 1000)
      } else {
        toast.error('Failed to generate payouts: ' + (response.data?.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error generating payouts:', error)
      toast.error('Failed to generate payouts: ' + (error.response?.data?.message || error.message))
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (num) => {
    if (!num && num !== 0) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const getMonthName = (monthStr) => {
    const [year, month] = monthStr.split('-')
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const totalNetSalary = filteredEmployees.reduce((sum, e) => sum + e.netSalary, 0)
  const notGeneratedCount = filteredEmployees.filter(e => !e.alreadyProcessed && !e.hasPendingPayout).length
  const pendingCount = filteredEmployees.filter(e => e.hasPendingPayout).length
  const processedCount = filteredEmployees.filter(e => e.alreadyProcessed).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payroll data...</p>
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
                  onClick={() => router.push('/payroll')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <BanknotesIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Salary & Payout Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchData()
                    fetchProcessedPayouts()
                  }}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  href="/payroll/surplus/generate"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  Generate Payouts
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Deduction Settings Panel */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CogIcon className="h-5 w-5 text-pink-400" />
              Deduction Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* PF Settings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deductionSettings.chargePF}
                    onChange={(e) => setDeductionSettings({...deductionSettings, chargePF: e.target.checked})}
                    className="rounded border-white/20"
                  />
                  <span className="text-white text-sm">Charge PF</span>
                </label>
                {deductionSettings.chargePF && (
                  <>
                    <div>
                      <label className="text-white/50 text-xs">PF Rate (%)</label>
                      <input
                        type="number"
                        value={deductionSettings.pfRate}
                        onChange={(e) => setDeductionSettings({...deductionSettings, pfRate: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs">Min Salary for PF</label>
                      <input
                        type="number"
                        value={deductionSettings.pfThreshold}
                        onChange={(e) => setDeductionSettings({...deductionSettings, pfThreshold: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs">Max PF Amount</label>
                      <input
                        type="number"
                        value={deductionSettings.pfMaxAmount}
                        onChange={(e) => setDeductionSettings({...deductionSettings, pfMaxAmount: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm"
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* PT Settings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deductionSettings.chargePT}
                    onChange={(e) => setDeductionSettings({...deductionSettings, chargePT: e.target.checked})}
                    className="rounded border-white/20"
                  />
                  <span className="text-white text-sm">Charge Professional Tax</span>
                </label>
                {deductionSettings.chargePT && (
                  <div>
                    <label className="text-white/50 text-xs">PT Amount (₹)</label>
                    <input
                      type="number"
                      value={deductionSettings.ptAmount}
                      onChange={(e) => setDeductionSettings({...deductionSettings, ptAmount: parseFloat(e.target.value)})}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="md:col-span-2 bg-blue-500/10 rounded-lg p-3">
                <p className="text-blue-400 text-sm">
                  ⚙️ Current Settings:<br />
                  PF: {deductionSettings.chargePF ? `${deductionSettings.pfRate}% (max ₹${deductionSettings.pfMaxAmount}, min salary ₹${deductionSettings.pfThreshold})` : 'Disabled'}<br />
                  PT: {deductionSettings.chargePT ? `₹${deductionSettings.ptAmount}` : 'Disabled'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Employees</p>
              <p className="text-white text-2xl font-bold">{filteredEmployees.length}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Not Generated</p>
              <p className="text-white text-2xl font-bold">{notGeneratedCount}</p>
              <p className="text-yellow-400 text-xs mt-1">Ready for payout</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Pending</p>
              <p className="text-white text-2xl font-bold">{pendingCount}</p>
              <p className="text-blue-400 text-xs mt-1">Generated, not processed</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Processed</p>
              <p className="text-white text-2xl font-bold">{processedCount}</p>
              <p className="text-green-400 text-xs mt-1">Completed</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Payout</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(totalNetSalary)}</p>
              <p className="text-white/50 text-xs mt-1">{getMonthName(selectedMonth)}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20"
                >
                  Select All Not Generated
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20"
                >
                  Deselect All
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-pink-400" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                      // Clear selections when month changes
                      setSelectedEmployees([])
                    }}
                    className="px-3 py-1.5 bg-gray-800 border border-white/20 rounded-lg text-white text-sm"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                </div>
                
                <Link
                  href="/payroll/surplus/generate"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  Generate Payouts ({selectedEmployees.length})
                </Link>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search by employee name, code, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <CogIcon className="h-5 w-5 text-blue-400" />
              <p className="text-blue-400 text-sm">
                ✅ {filteredEmployees.length} active employees • {notGeneratedCount} not generated • {pendingCount} pending • {processedCount} processed
                {advances.length > 0 ? ` • ${advances.length} advance records found` : ''}
              </p>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm flex justify-between">
            <span>Showing {filteredEmployees.length} active employees for {getMonthName(selectedMonth)}</span>
            {selectedEmployees.length > 0 && (
              <span className="text-pink-400">{selectedEmployees.length} selected for payout</span>
            )}
          </div>

          {/* Employees Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === filteredEmployees.filter(e => !e.alreadyProcessed && !e.hasPendingPayout).length && filteredEmployees.filter(e => !e.alreadyProcessed && !e.hasPendingPayout).length > 0}
                        onChange={selectAll}
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
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className={`hover:bg-white/5 ${emp.alreadyProcessed ? 'opacity-60' : ''} ${emp.hasPendingPayout ? 'opacity-80' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            disabled={emp.alreadyProcessed || emp.hasPendingPayout}
                            className="rounded border-white/20 bg-white/10"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-400 text-sm font-semibold">
                                {emp.name?.charAt(0) || 'E'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{emp.name}</p>
                              <p className="text-white/50 text-xs">{emp.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {emp.department}
                          {emp.advanceCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              {emp.advanceCount}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white text-right">{formatCurrency(emp.basic)}</td>
                        <td className="px-4 py-3 text-green-400 text-right">{formatCurrency(emp.allowances)}</td>
                        <td className="px-4 py-3 text-orange-400 text-right">{formatCurrency(emp.advanceDeduction)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={emp.pfApplied || emp.ptApplied ? 'text-red-400' : 'text-white/30'}>
                            {emp.pfApplied || emp.ptApplied ? formatCurrency(emp.otherDeductions) : '—'}
                          </span>
                          {emp.pfApplied && <span className="ml-1 text-xs text-white/50">PF</span>}
                          {emp.ptApplied && <span className="ml-1 text-xs text-white/50">PT</span>}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">{formatCurrency(emp.netSalary)}</td>
                        <td className="px-4 py-3">
                          {emp.alreadyProcessed ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                              Processed
                            </span>
                          ) : emp.hasPendingPayout ? (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                              Not Generated
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {/* View Employee Button */}
                          <Link
                            href={`/payroll/employees/${emp.id}`}
                            className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30 inline-block mr-1"
                            title="View Employee"
                          >
                            <UserIcon className="h-4 w-4" />
                          </Link>
                          
                          {/* View Payout Details Button - Only for processed or pending employees */}
                          {(emp.alreadyProcessed || emp.hasPendingPayout) && emp.payout_id && (
                            <Link
                              href={`/payroll/surplus/${emp.payout_id}`}
                              className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/30 inline-block"
                              title="View Payout Details"
                            >
                              <BanknotesIcon className="h-4 w-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-white/50">
                        <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}