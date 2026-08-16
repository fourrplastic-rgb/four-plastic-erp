'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  FunnelIcon,
  XMarkIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (!num) return 'Zero Only';
  
  // Split into rupees and paise
  const parts = num.toFixed(2).split('.');
  const rupees = parseInt(parts[0]);
  const paise = parseInt(parts[1]);
  
  const convertAmount = (n) => {
    if (n.toString().length > 9) return 'Overflow';
    let digits = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!digits) return '';
    let str = '';
    str += (digits[1] != 0) ? (a[Number(digits[1])] || b[digits[1][0]] + ' ' + a[digits[1][1]]) + 'Crore ' : '';
    str += (digits[2] != 0) ? (a[Number(digits[2])] || b[digits[2][0]] + ' ' + a[digits[2][1]]) + 'Lakh ' : '';
    str += (digits[3] != 0) ? (a[Number(digits[3])] || b[digits[3][0]] + ' ' + a[digits[3][1]]) + 'Thousand ' : '';
    str += (digits[4] != 0) ? (a[Number(digits[4])] || b[digits[4][0]] + ' ' + a[digits[4][1]]) + 'Hundred ' : '';
    str += (digits[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(digits[5])] || b[digits[5][0]] + ' ' + a[digits[5][1]]) : '';
    return str.trim();
  };

  let words = convertAmount(rupees);
  if (!words) {
    words = 'Zero';
  }
  words += ' Rupees';
  
  if (paise > 0) {
    words += ' and ' + convertAmount(paise) + ' Paise';
  }
  
  return words + ' Only';
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('receipts')
  const [dateFilter, setDateFilter] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [deleteType, setDeleteType] = useState('')
  const [showChequeModal, setShowChequeModal] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState(null)
  const [chequeBankType, setChequeBankType] = useState('canara')
  const [chequeOffsets, setChequeOffsets] = useState({
    payeeLeft: 38,
    payeeTop: 20,
    wordsLeft: 38,
    wordsTop: 28,
    wordsTopSecond: 36,
    figuresLeft: 148,
    figuresTop: 41,
    dateLeft: 147,
    dateTop: 8,
    dateSpacing: 7.75,
    acPayee: true
  })
  const [showEnvelopeModal, setShowEnvelopeModal] = useState(false)
  const [selectedEnvelopeItem, setSelectedEnvelopeItem] = useState(null)
  const [envelopeType, setEnvelopeType] = useState('payment')
  const [envelopeConfig, setEnvelopeConfig] = useState({
    width: 220,
    height: 110,
    feedOrientation: 'vertical-left-90',
    toLeft: 115,
    toTop: 45,
    fromLeft: 15,
    fromTop: 15,
    recipientName: '',
    recipientAddress: '',
    recipientCityStatePin: '',
    recipientPhone: '',
    senderName: 'FOUR (R) PLASTIC',
    senderAddress: '90 Feet Road, Wire Gali, Khadi No.3, Anish Compound, Sakinaka, Mumbai - 400072'
  })
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [banks, setBanks] = useState([])
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalPayments: 0,
    receiptCount: 0,
    paymentCount: 0,
    cashReceipts: 0,
    bankReceipts: 0,
    cashPayments: 0,
    bankPayments: 0
  })
  
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [activeTab, dateFilter])

  useEffect(() => {
    calculateStats()
  }, [receipts, payments])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch customers and vendors for names
      const [customersRes, vendorsRes, banksRes] = await Promise.all([
        axios.get('/api/customers').catch(() => ({ data: [] })),
        axios.get('/api/vendors').catch(() => ({ data: [] })),
        axios.get('/api/').catch(() => ({ data: [] }))
      ])
      
      setCustomers(customersRes.data || [])
      setVendors(vendorsRes.data || [])
      setBanks(banksRes.data || [])
      
      // Fetch receipts or payments based on active tab
      if (activeTab === 'receipts') {
        const response = await axios.get(`/api/customer-payments/?from=${dateFilter.from}&to=${dateFilter.to}`)
        
        // Enrich receipts with customer names
        const enrichedReceipts = (response.data || []).map(receipt => ({
          ...receipt,
          customer_name: customersRes.data?.find(c => c.id === receipt.customer_id)?.name || 'Unknown Customer'
        }))
        
        setReceipts(enrichedReceipts)
        setPayments([])
      } else {
        const response = await axios.get(`/api/vendor-payments/?from=${dateFilter.from}&to=${dateFilter.to}`)
        
        // Enrich payments with vendor names
        const enrichedPayments = (response.data || []).map(payment => ({
          ...payment,
          vendor_name: vendorsRes.data?.find(v => v.id === payment.vendor_id)?.name || 'Unknown Vendor'
        }))
        
        setPayments(enrichedPayments)
        setReceipts([])
      }
    } catch (error) {
      console.error('Fetch error:', error)
      if (activeTab === 'receipts') {
        setReceipts([])
        toast.error('Failed to fetch receipts')
      } else {
        setPayments([])
        toast.error('Failed to fetch payments')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    const cashReceipts = receipts.filter(r => r.payment_mode === 'cash').reduce((sum, r) => sum + (r.amount || 0), 0)
    const bankReceipts = receipts.filter(r => r.payment_mode === 'bank' || r.payment_mode === 'cheque').reduce((sum, r) => sum + (r.amount || 0), 0)
    
    const cashPayments = payments.filter(p => p.payment_mode === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0)
    const bankPayments = payments.filter(p => p.payment_mode === 'bank' || p.payment_mode === 'cheque').reduce((sum, p) => sum + (p.amount || 0), 0)

    setStats({
      totalReceipts,
      totalPayments,
      receiptCount: receipts.length,
      paymentCount: payments.length,
      cashReceipts,
      bankReceipts,
      cashPayments,
      bankPayments
    })
  }

  const handleView = (item, type) => {
    if (type === 'receipt') {
      router.push(`/payments/receipt/${item.id}`)
    } else {
      router.push(`/payments/payment/${item.id}`)
    }
  }

  const handleEdit = (item, type) => {
    if (type === 'receipt') {
      router.push(`/payments/receipt/edit/${item.id}`)
    } else {
      router.push(`/payments/payment/edit/${item.id}`)
    }
  }

  const handlePrint = (item, type) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const isReceipt = type === 'receipt'
    const title = isReceipt ? 'Payment Receipt' : 'Payment Voucher'
    const number = isReceipt ? item.receipt_no : item.payment_no
    const partyName = isReceipt ? item.customer_name : item.vendor_name

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - ${number}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; -webkit-print-color-adjust: exact; }
          }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #333; line-height: 1.5; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .header-left { width: 60%; }
          .header-right { width: 40%; text-align: right; }
          .company-name { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
          .company-details { font-size: 11px; color: #64748b; line-height: 1.4; }
          .voucher-title { font-size: 20px; font-weight: 800; text-transform: uppercase; color: ${isReceipt ? '#0f766e' : '#be123c'}; letter-spacing: 1px; margin-bottom: 8px; }
          .voucher-meta { font-size: 12px; color: #475569; }
          .divider { border-top: 2px solid #e2e8f0; margin: 20px 0; }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .info-table td { padding: 8px 12px; vertical-align: top; font-size: 13px; }
          .info-label { font-weight: 600; color: #475569; width: 25%; }
          .info-val { color: #0f172a; }
          
          .amount-box { padding: 15px; border-radius: 6px; display: inline-block; min-width: 250px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .amount-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 5px; }
          .amount-value { font-size: 24px; font-weight: 800; color: ${isReceipt ? '#0f766e' : '#be123c'}; }
          
          .invoice-allocations { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 40px; }
          .invoice-allocations th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          .invoice-allocations td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          
          .footer-section { margin-top: 60px; width: 100%; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 50px; }
          .sig-box { width: 200px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; }
          .system-gen { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div class="company-name">FOUR (R) PLASTIC</div>
                <div class="company-details">
                  90 Feet Road, Wire Gali, Khadi No.3, Anish Compound, Sakinaka, Mumbai<br>
                  Email: accounts@fourrplastic.com | GSTIN: 27AAAAA0000A1Z0
                </div>
              </td>
              <td class="header-right">
                <div class="voucher-title">${title}</div>
                <div class="voucher-meta">
                  <strong>Voucher No:</strong> ${number}<br>
                  <strong>Date:</strong> ${formatDate(item.payment_date)}
                </div>
              </td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="info-table">
            <tr>
              <td class="info-label">${isReceipt ? 'Received From:' : 'Paid To:'}</td>
              <td class="info-val"><strong>${partyName}</strong></td>
            </tr>
            <tr>
              <td class="info-label">Payment Mode:</td>
              <td class="info-val" style="text-transform: uppercase; font-weight: 600;">${item.payment_mode}</td>
            </tr>
            ${item.reference_no ? `
            <tr>
              <td class="info-label">Reference / Instrument:</td>
              <td class="info-val">${item.reference_no}</td>
            </tr>` : ''}
            ${item.bank_id ? `
            <tr>
              <td class="info-label">Bank Account:</td>
              <td class="info-val">${getBankName(item.bank_id)}</td>
            </tr>` : ''}
            ${item.notes ? `
            <tr>
              <td class="info-label">Description / Notes:</td>
              <td class="info-val">${item.notes}</td>
            </tr>` : ''}
          </table>
          
          <div class="amount-box" style="background-color: #f8fafc;">
            <div class="amount-label">${isReceipt ? 'Amount Received (in INR)' : 'Amount Paid (in INR)'}</div>
            <div class="amount-value">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          
          <h4 style="margin-bottom: 10px; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Allocation Details</h4>
          <table class="invoice-allocations">
            <thead>
              <tr>
                <th style="width: 60%;">Allocation Source / Invoice No</th>
                <th style="text-align: right; width: 40%;">Allocated Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${item.invoice_no ? `Invoice: <strong>${item.invoice_no}</strong>` : '<strong>On Account (Unallocated Credit)</strong>'}</td>
                <td style="text-align: right; font-weight: 600; font-family: monospace;">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer-section">
            <div class="sig-row">
              <div class="sig-box">Receiver's Signature</div>
              <div class="sig-box">For FOUR (R) PLASTIC</div>
            </div>
            <div class="system-gen">This is a computer-generated voucher statement and requires no physical signature.</div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintCheque = (item, type) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const isReceipt = type === 'receipt'
    const payeeName = isReceipt ? item.customer_name : item.vendor_name
    
    const d = new Date(item.payment_date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear())
    const dateDigits = (day + month + year).split('')

    const amountWords = numberToWords(item.amount)
    
    let words1 = amountWords
    let words2 = ''
    if (amountWords.length > 45) {
      const idx = amountWords.lastIndexOf(' ', 45)
      if (idx !== -1) {
        words1 = amountWords.substring(0, idx)
        words2 = amountWords.substring(idx + 1)
      }
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheque Print - ${payeeName}</title>
        <style>
          @page {
            size: 203mm 93mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            width: 203mm;
            height: 93mm;
            overflow: hidden;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            font-weight: bold;
            color: #000;
            background: transparent;
          }
          .cheque-container {
            position: relative;
            width: 203mm;
            height: 93mm;
            box-sizing: border-box;
          }
          .ac-payee {
            position: absolute;
            left: 15mm;
            top: 5mm;
            width: 30mm;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            text-align: center;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 2px 0;
            transform: rotate(-10deg);
          }
          .date-container {
            position: absolute;
            left: ${chequeOffsets.dateLeft}mm;
            top: ${chequeOffsets.dateTop}mm;
            display: flex;
            gap: 0;
          }
          .date-digit {
            width: ${chequeOffsets.dateSpacing}mm;
            text-align: center;
            font-size: 16px;
            letter-spacing: 0;
          }
          .payee {
            position: absolute;
            left: ${chequeOffsets.payeeLeft}mm;
            top: ${chequeOffsets.payeeTop}mm;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .words-line-1 {
            position: absolute;
            left: ${chequeOffsets.wordsLeft}mm;
            top: ${chequeOffsets.wordsTop}mm;
            font-size: 13px;
            text-transform: uppercase;
            width: 120mm;
            white-space: nowrap;
          }
          .words-line-2 {
            position: absolute;
            left: 20mm;
            top: ${chequeOffsets.wordsTopSecond}mm;
            font-size: 13px;
            text-transform: uppercase;
            width: 120mm;
            white-space: nowrap;
          }
          .figures {
            position: absolute;
            left: ${chequeOffsets.figuresLeft}mm;
            top: ${chequeOffsets.figuresTop}mm;
            font-size: 17px;
            font-family: Arial, sans-serif;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="cheque-container">
          \${chequeOffsets.acPayee ? '<div class="ac-payee">A/C PAYEE ONLY</div>' : ''}
          
          <div class="date-container">
            \${dateDigits.map(digit => \`<div class="date-digit">\${digit}</div>\`).join('')}
          </div>
          
          <div class="payee">**\${payeeName}**</div>
          
          <div class="words-line-1">**\${words1}**</div>
          
          \${words2 ? \`<div class="words-line-2">**\${words2}**</div>\` : ''}
          
          <div class="figures">**₹\${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-**</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
  }

  const handleOpenEnvelopeModal = (item, type) => {
    const isReceipt = type === 'receipt'
    let recipientName = ''
    let recipientAddress = ''
    let recipientCityStatePin = ''
    let recipientPhone = ''

    if (isReceipt) {
      const cust = customers.find(c => c.id === item.customer_id)
      recipientName = cust?.name || item.customer_name || ''
      recipientAddress = cust?.address || ''
      recipientCityStatePin = `${cust?.city || ''}${cust?.state ? ', ' + cust.state : ''}${cust?.pincode ? ' - ' + cust.pincode : ''}`
      recipientPhone = cust?.phone || ''
    } else {
      const vend = vendors.find(v => v.id === item.vendor_id)
      recipientName = vend?.name || item.vendor_name || ''
      recipientAddress = vend?.address || ''
      recipientCityStatePin = `${vend?.city || ''}${vend?.state ? ', ' + vend.state : ''}${vend?.pincode ? ' - ' + vend.pincode : ''}`
      recipientPhone = vend?.phone || ''
    }

    setSelectedEnvelopeItem(item)
    setEnvelopeType(type)
    setEnvelopeConfig({
      width: 220,
      height: 110,
      feedOrientation: 'vertical-left-90',
      toLeft: 115,
      toTop: 45,
      fromLeft: 15,
      fromTop: 15,
      recipientName,
      recipientAddress,
      recipientCityStatePin,
      recipientPhone,
      senderName: 'FOUR (R) PLASTIC',
      senderAddress: '90 Feet Road, Wire Gali, Khadi No.3, Anish Compound, Sakinaka, Mumbai - 400072'
    })
    setShowEnvelopeModal(true)
  }

  const handlePrintEnvelope = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const {
      width,
      height,
      feedOrientation,
      toLeft,
      toTop,
      fromLeft,
      fromTop,
      recipientName,
      recipientAddress,
      recipientCityStatePin,
      recipientPhone,
      senderName,
      senderAddress
    } = envelopeConfig

    let pageSize = `${width}mm ${height}mm`
    let bodyStyle = ''
    let containerStyle = ''

    if (feedOrientation === 'vertical-left-90') {
      pageSize = `${height}mm ${width}mm`
      bodyStyle = `width: ${height}mm; height: ${width}mm;`
      containerStyle = `
        position: absolute;
        width: ${width}mm;
        height: ${height}mm;
        left: 0;
        top: 0;
        transform: rotate(90deg) translate(0, -${height}mm);
        transform-origin: 0 0;
      `
    } else if (feedOrientation === 'vertical-left-270') {
      pageSize = `${height}mm ${width}mm`
      bodyStyle = `width: ${height}mm; height: ${width}mm;`
      containerStyle = `
        position: absolute;
        width: ${width}mm;
        height: ${height}mm;
        left: 0;
        top: 0;
        transform: rotate(-90deg) translate(-${width}mm, 0);
        transform-origin: 0 0;
      `
    } else {
      pageSize = `${width}mm ${height}mm`
      bodyStyle = `width: ${width}mm; height: ${height}mm;`
      containerStyle = `
        position: relative;
        width: ${width}mm;
        height: ${height}mm;
      `
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>&nbsp;</title>
        <style>
          @page {
            size: ${pageSize};
            margin: 0 !important;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            color: #000;
            background: transparent;
            ${bodyStyle}
          }
          .envelope-container {
            box-sizing: border-box;
            ${containerStyle}
          }
          .sender-section {
            position: absolute;
            left: ${fromLeft}mm;
            top: ${fromTop}mm;
            width: 80mm;
            font-size: 13px;
            line-height: 1.35;
          }
          .sender-name {
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 2px;
            margin-bottom: 4px;
            font-size: 16px;
          }
          .recipient-section {
            position: absolute;
            left: ${toLeft}mm;
            top: ${toTop}mm;
            width: 95mm;
            line-height: 1.4;
          }
          .recipient-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .recipient-name {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .recipient-address {
            font-size: 12px;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="envelope-container">
          <div class="sender-section">
            <div class="sender-name">${senderName}</div>
            <div style="font-weight: 500;">${senderAddress}</div>
          </div>
          
          <div class="recipient-section">
            <div class="recipient-label">TO:</div>
            <div class="recipient-name">${recipientName}</div>
            <div class="recipient-address">${recipientAddress}</div>
            <div>${recipientCityStatePin}</div>
            \${recipientPhone ? \`<div style="margin-top: 4px; font-size: 11px;">Ph: \${recipientPhone}</div>\` : ''}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
  }

  const handleDelete = async () => {
    try {
      const endpoint = deleteType === 'receipt' 
        ? `/api/customer-payments/${selectedItem.id}`
        : `/api/vendor-payments/${selectedItem.id}`
      
      await axios.delete(endpoint)
      
      if (deleteType === 'receipt') {
        setReceipts(prev => prev.filter(r => r.id !== selectedItem.id))
        toast.success('Receipt deleted successfully')
      } else {
        setPayments(prev => prev.filter(p => p.id !== selectedItem.id))
        toast.success('Payment deleted successfully')
      }
      
      fetchData() // Refresh data
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`)
    } finally {
      setShowDeleteModal(false)
      setSelectedItem(null)
      setDeleteType('')
    }
  }

  const confirmDelete = (item, type) => {
    setSelectedItem(item)
    setDeleteType(type)
    setShowDeleteModal(true)
  }

  const getBankName = (bankId) => {
    if (!bankId) return '-'
    const bank = banks.find(b => b.id === bankId)
    return bank?.name || '-'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getPaymentModeIcon = (mode) => {
    const icons = {
      'cash': '💵',
      'bank': '🏦',
      'cheque': '📝',
      'card': '💳'
    }
    return icons[mode] || '💰'
  }

  const getPaymentModeClass = (mode) => {
    const classes = {
      'cash': 'bg-green-500/20 text-green-400',
      'bank': 'bg-blue-500/20 text-blue-400',
      'cheque': 'bg-yellow-500/20 text-yellow-400',
      'card': 'bg-purple-500/20 text-purple-400'
    }
    return classes[mode] || 'bg-gray-500/20 text-gray-400'
  }

  const filteredReceipts = receipts.filter(r => 
    r.receipt_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPayments = payments.filter(p => 
    p.payment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && receipts.length === 0 && payments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading payments...</p>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  ←
                </button>
                <BanknotesIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  PAYMENTS & RECEIPTS
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <FunnelIcon className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={() => router.push('/payments/new')}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Transaction
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-white/50" />
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <span className="text-white">to</span>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4">
              <p className="text-green-300 text-xs">Total Receipts</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalReceipts)}</p>
              <p className="text-green-300/70 text-xs mt-1">{stats.receiptCount} transactions</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-xs">Total Payments</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.totalPayments)}</p>
              <p className="text-red-300/70 text-xs mt-1">{stats.paymentCount} transactions</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-300 text-xs">Cash Summary</p>
              <p className="text-sm text-yellow-400">Receipts: {formatCurrency(stats.cashReceipts)}</p>
              <p className="text-sm text-yellow-400">Payments: {formatCurrency(stats.cashPayments)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-xs">Bank Summary</p>
              <p className="text-sm text-blue-400">Receipts: {formatCurrency(stats.bankReceipts)}</p>
              <p className="text-sm text-blue-400">Payments: {formatCurrency(stats.bankPayments)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'receipts'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <BanknotesIcon className="h-5 w-5" />
              Customer Receipts ({receipts.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <BanknotesIcon className="h-5 w-5" />
              Vendor Payments ({payments.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'receipts' ? 'receipts by number, customer, reference' : 'payments by number, vendor, reference'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Results count */}
          <div className="mb-3 text-white/60 text-sm">
            Showing {activeTab === 'receipts' ? filteredReceipts.length : filteredPayments.length} of {activeTab === 'receipts' ? receipts.length : payments.length} records
          </div>

          {/* Receipts Table */}
          {activeTab === 'receipts' && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Receipt No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Mode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Invoice</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white/60" colSpan="4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-white/50">
                          No receipts found
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white/70">{formatDate(receipt.payment_date)}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{receipt.receipt_no}</td>
                          <td className="px-4 py-3 text-sm text-white">{receipt.customer_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPaymentModeClass(receipt.payment_mode)}`}>
                                {getPaymentModeIcon(receipt.payment_mode)} {receipt.payment_mode}
                              </span>
                              {receipt.cheque_image_path && (
                                <a 
                                  href={receipt.cheque_image_path} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-white/50 hover:text-pink-400 transition-colors"
                                  title="View Scanned Cheque"
                                >
                                  📸
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/70">{receipt.reference_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-white/70">{receipt.invoice_no || 'On Account'}</td>
                          <td className="px-4 py-3 text-sm text-green-400 text-right font-semibold">
                            {formatCurrency(receipt.amount)}
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => handleView(receipt, 'receipt')}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => handleEdit(receipt, 'receipt')}
                              className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </td>
                           <td className="px-2 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePrint(receipt, 'receipt')}
                                className="p-1 text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded"
                                title="Print Voucher"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              {receipt.payment_mode === 'cheque' && (
                                <button
                                  onClick={() => {
                                    setSelectedCheque(receipt)
                                    setDeleteType('receipt')
                                    setShowChequeModal(true)
                                  }}
                                  className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-white/10 rounded"
                                  title="Print Cheque"
                                >
                                  🎫
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEnvelopeModal(receipt, 'receipt')}
                                className="p-1 text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded"
                                title="Print Envelope"
                              >
                                ✉️
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => confirmDelete(receipt, 'receipt')}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Table */}
          {activeTab === 'payments' && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Payment No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Mode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Invoice</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white/60" colSpan="4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-white/50">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white/70">{formatDate(payment.payment_date)}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{payment.payment_no}</td>
                          <td className="px-4 py-3 text-sm text-white">{payment.vendor_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPaymentModeClass(payment.payment_mode)}`}>
                                {getPaymentModeIcon(payment.payment_mode)} {payment.payment_mode}
                              </span>
                              {payment.cheque_image_path && (
                                <a 
                                  href={payment.cheque_image_path} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-white/50 hover:text-pink-400 transition-colors"
                                  title="View Scanned Cheque"
                                >
                                  📸
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/70">{payment.reference_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-white/70">{payment.invoice_no || 'On Account'}</td>
                          <td className="px-4 py-3 text-sm text-red-400 text-right font-semibold">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => handleView(payment, 'payment')}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => handleEdit(payment, 'payment')}
                              className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </td>
                           <td className="px-2 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePrint(payment, 'payment')}
                                className="p-1 text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded"
                                title="Print Voucher"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              {payment.payment_mode === 'cheque' && (
                                <button
                                  onClick={() => {
                                    setSelectedCheque(payment)
                                    setDeleteType('payment')
                                    setShowChequeModal(true)
                                  }}
                                  className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-white/10 rounded"
                                  title="Print Cheque"
                                >
                                  🎫
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEnvelopeModal(payment, 'payment')}
                                className="p-1 text-orange-400 hover:text-orange-300 hover:bg-white/10 rounded"
                                title="Print Envelope"
                              >
                                ✉️
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-sm text-center">
                            <button
                              onClick={() => confirmDelete(payment, 'payment')}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Delete {deleteType === 'receipt' ? 'Receipt' : 'Payment'}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-white/70 mb-6">
              Are you sure you want to delete this {deleteType}?
            </p>
            
            <div className="bg-white/5 rounded-lg p-3 mb-6">
              <p className="text-white/60 text-sm">
                {deleteType === 'receipt' ? 'Receipt No' : 'Payment No'}: {deleteType === 'receipt' ? selectedItem.receipt_no : selectedItem.payment_no}
              </p>
              <p className="text-white/60 text-sm">Amount: {formatCurrency(selectedItem.amount)}</p>
              <p className="text-white/60 text-sm">Date: {formatDate(selectedItem.payment_date)}</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Printing Modal */}
      {showChequeModal && selectedCheque && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-5xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🖨️</span> Cheque Print Assistant & Live Layout Config
                </h3>
                <p className="text-white/60 text-xs mt-1">Adjust millimeter offsets to align text with your blank bank cheque leaf</p>
              </div>
              <button
                onClick={() => setShowChequeModal(false)}
                className="p-1 text-white/50 hover:text-white bg-white/5 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Configuration panel */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 max-h-[500px] overflow-y-auto">
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Printer Adjustments (mm)</h4>
                
                <div>
                  <label className="block text-white/70 text-xs mb-1">Standard Bank Template</label>
                  <select
                    value={chequeBankType}
                    onChange={(e) => {
                      const val = e.target.value
                      setChequeBankType(val)
                      if (val === 'canara') {
                        setChequeOffsets({
                          payeeLeft: 38, payeeTop: 20,
                          wordsLeft: 38, wordsTop: 28, wordsTopSecond: 36,
                          figuresLeft: 148, figuresTop: 41,
                          dateLeft: 147, dateTop: 8, dateSpacing: 7.75,
                          acPayee: true
                        })
                      } else {
                        setChequeOffsets({
                          payeeLeft: 34, payeeTop: 22,
                          wordsLeft: 34, wordsTop: 30, wordsTopSecond: 38,
                          figuresLeft: 152, figuresTop: 42,
                          dateLeft: 145, dateTop: 9, dateSpacing: 7.6,
                          acPayee: true
                        })
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-gray-800 border border-white/20 rounded text-white text-xs"
                    style={{ backgroundColor: '#111827' }}
                  >
                    <option value="canara">Canara Bank (CTS-2010)</option>
                    <option value="standard">Standard CTS-2010 (HDFC, SBI, etc.)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Payee Name Left (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.payeeLeft}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, payeeLeft: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Payee Name Top (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.payeeTop}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, payeeTop: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Amount Words Left (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.wordsLeft}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, wordsLeft: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Amount Words Top (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.wordsTop}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, wordsTop: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Figures Box Left (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.figuresLeft}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, figuresLeft: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Figures Box Top (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.figuresTop}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, figuresTop: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white/50 text-[9px] mb-1">Date Left (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.dateLeft}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, dateLeft: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[9px] mb-1">Date Top (mm)</label>
                    <input
                      type="number" step="0.5"
                      value={chequeOffsets.dateTop}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, dateTop: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[9px] mb-1">Spacing (mm)</label>
                    <input
                      type="number" step="0.05"
                      value={chequeOffsets.dateSpacing}
                      onChange={(e) => setChequeOffsets(p => ({ ...p, dateSpacing: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="acPayee"
                    checked={chequeOffsets.acPayee}
                    onChange={(e) => setChequeOffsets(p => ({ ...p, acPayee: e.target.checked }))}
                    className="rounded border-white/10 bg-gray-800 text-pink-500 focus:ring-pink-500"
                  />
                  <label htmlFor="acPayee" className="text-white/70 text-xs cursor-pointer select-none">Add "A/C Payee Only" Double Line Crossing</label>
                </div>
              </div>

              {/* Live Preview panel */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <h4 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-3">Live Cheque Leaf Preview</h4>
                
                {/* Physical Cheque box container */}
                <div 
                  className="relative w-full border border-teal-500/30 rounded-lg overflow-hidden bg-cover bg-center"
                  style={{
                    height: '240px',
                    background: chequeBankType === 'canara' 
                      ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' 
                      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                >
                  {/* Faint Bank Logo watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <span className="text-slate-900 text-5xl font-black italic uppercase tracking-wider">{chequeBankType === 'canara' ? 'CANARA BANK' : 'STANDARD CTS'}</span>
                  </div>

                  {/* Top Header bank lines */}
                  <div className="p-3 flex justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold text-teal-800 tracking-wider">
                        {chequeBankType === 'canara' ? 'केवरा बैंक Canara Bank' : 'CTS-2010 BANK'}
                      </div>
                      <div className="text-[7px] text-teal-800/80 leading-none">
                        {chequeBankType === 'canara' ? 'SME BR MUMBAI SAKINAKA • IFSC: CNRB0002411' : 'MUMBAI BRANCH • CTS-2010'}
                      </div>
                    </div>

                    {/* Date Boxes */}
                    <div 
                      className="absolute border border-teal-800/40 p-0.5 rounded flex gap-0 bg-white/40"
                      style={{ 
                        left: `${chequeOffsets.dateLeft * 2.3}px`, 
                        top: `${chequeOffsets.dateTop * 2.3}px` 
                      }}
                    >
                      {(() => {
                        const d = new Date(selectedCheque.payment_date)
                        const day = String(d.getDate()).padStart(2, '0')
                        const month = String(d.getMonth() + 1).padStart(2, '0')
                        const year = String(d.getFullYear())
                        const dateDigits = (day + month + year).split('')
                        return dateDigits.map((digit, i) => (
                          <div 
                            key={i} 
                            className="border-r border-teal-800/30 last:border-0 text-center font-bold text-[10px] text-slate-800 font-mono"
                            style={{ 
                              width: `${chequeOffsets.dateSpacing * 2.3}px`,
                              height: '14px',
                              lineHeight: '14px'
                            }}
                          >
                            {digit}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* A/C Payee crossing */}
                  {chequeOffsets.acPayee && (
                    <div className="absolute left-[30px] top-[15px] border-y border-teal-800 text-[7px] font-black text-teal-800 px-1 py-0.5 tracking-wider rotate-[-10deg] uppercase bg-white/40">
                      A/C Payee Only
                    </div>
                  )}

                  {/* Pay label & Line */}
                  <div className="absolute left-6 top-[55px] right-6 border-b border-teal-800/40 text-[9px] text-teal-800/80 font-bold pb-0.5">
                    PAY / प्राप्तकर्ता:
                    <span 
                      className="absolute font-mono font-black text-xs text-slate-900 uppercase"
                      style={{ left: `${(chequeOffsets.payeeLeft - 10) * 2.3}px`, top: '-4px' }}
                    >
                      {deleteType === 'receipt' ? selectedCheque.customer_name : selectedCheque.vendor_name}
                    </span>
                  </div>

                  {/* Rupees lines */}
                  <div className="absolute left-6 top-[85px] right-6 border-b border-teal-800/40 text-[9px] text-teal-800/80 font-bold pb-0.5">
                    RUPEES / रुपये:
                    <span 
                      className="absolute font-mono font-black text-[10px] text-slate-900 uppercase whitespace-nowrap"
                      style={{ left: `${(chequeOffsets.wordsLeft - 15) * 2.3}px`, top: '-4px' }}
                    >
                      {(() => {
                        const words = numberToWords(selectedCheque.amount)
                        return words.length > 45 ? words.substring(0, 45) + '...' : words
                      })()}
                    </span>
                  </div>
                  <div className="absolute left-6 top-[115px] right-6 border-b border-teal-800/40 text-[9px] text-teal-800/80 font-bold pb-0.5">
                    <span 
                      className="absolute font-mono font-black text-[10px] text-slate-900 uppercase whitespace-nowrap"
                      style={{ left: '30px', top: '-4px' }}
                    >
                      {(() => {
                        const words = numberToWords(selectedCheque.amount)
                        return words.length > 45 ? words.substring(45) : ''
                      })()}
                    </span>
                  </div>

                  {/* Amount figures box */}
                  <div 
                    className="absolute border-2 border-teal-800/40 bg-white/60 rounded px-2 py-1 font-mono font-black text-sm text-slate-900 shadow-inner flex items-center justify-center"
                    style={{ 
                      left: `${chequeOffsets.figuresLeft * 2.3}px`, 
                      top: `${chequeOffsets.figuresTop * 2.3}px`,
                      width: '110px',
                      height: '30px'
                    }}
                  >
                    ₹{selectedCheque.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-
                  </div>

                  {/* Bottom details / signature area */}
                  <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                    <div className="text-[7px] text-teal-800 font-mono tracking-wider">
                      Please sign above / कृपया यहाँ हस्ताक्षर करें
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-bold text-teal-800">For FOUR (R) PLASTIC</div>
                      <div className="h-6"></div>
                      <div className="text-[8px] font-bold text-teal-800 uppercase tracking-widest border-t border-teal-800/40 pt-0.5">Authorised Signatory</div>
                    </div>
                  </div>
                </div>

                {/* Print confirmation action */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowChequeModal(false)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handlePrintCheque(selectedCheque, deleteType)
                      setShowChequeModal(false)
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <span>🖨️</span> Print Cheque Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Envelope Printing Modal */}
      {showEnvelopeModal && selectedEnvelopeItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-5xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📯</span> Envelope Print Assistant & Live Layout Config
                </h3>
                <p className="text-white/60 text-xs mt-1">Configure layout, addresses, and margins for horizontal or vertical envelope feeds</p>
              </div>
              <button
                onClick={() => setShowEnvelopeModal(false)}
                className="p-1 text-white/50 hover:text-white bg-white/5 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 max-h-[500px] overflow-y-auto">
                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Envelope Adjustments</h4>
                
                <div>
                  <label className="block text-white/70 text-xs mb-1">Feed Orientation & Direction</label>
                  <select
                    value={envelopeConfig.feedOrientation}
                    onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, feedOrientation: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-gray-800 border border-white/20 rounded text-white text-xs"
                    style={{ backgroundColor: '#111827' }}
                  >
                    <option value="vertical-left-90">Vertical Left-Side Feed (Rotated 90° Clockwise)</option>
                    <option value="vertical-left-270">Vertical Left-Side Feed (Rotated 270° Counter-Clockwise)</option>
                    <option value="horizontal">Standard Horizontal Feed (Landscape)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Envelope Width (mm)</label>
                    <input
                      type="number"
                      value={envelopeConfig.width}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Envelope Height (mm)</label>
                    <input
                      type="number"
                      value={envelopeConfig.height}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <h5 className="text-xs font-bold text-white/80 border-b border-white/10 pb-1 mt-2">Recipient Layout (TO)</h5>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">To Position Left (mm)</label>
                    <input
                      type="number" step="1"
                      value={envelopeConfig.toLeft}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, toLeft: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">To Position Top (mm)</label>
                    <input
                      type="number" step="1"
                      value={envelopeConfig.toTop}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, toTop: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={envelopeConfig.recipientName}
                    onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] mb-1">Recipient Address</label>
                  <textarea
                    rows="2"
                    value={envelopeConfig.recipientAddress}
                    onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, recipientAddress: e.target.value }))}
                    className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">City/State/Pin</label>
                    <input
                      type="text"
                      value={envelopeConfig.recipientCityStatePin}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, recipientCityStatePin: e.target.value }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/20 rounded text-white text-xs"
                      style={{ backgroundColor: '#111827' }}
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">Recipient Phone</label>
                    <input
                      type="text"
                      value={envelopeConfig.recipientPhone}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <h5 className="text-xs font-bold text-white/80 border-b border-white/10 pb-1 mt-2">Sender Layout (FROM)</h5>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">From Position Left (mm)</label>
                    <input
                      type="number" step="1"
                      value={envelopeConfig.fromLeft}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, fromLeft: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px] mb-1">From Position Top (mm)</label>
                    <input
                      type="number" step="1"
                      value={envelopeConfig.fromTop}
                      onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, fromTop: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] mb-1">Sender Address</label>
                  <textarea
                    rows="2"
                    value={envelopeConfig.senderAddress}
                    onChange={(e) => setEnvelopeConfig(prev => ({ ...prev, senderAddress: e.target.value }))}
                    className="w-full px-2 py-1 bg-gray-800 border border-white/10 rounded text-white text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Live Envelope Leaf Preview</h4>
                  <span className="text-[10px] text-white/40 italic">Scaled to preview. Yellow border represents printable envelope limits</span>
                </div>
                
                {/* Visual Preview Container */}
                <div className="relative w-full h-[320px] bg-slate-950/40 rounded-xl border border-white/10 flex items-center justify-center overflow-auto p-4">
                  {/* Outer envelope shell */}
                  <div
                    className="relative bg-amber-50/95 border border-yellow-600/30 shadow-2xl transition-all duration-300 overflow-hidden"
                    style={
                      envelopeConfig.feedOrientation.startsWith('vertical-left')
                        ? {
                            width: '160px',
                            height: '320px',
                          }
                        : {
                            width: '320px',
                            height: '160px',
                          }
                    }
                  >
                    {/* Simulated Content inside Envelope */}
                    <div
                      className="relative w-full h-full"
                      style={
                        envelopeConfig.feedOrientation === 'vertical-left-90'
                          ? {
                              transform: 'rotate(90deg) translate(0, -160px)',
                              transformOrigin: '0 0',
                              width: '320px',
                              height: '160px'
                            }
                          : envelopeConfig.feedOrientation === 'vertical-left-270'
                          ? {
                              transform: 'rotate(-90deg) translate(-320px, 0)',
                              transformOrigin: '0 0',
                              width: '320px',
                              height: '160px'
                            }
                          : {}
                      }
                    >
                      {/* From Sender section */}
                      <div
                        className="absolute text-[10px] text-slate-800 leading-tight border-b-2 border-slate-400 pb-1.5"
                        style={{
                          left: `${envelopeConfig.fromLeft * 1.45}px`,
                          top: `${envelopeConfig.fromTop * 1.45}px`,
                          width: '140px'
                        }}
                      >
                        <div className="font-extrabold text-[12px] text-slate-900 uppercase">{envelopeConfig.senderName}</div>
                        <div className="text-[9px] text-slate-600 font-medium leading-tight mt-0.5">{envelopeConfig.senderAddress}</div>
                      </div>

                      {/* To Recipient section */}
                      <div
                        className="absolute text-[9px] text-slate-800 leading-normal"
                        style={{
                          left: `${envelopeConfig.toLeft * 1.45}px`,
                          top: `${envelopeConfig.toTop * 1.45}px`,
                          width: '160px'
                        }}
                      >
                        <div className="text-[6px] text-slate-500 font-bold uppercase tracking-wider">TO:</div>
                        <div className="font-black text-slate-900 text-[10px] uppercase leading-tight">{envelopeConfig.recipientName}</div>
                        <div className="text-slate-700 mt-0.5 text-[8px] font-mono leading-tight">{envelopeConfig.recipientAddress}</div>
                        <div className="text-slate-900 font-bold text-[8px] font-mono">{envelopeConfig.recipientCityStatePin}</div>
                        {envelopeConfig.recipientPhone && (
                          <div className="text-slate-500 text-[7px] font-mono mt-0.5">Ph: {envelopeConfig.recipientPhone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note & Print Buttons */}
                <div className="mt-4 space-y-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-2">
                    <span className="text-orange-400 text-sm">💡</span>
                    <p className="text-[10px] text-white/70 leading-normal">
                      <strong>Vertical Left-Side Feed Tip:</strong> Align your envelope vertically (short edge going into the printer tray) on the **left side margin** of your printer feed path. The print assistant will automatically rotate coordinates and output text matching this feed path.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowEnvelopeModal(false)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handlePrintEnvelope()
                        setShowEnvelopeModal(false)
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 font-bold text-xs flex items-center gap-2 shadow-lg"
                    >
                      <span>📯</span> Print Envelope Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
