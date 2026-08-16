'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PlusIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline'

export default function NewDeliveryChallan() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    challan_no: '',
    challan_type: 'outward',
    challan_date: new Date().toISOString().split('T')[0],
    customer_id: '',
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
    vehicle_no: '', 
    transporter_name: '', 
    freight_charges: 0,
    notes: '', 
    items: []
  })

  const [currentItem, setCurrentItem] = useState({
    compound_id: '', 
    item_id: '', 
    item_type: '', 
    item_name: '', 
    item_code: '', 
    unit: 'NOS',
    quantity: '1', 
    rate: '',
    notes: ''
  })

  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    checkAuth()
    fetchData()
    generateNumber()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchData = async () => {
    try {
      const [custRes, itemsRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/items')
      ])
      
      const itemsWithIds = itemsRes.data.map((item, index) => ({
        ...item,
        compound_id: item.compound_id || `${item.item_type === 'raw_material' ? 'RM' : 'FG'}_${item.id || index}`
      }))
      
      setCustomers(custRes.data)
      setItems(itemsWithIds)
      console.log('✅ Data loaded:', { customers: custRes.data.length, items: itemsWithIds.length })
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load data')
    }
  }

  // ✅ FIXED: Handle both 'challan_no' and 'challanNo' formats
  const generateNumber = async () => {
    try {
      const res = await axios.get('/api/delivery-challans/next-number')
      // Use challan_no (with underscore) which the backend returns
      const challanNumber = res.data.challan_no || res.data.challanNo
      if (challanNumber) {
        setForm(f => ({ ...f, challan_no: challanNumber }))
        console.log('✅ Auto-generated challan number:', challanNumber)
      } else {
        throw new Error('No challan number received')
      }
    } catch (error) {
      console.error('Error generating number:', error)
      // Fallback number
      const d = new Date()
      const year = d.getFullYear().toString().slice(-2)
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const day = d.getDate().toString().padStart(2, '0')
      const num = `DC${year}${month}${day}001`
      setForm(f => ({ ...f, challan_no: num }))
      console.log('⚠️ Using fallback number:', num)
    }
  }

  const handleCustomer = (e) => {
    const value = e.target.value
    const id = value ? parseInt(value) : ''
    const cust = customers.find(c => c.id === id)
    setSelectedCustomer(cust || null)
    console.log('Customer selected:', cust?.name || 'None')
    
    if (cust && id) {
      setForm(f => ({
        ...f, 
        customer_id: id,
        bill_to_address: cust.address || '',
        bill_to_city: cust.city || '',
        bill_to_state: cust.state || '',
        bill_to_pincode: cust.pincode || '',
        bill_to_gst: cust.gst || '',
        ship_to_address: cust.address || '',
        ship_to_city: cust.city || '',
        ship_to_state: cust.state || '',
        ship_to_pincode: cust.pincode || '',
        ship_to_gst: cust.gst || ''
      }))
    } else {
      setForm(f => ({
        ...f,
        customer_id: '',
        bill_to_address: '',
        bill_to_city: '',
        bill_to_state: '',
        bill_to_pincode: '',
        bill_to_gst: '',
        ship_to_address: '',
        ship_to_city: '',
        ship_to_state: '',
        ship_to_pincode: '',
        ship_to_gst: ''
      }))
    }
  }

  const handleItem = (e) => {
    const compoundId = e.target.value
    if (!compoundId) {
      setCurrentItem({ 
        compound_id: '', item_id: '', item_type: '', item_name: '', 
        item_code: '', unit: 'NOS', quantity: '1', rate: '', notes: '' 
      })
      return
    }
    
    const item = items.find(i => i.compound_id === compoundId)
    
    if (item) {
      const [type, id] = compoundId.split('_')
      
      setCurrentItem({
        compound_id: compoundId,
        item_id: parseInt(id),
        item_type: type === 'RM' ? 'raw_material' : 'finished_good',
        item_name: item.name,
        item_code: item.code || '',
        unit: item.unit || 'NOS',
        quantity: '1',
        rate: '',
        notes: ''
      })
      console.log('Item selected:', item.name)
    }
  }

  const addItem = () => {
    if (!currentItem.compound_id) {
      toast.error('Select item')
      return
    }
    
    const qty = parseFloat(currentItem.quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Valid quantity required')
      return
    }
    
    const rate = parseFloat(currentItem.rate) || 0
    
    if (!currentItem.item_name) {
      toast.error('Item name is missing')
      return
    }
    
    const newItem = {
      ...currentItem,
      id: Date.now(),
      quantity: qty,
      rate: rate
    }
    
    setForm(f => ({ 
      ...f, 
      items: [...f.items, newItem] 
    }))
    
    setCurrentItem({ 
      compound_id: '', item_id: '', item_type: '', item_name: '', 
      item_code: '', unit: 'NOS', quantity: '1', rate: '', notes: '' 
    })
    toast.success('Item added')
  }

  const removeItem = (id) => {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }))
    toast.success('Item removed')
  }

  const updateItem = (index, field, value) => {
    const updated = [...form.items]
    updated[index][field] = value
    setForm(f => ({ ...f, items: updated }))
  }

  const totalQty = () => {
    return form.items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0)
  }

  const totalAmt = () => {
    return form.items.reduce((sum, i) => sum + ((parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0)), 0)
  }

  const copyShipTo = () => {
    setForm(f => ({
      ...f,
      ship_to_address: f.bill_to_address || '',
      ship_to_city: f.bill_to_city || '',
      ship_to_state: f.bill_to_state || '',
      ship_to_pincode: f.bill_to_pincode || '',
      ship_to_gst: f.bill_to_gst || ''
    }))
    toast.success('Shipping address copied')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== CREATE CHALLAN BUTTON CLICKED ===')
    console.log('Challan No:', form.challan_no)
    console.log('Customer ID:', form.customer_id)
    console.log('Items count:', form.items.length)
    
    // Validation
    if (!form.challan_no) {
      console.log('❌ Missing challan number')
      toast.error('Challan number required')
      return
    }
    
    if (!form.customer_id) {
      console.log('❌ Missing customer')
      toast.error('Please select a customer')
      return
    }
    
    if (!form.items.length) {
      console.log('❌ No items')
      toast.error('Please add at least one item')
      return
    }
    
    console.log('✅ All validations passed')
    setLoading(true)
    
    try {
      const mappedItems = form.items.map(i => ({
        item_id: Number(i.item_id),
        item_type: i.item_type || 'finished_good',
        item_name: i.item_name,
        item_code: i.item_code || '',
        unit: i.unit || 'NOS',
        quantity: parseFloat(i.quantity) || 0,
        rate: parseFloat(i.rate) || 0,
        amount: (parseFloat(i.quantity) || 0) * (parseFloat(i.rate) || 0),
        notes: i.notes || ''
      }))
      
      const submitData = {
        challan_no: form.challan_no,
        challan_type: form.challan_type,
        challan_date: form.challan_date,
        customer_id: Number(form.customer_id),
        bill_to_address: form.bill_to_address || '',
        bill_to_city: form.bill_to_city || '',
        bill_to_state: form.bill_to_state || '',
        bill_to_pincode: form.bill_to_pincode || '',
        bill_to_gst: form.bill_to_gst || '',
        ship_to_address: form.ship_to_address || '',
        ship_to_city: form.ship_to_city || '',
        ship_to_state: form.ship_to_state || '',
        ship_to_pincode: form.ship_to_pincode || '',
        ship_to_gst: form.ship_to_gst || '',
        vehicle_no: form.vehicle_no || '',
        transport_mode: 'Road',
        transporter_name: form.transporter_name || '',
        freight_charges: Number(form.freight_charges) || 0,
        notes: form.notes || '',
        items: mappedItems
      }
      
      console.log('📤 Sending to backend:', submitData)
      
      const response = await axios.post('/api/delivery-challans', submitData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Success!', response.data)
      toast.success(`Delivery challan ${response.data.challan_no} created successfully`)
      router.push('/delivery-challans')
    } catch (err) {
      console.error('❌ Error:', err)
      console.error('Response:', err.response?.data)
      
      let errorMessage = 'Failed to create delivery challan'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const safeValue = (value) => {
    if (value === undefined || value === null) return ''
    return value
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <TruckIcon className="h-8 w-8 text-pink-400" />
              <h1 className="text-2xl font-bold text-white">NEW DELIVERY CHALLAN</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Challan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Auto-generated Challan Number - Read Only */}
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Challan No (Auto-generated)</label>
                  <div className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono">
                    {safeValue(form.challan_no) || 'Loading...'}
                  </div>
                  <input type="hidden" name="challan_no" value={safeValue(form.challan_no)} />
                  <p className="text-white/40 text-xs mt-1">Challan number is auto-generated</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Challan Type</label>
                  <div className="flex bg-gray-900/50 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setForm({...form, challan_type: 'outward'})}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        form.challan_type === 'outward'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Outward (Stock Out)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({...form, challan_type: 'return'})}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        form.challan_type === 'return'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Return (Stock In)
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={safeValue(form.challan_date)}
                    onChange={e => setForm({...form, challan_date: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-1">Customer <span className="text-red-400">*</span></label>
                  <select
                    value={safeValue(form.customer_id)}
                    onChange={handleCustomer}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={`cust-${c.id}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bill To / Ship To sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 ${form.challan_type === 'return' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                <h2 className="text-lg font-semibold text-white mb-4">
                  {form.challan_type === 'return' ? 'Return From (Customer/Vendor)' : 'Bill To'}
                </h2>
                {selectedCustomer && (
                  <div className="mb-3 text-white/80 text-sm p-2 bg-white/5 rounded-lg">
                    <p className="font-semibold text-white">{selectedCustomer.name}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={safeValue(form.bill_to_address)}
                    onChange={e => setForm({...form, bill_to_address: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={safeValue(form.bill_to_city)}
                      onChange={e => setForm({...form, bill_to_city: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={safeValue(form.bill_to_state)}
                      onChange={e => setForm({...form, bill_to_state: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={safeValue(form.bill_to_pincode)}
                      onChange={e => setForm({...form, bill_to_pincode: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="Pincode"
                    />
                    <input
                      type="text"
                      value={safeValue(form.bill_to_gst)}
                      onChange={e => setForm({...form, bill_to_gst: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="GST"
                    />
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {form.challan_type === 'return' ? 'Ship To (Our Warehouse)' : 'Ship To'}
                  </h2>
                  <button
                    type="button"
                    onClick={copyShipTo}
                    className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    Copy from Bill To
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={safeValue(form.ship_to_address)}
                    onChange={e => setForm({...form, ship_to_address: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="Address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={safeValue(form.ship_to_city)}
                      onChange={e => setForm({...form, ship_to_city: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={safeValue(form.ship_to_state)}
                      onChange={e => setForm({...form, ship_to_state: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={safeValue(form.ship_to_pincode)}
                      onChange={e => setForm({...form, ship_to_pincode: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="Pincode"
                    />
                    <input
                      type="text"
                      value={safeValue(form.ship_to_gst)}
                      onChange={e => setForm({...form, ship_to_gst: e.target.value})}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder="GST"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items section */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                <select
                  value={safeValue(currentItem.compound_id)}
                  onChange={handleItem}
                  className="md:col-span-2 px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                >
                  <option value="">Select Item</option>
                  {items.map((item, index) => {
                    const uniqueKey = item.compound_id || `item-${item.item_type || 'unknown'}-${item.id || index}-${index}`
                    return (
                      <option 
                        key={uniqueKey}
                        value={item.compound_id || ''}
                      >
                        {item.name} ({item.unit || 'NOS'})
                      </option>
                    )
                  })}
                </select>
                <input
                  type="number"
                  value={safeValue(currentItem.quantity)}
                  onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Qty"
                  step="0.01"
                />
                <input
                  type="number"
                  value={safeValue(currentItem.rate)}
                  onChange={e => setCurrentItem({...currentItem, rate: e.target.value})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Rate"
                  step="0.01"
                />
                <input
                  type="text"
                  value={safeValue(currentItem.notes)}
                  onChange={e => setCurrentItem({...currentItem, notes: e.target.value})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Notes"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <PlusIcon className="h-4 w-4 inline mr-1" /> Add
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60">Item</th>
                      <th className="px-4 py-2 text-right text-white/60">Qty</th>
                      <th className="px-4 py-2 text-right text-white/60">Rate</th>
                      <th className="px-4 py-2 text-right text-white/60">Amount</th>
                      <th className="px-4 py-2 text-center text-white/60">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {form.items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-white/40">
                          No items added. Select an item and click Add.
                        </td>
                      </tr>
                    ) : (
                      form.items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-white">{item.item_name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={safeValue(item.quantity)}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-right"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={safeValue(item.rate)}
                              onChange={(e) => updateItem(index, 'rate', e.target.value)}
                              className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-right"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-2 text-green-400 text-right font-semibold">
                            ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {form.items.length > 0 && (
                    <tfoot className="bg-white/5">
                      <tr>
                        <td className="px-4 py-2 text-white font-bold">Total</td>
                        <td className="px-4 py-2 text-white text-right font-bold">
                          {totalQty().toFixed(2)}
                        </td>
                        <td></td>
                        <td className="px-4 py-2 text-green-400 text-right font-bold">
                          ₹{totalAmt().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Transport Details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Transport Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={safeValue(form.vehicle_no)}
                  onChange={e => setForm({...form, vehicle_no: e.target.value})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Vehicle No"
                />
                <input
                  type="text"
                  value={safeValue(form.transporter_name)}
                  onChange={e => setForm({...form, transporter_name: e.target.value})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Transporter Name"
                />
                <input
                  type="number"
                  value={form.freight_charges}
                  onChange={e => setForm({...form, freight_charges: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Freight Charges"
                  step="0.01"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <textarea
                value={safeValue(form.notes)}
                onChange={e => setForm({...form, notes: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Additional Notes"
              />
            </div>

            {/* Signature Info */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 flex items-center gap-4 border-l-4 border-l-green-500">
              <div className="p-3 bg-green-500/20 rounded-full">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Digital Signature Enabled</h3>
                <p className="text-white/60 text-sm">A DSC signature block will automatically be attached to the final printed Challan.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Challan'
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}