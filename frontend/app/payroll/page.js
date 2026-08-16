'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  UsersIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function PayrollDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAdvances: 0,
    pendingAdvances: 0,
    totalSurplus: 25000,
    totalPayouts: 450000,
    todayPresent: 0,
    todayAbsent: 0,
    monthlySalary: 850000
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [upcomingPayouts, setUpcomingPayouts] = useState([])
  const [apiStatus, setApiStatus] = useState({
    employees: 'pending',
    advances: 'pending',
    attendance: 'pending'
  })

  useEffect(() => {
    checkAuth()
    fetchDashboardData()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  // Helper function to safely extract data from API responses
  const safeExtract = (response, key = null) => {
    if (!response) return []
    
    // If it's already an array
    if (Array.isArray(response)) return response
    
    // If it's an object
    if (typeof response === 'object') {
      // Check for specific key
      if (key && response[key] && Array.isArray(response[key])) {
        return response[key]
      }
      // Check for common patterns
      if (response.data && Array.isArray(response.data)) return response.data
      if (response.employees && Array.isArray(response.employees)) return response.employees
      if (response.advances && Array.isArray(response.advances)) return response.advances
      if (response.payouts && Array.isArray(response.payouts)) return response.payouts
      
      // If it's an object with numeric keys (like API returns object instead of array)
      if (Object.keys(response).length > 0 && !isNaN(Object.keys(response)[0])) {
        return Object.values(response)
      }
      
      // If it's a single object, wrap in array
      if (response.id || response.employee_code) {
        return [response]
      }
    }
    
    // If all else fails, return empty array
    console.warn('Could not extract array from response:', response)
    return []
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Use Promise.allSettled to handle individual failures
      const [employeesRes, advancesRes, attendanceRes] = await Promise.allSettled([
        axios.get('/api/employees'),
        axios.get('/api/advances'),
        axios.get('/api/attendance/today')
      ])

      // Process employees data
      let employees = []
      let activeEmployees = 0
      if (employeesRes.status === 'fulfilled') {
        employees = safeExtract(employeesRes.value.data, 'employees')
        activeEmployees = employees.filter(e => e?.status === 'active').length
        setApiStatus(prev => ({ ...prev, employees: 'success' }))
      } else {
        console.error('Employees API failed:', employeesRes.reason)
        setApiStatus(prev => ({ ...prev, employees: 'error' }))
        toast.error('Failed to fetch employees data')
      }

      // Process advances data
      let advances = []
      let totalAdvances = 0
      let pendingAdvances = 0
      if (advancesRes.status === 'fulfilled') {
        advances = safeExtract(advancesRes.value.data, 'advances')
        totalAdvances = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
        pendingAdvances = advances.filter(a => a?.status === 'pending').length
        setApiStatus(prev => ({ ...prev, advances: 'success' }))
      } else {
        console.error('Advances API failed:', advancesRes.reason)
        setApiStatus(prev => ({ ...prev, advances: 'error' }))
      }

      // Process attendance data
      let present = 0
      let absent = 0
      if (attendanceRes.status === 'fulfilled') {
        const attendanceData = attendanceRes.value.data || {}
        present = attendanceData.present || 0
        absent = attendanceData.absent || 0
        setApiStatus(prev => ({ ...prev, attendance: 'success' }))
      } else {
        console.error('Attendance API failed:', attendanceRes.reason)
        setApiStatus(prev => ({ ...prev, attendance: 'error' }))
      }

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees,
        totalAdvances: totalAdvances,
        pendingAdvances: pendingAdvances,
        totalSurplus: 25000,
        totalPayouts: 450000,
        todayPresent: present,
        todayAbsent: absent,
        monthlySalary: 850000
      })

      // Generate recent activities from actual data
      const activities = []
      
      // Add advance activities
      advances.slice(0, 2).forEach((advance, index) => {
        if (advance) {
          activities.push({
            id: `advance-${index}`,
            type: 'advance',
            employee: advance.employee_name || `Employee ${advance.employee_id}`,
            amount: advance.amount,
            date: advance.date || new Date().toISOString().split('T')[0],
            status: advance.status || 'pending'
          })
        }
      })

      // Add attendance activity
      if (employees.length > 0) {
        activities.push({
          id: 'attendance-today',
          type: 'attendance',
          employee: `${present} employees`,
          date: new Date().toISOString().split('T')[0],
          status: 'present'
        })
      }

      // Add sample activities if no real data
      if (activities.length === 0) {
        activities.push(
          { id: 1, type: 'advance', employee: 'John Doe', amount: 5000, date: '2024-03-06', status: 'approved' },
          { id: 2, type: 'attendance', employee: 'Jane Smith', date: '2024-03-06', status: 'present' },
          { id: 3, type: 'payslip', employee: 'Mike Johnson', month: 'March 2024', status: 'generated' }
        )
      }
      
      setRecentActivities(activities)

      // Generate upcoming payouts from actual data if available
      const payouts = []
      if (employees.length > 0) {
        employees.slice(0, 3).forEach((emp, index) => {
          if (emp) {
            payouts.push({
              id: `payout-${index}`,
              employee: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
              amount: Math.round((parseFloat(emp.basic_salary) || 25000) * 0.8),
              date: new Date(new Date().setDate(10)).toISOString().split('T')[0],
              status: 'pending'
            })
          }
        })
      }

      // Add sample payouts if no real data
      if (payouts.length === 0) {
        payouts.push(
          { id: 1, employee: 'John Doe', amount: 25000, date: '2024-03-10', status: 'pending' },
          { id: 2, employee: 'Jane Smith', amount: 28000, date: '2024-03-10', status: 'pending' },
          { id: 3, employee: 'Mike Johnson', amount: 32000, date: '2024-03-10', status: 'pending' }
        )
      }
      
      setUpcomingPayouts(payouts)

    } catch (error) {
      console.error('Error in fetchDashboardData:', error)
      toast.error('Failed to load dashboard data')
      
      // Set fallback data
      setRecentActivities([
        { id: 1, type: 'advance', employee: 'John Doe', amount: 5000, date: '2024-03-06', status: 'approved' },
        { id: 2, type: 'attendance', employee: 'Jane Smith', date: '2024-03-06', status: 'present' },
        { id: 3, type: 'payslip', employee: 'Mike Johnson', month: 'March 2024', status: 'generated' }
      ])

      setUpcomingPayouts([
        { id: 1, employee: 'John Doe', amount: 25000, date: '2024-03-10', status: 'pending' },
        { id: 2, employee: 'Jane Smith', amount: 28000, date: '2024-03-10', status: 'pending' },
        { id: 3, employee: 'Mike Johnson', amount: 32000, date: '2024-03-10', status: 'pending' }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payroll dashboard...</p>
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
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <BanknotesIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* API Status Indicators (optional - can be removed) */}
                <div className="flex gap-1 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    apiStatus.employees === 'success' ? 'bg-green-500/20 text-green-400' : 
                    apiStatus.employees === 'error' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    E
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    apiStatus.advances === 'success' ? 'bg-green-500/20 text-green-400' : 
                    apiStatus.advances === 'error' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    A
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    apiStatus.attendance === 'success' ? 'bg-green-500/20 text-green-400' : 
                    apiStatus.attendance === 'error' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    T
                  </span>
                </div>
                <button
                  onClick={fetchDashboardData}
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
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Link
              href="/payroll/employees"
              className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-400 mb-2" />
              <h3 className="text-white font-semibold">Employee Master</h3>
              <p className="text-white/50 text-sm">Manage employees</p>
            </Link>
            
            <Link
              href="/payroll/attendance"
              className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-colors"
            >
              <ClockIcon className="h-8 w-8 text-green-400 mb-2" />
              <h3 className="text-white font-semibold">Attendance</h3>
              <p className="text-white/50 text-sm">Mark attendance</p>
            </Link>
            
            <Link
              href="/payroll/advances"
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-colors"
            >
              <CurrencyRupeeIcon className="h-8 w-8 text-yellow-400 mb-2" />
              <h3 className="text-white font-semibold">Advances</h3>
              <p className="text-white/50 text-sm">Manage advances</p>
            </Link>
            
            <Link
              href="/payroll/surplus"
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-colors"
            >
              <BanknotesIcon className="h-8 w-8 text-purple-400 mb-2" />
              <h3 className="text-white font-semibold">Surplus/Payout</h3>
              <p className="text-white/50 text-sm">Process payouts</p>
            </Link>
            
            <Link
              href="/payroll/payslips"
              className="bg-gradient-to-r from-red-500/10 to-rose-500/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-red-400 mb-2" />
              <h3 className="text-white font-semibold">Payslips</h3>
              <p className="text-white/50 text-sm">Generate payslips</p>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Total Employees</p>
                  <p className="text-white text-2xl font-bold">{stats.totalEmployees}</p>
                  <p className="text-green-400 text-xs mt-1">{stats.activeEmployees} active</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-400/50" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Total Advances</p>
                  <p className="text-white text-2xl font-bold">₹{stats.totalAdvances.toLocaleString()}</p>
                  <p className="text-yellow-400 text-xs mt-1">{stats.pendingAdvances} pending</p>
                </div>
                <CurrencyRupeeIcon className="h-8 w-8 text-yellow-400/50" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Monthly Salary</p>
                  <p className="text-white text-2xl font-bold">₹{stats.monthlySalary.toLocaleString()}</p>
                  <p className="text-purple-400 text-xs mt-1">This month</p>
                </div>
                <BanknotesIcon className="h-8 w-8 text-purple-400/50" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Today's Attendance</p>
                  <p className="text-white text-2xl font-bold">{stats.todayPresent}/{stats.totalEmployees}</p>
                  <p className={`text-xs mt-1 ${stats.todayAbsent > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {stats.todayAbsent} absent
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-400/50" />
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-pink-400" />
                Recent Activities
              </h2>
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{activity.employee}</p>
                        <p className="text-white/50 text-xs">
                          {activity.type === 'advance' && `Advance: ₹${activity.amount}`}
                          {activity.type === 'attendance' && `Attendance: ${activity.status}`}
                          {activity.type === 'payslip' && `Payslip: ${activity.month}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'approved' || activity.status === 'present' || activity.status === 'generated'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-white/50 text-center py-4">No recent activities</p>
                )}
              </div>
            </div>

            {/* Upcoming Payouts */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-pink-400" />
                Upcoming Payouts
              </h2>
              <div className="space-y-3">
                {upcomingPayouts.length > 0 ? (
                  upcomingPayouts.map(payout => (
                    <div key={payout.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{payout.employee}</p>
                        <p className="text-white/50 text-xs">Due: {payout.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">₹{payout.amount.toLocaleString()}</p>
                        <span className="text-xs text-yellow-400">{payout.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/50 text-center py-4">No upcoming payouts</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  href="/payroll/surplus"
                  className="text-pink-400 text-sm hover:text-pink-300 flex items-center justify-center gap-1"
                >
                  Process Payouts
                  <ArrowPathIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/payroll/reports/salary-register"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <div>
                  <h3 className="text-white font-semibold">Salary Register</h3>
                  <p className="text-white/50 text-sm">Monthly salary report</p>
                </div>
              </div>
            </Link>

            <Link
              href="/payroll/attendance/report"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="text-white font-semibold">Attendance Report</h3>
                  <p className="text-white/50 text-sm">Day-wise attendance</p>
                </div>
              </div>
            </Link>

            <Link
              href="/payroll/reports"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">All Reports</h3>
                  <p className="text-white/50 text-sm">View all reports</p>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}