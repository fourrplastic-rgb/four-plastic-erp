'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  EyeIcon,
  UserIcon  // Added for Employee Wise Report
} from '@heroicons/react/24/outline'

export default function PayrollReports() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalSalary: 0,
    totalAdvances: 0,
    totalPayouts: 0,
    avgSalary: 0,
    pendingAdvances: 0
  })

  useEffect(() => {
    checkAuth()
    fetchSummary()
  }, [selectedMonth])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchSummary = async () => {
    try {
      setLoading(true)
      
      // Fetch employees
      const empRes = await axios.get('/api/employees')
      const employees = empRes.data.employees || empRes.data || []
      
      // Fetch advances
      const advRes = await axios.get('/api/advances')
      const advances = advRes.data.advances || advRes.data || []
      
      // Fetch payouts for selected month
      const payRes = await axios.get(`/api/payouts?month=${selectedMonth}`)
      const payouts = payRes.data.payouts || payRes.data || []
      
      // Calculate summary
      const totalSalary = payouts.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0)
      const totalAdvances = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
      const pendingAdvances = advances
        .filter(a => a.status === 'pending')
        .reduce((sum, a) => sum + (parseFloat(a.balance) || parseFloat(a.amount) || 0), 0)
      const totalPayouts = payouts.length
      const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0

      setSummary({
        totalEmployees: employees.length,
        totalSalary: totalSalary,
        totalAdvances: totalAdvances,
        totalPayouts: totalPayouts,
        avgSalary: avgSalary,
        pendingAdvances: pendingAdvances
      })
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num) => {
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

  const reportCategories = [
    {
      title: 'Salary Reports',
      icon: <CurrencyRupeeIcon className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-600',
      reports: [
        {
          name: 'Salary Register',
          description: 'Complete monthly salary details with earnings and deductions',
          href: '/payroll/reports/salary-register',
          icon: <DocumentTextIcon className="h-8 w-8" />
        },
        {
          name: 'Employee Wise Report',
          description: 'Monthly and period-wise report for individual employees',
          href: '/payroll/reports/employee-wise',
          icon: <UserIcon className="h-8 w-8" />
        },
        {
          name: 'Payslip Summary',
          description: 'Summary of all payslips for the month',
          href: '/payroll/reports/payslip-summary',
          icon: <DocumentArrowDownIcon className="h-8 w-8" />
        },
        {
          name: 'Bank Statement',
          description: 'Bank-wise salary transfer details',
          href: '/payroll/reports/bank-statement',
          icon: <BanknotesIcon className="h-8 w-8" />
        }
      ]
    },
    {
      title: 'Attendance Reports',
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-600',
      reports: [
        {
          name: 'Daily Attendance',
          description: 'Day-wise attendance summary',
          href: '/payroll/attendance/report',
          icon: <CalendarIcon className="h-8 w-8" />
        },
        {
          name: 'Monthly Attendance',
          description: 'Employee-wise monthly attendance',
          href: '/payroll/reports/monthly-attendance',
          icon: <ChartBarIcon className="h-8 w-8" />
        },
        {
          name: 'Leave Summary',
          description: 'Leave balance and usage report',
          href: '/payroll/reports/leave-summary',
          icon: <ClockIcon className="h-8 w-8" />
        }
      ]
    },
    {
      title: 'Advance Reports',
      icon: <CurrencyRupeeIcon className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-600',
      reports: [
        {
          name: 'Advance Register',
          description: 'Complete advance transaction history',
          href: '/payroll/reports/advance-register',
          icon: <DocumentTextIcon className="h-8 w-8" />
        },
        {
          name: 'Pending Advances',
          description: 'List of pending advance recoveries',
          href: '/payroll/reports/pending-advances',
          icon: <ClockIcon className="h-8 w-8" />
        },
        {
          name: 'Employee-wise Advances',
          description: 'Advance summary by employee',
          href: '/payroll/reports/employee-advances',
          icon: <UserGroupIcon className="h-8 w-8" />
        }
      ]
    },
    {
      title: 'Tax Reports',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-600',
      reports: [
        {
          name: 'TDS Statement',
          description: 'Monthly TDS deduction summary',
          href: '/payroll/reports/tds-statement',
          icon: <DocumentArrowDownIcon className="h-8 w-8" />
        },
        {
          name: 'PF Statement',
          description: 'Provident Fund contribution report',
          href: '/payroll/reports/pf-statement',
          icon: <BanknotesIcon className="h-8 w-8" />
        },
        {
          name: 'Form 16 Data',
          description: 'Annual tax deduction data',
          href: '/payroll/reports/form16',
          icon: <DocumentTextIcon className="h-8 w-8" />
        }
      ]
    }
  ]

  const quickStats = [
    {
      label: 'Total Employees',
      value: summary.totalEmployees,
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Total Salary',
      value: formatCurrency(summary.totalSalary),
      icon: <CurrencyRupeeIcon className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      label: 'Total Advances',
      value: formatCurrency(summary.totalAdvances),
      icon: <BanknotesIcon className="h-6 w-6" />,
      color: 'bg-yellow-500'
    },
    {
      label: 'Pending Advances',
      value: formatCurrency(summary.pendingAdvances),
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'bg-red-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading reports...</p>
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
                <ChartBarIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Payroll Reports</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <CalendarIcon className="h-5 w-5 text-pink-400" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none text-sm"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>
                <button
                  onClick={fetchSummary}
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
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className="text-white text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg bg-opacity-20`}>
                    <div className="text-white">{stat.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Report Categories */}
          <div className="space-y-8">
            {reportCategories.map((category, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-20`}>
                    {category.icon}
                  </div>
                  <h2 className="text-white text-xl font-semibold">{category.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {category.reports.map((report, reportIdx) => (
                    <Link
                      key={reportIdx}
                      href={report.href}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-20 text-white`}>
                          {report.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium group-hover:text-pink-400 transition-colors">
                            {report.name}
                          </h3>
                          <p className="text-white/50 text-sm mt-1">{report.description}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <span className="text-pink-400 flex items-center gap-1">
                              <EyeIcon className="h-3 w-3" />
                              View Report
                            </span>
                            <span className="text-white/30">|</span>
                            <span className="text-green-400 flex items-center gap-1">
                              <PrinterIcon className="h-3 w-3" />
                              Print
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Reports Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year to Date Summary */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-pink-400" />
                Year to Date Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Total Salary Paid</span>
                  <span className="text-white font-bold">₹52,50,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Total Tax Deducted</span>
                  <span className="text-white font-bold">₹4,20,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Total PF Contribution</span>
                  <span className="text-white font-bold">₹6,30,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Total Advances Given</span>
                  <span className="text-white font-bold">₹3,75,000</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <DocumentArrowDownIcon className="h-5 w-5 text-pink-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/payroll/reports/salary-register"
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <PrinterIcon className="h-5 w-5 text-pink-400 mb-2" />
                  <p className="text-white text-sm font-medium">Salary Register</p>
                  <p className="text-white/50 text-xs">View & Print</p>
                </Link>
                <Link
                  href="/payroll/reports/employee-wise"
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <UserIcon className="h-5 w-5 text-blue-400 mb-2" />
                  <p className="text-white text-sm font-medium">Employee Wise</p>
                  <p className="text-white/50 text-xs">Individual reports</p>
                </Link>
                <Link
                  href="/payroll/attendance/report"
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 text-green-400 mb-2" />
                  <p className="text-white text-sm font-medium">Attendance</p>
                  <p className="text-white/50 text-xs">Day-wise summary</p>
                </Link>
                <Link
                  href="/payroll/reports/advance-register"
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <ChartBarIcon className="h-5 w-5 text-yellow-400 mb-2" />
                  <p className="text-white text-sm font-medium">Advances</p>
                  <p className="text-white/50 text-xs">View advances</p>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}