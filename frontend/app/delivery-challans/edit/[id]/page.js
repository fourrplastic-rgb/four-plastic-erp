'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  CubeIcon,
  ScaleIcon,
  SaveIcon
} from '@heroicons/react/24/outline'

// API Base URL constant
const API_BASE_URL = '/api'

export default function EditDeliveryChallanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [id, setId] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [form, setForm] = useState({
    challan_no: '',
    challan_type: 'outward',
    challan_date: '',
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
    freight_charges: '',
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
    quantity: 1, 
    rate: '', 
    notes: ''
  })

  useEffect(() => {
    // Get ID from URL
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/')
      const lastSegment = pathSegments[pathSegments.length - 1]
      
      if (lastSegment && !isNaN(parseInt(lastSegment))) {
        setId(parseInt(lastSegment))
        fetchData(parseInt(lastSegment))
      } else {
        toast.error('Invalid challan ID')
        router.push('/delivery-challans')
      }
    }
  }, [])

  const fetchData = async (challanId) => {
    try {
      setLoading(true)
      console.log('Fetching data for challan ID:', challanId)
      
      // Fetch customers and items WITHOUT trailing slashes
      const [custRes, itemsRes, challanRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customers`),
        axios.get(`${API_BASE_URL}/items`),
        axios.get(`${API_BASE_URL}/delivery-challans/${challanId}`)
      ])
      
      console.log('Challan fetched:', challanRes.data)
      
      setCustomers(custRes.data)
      
      // Add compound_id to items
      const itemsWithIds = itemsRes.data.map((item, index) => ({
        ...item,
        compound_id: item.compound_id || `${item.item_type === 'raw_material' ? 'RM' : 'FG'}_${item.id || index}`
      }))
      setItems(itemsWithIds)
      
      // Set form data - KEEP THE ORIGINAL CHALLAN NUMBER (manual or auto)
      const data = challanRes.data
      setForm({
        challan_no: data.challan_no || '',  // ✅ Keep original number
        challan_type: data.challan_type || 'outward',
        challan_date: data.challan_date || '',
        customer_id: data.customer_id || '',
        bill_to_address: data.bill_to_address || '',
        bill_to_city: data.bill_to_city || '',
        bill_to_state: data.bill_to_state || '',
        bill_to_pincode: data.bill_to_pincode || '',
        bill_to_gst: data.bill_to_gst || '',
        ship_to_address: data.ship_to_address || '',
        ship_to_city: data.ship_to_city || '',
        ship_to_state: data.ship_to_state || '',
        ship_to_pincode: data.ship_to_pincode || '',
        ship_to_gst: data.ship_to_gst || '',
        vehicle_no: data.vehicle_no || '',
        transporter_name: data.transporter_name || '',
        freight_charges: data.freight_charges || '',
        notes: data.notes || '',
        items: data.items?.map(i => ({
          ...i,
          id: i.id || Date.now() + Math.random(),
          compound_id: i.item_type === 'raw_material' ? `RM_${i.item_id}` : `FG_${i.item_id}`,
          quantity: i.quantity,
          rate: i.rate
        })) || []
      })
      
      // Set selected customer
      if (data.customer_id) {
        const customer = custRes.data.find(c => c.id === data.customer_id)
        setSelectedCustomer(customer)
      }
      
      console.log('Loaded challan with number:', data.challan_no)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        toast.error(`Error ${error.response.status}: Failed to load challan`)
      } else {
        toast.error('Failed to load challan')
      }
      router.push('/delivery-challans')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomer = (e) => {
    const id = parseInt(e.target.value)
    const cust = customers.find(c => c.id === id)
    setSelectedCustomer(cust)
    
    if (cust) {
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
    }
  }

  const handleItem = (e) => {
    const compoundId = e.target.value
    if (!compoundId) {
      setCurrentItem({ 
        compound_id: '', item_id: '', item_type: '', item_name: '', 
        item_code: '', unit: 'NOS', quantity: 1, rate: '', notes: '' 
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
        quantity: 1,
        rate: '',  // ✅ Manual rate entry - leave blank for user to enter
        notes: ''
      })
    }
  }

  const addItem = () => {
    if (!currentItem.compound_id) return toast.error('Select item')
    if (!currentItem.quantity || currentItem.quantity <= 0) return toast.error('Valid quantity')
    // ✅ Rate is optional - can be 0
    if (!currentItem.item_name) return toast.error('Item name is missing')
    
    setForm(f => ({ 
      ...f, 
      items: [...f.items, { 
        ...currentItem, 
        id: Date.now() + Math.random(),
        quantity: Number(currentItem.quantity),
        rate: Number(currentItem.rate) || 0
      }] 
    }))
    
    setCurrentItem({ 
      compound_id: '', item_id: '', item_type: '', item_name: '', 
      item_code: '', unit: 'NOS', quantity: 1, rate: '', notes: '' 
    })
    toast.success('Item added')
  }

  const removeItem = (id) => {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }))
    toast.success('Item removed')
  }

  const updateItem = (index, field, value) => {
    const updated = [...form.items]
    updated[index][field] = field === 'quantity' || field === 'rate' ? Number(value) || 0 : value
    setForm(f => ({ ...f, items: updated }))
  }

  const totalQty = () => {
    return form.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  }

  const totalAmt = () => {
    return form.items.reduce((sum, i) => sum + ((Number(i.quantity) || 0) * (Number(i.rate) || 0)), 0)
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
    if (!form.challan_no) return toast.error('Challan number required')
    if (!form.customer_id) return toast.error('Select customer')
    if (!form.items.length) return toast.error('Add at least one item')
    
    setSaving(true)
    try {
      const mappedItems = form.items.map(i => ({
        item_id: Number(i.item_id),
        item_type: i.item_type || 'finished_good',
        item_name: i.item_name,
        item_code: i.item_code || '',
        unit: i.unit || 'NOS',
        quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0,
        amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
        notes: i.notes || ''
      }))
      
      const submitData = {
        challan_no: form.challan_no,  // ✅ Keep the existing manual number
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
      
      console.log('📤 Updating challan:', submitData.challan_no)
      const response = await axios.put(`${API_BASE_URL}/delivery-challans/${id}`, submitData)
      
      toast.success(`Delivery challan ${response.data.challan_no} updated successfully`)
      router.push(`/delivery-challans/${id}`)
    } catch (err) {
      console.error('Error updating:', err)
      if (err.response) {
        console.error('Response status:', err.response.status)
        console.error('Response data:', err.response.data)
        toast.error(err.response.data?.error || `Error ${err.response.status}: Failed to update`)
      } else {
        toast.error('Failed to update')
      }
    } finally {
      setSaving(false)
    }
  }

  const safeValue = (value) => {
    if (value === undefined || value === null) return ''
    return value
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="text-white/70 mt-4">Loading edit page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-lg text-white">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <TruckIcon className="h-8 w-8 text-pink-400" />
                <h1 className="text-2xl font-bold text-white">EDIT DELIVERY CHALLAN</h1>
              </div>
              <span className="text-white/50 bg-white/10 px-3 py-1 rounded-lg">#{safeValue(form.challan_no)}</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Challan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* ✅ Challan Number - Display only, NOT editable */}
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Challan Number</label>
                  <div className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono">
                    {safeValue(form.challan_no)}
                  </div>
                  <input type="hidden" name="challan_no" value={safeValue(form.challan_no)} />
                  <p className="text-white/40 text-xs mt-1">Challan number cannot be changed</p>
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
                  <label className="block text-white/60 text-sm mb-1">Customer</label>
                  <select
                    value={safeValue(form.customer_id)}
                    onChange={handleCustomer}
                    className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 ${form.challan_type === 'return' ? 'ring-2 ring-emerald-500/50' : ''}`}>
                <h2 className="text-lg font-semibold text-white mb-4">
                  {form.challan_type === 'return' ? 'Return From (Customer/Vendor)' : 'Bill To'}
                </h2>
                {selectedCustomer && (
                  <div className="mb-3 text-white/80">
                    <p className="font-semibold text-white">{selectedCustomer.name}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <input type="text" value={safeValue(form.bill_to_address)} onChange={e => setForm({...form, bill_to_address: e.target.value})} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Address" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={safeValue(form.bill_to_city)} onChange={e => setForm({...form, bill_to_city: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="City" />
                    <input type="text" value={safeValue(form.bill_to_state)} onChange={e => setForm({...form, bill_to_state: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="State" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={safeValue(form.bill_to_pincode)} onChange={e => setForm({...form, bill_to_pincode: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Pincode" />
                    <input type="text" value={safeValue(form.bill_to_gst)} onChange={e => setForm({...form, bill_to_gst: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="GST" />
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {form.challan_type === 'return' ? 'Ship To (Our Warehouse)' : 'Ship To'}
                  </h2>
                  <button type="button" onClick={copyShipTo} className="text-sm text-pink-400 hover:text-pink-300">Copy from Bill To</button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={safeValue(form.ship_to_address)} onChange={e => setForm({...form, ship_to_address: e.target.value})} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Address" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={safeValue(form.ship_to_city)} onChange={e => setForm({...form, ship_to_city: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="City" />
                    <input type="text" value={safeValue(form.ship_to_state)} onChange={e => setForm({...form, ship_to_state: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="State" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={safeValue(form.ship_to_pincode)} onChange={e => setForm({...form, ship_to_pincode: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Pincode" />
                    <input type="text" value={safeValue(form.ship_to_gst)} onChange={e => setForm({...form, ship_to_gst: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="GST" />
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                <select value={safeValue(currentItem.compound_id)} onChange={handleItem} className="md:col-span-2 px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white">
                  <option value="">Select Item</option>
                  {items.map((item, idx) => (
                    <option key={item.compound_id || idx} value={item.compound_id || ''}>
                      {item.name} ({item.unit}) - {item.item_type === 'raw_material' ? 'RM' : 'FG'}
                    </option>
                  ))}
                </select>
                <input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Qty" />
                <input type="number" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Rate" />
                <input type="text" value={currentItem.notes} onChange={e => setCurrentItem({...currentItem, notes: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Notes" />
                <button type="button" onClick={addItem} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">
                  <PlusIcon className="h-4 w-4 inline mr-1" /> Add
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/60">Item</th>
                      <th className="px-4 py-2 text-right text-white/60">Qty</th>
                      <th className="px-4 py-2 text-left text-white/60">Unit</th>
                      <th className="px-4 py-2 text-right text-white/60">Rate</th>
                      <th className="px-4 py-2 text-right text-white/60">Amount</th>
                      <th className="px-4 py-2 text-center text-white/60">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {form.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-white">{item.item_name}</td>
                        <td className="px-4 py-2">
                          <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-right" />
                        </td>
                        <td className="px-4 py-2 text-white">{item.unit}</td>
                        <td className="px-4 py-2">
                          <input type="number" value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-right" />
                        </td>
                        <td className="px-4 py-2 text-green-400 text-right font-semibold">
                          ₹{((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/5">
                    <tr>
                      <td className="px-4 py-2 text-white font-bold">Total</td>
                      <td className="px-4 py-2 text-white text-right font-bold">{totalQty().toFixed(2)}</td>
                      <td></td>
                      <td></td>
                      <td className="px-4 py-2 text-green-400 text-right font-bold">₹{totalAmt().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Transport */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Transport Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={safeValue(form.vehicle_no)} onChange={e => setForm({...form, vehicle_no: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Vehicle No" />
                <input type="text" value={safeValue(form.transporter_name)} onChange={e => setForm({...form, transporter_name: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Transporter Name" />
                <input type="number" value={form.freight_charges} onChange={e => setForm({...form, freight_charges: e.target.value})} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Freight Charges" />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <textarea value={safeValue(form.notes)} onChange={e => setForm({...form, notes: e.target.value})} rows="3" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" placeholder="Additional Notes" />
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
              <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}