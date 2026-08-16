"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import { 
  ArrowLeftIcon,
  PencilIcon,
  PrinterIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhoneIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function ViewDeliveryChallanPage() {
  const router = useRouter()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const printRef = useRef(null)

  // Set up print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Delivery_Challan_${challan?.challan_no || 'print'}`,
    onPrintError: (error) => {
      console.error('Print error:', error)
      toast.error('Failed to print. Please try again.')
    }
  })

  // Set up WhatsApp handler
  const handleWhatsApp = () => {
    if (!challan) return
    const phoneNumber = challan.customer_phone || '' /* If phone is fetched, usually it's in challan object if configured */
    
    let text = `Delivery Challan Details:\n`
    text += `Challan No: ${challan.challan_no}\n`
    text += `Date: ${formatDate(challan.challan_date)}\n\n`
    
    text += `Items:\n`
    const totalQty = challan.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0
    const totalAmt = challan.items?.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.rate) || 0)), 0) || 0

    challan.items?.forEach((item, index) => {
      const qty = Number(item.quantity) || 0
      const rate = Number(item.rate) || 0
      text += `${index + 1}. ${item.item_name} - Qty: ${qty.toFixed(2)} | Rate: ₹${rate.toFixed(2)}\n`
    })
    
    text += `\nTotal Qty: ${totalQty.toFixed(2)}\n`
    text += `Total Value: ₹${totalAmt.toFixed(2)}\n`
    
    if (challan.vehicle_no) text += `Vehicle No: ${challan.vehicle_no}\n`
    
    let cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : ''
    // If it's a standard 10-digit Indian number, explicitly add the +91 country code
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`
    }
    
    // Explicitly using api.whatsapp.com with lang=en to prevent UI defaulting to Portuguese or other languages
    const url = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(text)}&lang=en`
    
    window.open(url, '_blank')
  }

  useEffect(() => {
    // Get ID from URL
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/')
      const lastSegment = pathSegments[pathSegments.length - 1]
      
      if (lastSegment && !isNaN(parseInt(lastSegment))) {
        setId(parseInt(lastSegment))
      } else {
        setError('Invalid challan ID')
        setLoading(false)
      }
    }
  }, [])

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

  const handleEdit = () => {
    router.push(`/delivery-challans/edit/${id}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN TRANSIT': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getUnitIcon = (unit) => {
    switch(unit?.toUpperCase()) {
      case 'KG': return <ScaleIcon className="h-4 w-4 inline mr-1 text-blue-400" />
      case 'GRAM': return <ScaleIcon className="h-4 w-4 inline mr-1 text-green-400" />
      case 'NOS': return <CubeIcon className="h-4 w-4 inline mr-1 text-purple-400" />
      default: return <CubeIcon className="h-4 w-4 inline mr-1 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading challan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 max-w-md text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push('/delivery-challans')}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            Back to List
          </button>
        </div>
      </div>
    )
  }

  if (!challan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Challan not found</div>
      </div>
    )
  }

  const totalQuantity = challan.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0
  const totalAmount = challan.items?.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.rate) || 0)), 0) || 0

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
                  onClick={() => router.back()}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <TruckIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  Delivery Challan {challan.challan_no}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  challan.challan_type === 'return' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}>
                  {challan.challan_type === 'return' ? 'RETURN' : 'OUTWARD'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(challan.status)}`}>
                  {challan.status || 'PENDING'}
                </span>
                <button
                  onClick={() => router.push(`/delivery-challans/edit/${id}`)}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30"
                  title="Share via WhatsApp"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Save PDF / Print"
                >
                  <PrinterIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={printRef}>
          <div className="print:bg-white print:text-black">
            {/* Challan Details Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-6 py-4 border-b border-white/20">
                <h2 className="text-xl font-semibold text-white">Challan Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-white/50 text-sm mb-1">Challan Number</p>
                    <p className="text-white text-lg font-semibold">{challan.challan_no}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">Challan Date</p>
                    <p className="text-white text-lg">{formatDate(challan.challan_date)}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">Reference No</p>
                    <p className="text-white text-lg">{challan.reference_no || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Bill To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-6 py-4 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Bill To</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-white font-semibold text-lg mb-2">{challan.customer_name}</p>
                  <p className="text-white/80 mb-1">{challan.bill_to_address || 'Address not provided'}</p>
                  <p className="text-white/80 mb-3">
                    {[challan.bill_to_city, challan.bill_to_state, challan.bill_to_pincode].filter(Boolean).join(' ') || '-'}
                  </p>
                  <div className="flex flex-col gap-1 text-white/60 text-sm">
                    <p>GST: {challan.bill_to_gst || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-6 py-4 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-pink-400" />
                    <h2 className="text-lg font-semibold text-white">Ship To</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-white font-semibold text-lg mb-2">{challan.customer_name}</p>
                  <p className="text-white/80 mb-1">{challan.ship_to_address || challan.bill_to_address || 'Address not provided'}</p>
                  <p className="text-white/80 mb-3">
                    {[
                      challan.ship_to_city || challan.bill_to_city, 
                      challan.ship_to_state || challan.bill_to_state, 
                      challan.ship_to_pincode || challan.bill_to_pincode
                    ].filter(Boolean).join(' ') || '-'}
                  </p>
                  <div className="flex flex-col gap-1 text-white/60 text-sm">
                    <p>GST: {challan.ship_to_gst || challan.bill_to_gst || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-4 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Transport Details</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-white/50 text-sm mb-1">Vehicle No</p>
                    <p className="text-white">{challan.vehicle_no || '-'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">Transporter</p>
                    <p className="text-white">{challan.transporter_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm mb-1">Freight Charges</p>
                    <p className="text-white">₹{Number(challan.freight_charges || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-4 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Items</h2>
                </div>
              </div>
              
              <div className="p-6">
                {challan.items && challan.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-white/60">Item</th>
                          <th className="px-4 py-3 text-right text-white/60">Qty</th>
                          <th className="px-4 py-3 text-left text-white/60">Unit</th>
                          <th className="px-4 py-3 text-right text-white/60">Rate</th>
                          <th className="px-4 py-3 text-right text-white/60">Amount</th>
                          <th className="px-4 py-3 text-left text-white/60">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {challan.items.map((item, index) => {
                          const quantity = Number(item.quantity) || 0
                          const rate = Number(item.rate) || 0
                          const amount = quantity * rate
                          
                          return (
                            <tr key={index}>
                              <td className="px-4 py-3 text-white">{item.item_name}</td>
                              <td className="px-4 py-3 text-white text-right">{quantity.toFixed(2)}</td>
                              <td className="px-4 py-3 text-white">
                                <span className="flex items-center">
                                  {getUnitIcon(item.unit)}
                                  {item.unit || 'NOS'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white text-right">₹{rate.toFixed(2)}</td>
                              <td className="px-4 py-3 text-green-400 text-right">₹{amount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-white/70">{item.notes || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-white/5">
                        <tr>
                          <td className="px-4 py-4 text-white font-bold">Total</td>
                          <td className="px-4 py-4 text-white text-right font-bold">{totalQuantity.toFixed(2)}</td>
                          <td></td>
                          <td></td>
                          <td className="px-4 py-4 text-green-400 text-right font-bold">₹{totalAmount.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/50">No items found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {challan.notes && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 px-6 py-4 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-white">Additional Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-white/70 whitespace-pre-wrap">{challan.notes}</p>
                </div>
              </div>
            )}

            {/* DSC Signature Block */}
            <div className="mt-8 flex justify-between items-end border-t border-white/20 pt-8 print:border-black/20">
              <div className="text-sm text-white/60 print:text-black/60">
                <p>This is a computer-generated document.</p>
                <p>No physical signature is required.</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="border-2 border-green-500/30 rounded-lg p-3 inline-block bg-green-500/5 mb-4 print:border-green-600 print:bg-white text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-green-500 print:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="font-bold text-green-500 text-sm print:text-green-600">Digitally Signed</span>
                  </div>
                  <div className="text-xs text-white/80 print:text-black/80 space-y-0.5">
                    <p><span className="font-semibold text-white/90 print:text-black">By:</span> FOUR (R) PLASTIC</p>
                    <p><span className="font-semibold text-white/90 print:text-black">Date:</span> {formatDate(challan.challan_date)}</p>
                    <p><span className="font-semibold text-white/90 print:text-black">Reason:</span> Authorized Signatory</p>
                  </div>
                </div>
                <p className="text-white font-semibold print:text-black">For FOUR (R) PLASTIC</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}