'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PrintDeliveryChallanPage() {
  const router = useRouter()
  const params = useParams()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)

  // Print states
  const [printOriginal, setPrintOriginal] = useState(true)
  const [printDuplicate, setPrintDuplicate] = useState(true)
  const [printTriplicate, setPrintTriplicate] = useState(false)
  const [showRateAmount, setShowRateAmount] = useState(false)

  useEffect(() => {
    if (params?.id) {
      setId(params.id)
    } else if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/')
      const lastSegment = pathSegments[pathSegments.length - 1]
      if (lastSegment && !isNaN(parseInt(lastSegment))) {
        setId(parseInt(lastSegment))
      }
    }
  }, [params])

  useEffect(() => {
    if (id) {
      fetchChallan()
    }
  }, [id])

  const fetchChallan = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/delivery-challans/${id}`)
      setChallan(response.data)
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to load challan')
      toast.error('Failed to load challan')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '_______________'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const numberToWords = (num) => {
    if (num === 0) return 'Zero'
    
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    const convert = (n) => {
      if (n < 10) return single[n]
      if (n < 20) return double[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + single[n % 10] : '')
      if (n < 1000) return single[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
      return convert(Math.floor(num / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
    }
    
    return convert(Math.floor(num))
  }

  const totalQty = challan?.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0
  const totalAmount = challan?.items?.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.rate) || 0)), 0) || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
          <p className="text-white/70 mt-4">Preparing print preview...</p>
        </div>
      </div>
    )
  }

  if (error || !challan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md text-center shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Challan not found'}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const formatBillToAddress = () => {
    const parts = []
    if (challan.customer_name) parts.push(challan.customer_name)
    if (challan.bill_to_address) parts.push(challan.bill_to_address)
    
    const cityStateParts = []
    if (challan.bill_to_city) cityStateParts.push(challan.bill_to_city)
    if (challan.bill_to_state) cityStateParts.push(challan.bill_to_state)
    if (challan.bill_to_pincode) cityStateParts.push(challan.bill_to_pincode)
    
    if (cityStateParts.length > 0) {
      parts.push(cityStateParts.join(' '))
    }
    
    const addressStr = parts.join(', ')
    return challan.bill_to_gst ? `${addressStr} | GST: ${challan.bill_to_gst}` : addressStr
  }

  const formatShipToAddress = () => {
    const parts = []
    if (challan.ship_to_address || challan.bill_to_address) {
      parts.push(challan.ship_to_address || challan.bill_to_address)
    }
    
    const cityStateParts = []
    if (challan.ship_to_city || challan.bill_to_city) {
      cityStateParts.push(challan.ship_to_city || challan.bill_to_city)
    }
    if (challan.ship_to_state || challan.bill_to_state) {
      cityStateParts.push(challan.ship_to_state || challan.bill_to_state)
    }
    if (challan.ship_to_pincode || challan.bill_to_pincode) {
      cityStateParts.push(challan.ship_to_pincode || challan.bill_to_pincode)
    }
    
    if (cityStateParts.length > 0) {
      parts.push(cityStateParts.join(' '))
    }
    
    const addressStr = parts.join(', ')
    const gst = challan.ship_to_gst || challan.bill_to_gst
    return gst ? `${addressStr} | GST: ${gst}` : addressStr
  }

  const renderChallanCopy = (copyType) => (
    <div className="challan-half">
      <div className="company-header">
        <h2>FOUR (R) PLASTIC</h2>
      </div>

      <div className="copy-type">{copyType}</div>
      
      <div className="header">
        <h1>DELIVERY CHALLAN</h1>
      </div>

      <div className="company-details">
        <strong>FOUR (R) PLASTIC</strong><br />
        90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA, MUMBAI - 400072<br />
        GST: 27ABTPV9432F1ZX
      </div>

      <table className="details-table-grid">
        <tbody>
          <tr>
            <td className="label-cell">Challan No</td>
            <td className="value-cell">: {challan.challan_no}</td>
            <td className="label-cell text-right-label">Date</td>
            <td className="value-cell">: {formatDate(challan.challan_date)}</td>
          </tr>
          <tr>
            <td className="label-cell">Bill To</td>
            <td colSpan="3" className="value-cell">: {formatBillToAddress()}</td>
          </tr>
          <tr>
            <td className="label-cell">Ship To</td>
            <td colSpan="3" className="value-cell">: {formatShipToAddress()}</td>
          </tr>
          <tr>
            <td className="label-cell">Vehicle No</td>
            <td className="value-cell">: {challan.vehicle_no || '______'}</td>
            <td className="label-cell text-right-label">Transport</td>
            <td className="value-cell">: {challan.transporter_name || '______'}</td>
          </tr>
        </tbody>
      </table>

      <table className="items-table">
        <thead>
          <tr>
            <th className="item-header">Item Description</th>
            <th className="qty-header">Quantity (KG)</th>
            {showRateAmount && <th className="rate-header">Rate (₹)</th>}
            {showRateAmount && <th className="amount-header">Amount (₹)</th>}
          </tr>
        </thead>
        <tbody>
          {challan.items?.map((item, index) => {
            const qty = Number(item.quantity) || 0
            const rate = Number(item.rate) || 0
            const amt = qty * rate
            return (
              <tr key={index}>
                <td className="item-cell">{item.item_name}</td>
                <td className="qty-cell">{qty.toFixed(2)} KG</td>
                {showRateAmount && <td className="rate-cell">₹{rate.toFixed(2)}</td>}
                {showRateAmount && <td className="amount-cell">₹{amt.toFixed(2)}</td>}
              </tr>
            )
          })}
          <tr className="total-row">
            <td className="total-label"><strong>Total:</strong></td>
            <td className="total-qty"><strong>{totalQty.toFixed(2)} KG</strong></td>
            {showRateAmount && <td className="rate-cell"></td>}
            {showRateAmount && <td className="amount-cell"><strong>₹{totalAmount.toFixed(2)}</strong></td>}
          </tr>
        </tbody>
      </table>

      <div className="amount-in-words">
        <strong>Quantity in words:</strong> {numberToWords(totalQty)} KG Only
        {showRateAmount && (
          <>
            <br />
            <strong>Amount in words:</strong> INR {numberToWords(Math.round(totalAmount))} Only
          </>
        )}
      </div>

      <div className="footer">
        <div className="terms">
          <strong>Terms & Conditions:</strong><br />
          1. Goods once sold will not be taken back.<br />
          2. Interest @ 24% p.a. will be charged on overdue payments.<br />
          3. Subject to Mumbai jurisdiction.
        </div>
        <div className="dsc-signature">
          <div className="dsc-box">
            <div className="dsc-header">
              <svg className="dsc-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Digitally Signed</span>
            </div>
            <div className="dsc-details">
              <p><strong>By:</strong> FOUR (R) PLASTIC</p>
              <p><strong>Date:</strong> {formatDate(challan.challan_date)}</p>
              <p><strong>Reason:</strong> Authorized Signatory</p>
            </div>
          </div>
          <div className="dsc-for">For <strong>FOUR (R) PLASTIC</strong></div>
        </div>
      </div>

      <div className="computer-generated">
        This is a computer generated document - valid without physical signature
      </div>
    </div>
  )

  return (
    <>
      {/* Global CSS for Screen and Print layout */}
      <style jsx global>{`
        @media screen {
          body {
            background-color: #0b0f19 !important;
            color: #f1f5f9 !important;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          }
          .no-print, .no-print * {
            color: #f8fafc !important;
          }
          .no-print input[type="checkbox"] {
            accent-color: #ec4899;
          }
          .print-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
          }
          .challan-half {
            background: rgba(255, 255, 255, 0.05) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            color: #f1f5f9 !important;
            font-family: Arial, sans-serif;
            font-size: 15px;
            position: relative;
          }
          .challan-half * {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          .company-header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
          }
          .company-header h2 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            color: #ec4899 !important;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .header h1 {
            font-size: 20px;
            margin: 0;
            color: #ffffff !important;
            font-weight: bold;
          }
          .company-details {
            text-align: center;
            margin-bottom: 10px;
            font-size: 13px;
            color: #94a3b8 !important;
          }
          .copy-type {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            margin: 5px auto;
            padding: 3px;
            border: 1.5px solid #ec4899 !important;
            width: 120px;
            color: #ec4899 !important;
            border-radius: 6px;
            background: rgba(236, 72, 153, 0.1) !important;
          }
          .details-table-grid {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            background: rgba(255, 255, 255, 0.02) !important;
            border-radius: 8px;
          }
          .details-table-grid td {
            padding: 6px 8px;
            vertical-align: top;
            font-size: 14px;
            border: none !important;
          }
          .label-cell {
            font-weight: bold;
            color: #94a3b8 !important;
            width: 90px;
          }
          .value-cell {
            color: #ffffff !important;
            text-align: left;
          }
          .text-right-label {
            text-align: right;
            padding-right: 12px !important;
            width: 80px;
          }
          .item-header {
            text-align: left !important;
            padding-left: 8px !important;
          }
          .qty-header {
            text-align: right !important;
            padding-right: 8px !important;
          }
          .rate-header {
            text-align: right !important;
            padding-right: 8px !important;
          }
          .amount-header {
            text-align: right !important;
            padding-right: 16px !important;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 14px;
          }
          .items-table th {
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2) !important;
            padding: 6px;
            text-align: center;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.05) !important;
            color: #94a3b8 !important;
            font-size: 14px;
          }
          .items-table td {
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 6px;
          }
          .item-cell {
            text-align: left;
            padding-left: 8px !important;
            color: #ffffff !important;
            font-size: 15px !important;
          }
          .qty-cell {
            text-align: right;
            padding-right: 8px !important;
            font-weight: 600;
            color: #ffffff !important;
            font-size: 15px !important;
          }
          .rate-cell {
            text-align: right;
            padding-right: 8px !important;
            color: #ffffff !important;
            font-size: 15px !important;
          }
          .amount-cell {
            text-align: right;
            padding-right: 16px !important;
            font-weight: 600;
            color: #4ade80 !important;
            font-size: 15px !important;
          }
          .total-row {
            font-weight: bold;
            background: rgba(255, 255, 255, 0.05) !important;
          }
          .total-label {
            text-align: right;
            color: #94a3b8 !important;
            font-size: 15px !important;
          }
          .total-qty {
            text-align: right;
            color: #ffffff !important;
            font-size: 15px !important;
          }
          .amount-in-words {
            margin-top: 8px;
            padding: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            font-style: italic;
            background: rgba(255, 255, 255, 0.02) !important;
            border-radius: 6px;
            color: #cbd5e1 !important;
            font-size: 13px;
          }
          .footer {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }
          .terms {
            width: 60%;
            color: #94a3b8 !important;
            line-height: 1.4;
          }
          .dsc-signature {
            width: 38%;
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .dsc-box {
            border: 1.5px solid #22c55e !important;
            border-radius: 6px;
            padding: 6px;
            background: rgba(34, 197, 94, 0.1) !important;
            text-align: left;
            margin-bottom: 6px;
            width: 150px;
          }
          .dsc-header {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #22c55e !important;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 4px;
          }
          .dsc-icon {
            width: 14px;
            height: 14px;
            stroke: #22c55e !important;
          }
          .dsc-details p {
            margin: 2px 0;
            font-size: 9px;
            color: #86efac !important;
            line-height: 1.2;
          }
          .dsc-for {
            font-size: 10px;
            color: #94a3b8 !important;
          }
          .computer-generated {
            margin-top: 8px;
            font-size: 10px;
            text-align: center;
            font-style: italic;
            color: #64748b !important;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 0.2in;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            color: black !important;
            border-color: black !important;
          }
          .print-container {
            width: 100%;
            height: 100vh;
            background: white;
            color: black;
            display: flex;
            flex-direction: column;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          .no-print {
            display: none !important;
          }
          .challan-half {
            flex: 1;
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            page-break-inside: avoid;
            break-inside: avoid;
            height: 49%;
            position: relative;
          }
          .challan-half:first-child {
            margin-bottom: 8px;
          }
          .challan-half:last-child {
            margin-top: 2px;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 5px;
            padding-bottom: 3px;
            border-bottom: 2px solid #333;
          }
          .company-header h2 {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            color: #1e3c72;
          }
          
          .header {
            text-align: center;
            margin-bottom: 5px;
          }
          .header h1 {
            font-size: 18px;
            margin: 0;
            color: #000;
            font-weight: bold;
          }
          
          .company-details {
            text-align: center;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .copy-type {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            margin: 3px auto;
            padding: 2px;
            border: 1.5px solid #000;
            width: 100px;
            background: transparent !important;
            color: black !important;
          }
          .details-table-grid {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
            border: 1px solid #000;
          }
          .details-table-grid td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 13px;
            border: none !important;
          }
          .label-cell {
            font-weight: bold;
            color: #000;
            width: 90px;
          }
          .value-cell {
            color: #000;
            text-align: left;
          }
          .text-right-label {
            text-align: right;
            padding-right: 12px !important;
            width: 80px;
          }
          .item-header {
            text-align: left !important;
            padding-left: 6px !important;
          }
          .qty-header {
            text-align: right !important;
            padding-right: 6px !important;
          }
          .rate-header {
            text-align: right !important;
            padding-right: 6px !important;
          }
          .amount-header {
            text-align: right !important;
            padding-right: 12px !important;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
            font-size: 14px;
          }
          .items-table th {
            background: transparent !important;
            color: black !important;
            border: 1px solid #000;
            border-bottom: 2px solid #000;
            padding: 4px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
          }
          .items-table td {
            border: 1px solid #000;
            padding: 4px;
          }
          .item-cell {
            text-align: left;
            padding-left: 6px !important;
            font-size: 15px !important;
            font-weight: 500;
          }
          .qty-cell {
            text-align: right;
            padding-right: 6px !important;
            font-size: 15px !important;
            font-weight: 600;
          }
          .rate-cell {
            text-align: right;
            padding-right: 6px !important;
            font-size: 15px !important;
            font-weight: 500;
          }
          .amount-cell {
            text-align: right;
            padding-right: 12px !important; /* give space after total amount column */
            font-size: 15px !important;
            font-weight: 600;
          }
          .item-header, .qty-header, .rate-header, .amount-header {
            font-size: 15px !important;
          }
          .total-row {
            font-weight: bold;
            background: transparent !important;
          }
          .total-label {
            text-align: right;
            font-size: 15px !important;
          }
          .total-qty {
            text-align: right;
            font-size: 15px !important;
          }
          
          .amount-in-words {
            margin-top: 4px;
            padding: 3px;
            border: 1px solid #000;
            font-style: italic;
            font-size: 12px;
            background: #f9f9f9;
          }
          .footer {
            margin-top: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .terms {
            width: 65%;
          }
          .dsc-signature {
            width: 35%;
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .dsc-box {
            border: 1.5px solid #16a34a !important;
            border-radius: 4px;
            padding: 4px;
            background: #fff !important;
            text-align: left;
            margin-bottom: 4px;
            width: 140px;
          }
          .dsc-header {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #16a34a !important;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .dsc-icon {
            width: 12px;
            height: 12px;
            stroke: #16a34a !important;
          }
          .dsc-details p {
            margin: 1px 0;
            font-size: 10px;
            color: #000 !important;
            line-height: 1.1;
          }
          .dsc-for {
            font-size: 11px;
            margin-top: 2px;
          }
          .computer-generated {
            margin-top: 3px;
            font-size: 10px;
            text-align: center;
            font-style: italic;
            color: #666;
          }
        }
      `}</style>

      {/* Control Panel (Screen only, hidden on print) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <span className="font-bold text-lg text-white">DC Print Hub</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-l border-slate-800 pl-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Copies to Print:</span>
            <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printOriginal}
                onChange={(e) => setPrintOriginal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-slate-900"
              />
              Original
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printDuplicate}
                onChange={(e) => setPrintDuplicate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-slate-900"
              />
              Duplicate
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printTriplicate}
                onChange={(e) => setPrintTriplicate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-slate-900"
              />
              Triplicate
            </label>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
            <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRateAmount}
                onChange={(e) => setShowRateAmount(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-slate-900"
              />
              Show Rate & Amount
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-medium text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Print Container */}
      <div className="print-container">
        {printOriginal && renderChallanCopy('ORIGINAL')}
        {printDuplicate && renderChallanCopy('DUPLICATE')}
        {printTriplicate && renderChallanCopy('TRIPLICATE')}
      </div>
    </>
  )
}