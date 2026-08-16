'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  PrinterIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function AttendanceReport() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [departments, setDepartments] = useState([])
  const [summary, setSummary] = useState({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    attendancePercentage: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchAttendanceData()
  }, [])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchAttendanceData()
    }
  }, [dateRange, selectedEmployee, selectedDepartment])

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
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      let url = `/api/attendance/report?from=${dateRange.from}&to=${dateRange.to}`
      
      if (selectedEmployee !== 'all') {
        url += `&employee_id=${selectedEmployee}`
      }
      if (selectedDepartment !== 'all') {
        url += `&department=${selectedDepartment}`
      }
      
      const response = await axios.get(url)
      const data = response.data.attendance || response.data || []
      setAttendanceData(data)
      
      // Calculate summary
      const totalDays = data.length
      const present = data.filter(a => a.status === 'present').length
      const absent = data.filter(a => a.status === 'absent').length
      const late = data.filter(a => a.status === 'late').length
      const halfDay = data.filter(a => a.status === 'halfday').length
      const leave = data.filter(a => a.status === 'leave').length
      
      setSummary({
        totalDays,
        present,
        absent,
        late,
        halfDay,
        leave,
        attendancePercentage: totalDays > 0 ? ((present + late + halfDay) / totalDays * 100).toFixed(2) : 0
      })
    } catch (error) {
      console.error('Error fetching attendance report:', error)
      toast.error('Failed to fetch attendance report')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              h2 { color: #666; margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f0f0f0; padding: 8px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
              .summary-card { background: #f9f9f9; padding: 10px; border-radius: 5px; }
              .summary-label { color: #666; font-size: 12px; }
              .summary-value { font-size: 18px; font-weight: bold; }
              .present { color: green; }
              .absent { color: red; }
              .late { color: orange; }
              .footer { margin-top: 30px; text-align: center; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>FOUR (R) PLASTIC</h2>
              <div>
                <p>Period: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <h1>Attendance Report</h1>
            
            <div class="summary">
              <div class="summary-card">
                <div class="summary-label">Total Days</div>
                <div class="summary-value">${summary.totalDays}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Present</div>
                <div class="summary-value present">${summary.present}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Absent</div>
                <div class="summary-value absent">${summary.absent}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Attendance %</div>
                <div class="summary-value">${summary.attendancePercentage}%</div>
              </div>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="summary-label">Late</div>
                <div class="summary-value late">${summary.late}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Half Day</div>
                <div class="summary-value">${summary.halfDay}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Leave</div>
                <div class="summary-value">${summary.leave}</div>
              </div>
            </div>
            
            <h2>Detailed Attendance</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceData.map(record => `
                  <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.employee_name || 'N/A'}</td>
                    <td>${record.department || '-'}</td>
                    <td>${record.check_in || '-'}</td>
                    <td>${record.check_out || '-'}</td>
                    <td>${record.hours || '-'}</td>
                    <td class="${record.status}">${record.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This is a computer generated report</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Hours', 'Status']
    const csvData = attendanceData.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.employee_name || 'N/A',
      record.department || '-',
      record.check_in || '-',
      record.check_out || '-',
      record.hours || '-',
      record.status
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${dateRange.from}_to_${dateRange.to}.csv`
    a.click()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading report...</p>
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
                  onClick={() => router.push('/payroll/attendance')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <ChartBarIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Attendance Report</h1>
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
                  Print Report
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
              Filter Report
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white  focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Days</p>
              <p className="text-white text-2xl font-bold">{summary.totalDays}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Present</p>
              <p className="text-white text-2xl font-bold">{summary.present}</p>
            </div>
            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Absent</p>
              <p className="text-white text-2xl font-bold">{summary.absent}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Attendance %</p>
              <p className="text-white text-2xl font-bold">{summary.attendancePercentage}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-sm">Late Arrivals</p>
              <p className="text-white text-2xl font-bold">{summary.late}</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <p className="text-orange-400 text-sm">Half Days</p>
              <p className="text-white text-2xl font-bold">{summary.halfDay}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 text-sm">Leaves</p>
              <p className="text-white text-2xl font-bold">{summary.leave}</p>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-pink-400" />
                Attendance Records ({attendanceData.length} entries)
              </h2>
              <span className="text-white/50 text-sm">
                Period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Date</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Department</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Check In</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Check Out</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Hours</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {attendanceData.length > 0 ? (
                    attendanceData.map((record, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{formatDate(record.date)}</td>
                        <td className="px-4 py-3 text-white">{record.employee_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-white/70">{record.department || '-'}</td>
                        <td className="px-4 py-3 text-white/70">{record.check_in || '-'}</td>
                        <td className="px-4 py-3 text-white/70">{record.check_out || '-'}</td>
                        <td className="px-4 py-3 text-white">{record.hours || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'present' ? 'bg-green-500/20 text-green-400' :
                            record.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                            record.status === 'late' ? 'bg-yellow-500/20 text-yellow-400' :
                            record.status === 'halfday' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-white/50">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                        No attendance records found for the selected period
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