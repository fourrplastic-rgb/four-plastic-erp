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
} from '@heroicons/react/24/outline'
import BarcodeScanner from '@/components/BarcodeScanner'
import AddItemModal from '@/components/AddItemModal'

export default function NewSalesInvoice() {
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [deliveryChallans, setDeliveryChallans] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [showItemSearch, setShowItemSearch] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState(null)
  const [taxType, setTaxType] = useState('cgst_sgst')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customersMap, setCustomersMap] = useState({})
  
  const [gstOptions] = useState([
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

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCustomers()
    fetchItems()
    fetchDeliveryChallans()
  }, [])

  useEffect(() => {
    if (customers.length > 0 && deliveryChallans.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const challanNoParam = params.get('challan_no')
      if (challanNoParam) {
        loadChallanDetails(challanNoParam, deliveryChallans, customers)
      }
    }
  }, [customers, deliveryChallans])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.discount, taxType])

  useEffect(() => {
    if (applyGstToAll && formData.items.length > 0) {
      const updatedItems = [...formData.items]
      updatedItems.forEach((item, index) => {
        if (item) {
          updatedItems[index] = {
            ...item,
            gst_rate: selectedGstRate,
            cgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
            sgst_rate: taxType === 'cgst_sgst' ? selectedGstRate / 2 : 0,
            igst_rate: taxType === 'igst' ? selectedGstRate : 0
          }
        }
      })
      setFormData(prev => ({ ...prev, items: updatedItems }))
      
      setTimeout(() => {
        updatedItems.forEach((item, index) => {
          if (item) calculateItemTotals(index, item)
        })
      }, 100)
      
      toast.success(`Applied ${selectedGstRate}% GST to all items`)
    }
  }, [applyGstToAll, selectedGstRate, taxType])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const calculateChallanTotal = (challan) => {
    if (challan && challan.items && Array.isArray(challan.items)) {
      return challan.items.reduce((sum, item) => {
        const qty = Number(item?.qty) || Number(item?.quantity) || 0
        return sum + qty
      }, 0)
    }
    return 0
  }

  const fetchDeliveryChallans = async () => {
    try {
      const response = await axios.get('/api/delivery-challans')
      let challansData = response.data || []
      
      for (let i = 0; i < challansData.length; i++) {
        try {
          const challanDetail = await axios.get(`/api/delivery-challans/${challansData[i].id}`)
          challansData[i].items = challanDetail.data.items || []
          if (customersMap[challansData[i].customer_id]) {
            challansData[i].customer_name = customersMap[challansData[i].customer_id]
          }
        } catch (err) {
          console.error(`Error fetching items for challan ${challansData[i].id}:`, err)
          challansData[i].items = []
        }
      }
      
      setDeliveryChallans(challansData)
    } catch (error) {
      console.error('Error fetching challans:', error)
      setDeliveryChallans([])
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      setCustomers(response.data || [])
      
      const map = {}
      ;(response.data || []).forEach(customer => {
        map[customer.id] = customer.name
      })
      setCustomersMap(map)
      
      setDeliveryChallans(prev => (prev || []).map(challan => ({
        ...challan,
        customer_name: map[challan.customer_id] || 'Unknown Customer'
      })))
    } catch (error) {
      toast.error('Failed to fetch customers')
    }
  }

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/items')
      setItems(response.data || [])
    } catch (error) {
      toast.error('Failed to fetch items')
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

  const loadChallanDetails = (challanNo, list = deliveryChallans, custs = customers) => {
    const selectedChallan = list.find(c => c.challan_no === challanNo)
    if (selectedChallan) {
      const customer = custs.find(c => c.id === selectedChallan.customer_id)
      
      setFormData(prev => {
        const newData = {
          ...prev,
          invoice_date: selectedChallan.challan_date ? selectedChallan.challan_date.split('T')[0] : prev.invoice_date,
          transport_mode: selectedChallan.transport_mode || prev.transport_mode,
          vehicle_no: selectedChallan.vehicle_no || prev.vehicle_no,
          place_of_supply: selectedChallan.place_of_delivery || prev.place_of_supply
        };
        if (customer) {
          newData.customer_id = customer.id;
          newData.bill_to_address = customer.address || '';
          newData.bill_to_city = customer.city || '';
          newData.bill_to_state = customer.state || '';
          newData.bill_to_pincode = customer.pincode || '';
          newData.bill_to_gst = customer.gst || '';
          newData.ship_to_address = customer.address || '';
          newData.ship_to_city = customer.city || '';
          newData.ship_to_state = customer.state || '';
          newData.ship_to_pincode = customer.pincode || '';
          newData.ship_to_gst = customer.gst || '';
          if (!selectedChallan.place_of_delivery) {
              newData.place_of_supply = customer.state || '';
          }
        }
        return newData;
      });
      
      if (selectedChallan.items && selectedChallan.items.length > 0) {
        const mappedItems = selectedChallan.items.map((item, idx) => {
          const itemName = item?.item_name || item?.name || `Item ${idx + 1}`
          const itemId = item?.item_id || item?.id
          const quantity = Number(item?.qty) || Number(item?.quantity) || 0
          const rate = Number(item?.rate) || 0
          const gstRate = Number(item?.gst_rate) || selectedGstRate
          
          return {
            id: Date.now() + Math.random() + idx,
            item_id: itemId,
            item_type: item?.item_type || 'finished_good',
            item_name: itemName,
            hsn_code: item?.hsn_code || '',
            quantity: quantity,
            rate: rate,
            discount: 0,
            taxable_value: 0,
            gst_rate: gstRate,
            cgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
            sgst_rate: taxType === 'cgst_sgst' ? gstRate / 2 : 0,
            igst_rate: taxType === 'igst' ? gstRate : 0,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: 0,
            total: 0
          }
        })
        
        setFormData(prev => ({ ...prev, items: mappedItems }))
        
        setTimeout(() => {
          mappedItems.forEach((item, index) => {
            calculateItemTotals(index, item)
          })
        }, 100)
        
        toast.success(`Loaded ${selectedChallan.items.length} items from challan`)
      } else {
        toast('No items found in this challan', { icon: 'ℹ️' })
      }
    }
  }

  const handleChallanChange = async (e) => {
    const challanNo = e.target.value
    setFormData(prev => ({ ...prev, challan_no: challanNo }))
    if (challanNo) {
      loadChallanDetails(challanNo)
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
    const newItem = {
      id: Date.now(),
      item_id: '',
      item_type: 'finished_good',
      item_name: '',
      hsn_code: '',
      quantity: 1,
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
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
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
      const rate = parseFloat(foundItem.sales_rate) || parseFloat(foundItem.rate) || 0
      
      const newItem = {
        id: Date.now() + Math.random(),
        item_id: foundItem.id,
        item_type: foundItem.item_type || 'finished_good',
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
  }

  const selectItem = (item) => {
    if (currentItemIndex !== null) {
      const updatedItems = [...formData.items]
      
      let rate = 0
      if (item.item_type === 'finished_good') {
        rate = parseFloat(item.sales_rate) || parseFloat(item.rate) || 0
      } else {
        rate = parseFloat(item.purchase_rate) || parseFloat(item.rate) || 0
      }
      
      const itemGstRate = parseFloat(item.gst_rate) || selectedGstRate
      
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        item_id: item.id,
        item_type: item.item_type,
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
      
      setTimeout(() => {
        calculateItemTotals(currentItemIndex, updatedItems[currentItemIndex])
      }, 100)
    }
    setShowItemSearch(false)
    setCurrentItemIndex(null)
  }

  const handleItemCreated = (newItem) => {
    fetchItems()
    if (currentItemIndex !== null) {
      selectItem(newItem)
    }
  }

  const updateItemField = (index, field, value) => {
    const updatedItems = [...formData.items]
    if (updatedItems[index]) {
      updatedItems[index][field] = value
      setFormData(prev => ({ ...prev, items: updatedItems }))
      setTimeout(() => {
        calculateItemTotals(index, updatedItems[index])
      }, 50)
    }
  }

  const updateItemGstRate = (index, rate) => {
    const updatedItems = [...formData.items]
    const gstRate = parseFloat(rate) || 0
    
    if (updatedItems[index]) {
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
  }

  const calculateItemTotals = (index, item) => {
    if (!item) return
    
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
    if (updatedItems[index]) {
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
  }

  const calculateTotals = () => {
    const items = formData.items || []
    
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item?.taxable_value) || 0), 0)
    
    const cgstTotal = items.reduce((sum, item) => sum + (parseFloat(item?.cgst_amount) || 0), 0)
    const sgstTotal = items.reduce((sum, item) => sum + (parseFloat(item?.sgst_amount) || 0), 0)
    const igstTotal = items.reduce((sum, item) => sum + (parseFloat(item?.igst_amount) || 0), 0)
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
    
    if (isSubmitting) return
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!formData.customer_id) {
      toast.error('Please select a customer')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const submitData = {
        invoice_date: formData.invoice_date,
        customer_id: Number(formData.customer_id),
        challan_no: formData.challan_no || null,
        
        bill_to_address: formData.bill_to_address || '',
        bill_to_city: formData.bill_to_city || '',
        bill_to_state: formData.bill_to_state || '',
        bill_to_pincode: formData.bill_to_pincode || '',
        bill_to_gst: formData.bill_to_gst || '',
        
        ship_to_address: formData.ship_to_address || '',
        ship_to_city: formData.ship_to_city || '',
        ship_to_state: formData.ship_to_state || '',
        ship_to_pincode: formData.ship_to_pincode || '',
        ship_to_gst: formData.ship_to_gst || '',
        
        place_of_supply: formData.place_of_supply || '',
        transport_mode: formData.transport_mode || 'Road',
        vehicle_no: formData.vehicle_no || '',
        
        subtotal: Number(formData.subtotal) || 0,
        discount: Number(formData.discount) || 0,
        taxable_amount: Number(formData.taxable_amount) || 0,
        cgst_total: Number(formData.cgst_total) || 0,
        sgst_total: Number(formData.sgst_total) || 0,
        igst_total: Number(formData.igst_total) || 0,
        gst_total: Number(formData.gst_total) || 0,
        grand_total: Number(formData.grand_total) || 0,
        
        paid_amount: Number(formData.paid_amount) || 0,
        payment_type: formData.payment_type || 'cash',
        bank_id: formData.bank_id ? Number(formData.bank_id) : null,
        
        notes: formData.notes || '',
        
        items: formData.items.map(item => ({
          item_id: Number(item.item_id),
          item_type: item.item_type || 'finished_good',
          quantity: Number(item.quantity) || 0,
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
      
      console.log('📤 Submitting invoice data:', submitData)
      
      const response = await axios.post('/api/sales-invoices', submitData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      toast.success(`Invoice ${response.data.invoice_no} created successfully`)
      router.push(`/sales-invoices/${response.data.id}`)
      
    } catch (error) {
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.')
      } else if (!error.response) {
        toast.error('Network error. Please check if backend is running.')
      } else {
        toast.error('Failed to create invoice: ' + (error.response?.data?.error || error.message))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Safe rendering of items table
  const renderItemsTable = () => {
    const itemsList = formData.items || []
    
    if (itemsList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-white/50">No items added. Click "Add Item" to start.</p>
        </div>
      )
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-white/60">Item</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-white/60">HSN</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-white/60">Qty</th>
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
            {itemsList.map((item, index) => (
              <tr key={item.id || index}>
                <td className="px-3 py-2">
                  {item?.item_name ? (
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
                <td className="px-3 py-2 text-white/70 text-sm">{item?.hsn_code || '-'}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item?.quantity || 0}
                    onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                    className="w-20 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                    min="0.01"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item?.rate || 0}
                    onChange={(e) => updateItemField(index, 'rate', e.target.value)}
                    className="w-24 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item?.discount || 0}
                    onChange={(e) => updateItemField(index, 'discount', e.target.value)}
                    className="w-16 px-2 py-1 bg-white/10 border border-white/20  rounded text-white text-sm text-right"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item?.gst_rate || selectedGstRate}
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
                  {(item?.taxable_value || 0).toFixed(2)}
                </td>
                {taxType === 'cgst_sgst' ? (
                  <>
                    <td className="px-3 py-2 text-right text-white/70 text-sm">
                      {(item?.cgst_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-white/70 text-sm">
                      {(item?.sgst_amount || 0).toFixed(2)}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-right text-white/70 text-sm">
                    {(item?.igst_amount || 0).toFixed(2)}
                  </td>
                )}
                <td className="px-3 py-2 text-right text-white font-semibold text-sm">
                  {(item?.total || 0).toFixed(2)}
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
                <DocumentTextIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">
                  NEW SALES INVOICE
                </h1>
              </div>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-white/10 border border-white/20  rounded-lg text-white hover:bg-white/20"
              >
                ← Back
              </button>
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
                      onChange={handleChallanChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
                      style={{ backgroundColor: '#1f2937', color: 'white' }}
                    >
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>-- Select Delivery Challan --</option>
                      {deliveryChallans.map(challan => {
                        const isBilled = challan.invoice_no && challan.invoice_no.trim() !== '';
                        let displayText = `${challan.challan_no} - ${challan.customer_name || challan.customer} (${challan.challan_date})`;
                        if (isBilled) {
                          displayText += ` (Billed: ${challan.invoice_no})`;
                        }
                        
                        return (
                          <option 
                            key={challan.id} 
                            value={challan.challan_no}
                            disabled={!!challan.invoice_no}
                            style={{ 
                              backgroundColor: challan.invoice_no ? '#f3f4f6' : 'white', 
                              color: challan.invoice_no ? '#9ca3af' : 'black',
                              fontStyle: challan.invoice_no ? 'italic' : 'normal'
                            }}
                          >
                            {displayText}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none" />
                  </div>
                  {formData.challan_no && (
                    <div className="mt-2 text-xs text-green-400">
                      ✓ Challan selected. Items will be auto-loaded.
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
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
              <p className="text-white/50 text-xs mt-2 italic">
                Invoice number will be auto-generated by the system
              </p>
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

              {renderItemsTable()}
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
                      const filtered = items.filter(item =>
                        item?.name?.toLowerCase().includes(term) ||
                        item?.code?.toLowerCase().includes(term) ||
                        item?.hsn_code?.includes(term)
                      )
                      setSearchResults(filtered)
                    }}
                  />
                  <div className="max-h-96 overflow-y-auto">
                    {(searchResults || []).map(item => (
                      <div
                        key={`${item.item_type}-${item.id}`}
                        onClick={() => selectItem(item)}
                        className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10"
                      >
                        <div className="flex justify-between">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="text-white/50 text-sm">{item.code}</span>
                        </div>
                        <div className="flex gap-4 text-sm text-white/70">
                          <span>HSN: {item.hsn_code}</span>
                          <span>GST: {item.gst_rate}%</span>
                          <span>Rate: ₹{item.item_type === 'finished_good' ? item.sales_rate : item.purchase_rate}</span>
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
                    <span className="text-white">₹{(formData.subtotal || 0).toFixed(2)}</span>
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
                    <span className="text-white font-semibold">₹{(formData.taxable_amount || 0).toFixed(2)}</span>
                  </div>
                  {taxType === 'cgst_sgst' ? (
                    <>
                      <div className="flex justify-between text-white/80">
                        <span>CGST:</span>
                        <span className="text-green-400">₹{(formData.cgst_total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>SGST:</span>
                        <span className="text-green-400">₹{(formData.sgst_total || 0).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-white/80">
                      <span>IGST:</span>
                      <span className="text-green-400">₹{(formData.igst_total || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/80 pt-2 border-t border-white/20">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="text-white font-bold text-xl">₹{(formData.grand_total || 0).toFixed(2)}</span>
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