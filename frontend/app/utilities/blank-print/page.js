'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  PrinterIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import axios from 'axios'
import TallyImportWizard from '@/components/TallyImportWizard'

// FOUR PLASTIC Logo Component (Using the transparent high-fidelity PNG image)
function FourPlasticLogo({ className = '' }) {
  return (
    <img 
      src="/logo_four_plastic.png" 
      alt="FOUR PLASTIC" 
      className={`${className} object-contain`}
      style={{ display: 'block' }}
    />
  )
}

// RAJ PLASTIC Logo Component (Using the transparent high-fidelity PNG image)
function RajPlasticLogo({ className = '' }) {
  return (
    <img 
      src="/logo_raj_plastic.png" 
      alt="RAJ PLASTIC" 
      className={`${className} object-contain`}
      style={{ display: 'block' }}
    />
  )
}

export default function BlankPrintPage() {
  const router = useRouter()
  const [isImportOpen, setIsImportOpen] = useState(false)
  
  // Custom states for the watermark blank print utility
  const [company, setCompany] = useState('four_plastic') // four_plastic, raj_plastic
  const [layoutPreset, setLayoutPreset] = useState('watermark_letterhead') // watermark_only, watermark_letterhead, letterhead_only
  const [opacity, setOpacity] = useState(6) // percentage 1% to 20%
  const [logoSize, setLogoSize] = useState(320) // width in pixels
  const [watermarkStyle, setWatermarkStyle] = useState('center') // center, tiled
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [scale, setScale] = useState(1)

  // Overlay Cover Toggles
  const [coverHeader, setCoverHeader] = useState(true)
  const [coverSignatory, setCoverSignatory] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Direct PDF states
  const [directPdfPath, setDirectPdfPath] = useState('')
  const [directPdfData, setDirectPdfData] = useState(null)
  const directPdfInputRef = useRef(null)

  // Invoice Integration states
  const [mode, setMode] = useState('blank') // blank, direct_pdf, sales_invoice, purchase_invoice
  const [invoiceList, setInvoiceList] = useState([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null)
  const [mergedPdfPath, setMergedPdfPath] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const loadedCompanyRef = useRef('')

  const handleImportSuccess = async (invoiceId, isSalesInvoice) => {
    const newMode = isSalesInvoice ? 'sales_invoice' : 'purchase_invoice'
    setMode(newMode)
    
    // Fetch the list of invoices for the new mode
    try {
      const endpoint = isSalesInvoice ? '/api/sales-invoices' : '/api/purchase-invoices'
      const response = await axios.get(endpoint)
      setInvoiceList(response.data)
      // Auto-select the newly created invoice
      setSelectedInvoiceId(invoiceId)
    } catch (err) {
      console.error('Error refreshing invoices after import:', err)
    }
    setIsImportOpen(false)
  }

  useEffect(() => {
    const updateScale = () => {
      const previewArea = document.getElementById('preview-area')
      if (!previewArea) return
      
      const padding = 64 // p-4 = 16px padding (32px total) or lg:p-8 = 32px padding (64px total)
      const availableWidth = previewArea.clientWidth - padding
      const a4Width = 794 // 210mm in pixels (approx)
      
      if (availableWidth < a4Width) {
         setScale(availableWidth / a4Width)
      } else {
         setScale(1)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    
    // Run after a short delay to ensure DOM layout is settled
    const timer = setTimeout(updateScale, 200)
    
    return () => {
      window.removeEventListener('resize', updateScale)
      clearTimeout(timer)
    }
  }, [])
  
  // Letterhead details
  const [headerText, setHeaderText] = useState('FOUR (R) PLASTIC')
  const [subHeaderText, setSubHeaderText] = useState('Manufacturers of Premium Plastic Raw Materials')
  const [address, setAddress] = useState('WIRE GALI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST, SAKINAKA, MUMBAI - 400072.')
  const [phone, setPhone] = useState('9867976679')
  const [email, setEmail] = useState('fourrplastic@gmali.com')
  const [gstNo, setGstNo] = useState('')
  const [footerText, setFooterText] = useState('')
  const [customTitle, setCustomTitle] = useState('')

  // Handle changes when switching company
  useEffect(() => {
    if (company === 'four_plastic') {
      setHeaderText('FOUR (R) PLASTIC')
      setSubHeaderText('Manufacturers of Premium Plastic Raw Materials')
      setAddress(localStorage.getItem('lh_address_four_plastic') || 'WIRE GALI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST, SAKINAKA, MUMBAI - 400072.')
      setPhone(localStorage.getItem('lh_phone_four_plastic') || '9867976679')
      setEmail(localStorage.getItem('lh_email_four_plastic') || 'fourrplastic@gmali.com')
      setGstNo(localStorage.getItem('lh_gst_four_plastic') || '')
      setFooterText(localStorage.getItem('lh_footer_four_plastic') || '')
    } else {
      setHeaderText('RAJ PLASTIC')
      setSubHeaderText('Premium Quality Recycled Granules & Plastic Products')
      setAddress(localStorage.getItem('lh_address_raj_plastic') || '3 NO. KHADI, SAKINAKA, MUMBAI, MAHARASHTRA - 400072')
      setPhone(localStorage.getItem('lh_phone_raj_plastic') || '+91 9876543210')
      setEmail(localStorage.getItem('lh_email_raj_plastic') || 'contact@rajplastic.com')
      setGstNo(localStorage.getItem('lh_gst_raj_plastic') || '')
      setFooterText(localStorage.getItem('lh_footer_raj_plastic') || '')
    }
    loadedCompanyRef.current = company
    setIsLoaded(true)
  }, [company])

  // Save letterhead settings to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    // Skip saving if the settings loaded in the state do not match the selected company yet (transition/race condition guard)
    if (loadedCompanyRef.current !== company) return;
    
    const suffix = company === 'four_plastic' ? 'four_plastic' : 'raj_plastic';
    localStorage.setItem(`lh_address_${suffix}`, address);
    localStorage.setItem(`lh_phone_${suffix}`, phone);
    localStorage.setItem(`lh_email_${suffix}`, email);
    localStorage.setItem(`lh_gst_${suffix}`, gstNo);
    localStorage.setItem(`lh_footer_${suffix}`, footerText);
  }, [address, phone, email, gstNo, footerText, company, isLoaded])

  const printInvoiceLayout = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const isFourPlastic = company === 'four_plastic';
    const logoUrl = window.location.origin + (isFourPlastic ? '/logo_four_plastic.png' : '/logo_raj_plastic.png');
    const primaryColor = isFourPlastic ? '#004aad' : '#1b8a5a';
    const secondaryColor = isFourPlastic ? '#c8102e' : '#f57c00';

    const ourCompanyName = isFourPlastic ? "FOUR (R) PLASTIC" : "RAJ PLASTIC";
    const ourCompanyAddress = address;
    const ourCompanyGST = gstNo || (isFourPlastic ? "27ABTPV9432F1ZX" : "27DEFAULTGST");
    const ourCompanyState = "Maharashtra";
    const ourCompanyStateCode = "27";

    const isSales = mode === 'sales_invoice';
    const invoiceTitle = isSales ? "TAX INVOICE" : "PURCHASE INVOICE";

    // Set up party details
    let sellerName = "";
    let sellerAddress = "";
    let sellerGST = "";
    let sellerState = "";

    let buyerName = "";
    let buyerAddress = "";
    let buyerGST = "";
    let buyerState = "";

    let consigneeName = "";
    let consigneeAddress = "";
    let consigneeGST = "";
    let consigneeState = "";

    if (isSales) {
      sellerName = ourCompanyName;
      sellerAddress = ourCompanyAddress;
      sellerGST = ourCompanyGST;
      sellerState = ourCompanyState;

      buyerName = invoice.customer_name || "";
      buyerAddress = `${invoice.bill_to_address || ''}, ${invoice.bill_to_city || ''}, ${invoice.bill_to_state || ''} ${invoice.bill_to_pincode || ''}`.trim();
      buyerGST = invoice.bill_to_gst || 'URD';
      buyerState = invoice.bill_to_state || "";

      consigneeName = invoice.customer_name || "";
      consigneeAddress = `${invoice.ship_to_address || invoice.bill_to_address || ''}, ${invoice.ship_to_city || invoice.bill_to_city || ''}, ${invoice.ship_to_state || invoice.bill_to_state || ''} ${invoice.ship_to_pincode || invoice.bill_to_pincode || ''}`.trim();
      consigneeGST = invoice.ship_to_gst || invoice.bill_to_gst || 'URD';
      consigneeState = invoice.ship_to_state || invoice.bill_to_state || "";
    } else {
      sellerName = invoice.vendor_name || "";
      sellerAddress = `${invoice.ship_to_address || ''}, ${invoice.ship_to_city || ''}, ${invoice.ship_to_state || ''} ${invoice.ship_to_pincode || ''}`.trim();
      sellerGST = invoice.vendor_gst || 'URD';
      sellerState = invoice.ship_to_state || "";

      buyerName = ourCompanyName;
      buyerAddress = ourCompanyAddress;
      buyerGST = ourCompanyGST;
      buyerState = ourCompanyState;

      consigneeName = ourCompanyName;
      consigneeAddress = ourCompanyAddress;
      consigneeGST = ourCompanyGST;
      consigneeState = ourCompanyState;
    }

    const isIGST = invoice.igst_total > 0;
    const cgstRate = invoice.items?.[0]?.cgst_rate || (invoice.items?.[0]?.gst_rate / 2) || 9;
    const sgstRate = invoice.items?.[0]?.sgst_rate || (invoice.items?.[0]?.gst_rate / 2) || 9;
    const igstRate = invoice.items?.[0]?.igst_rate || invoice.items?.[0]?.gst_rate || 18;

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
            font-size: 10px;
            line-height: 1.3;
          }
          
          .page-wrapper {
            width: 100%;
            height: 265mm;
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
          .color-strip {
            position: absolute;
            top: 0;
            right: 0;
            width: 40%;
            height: 6px;
            display: flex;
          }
          .strip-blue {
            width: 70%;
            background-color: ${primaryColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .strip-red {
            width: 30%;
            background-color: ${secondaryColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Top section: 60% Left / 40% Right */
          .top-grid {
            display: grid;
            grid-template-columns: 60% 40%;
            width: 100%;
          }
          
          .left-column-box {
            display: flex;
            flex-direction: column;
            border-right: 1.5px solid #000;
          }
          
          /* Company Brand Details */
          .company-brand-container {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px 8px;
          }
          .logo-img {
            height: 52px;
            width: auto;
            object-fit: contain;
          }
          .brand-info-box {
            display: flex;
            flex-direction: column;
          }
          .brand-name {
            font-size: 19px;
            font-weight: 900;
            color: ${primaryColor} !important;
            margin: 0;
            line-height: 1.1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .brand-subtitle {
            font-size: 9.5px;
            font-weight: 700;
            color: #333;
            margin: 2px 0 4px 0;
          }
          .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 1px;
            font-size: 10px;
            color: #000;
            font-weight: bold;
          }
          .contact-item svg {
            width: 9px;
            height: 9px;
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
            padding: 6px;
            box-sizing: border-box;
          }
          .party-box.border-right {
            border-right: 1px solid #000;
          }
          .party-header {
            background-color: #edf2f7 !important;
            color: ${primaryColor} !important;
            font-weight: 800;
            text-transform: uppercase;
            padding: 3px 6px;
            font-size: 8.5px;
            border-bottom: 1px solid #000;
            margin: -6px -6px 6px -6px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .party-name {
            font-weight: bold;
            font-size: 10.5px;
            margin-bottom: 2px;
          }
          .party-details {
            font-size: 9px;
            line-height: 1.3;
          }
          
          /* Right Column Metadata Grid */
          .right-column-box {
            display: flex;
            flex-direction: column;
          }
          .tax-invoice-header {
            font-size: 22px;
            font-weight: 900;
            color: ${primaryColor} !important;
            text-align: right;
            padding: 10px 10px 5px 10px;
            letter-spacing: 0.5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .metadata-grid {
            display: grid;
            grid-template-columns: 100%;
            flex: 1;
            border-top: 1.5px solid #000;
          }
          .metadata-row {
            display: grid;
            grid-template-columns: 48% 52%;
            border-bottom: 1px solid #000;
            min-height: 19px;
            align-items: center;
            padding: 2px 8px;
            box-sizing: border-box;
            font-size: 9px;
          }
          .metadata-row:last-child {
            border-bottom: none;
          }
          .metadata-label {
            font-weight: 500;
            color: #333;
          }
          .metadata-value {
            font-weight: bold;
            color: #000;
          }
          
          /* Items Table */
          .items-container {
            border-top: 1.5px solid #000;
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
            font-size: 9.5px;
            padding: 5px 4px;
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
            padding: 5px 6px;
            vertical-align: top;
            font-size: 9.5px;
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
            padding: 6px 8px;
            border-right: 1px solid #000;
            box-sizing: border-box;
          }
          .words-label {
            color: #555;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .words-value {
            font-weight: 800;
            font-size: 10px;
            margin-top: 1px;
          }
          .totals-value-box {
            width: 35%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            font-size: 11.5px;
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
            font-size: 8.5px;
            font-weight: bold;
            padding: 3px;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .tax-table th:first-child { border-left: none; }
          .tax-table th:last-child { border-right: none; }
          .tax-table td {
            border: 1px solid #000;
            padding: 3px 6px;
            font-size: 9px;
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
            padding: 4px 8px;
            font-size: 9px;
            border-bottom: 1.5px solid #000;
          }
          
          /* Footer grid: 50% / 50% */
          .footer-grid {
            display: grid;
            grid-template-columns: 50% 50%;
            border-bottom: 1.5px solid #000;
          }
          .footer-left-col {
            padding: 6px 8px;
            border-right: 1.5px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .declaration-title {
            font-weight: bold;
            font-size: 8px;
            color: #555;
            text-transform: uppercase;
          }
          .declaration-text {
            font-size: 8px;
            text-align: justify;
            color: #000;
            margin-top: 1px;
            line-height: 1.3;
          }
          .customer-sig-space {
            margin-top: 30px;
            font-size: 8.5px;
            font-weight: bold;
            color: #333;
          }
          
          .footer-right-col {
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 100px;
          }
          .bank-title {
            font-weight: bold;
            font-size: 8px;
            color: #555;
            text-transform: uppercase;
          }
          .bank-details-text {
            font-size: 8.5px;
            margin-top: 1px;
            line-height: 1.3;
          }
          .company-sig-space {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-top: 15px;
          }
          .for-company-name {
            font-weight: 800;
            font-size: 9.5px;
            color: ${primaryColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .auth-sig-label {
            margin-top: 35px;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #555;
            border-top: 1px solid #000;
            padding-top: 2px;
            width: 130px;
            text-align: center;
          }
          
          /* Bottom contact bar */
          .bottom-contact-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            font-size: 8.5px;
            font-weight: bold;
            color: #000;
            border-top: 1px solid #ccc;
            margin-top: 4px;
            box-sizing: border-box;
          }
          .contact-bar-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .bar-icon-circle {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid ${primaryColor} !important;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bar-icon-circle svg {
            width: 8px;
            height: 8px;
            stroke: ${primaryColor} !important;
            stroke-width: 2.5;
            fill: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .computer-generated-tag {
            text-align: center;
            font-size: 8px;
            color: #555;
            margin-top: 2px;
          }
          
          /* Watermark background */
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: ${opacity / 100};
            z-index: 0;
            pointer-events: none;
            width: ${logoSize}px;
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
          
          <div class="color-strip">
            <div class="strip-blue"></div>
            <div class="strip-red"></div>
          </div>
          
          <div class="invoice-container">
            <!-- Header Grid: Brand left, title right -->
            <div class="top-grid">
              <div class="left-column-box">
                <div class="company-brand-container">
                  <img src="${logoUrl}" class="logo-img" />
                  <div class="brand-info-box">
                    <h1 class="brand-name">${ourCompanyName}</h1>
                    <div class="brand-subtitle">${isFourPlastic ? 'Manufacturers of Plastic Colour Granules' : 'Premium Quality Recycled Granules & Plastic Products'}</div>
                    
                    <div class="contact-item">
                      <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>${ourCompanyAddress}</span>
                    </div>
                    <div class="contact-item">
                      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span>Mob : ${phone}</span>
                    </div>
                    <div class="contact-item">
                      <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span>Email : ${email}</span>
                    </div>
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
                <div class="metadata-grid">
                  <div class="metadata-row">
                    <div class="metadata-label">Invoice No.</div>
                    <div class="metadata-value">: ${invoice.invoice_no || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Dated</div>
                    <div class="metadata-value">: ${formatDate(invoice.invoice_date) || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Delivery Note</div>
                    <div class="metadata-value">: ${invoice.challan_no || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Mode/Terms of Payment</div>
                    <div class="metadata-value">: ${invoice.payment_type || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Reference No. & Date.</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Other References</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Buyer's Order No.</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Dated</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Dispatch Document No.</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Delivery Note Date</div>
                    <div class="metadata-value">: -</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Despatched through</div>
                    <div class="metadata-value">: ${invoice.transport_mode || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Terms of Delivery</div>
                    <div class="metadata-value">: -</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Items Table -->
            <div class="items-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 5%">Sl No.</th>
                    <th style="width: 42%">Description of Goods</th>
                    <th style="width: 12%">HSN/SAC</th>
                    <th style="width: 14%">Quantity</th>
                    <th style="width: 10%">Rate</th>
                    <th style="width: 7%">per</th>
                    <th style="width: 10%">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map((item, index) => `
                    <tr class="item-row">
                      <td class="text-center">${index + 1}</td>
                      <td>
                        <div class="font-bold">${item.item_name}</div>
                        ${item.discount > 0 ? `<div style="font-size: 8px; color: #555;">Less: Discount ${item.discount}%</div>` : ''}
                      </td>
                      <td class="text-center">${item.hsn_code || ''}</td>
                      <td class="text-right font-bold">${item.quantity} ${item.unit || 'KG'}</td>
                      <td class="text-right">${formatCurrency(item.rate).replace('₹', '')}</td>
                      <td class="text-center">${item.unit || 'KG'}</td>
                      <td class="text-right font-bold">${formatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                    </tr>
                  `).join('')}
                  
                  <!-- GST Output Rows inside table body -->
                  ${isIGST ? `
                    <tr class="tax-row">
                      <td></td>
                      <td class="text-right">Output IGST @ ${igstRate}%</td>
                      <td></td><td></td><td></td>
                      <td class="text-center">${igstRate} %</td>
                      <td class="text-right">${formatCurrency(invoice.igst_total).replace('₹', '')}</td>
                    </tr>
                  ` : `
                    ${(invoice.cgst_total > 0 || invoice.cgst_amount > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right">Output CGST @ ${cgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${cgstRate} %</td>
                        <td class="text-right">${formatCurrency(invoice.cgst_total || invoice.cgst_amount || 0).replace('₹', '')}</td>
                      </tr>
                    ` : ''}
                    ${(invoice.sgst_total > 0 || invoice.sgst_amount > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right">Output SGST @ ${sgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${sgstRate} %</td>
                        <td class="text-right">${formatCurrency(invoice.sgst_total || invoice.sgst_amount || 0).replace('₹', '')}</td>
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
                <span>${formatCurrency(invoice.grand_total)}</span>
              </div>
            </div>
            
            <!-- Tax Breakdown Table -->
            <div class="tax-breakdown-container">
              <table class="tax-table">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 15%">HSN/SAC</th>
                    <th rowspan="2" style="width: 18%">Taxable Value</th>
                    ${isIGST ? `
                      <th colspan="2" style="width: 25%">Integrated Tax</th>
                    ` : `
                      <th colspan="2" style="width: 20%">Central Tax</th>
                      <th colspan="2" style="width: 20%">State Tax</th>
                    `}
                    <th rowspan="2" style="width: 22%">Total Tax Amount</th>
                  </tr>
                  <tr>
                    ${isIGST ? `
                      <th>Rate</th><th>Amount</th>
                    ` : `
                      <th>Rate</th><th>Amount</th>
                      <th>Rate</th><th>Amount</th>
                    `}
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map(item => `
                    <tr>
                      <td class="text-center">${item.hsn_code || ''}</td>
                      <td>${formatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                      ${isIGST ? `
                        <td class="text-center">${item.igst_rate || igstRate}%</td>
                        <td>${formatCurrency(item.igst_amount || 0).replace('₹', '')}</td>
                      ` : `
                        <td class="text-center">${item.cgst_rate || cgstRate}%</td>
                        <td>${formatCurrency(item.cgst_amount || 0).replace('₹', '')}</td>
                        <td class="text-center">${item.sgst_rate || sgstRate}%</td>
                        <td>${formatCurrency(item.sgst_amount || 0).replace('₹', '')}</td>
                      `}
                      <td class="font-bold">${formatCurrency((item.igst_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0)).replace('₹', '')}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-tax-row">
                    <td class="text-center font-bold">Total</td>
                    <td class="font-bold">${formatCurrency(invoice.taxable_amount || invoice.subtotal).replace('₹', '')}</td>
                    ${isIGST ? `
                      <td></td>
                      <td class="font-bold">${formatCurrency(invoice.igst_total).replace('₹', '')}</td>
                    ` : `
                      <td></td>
                      <td class="font-bold">${formatCurrency(invoice.cgst_total || invoice.cgst_amount || 0).replace('₹', '')}</td>
                      <td></td>
                      <td class="font-bold">${formatCurrency(invoice.sgst_total || invoice.sgst_amount || 0).replace('₹', '')}</td>
                    `}
                    <td class="font-bold">${formatCurrency(invoice.gst_total || (invoice.cgst_total + invoice.sgst_total + invoice.igst_total) || 0).replace('₹', '')}</td>
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
                  <span class="for-company-name">for ${ourCompanyName}</span>
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
                <span>${ourCompanyAddress}</span>
              </div>
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <span>${phone}</span>
              </div>
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span>${email}</span>
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

  const handlePrint = () => {
    if (mode === 'direct_pdf') {
      if (mergedPdfPath || directPdfPath) {
        window.open(window.location.origin + (mergedPdfPath || directPdfPath), '_blank');
        return;
      }
      toast.error('Please upload a PDF first');
      return;
    }

    if (selectedInvoiceData) {
      if (mergedPdfPath || selectedInvoiceData.attachment_path) {
        window.open(window.location.origin + (mergedPdfPath || selectedInvoiceData.attachment_path), '_blank');
        return;
      }
      printInvoiceLayout(selectedInvoiceData);
      return;
    }

    toast.success('Opening print dialog... (Be sure to choose "Color" and check "Background graphics" under settings)', { duration: 4000 })
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Invoice Integration hooks & helpers
  useEffect(() => {
    if (mode === 'blank' || mode === 'direct_pdf') {
      setInvoiceList([])
      return
    }

    const fetchInvoices = async () => {
      setLoadingInvoices(true)
      try {
        const endpoint = mode === 'sales_invoice' ? '/api/sales-invoices' : '/api/purchase-invoices'
        const response = await axios.get(endpoint)
        setInvoiceList(response.data)
      } catch (err) {
        console.error('Error fetching invoices:', err)
        toast.error('Failed to load invoices list')
      } finally {
        setLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [mode])

  // Fetch individual invoice details when selected
  useEffect(() => {
    if (selectedInvoiceId === 'imported') {
      return
    }
    if (!selectedInvoiceId) {
      setSelectedInvoiceData(null)
      return
    }

    const fetchInvoiceDetails = async () => {
      try {
        const endpoint = mode === 'sales_invoice' 
          ? `/api/sales-invoices/${selectedInvoiceId}` 
          : `/api/purchase-invoices/${selectedInvoiceId}`
        const response = await axios.get(endpoint)
        setSelectedInvoiceData(response.data)
      } catch (err) {
        console.error('Error fetching invoice details:', err)
        toast.error('Failed to fetch invoice details')
      }
    }

    fetchInvoiceDetails()
  }, [selectedInvoiceId, mode])

  // Trigger overlay generation when PDF invoice or overlay settings change
  useEffect(() => {
    const activePath = mode === 'direct_pdf' ? directPdfPath : selectedInvoiceData?.attachment_path;
    if (!activePath) {
      setMergedPdfPath('')
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setGeneratingPdf(true)
      try {
        const response = await axios.post('/api/upload/generate-overlay-pdf', {
          attachment_path: activePath,
          company: company,
          format: layoutPreset,
          opacity: opacity,
          logo_size: logoSize,
          watermark_style: watermarkStyle,
          header_text: headerText,
          sub_header_text: subHeaderText,
          address: address,
          phone: phone,
          email: email,
          gst_no: gstNo,
          cover_header: coverHeader,
          cover_signatory: coverSignatory
        })
        setMergedPdfPath(response.data.pdf_url)
      } catch (err) {
        console.error('Error generating overlay PDF:', err)
        toast.error('Failed to generate watermark overlay PDF')
      } finally {
        setGeneratingPdf(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [
    mode,
    directPdfPath,
    selectedInvoiceData?.attachment_path,
    company,
    layoutPreset,
    opacity,
    logoSize,
    watermarkStyle,
    headerText,
    subHeaderText,
    address,
    phone,
    email,
    gstNo,
    coverHeader,
    coverSignatory
  ])

  const handleDirectPdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    setUploading(true)
    const toastId = toast.loading('Uploading and parsing PDF...')
    
    try {
      const response = await axios.post('/api/upload/parse-tally-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const parsedData = response.data.parsed_data
      setDirectPdfPath(parsedData.attachment_path)
      setDirectPdfData(parsedData)
      toast.success('PDF uploaded successfully!', { id: toastId })
    } catch (error) {
      console.error('❌ Direct upload error:', error)
      toast.error('Failed to upload PDF', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleFileUploadInPrint = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }

    if (!selectedInvoiceId) {
      toast.error('Please select an invoice first')
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
      const putEndpoint = mode === 'sales_invoice'
        ? `/api/sales-invoices/${selectedInvoiceId}/attachment`
        : `/api/purchase-invoices/${selectedInvoiceId}/attachment`
        
      await axios.put(putEndpoint, {
        attachment_path: filePath
      })
      
      toast.success('Invoice PDF stored successfully!', { id: toastId })
      
      // Refresh details
      const detailsEndpoint = mode === 'sales_invoice' 
        ? `/api/sales-invoices/${selectedInvoiceId}` 
        : `/api/purchase-invoices/${selectedInvoiceId}`
      const detailsResponse = await axios.get(detailsEndpoint)
      setSelectedInvoiceData(detailsResponse.data)
    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error('Failed to store invoice PDF', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleWhatsAppShareInPrint = () => {
    if (!selectedInvoiceData) return
    
    const isSales = mode === 'sales_invoice'
    const docName = isSales ? 'Sales Invoice' : 'Purchase Invoice'
    const invoiceNo = selectedInvoiceData.invoice_no
    const date = formatDate(selectedInvoiceData.invoice_date)
    const partyName = isSales ? selectedInvoiceData.customer_name : selectedInvoiceData.vendor_name
    const partyPhone = isSales ? (selectedInvoiceData.customer_phone || selectedInvoiceData.customer_mobile || '') : (selectedInvoiceData.vendor_phone || '')
    const totalAmount = formatCurrency(selectedInvoiceData.grand_total)
    
    let text = `*${docName} - ${headerText}*\n\n` +
               `Invoice No: ${invoiceNo}\n` +
               `Date: ${date}\n` +
               `Party: ${partyName}\n` +
               `Total Amount: ${totalAmount}\n`
               
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (selectedInvoiceData.attachment_path) {
      text += `\n📄 View Attachment: ${origin}${selectedInvoiceData.attachment_path}`
    } else {
      text += `\n🔗 View details: ${origin}/${isSales ? 'sales-invoices' : 'purchase-invoices'}/${selectedInvoiceId}`
    }
    
    text += `\n\nThank you!`
    
    const cleanedPhone = partyPhone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    return '₹' + formatted
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
  }

  const isFourPlastic = company === 'four_plastic'
  const primaryColor = isFourPlastic ? '#004aad' : '#1b8a5a'
  const secondaryColor = isFourPlastic ? '#c8102e' : '#f57c00'
  const showPdfIframe = !!((mode === 'direct_pdf' && (directPdfPath || mergedPdfPath)) || (selectedInvoiceData && (selectedInvoiceData.attachment_path || mergedPdfPath)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-black">
      
      {/* Header Panel - Hidden on Print */}
      <header className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 print:hidden backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
            title="Go Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <DocumentDuplicateIcon className="h-8 w-8 text-pink-500" />
          <div>
            <h1 className="text-xl font-bold tracking-wide">A4 STATIONERY PRINT UTILITY</h1>
            <p className="text-xs text-slate-400">Generate blank pages with company watermark to pre-print stationery templates</p>
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300 transform active:scale-95"
        >
          <PrinterIcon className="h-5 w-5 animate-pulse" />
          <span>Print A4 Page</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row print:flex-row print:bg-white print:p-0">
        
        {/* Left Control Panel - Hidden on Print */}
        <aside className="w-full lg:w-96 bg-slate-900 border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto print:hidden max-h-[calc(100vh-73px)]">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-pink-500" />
            <h2 className="text-lg font-bold tracking-wider uppercase text-pink-500">Settings</h2>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Print Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMode('blank')
                  setSelectedInvoiceId('')
                  setSelectedInvoiceData(null)
                  setMergedPdfPath('')
                }}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
                  mode === 'blank'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                BLANK PAGE
              </button>
              <button
                onClick={() => {
                  setMode('direct_pdf')
                  setSelectedInvoiceId('')
                  setSelectedInvoiceData(null)
                  setMergedPdfPath('')
                }}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
                  mode === 'direct_pdf'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                DIRECT PDF (NO DB)
              </button>
              <button
                onClick={() => {
                  setMode('sales_invoice')
                  setSelectedInvoiceId('')
                  setSelectedInvoiceData(null)
                  setMergedPdfPath('')
                }}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
                  mode === 'sales_invoice'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                SALES INV (DB)
              </button>
              <button
                onClick={() => {
                  setMode('purchase_invoice')
                  setSelectedInvoiceId('')
                  setSelectedInvoiceData(null)
                  setMergedPdfPath('')
                }}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-xl border transition-all ${
                  mode === 'purchase_invoice'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                PURCHASE INV (DB)
              </button>
            </div>
          </div>

          {/* Direct PDF Upload Panel */}
          {mode === 'direct_pdf' && (
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wide">Direct PDF Operations</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Select Tally PDF Invoice</label>
                
                <input 
                  type="file"
                  accept="application/pdf"
                  ref={directPdfInputRef}
                  onChange={handleDirectPdfUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => directPdfInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 px-4 bg-pink-500/10 border-2 border-dashed border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading & Parsing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">📂</span>
                      <span>{directPdfPath ? 'Replace Uploaded PDF' : 'Upload Tally PDF'}</span>
                      {directPdfData && (
                        <span className="text-[9px] text-slate-400 font-normal mt-1">
                          Loaded: {directPdfData.invoice_no || 'Unknown Invoice'}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tally PDF Import Section */}
          <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-4 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Tally PDF Import (DB)
            </h3>
            <p className="text-[10px] text-slate-400">
              Upload a Tally PDF invoice to automatically parse, map, and create it in the database.
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="w-full py-2 bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500/30 text-pink-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-pink-500/5"
            >
              <span>⚡</span> Import Tally PDF
            </button>
          </div>

          {/* Invoice Selection & Document Operations */}
          {(mode === 'sales_invoice' || mode === 'purchase_invoice') && (
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wide">Invoice Integration</h3>
              
              {loadingInvoices ? (
                <div className="text-xs text-slate-400">Loading invoices...</div>
              ) : (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                >
                  <option value="">-- Select Invoice --</option>
                  {selectedInvoiceId === 'imported' && (
                    <option value="imported">-- Imported PDF Preview --</option>
                  )}
                  {invoiceList.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_no} - {formatDate(inv.invoice_date)} ({mode === 'sales_invoice' ? inv.customer_name : inv.vendor_name})
                    </option>
                  ))}
                </select>
              )}

              {selectedInvoiceData && (
                <div className="space-y-3 pt-2">
                  {/* Action Link to Invoice View Page */}
                  {selectedInvoiceId !== 'imported' && (
                    <div className="flex gap-2">
                      <a
                        href={`/${mode === 'sales_invoice' ? 'sales-invoices' : 'purchase-invoices'}/${selectedInvoiceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-3 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 rounded-lg text-center text-xs font-semibold transition-colors"
                      >
                        View Invoice Page 🔗
                      </a>
                    </div>
                  )}

                  {/* PDF Upload / Attachment Manager */}
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Stored Attachment:</span>
                      {selectedInvoiceData.attachment_path ? (
                        <a
                          href={`${selectedInvoiceData.attachment_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 font-bold hover:underline"
                        >
                          View File 📄
                        </a>
                      ) : (
                        <span className="text-red-400 font-bold">None</span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="application/pdf"
                      onChange={handleFileUploadInPrint}
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-1.5 bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500/30 text-pink-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      {selectedInvoiceData.attachment_path ? 'Replace Stored Invoice' : 'Store Invoice PDF'}
                    </button>
                  </div>

                  {/* WhatsApp sharing */}
                  <div className="border-t border-white/10 pt-3">
                    <button
                      onClick={handleWhatsAppShareInPrint}
                      className="w-full py-1.5 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                      </svg>
                      Share on WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Company Brand</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCompany('four_plastic')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  company === 'four_plastic'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                FOUR PLASTIC
              </button>
              <button
                onClick={() => setCompany('raj_plastic')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  company === 'raj_plastic'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                RAJ PLASTIC
              </button>
            </div>
          </div>

          {/* Layout Presets */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stationery Format</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLayoutPreset('watermark_letterhead')}
                className={`py-2 px-4 text-left text-sm rounded-xl border transition-all ${
                  layoutPreset === 'watermark_letterhead'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                📌 Letterhead & Watermark
              </button>
              <button
                onClick={() => setLayoutPreset('watermark_only')}
                className={`py-2 px-4 text-left text-sm rounded-xl border transition-all ${
                  layoutPreset === 'watermark_only'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌫️ Watermark Only
              </button>
              <button
                onClick={() => setLayoutPreset('letterhead_only')}
                className={`py-2 px-4 text-left text-sm rounded-xl border transition-all ${
                  layoutPreset === 'letterhead_only'
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                📄 Letterhead Only
              </button>
            </div>
          </div>

          {/* Overlay Masking Toggles */}
          {(mode === 'direct_pdf' || selectedInvoiceData?.attachment_path) && (
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide">Overlay Masking Controls</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Control which parts of the original PDF are covered and replaced. Disable if there is overlap or layout shifting.
              </p>
              
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={coverHeader}
                    onChange={(e) => setCoverHeader(e.target.checked)}
                    className="w-4 h-4 bg-slate-950 border border-white/10 rounded accent-pink-500 cursor-pointer"
                  />
                  <span>Replace Supplier Header</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={coverSignatory}
                    onChange={(e) => setCoverSignatory(e.target.checked)}
                    className="w-4 h-4 bg-slate-950 border border-white/10 rounded accent-pink-500 cursor-pointer"
                  />
                  <span>Replace Signatory Line</span>
                </label>
              </div>
            </div>
          )}

          {/* Watermark Details */}
          {layoutPreset !== 'letterhead_only' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide">Watermark Settings</h3>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Logo Opacity</span>
                  <span className="text-white">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Watermark Size</span>
                  <span className="text-white">{logoSize}px</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="450"
                  step="10"
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Watermark Layout</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWatermarkStyle('center')}
                    className={`py-1 px-2 text-xs rounded-lg border transition-all ${
                      watermarkStyle === 'center'
                        ? 'bg-white/10 border-pink-500/40 text-pink-400'
                        : 'bg-white/5 border-transparent text-slate-400'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => setWatermarkStyle('tiled')}
                    className={`py-1 px-2 text-xs rounded-lg border transition-all ${
                      watermarkStyle === 'tiled'
                        ? 'bg-white/10 border-pink-500/40 text-pink-400'
                        : 'bg-white/5 border-transparent text-slate-400'
                    }`}
                  >
                    Tiled (Grid)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Letterhead Fields */}
          {layoutPreset !== 'watermark_only' && (
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide">Header/Footer Text</h3>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Title Banner Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DELIVERY CHALLAN / INVOICE"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sub Header</label>
                <input
                  type="text"
                  value={subHeaderText}
                  onChange={(e) => setSubHeaderText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Address Details</label>
                <textarea
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">GSTIN Number</label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Footer Terms</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Guide settings */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs font-semibold text-slate-400">Show A4 Margins Guidelines</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showGuidelines}
                onChange={(e) => setShowGuidelines(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </aside>

        {/* Live Preview Area */}
        <main 
          id="preview-area"
          className="flex-1 min-w-0 bg-slate-950/20 flex items-start p-4 lg:p-8 overflow-auto print:bg-white print:p-0"
        >
          
          {/* Scale wrapper */}
          <div 
            style={{ 
              width: `calc(210mm * ${scale})`, 
              height: `calc(297mm * ${scale})`,
              position: 'relative',
              overflow: 'visible',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
            className="mx-auto print:w-auto print:h-auto"
          >
            {/* Printable A4 Container */}
            <div 
              id="printable-a4"
              className={`w-[210mm] h-[297mm] bg-white text-black relative flex flex-col p-[15mm] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 print:shadow-none print:transform-none print:w-[210mm] print:h-[297mm] print:p-[15mm] print:m-0
                ${showGuidelines ? 'outline-dashed outline-2 outline-pink-500/30' : ''}`}
              style={{ 
                boxSizing: 'border-box',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor
              }}
            >
            {/* Guidelines Margins Info Banner - Hidden on Print */}
            {showGuidelines && !showPdfIframe && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[9px] text-pink-500/50 font-bold uppercase tracking-widest select-none pointer-events-none print:hidden flex items-center gap-1">
                <SparklesIcon className="h-3 w-3" />
                <span>A4 Page Bounds (Margin 15mm)</span>
              </div>
            )}

            {/* Custom Title Header (Invoice / Challan Template Banner) */}
            {layoutPreset !== 'watermark_only' && customTitle && !showPdfIframe && (
              <div className="w-full text-center border-b-2 border-slate-900 pb-2 mb-6">
                <h2 className="text-xl font-black tracking-widest text-slate-800 uppercase">{customTitle}</h2>
              </div>
            )}

            {/* Letterhead Header Section */}
            {layoutPreset !== 'watermark_only' && !showPdfIframe && (
              <div className="flex justify-between items-start pb-4 z-10 relative">
                {/* Decorative colored strip in top right corner */}
                <div className="absolute top-0 right-0 w-[45%] h-[8px] flex">
                  <div style={{ backgroundColor: primaryColor }} className="h-full w-[65%] divider-line-primary" />
                  <div style={{ backgroundColor: secondaryColor }} className="h-full w-[35%] divider-line-secondary" />
                </div>

                {/* Left side: Company Logo */}
                <div className="flex-1 mt-2">
                  {company === 'four_plastic' ? (
                    <FourPlasticLogo className="w-64 h-auto" />
                  ) : (
                    <RajPlasticLogo className="w-24 h-auto" />
                  )}
                </div>
              </div>
            )}

            {/* Central Watermark Overlay */}
            {layoutPreset !== 'letterhead_only' && !showPdfIframe && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 p-[20mm]">
                {watermarkStyle === 'center' ? (
                  /* Central Single Large Logo */
                  <div 
                    style={{ 
                      width: `${logoSize}px`, 
                      opacity: opacity / 100 
                    }}
                    className="transition-all duration-300 flex items-center justify-center"
                  >
                    {company === 'four_plastic' ? (
                      <FourPlasticLogo className="w-full h-auto" />
                    ) : (
                      <RajPlasticLogo className="w-full h-auto" />
                    )}
                  </div>
                ) : (
                  /* Tiled Logo Grid Overlay */
                  <div 
                    className="w-full h-full grid grid-cols-3 grid-rows-4 gap-x-12 gap-y-16 items-center justify-items-center opacity-70"
                    style={{ opacity: opacity / 100 }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-32 h-16 flex items-center justify-center transform rotate-[-25deg]">
                        {company === 'four_plastic' ? (
                          <FourPlasticLogo className="w-full h-auto" />
                        ) : (
                          <RajPlasticLogo className="w-full h-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {((mode === 'direct_pdf' && (directPdfPath || mergedPdfPath)) || (selectedInvoiceData && (selectedInvoiceData.attachment_path || mergedPdfPath))) ? (
              <div className="absolute inset-0 w-full h-full z-10 bg-slate-900">
                {generatingPdf && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 text-white font-semibold">
                    <div className="bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating Watermark Overlay...</span>
                    </div>
                  </div>
                )}
                <iframe 
                  src={`${mergedPdfPath || (mode === 'direct_pdf' ? directPdfPath : selectedInvoiceData.attachment_path)}#toolbar=0&navpanes=0`} 
                  className="w-full h-full border-none bg-white"
                />
              </div>
            ) : mode === 'direct_pdf' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 text-slate-400 z-10 p-8 text-center border-2 border-dashed border-white/10 rounded-2xl m-[15mm]">
                <span className="text-4xl mb-3">📂</span>
                <h3 className="text-sm font-bold text-white mb-1">No Tally PDF Invoice Loaded</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-normal">
                  Upload a PDF in the left sidebar to overlay watermarks, logo and custom letterheads without saving to database.
                </p>
                <button
                  onClick={() => directPdfInputRef.current?.click()}
                  className="mt-4 px-4 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 text-xs font-bold rounded-lg transition-all"
                >
                  Choose PDF File
                </button>
              </div>
            ) : selectedInvoiceData ? (
              (selectedInvoiceData.attachment_path || mergedPdfPath) ? (
                <div className="absolute inset-0 w-full h-full z-10">
                  {generatingPdf && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 text-white font-semibold">
                      <div className="bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating Watermark Overlay...</span>
                      </div>
                    </div>
                  )}
                  <iframe 
                    src={`${mergedPdfPath || selectedInvoiceData.attachment_path}#toolbar=0&navpanes=0`} 
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (() => {
                const isSales = mode === 'sales_invoice';
                const invoiceTitle = isSales ? "TAX INVOICE" : "PURCHASE INVOICE";
                const logoUrl = isFourPlastic ? '/logo_four_plastic.png' : '/logo_raj_plastic.png';

                let sellerName = "";
                let sellerAddress = "";
                let sellerGST = "";
                let sellerState = "";

                let buyerName = "";
                let buyerAddress = "";
                let buyerGST = "";
                let buyerState = "";

                let consigneeName = "";
                let consigneeAddress = "";
                let consigneeGST = "";
                let consigneeState = "";

                const ourCompanyName = company === 'four_plastic' ? "FOUR (R) PLASTIC" : "RAJ PLASTIC";
                const ourCompanyAddress = address;
                const ourCompanyGST = gstNo || (company === 'four_plastic' ? "27ABTPV9432F1ZX" : "27DEFAULTGST");
                const ourCompanyState = "Maharashtra";

                if (isSales) {
                  sellerName = ourCompanyName;
                  sellerAddress = ourCompanyAddress;
                  sellerGST = ourCompanyGST;
                  sellerState = ourCompanyState;

                  buyerName = selectedInvoiceData.customer_name || "";
                  buyerAddress = `${selectedInvoiceData.bill_to_address || ''}, ${selectedInvoiceData.bill_to_city || ''}, ${selectedInvoiceData.bill_to_state || ''} ${selectedInvoiceData.bill_to_pincode || ''}`.trim();
                  buyerGST = selectedInvoiceData.bill_to_gst || 'URD';
                  buyerState = selectedInvoiceData.bill_to_state || "";

                  consigneeName = selectedInvoiceData.customer_name || "";
                  consigneeAddress = `${selectedInvoiceData.ship_to_address || selectedInvoiceData.bill_to_address || ''}, ${selectedInvoiceData.ship_to_city || selectedInvoiceData.bill_to_city || ''}, ${selectedInvoiceData.ship_to_state || selectedInvoiceData.bill_to_state || ''} ${selectedInvoiceData.ship_to_pincode || selectedInvoiceData.bill_to_pincode || ''}`.trim();
                  consigneeGST = selectedInvoiceData.ship_to_gst || selectedInvoiceData.bill_to_gst || 'URD';
                  consigneeState = selectedInvoiceData.ship_to_state || selectedInvoiceData.bill_to_state || "";
                } else {
                  sellerName = selectedInvoiceData.vendor_name || "";
                  sellerAddress = `${selectedInvoiceData.ship_to_address || ''}, ${selectedInvoiceData.ship_to_city || ''}, ${selectedInvoiceData.ship_to_state || ''} ${selectedInvoiceData.ship_to_pincode || ''}`.trim();
                  sellerGST = selectedInvoiceData.vendor_gst || 'URD';
                  sellerState = selectedInvoiceData.ship_to_state || "";

                  buyerName = ourCompanyName;
                  buyerAddress = ourCompanyAddress;
                  buyerGST = ourCompanyGST;
                  buyerState = ourCompanyState;

                  consigneeName = ourCompanyName;
                  consigneeAddress = ourCompanyAddress;
                  consigneeGST = ourCompanyGST;
                  consigneeState = ourCompanyState;
                }

                const isIGST = selectedInvoiceData.igst_total > 0;
                const cgstRate = selectedInvoiceData.items?.[0]?.cgst_rate || (selectedInvoiceData.items?.[0]?.gst_rate / 2) || 9;
                const sgstRate = selectedInvoiceData.items?.[0]?.sgst_rate || (selectedInvoiceData.items?.[0]?.gst_rate / 2) || 9;
                const igstRate = selectedInvoiceData.items?.[0]?.igst_rate || selectedInvoiceData.items?.[0]?.gst_rate || 18;

                return (
                  <div className="flex-1 flex flex-col w-full text-[10px] z-10 text-black leading-tight border-[1.5px] border-black mt-4 bg-transparent font-sans relative box-sizing-border-box">
                    
                    {/* Top Grid: Left and Right */}
                    <div className="grid grid-cols-[60%_40%] w-full">
                      
                      {/* Left Column */}
                      <div className="flex flex-col border-r-[1.5px] border-black">
                        {/* Company brand details */}
                        <div className="flex items-center gap-[15px] p-[10px_8px]">
                          <img src={logoUrl} className="h-[52px] w-auto object-contain" />
                          <div className="flex flex-col">
                            <h1 className="text-[19px] font-black leading-none" style={{ color: primaryColor }}>{ourCompanyName}</h1>
                            <div className="text-[9.5px] font-bold text-slate-800 m-[2px_0_4px_0]">{isFourPlastic ? 'Manufacturers of Plastic Colour Granules' : 'Premium Quality Recycled Granules & Plastic Products'}</div>
                            
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-900 font-bold uppercase">
                              <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-[2.5] fill-none" style={{ color: primaryColor }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span>{ourCompanyAddress}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[8.5px] text-slate-700 font-medium">
                              <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-[2.5] fill-none" style={{ color: primaryColor }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              <span>Mob : {phone}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[8.5px] text-slate-700 font-medium">
                              <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-[2.5] fill-none" style={{ color: primaryColor }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                              <span>Email : {email}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Bill To & Ship To side-by-side */}
                        <div className="grid grid-cols-2 border-t-[1.5px] border-black flex-1">
                          <div className="flex flex-col p-1.5 border-r border-black">
                            <div className="bg-slate-100 font-extrabold uppercase p-[3px_6px] text-[8.5px] border-b border-black -m-[6px_-6px_6px_-6px]" style={{ color: primaryColor }}>Bill to</div>
                            <div className="font-bold text-[10.5px] mb-0.5">{buyerName}</div>
                            <div className="text-[9px] leading-snug">
                              {buyerAddress}<br/>
                              <span className="font-bold">GSTIN/UIN:</span> {buyerGST}<br/>
                              <span className="font-bold">State Name:</span> {buyerState}, Code: {buyerGST && buyerGST.length >= 2 ? buyerGST.substring(0, 2) : '27'}
                            </div>
                          </div>
                          <div className="flex flex-col p-1.5">
                            <div className="bg-slate-100 font-extrabold uppercase p-[3px_6px] text-[8.5px] border-b border-black -m-[6px_-6px_6px_-6px]" style={{ color: primaryColor }}>Ship to</div>
                            <div className="font-bold text-[10.5px] mb-0.5">{consigneeName}</div>
                            <div className="text-[9px] leading-snug">
                              {consigneeAddress}<br/>
                              <span className="font-bold">GSTIN/UIN:</span> {consigneeGST}<br/>
                              <span className="font-bold">State Name:</span> {consigneeState}, Code: {consigneeGST && consigneeGST.length >= 2 ? consigneeGST.substring(0, 2) : '27'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column Metadata */}
                      <div className="flex flex-col">
                        <div className="text-[22px] font-black text-right p-[10px_10px_5px_10px] tracking-wide" style={{ color: primaryColor }}>{invoiceTitle}</div>
                        <div className="grid grid-cols-1 border-t-[1.5px] border-black flex-1 text-[9px]">
                          {[
                            { label: "Invoice No.", value: selectedInvoiceData.invoice_no || '-' },
                            { label: "Dated", value: formatDate(selectedInvoiceData.invoice_date) || '-' },
                            { label: "Delivery Note", value: selectedInvoiceData.challan_no || '-' },
                            { label: "Mode/Terms of Payment", value: selectedInvoiceData.payment_type || '-' },
                            { label: "Reference No. & Date.", value: '-' },
                            { label: "Other References", value: '-' },
                            { label: "Buyer's Order No.", value: '-' },
                            { label: "Dated", value: '-' },
                            { label: "Dispatch Document No.", value: '-' },
                            { label: "Delivery Note Date", value: '-' },
                            { label: "Despatched through", value: selectedInvoiceData.transport_mode || '-' },
                            { label: "Terms of Delivery", value: '-' }
                          ].map((row, idx, arr) => (
                            <div key={idx} className={`grid grid-cols-[48%_52%] p-[2px_8px] items-center min-h-[19px] ${idx === arr.length - 1 ? '' : 'border-b border-black'}`}>
                              <span className="font-medium text-slate-700">{row.label}</span>
                              <span className="font-bold">: {row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Items Table */}
                    <div className="border-t-[1.5px] border-b-[1.5px] border-black flex flex-col flex-1 min-h-[220px] relative">
                      <table className="w-full text-left border-collapse flex-1">
                        <thead>
                          <tr className="border-b border-black text-[9.5px] font-bold text-white uppercase">
                            <th className="p-[5px_4px] text-center border-r border-white" style={{ backgroundColor: primaryColor, width: '5%' }}>Sl No.</th>
                            <th className="p-[5px_4px] border-r border-white" style={{ backgroundColor: primaryColor, width: '42%' }}>Description of Goods</th>
                            <th className="p-[5px_4px] text-center border-r border-white" style={{ backgroundColor: primaryColor, width: '12%' }}>HSN/SAC</th>
                            <th className="p-[5px_4px] text-right border-r border-white" style={{ backgroundColor: primaryColor, width: '14%' }}>Quantity</th>
                            <th className="p-[5px_4px] text-right border-r border-white" style={{ backgroundColor: primaryColor, width: '10%' }}>Rate</th>
                            <th className="p-[5px_4px] text-center border-r border-white" style={{ backgroundColor: primaryColor, width: '7%' }}>per</th>
                            <th className="p-[5px_4px] text-right" style={{ backgroundColor: primaryColor, width: '10%' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceData.items?.map((item, idx) => (
                            <tr key={idx} className="text-[9.5px] align-top font-medium">
                              <td className="p-1.5 text-center border-r border-black">{idx + 1}</td>
                              <td className="p-1.5 border-r border-black font-bold">
                                {item.item_name}
                                {item.discount > 0 && <div className="text-[8px] font-normal text-slate-500">Less: Discount {item.discount}%</div>}
                              </td>
                              <td className="p-1.5 text-center border-r border-black">{item.hsn_code || ''}</td>
                              <td className="p-1.5 text-right font-bold border-r border-black">{item.quantity} {item.unit || 'KG'}</td>
                              <td className="p-1.5 text-right border-r border-black">{formatCurrency(item.rate).replace('₹', '')}</td>
                              <td className="p-1.5 text-center border-r border-black">{item.unit || 'KG'}</td>
                              <td className="p-1.5 text-right font-bold">{formatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                            </tr>
                          ))}
                          
                          {/* GST Output Rows inside table body */}
                          {isIGST ? (
                            <tr className="text-[9.5px] align-top font-bold">
                              <td className="p-1.5 border-r border-black"></td>
                              <td className="p-1.5 border-r border-black text-right">Output IGST @ {igstRate}%</td>
                              <td className="p-1.5 border-r border-black"></td>
                              <td className="p-1.5 border-r border-black"></td>
                              <td className="p-1.5 border-r border-black"></td>
                              <td className="p-1.5 border-r border-black text-center">{igstRate} %</td>
                              <td className="p-1.5 text-right">{formatCurrency(selectedInvoiceData.igst_total).replace('₹', '')}</td>
                            </tr>
                          ) : (
                            <>
                              {(selectedInvoiceData.cgst_total > 0 || selectedInvoiceData.cgst_amount > 0) && (
                                <tr className="text-[9.5px] align-top font-bold">
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-right">Output CGST @ {cgstRate}%</td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-center">{cgstRate} %</td>
                                  <td className="p-1.5 text-right">{formatCurrency(selectedInvoiceData.cgst_total || selectedInvoiceData.cgst_amount || 0).replace('₹', '')}</td>
                                </tr>
                              )}
                              {(selectedInvoiceData.sgst_total > 0 || selectedInvoiceData.sgst_amount > 0) && (
                                <tr className="text-[9.5px] align-top font-bold">
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-right">Output SGST @ {sgstRate}%</td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black"></td>
                                  <td className="p-1.5 border-r border-black text-center">{sgstRate} %</td>
                                  <td className="p-1.5 text-right">{formatCurrency(selectedInvoiceData.sgst_total || selectedInvoiceData.sgst_amount || 0).replace('₹', '')}</td>
                                </tr>
                              )}
                            </>
                          )}
                          <tr className="empty-filler flex-1">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Totals section */}
                    <div className="flex border-b-[1.5px] border-black">
                      <div className="w-[65%] p-[6px_8px] border-r border-black">
                        <div className="text-[8px] text-slate-500 font-bold uppercase">Amount Chargeable (in words)</div>
                        <div className="font-extrabold text-[10px] uppercase text-slate-800 leading-tight">INR {numberToWords(Math.round(selectedInvoiceData.grand_total))}</div>
                      </div>
                      <div className="w-[35%] flex justify-between items-center p-[6px_10px] text-[11.5px] font-black">
                        <span>Total</span>
                        <span>{formatCurrency(selectedInvoiceData.grand_total)}</span>
                      </div>
                    </div>
                    
                    {/* Tax Breakdown Table */}
                    <div className="w-full border-b-[1.5px] border-black text-[9px]">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-slate-700">
                            <th className="p-1 text-center border-r border-b border-black" rowSpan="2" style={{ width: '15%' }}>HSN/SAC</th>
                            <th className="p-1 text-right border-r border-b border-black" rowSpan="2" style={{ width: '18%' }}>Taxable Value</th>
                            {isIGST ? (
                              <th className="p-1 text-center border-r border-b border-black" colSpan="2" style={{ width: '25%' }}>Integrated Tax</th>
                            ) : (
                              <>
                                <th className="p-1 text-center border-r border-b border-black" colSpan="2" style={{ width: '20%' }}>Central Tax</th>
                                <th className="p-1 text-center border-r border-b border-black" colSpan="2" style={{ width: '20%' }}>State Tax</th>
                              </>
                            )}
                            <th className="p-1 text-center border-b border-black" rowSpan="2" style={{ width: '22%' }}>Total Tax Amount</th>
                          </tr>
                          <tr className="bg-slate-100 font-bold text-slate-700">
                            {isIGST ? (
                              <>
                                <th className="p-1 text-center border-r border-black">Rate</th>
                                <th className="p-1 text-right border-r border-black">Amount</th>
                              </>
                            ) : (
                              <>
                                <th className="p-1 text-center border-r border-black">Rate</th>
                                <th className="p-1 text-right border-r border-black">Amount</th>
                                <th className="p-1 text-center border-r border-black">Rate</th>
                                <th className="p-1 text-right border-r border-black">Amount</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 font-medium">
                          {selectedInvoiceData.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-1 text-center border-r border-black">{item.hsn_code || ''}</td>
                              <td className="p-1 border-r border-black">{formatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                              {isIGST ? (
                                <>
                                  <td className="p-1 text-center border-r border-black">{item.igst_rate || igstRate}%</td>
                                  <td className="p-1 border-r border-black">{formatCurrency(item.igst_amount || 0).replace('₹', '')}</td>
                                </>
                              ) : (
                                <>
                                  <td className="p-1 text-center border-r border-black">{item.cgst_rate || cgstRate}%</td>
                                  <td className="p-1 border-r border-black">{formatCurrency(item.cgst_amount || 0).replace('₹', '')}</td>
                                  <td className="p-1 text-center border-r border-black">{item.sgst_rate || sgstRate}%</td>
                                  <td className="p-1 border-r border-black">{formatCurrency(item.sgst_amount || 0).replace('₹', '')}</td>
                                </>
                              )}
                              <td className="p-1 font-bold">{formatCurrency((item.igst_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0)).replace('₹', '')}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold border-t border-black text-slate-800">
                            <td className="p-1 text-center border-r border-black">Total</td>
                            <td className="p-1 border-r border-black">{formatCurrency(selectedInvoiceData.taxable_amount || selectedInvoiceData.subtotal).replace('₹', '')}</td>
                            {isIGST ? (
                              <>
                                <td className="p-1 border-r border-black"></td>
                                <td className="p-1 border-r border-black">{formatCurrency(selectedInvoiceData.igst_total).replace('₹', '')}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-1 border-r border-black"></td>
                                <td className="p-1 border-r border-black">{formatCurrency(selectedInvoiceData.cgst_total || selectedInvoiceData.cgst_amount || 0).replace('₹', '')}</td>
                                <td className="p-1 border-r border-black"></td>
                                <td className="p-1 border-r border-black">{formatCurrency(selectedInvoiceData.sgst_total || selectedInvoiceData.sgst_amount || 0).replace('₹', '')}</td>
                              </>
                            )}
                            <td className="p-1 font-extrabold">{formatCurrency(selectedInvoiceData.gst_total || (selectedInvoiceData.cgst_total + selectedInvoiceData.sgst_total + selectedInvoiceData.igst_total) || 0).replace('₹', '')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="p-[4px_8px] font-bold border-b-[1.5px] border-black text-[9px]">
                      Tax Amount (in words) : INR {numberToWords(Math.round(selectedInvoiceData.gst_total || (selectedInvoiceData.cgst_total + selectedInvoiceData.sgst_total + selectedInvoiceData.igst_total) || 0))}
                    </div>
                    
                    {/* Footer: Bank details, terms & Signature */}
                    <div className="grid grid-cols-2 text-[8px] divide-x-[1.5px] divide-black h-fit border-b-[1.5px] border-black">
                      <div className="p-2 space-y-1 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-slate-500 uppercase text-[8px]">Declaration</div>
                          <div className="text-slate-800 leading-snug text-justify font-normal text-[8px]">
                            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                          </div>
                        </div>
                        <div className="mt-[30px] font-bold text-[8.5px] text-slate-700">Customer's Seal and Signature</div>
                      </div>
                      <div className="p-2 flex flex-col justify-between min-h-[100px]">
                        <div>
                          <div className="font-bold text-slate-500 uppercase text-[8px]">Company's Bank Details:</div>
                          <div className="font-semibold text-slate-800 text-[8.5px]">
                            Bank Name: <span className="font-bold">CANARA BANK</span><br/>
                            A/c No.: <span className="font-bold">0127201004588</span><br/>
                            Branch & IFS Code: <span className="font-bold">SAKINAKA & CNRB0002411</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end mt-[15px]">
                          <span className="font-bold text-[9.5px]" style={{ color: primaryColor }}>for {ourCompanyName}</span>
                          <span className="mt-[35px] font-bold uppercase text-slate-500 text-[8px] tracking-wide border-t border-black pt-0.5 text-center w-[130px]">Authorised Signatory</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              /* Empty Main Content Space (For print bleed/pre-printed page write space) */
              <div className="flex-1 flex flex-col justify-center items-center relative z-10 pointer-events-none select-none">
                <div className="text-center opacity-[0.07] border-2 border-dashed border-black/80 rounded-2xl p-8 max-w-sm print:hidden">
                  <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Stationery Print Space</p>
                  <p className="text-[10px] mt-1">This blank area allows you to print invoices or challans onto these sheets afterwards.</p>
                </div>
              </div>
            )}

            {/* Letterhead Footer Section */}
            {layoutPreset !== 'watermark_only' && !showPdfIframe && (
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] z-10">
                {/* Full width colored line */}
                <div className="w-full h-[2.5px] flex mb-4">
                  <div style={{ backgroundColor: primaryColor }} className="h-full w-[65%] divider-line-primary" />
                  <div style={{ backgroundColor: secondaryColor }} className="h-full w-[35%] divider-line-secondary" />
                </div>
                
                {/* 3 Columns */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  {/* Address */}
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div 
                      style={{ borderColor: primaryColor }}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 map-pin-circle"
                    >
                      <MapPinIcon style={{ color: primaryColor }} className="w-3.5 h-3.5 brand-icon" />
                    </div>
                    <div className="text-[11px] leading-snug text-slate-900 font-black uppercase">
                      {(() => {
                        const parts = address.split(',');
                        if (parts.length > 2) {
                          const line1 = parts.slice(0, 3).join(',').trim() + (parts.length > 3 ? ',' : '');
                          const line2 = parts.slice(3, 5).join(',').trim() + (parts.length > 5 ? ',' : '');
                          const line3 = parts.slice(5).join(',').trim();
                          return (
                            <>
                              <div>{line1}</div>
                              {line2 && <div>{line2}</div>}
                              {line3 && <div>{line3}</div>}
                            </>
                          );
                        }
                        return <div>{address}</div>;
                      })()}
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-8 w-px bg-slate-300 mx-4 flex-shrink-0" />

                  {/* Phone */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div 
                      style={{ borderColor: primaryColor }}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 phone-circle"
                    >
                      <PhoneIcon style={{ color: primaryColor }} className="w-3.5 h-3.5 brand-icon" />
                    </div>
                    <span className="text-[9px] text-slate-700 font-bold">{phone}</span>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-8 w-px bg-slate-300 mx-4 flex-shrink-0" />

                  {/* Email */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div 
                      style={{ borderColor: primaryColor }}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 email-circle"
                    >
                      <EnvelopeIcon style={{ color: primaryColor }} className="w-3.5 h-3.5 brand-icon" />
                    </div>
                    <span className="text-[9px] text-slate-700 font-bold">{email}</span>
                  </div>
                </div>

                {/* Additional footer text (GSTIN and Terms) if available */}
                {(gstNo || footerText) && (
                  <div className="w-full text-center mt-3 pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                    {gstNo && <span>GSTIN: {gstNo}</span>}
                    {gstNo && footerText && <span className="text-slate-300">•</span>}
                    {footerText && <span>{footerText}</span>}
                  </div>
                )}
              </div>
            )}

            </div>
          </div>

        </main>

      </div>

      {/* Global CSS Style tag for Printing override */}
      <style jsx global>{`
        @media screen {
          aside > * {
            flex-shrink: 0;
          }
          #printable-a4 {
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
          }
          #printable-a4 .text-slate-700 {
            color: #334155 !important;
          }
          #printable-a4 .text-slate-800 {
            color: #1e293b !important;
          }
          #printable-a4 .text-slate-900 {
            color: #0f172a !important;
          }
          #printable-a4 .bg-slate-300 {
            background-color: #cbd5e1 !important;
          }
        }
        @media print {
          /* Force exact margins and page bounds for A4 */
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-a4 {
            width: 210mm !important;
            height: 297mm !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            box-shadow: none !important;
            outline: none !important;
            padding: 15mm !important;
            margin: 0 !important;
            border: none !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          /* Override color: black !important from globals.css inside #printable-a4 */
          #printable-a4,
          #printable-a4 * {
            text-shadow: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-a4 .divider-line-primary {
            background-color: var(--primary-color) !important;
          }
          #printable-a4 .divider-line-secondary {
            background-color: var(--secondary-color) !important;
          }
          #printable-a4 .map-pin-circle,
          #printable-a4 .phone-circle,
          #printable-a4 .email-circle {
            border-color: var(--primary-color) !important;
          }
          #printable-a4 .brand-icon {
            color: var(--primary-color) !important;
          }
          #printable-a4 .text-slate-700 {
            color: #334155 !important;
          }
          #printable-a4 .text-slate-800 {
            color: #1e293b !important;
          }
          #printable-a4 .text-slate-900 {
            color: #0f172a !important;
          }
          #printable-a4 .bg-slate-300 {
            background-color: #cbd5e1 !important;
          }
          /* Hide all UI layout elements */
          header, aside, .print\\:hidden, #toast-container, [data-rht-toaster], .cyber-grid, .orb-1, .orb-2, .orb-3 {
            display: none !important;
          }
        }
      `}</style>

      <TallyImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
        defaultIsSales={mode === 'purchase_invoice' ? false : true}
        company={company}
        onLoadInvoiceData={(data) => {
          setSelectedInvoiceData(data)
          setSelectedInvoiceId('imported')
          setMode(data.is_sales ? 'sales_invoice' : 'purchase_invoice')
          setIsImportOpen(false)
        }}
      />
    </div>
  )
}
