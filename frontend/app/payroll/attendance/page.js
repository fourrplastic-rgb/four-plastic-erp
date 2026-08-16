'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PrinterIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    total: 0
  })

  useEffect(() => {
    checkAuth()
    fetchEmployees()
    fetchAttendance()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance()
    }
  }, [selectedDate])

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
      setEmployees(employeeData.filter(e => e.status === 'active'))
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/attendance?date=${selectedDate}`)
      const attendanceData = response.data.attendance || response.data || []
      setAttendance(attendanceData)
      
      // Calculate stats
      setStats({
        present: attendanceData.filter(a => a.status === 'present').length,
        absent: attendanceData.filter(a => a.status === 'absent').length,
        late: attendanceData.filter(a => a.status === 'late').length,
        halfDay: attendanceData.filter(a => a.status === 'halfday').length,
        leave: attendanceData.filter(a => a.status === 'leave').length,
        total: attendanceData.length
      })
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (employeeId, status, checkIn = null, checkOut = null) => {
    try {
      const data = {
        employee_id: employeeId,
        date: selectedDate,
        status,
        check_in: checkIn,
        check_out: checkOut
      }
      
      await axios.post('/api/attendance', data)
      toast.success('Attendance marked successfully')
      fetchAttendance()
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
    }
  }

  const updateAttendance = async (attendanceId, data) => {
    try {
      await axios.put(`/api/attendance/${attendanceId}`, data)
      toast.success('Attendance updated')
      fetchAttendance()
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance')
    }
  }

  const getEmployeeAttendance = (employeeId) => {
    return attendance.find(a => a.employee_id === employeeId)
  }

  const filteredEmployees = employees.filter(emp => 
    emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'absent': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'late': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'halfday': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'leave': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const handleBulkMark = (status) => {
    filteredEmployees.forEach(emp => {
      const existing = getEmployeeAttendance(emp.id)
      if (!existing) {
        markAttendance(emp.id, status)
      }
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report - ${selectedDate}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              h2 { color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f0f0f0; padding: 8px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin: 20px 0; }
              .stat-card { background: #f9f9f9; padding: 10px; border-radius: 5px; text-align: center; }
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
                <p>Date: ${new Date(selectedDate).toLocaleDateString('en-IN')}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <h1>Daily Attendance Report</h1>
            
            <div class="stats">
              <div class="stat-card"><strong>Present</strong><br>${stats.present}</div>
              <div class="stat-card"><strong>Absent</strong><br>${stats.absent}</div>
              <div class="stat-card"><strong>Late</strong><br>${stats.late}</div>
              <div class="stat-card"><strong>Half Day</strong><br>${stats.halfDay}</div>
              <div class="stat-card"><strong>Leave</strong><br>${stats.leave}</div>
              <div class="stat-card"><strong>Total</strong><br>${stats.total}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEmployees.map(emp => {
                  const att = getEmployeeAttendance(emp.id)
                  return `
                    <tr>
                      <td>${emp.employee_code}</td>
                      <td>${emp.first_name} ${emp.last_name}</td>
                      <td>${emp.department || '-'}</td>
                      <td>${att?.check_in || '-'}</td>
                      <td>${att?.check_out || '-'}</td>
                      <td>${att?.hours || '-'}</td>
                      <td class="${att?.status || 'absent'}">${att?.status || 'Absent'}</td>
                    </tr>
                  `
                }).join('')}
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading attendance...</p>
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
                <CalendarIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Daily Attendance</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAttendance}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  href="/payroll/attendance/report"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  Reports
                </Link>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Date Selection and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date Picker */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <label className="block text-white/70 text-sm mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white  text-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                style={{ backgroundColor: '#1f2937' }}
              />
            </div>

            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h3 className="text-white/70 text-sm mb-3">Today's Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-green-400 text-2xl font-bold">{stats.present}</p>
                  <p className="text-white/50 text-xs">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-red-400 text-2xl font-bold">{stats.absent}</p>
                  <p className="text-white/50 text-xs">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 text-2xl font-bold">{stats.late}</p>
                  <p className="text-white/50 text-xs">Late</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-400 text-2xl font-bold">{stats.halfDay}</p>
                  <p className="text-white/50 text-xs">Half Day</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 text-2xl font-bold">{stats.leave}</p>
                  <p className="text-white/50 text-xs">Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                  <p className="text-white/50 text-xs">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Bulk Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkMark('present')}
                  className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleBulkMark('absent')}
                  className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                type="text"
                placeholder="Search employees by name, code, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {filteredEmployees.length} employees
          </div>

          {/* Attendance Table */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Emp Code</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Department</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Check In</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Check Out</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Hours</th>
                    <th className="px-4 py-3 text-left text-white/60 text-sm">Status</th>
                    <th className="px-4 py-3 text-right text-white/60 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredEmployees.map((employee) => {
                    const att = getEmployeeAttendance(employee.id)
                    return (
                      <tr key={employee.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white font-mono text-sm">
                          {employee.employee_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-400 text-sm font-semibold">
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {employee.first_name} {employee.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-sm">
                          {employee.department || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={att?.check_in || ''}
                            onChange={(e) => {
                              if (att) {
                                updateAttendance(att.id, { ...att, check_in: e.target.value })
                              } else {
                                markAttendance(employee.id, 'present', e.target.value, null)
                              }
                            }}
                            className="w-24 px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                            style={{ backgroundColor: '#1f2937' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={att?.check_out || ''}
                            onChange={(e) => {
                              if (att) {
                                updateAttendance(att.id, { ...att, check_out: e.target.value })
                              }
                            }}
                            disabled={!att}
                            className="w-24 px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
                            style={{ backgroundColor: '#1f2937' }}
                          />
                        </td>
                        <td className="px-4 py-3 text-white text-sm">
                          {att?.hours || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={att?.status || 'absent'}
                            onChange={(e) => {
                              if (att) {
                                updateAttendance(att.id, { ...att, status: e.target.value })
                              } else {
                                markAttendance(employee.id, e.target.value)
                              }
                            }}
                            className={`px-2 py-1 rounded border text-sm ${getStatusColor(att?.status || 'absent')}`}
                            style={{ backgroundColor: '#1f2937' }}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="halfday">Half Day</option>
                            <option value="leave">Leave</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {att && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this attendance record?')) {
                                  axios.delete(`/api/attendance/${att.id}`)
                                    .then(() => {
                                      toast.success('Attendance deleted')
                                      fetchAttendance()
                                    })
                                    .catch(() => toast.error('Failed to delete'))
                                }
                              }}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 mx-auto mb-3 text-white/20" />
                <p className="text-white/50">No active employees found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}