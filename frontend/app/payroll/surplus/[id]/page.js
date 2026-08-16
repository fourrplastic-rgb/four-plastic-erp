'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  UserIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function PayoutDetail() {
  const router = useRouter()
  const params = useParams()
  const payoutId = params.id

  const [loading, setLoading] = useState(true)
  const [payout, setPayout] = useState(null)
  const [employee, setEmployee] = useState(null)

  // Company Information
  const companyInfo = {
    name: 'FOUR (R) PLASTIC',
    address: '90 FEET ROAD, WIRE GALI, KHADI NO. 3',
    landmark: 'NEAR NATIONAL CHEMIST',
    area: 'SAKINAKA',
    city: 'MUMBAI - 400072',
    gst: 'GST: 27ABTPV9432F1ZX',
    phone: '+91 98765 43210',
    email: 'fourrplastic@gmail.com'
  }

  useEffect(() => {
    checkAuth()
    fetchPayoutData()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchPayoutData = async () => {
    try {
      setLoading(true)
      
      // Fetch payout details
      const payoutRes = await axios.get(`/api/payouts/${payoutId}`)
      const payoutData = payoutRes.data.payout || payoutRes.data
      setPayout(payoutData)
      
      // Fetch employee details
      if (payoutData.employee_id) {
        const empRes = await axios.get(`/api/employees/${payoutData.employee_id}`)
        setEmployee(empRes.data.employee || empRes.data)
      }
      
    } catch (error) {
      console.error('Error fetching payout:', error)
      toast.error('Failed to fetch payout details')
      router.push('/payroll/surplus')
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
            <title>Payslip - ${employee?.first_name} ${employee?.last_name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              h2 { color: #666; margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f0f0f0; padding: 8px; border: 1px solid #ccc; text-align: left; }
              td { padding: 6px; border: 1px solid #ccc; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .company-info { text-align: center; margin-bottom: 30px; }
              .employee-info { margin: 20px 0; }
              .amount-table { width: 50%; margin: 20px auto; }
              .total-row { font-weight: bold; background: #f5f5f5; }
              .text-right { text-align: right; }
              .footer { margin-top: 30px; text-align: center; color: #999; }
              .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="company-info">
              <h1>${companyInfo.name}</h1>
              <p>${companyInfo.address}, ${companyInfo.landmark}</p>
              <p>${companyInfo.area}, ${companyInfo.city}</p>
              <p>GST: ${companyInfo.gst} | Phone: ${companyInfo.phone}</p>
            </div>
            
            <h2>PAYSLIP - ${payout?.month || ''}</h2>
            
            <div class="employee-info">
              <table>
                <tr>
                  <td><strong>Employee Name:</strong> ${employee?.first_name || ''} ${employee?.last_name || ''}</td>
                  <td><strong>Employee Code:</strong> ${employee?.employee_code || ''}</td>
                </tr>
                <tr>
                  <td><strong>Department:</strong> ${employee?.department || 'N/A'}</td>
                  <td><strong>Designation:</strong> ${employee?.designation || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>PAN Number:</strong> ${employee?.pan_number || 'N/A'}</td>
                  <td><strong>Bank Account:</strong> ${employee?.bank_account || 'N/A'}</td>
                </tr>
              </table>
            </div>
            
            <h3>Salary Details</h3>
            <table class="amount-table">
              <tr>
                <th>Earnings</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
              <tr>
                <td>Basic Salary</td>
                <td class="text-right">${(payout?.basic_salary || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>HRA</td>
                <td class="text-right">${(payout?.hra || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Conveyance</td>
                <td class="text-right">${(payout?.conveyance || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Medical Allowance</td>
                <td class="text-right">${(payout?.medical || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Special Allowance</td>
                <td class="text-right">${(payout?.special_allowance || 0).toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>Total Earnings</td>
                <td class="text-right">${(payout?.total_earnings || 0).toLocaleString()}</td>
              </tr>
            </table>
            
            <table class="amount-table">
              <tr>
                <th>Deductions</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
              <tr>
                <td>PF Deduction</td>
                <td class="text-right">${(payout?.pf_deduction || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Professional Tax</td>
                <td class="text-right">${(payout?.pt_deduction || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Advance Deduction</td>
                <td class="text-right">${(payout?.advance_deduction || 0).toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>Total Deductions</td>
                <td class="text-right">${(payout?.total_deductions || 0).toLocaleString()}</td>
              </tr>
            </table>
            
            <table class="amount-table">
              <tr class="total-row">
                <td><strong>NET SALARY</strong></td>
                <td class="text-right"><strong>₹${(payout?.net_salary || 0).toLocaleString()}</strong></td>
              </tr>
            </table>
            
            <div class="signature">
              <div>
                <p>Employee Signature</p>
                <p>____________________</p>
              </div>
              <div>
                <p>Authorized Signatory</p>
                <p>____________________</p>
                <p>For ${companyInfo.name}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is a computer generated payslip - No signature required</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToPDF = () => {
    // In a real app, you'd use a library like jspdf
    // For now, just use print
    handlePrint()
  }

  const formatCurrency = (num) => {
    if (!num && num !== 0) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4" /> Paid
        </span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm flex items-center gap-1">
          <ClockIcon className="h-4 w-4" /> Pending
        </span>
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payout details...</p>
        </div>
      </div>
    )
  }

  if (!payout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Payout Not Found</h3>
          <Link
            href="/payroll/surplus"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Payouts
          </Link>
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
                <Link
                  href="/payroll/surplus"
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <BanknotesIcon className="h-8 w-8 text-pink-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Payout Details</h1>
                  <p className="text-white/50 text-sm">{payout.payout_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20  text-white rounded-lg hover:bg-white/20"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600  text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print Payslip
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Company Header */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-t-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white">{companyInfo.name}</h2>
            <p className="text-white/70 text-sm">{companyInfo.address}, {companyInfo.landmark}</p>
            <p className="text-white/70 text-sm">{companyInfo.area}, {companyInfo.city}</p>
            <div className="flex justify-center gap-4 mt-2 text-xs text-white/50">
              <span>{companyInfo.gst}</span>
              <span>{companyInfo.phone}</span>
              <span>{companyInfo.email}</span>
            </div>
          </div>

          {/* Payout Info */}
          <div className="bg-white/10 backdrop-blur-xl border-x border-white/20 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">Salary Payslip</h3>
                <p className="text-white/50 text-sm">Month: {payout.month}</p>
              </div>
              {getStatusBadge(payout.status)}
            </div>
          </div>

          {/* Employee Details */}
          <div className="bg-white/10 backdrop-blur-xl border-x border-white/20 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-pink-400" />
              Employee Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/50 text-xs">Employee Name</p>
                <p className="text-white font-medium">
                  {employee?.first_name} {employee?.last_name}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Employee Code</p>
                <p className="text-white">{employee?.employee_code}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Department</p>
                <p className="text-white">{employee?.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Designation</p>
                <p className="text-white">{employee?.designation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">PAN Number</p>
                <p className="text-white">{employee?.pan_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Bank Account</p>
                <p className="text-white">{employee?.bank_account || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">IFSC Code</p>
                <p className="text-white">{employee?.ifsc_code || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="bg-white/10 backdrop-blur-xl border-x border-white/20 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CurrencyRupeeIcon className="h-5 w-5 text-pink-400" />
              Salary Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Basic Salary</span>
                    <span className="text-white">{formatCurrency(payout.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">HRA</span>
                    <span className="text-white">{formatCurrency(payout.hra || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Conveyance</span>
                    <span className="text-white">{formatCurrency(payout.conveyance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Medical Allowance</span>
                    <span className="text-white">{formatCurrency(payout.medical || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Special Allowance</span>
                    <span className="text-white">{formatCurrency(payout.special_allowance || 0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total Earnings</span>
                      <span className="text-green-400">{formatCurrency(payout.total_earnings || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">PF Deduction</span>
                    <span className="text-white">{formatCurrency(payout.pf_deduction || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Professional Tax</span>
                    <span className="text-white">{formatCurrency(payout.pt_deduction || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Advance Deduction</span>
                    <span className="text-white">{formatCurrency(payout.advance_deduction || 0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total Deductions</span>
                      <span className="text-red-400">{formatCurrency(payout.total_deductions || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/70 text-sm">Net Salary</p>
                  <p className="text-white text-3xl font-bold">{formatCurrency(payout.net_salary)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm">Payment Status</p>
                  <p className="text-white text-lg">{getStatusBadge(payout.status)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-b-xl p-4 text-center text-white/30 text-xs">
            <p>This is a computer generated payslip - No signature required</p>
            <p>Generated on: {formatDate(new Date())}</p>
          </div>
        </main>
      </div>
    </div>
  )
}