'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PrinterIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function ViewPayslip() {
  const router = useRouter()
  const params = useParams()
  const payslipId = params.id
  const printRef = useRef()

  const [loading, setLoading] = useState(true)
  const [payslip, setPayslip] = useState(null)
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
    fetchPayslip()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchPayslip = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/payslips/${payslipId}`)
      setPayslip(response.data.payslip || response.data)
    } catch (error) {
      console.error('Error fetching payslip:', error)
      toast.error('Failed to fetch payslip')
      router.push('/payroll/payslips')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${payslip?.employee_name} - ${getMonthName(payslip?.month)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .payslip { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; color: #333; }
              .company-details { color: #666; font-size: 12px; }
              .title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
              .employee-details { margin-bottom: 20px; }
              .details-table { width: 100%; border-collapse: collapse; }
              .details-table td { padding: 8px; border: 1px solid #ddd; }
              .details-table th { padding: 8px; background: #f0f0f0; border: 1px solid #ddd; text-align: left; }
              .amount-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .amount-table td { padding: 8px; border: 1px solid #ddd; }
              .amount-table th { padding: 8px; background: #f0f0f0; border: 1px solid #ddd; }
              .total-row { font-weight: bold; background: #f9f9f9; }
              .net-salary { font-size: 18px; font-weight: bold; color: #2c3e50; }
              .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
              .signature { margin-top: 40px; display: flex; justify-content: space-between; }
              .signature-line { width: 200px; border-top: 1px solid #333; margin-top: 30px; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSendEmail = async () => {
    try {
      await axios.post(`/api/payslips/${payslipId}/send-email`)
      toast.success('Payslip sent via email')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }
  }

  const handleWhatsAppShare = () => {
    if (!payslip) return
    const text = `*Payslip - FOUR (R) PLASTIC*\n\nEmployee: ${payslip.employee_name}\nMonth: ${getMonthName(payslip.month)}\nNet Salary: ${formatCurrency(payslip.net_salary)}\n\nYour payslip has been generated successfully.`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const numberToWords = (num) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    const convert = (n) => {
      if (n < 10) return units[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '')
      if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
      return 'Number too large'
    }

    if (!num) return 'Zero'
    const amount = Math.round(num)
    if (amount >= 100000) {
      const lakhs = Math.floor(amount / 100000)
      const remainder = amount % 100000
      return convert(lakhs) + ' Lakh' + (lakhs > 1 ? 's' : '') + (remainder ? ' ' + convert(remainder) : '')
    }
    return convert(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payslip...</p>
        </div>
      </div>
    )
  }

  if (!payslip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Payslip Not Found</h3>
          <Link
            href="/payroll/payslips"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20  border border-pink-500/30 rounded-lg text-pink-400  hover:bg-pink-500/30 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Payslips
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
                  href="/payroll/payslips"
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">Payslip</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30  text-blue-400 rounded-lg hover:bg-blue-500/30"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                  Email
                </button>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Payslip Content */}
          <div ref={printRef} className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Company Header */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">{companyInfo.name}</h1>
                  <p className="text-pink-100 mt-1">{companyInfo.address}</p>
                  <p className="text-pink-100">{companyInfo.landmark}</p>
                  <p className="text-pink-100">{companyInfo.area}, {companyInfo.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-pink-100 text-sm">{companyInfo.gst}</p>
                  <p className="text-pink-100 text-sm">{companyInfo.phone}</p>
                  <p className="text-pink-100 text-sm">{companyInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Payslip Title */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 text-center">SALARY SLIP</h2>
              <p className="text-gray-600 text-center">{getMonthName(payslip.month)}</p>
            </div>

            {/* Employee Details */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Employee Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Employee Name</p>
                  <p className="text-gray-800 font-medium">{payslip.employee_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Employee Code</p>
                  <p className="text-gray-800 font-medium">{payslip.employee_code}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Department</p>
                  <p className="text-gray-800 font-medium">{payslip.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Designation</p>
                  <p className="text-gray-800 font-medium">{payslip.designation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">PAN Number</p>
                  <p className="text-gray-800 font-medium">{payslip.pan_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Bank Account</p>
                  <p className="text-gray-800 font-medium">{payslip.bank_account || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Working Days</p>
                  <p className="text-gray-800 font-medium">{payslip.working_days || '26'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Pay Date</p>
                  <p className="text-gray-800 font-medium">{formatDate(payslip.pay_date) || formatDate(new Date())}</p>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Earnings</h3>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 text-gray-600">Basic Salary</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.basic_salary)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">House Rent Allowance</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.hra || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Conveyance Allowance</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.conveyance || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Medical Allowance</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.medical || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Special Allowance</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.special_allowance || 0)}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-2 font-semibold text-gray-700">Total Earnings</td>
                        <td className="py-2 font-bold text-green-600 text-right">{formatCurrency(payslip.total_earnings || payslip.total_allowances || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Deductions</h3>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 text-gray-600">Provident Fund</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.pf_deduction || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Professional Tax</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.pt_deduction || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Income Tax</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.tax_deduction || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Advance Deduction</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.advance_deduction || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Attendance Deduction</td>
                        <td className="py-2 text-gray-800 text-right font-medium">{formatCurrency(payslip.attendance_deduction || 0)}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-2 font-semibold text-gray-700">Total Deductions</td>
                        <td className="py-2 font-bold text-red-600 text-right">{formatCurrency(payslip.total_deductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Salary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">Net Salary (in words)</p>
                    <p className="text-gray-800 font-medium">{numberToWords(payslip.net_salary)} Rupees Only</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Net Salary</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(payslip.net_salary)}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              {payslip.attendance && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Attendance Summary</h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-sm">
                    <div>
                      <p className="text-blue-600">Present</p>
                      <p className="font-bold">{payslip.attendance.present || 0}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Absent</p>
                      <p className="font-bold">{payslip.attendance.absent || 0}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Late</p>
                      <p className="font-bold">{payslip.attendance.late || 0}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Half Day</p>
                      <p className="font-bold">{payslip.attendance.halfDay || 0}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Leave</p>
                      <p className="font-bold">{payslip.attendance.leave || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Employee Signature</p>
                  <div className="w-40 border-t border-gray-400 mt-8"></div>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Authorized Signatory</p>
                  <div className="w-40 border-t border-gray-400 mt-8"></div>
                  <p className="text-xs text-gray-400 mt-1">For {companyInfo.name}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 text-center text-xs text-gray-500">
              <p>This is a computer generated payslip - No signature required</p>
              <p>Generated on: {formatDate(new Date())}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}