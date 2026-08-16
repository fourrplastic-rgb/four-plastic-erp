'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

// Create a global variable that NO ONE can touch
if (typeof window !== 'undefined') {
  window._FINAL_EMPLOYEE_SELECTION_ = null
}

export default function EmployeeWiseReport() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  
  // This state will be FORCEFULLY maintained
  const [selectedEmployee, setSelectedEmployee] = useState(() => {
    if (typeof window !== 'undefined') {
      // Try multiple sources
      const fromGlobal = window._FINAL_EMPLOYEE_SELECTION_
      const fromLocal = localStorage.getItem('_final_emp_')
      const fromSession = sessionStorage.getItem('_final_emp_')
      
      return fromGlobal || fromLocal || fromSession || 'all'
    }
    return 'all'
  })
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('_final_month_') || new Date().toISOString().slice(0, 7)
    }
    return new Date().toISOString().slice(0, 7)
  })
  
  const [reportData, setReportData] = useState({ employee: null, payouts: [] })

  // FORCE SAVE - runs on every render
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEmployee && selectedEmployee !== 'all') {
      // Save to EVERY possible location
      window._FINAL_EMPLOYEE_SELECTION_ = selectedEmployee
      localStorage.setItem('_final_emp_', selectedEmployee)
      sessionStorage.setItem('_final_emp_', selectedEmployee)
      
      // Also save as cookie
      document.cookie = `_final_emp_=${selectedEmployee}; path=/; max-age=86400`
      
      // Save to body attribute
      document.body.setAttribute('data-final-emp', selectedEmployee)
    }
    
    if (selectedMonth) {
      localStorage.setItem('_final_month_', selectedMonth)
      sessionStorage.setItem('_final_month_', selectedMonth)
    }
  })

  // FORCE RESTORE - runs every second to catch any clearing
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        // Check if our selection was cleared
        if (selectedEmployee === 'all' || !selectedEmployee) {
          // Try to restore from any source
          const fromGlobal = window._FINAL_EMPLOYEE_SELECTION_
          const fromLocal = localStorage.getItem('_final_emp_')
          const fromSession = sessionStorage.getItem('_final_emp_')
          
          const restored = fromGlobal || fromLocal || fromSession
          
          if (restored && restored !== 'all') {
            console.log('🔄 Force restoring selection to:', restored)
            setSelectedEmployee(restored)
          }
        }
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [selectedEmployee])

  // Load employees
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees')
      setEmployees(res.data.employees || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // FORCE SAVE before fetching
      if (selectedEmployee && selectedEmployee !== 'all') {
        window._FINAL_EMPLOYEE_SELECTION_ = selectedEmployee
        localStorage.setItem('_final_emp_', selectedEmployee)
      }
      
      const res = await axios.get(`/api/payouts?month=${selectedMonth}`)
      const allPayouts = res.data.payouts || []
      
      const payouts = allPayouts.filter(p => 
        p.employee_id === parseInt(selectedEmployee)
      )
      
      const employee = employees.find(e => e.id === parseInt(selectedEmployee))
      
      setReportData({ employee, payouts })
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const createPayout = async () => {
    try {
      setLoading(true)
      
      // CRITICAL: Save selection BEFORE creating payout
      const currentEmp = selectedEmployee
      const currentMonth = selectedMonth
      
      window._FINAL_EMPLOYEE_SELECTION_ = currentEmp
      localStorage.setItem('_final_emp_', currentEmp)
      sessionStorage.setItem('_final_emp_', currentEmp)
      
      const employee = employees.find(e => e.id === parseInt(currentEmp))
      
      if (!employee) {
        toast.error('Employee not found')
        return
      }
      
      await axios.post('/api/payouts', {
        employee_id: parseInt(currentEmp),
        month: currentMonth,
        basic_salary: employee.basic_salary || 25000,
        status: 'pending'
      })
      
      toast.success(`✅ Payout created for ${employee.first_name}!`)
      
      // FORCE SAVE AGAIN after creation
      window._FINAL_EMPLOYEE_SELECTION_ = currentEmp
      localStorage.setItem('_final_emp_', currentEmp)
      sessionStorage.setItem('_final_emp_', currentEmp)
      
      await fetchReportData()
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create payout')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <button 
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Employee Wise Report</h1>
        {/* Debug display - shows current selection */}
        <div className="mt-2 text-sm text-gray-600">
          Current Selection: {selectedEmployee}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => {
                const val = e.target.value
                console.log('🔵 Manual selection:', val)
                setSelectedEmployee(val)
              }}
              className="w-full p-2 border rounded"
            >
              <option value="all">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} (ID: {emp.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              disabled={selectedEmployee === 'all'}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {selectedEmployee !== 'all' && reportData.employee && reportData.payouts.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
          <p className="mb-2">
            No payouts found for {reportData.employee.first_name} in {selectedMonth}
          </p>
          <button
            onClick={createPayout}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ➕ Create Payout
          </button>
        </div>
      )}

      {selectedEmployee !== 'all' && reportData.employee && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {reportData.employee.first_name} {reportData.employee.last_name}
          </h2>
          
          {reportData.payouts.length > 0 ? (
            <div>
              <h3 className="font-medium mb-2">Payout History</h3>
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Month</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payouts.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{p.month}</td>
                      <td className="p-2 text-right">₹{p.net_salary || p.basic_salary}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No payout records found</p>
          )}
        </div>
      )}
    </div>
  )
}