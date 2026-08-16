'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useReactToPrint } from "react-to-print";
import { 
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'

export default function ViewSalesInvoicePage() {
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id
  const printRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    setUploading(true)
    const toastId = toast.loading('Uploading PDF attachment...')
    
    try {
      const response = await axios.post('/api/upload/api/upload-cheque', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const filePath = response.data.path
      
      await axios.put(`/api/sales-invoices/${invoiceId}/attachment`, {
        attachment_path: filePath
      })
      
      toast.success('PDF attachment uploaded successfully', { id: toastId })
      
      fetchInvoice()
    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error('Failed to upload PDF attachment', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() ? str.trim() + ' Only' : '';
  };


  const handlePrint = () => {
    if (!invoice) return;
    
    if (invoice.attachment_path) {
      window.open(window.location.origin + invoice.attachment_path, '_blank');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const isFourPlastic = invoice.company_id !== 2;
    const logoUrl = window.location.origin + (isFourPlastic ? '/logo_four_plastic.png' : '/logo_raj_plastic.png');
    const primaryColor = isFourPlastic ? '#004aad' : '#1b8a5a';
    const secondaryColor = isFourPlastic ? '#c8102e' : '#f57c00';
    const addressText = isFourPlastic 
      ? 'WIRE GALLI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST SAKINAKA, MUMBAI - 400072.' 
      : '3 NO. KHADI, SAKINAKA, MUMBAI, MAHARASHTRA - 400072';
    const phoneText = isFourPlastic ? '9867976679' : '+91 9876543210';
    const emailText = isFourPlastic ? 'fourrplastic@gmail.com' : 'contact@rajplastic.com';

    const companyName = isFourPlastic ? "FOUR (R) PLASTIC" : "RAJ PLASTIC";
    const companyGST = isFourPlastic ? "27ABTPV9432F1ZX" : "27DEFAULTGST";

    const isSales = true;
    const invoiceTitle = "TAX INVOICE";

    // Set up party details
    let sellerName = companyName;
    let sellerAddress = addressText;
    let sellerGST = companyGST;
    let sellerState = "Maharashtra";

    let buyerName = invoice.customer_name || "";
    let buyerAddress = `${invoice.bill_to_address || ''}, ${invoice.bill_to_city || ''}, ${invoice.bill_to_state || ''} ${invoice.bill_to_pincode || ''}`.trim();
    let buyerGST = invoice.bill_to_gst || 'URD';
    let buyerState = invoice.bill_to_state || "";

    let consigneeName = invoice.customer_name || "";
    let consigneeAddress = `${invoice.ship_to_address || invoice.bill_to_address || ''}, ${invoice.ship_to_city || invoice.bill_to_city || ''}, ${invoice.ship_to_state || invoice.bill_to_state || ''} ${invoice.ship_to_pincode || invoice.bill_to_pincode || ''}`.trim();
    let consigneeGST = invoice.ship_to_gst || invoice.bill_to_gst || 'URD';
    let consigneeState = invoice.ship_to_state || invoice.bill_to_state || "";

    const isIGST = invoice.igst_total > 0;
    const cgstRate = invoice.items?.[0]?.cgst_rate || (invoice.items?.[0]?.gst_rate / 2) || 9;
    const sgstRate = invoice.items?.[0]?.sgst_rate || (invoice.items?.[0]?.gst_rate / 2) || 9;
    const igstRate = invoice.items?.[0]?.igst_rate || invoice.items?.[0]?.gst_rate || 18;

    const formatAmt = (val) => {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(val) || 0)
    }

    const formatDateObj = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '—'
      const day = String(date.getDate()).padStart(2, '0')
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[date.getMonth()]
      const year = String(date.getFullYear()).slice(-2)
      return `${day}-${month}-${year}`
    }

    const totalQty = invoice.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${invoiceTitle} - ${invoice.invoice_no}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
          @page { size: A4; margin: 8mm; }
          body { 
            font-family: 'Roboto', sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #000; 
            font-size: 9px;
            line-height: 1.25;
          }
          
          .page-wrapper {
            width: 100%;
            height: 275mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-sizing: border-box;
          }
          
          .invoice-container {
            border: 1.5px solid #000;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            flex: 1;
            background: transparent;
            z-index: 1;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          
          /* Top Brand Strip */
          .brand-strip-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            height: 12px;
            margin-bottom: 6px;
          }
          
          /* Top section: 57% Left / 43% Right */
          .top-grid {
            display: grid;
            grid-template-columns: 57% 43%;
            width: 100%;
            border-bottom: 1.5px solid #000;
          }
          
          .left-column-box {
            display: flex;
            flex-direction: column;
            border-right: 1.5px solid #000;
          }
          
          /* Company Brand Details */
          .company-brand-container {
            display: flex;
            flex-direction: column;
            padding: 8px 10px;
          }
          .logo-img {
            height: 50px;
            width: auto;
            object-fit: contain;
            align-self: flex-start;
            margin-bottom: 6px;
          }
          .brand-name {
            font-size: 18px;
            font-weight: 900;
            color: ${primaryColor} !important;
            margin: 0;
            line-height: 1.1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .brand-subtitle {
            font-size: 8px;
            font-weight: bold;
            color: #333;
            margin: 1px 0 3px 0;
            font-style: italic;
          }
          .contact-item {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 1px;
            font-size: 8px;
            color: #000;
            font-weight: 500;
          }
          .contact-item svg {
            width: 8px;
            height: 8px;
            stroke: ${primaryColor} !important;
            stroke-width: 2.5;
            fill: none;
            flex-shrink: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Bill To & Ship To side-by-side */
          .bill-ship-box {
            display: grid;
            grid-template-columns: 50% 50%;
            border-top: 1.5px solid #000;
            flex: 1;
          }
          .party-box {
            display: flex;
            flex-direction: column;
            padding: 5px;
            box-sizing: border-box;
          }
          .party-box.border-right {
            border-right: 1.5px solid #000;
          }
          .party-header {
            background-color: #edf2f7 !important;
            color: ${primaryColor} !important;
            font-weight: 800;
            text-transform: uppercase;
            padding: 2px 5px;
            font-size: 8px;
            border-bottom: 1px solid #000;
            margin: -5px -5px 5px -5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .party-name {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 2px;
          }
          .party-details {
            font-size: 8.5px;
            line-height: 1.25;
          }
          
          /* Right Column Metadata Grid */
          .right-column-box {
            display: flex;
            flex-direction: column;
          }
          .tax-invoice-header {
            font-size: 20px;
            font-weight: 900;
            color: ${primaryColor} !important;
            text-align: right;
            padding: 10px 10px 4px 10px;
            letter-spacing: 0.5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1.5px solid #000;
            font-size: 8px;
            flex: 1;
          }
          .metadata-table td {
            border-bottom: 1px solid #000;
            padding: 2px 6px;
            vertical-align: middle;
            line-height: 1.15;
          }
          .metadata-table tr:last-child td {
            border-bottom: none;
          }
          .metadata-label {
            color: #333;
          }
          .metadata-value {
            font-weight: bold;
          }
          
          /* Items Table */
          .items-container {
            border-bottom: 1.5px solid #000;
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            flex: 1;
          }
          .items-table th {
            background-color: ${primaryColor} !important;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 9px;
            padding: 4px;
            border-right: 1px solid #ffffff;
            border-bottom: 1.5px solid #000;
            text-transform: uppercase;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .items-table th:last-child {
            border-right: none;
          }
          .items-table td {
            border-right: 1px solid #000;
            padding: 4px 5px;
            vertical-align: top;
            font-size: 9px;
          }
          .items-table td:last-child {
            border-right: none;
          }
          .items-table tr.item-row td {
            font-weight: 500;
          }
          .items-table tr.tax-row td {
            font-weight: bold;
            padding-top: 1px;
            padding-bottom: 1px;
          }
          .items-table .empty-filler {
            height: auto;
          }
          
          /* Totals Row */
          .totals-row {
            display: flex;
            border-bottom: 1.5px solid #000;
          }
          .amount-words-box {
            width: 65%;
            padding: 4px 6px;
            border-right: 1px solid #000;
            box-sizing: border-box;
          }
          .words-label {
            color: #555;
            font-size: 7.5px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .words-value {
            font-weight: 800;
            font-size: 9.5px;
            margin-top: 1px;
          }
          .totals-value-box {
            width: 35%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 900;
            box-sizing: border-box;
          }
          
          /* Tax Breakdown Table */
          .tax-breakdown-container {
            width: 100%;
            border-bottom: 1.5px solid #000;
          }
          .tax-table {
            width: 100%;
            border-collapse: collapse;
          }
          .tax-table th {
            background-color: #edf2f7 !important;
            color: #333 !important;
            border: 1px solid #000;
            border-top: none;
            font-size: 8px;
            font-weight: bold;
            padding: 2px;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .tax-table th:first-child { border-left: none; }
          .tax-table th:last-child { border-right: none; }
          .tax-table td {
            border: 1px solid #000;
            padding: 2px 4px;
            font-size: 8px;
            text-align: right;
          }
          .tax-table td:first-child { border-left: none; text-align: left; }
          .tax-table td:last-child { border-right: none; }
          .tax-table tr.total-tax-row td {
            font-weight: bold;
            background-color: #f7fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .tax-words-row {
            padding: 4px 6px;
            font-size: 8px;
            border-bottom: 1.5px solid #000;
          }
          
          /* Footer grid: 50% / 50% */
          .footer-grid {
            display: grid;
            grid-template-columns: 50% 50%;
            border-bottom: 1.5px solid #000;
          }
          .footer-left-col {
            padding: 4px 6px;
            border-right: 1.5px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .declaration-title {
            font-weight: bold;
            font-size: 7.5px;
            color: #555;
            text-transform: uppercase;
          }
          .declaration-text {
            font-size: 7.5px;
            text-align: justify;
            color: #000;
            margin-top: 1px;
            line-height: 1.25;
          }
          .customer-sig-space {
            margin-top: 25px;
            font-size: 8px;
            font-weight: bold;
            color: #333;
          }
          
          .footer-right-col {
            padding: 4px 6px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 90px;
          }
          .bank-title {
            font-weight: bold;
            font-size: 7.5px;
            color: #555;
            text-transform: uppercase;
          }
          .bank-details-text {
            font-size: 8px;
            margin-top: 1px;
            line-height: 1.25;
          }
          .company-sig-space {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-top: 10px;
          }
          .for-company-name {
            font-weight: 800;
            font-size: 9px;
            color: ${primaryColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .auth-sig-label {
            margin-top: 25px;
            font-weight: bold;
            font-size: 7.5px;
            text-transform: uppercase;
            color: #555;
            border-top: 1px solid #000;
            padding-top: 2px;
            width: 120px;
            text-align: center;
          }
          
          /* Bottom contact bar */
          .bottom-contact-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            font-size: 8px;
            font-weight: bold;
            color: #000;
            border-top: 1px solid #ccc;
            margin-top: 3px;
            box-sizing: border-box;
          }
          .contact-bar-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .bar-icon-circle {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid ${primaryColor} !important;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bar-icon-circle svg {
            width: 7px;
            height: 7px;
            stroke: ${primaryColor} !important;
            stroke-width: 2.5;
            fill: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .computer-generated-tag {
            text-align: center;
            font-size: 7.5px;
            color: #555;
            margin-top: 1px;
          }
          
          /* Watermark background */
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
            width: 300px;
          }
          .watermark-logo {
            width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="page-wrapper">
          <!-- Watermark Logo -->
          <div class="watermark-container">
            <img src="${logoUrl}" class="watermark-logo" />
          </div>
          
          <div class="brand-strip-container">
            <svg width="220" height="12" viewBox="0 0 220 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H140L132 12H0V0Z" fill="${primaryColor}"/>
              <path d="M148 0H220V12H140L148 0Z" fill="${secondaryColor}"/>
            </svg>
          </div>
          
          <div class="invoice-container">
            <!-- Header Grid: Brand left, title right -->
            <div class="top-grid">
              <div class="left-column-box">
                <div class="company-brand-container">
                  <img src="${logoUrl}" class="logo-img" />
                  <h1 class="brand-name">${companyName}</h1>
                  <div class="brand-subtitle">${isFourPlastic ? 'Manufacturers of Plastic Colour Granules' : 'Premium Quality Recycled Granules & Plastic Products'}</div>
                  
                  <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${sellerAddress}</span>
                  </div>
                  <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>Mob : ${phoneText}</span>
                  </div>
                  <div class="contact-item">
                    <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <span>Email : ${emailText}</span>
                  </div>
                </div>
                
                <!-- Bill to & Ship to side-by-side -->
                <div class="bill-ship-box">
                  <div class="party-box border-right">
                    <div class="party-header">Bill to</div>
                    <div class="party-name">${buyerName}</div>
                    <div class="party-details">
                      ${buyerAddress}<br/>
                      <span class="font-bold">GSTIN/UIN:</span> ${buyerGST}<br/>
                      <span class="font-bold">State Name:</span> ${buyerState}, Code: ${buyerGST && buyerGST.length >= 2 ? buyerGST.substring(0, 2) : '27'}
                    </div>
                  </div>
                  <div class="party-box">
                    <div class="party-header">Ship to</div>
                    <div class="party-name">${consigneeName}</div>
                    <div class="party-details">
                      ${consigneeAddress}<br/>
                      <span class="font-bold">GSTIN/UIN:</span> ${consigneeGST}<br/>
                      <span class="font-bold">State Name:</span> ${consigneeState}, Code: ${consigneeGST && consigneeGST.length >= 2 ? consigneeGST.substring(0, 2) : '27'}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Right column metadata -->
              <div class="right-column-box">
                <div class="tax-invoice-header">${invoiceTitle}</div>
                <table class="metadata-table">
                  <tr>
                    <td style="width: 35%; color: #333;">Invoice No.</td>
                    <td style="width: 65%; font-weight: bold;">: ${invoice.invoice_no || '—'}</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Date</td>
                    <td style="font-weight: bold;">: ${formatDateObj(invoice.invoice_date) || '—'}</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Delivery Note</td>
                    <td style="font-weight: bold;">: ${invoice.challan_no || '—'}</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Mode/Terms of Payment</td>
                    <td style="font-weight: bold;">: ${invoice.payment_type || '—'}</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Reference No. & Date.</td>
                    <td style="font-weight: bold;">: —</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Other References</td>
                    <td style="font-weight: bold;">: —</td>
                  </tr>
                  <!-- Split Row -->
                  <tr>
                    <td colspan="2" style="padding: 0; border-bottom: none;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                        <tr>
                          <td style="width: 35%; border-bottom: none; border-right: 1px solid #000; padding: 2px 4px;">
                            <span style="color: #333;">Buyer's Order No.</span><br/>
                            <strong>: ${invoice.buyer_order_no || '—'}</strong>
                          </td>
                          <td style="width: 65%; border-bottom: none; padding: 2px 4px;">
                            <span style="color: #333;">Dated</span><br/>
                            <strong>: ${formatDateObj(invoice.buyer_order_date) || '—'}</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #333; border-top: 1px solid #000;">Dispatch Doc No.</td>
                    <td style="font-weight: bold; border-top: 1px solid #000;">: —</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Delivery Note Date</td>
                    <td style="font-weight: bold;">: —</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Despatched through</td>
                    <td style="font-weight: bold;">: ${invoice.transport_mode || '—'}</td>
                  </tr>
                  <tr>
                    <td style="color: #333;">Terms of Delivery</td>
                    <td style="font-weight: bold;">: —</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Items Table -->
            <div class="items-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 5%">SI No.</th>
                    <th style="width: 42%">Description of Goods</th>
                    <th style="width: 12%">HSN/SAC</th>
                    <th style="width: 14%">Quantity</th>
                    <th style="width: 10%">Rate</th>
                    <th style="width: 7%">per</th>
                    <th style="width: 10%">Amount (&#8377;)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map((item, index) => `
                    <tr class="item-row">
                      <td class="text-center">${index + 1}</td>
                      <td>
                        <div class="font-bold">${item.item_name}</div>
                        ${item.discount > 0 ? `<div style="font-size: 7.5px; color: #555;">Less: Discount ${item.discount}%</div>` : ''}
                      </td>
                      <td class="text-center">${item.hsn_code || '—'}</td>
                      <td class="text-right font-bold">${formatAmt(item.quantity)} ${item.unit || 'KG'}</td>
                      <td class="text-right">${formatAmt(item.rate)}</td>
                      <td class="text-center">${item.unit || 'KG'}</td>
                      <td class="text-right font-bold">${formatAmt(item.taxable_value || item.total)}</td>
                    </tr>
                  `).join('')}
                  
                  <!-- GST Output Rows inside table body -->
                  ${isIGST ? `
                    <tr class="tax-row">
                      <td></td>
                      <td class="text-right" style="padding-right: 20px;">IGST ON SALES @ ${igstRate}%</td>
                      <td></td><td></td><td></td>
                      <td class="text-center">${igstRate} %</td>
                      <td class="text-right">${formatAmt(invoice.igst_total)}</td>
                    </tr>
                  ` : `
                    ${(invoice.cgst_total > 0 || invoice.cgst_amount > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right" style="padding-right: 20px;">CGST ON SALES @ ${cgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${cgstRate} %</td>
                        <td class="text-right">${formatAmt(invoice.cgst_total || invoice.cgst_amount || 0)}</td>
                      </tr>
                    ` : ''}
                    ${(invoice.sgst_total > 0 || invoice.sgst_amount > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right" style="padding-right: 20px;">SGST ON SALES @ ${sgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${sgstRate} %</td>
                        <td class="text-right">${formatAmt(invoice.sgst_total || invoice.sgst_amount || 0)}</td>
                      </tr>
                    ` : ''}
                  `}
                  
                  <!-- Empty filler row to expand table border -->
                  <tr class="empty-filler" style="height: 100%;">
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Totals row -->
            <div class="totals-row">
              <div class="amount-words-box">
                <div class="words-label">Amount Chargeable (in words)</div>
                <div class="words-value">INR ${numberToWords(Math.round(invoice.grand_total))}</div>
              </div>
              <div class="totals-value-box">
                <span>Total</span>
                <span>${formatAmt(totalQty)} ${invoice.items?.[0]?.unit || 'KG'}</span>
                <span>&#8377; ${formatAmt(invoice.grand_total)}</span>
              </div>
            </div>
            
            <!-- Tax Breakdown Table -->
            <div class="tax-breakdown-container">
              <table class="tax-table">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 15%">HSN/SAC</th>
                    <th rowspan="2" style="width: 18%">Taxable Value (&#8377;)</th>
                    ${isIGST ? `
                      <th colspan="2" style="width: 25%">Integrated Tax</th>
                    ` : `
                      <th colspan="2" style="width: 20%">CGST</th>
                      <th colspan="2" style="width: 20%">SGST/UTGST</th>
                    `}
                    <th rowspan="2" style="width: 22%">Total Tax Amount (&#8377;)</th>
                  </tr>
                  <tr>
                    ${isIGST ? `
                      <th>Rate</th><th>Amount (&#8377;)</th>
                    ` : `
                      <th>Rate</th><th>Amount (&#8377;)</th>
                      <th>Rate</th><th>Amount (&#8377;)</th>
                    `}
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map(item => `
                    <tr>
                      <td class="text-center">${item.hsn_code || '—'}</td>
                      <td>${formatAmt(item.taxable_value || item.total)}</td>
                      ${isIGST ? `
                        <td class="text-center">${item.igst_rate || igstRate}%</td>
                        <td>${formatAmt(item.igst_amount || 0)}</td>
                      ` : `
                        <td class="text-center">${item.cgst_rate || cgstRate}%</td>
                        <td>${formatAmt(item.cgst_amount || 0)}</td>
                        <td class="text-center">${item.sgst_rate || sgstRate}%</td>
                        <td>${formatAmt(item.sgst_amount || 0)}</td>
                      `}
                      <td class="font-bold">${formatAmt((item.igst_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0))}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-tax-row">
                    <td class="text-center font-bold">Total</td>
                    <td class="font-bold">${formatAmt(invoice.taxable_amount || invoice.subtotal)}</td>
                    ${isIGST ? `
                      <td></td>
                      <td class="font-bold">${formatAmt(invoice.igst_total)}</td>
                    ` : `
                      <td></td>
                      <td class="font-bold">${formatAmt(invoice.cgst_total || invoice.cgst_amount || 0)}</td>
                      <td></td>
                      <td class="font-bold">${formatAmt(invoice.sgst_total || invoice.sgst_amount || 0)}</td>
                    `}
                    <td class="font-bold">${formatAmt(invoice.gst_total || (invoice.cgst_total + invoice.sgst_total + invoice.igst_total) || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="tax-words-row font-bold">
              Tax Amount (in words) : INR ${numberToWords(Math.round(invoice.gst_total || (invoice.cgst_total + invoice.sgst_total + invoice.igst_total) || 0))}
            </div>
            
            <!-- Footer details grid -->
            <div class="footer-grid">
              <div class="footer-left-col">
                <div>
                  <div class="declaration-title">Declaration</div>
                  <div class="declaration-text">
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                  </div>
                </div>
                <div class="customer-sig-space">
                  Customer's Seal and Signature
                </div>
              </div>
              <div class="footer-right-col">
                <div>
                  <div class="bank-title">Company's Bank Details</div>
                  <div class="bank-details-text">
                    Bank Name : <span class="font-bold">CANARA BANK</span><br/>
                    A/c No. : <span class="font-bold">0127201004588</span><br/>
                    Branch & IFS Code : <span class="font-bold">SAKINAKA & CNRB0002411</span>
                  </div>
                </div>
                <div class="company-sig-space">
                  <span class="for-company-name">for ${companyName}</span>
                  <span class="auth-sig-label">Authorised Signatory</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div class="bottom-contact-bar">
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <span>${addressText}</span>
              </div>
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <span>${phoneText}</span>
              </div>
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span>${emailText}</span>
              </div>
            </div>
            <div class="computer-generated-tag">This is a Computer Generated Invoice</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }



  useEffect(() => {
    checkAuth()
    if (invoiceId) {
      if (invoiceId === 'imported' || isNaN(Number(invoiceId))) {
        router.push('/sales-invoices')
      } else {
        fetchInvoice()
      }
    }
  }, [invoiceId])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`/api/sales-invoices/${invoiceId}`)
      setInvoice(response.data)
    } catch (error) {
      toast.error('Failed to fetch invoice')
      router.push('/sales-invoices')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleEdit = () => {
    router.push(`/sales-invoices/edit/${invoiceId}`)
  }

  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const text = `*Invoice Details - FOUR (R) PLASTIC*\n\nInvoice No: ${invoice.invoice_no}\nDate: ${formatDate(invoice.invoice_date)}\nCustomer: ${invoice.customer_name}\nTotal Amount: ${formatCurrency(invoice.grand_total)}\n\nThank you for your business!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/sales-invoices/${invoiceId}`)
      toast.success('Sales invoice deleted successfully')
      router.push('/sales-invoices')
    } catch (error) {
      console.error('❌ Error deleting invoice:', error)
      toast.error('Failed to delete invoice')
    }
    setShowDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            color: black !important;
            border-color: black !important;
          }
          /* Override glassmorphism for print */
          .print\\:bg-white { background: white !important; }
          .bg-white\\/5, .bg-white\\/10 { background: transparent !important; }
          .text-white, .text-white\\/60, .text-white\\/70, .text-white\\/80, .text-green-400 { color: black !important; }
          .border-white\\/20, .divide-white\\/10 > * { border-color: black !important; }
          table th, table td { border: 1px solid black !important; }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] print:hidden" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/sales-invoices')}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                  <h1 className="text-2xl font-bold text-white">
                    Invoice {invoice.invoice_no}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-400 hover:bg-pink-500/30 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperClipIcon className="h-4 w-4" />
                  {invoice.attachment_path ? 'Change PDF' : 'Upload PDF'}
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 transition-colors print:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30  rounded-lg text-blue-400 hover:bg-blue-500/30 flex items-center gap-2 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handlePrint()}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/30  rounded-lg text-purple-400 hover:bg-purple-500/30 flex items-center gap-2 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Save PDF / Print
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30  rounded-lg text-red-400 hover:bg-red-500/30 flex items-center gap-2 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Delete Invoice</h3>
              </div>
              
              <p className="text-white/70 mb-6">
                Are you sure you want to delete invoice <span className="text-white font-semibold">{invoice.invoice_no}</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >
          {/* PDF Attachment Alert Bar */}
          {invoice.attachment_path && (
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  <PaperClipIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Invoice PDF Attachment</h4>
                  <p className="text-xs text-white/60">An official PDF invoice is attached to this record.</p>
                </div>
              </div>
              <a
                href={`${invoice.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-500 text-white font-semibold text-xs rounded-lg hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25"
              >
                View Attachment
              </a>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 print:bg-white print:text-black">
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">FOUR (R) PLASTIC</h2>
                <p className="text-white/60 text-sm">90 FEET ROAD, WIRE GALI, KHADI NO.3</p>
                <p className="text-white/60 text-sm">ANISH COMPOUND, SAKINAKA, MUMBAI - 400078</p>
                <p className="text-white/60 text-sm">GST: 27ABTPV9432F1ZX | PAN: AAAAA0000A</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Invoice No:</p>
                <p className="text-white font-bold text-xl">{invoice.invoice_no}</p>
                <p className="text-white/60 text-sm mt-2">Invoice Date:</p>
                <p className="text-white">{formatDate(invoice.invoice_date)}</p>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-white/80 text-sm font-semibold mb-2">Bill To</h3>
                <p className="text-white font-medium">{invoice.customer_name}</p>
                <p className="text-white/70 text-sm">{invoice.bill_to_address}</p>
                <p className="text-white/70 text-sm">{invoice.bill_to_city}, {invoice.bill_to_state} - {invoice.bill_to_pincode}</p>
                <p className="text-white/70 text-sm">GST: {invoice.bill_to_gst}</p>
              </div>
              <div>
                <h3 className="text-white/80 text-sm font-semibold mb-2">Ship To</h3>
                <p className="text-white font-medium">{invoice.customer_name}</p>
                <p className="text-white/70 text-sm">{invoice.ship_to_address}</p>
                <p className="text-white/70 text-sm">{invoice.ship_to_city}, {invoice.ship_to_state} - {invoice.ship_to_pincode}</p>
                <p className="text-white/70 text-sm">GST: {invoice.ship_to_gst}</p>
              </div>
            </div>

            {/* Transport Details */}
            {(invoice.place_of_supply || invoice.transport_mode || invoice.vehicle_no) && (
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-white/5 rounded-lg">
                {invoice.place_of_supply && (
                  <div>
                    <p className="text-white/60 text-xs">Place of Supply</p>
                    <p className="text-white text-sm">{invoice.place_of_supply}</p>
                  </div>
                )}
                {invoice.transport_mode && (
                  <div>
                    <p className="text-white/60 text-xs">Transport Mode</p>
                    <p className="text-white text-sm">{invoice.transport_mode}</p>
                  </div>
                )}
                {invoice.vehicle_no && (
                  <div>
                    <p className="text-white/60 text-xs">Vehicle No</p>
                    <p className="text-white text-sm">{invoice.vehicle_no}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-white/80 text-sm font-semibold mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60">HSN</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Rate</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Disc%</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Taxable</th>
                      {invoice.igst_total > 0 ? (
                        <th className="px-4 py-2 text-right text-xs font-medium text-white/60">IGST</th>
                      ) : (
                        <>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">CGST</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-white/60">SGST</th>
                        </>
                      )}
                      <th className="px-4 py-2 text-right text-xs font-medium text-white/60">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {invoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-white">{item.item_name}</td>
                        <td className="px-4 py-3 text-sm text-white/70">{item.hsn_code}</td>
                        <td className="px-4 py-3 text-sm text-white text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-white text-right">{formatCurrency(item.rate)}</td>
                        <td className="px-4 py-3 text-sm text-white text-right">{item.discount}%</td>
                        <td className="px-4 py-3 text-sm text-white text-right">{formatCurrency(item.taxable_value)}</td>
                        {invoice.igst_total > 0 ? (
                          <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.igst_amount)}</td>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.cgst_amount)}</td>
                            <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(item.sgst_amount)}</td>
                          </>
                        )}
                        <td className="px-4 py-3 text-sm text-white font-semibold text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Subtotal:</span>
                  <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Discount ({invoice.discount}%):</span>
                  <span className="text-white">-{formatCurrency(invoice.subtotal * invoice.discount / 100)}</span>
                </div>
                <div className="flex justify-between text-white/80 border-t border-white/20 pt-2">
                  <span>Taxable Amount:</span>
                  <span className="text-white font-semibold">{formatCurrency(invoice.taxable_amount)}</span>
                </div>
                {invoice.igst_total > 0 ? (
                  <div className="flex justify-between text-white/80">
                    <span>IGST:</span>
                    <span className="text-green-400">{formatCurrency(invoice.igst_total)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-white/80">
                      <span>CGST:</span>
                      <span className="text-green-400">{formatCurrency(invoice.cgst_total)}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>SGST:</span>
                      <span className="text-green-400">{formatCurrency(invoice.sgst_total)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-white/80 pt-2 border-t border-white/20">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="text-white font-bold text-xl">{formatCurrency(invoice.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-sm">Notes:</p>
                <p className="text-white text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}