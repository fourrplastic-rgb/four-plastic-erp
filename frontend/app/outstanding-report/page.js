'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { useFinancialYear } from '@/context/FinancialYearContext'
import { exportToCSV } from '@/utils/exportToCSV'

const WhatsAppIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
)

export default function OutstandingReportPage() {
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('customers')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [customDateRange, setCustomDateRange] = useState({
    from_date: '',
    to_date: ''
  })
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [availableYears, setAvailableYears] = useState([])
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  const [expandedVendor, setExpandedVendor] = useState(null)
  const [customerTransactions, setCustomerTransactions] = useState({})
  const [vendorTransactions, setVendorTransactions] = useState({})
  const [customerUnpaidInvoices, setCustomerUnpaidInvoices] = useState({})
  const [vendorUnpaidInvoices, setVendorUnpaidInvoices] = useState({})
  const [loadingTransactions, setLoadingTransactions] = useState({})
  const { selectedYear: activeFY } = useFinancialYear()

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    if (activeFY) {
      fetchData()
    }
  }, [activeFY])

  useEffect(() => {
    if (customers.length > 0) {
      const years = [...new Set(customers.map(c => 
        c.last_transaction ? new Date(c.last_transaction).getFullYear() : null
      ).filter(y => y))].sort((a, b) => b - a)
      setAvailableYears(years)
    }
  }, [customers])

  useEffect(() => {
    filterData()
  }, [searchTerm, selectedYear, selectedMonth, customDateRange, customers, vendors, activeTab, showCustomDate])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const toDate = activeFY ? activeFY.end_date : new Date().toISOString().split('T')[0]
      
      // Fetch customers with outstanding
      const custRes = await axios.get(`/api/customer-ledger/outstanding?to_date=${toDate}`)
      console.log('Customer API Response:', custRes.data)
      
      // FETCH VENDORS DIRECTLY FROM MASTER TABLE (FIXED)
      const vendorsRes = await axios.get(`/api/vendor-ledger/outstanding?to_date=${toDate}`)
      console.log('Vendors from master table:', vendorsRes.data)
      
      // Format vendors for display with outstanding from current_balance
      const vendorData = Array.isArray(vendorsRes.data.vendors) ? vendorsRes.data.vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        code: vendor.code,
        phone: vendor.phone,
        city: vendor.city || '',
        outstanding: vendor.outstanding || 0,
        last_transaction: null // No transaction data available
      })) : []
      
      console.log('Formatted vendor data:', vendorData)
      
      // Handle customer data
      let customerData = []
      if (custRes.data && Array.isArray(custRes.data)) {
        customerData = custRes.data
      } else if (custRes.data && custRes.data.customers && Array.isArray(custRes.data.customers)) {
        customerData = custRes.data.customers
      } else {
        customerData = []
      }
      
      setCustomers(customerData)
      setVendors(vendorData)
      setFilteredCustomers(customerData)
      setFilteredVendors(vendorData)
      
      // Show success message
      toast.success(`Loaded ${vendorData.length} vendors`)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    if (activeTab === 'customers') {
      let filtered = [...customers]

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(c => 
          (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (c.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (c.phone || '').includes(searchTerm)
        )
      }

      setFilteredCustomers(filtered)
    } else {
      // For vendors - simple filtering
      let filtered = [...vendors]

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(v => 
          (v.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (v.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (v.phone || '').includes(searchTerm)
        )
      }

      setFilteredVendors(filtered)
    }
  }

  const fetchCustomerTransactions = async (customerId) => {
    if (customerTransactions[customerId]) {
      setExpandedCustomer(expandedCustomer === customerId ? null : customerId)
      return
    }

    setLoadingTransactions(prev => ({ ...prev, [customerId]: true }))

    try {
      const fromDate = activeFY ? activeFY.start_date : '2000-01-01'
      const toDate = activeFY ? activeFY.end_date : new Date().toISOString().split('T')[0]
      
      const [ledgerRes, openInvsRes] = await Promise.all([
        axios.get(`/api/customer-ledger/${customerId}?from_date=${fromDate}&to_date=${toDate}`),
        axios.get(`/api/customer-payments/open-invoices/${customerId}`)
      ])
      
      setCustomerTransactions(prev => ({ 
        ...prev, 
        [customerId]: ledgerRes.data.transactions ? ledgerRes.data.transactions.slice(-10) : []
      }))
      setCustomerUnpaidInvoices(prev => ({
        ...prev,
        [customerId]: openInvsRes.data || []
      }))
      setExpandedCustomer(expandedCustomer === customerId ? null : customerId)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch details')
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [customerId]: false }))
    }
  }

  const fetchVendorTransactions = async (vendorId) => {
    if (vendorTransactions[vendorId]) {
      setExpandedVendor(expandedVendor === vendorId ? null : vendorId)
      return
    }

    setLoadingTransactions(prev => ({ ...prev, [vendorId]: true }))

    try {
      const fromDate = activeFY ? activeFY.start_date : '2000-01-01'
      const toDate = activeFY ? activeFY.end_date : new Date().toISOString().split('T')[0]
      
      const [ledgerRes, openInvsRes] = await Promise.all([
        axios.get(`/api/vendor-ledger/${vendorId}?from_date=${fromDate}&to_date=${toDate}`),
        axios.get(`/api/vendor-payments/open-invoices/${vendorId}`)
      ])
      
      setVendorTransactions(prev => ({ 
        ...prev, 
        [vendorId]: ledgerRes.data.transactions ? ledgerRes.data.transactions.slice(-10) : []
      }))
      setVendorUnpaidInvoices(prev => ({
        ...prev,
        [vendorId]: openInvsRes.data || []
      }))
      setExpandedVendor(expandedVendor === vendorId ? null : vendorId)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setVendorTransactions(prev => ({ 
        ...prev, 
        [vendorId]: [] 
      }))
      setVendorUnpaidInvoices(prev => ({
        ...prev,
        [vendorId]: []
      }))
      setExpandedVendor(expandedVendor === vendorId ? null : vendorId)
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [vendorId]: false }))
    }
  }

  const applyDateFilter = () => {
    filterData()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedYear('all')
    setSelectedMonth('all')
    setShowCustomDate(false)
    setCustomDateRange({ from_date: '', to_date: '' })
    setFilteredCustomers(customers)
    setFilteredVendors(vendors)
  }

  const handleExportCSV = () => {
    const dataToExport = []
    
    if (activeTab === 'customers') {
      filteredCustomers.forEach(c => {
        dataToExport.push({
          'Type': 'Customer',
          'Name': c.name,
          'Code': c.code,
          'Phone': c.phone || '',
          'City': c.city || '',
          'Outstanding Balance': c.outstanding || 0,
          'Credit Limit': c.credit_limit || 0,
          'Last Transaction': c.last_transaction ? new Date(c.last_transaction).toLocaleDateString() : 'None'
        })
      })
    } else {
      filteredVendors.forEach(v => {
        dataToExport.push({
          'Type': 'Vendor',
          'Name': v.name,
          'Code': v.code,
          'Phone': v.phone || '',
          'City': v.city || '',
          'Outstanding Balance': v.outstanding || 0
        })
      })
    }
    
    exportToCSV(dataToExport, `Outstanding_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV Exported Successfully')
  }

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(num)
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No transactions') return 'No transactions'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const handleWhatsAppPDF = async (id, type, name, phone, e) => {
    e.stopPropagation();
    
    try {
      const toastId = toast.loading(`Generating PDF for ${name}...`);
      
      const fromDate = activeFY ? activeFY.start_date : '2000-01-01';
      const toDate = activeFY ? activeFY.end_date : new Date().toISOString().split('T')[0];
      
      const endpoint = type === 'customer' 
        ? `/api/customer-ledger/${id}?from_date=${fromDate}&to_date=${toDate}`
        : `/api/vendor-ledger/${id}?from_date=${fromDate}&to_date=${toDate}`;
        
      const response = await axios.get(endpoint);
      const ledgerData = response.data;
      
      const transactions = ledgerData.transactions || [];
      const party = type === 'customer' ? ledgerData.customer : ledgerData.vendor;
      
      // Calculate stats
      let totalSales = 0, totalPayments = 0;
      transactions.forEach(t => {
        if (t.transaction_type === 'SALES' || t.transaction_type === 'PURCHASE') totalSales += t.debit || 0;
        if (t.transaction_type === 'PAYMENT' || t.transaction_type === 'RECEIPT') totalPayments += t.credit || 0;
      });
      
      // Generate HTML content (similar to print layout)
      const content = `
        <div id="pdf-content" style="padding: 20px; font-family: 'Inter', sans-serif; color: #1f2937; font-size: 12px; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            <div>
              <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">FOUR (R) PLASTIC</h1>
              <p style="margin: 0 0 2px 0; color: #4b5563; font-size: 11px;">${type === 'customer' ? 'Customer' : 'Vendor'} Ledger Statement</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; color: #3b82f6; margin: 0 0 4px 0; text-transform: uppercase;">Ledger Account</h2>
              <p style="margin: 0; color: #6b7280; font-size: 11px;">Generated on ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div>
              <h3 style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Party Details</h3>
              <p style="margin: 2px 0; font-weight: 600; font-size: 14px; color: #111827;">${party?.name || name}</p>
              <p style="margin: 2px 0; font-family: monospace; color: #6b7280;">${party?.code || ''}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 2px 0; color: #4b5563;"><strong>Period From:</strong> ${formatDate(fromDate)}</p>
              <p style="margin: 2px 0; color: #4b5563;"><strong>Period To:</strong> ${formatDate(toDate)}</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Opening Balance</div>
              <div style="font-size: 16px; font-weight: 600; color: #111827;">${formatCurrency(party?.opening_balance || 0)}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Current Balance</div>
              <div style="font-size: 16px; font-weight: 600; color: ${party?.current_balance > 0 ? '#dc2626' : '#059669'};">${formatCurrency(party?.current_balance || 0)}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total Sales/Purchases</div>
              <div style="font-size: 16px; font-weight: 600; color: #111827;">${formatCurrency(totalSales)}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total Payments</div>
              <div style="font-size: 16px; font-weight: 600; color: #111827;">${formatCurrency(totalPayments)}</div>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
            <thead>
              <tr>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Date</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Type</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Ref No</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Description</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Debit</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Credit</th>
                <th style="background: #f3f4f6; color: #374151; padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${formatDate(fromDate)}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">OPENING</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">-</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">Opening Balance</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">-</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">-</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(party?.opening_balance || 0)}</td>
              </tr>
              ${transactions.map(trans => {
                let desc = trans.description || '-';
                if ((trans.transaction_type === 'SALES' || trans.transaction_type === 'PURCHASE') && trans.items && trans.items.length > 0) {
                  desc = trans.items.map(i => `${i.item_name} (${i.quantity} x ${formatCurrency(i.rate)})`).join('<br/>');
                }
                return `
                  <tr>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">${formatDate(trans.transaction_date)}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">${trans.transaction_type}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-family: monospace;">${trans.reference_no || '-'}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">${desc}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; text-align: right; color: #dc2626;">${trans.debit != null && trans.debit !== 0 ? formatCurrency(trans.debit) : '-'}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; text-align: right; color: #059669;">${trans.credit != null && trans.credit !== 0 ? formatCurrency(trans.credit) : '-'}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; text-align: right; font-weight: 600;">${formatCurrency(trans.balance)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
            <div style="color: #6b7280; font-size: 11px;">This is a computer generated statement.</div>
            <div style="text-align: center; width: 200px; border-top: 1px solid #9ca3af; padding-top: 8px; font-size: 11px; color: #4b5563;">
              For FOUR (R) PLASTIC<br/>Authorised Signatory
            </div>
          </div>
        </div>
      `;

      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = content;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Load html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      const fileName = `Ledger_${name.replace(/\s+/g, '_')}.pdf`;
      
      const opt = {
        margin:       10,
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(container.firstElementChild).save();
      
      // Cleanup
      document.body.removeChild(container);
      
      toast.success('PDF generated! Opening WhatsApp...', { id: toastId });
      
      // Open WhatsApp
      if (phone) {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        const msg = `Dear ${name},\n\nPlease find your attached ledger statement.\n\nThank you,\nFOUR (R) PLASTIC`;
        setTimeout(() => {
          window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
        }, 1000);
      } else {
        toast.error('PDF downloaded! No phone number to open WhatsApp.', { id: toastId });
      }
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  }

  const handleDirectWhatsApp = (name, phone, outstanding, e) => {
    e.stopPropagation();
    
    if (!phone) {
      toast.error('No phone number available');
      return;
    }
    
    const balance = Number(outstanding) || 0;
    const date = new Date().toLocaleDateString('en-IN');
    
    let text = '';
    if (balance > 0) {
      text = `Dear ${name},\n\nThis is a friendly reminder from FOUR (R) PLASTIC regarding your outstanding payment of *${formatCurrency(balance)}* as of ${date}.\n\nPlease arrange to clear the dues at your earliest convenience.\n\nThank you for your business!`;
    } else {
      text = `Dear ${name},\n\nGreetings from FOUR (R) PLASTIC! Your account statement as of ${date} shows a nil or advance balance of *${formatCurrency(Math.abs(balance))}*.\n\nThank you for your business!`;
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading outstanding report...</p>
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
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">Outstanding Report</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 print:hidden"
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 transition-all print:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30 flex items-center gap-2 transition-all print:hidden"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search by name, code, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Year Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  style={{ backgroundColor: '#1f2937' }}
                  disabled={selectedYear === 'all'}
                >
                  <option value="all">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply Filter Button */}
              <button
                onClick={applyDateFilter}
                className="px-4 py-2 bg-pink-500/20 border border-pink-500/30  rounded-lg text-pink-400 hover:bg-pink-500/30 flex items-center justify-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Apply Filter
              </button>
            </div>

            {/* Custom Date Range Toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowCustomDate(!showCustomDate)}
                className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
              >
                <CalendarIcon className="h-4 w-4" />
                {showCustomDate ? 'Hide' : 'Show'} Custom Date Range
              </button>
            </div>

            {/* Custom Date Range */}
            {showCustomDate && (
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="date"
                  value={customDateRange.from_date}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <span className="text-white">to</span>
                <input
                  type="date"
                  value={customDateRange.to_date}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <button
                  onClick={applyDateFilter}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Clear Filters */}
            {(searchTerm || selectedYear !== 'all' || selectedMonth !== 'all' || showCustomDate) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Outstanding</p>
              <p className="text-white text-2xl font-bold">
                {formatCurrency(
                  (activeTab === 'customers' 
                    ? filteredCustomers.reduce((sum, c) => sum + (c.outstanding || 0), 0)
                    : filteredVendors.reduce((sum, v) => sum + (v.outstanding || 0), 0)
                  )
                )}
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total {activeTab === 'customers' ? 'Customers' : 'Vendors'}</p>
              <p className="text-white text-2xl font-bold">
                {activeTab === 'customers' ? filteredCustomers.length : filteredVendors.length}
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Average Outstanding</p>
              <p className="text-white text-2xl font-bold">
                {formatCurrency(
                  (activeTab === 'customers' 
                    ? (filteredCustomers.reduce((sum, c) => sum + (c.outstanding || 0), 0) / (filteredCustomers.length || 1))
                    : (filteredVendors.reduce((sum, v) => sum + (v.outstanding || 0), 0) / (filteredVendors.length || 1))
                  )
                )}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'customers' 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              Customers ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'vendors' 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5" />
              Vendors ({filteredVendors.length})
            </button>
          </div>

          {/* Results Info */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {activeTab === 'customers' ? filteredCustomers.length : filteredVendors.length} of {activeTab === 'customers' ? customers.length : vendors.length} records
          </div>

          {/* Customers List with Transactions */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                  {/* Customer Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => fetchCustomerTransactions(customer.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{customer.name}</h3>
                          <span className="text-white/50 text-sm">({customer.code})</span>
                          {loadingTransactions[customer.id] && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                          {customer.city && (
                            <p className="text-white/50 text-xs flex items-center gap-1">
                              <MapPinIcon className="h-3 w-3" />
                              {customer.city}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-white/50 text-xs flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          )}
                          <p className="text-white/50 text-xs flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Last: {formatDate(customer.last_transaction)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-red-400 font-bold text-lg">
                            {formatCurrency(customer.outstanding)}
                          </p>
                          <p className="text-white/50 text-xs">
                            Limit: {formatCurrency(customer.credit_limit || 0)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDirectWhatsApp(customer.name, customer.phone, customer.outstanding, e)}
                          className="p-2 bg-pink-500/20 rounded-lg text-pink-400 hover:bg-pink-500/30"
                          title="Direct WhatsApp Reminder"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleWhatsAppPDF(customer.id, 'customer', customer.name, customer.phone, e)}
                          className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                          title="Share Ledger PDF via WhatsApp"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </button>
                        <Link
                          href={`/customer-ledger/${customer.id}`}
                          className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        {expandedCustomer === customer.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-white/50" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-white/50" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unpaid Invoices Aging Breakdown */}
                  {expandedCustomer === customer.id && customerUnpaidInvoices[customer.id] && (
                    <div className="border-t border-white/10 p-4 bg-white/5">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-cyan-400" />
                        Unpaid Invoices Breakdown
                      </h4>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60">Invoice No</th>
                              <th className="px-3 py-2 text-left text-white/60">Date</th>
                              <th className="px-3 py-2 text-right text-white/60">Total Amount</th>
                              <th className="px-3 py-2 text-right text-white/60">Paid Amount</th>
                              <th className="px-3 py-2 text-right text-white/60">Balance Due</th>
                              <th className="px-3 py-2 text-center text-white/60">Days Outstanding (Aging)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {customerUnpaidInvoices[customer.id].length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-3 py-4 text-center text-white/30 italic">
                                  No unpaid invoices (outstanding balance may be due to Opening Balance or Journal Entries)
                                </td>
                              </tr>
                            ) : (
                              customerUnpaidInvoices[customer.id].map((inv) => {
                                const daysOut = Math.max(0, Math.ceil((new Date() - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24)))
                                return (
                                  <tr key={inv.id} className="hover:bg-white/5 font-mono">
                                    <td className="px-3 py-2 text-white font-semibold">{inv.invoice_no}</td>
                                    <td className="px-3 py-2">{formatDate(inv.invoice_date)}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(inv.grand_total)}</td>
                                    <td className="px-3 py-2 text-right text-green-400">{formatCurrency(inv.paid_amount)}</td>
                                    <td className="px-3 py-2 text-right text-red-400 font-bold">{formatCurrency(inv.balance)}</td>
                                    <td className="px-3 py-2 text-center align-middle">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        daysOut > 90 
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                          : daysOut > 60 
                                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                          : daysOut > 30
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      }`}>
                                        {daysOut} days
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Transactions Table */}
                  {expandedCustomer === customer.id && customerTransactions[customer.id] && (
                    <div className="border-t border-white/10 p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-pink-400" />
                        Recent Transactions
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60">Date</th>
                              <th className="px-3 py-2 text-left text-white/60">Type</th>
                              <th className="px-3 py-2 text-left text-white/60">Ref / Items</th>
                              <th className="px-3 py-2 text-right text-white/60">Qty</th>
                              <th className="px-3 py-2 text-right text-white/60">Rate</th>
                              <th className="px-3 py-2 text-right text-white/60">Debit</th>
                              <th className="px-3 py-2 text-right text-white/60">Credit</th>
                              <th className="px-3 py-2 text-right text-white/60">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {customerTransactions[customer.id].map((trans, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-white/70 align-top">{formatDate(trans.transaction_date)}</td>
                                <td className="px-3 py-2 align-top">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    trans.transaction_type === 'SALES' 
                                      ? 'bg-blue-500/20 text-blue-400' 
                                      : 'bg-green-500/20 text-green-400'
                                  }`}>
                                    {trans.transaction_type}
                                  </span>
                                </td>
                                
                                {trans.transaction_type === 'SALES' && trans.items && trans.items.length > 0 ? (
                                  <>
                                    <td className="px-3 py-2 align-top">
                                      <div className="text-white/50 font-mono text-xs mb-1">{trans.reference_no}</div>
                                      <div className="space-y-1">
                                        {trans.items.map((item, i) => (
                                          <div key={i} className="text-white text-xs">{item.item_name}</div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-right">
                                      <div className="mt-4 space-y-1">
                                        {trans.items.map((item, i) => (
                                          <div key={i} className="text-yellow-400 text-xs">{item.quantity} {item.unit || ''}</div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-right">
                                      <div className="mt-4 space-y-1">
                                        {trans.items.map((item, i) => (
                                          <div key={i} className="text-green-400 text-xs">{formatCurrency(item.rate)}</div>
                                        ))}
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2 text-white font-mono align-top">{trans.reference_no || trans.description || '-'}</td>
                                    <td className="px-3 py-2 align-top text-right text-white/50">-</td>
                                    <td className="px-3 py-2 align-top text-right text-white/50">-</td>
                                  </>
                                )}

                                <td className="px-3 py-2 text-red-400 text-right align-top">{trans.debit != null && trans.debit !== 0 ? formatCurrency(trans.debit) : '-'}</td>
                                <td className="px-3 py-2 text-green-400 text-right align-top">{trans.credit != null && trans.credit !== 0 ? formatCurrency(trans.credit) : '-'}</td>
                                <td className="px-3 py-2 text-white font-semibold text-right align-top">{formatCurrency(trans.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 text-right">
                        <Link
                          href={`/customer-ledger/${customer.id}`}
                          className="text-sm text-pink-400 hover:text-pink-300"
                        >
                          View Full Ledger →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="text-center py-12 text-white/50">
                  No customers found matching your criteria
                </div>
              )}
            </div>
          )}

          {/* Vendors List with Transactions */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                  {/* Vendor Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => fetchVendorTransactions(vendor.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{vendor.name}</h3>
                          <span className="text-white/50 text-sm">({vendor.code})</span>
                          {loadingTransactions[vendor.id] && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                          {vendor.city && (
                            <p className="text-white/50 text-xs flex items-center gap-1">
                              <MapPinIcon className="h-3 w-3" />
                              {vendor.city}
                            </p>
                          )}
                          {vendor.phone && (
                            <p className="text-white/50 text-xs flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {vendor.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-red-400 font-bold text-lg">
                            {formatCurrency(vendor.outstanding)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDirectWhatsApp(vendor.name, vendor.phone, vendor.outstanding, e)}
                          className="p-2 bg-pink-500/20 rounded-lg text-pink-400 hover:bg-pink-500/30"
                          title="Direct WhatsApp Reminder"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => handleWhatsAppPDF(vendor.id, 'vendor', vendor.name, vendor.phone, e)}
                          className="p-2 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                          title="Share Ledger PDF via WhatsApp"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </button>
                        <Link
                          href={`/vendor-ledger/${vendor.id}`}
                          className="p-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        {expandedVendor === vendor.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-white/50" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-white/50" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unpaid Invoices Aging Breakdown */}
                  {expandedVendor === vendor.id && vendorUnpaidInvoices[vendor.id] && (
                    <div className="border-t border-white/10 p-4 bg-white/5">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-cyan-400" />
                        Unpaid Invoices Breakdown
                      </h4>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/60">Invoice No</th>
                              <th className="px-3 py-2 text-left text-white/60">Date</th>
                              <th className="px-3 py-2 text-right text-white/60">Total Amount</th>
                              <th className="px-3 py-2 text-right text-white/60">Paid Amount</th>
                              <th className="px-3 py-2 text-right text-white/60">Balance Due</th>
                              <th className="px-3 py-2 text-center text-white/60">Days Outstanding (Aging)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {vendorUnpaidInvoices[vendor.id].length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-3 py-4 text-center text-white/30 italic">
                                  No unpaid invoices (outstanding balance may be due to Opening Balance or Journal Entries)
                                </td>
                              </tr>
                            ) : (
                              vendorUnpaidInvoices[vendor.id].map((inv) => {
                                const daysOut = Math.max(0, Math.ceil((new Date() - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24)))
                                return (
                                  <tr key={inv.id} className="hover:bg-white/5 font-mono">
                                    <td className="px-3 py-2 text-white font-semibold">{inv.invoice_no}</td>
                                    <td className="px-3 py-2">{formatDate(inv.invoice_date)}</td>
                                    <td className="px-3 py-2 text-right">{formatCurrency(inv.grand_total)}</td>
                                    <td className="px-3 py-2 text-right text-green-400">{formatCurrency(inv.paid_amount)}</td>
                                    <td className="px-3 py-2 text-right text-red-400 font-bold">{formatCurrency(inv.balance)}</td>
                                    <td className="px-3 py-2 text-center align-middle">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        daysOut > 90 
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                          : daysOut > 60 
                                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                          : daysOut > 30
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      }`}>
                                        {daysOut} days
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Transactions Table - Optional, show message if no transactions */}
                  {expandedVendor === vendor.id && (
                    <div className="border-t border-white/10 p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-pink-400" />
                        Recent Transactions
                      </h4>
                      {vendorTransactions[vendor.id] && vendorTransactions[vendor.id].length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-white/5">
                              <tr>
                                <th className="px-3 py-2 text-left text-white/60">Date</th>
                                <th className="px-3 py-2 text-left text-white/60">Type</th>
                                <th className="px-3 py-2 text-left text-white/60">Ref / Items</th>
                                <th className="px-3 py-2 text-right text-white/60">Qty</th>
                                <th className="px-3 py-2 text-right text-white/60">Rate</th>
                                <th className="px-3 py-2 text-right text-white/60">Debit</th>
                                <th className="px-3 py-2 text-right text-white/60">Credit</th>
                                <th className="px-3 py-2 text-right text-white/60">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {vendorTransactions[vendor.id].map((trans, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="px-3 py-2 text-white/70 align-top">{formatDate(trans.transaction_date)}</td>
                                  <td className="px-3 py-2 align-top">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      trans.transaction_type === 'PURCHASE' 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                      {trans.transaction_type}
                                    </span>
                                  </td>
                                  
                                  {trans.transaction_type === 'PURCHASE' && trans.items && trans.items.length > 0 ? (
                                    <>
                                      <td className="px-3 py-2 align-top">
                                        <div className="text-white/50 font-mono text-xs mb-1">{trans.reference_no}</div>
                                        <div className="space-y-1">
                                          {trans.items.map((item, i) => (
                                            <div key={i} className="text-white text-xs">{item.item_name}</div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 align-top text-right">
                                        <div className="mt-4 space-y-1">
                                          {trans.items.map((item, i) => (
                                            <div key={i} className="text-yellow-400 text-xs">{item.quantity} {item.unit || ''}</div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 align-top text-right">
                                        <div className="mt-4 space-y-1">
                                          {trans.items.map((item, i) => (
                                            <div key={i} className="text-green-400 text-xs">{formatCurrency(item.rate)}</div>
                                          ))}
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2 text-white font-mono align-top">{trans.reference_no || trans.description || '-'}</td>
                                      <td className="px-3 py-2 align-top text-right text-white/50">-</td>
                                      <td className="px-3 py-2 align-top text-right text-white/50">-</td>
                                    </>
                                  )}

                                  <td className="px-3 py-2 text-red-400 text-right align-top">{trans.debit != null && trans.debit !== 0 ? formatCurrency(trans.debit) : '-'}</td>
                                  <td className="px-3 py-2 text-green-400 text-right align-top">{trans.credit != null && trans.credit !== 0 ? formatCurrency(trans.credit) : '-'}</td>
                                  <td className="px-3 py-2 text-white font-semibold text-right align-top">{formatCurrency(trans.balance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-white/50 text-center py-4">No transactions found for this vendor</p>
                      )}
                      <div className="mt-3 text-right">
                        <Link
                          href={`/vendor-ledger/${vendor.id}`}
                          className="text-sm text-pink-400 hover:text-pink-300"
                        >
                          View Full Ledger →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredVendors.length === 0 && (
                <div className="text-center py-12 text-white/50">
                  No vendors found matching your criteria
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}