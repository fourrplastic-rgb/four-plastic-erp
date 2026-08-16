'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  PrinterIcon, 
  SparklesIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function EnvelopePrintPage() {
  const router = useRouter()
  
  // Custom states for Envelope Print
  const [company, setCompany] = useState('four_plastic') // four_plastic, raj_plastic
  const [printSender, setPrintSender] = useState(true)
  const [envelopeSize, setEnvelopeSize] = useState('custom_235_105') // dl, c5, no10, custom_235_105, custom
  const [customWidth, setCustomWidth] = useState(235)
  const [customHeight, setCustomHeight] = useState(105)
  const [partyType, setPartyType] = useState('customer') // customer, vendor, manual
  
  // Database lists
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [selectedPartyId, setSelectedPartyId] = useState('')
  
  // Sender Details
  const [senderName, setSenderName] = useState('FOUR (R) PLASTIC')
  const [senderAddress, setSenderAddress] = useState('WIRE GALLI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST SAKINAKA, MUMBAI - 400072.')
  const [senderPhone, setSenderPhone] = useState('9867976679')
  const [senderEmail, setSenderEmail] = useState('fourrplastic@gmail.com')
  const [senderGst, setSenderGst] = useState('27ABTPV9432F1ZX')

  // Recipient Details
  const [recipientName, setRecipientName] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [recipientCity, setRecipientCity] = useState('')
  const [recipientState, setRecipientState] = useState('')
  const [recipientPincode, setRecipientPincode] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientGst, setRecipientGst] = useState('')

  // Print Adjustments
  const [recipientLeftShift, setRecipientLeftShift] = useState(105) // default DL: 105mm
  const [recipientTopShift, setRecipientTopShift] = useState(45) // default DL: 45mm
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.1) // scaling factor for recipient text
  const [scale, setScale] = useState(1)

  // Fetch customers and vendors on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, vendRes] = await Promise.all([
          axios.get('/api/customers'),
          axios.get('/api/vendors?t=1')
        ])
        setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.customers || [])
        setVendors(Array.isArray(vendRes.data) ? vendRes.data : vendRes.data.vendors || [])
      } catch (err) {
        console.error('Error fetching customers/vendors:', err)
        toast.error('Failed to load customers/vendors list')
      }
    }
    fetchData()
  }, [])

  // Sync Sender details when changing company
  useEffect(() => {
    if (company === 'four_plastic') {
      setSenderName('FOUR (R) PLASTIC')
      setSenderAddress(localStorage.getItem('lh_address_four_plastic') || 'WIRE GALLI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST SAKINAKA, MUMBAI - 400072.')
      setSenderPhone(localStorage.getItem('lh_phone_four_plastic') || '9867976679')
      setSenderEmail(localStorage.getItem('lh_email_four_plastic') || 'fourrplastic@gmail.com')
      setSenderGst(localStorage.getItem('lh_gst_four_plastic') || '27ABTPV9432F1ZX')
    } else {
      setSenderName('RAJ PLASTIC')
      setSenderAddress(localStorage.getItem('lh_address_raj_plastic') || '3 NO. KHADI, SAKINAKA, MUMBAI, MAHARASHTRA - 400072')
      setSenderPhone(localStorage.getItem('lh_phone_raj_plastic') || '+91 9876543210')
      setSenderEmail(localStorage.getItem('lh_email_raj_plastic') || 'contact@rajplastic.com')
      setSenderGst(localStorage.getItem('lh_gst_raj_plastic') || '27DEFAULTGST')
    }
  }, [company])

  // Sync Recipient defaults and shifts when changing envelope size
  useEffect(() => {
    if (envelopeSize === 'dl') {
      setRecipientLeftShift(105)
      setRecipientTopShift(45)
    } else if (envelopeSize === 'c5') {
      setRecipientLeftShift(110)
      setRecipientTopShift(75)
    } else if (envelopeSize === 'no10') {
      setRecipientLeftShift(115)
      setRecipientTopShift(42)
    } else if (envelopeSize === 'custom_235_105') {
      setRecipientLeftShift(110)
      setRecipientTopShift(42)
    } else if (envelopeSize === 'custom') {
      setRecipientLeftShift(Math.round(customWidth / 2))
      setRecipientTopShift(Math.round(customHeight / 2.3))
    }
  }, [envelopeSize, customWidth, customHeight])

  // Autofill Recipient when selecting a party from dropdown
  useEffect(() => {
    if (!selectedPartyId || partyType === 'manual') return

    const partyList = partyType === 'customer' ? customers : vendors
    const party = partyList.find(p => String(p.id) === String(selectedPartyId))
    
    if (party) {
      setRecipientName(party.name || '')
      setRecipientAddress(party.address || '')
      setRecipientCity(party.city || '')
      setRecipientState(party.state || '')
      setRecipientPincode(party.pincode || '')
      setRecipientPhone(party.phone || party.mobile || '')
      setRecipientGst(party.gst || '')
    }
  }, [selectedPartyId, partyType, customers, vendors])

  // Handle party type change (reset selections)
  const handlePartyTypeChange = (type) => {
    setPartyType(type)
    setSelectedPartyId('')
    if (type === 'manual') {
      setRecipientName('')
      setRecipientAddress('')
      setRecipientCity('')
      setRecipientState('')
      setRecipientPincode('')
      setRecipientPhone('')
      setRecipientGst('')
    }
  }

  // Calculate live preview scaling to fit screen
  useEffect(() => {
    const updateScale = () => {
      const previewArea = document.getElementById('preview-container')
      if (!previewArea) return
      
      const padding = 48
      const availableWidth = previewArea.clientWidth - padding
      
      // Determine physical preview width based on layout
      let envWidth = 831 // DL size width (220mm)
      if (envelopeSize === 'c5') {
        envWidth = 865 // C5 size width (229mm)
      } else if (envelopeSize === 'no10') {
        envWidth = 910 // #10 size width (241mm)
      } else if (envelopeSize === 'custom_235_105') {
        envWidth = 888 // Custom 235mm
      } else if (envelopeSize === 'custom') {
        envWidth = Math.round(customWidth * 3.78)
      }
      
      if (availableWidth < envWidth) {
        setScale(availableWidth / envWidth)
      } else {
        setScale(1)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    const timer = setTimeout(updateScale, 150)
    
    return () => {
      window.removeEventListener('resize', updateScale)
      clearTimeout(timer)
    }
  }, [envelopeSize, customWidth, customHeight])

  // Print function using window.open and dynamic HTML/CSS
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const isFourPlastic = company === 'four_plastic';
    const logoUrl = window.location.origin + (isFourPlastic ? '/logo_four_plastic.png' : '/logo_raj_plastic.png');
    const primaryColor = isFourPlastic ? '#004aad' : '#1b8a5a';
    
    let envelopeWidth = '220mm';
    let envelopeHeight = '110mm';
    if (envelopeSize === 'c5') {
      envelopeWidth = '229mm';
      envelopeHeight = '162mm';
    } else if (envelopeSize === 'no10') {
      envelopeWidth = '241mm';
      envelopeHeight = '105mm';
    } else if (envelopeSize === 'custom_235_105') {
      envelopeWidth = '235mm';
      envelopeHeight = '105mm';
    } else if (envelopeSize === 'custom') {
      envelopeWidth = `${customWidth}mm`;
      envelopeHeight = `${customHeight}mm`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>&nbsp;</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
          @page { 
            size: ${envelopeWidth} ${envelopeHeight}; 
            margin: 0 !important; 
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          body { 
            font-family: 'Roboto', sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #000; 
            width: ${envelopeWidth};
            height: ${envelopeHeight};
            box-sizing: border-box;
            position: relative;
            background: #fff;
            overflow: hidden;
          }
          
          /* Sender details at top left */
          .sender-container {
            position: absolute;
            top: 0.5in; /* 0.5 inch top margin for print safety */
            left: 1.0in; /* shifted 0.5 inch right -> total 1.0 inch left side */
            width: 100mm;
            display: ${printSender ? 'flex' : 'none'};
            align-items: center;
            gap: 8px;
            font-size: 10.5px;
            line-height: 1.35;
          }
          .sender-logo {
            height: 30px;
            width: auto;
            object-fit: contain;
          }
          .sender-details {
            display: flex;
            flex-direction: column;
          }
          .sender-name {
            font-size: 15px;
            font-weight: 900;
            color: ${primaryColor} !important;
            margin: 0 0 2px 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Recipient details at center/bottom right */
          .recipient-container {
            position: absolute;
            left: ${recipientLeftShift}mm;
            top: ${recipientTopShift}mm;
            width: 100mm;
            font-size: ${fontSizeMultiplier * 11}px;
            line-height: 1.35;
          }
          .to-label {
            font-weight: bold;
            text-transform: uppercase;
            font-size: ${fontSizeMultiplier * 9.5}px;
            color: #333;
            margin-bottom: 2px;
          }
          .recipient-name {
            font-weight: 900;
            font-size: ${fontSizeMultiplier * 13}px;
            margin: 0 0 3px 0;
            text-transform: uppercase;
          }
          .recipient-address {
            font-weight: 500;
          }
          .recipient-contact {
            margin-top: 4px;
            font-weight: 700;
            font-size: ${fontSizeMultiplier * 10}px;
          }
        </style>
      </head>
      <body>
        <!-- Sender Box -->
        <div class="sender-container">
          <img src="${logoUrl}" class="sender-logo" />
          <div class="sender-details">
            <h1 class="sender-name">${senderName}</h1>
            <div>${senderAddress}</div>
            <div>Mob: ${senderPhone} | Email: ${senderEmail}</div>
            ${senderGst ? `<div>GSTIN: ${senderGst}</div>` : ''}
          </div>
        </div>
        
        <!-- Recipient Box -->
        <div class="recipient-container">
          <div class="to-label">To,</div>
          <h2 class="recipient-name">${recipientName || ''}</h2>
          <div class="recipient-address">
            ${recipientAddress || ''}<br/>
            ${[recipientCity, recipientState, recipientPincode].filter(Boolean).join(' ') || ''}
          </div>
          ${recipientPhone || recipientGst ? `
            <div class="recipient-contact">
              ${recipientPhone ? `Ph: ${recipientPhone}` : ''}
              ${recipientGst ? ` &nbsp;|&nbsp; GSTIN: ${recipientGst}` : ''}
            </div>
          ` : ''}
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

  // Get physical envelope dimensions for display preview box
  const getEnvelopeDimensions = () => {
    if (envelopeSize === 'c5') {
      return { width: '865px', height: '612px', label: 'C5 Envelope (229mm x 162mm)' }
    } else if (envelopeSize === 'no10') {
      return { width: '910px', height: '397px', label: '#10 Envelope (241mm x 105mm)' }
    } else if (envelopeSize === 'custom_235_105') {
      return { width: '888px', height: '397px', label: 'Custom Envelope (23.5cm x 10.5cm)' }
    } else if (envelopeSize === 'custom') {
      const wPx = Math.round(customWidth * 3.78)
      const hPx = Math.round(customHeight * 3.78)
      return { width: `${wPx}px`, height: `${hPx}px`, label: `Custom Size (${customWidth}mm x ${customHeight}mm)` }
    }
    return { width: '831px', height: '415px', label: 'DL Envelope (220mm x 110mm)' }
  }

  const { width: envelopeWidthPx, height: envelopeHeightPx, label: envelopeSizeLabel } = getEnvelopeDimensions()

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10 bg-slate-950/20 backdrop-blur-[2px]" />
      
      {/* Top Header Navigation bar */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <EnvelopeIcon className="h-8 w-8 text-pink-400" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">ENVELOPE PRINTING UTILITY</h1>
              <p className="text-slate-400 text-xs font-semibold">Generate premium printable envelope templates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 flex items-center justify-center gap-2 font-bold tracking-wide shadow-lg border border-white/10 hover:scale-[1.02] transition-all duration-200"
            >
              <PrinterIcon className="h-5 w-5" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace split panel layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 relative z-0">
        
        {/* Left Sidebar Controls */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 shrink-0 print:hidden">
          
          {/* Company Selection Panel */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
              <SparklesIcon className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-white">Select Sender Brand</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCompany('four_plastic')}
                className={`py-3 px-3 rounded-xl border font-bold text-xs tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                  company === 'four_plastic'
                    ? 'bg-blue-600/30 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src="/logo_four_plastic.png" className="h-7 w-auto object-contain" />
                FOUR (R) PLASTIC
              </button>
              <button
                onClick={() => setCompany('raj_plastic')}
                className={`py-3 px-3 rounded-xl border font-bold text-xs tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                  company === 'raj_plastic'
                    ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src="/logo_raj_plastic.png" className="h-7 w-auto object-contain" />
                RAJ PLASTIC
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-slate-300 text-xs font-semibold">Print Sender Details</span>
              <button
                onClick={() => setPrintSender(!printSender)}
                className={`w-11 h-6 rounded-full transition-colors duration-300 relative focus:outline-none ${
                  printSender ? 'bg-pink-500' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                  printSender ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Recipient Details Panel */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
              <UsersIcon className="h-5 w-5 text-purple-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-white">Recipient Details</h2>
            </div>
            
            {/* Party Type Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {['customer', 'vendor', 'manual'].map((type) => (
                <button
                  key={type}
                  onClick={() => handlePartyTypeChange(type)}
                  className={`py-1.5 px-2 rounded font-bold text-[10px] tracking-wider uppercase transition-all ${
                    partyType === type
                      ? 'bg-pink-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'no10' ? '#10' : type}
                </button>
              ))}
            </div>

            {/* Party Dropdown Selection (if not Manual) */}
            {partyType !== 'manual' && (
              <div>
                <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Select {partyType === 'customer' ? 'Customer' : 'Vendor'}
                </label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Choose Party --</option>
                  {(partyType === 'customer' ? customers : vendors).map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} {p.gst ? `(${p.gst})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Input Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Company / Recipient Name *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white placeholder-slate-500 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Rahul Plastic Industries"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Address Details *</label>
                <textarea
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white placeholder-slate-500 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Plot 12, GIDC Industrial Estate"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    value={recipientState}
                    onChange={(e) => setRecipientState(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Pincode</label>
                  <input
                    type="text"
                    value={recipientPincode}
                    onChange={(e) => setRecipientPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="400072"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={recipientGst}
                  onChange={(e) => setRecipientGst(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                  placeholder="27ALBPM2588B1Z8"
                />
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-white">Envelope Settings</h2>
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">Envelope Size</label>
              <select
                value={envelopeSize}
                onChange={(e) => setEnvelopeSize(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="custom_235_105" className="bg-slate-900 text-white">Custom Envelope (23.5cm x 10.5cm)</option>
                <option value="dl" className="bg-slate-900 text-white">DL Envelope (220mm x 110mm)</option>
                <option value="c5" className="bg-slate-900 text-white">C5 Envelope (229mm x 162mm)</option>
                <option value="no10" className="bg-slate-900 text-white">#10 Envelope (241mm x 105mm)</option>
                <option value="custom" className="bg-slate-900 text-white">Custom Calibration (User Sized)</option>
              </select>
            </div>

            {envelopeSize === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 235)}
                    className="w-full px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="100"
                    max="400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 105)}
                    className="w-full px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    min="80"
                    max="300"
                  />
                </div>
              </div>
            )}

            {/* Recipient Left Placement Shift slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">Recipient Position Left</label>
                <span className="text-xs font-bold text-pink-400">{recipientLeftShift} mm</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={recipientLeftShift}
                onChange={(e) => setRecipientLeftShift(parseInt(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Recipient Top Placement Shift slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">Recipient Position Top</label>
                <span className="text-xs font-bold text-pink-400">{recipientTopShift} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={recipientTopShift}
                onChange={(e) => setRecipientTopShift(parseInt(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Font Size Multiplier slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">Recipient Font Size</label>
                <span className="text-xs font-bold text-pink-400">{Math.round(fontSizeMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.05"
                value={fontSizeMultiplier}
                onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
          </div>
        </aside>

        {/* Right Preview Workspace */}
        <main className="flex-1 flex flex-col justify-center items-center overflow-auto p-4 bg-slate-950/40 border border-white/10 rounded-2xl relative min-h-[350px]">
          
          {/* Header Tag for details */}
          <div className="absolute top-4 left-6 text-slate-400 text-xs font-bold tracking-wider uppercase border border-white/5 bg-slate-950/60 rounded-full px-4 py-1">
            {envelopeSizeLabel} (Preview Screen Scaled)
          </div>

          <div
            id="preview-container"
            className="w-full h-full flex items-center justify-center"
            style={{ minHeight: '430px' }}
          >
            {/* The Envelope Layout Render Box */}
            <div
              className="bg-white text-black relative shadow-2xl transition-all duration-300 overflow-hidden shrink-0"
              style={{
                width: envelopeWidthPx,
                height: envelopeHeightPx,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                border: '1.5px solid #000'
              }}
            >
              {/* Sender Details (Top Left) */}
              {printSender && (
                <div
                  className="absolute"
                  style={{
                    top: '0.5in',
                    left: '1.0in', // shifted 0.5 inch right -> total 1.0 inch left side
                    width: '100mm',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '10.5px',
                    lineHeight: '1.35'
                  }}
                >
                  <img 
                    src={company === 'four_plastic' ? '/logo_four_plastic.png' : '/logo_raj_plastic.png'} 
                    className="object-contain" 
                    style={{ height: '30px', width: 'auto' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 
                      className="font-bold uppercase"
                      style={{ 
                        fontSize: '14px', 
                        margin: '0 0 2px 0', 
                        color: company === 'four_plastic' ? '#004aad' : '#1b8a5a' 
                      }}
                    >
                      {senderName}
                    </h3>
                    <div className="text-[10px] font-semibold text-slate-700">{senderAddress}</div>
                    <div className="text-[9.5px] font-medium text-slate-500">Mob: {senderPhone} | Email: {senderEmail}</div>
                    {senderGst && <div className="text-[9.5px] font-medium text-slate-500">GSTIN: {senderGst}</div>}
                  </div>
                </div>
              )}

              {/* Recipient Details (Shiftable) */}
              <div
                className="absolute"
                style={{
                  left: `${recipientLeftShift}mm`,
                  top: `${recipientTopShift}mm`,
                  width: '100mm',
                  fontSize: `${fontSizeMultiplier * 11}px`,
                  lineHeight: '1.35'
                }}
              >
                <div 
                  className="font-bold text-slate-500 tracking-wide uppercase"
                  style={{ fontSize: `${fontSizeMultiplier * 9.5}px`, marginBottom: '2px' }}
                >
                  To,
                </div>
                <h2 
                  className="font-black text-black tracking-wide"
                  style={{ fontSize: `${fontSizeMultiplier * 13}px`, margin: '0 0 3px 0' }}
                >
                  {recipientName || <span className="text-slate-300 italic font-bold">[Recipient Name]</span>}
                </h2>
                <div className="font-semibold text-slate-800">
                  {recipientAddress ? (
                    <>
                      {recipientAddress}<br />
                      {[recipientCity, recipientState, recipientPincode].filter(Boolean).join(' ')}
                    </>
                  ) : (
                    <span className="text-slate-300 italic">[Enter Recipient Address Details]</span>
                  )}
                </div>
                {(recipientPhone || recipientGst) && (
                  <div 
                    className="font-extrabold text-slate-900 border-t border-dashed border-slate-300 pt-1"
                    style={{ fontSize: `${fontSizeMultiplier * 9.5}px`, marginTop: '4px' }}
                  >
                    {recipientPhone && <span>Ph: {recipientPhone}</span>}
                    {recipientPhone && recipientGst && <span> &nbsp;|&nbsp; </span>}
                    {recipientGst && <span>GSTIN: {recipientGst}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
