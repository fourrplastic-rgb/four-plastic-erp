'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

// API Base URL constant
const API_BASE_URL = '/api'

export default function EditSalesInvoice() {
  const [customers, setCustomers] = useState([])
  const [allItems, setAllItems] = useState([])  // Changed from items to allItems
  const [deliveryChallans, setDeliveryChallans] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [showItemSearch, setShowItemSearch] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState(null)
  const [taxType, setTaxType] = useState('cgst_sgst')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id

  const [formData, setFormData] = useState({
    invoice_date: '',
    customer_id: '',
    challan_no: '',
    
    bill_to_address: '',
    bill_to_city: '',
    bill_to_state: '',
    bill_to_pincode: '',
    bill_to_gst: '',
    
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
    
    notes: '',
    payment_type: 'cash',
    bank_id: '',
    paid_amount: 0
  })

  // Fetch data only when invoiceId is available
  useEffect(() => {
    if (invoiceId) {
      console.log('Invoice ID is now available:', invoiceId)
      checkAuth()
      fetchInvoice()
      fetchCustomers()
      fetchItems()
      fetchDeliveryChallans()
    }
  }, [invoiceId])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discount, taxType])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchInvoice = async () => {
    try {
      console.log('Fetching invoice ID:', invoiceId)
      const response = await axios.get(`${API_BASE_URL}/sales-invoices/${invoiceId}`)
      console.log('Invoice response:', response.data)
      const invoice = response.data
      
      setFormData({
        invoice_date: invoice.invoice_date,
        customer_id: invoice.customer_id,
        challan_no: invoice.challan_no || '',
        
        bill_to_address: invoice.bill_to_address || '',
        bill_to_city: invoice.bill_to_city || '',
        bill_to_state: invoice.bill_to_state || '',
        bill_to_pincode: invoice.bill_to_pincode || '',
        bill_to_gst: invoice.bill_to_gst || '',
        
        ship_to_address: invoice.ship_to_address || '',
        ship_to_city: invoice.ship_to_city || '',
        ship_to_state: invoice.ship_to_state || '',
        ship_to_pincode: invoice.ship_to_pincode || '',
        ship_to_gst: invoice.ship_to_gst || '',
        
        place_of_supply: invoice.place_of_supply || '',
        transport_mode: invoice.transport_mode || 'Road',
        vehicle_no: invoice.vehicle_no || '',
        
        items: invoice.items?.map(item => ({
          id: Date.now() + Math.random(),
          item_id: item.item_id,
          item_type: item.item_type,
          item_name: item.item_name,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          taxable_value: item.taxable_value,
          cgst_rate: item.cgst_rate,
          sgst_rate: item.sgst_rate,
          igst_rate: item.igst_rate,
          cgst_amount: item.cgst_amount,
          sgst_amount: item.sgst_amount,
          igst_amount: item.igst_amount,
          total: item.total
        })) || [],
        
        discount: invoice.discount || 0,
        taxable_amount: invoice.taxable_amount || 0,
        cgst_total: invoice.cgst_total || 0,
        sgst_total: invoice.sgst_total || 0,
        igst_total: invoice.igst_total || 0,
        gst_total: invoice.gst_total || 0,
        grand_total: invoice.grand_total || 0,
        
        notes: invoice.notes || '',
        payment_type: invoice.payment_type || 'cash',
        bank_id: invoice.bank_id || '',
        paid_amount: invoice.paid_amount || 0
      })

      // Set tax type based on GST values
      if (invoice.igst_total > 0) {
        setTaxType('igst')
      } else {
        setTaxType('cgst_sgst')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to fetch invoice')
      router.push('/sales-invoices')
    }
  }

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...')
      const response = await axios.get(`${API_BASE_URL}/customers`)
      console.log('Customers received:', response.data)
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to fetch customers')
    }
  }

  // UPDATED: Fetch both raw materials and finished goods
  const fetchItems = async () => {
    try {
      console.log('Fetching items...')
      const [rawRes, finishedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/items/?type=raw_material`),
        axios.get(`${API_BASE_URL}/items/?type=finished_good`)
      ])
      
      const rawMaterials = rawRes.data.map(item => ({
        ...item,
        item_type: 'raw_material',
        display_type: 'RM'
      }))
      
      const finishedGoods = finishedRes.data.map(item => ({
        ...item,
        item_type: 'finished_good',
        display_type: 'FG'
      }))
      
      const allItemsList = [...rawMaterials, ...finishedGoods]
      setAllItems(allItemsList)
      console.log('Items loaded:', allItemsList.length, 'Total items')
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to fetch items')
    }
  }

  const fetchDeliveryChallans = async () => {
    try {
      console.log('Fetching delivery challans...')
      const response = await axios.get(`${API_BASE_URL}/delivery-challans`)
      console.log('Delivery challans received:', response.data)
      setDeliveryChallans(response.data)
    } catch (error) {
      console.error('Error fetching delivery challans:', error)
      setDeliveryChallans([])
    }
  }

  const handleCustomerChange = (e) => {
    const customerId = parseInt(e.target.value)
    const customer = customers.find(c => c.id === customerId)
    
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      bill_to_address: customer?.address || '',
      bill_to_city: customer?.city || '',
      bill_to_state: customer?.state || '',
      bill_to_pincode: customer?.pincode || '',
      bill_to_gst: customer?.gst || '',
      ship_to_address: customer?.address || '',
      ship_to_city: customer?.city || '',
      ship_to_state: customer?.state || '',
      ship_to_pincode: customer?.pincode || '',
      ship_to_gst: customer?.gst || '',
      place_of_supply: customer?.state || ''
    }))

    if (customer?.state === 'Maharashtra') {
      setTaxType('cgst_sgst')
    } else {
      setTaxType('igst')
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
          item_type: 'finished_good',
          item_name: '',
          hsn_code: '',
          quantity: 1,
          rate: 0,
          discount: 0,
          taxable_value: 0,
          cgst_rate: taxType === 'cgst_sgst' ? 9 : 0,
          sgst_rate: taxType === 'cgst_sgst' ? 9 : 0,
          igst_rate: taxType === 'igst' ? 18 : 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          total: 0
        }
      ]
    }))
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
    setSearchResults(allItems) // Set search results to all items
  }

  // UPDATED: Select item with proper rate based on type
  const selectItem = (item) => {
    if (currentItemIndex !== null) {
      const updatedItems = [...formData.items]
      
      // Use purchase_rate for raw materials, sales_rate for finished goods
      const rate = item.item_type === 'raw_material' 
        ? parseFloat(item.purchase_rate) || parseFloat(item.rate) || 0 
        : parseFloat(item.sales_rate) || parseFloat(item.rate) || 0
      const gstRate = parseFloat(item.gst_rate) || 18
      
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        item_id: item.id,
        item_type: item.item_type,
        item_name: item.name,
        hsn_code: item.hsn_code || '',
        rate: rate,
        cgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
        sgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
        igst_rate: taxType === 'igst' ? gstRate : 0,
        quantity: 1,
        discount: 0
      }
      
      setFormData(prev => ({ ...prev, items: updatedItems }))
      
      setTimeout(() => {
        calculateItemTotals(currentItemIndex, updatedItems[currentItemIndex])
      }, 100)
    }
    setShowItemSearch(false)
    setCurrentItemIndex(null)
  }

  const updateItemField = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index][field] = value
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
    
    setTimeout(() => {
      calculateItemTotals(index, updatedItems[index])
    }, 50)
  }

  const calculateItemTotals = (index, item) => {
    const quantity = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.rate) || 0
    const discount = parseFloat(item.discount) || 0
    
    const amount = quantity * rate
    const discountAmount = amount * discount / 100
    const taxableValue = amount - discountAmount
    
    const cgstRate = parseFloat(item.cgst_rate) || 0
    const sgstRate = parseFloat(item.sgst_rate) || 0
    const igstRate = parseFloat(item.igst_rate) || 0
    
    const cgstAmount = taxableValue * cgstRate / 100
    const sgstAmount = taxableValue * sgstRate / 100
    const igstAmount = taxableValue * igstRate / 100
    const gstTotal = cgstAmount + sgstAmount + igstAmount
    
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

  const calculateTotals = () => {
    const items = formData.items
    
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.taxable_value) || 0), 0)
    
    const cgstTotal = items.reduce((sum, item) => sum + (parseFloat(item.cgst_amount) || 0), 0)
    const sgstTotal = items.reduce((sum, item) => sum + (parseFloat(item.sgst_amount) || 0), 0)
    const igstTotal = items.reduce((sum, item) => sum + (parseFloat(item.igst_amount) || 0), 0)
    const gstTotal = cgstTotal + sgstTotal + igstTotal
    
    const discountPercent = parseFloat(formData.discount) || 0
    const discountAmount = subtotal * discountPercent / 100
    const taxableAmount = subtotal - discountAmount
    
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!formData.customer_id) {
      toast.error('Please select a customer')
      return
    }
    
    try {
      const submitData = {
        ...formData,
        customer_id: Number(formData.customer_id),
        bank_id: formData.bank_id ? Number(formData.bank_id) : null,
        paid_amount: formData.grand_total, // Auto-set paid amount to grand total
        items: formData.items.map(item => ({
          item_id: Number(item.item_id),
          item_type: item.item_type || 'finished_good',
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          discount: Number(item.discount) || 0,
          taxable_value: Number(item.taxable_value) || 0,
          cgst_rate: Number(item.cgst_rate) || 0,
          sgst_rate: Number(item.sgst_rate) || 0,
          igst_rate: Number(item.igst_rate) || 0,
          cgst_amount: Number(item.cgst_amount) || 0,
          sgst_amount: Number(item.sgst_amount) || 0,
          igst_amount: Number(item.igst_amount) || 0,
          total: Number(item.total) || 0
        }))
      }
      
      console.log('📤 Updating invoice:', submitData)
      
      const response = await axios.put(`${API_BASE_URL}/sales-invoices/${invoiceId}`, submitData)
      toast.success('Invoice updated successfully')
      router.push(`/sales-invoices/${invoiceId}`)
      
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Failed to update invoice')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
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
                  EDIT SALES INVOICE
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-white/80 text-sm mb-1">Challan No</label>
                  <div className="relative">
                    <select
                      value={formData.challan_no}
                      onChange={(e) => {
                        const newChallanNo = e.target.value;
                        const selectedChallan = deliveryChallans.find(c => c.challan_no === newChallanNo);
                        setFormData(prev => ({ 
                          ...prev, 
                          challan_no: newChallanNo,
                          invoice_date: selectedChallan?.challan_date ? selectedChallan.challan_date.split('T')[0] : prev.invoice_date
                        }));
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Select Challan</option>
                      {deliveryChallans.map(challan => {
                        const isBilledToOther = challan.invoice_no && challan.challan_no !== formData.challan_no;
                        let displayText = `${challan.challan_no} - ${challan.customer_name || challan.customer} (${challan.challan_date})`;
                        if (isBilledToOther) {
                          displayText += ` (Billed: ${challan.invoice_no})`;
                        } else if (challan.invoice_no && challan.challan_no === formData.challan_no) {
                          displayText += ` (Current Invoice)`;
                        }
                        
                        return (
                          <option 
                            key={challan.id} 
                            value={challan.challan_no}
                            disabled={isBilledToOther}
                            style={{ 
                              backgroundColor: isBilledToOther ? '#f3f4f6' : 'white', 
                              color: isBilledToOther ? '#9ca3af' : 'black',
                              fontStyle: isBilledToOther ? 'italic' : 'normal'
                            }}
                          >
                             {displayText}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Customer *</label>
                  <div className="relative">
                    <select
                      value={formData.customer_id}
                      onChange={handleCustomerChange}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Select Customer</option>
                      {customers.map(customer => (
                        <option 
                          key={customer.id} 
                          value={customer.id}
                          style={{ backgroundColor: 'white', color: 'black' }}
                        >
                          {customer.name} ({customer.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Bill To</h2>
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
                  <h2 className="text-lg font-semibold text-white">Ship To</h2>
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

            {/* Items Grid */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white/60">HSN</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Disc%</th>
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
                          {item.item_name && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.item_type === 'raw_material' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {item.item_type === 'raw_material' ? 'RM' : 'FG'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-white/70 text-sm">{item.hsn_code}</td>
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
                    placeholder="Search items..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white mb-4"
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase()
                      const filtered = allItems.filter(item =>
                        item.name?.toLowerCase().includes(term) ||
                        item.code?.toLowerCase().includes(term) ||
                        item.hsn_code?.includes(term)
                      )
                      setSearchResults(filtered)
                    }}
                  />
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map(item => (
                      <div
                        key={`${item.item_type}-${item.id}`}
                        onClick={() => {
                          console.log('Item clicked:', item)
                          selectItem(item)
                        }}
                        className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              item.item_type === 'raw_material' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {item.item_type === 'raw_material' ? 'Raw Material' : 'Finished Good'}
                            </span>
                          </div>
                          <span className="text-white/50 text-sm">{item.code}</span>
                        </div>
                        <div className="flex gap-4 text-sm text-white/70 mt-1">
                          <span>HSN: {item.hsn_code || '-'}</span>
                          <span>GST: {item.gst_rate}%</span>
                          <span>Rate: ₹{item.item_type === 'raw_material' ? (item.purchase_rate || 0) : (item.sales_rate || 0)}</span>
                          <span>Stock: {item.current_stock} {item.unit}</span>
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && (
                      <div className="text-center py-8 text-white/50">
                        No items found
                      </div>
                    )}
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

            {/* Payment Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Payment Type</label>
                  <div className="relative">
                    <select
                      value={formData.payment_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="cash" style={{ backgroundColor: 'white', color: 'black' }}>Cash</option>
                      <option value="bank" style={{ backgroundColor: 'white', color: 'black' }}>Bank Transfer</option>
                      <option value="cheque" style={{ backgroundColor: 'white', color: 'black' }}>Cheque</option>
                      <option value="card" style={{ backgroundColor: 'white', color: 'black' }}>Card</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Paid Amount</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20  rounded-lg text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-medium"
              >
                Update Invoice
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}