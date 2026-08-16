'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import BarcodeScanner from '@/components/BarcodeScanner'
import AddItemModal from '@/components/AddItemModal'

// API Base URL constant
const API_BASE_URL = '/api'

export default function NewPurchaseInvoice() {
  const [vendors, setVendors] = useState([])
  const [allItems, setAllItems] = useState([]) // Combined items
  const [searchResults, setSearchResults] = useState([])
  const [showItemSearch, setShowItemSearch] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taxType, setTaxType] = useState('igst')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [isInvoiceNoEditable, setIsInvoiceNoEditable] = useState(false)
  
  // GST Tax Options
  const [gstOptions, setGstOptions] = useState([
    { value: 0, label: '0%' },
    { value: 3, label: '3%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' }
  ])
  
  const [selectedGstRate, setSelectedGstRate] = useState(18)
  const [applyGstToAll, setApplyGstToAll] = useState(false)
  
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    
    // Bill To (Company address - can be edited)
    bill_to_address: '90 FEET ROAD, WIRE GALI, KHADI NO.3',
    bill_to_city: 'Mumbai',
    bill_to_state: 'Maharashtra',
    bill_to_pincode: '400078',
    bill_to_gst: '27ABTPV9432F1ZX',
    
    // Ship To
    ship_to_address: '',
    ship_to_city: '',
    ship_to_state: '',
    ship_to_pincode: '',
    ship_to_gst: '',
    
    place_of_supply: '',
    transport_mode: 'Road',
    vehicle_no: '',
    
    items: [],
    
    discount: 0,
    taxable_amount: 0,
    cgst_total: 0,
    sgst_total: 0,
    igst_total: 0,
    gst_total: 0,
    grand_total: 0,
    
    notes: ''
  })

  const router = useRouter()

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setInvoiceNo(`PUR${year}${month}${random}`)
  }

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vendors`)
      setVendors(response.data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
    }
  }

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/items`)
      console.log('All items response:', response.data)
      
      const itemsWithIds = response.data.map((item, index) => ({
        ...item,
        item_type: item.item_type || (item.type === 'finished_good' ? 'finished_good' : 'raw_material'),
        compound_id: item.compound_id || `${item.item_type === 'raw_material' ? 'RM' : 'FG'}_${item.id || index}`
      }))
      
      setAllItems(itemsWithIds)
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to fetch items')
    }
  }

  const calculateTotals = () => {
    const items = formData.items
    
    // Calculate subtotal (sum of taxable values)
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.taxable_value) || 0), 0)
    
    // Calculate GST totals
    const cgstTotal = items.reduce((sum, item) => sum + (parseFloat(item.cgst_amount) || 0), 0)
    const sgstTotal = items.reduce((sum, item) => sum + (parseFloat(item.sgst_amount) || 0), 0)
    const igstTotal = items.reduce((sum, item) => sum + (parseFloat(item.igst_amount) || 0), 0)
    const gstTotal = cgstTotal + sgstTotal + igstTotal
    
    // Apply discount at invoice level
    const discountPercent = parseFloat(formData.discount) || 0
    const discountAmount = subtotal * discountPercent / 100
    const taxableAmount = subtotal - discountAmount
    
    // Grand total
    const grandTotal = taxableAmount + gstTotal
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      taxable_amount: taxableAmount,
      cgst_total: cgstTotal,
      sgst_total: sgstTotal,
      igst_total: igstTotal,
      gst_total: gstTotal,
      grand_total: grandTotal
    }))
  }

  const applyGstRateToAll = () => {
    if (formData.items.length > 0) {
      const updatedItems = [...formData.items]
      updatedItems.forEach((item, index) => {
        updatedItems[index] = {
          ...item,
          gst_rate: selectedGstRate,
          cgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
          sgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
          igst_rate: taxType === 'igst' ? selectedGstRate : 0
        }
      })
      setFormData(prev => ({ ...prev, items: updatedItems }))
      
      // Recalculate all items
      setTimeout(() => {
        updatedItems.forEach((item, index) => {
          calculateItemTotals(index, item)
        })
      }, 100)
      
      toast.success(`Applied ${selectedGstRate}% GST to all items`)
    }
  }

  useEffect(() => {
    checkAuth()
    fetchVendors()
    fetchItems()
    generateInvoiceNumber()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discount, taxType])

  // Apply GST rate to all items when checkbox is checked
  useEffect(() => {
    if (applyGstToAll && formData.items.length > 0) {
      applyGstRateToAll()
    }
  }, [applyGstToAll, selectedGstRate])



  const handleVendorChange = (e) => {
    const vendorId = parseInt(e.target.value)
    const vendor = vendors.find(v => v.id === vendorId)
    
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      // Auto-fill Ship To from vendor
      ship_to_address: vendor?.address || '',
      ship_to_city: vendor?.city || '',
      ship_to_state: vendor?.state || '',
      ship_to_pincode: vendor?.pincode || '',
      ship_to_gst: vendor?.gst || '',
      place_of_supply: vendor?.state || ''
    }))

    // Determine tax type based on vendor state
    if (vendor?.state === 'Maharashtra') {
      setTaxType('cgst_sgst') // Within state - CGST+SGST
    } else {
      setTaxType('igst') // Outside state - IGST
    }
  }

  const copyBillToShipTo = () => {
    setFormData(prev => ({
      ...prev,
      ship_to_address: prev.bill_to_address,
      ship_to_city: prev.bill_to_city,
      ship_to_state: prev.bill_to_state,
      ship_to_pincode: prev.bill_to_pincode,
      ship_to_gst: prev.bill_to_gst
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          item_id: '',
          item_type: 'raw_material', // Set default to raw_material
          item_name: '',
          hsn_code: '',
          lot_no: '',
          quantity: 1,
          received_quantity: 1,
          rate: 0,
          discount: 0,
          taxable_value: 0,
          gst_rate: selectedGstRate,
          cgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
          sgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
          igst_rate: taxType === 'igst' ? selectedGstRate : 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          total: 0
        }
      ]
    }))
  }

  const handleScanSuccess = (decodedText) => {
    const foundItem = items.find(i => 
      (i.item_code && i.item_code === decodedText) || 
      (i.hsn_code && i.hsn_code === decodedText) || 
      i.id.toString() === decodedText
    )
    
    if (foundItem) {
      const itemGstRate = parseFloat(foundItem.gst_rate) || selectedGstRate
      const rate = parseFloat(foundItem.purchase_rate) || parseFloat(foundItem.rate) || 0
      
      const newItem = {
        id: Date.now() + Math.random(),
        item_id: foundItem.id,
        item_type: foundItem.item_type || 'raw_material',
        item_name: foundItem.name,
        hsn_code: foundItem.hsn_code || '',
        quantity: 1,
        rate: rate,
        discount: 0,
        taxable_value: rate,
        gst_rate: itemGstRate,
        cgst_rate: taxType === 'cgst_sgst' ? itemGstRate / 2 : 0,
        sgst_rate: taxType === 'cgst_sgst' ? itemGstRate / 2 : 0,
        igst_rate: taxType === 'igst' ? itemGstRate : 0,
        cgst_amount: taxType === 'cgst_sgst' ? rate * (itemGstRate / 2) / 100 : 0,
        sgst_amount: taxType === 'cgst_sgst' ? rate * (itemGstRate / 2) / 100 : 0,
        igst_amount: taxType === 'igst' ? rate * itemGstRate / 100 : 0,
        total: rate + (rate * itemGstRate / 100)
      }
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
      
      toast.success(`Scanned: ${foundItem.name}`)
    } else {
      toast.error(`Item not found for barcode: ${decodedText}`)
    }
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const openItemSearch = (index) => {
    setCurrentItemIndex(index)
    setShowItemSearch(true)
    // Initialize search results with all items
    setSearchResults(allItems)
  }

  const selectItem = (item) => {
    if (currentItemIndex !== null) {
      const updatedItems = [...formData.items]
      
      console.log('Selected item details:', item)
      
      // Determine rate based on item type (for purchase, use purchase_rate)
      const rate = parseFloat(item.purchase_rate) || 0
      
      // Use item's GST rate if available, otherwise use selected rate
      const itemGstRate = parseFloat(item.gst_rate) || selectedGstRate
      
      // Ensure item_type is properly set
      let itemType = item.item_type || ''
      
      // If item_type is empty, try to determine from other fields
      if (!itemType) {
        if (item.type === 'raw_material' || item.type === 'RM' || item.category === 'Raw Material') {
          itemType = 'raw_material'
        } else if (item.type === 'finished_good' || item.type === 'FG' || item.category === 'Finished Good') {
          itemType = 'finished_good'
        } else {
          // Default to raw_material for purchase invoices
          itemType = 'raw_material'
        }
      }
      
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        item_id: item.id,
        item_type: itemType,
        item_name: item.name,
        hsn_code: item.hsn_code || '',
        rate: rate,
        gst_rate: itemGstRate,
        cgst_rate: taxType === 'cgst_sgst' ? itemGstRate / 2 : 0,
        sgst_rate: taxType === 'cgst_sgst' ? itemGstRate / 2 : 0,
        igst_rate: taxType === 'igst' ? itemGstRate : 0,
        quantity: 1,
        discount: 0
      }
      
      setFormData(prev => ({ ...prev, items: updatedItems }))
      
      // Calculate totals for this item
      setTimeout(() => {
        calculateItemTotals(currentItemIndex, updatedItems[currentItemIndex])
      }, 100)
      
      toast.success(`Added ${item.name}`)
    }
    setShowItemSearch(false)
    setCurrentItemIndex(null)
  }

  const handleItemCreated = (newItem) => {
    fetchItems() // Refresh item list
    // Optionally auto-select it if a row is open
    if (currentItemIndex !== null) {
      selectItem(newItem)
    }
  }

  const updateItemField = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index][field] = value
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
    
    setTimeout(() => {
      calculateItemTotals(index, updatedItems[index])
    }, 50)
  }

  const updateItemGstRate = (index, rate) => {
    const updatedItems = [...formData.items]
    const gstRate = parseFloat(rate) || 0
    
    updatedItems[index] = {
      ...updatedItems[index],
      gst_rate: gstRate,
      cgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
      sgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
      igst_rate: taxType === 'igst' ? gstRate : 0
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
    
    setTimeout(() => {
      calculateItemTotals(index, updatedItems[index])
    }, 50)
  }

  const calculateItemTotals = (index, item) => {
    const quantity = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.rate) || 0
    const discount = parseFloat(item.discount) || 0
    
    // Calculate amount before discount
    const amount = quantity * rate
    
    // Calculate discount amount
    const discountAmount = amount * discount / 100
    
    // Calculate taxable value after discount
    const taxableValue = amount - discountAmount
    
    // Calculate GST based on tax type
    const cgstRate = parseFloat(item.cgst_rate) || 0
    const sgstRate = parseFloat(item.sgst_rate) || 0
    const igstRate = parseFloat(item.igst_rate) || 0
    
    const cgstAmount = taxableValue * cgstRate / 100
    const sgstAmount = taxableValue * sgstRate / 100
    const igstAmount = taxableValue * igstRate / 100
    const gstTotal = cgstAmount + sgstAmount + igstAmount
    
    // Total including GST
    const total = taxableValue + gstTotal
    
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...item,
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      total: total
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!formData.vendor_id) {
      toast.error('Please select a vendor')
      return
    }
    
    // Validate that all items have item_id
    const invalidItems = formData.items.filter(item => !item.item_id)
    if (invalidItems.length > 0) {
      toast.error('Please select items for all rows')
      return
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        invoice_no: invoiceNo,
        invoice_date: formData.invoice_date,
        vendor_id: Number(formData.vendor_id),
        bill_to_address: formData.bill_to_address,
        bill_to_city: formData.bill_to_city,
        bill_to_state: formData.bill_to_state,
        bill_to_pincode: formData.bill_to_pincode,
        bill_to_gst: formData.bill_to_gst,
        ship_to_address: formData.ship_to_address,
        ship_to_city: formData.ship_to_city,
        ship_to_state: formData.ship_to_state,
        ship_to_pincode: formData.ship_to_pincode,
        ship_to_gst: formData.ship_to_gst,
        place_of_supply: formData.place_of_supply,
        transport_mode: formData.transport_mode,
        vehicle_no: formData.vehicle_no,
        discount: Number(formData.discount) || 0,
        taxable_amount: Number(formData.taxable_amount) || 0,
        cgst_total: Number(formData.cgst_total) || 0,
        sgst_total: Number(formData.sgst_total) || 0,
        igst_total: Number(formData.igst_total) || 0,
        grand_total: Number(formData.grand_total) || 0,
        notes: formData.notes,
        payment_type: 'cash',
        bank_id: null,
        paid_amount: Number(formData.grand_total) || 0,
        items: formData.items.map(item => ({
          item_id: Number(item.item_id),
          item_type: item.item_type || 'raw_material',
          lot_no: item.lot_no || '',
          quantity: Number(item.quantity) || 0,
          received_quantity: item.received_quantity !== undefined && item.received_quantity !== '' ? Number(item.received_quantity) : (Number(item.quantity) || 0),
          rate: Number(item.rate) || 0,
          discount: Number(item.discount) || 0,
          taxable_value: Number(item.taxable_value) || 0,
          gst_rate: Number(item.gst_rate) || 0,
          cgst_rate: Number(item.cgst_rate) || 0,
          sgst_rate: Number(item.sgst_rate) || 0,
          igst_rate: Number(item.igst_rate) || 0,
          cgst_amount: Number(item.cgst_amount) || 0,
          sgst_amount: Number(item.sgst_amount) || 0,
          igst_amount: Number(item.igst_amount) || 0,
          total: Number(item.total) || 0
        }))
      }
      
      console.log('📤 Submitting purchase invoice:', submitData)
      
      const response = await axios.post(`${API_BASE_URL}/purchase-invoices/`, submitData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      toast.success('Purchase invoice created successfully')
      router.push(`/purchase-invoices/${response.data.id}`)
      
    } catch (error) {
      console.error('❌ Error:', error)
      
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        toast.error(error.response.data?.error || error.response.data?.message || 'Server error')
      } else if (error.request) {
        console.error('Error request:', error.request)
        toast.error('No response from server. Please check if backend is running.')
      } else {
        toast.error(error.message || 'Failed to create purchase invoice')
      }
    }
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
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
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  NEW PURCHASE INVOICE
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Header */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Invoice No *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      readOnly={!isInvoiceNoEditable}
                      className={`flex-1 px-3 py-2 bg-white/10 border border-white/20 
                        rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500
                        ${!isInvoiceNoEditable ? 'opacity-70' : ''}`}
                      placeholder="PUR24030001"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsInvoiceNoEditable(!isInvoiceNoEditable)}
                      className="px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
                      title={isInvoiceNoEditable ? "Auto-generate" : "Edit"}
                    >
                      {isInvoiceNoEditable ? '🔄' : '✏️'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm mb-1">Vendor *</label>
                  <div className="relative">
                    <select
                      value={formData.vendor_id}
                      onChange={handleVendorChange}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Select Vendor</option>
                      {vendors.map(vendor => (
                        <option 
                          key={vendor.id} 
                          value={vendor.id}
                          style={{ backgroundColor: 'white', color: 'black' }}
                        >
                          {vendor.name} ({vendor.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* GST Tax Options */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">GST Tax Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Tax Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={taxType === 'igst'}
                        onChange={() => setTaxType('igst')}
                        className="rounded border-white/20 bg-white/10"
                      />
                      <span className="text-white">IGST (Inter-state)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={taxType === 'cgst_sgst'}
                        onChange={() => setTaxType('cgst_sgst')}
                        className="rounded border-white/20 bg-white/10"
                      />
                      <span className="text-white">CGST+SGST (Intra-state)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-2">Select GST Rate</label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedGstRate}
                      onChange={(e) => setSelectedGstRate(parseFloat(e.target.value))}
                      className="px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      {gstOptions.map(option => (
                        <option key={option.value} value={option.value} style={{ backgroundColor: 'white', color: 'black' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <label className="flex items-center gap-2 ml-2">
                      <input
                        type="checkbox"
                        checked={applyGstToAll}
                        onChange={(e) => setApplyGstToAll(e.target.checked)}
                        className="rounded border-white/20 bg-white/10"
                      />
                      <span className="text-white text-sm">Apply to all items</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    <span className="font-semibold">Current Tax Setting:</span><br />
                    {taxType === 'igst' ? 'IGST' : 'CGST+SGST'} • {selectedGstRate}% rate
                    {applyGstToAll && ' • Applied to all items'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Bill To (Your Company)</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.bill_to_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, bill_to_address: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.bill_to_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, bill_to_city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.bill_to_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, bill_to_state: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={formData.bill_to_pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, bill_to_pincode: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                    <input
                      type="text"
                      placeholder="GST"
                      value={formData.bill_to_gst}
                      onChange={(e) => setFormData(prev => ({ ...prev, bill_to_gst: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Ship To (Vendor)</h2>
                  <button
                    type="button"
                    onClick={copyBillToShipTo}
                    className="text-sm text-pink-400 hover:text-pink-300"
                  >
                    Copy from Bill To
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.ship_to_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, ship_to_address: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.ship_to_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, ship_to_city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.ship_to_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, ship_to_state: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={formData.ship_to_pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, ship_to_pincode: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                    <input
                      type="text"
                      placeholder="GST"
                      value={formData.ship_to_gst}
                      onChange={(e) => setFormData(prev => ({ ...prev, ship_to_gst: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Transport Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={formData.place_of_supply}
                    onChange={(e) => setFormData(prev => ({ ...prev, place_of_supply: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Transport Mode</label>
                  <div className="relative">
                    <select
                      value={formData.transport_mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, transport_mode: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="Road" style={{ backgroundColor: 'white', color: 'black' }}>Road</option>
                      <option value="Rail" style={{ backgroundColor: 'white', color: 'black' }}>Rail</option>
                      <option value="Air" style={{ backgroundColor: 'white', color: 'black' }}>Air</option>
                      <option value="Ship" style={{ backgroundColor: 'white', color: 'black' }}>Ship</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Vehicle No</label>
                  <input
                    type="text"
                    value={formData.vehicle_no}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_no: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    placeholder="e.g., MH01AB1234"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Items</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create New Item
                  </button>
                  <BarcodeScanner 
                    onScanSuccess={handleScanSuccess} 
                    buttonText="Scan Item" 
                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 flex items-center gap-1 text-sm" 
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">HSN</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Lot/Batch</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Bill Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Recv Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Disc%</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">GST%</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Taxable</th>
                      {taxType === 'cgst_sgst' ? (
                        <>
                          <th className="px-3 py-2 text-right text-xs font-medium text-white/60">CGST</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-white/60">SGST</th>
                        </>
                      ) : (
                        <th className="px-3 py-2 text-right text-xs font-medium text-white/60">IGST</th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-white/60"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {formData.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          {item.item_name ? (
                            <span className="text-white text-sm">{item.item_name}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openItemSearch(index)}
                              className="text-pink-400 hover:text-pink-300 text-sm"
                            >
                              Select Item
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.item_type && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.item_type === 'raw_material' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {item.item_type === 'raw_material' ? 'RM' : 'FG'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-white/70 text-sm">{item.hsn_code}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.lot_no || ''}
                            onChange={(e) => updateItemField(index, 'lot_no', e.target.value)}
                            className="w-24 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm"
                            placeholder="Lot No"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                            className="w-20 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                            min="0.01"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.received_quantity !== undefined ? item.received_quantity : item.quantity}
                            onChange={(e) => updateItemField(index, 'received_quantity', e.target.value)}
                            className="w-20 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItemField(index, 'rate', e.target.value)}
                            className="w-24 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItemField(index, 'discount', e.target.value)}
                            className="w-16 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.gst_rate || selectedGstRate}
                            onChange={(e) => updateItemGstRate(index, e.target.value)}
                            className="w-20 px-2 py-1 bg-gray-800 border border-white/20  rounded text-white text-sm text-right"
                            style={{ backgroundColor: '#1f2937', color: 'white' }}
                          >
                            {gstOptions.map(option => (
                              <option key={option.value} value={option.value} style={{ backgroundColor: 'white', color: 'black' }}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right text-white/70 text-sm">
                          {item.taxable_value?.toFixed(2)}
                        </td>
                        {taxType === 'cgst_sgst' ? (
                          <>
                            <td className="px-3 py-2 text-right text-white/70 text-sm">
                              {item.cgst_amount?.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right text-white/70 text-sm">
                              {item.sgst_amount?.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td className="px-3 py-2 text-right text-white/70 text-sm">
                            {item.igst_amount?.toFixed(2)}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right text-white font-semibold text-sm">
                          {item.total?.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {formData.items.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/50">No items added. Click "Add Item" to start.</p>
                </div>
              )}
            </div>

            {/* Item Search Modal */}
            {showItemSearch && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Select Item</h3>
                    <button
                      onClick={() => setShowItemSearch(false)}
                      className="text-white/50 hover:text-white"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search items by name, code or HSN..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white mb-4"
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase()
                      const filtered = allItems.filter(item =>
                        item.name?.toLowerCase().includes(term) ||
                        item.code?.toLowerCase().includes(term) ||
                        item.hsn_code?.toLowerCase().includes(term)
                      )
                      setSearchResults(filtered)
                    }}
                  />
                  <div className="max-h-96 overflow-y-auto">
                    {(searchResults.length > 0 ? searchResults : allItems).map(item => (
                      <div
                        key={item.compound_id || `${item.item_type || 'RM'}_${item.id}`}
                        onClick={() => selectItem(item)}
                        className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              item.item_type === 'raw_material' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {item.item_type === 'raw_material' ? 'Raw Material' : 'Finished Good'}
                            </span>
                          </div>
                          <span className="text-white/50 text-sm">{item.code}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-white/70 mt-1">
                          <span>HSN: {item.hsn_code || 'N/A'}</span>
                          <span>GST: {item.gst_rate || 0}%</span>
                          <span>Purchase Rate: ₹{item.purchase_rate || 0}</span>
                          <span>Stock: {item.current_stock || 0} {item.unit || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Summary */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50"
                    placeholder="Any additional notes..."
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-white/80">
                    <span>Subtotal:</span>
                    <span className="text-white">₹{formData.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Discount (%):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                        className="w-20 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-white">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-white/80 border-t border-white/20 pt-2">
                    <span>Taxable Amount:</span>
                    <span className="text-white font-semibold">₹{formData.taxable_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {taxType === 'cgst_sgst' ? (
                    <>
                      <div className="flex justify-between text-white/80">
                        <span>CGST:</span>
                        <span className="text-green-400">₹{formData.cgst_total?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>SGST:</span>
                        <span className="text-green-400">₹{formData.sgst_total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-white/80">
                      <span>IGST:</span>
                      <span className="text-green-400">₹{formData.igst_total?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/80 pt-2 border-t border-white/20">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="text-white font-bold text-xl">₹{formData.grand_total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600  rounded-lg text-white font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Invoice'
              )}
            </button>
          </div>
          </form>
        </main>
      </div>

      <AddItemModal 
        isOpen={isAddItemModalOpen} 
        onClose={() => setIsAddItemModalOpen(false)} 
        onAdd={handleItemCreated} 
      />
    </div>
  )
}