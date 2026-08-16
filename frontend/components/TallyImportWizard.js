'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  ArrowPathIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function TallyImportWizard({ isOpen, onClose, onImportSuccess, defaultIsSales = true, company = 'four_plastic', onLoadInvoiceData }) {
  const router = useRouter()
  
  // Wizard steps: 1 = Upload, 2 = Review & Map
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Master lists
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [finishedGoods, setFinishedGoods] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [banks, setBanks] = useState([])

  // Invoice Fields
  const [isSales, setIsSales] = useState(defaultIsSales)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [partyName, setPartyName] = useState('')
  const [taxType, setTaxType] = useState('cgst_sgst')
  const [transportMode, setTransportMode] = useState('Road')
  const [vehicleNo, setVehicleNo] = useState('')
  const [placeOfSupply, setPlaceOfSupply] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  
  // Bill to / Ship to Details
  const [billToAddress, setBillToAddress] = useState('')
  const [billToCity, setBillToCity] = useState('')
  const [billToState, setBillToState] = useState('')
  const [billToPincode, setBillToPincode] = useState('')
  const [billToGst, setBillToGst] = useState('')
  const [shipToAddress, setShipToAddress] = useState('')
  const [shipToCity, setShipToCity] = useState('')
  const [shipToState, setShipToState] = useState('')
  const [shipToPincode, setShipToPincode] = useState('')
  const [shipToGst, setShipToGst] = useState('')

  // Attachment Details
  const [attachmentPath, setAttachmentPath] = useState('')

  // Invoice Items
  const [mappedItems, setMappedItems] = useState([])

  // Search filter for dropdowns in grid
  const [itemSearchQuery, setItemSearchQuery] = useState({})

  // Load master data on mount
  useEffect(() => {
    if (isOpen) {
      fetchMasterData()
      setIsSales(defaultIsSales)
      setStep(1)
      setFile(null)
      setMappedItems([])
      setAttachmentPath('')
    }
  }, [isOpen, defaultIsSales])

  const fetchMasterData = async () => {
    try {
      const [custRes, vendRes, itemsRes, bankRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/vendors'),
        axios.get('/api/items'),
        axios.get('/api/banks').catch(() => ({ data: [] }))
      ])

      setCustomers(custRes.data || [])
      setVendors(vendRes.data || [])
      
      const allItems = itemsRes.data || []
      
      // Filter items into FG and RM
      const fgs = allItems.filter(item => 
        item.item_type === 'finished_good' || item.type === 'finished_good' || item.category === 'Finished Good'
      )
      const rms = allItems.filter(item => 
        item.item_type === 'raw_material' || item.type === 'raw_material' || item.category === 'Raw Material'
      )
      
      setFinishedGoods(fgs.length ? fgs : allItems)
      setRawMaterials(rms.length ? rms : allItems)
      setBanks(bankRes.data || [])
    } catch (error) {
      console.error('Error loading master data:', error)
      toast.error('Failed to preload master data')
    }
  }

  // Handle invoice type toggle (Sales vs Purchase)
  const handleTypeToggle = (salesFlag) => {
    setIsSales(salesFlag)
    // Clear and reset mappings as lists change
    setSelectedPartyId('')
    setBillToAddress('')
    setBillToCity('')
    setBillToState('')
    setBillToPincode('')
    setBillToGst('')
    setShipToAddress('')
    setShipToCity('')
    setShipToState('')
    setShipToPincode('')
    setShipToGst('')
    
    // Convert current mapped item list to use default matched ids from new list
    const dbItemsList = salesFlag ? finishedGoods : rawMaterials
    const updated = mappedItems.map(item => {
      // Find best match in new item list based on name
      const parsedName = (item.parsed_name || item.item_name || '').toUpperCase()
      let bestId = ''
      let bestName = ''
      let hsn = item.hsn_code || ''
      let gst = item.gst_rate || 18

      for (const dbItem of dbItemsList) {
        if (dbItem.name.toUpperCase() === parsedName || parsedName.includes(dbItem.name.toUpperCase()) || dbItem.name.toUpperCase().includes(parsedName)) {
          bestId = dbItem.id
          bestName = dbItem.name
          hsn = dbItem.hsn_code || hsn
          gst = dbItem.gst_rate || gst
          break
        }
      }
      if (!bestId && dbItemsList.length > 0) {
        bestId = dbItemsList[0].id
        bestName = dbItemsList[0].name
        hsn = dbItemsList[0].hsn_code || hsn
        gst = dbItemsList[0].gst_rate || gst
      }

      return {
        ...item,
        matched_item_id: bestId,
        matched_item_name: bestName,
        item_type: salesFlag ? 'finished_good' : 'raw_material',
        hsn_code: hsn,
        gst_rate: gst
      }
    })
    setMappedItems(updated)
  }

  // Handle party (Customer/Vendor) selection change
  const handlePartyChange = (partyId) => {
    if (!partyId) {
      setSelectedPartyId('')
      return
    }
    const pId = parseInt(partyId)
    setSelectedPartyId(pId)
    
    if (isSales) {
      const customer = customers.find(c => c.id === pId)
      if (customer) {
        setPartyName(customer.name)
        setBillToAddress(customer.address || '')
        setBillToCity(customer.city || '')
        setBillToState(customer.state || '')
        setBillToPincode(customer.pincode || '')
        setBillToGst(customer.gst || '')
        
        setShipToAddress(customer.address || '')
        setShipToCity(customer.city || '')
        setShipToState(customer.state || '')
        setShipToPincode(customer.pincode || '')
        setShipToGst(customer.gst || '')
        
        setPlaceOfSupply(customer.state || '')
        
        if (customer.state === 'Maharashtra') {
          setTaxType('cgst_sgst')
        } else {
          setTaxType('igst')
        }
      }
    } else {
      const vendor = vendors.find(v => v.id === pId)
      if (vendor) {
        setPartyName(vendor.name)
        // Bill to is our company address
        setBillToAddress('90 FEET ROAD, WIRE GALI, KHADI NO.3')
        setBillToCity('Mumbai')
        setBillToState('Maharashtra')
        setBillToPincode('400078')
        setBillToGst('27ABTPV9432F1ZX')
        
        setShipToAddress(vendor.address || '')
        setShipToCity(vendor.city || '')
        setShipToState(vendor.state || '')
        setShipToPincode(vendor.pincode || '')
        setShipToGst(vendor.gst || '')
        
        setPlaceOfSupply(vendor.state || '')
        
        if (vendor.state === 'Maharashtra') {
          setTaxType('cgst_sgst')
        } else {
          setTaxType('igst')
        }
      }
    }
  }

  // Recalculate row amounts when values change
  const calculateRow = (qty, rate, disc, gst, typeOfTax) => {
    const quantity = parseFloat(qty) || 0
    const rateVal = parseFloat(rate) || 0
    const discPercent = parseFloat(disc) || 0
    const gstPercent = parseFloat(gst) || 0

    const amount = quantity * rateVal
    const discountAmount = amount * (discPercent / 100)
    const taxableValue = amount - discountAmount

    let cgstAmount = 0
    let sgstAmount = 0
    let igstAmount = 0

    if (typeOfTax === 'cgst_sgst') {
      cgstAmount = taxableValue * (gstPercent / 2) / 100
      sgstAmount = taxableValue * (gstPercent / 2) / 100
    } else {
      igstAmount = taxableValue * gstPercent / 100
    }

    const rowTotal = taxableValue + cgstAmount + sgstAmount + igstAmount

    return {
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      total: rowTotal
    }
  }

  const handleRowChange = (index, field, value) => {
    const updated = [...mappedItems]
    const row = { ...updated[index], [field]: value }

    // If item maps changes, update item_type, matched name, and default gst
    if (field === 'matched_item_id') {
      const dbItemsList = isSales ? finishedGoods : rawMaterials
      const matched = dbItemsList.find(i => i.id === parseInt(value))
      if (matched) {
        row.matched_item_name = matched.name
        row.hsn_code = matched.hsn_code || row.hsn_code
        row.gst_rate = matched.gst_rate || row.gst_rate
      }
    }

    // Recalculate totals
    const calcs = calculateRow(row.quantity, row.rate, row.discount || 0, row.gst_rate, taxType)
    
    updated[index] = {
      ...row,
      ...calcs
    }
    setMappedItems(updated)
  }

  // Remove row
  const removeRow = (index) => {
    setMappedItems(mappedItems.filter((_, i) => i !== index))
  }

  // Add empty row
  const addNewRow = () => {
    const dbItemsList = isSales ? finishedGoods : rawMaterials
    const defaultItem = dbItemsList[0] || { id: '', name: '', hsn_code: '', gst_rate: 18 }
    
    const row = {
      parsed_name: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      gst_rate: defaultItem.gst_rate || 18,
      matched_item_id: defaultItem.id || '',
      matched_item_name: defaultItem.name || '',
      item_type: isSales ? 'finished_good' : 'raw_material',
      hsn_code: defaultItem.hsn_code || '',
      lot_no: '',
      received_quantity: 1
    }

    const calcs = calculateRow(row.quantity, row.rate, 0, row.gst_rate, taxType)
    setMappedItems([...mappedItems, { ...row, ...calcs }])
  }

  // Recalculate all rows when global taxType changes
  useEffect(() => {
    const updated = mappedItems.map(item => {
      const calcs = calculateRow(item.quantity, item.rate, item.discount || 0, item.gst_rate, taxType)
      return {
        ...item,
        ...calcs
      }
    })
    setMappedItems(updated)
  }, [taxType])

  // Get calculated invoice summary totals
  const getTotals = () => {
    const subtotal = mappedItems.reduce((sum, item) => sum + (parseFloat(item.taxable_value) || 0), 0)
    
    const cgstTotal = mappedItems.reduce((sum, item) => sum + (parseFloat(item.cgst_amount) || 0), 0)
    const sgstTotal = mappedItems.reduce((sum, item) => sum + (parseFloat(item.sgst_amount) || 0), 0)
    const igstTotal = mappedItems.reduce((sum, item) => sum + (parseFloat(item.igst_amount) || 0), 0)
    
    const gstTotal = cgstTotal + sgstTotal + igstTotal
    
    const discountAmount = subtotal * (parseFloat(discount) || 0) / 100
    const taxableAmount = subtotal - discountAmount
    const grandTotal = taxableAmount + gstTotal

    return {
      subtotal,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      gstTotal,
      grandTotal
    }
  }

  const totals = getTotals()

  // Dropzone drag-and-drop triggers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true)
    } else if (e.type === 'dragleave') {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        uploadAndParsePDF(droppedFile)
      } else {
        toast.error('Only PDF files are supported')
      }
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      uploadAndParsePDF(selected)
    }
  }

  // API Call to Flask backend parser
  const uploadAndParsePDF = async (pdfFile) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', pdfFile)

    const toastId = toast.loading('Uploading and parsing Tally invoice...')

    try {
      const response = await axios.post('/api/upload/parse-tally-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { parsed_data, matched_party_id, matched_items } = response.data

      setIsSales(parsed_data.is_sales)
      setInvoiceNo(parsed_data.invoice_no || '')
      setInvoiceDate(parsed_data.invoice_date || '')
      setAttachmentPath(parsed_data.attachment_path || '')
      setPartyName(parsed_data.party_name || '')
      
      // Auto-populate based on matches
      setMappedItems((matched_items || []).map(item => {
        const calcs = calculateRow(
          item.quantity, 
          item.rate, 
          0, 
          item.gst_rate || 18, 
          parsed_data.is_sales ? 'cgst_sgst' : 'igst' // Default guess
        )
        return {
          parsed_name: item.parsed_name,
          quantity: item.quantity,
          rate: item.rate,
          discount: 0,
          gst_rate: item.gst_rate || 18,
          matched_item_id: item.matched_item_id || '',
          matched_item_name: item.matched_item_name || '',
          item_type: parsed_data.is_sales ? 'finished_good' : 'raw_material',
          hsn_code: item.hsn_code || '',
          lot_no: '',
          received_quantity: item.quantity,
          ...calcs
        }
      }))

      // Resolve billing details
      if (parsed_data.is_sales) {
        const custRes = await axios.get('/api/customers')
        const allCusts = custRes.data || []
        setCustomers(allCusts)
        
        const matchedCust = allCusts.find(c => c.id === matched_party_id)
        if (matchedCust) {
          setSelectedPartyId(matchedCust.id)
          setPartyName(matchedCust.name)
          setBillToAddress(matchedCust.address || '')
          setBillToCity(matchedCust.city || '')
          setBillToState(matchedCust.state || '')
          setBillToPincode(matchedCust.pincode || '')
          setBillToGst(matchedCust.gst || '')
          
          setShipToAddress(matchedCust.address || '')
          setShipToCity(matchedCust.city || '')
          setShipToState(matchedCust.state || '')
          setShipToPincode(matchedCust.pincode || '')
          setShipToGst(matchedCust.gst || '')
          
          setPlaceOfSupply(matchedCust.state || '')
          setTaxType(matchedCust.state === 'Maharashtra' ? 'cgst_sgst' : 'igst')
        } else {
          setSelectedPartyId('')
          setBillToGst(parsed_data.party_gst || '')
          setShipToGst(parsed_data.party_gst || '')
        }
      } else {
        const vendRes = await axios.get('/api/vendors')
        const allVends = vendRes.data || []
        setVendors(allVends)

        const matchedVend = allVends.find(v => v.id === matched_party_id)
        if (matchedVend) {
          setSelectedPartyId(matchedVend.id)
          setPartyName(matchedVend.name)
          
          // Bill To (Our Company Details)
          setBillToAddress('90 FEET ROAD, WIRE GALI, KHADI NO.3')
          setBillToCity('Mumbai')
          setBillToState('Maharashtra')
          setBillToPincode('400078')
          setBillToGst('27ABTPV9432F1ZX')
          
          // Ship To (Vendor Details)
          setShipToAddress(matchedVend.address || '')
          setShipToCity(matchedVend.city || '')
          setShipToState(matchedVend.state || '')
          setShipToPincode(matchedVend.pincode || '')
          setShipToGst(matchedVend.gst || '')
          
          setPlaceOfSupply(matchedVend.state || '')
          setTaxType(matchedVend.state === 'Maharashtra' ? 'cgst_sgst' : 'igst')
        } else {
          setSelectedPartyId('')
          
          // Bill To (Our Company Details)
          setBillToAddress('90 FEET ROAD, WIRE GALI, KHADI NO.3')
          setBillToCity('Mumbai')
          setBillToState('Maharashtra')
          setBillToPincode('400078')
          setBillToGst('27ABTPV9432F1ZX')
          
          // Ship To (Vendor Details)
          setShipToGst(parsed_data.party_gst || '')
        }
      }

      toast.success('Invoice details parsed successfully!', { id: toastId })
      setStep(2) // Move to review step
    } catch (error) {
      console.error('❌ Parse error:', error)
      toast.error(error.response?.data?.error || 'Failed to parse PDF', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Handle final submission to save invoice in DB
  const handleImportSubmit = async (e) => {
    e.preventDefault()

    if (!selectedPartyId) {
      toast.error(isSales ? 'Please select a customer' : 'Please select a vendor')
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (mappedItems.length === 0) {
      toast.error('Please add at least one item row')
      return
    }

    const invalidRow = mappedItems.find(item => !item.matched_item_id)
    if (invalidRow) {
      toast.error(`Please map item "${invalidRow.parsed_name || 'New Row'}" to a database item`)
      return
    }

    setLoading(true)
    const submitToastId = toast.loading('Saving imported invoice...')

    try {
      const payload = {
        invoice_no: invoiceNo,
        customer_id: isSales ? Number(selectedPartyId) : undefined,
        vendor_id: !isSales ? Number(selectedPartyId) : undefined,
        invoice_date: invoiceDate,
        bill_to_address: billToAddress,
        bill_to_city: billToCity,
        bill_to_state: billToState,
        bill_to_pincode: billToPincode,
        bill_to_gst: billToGst,
        
        ship_to_address: shipToAddress,
        ship_to_city: shipToCity,
        ship_to_state: shipToState,
        ship_to_pincode: shipToPincode,
        ship_to_gst: shipToGst,
        
        place_of_supply: placeOfSupply,
        transport_mode: transportMode,
        vehicle_no: vehicleNo,
        discount: Number(discount) || 0,
        subtotal: Number(totals.subtotal) || 0,
        taxable_amount: Number(totals.taxableAmount) || 0,
        cgst_total: Number(totals.cgstTotal) || 0,
        sgst_total: Number(totals.sgstTotal) || 0,
        igst_total: Number(totals.igstTotal) || 0,
        gst_total: Number(totals.gstTotal) || 0,
        grand_total: Number(totals.grandTotal) || 0,
        notes: notes || '',
        paid_amount: isSales ? 0 : Number(totals.grandTotal), // Default paid for purchases to simplify lot monitoring, 0 for sales
        payment_type: 'cash',
        bank_id: null,
        attachment_path: attachmentPath, // Direct path mapping
        items: mappedItems.map(item => ({
          item_id: Number(item.matched_item_id),
          item_type: item.item_type || (isSales ? 'finished_good' : 'raw_material'),
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          discount: Number(item.discount) || 0,
          taxable_value: Number(item.taxable_value) || 0,
          gst_rate: Number(item.gst_rate) || 0,
          cgst_rate: taxType === 'cgst_sgst' ? Number(item.gst_rate) / 2 : 0,
          sgst_rate: taxType === 'cgst_sgst' ? Number(item.gst_rate) / 2 : 0,
          igst_rate: taxType === 'igst' ? Number(item.gst_rate) : 0,
          cgst_amount: Number(item.cgst_amount) || 0,
          sgst_amount: Number(item.sgst_amount) || 0,
          igst_amount: Number(item.igst_amount) || 0,
          total: Number(item.total) || 0,
          // Purchase specific fields
          lot_no: !isSales ? (item.lot_no || '') : undefined,
          received_quantity: !isSales ? (Number(item.received_quantity) || Number(item.quantity)) : undefined
        }))
      }

      let response
      if (isSales) {
        response = await axios.post('/api/sales-invoices', payload)
      } else {
        response = await axios.post('/api/purchase-invoices/', payload)
      }

      const createdInvoiceId = response.data.id

      // Link PDF attachment path explicitly
      const pathType = isSales ? 'sales-invoices' : 'purchase-invoices'
      await axios.put(`/api/${pathType}/${createdInvoiceId}/attachment`, {
        attachment_path: attachmentPath
      })

      toast.success('Invoice imported and linked successfully!', { id: submitToastId })
      onClose()
      
      if (onImportSuccess) {
        onImportSuccess(createdInvoiceId, isSales)
      } else {
        router.push(`/${isSales ? 'sales-invoices' : 'purchase-invoices'}/${createdInvoiceId}`)
      }

    } catch (error) {
      console.error('❌ Save error:', error)
      toast.error(error.response?.data?.error || 'Failed to save import details', { id: submitToastId })
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const handleDirectPrint = () => {
    const resolvedPartyName = partyName || (partiesList.find(p => p.id === Number(selectedPartyId))?.name) || ''

    if (!resolvedPartyName) {
      toast.error(isSales ? 'Please enter or select a customer name first' : 'Please enter or select a vendor name first')
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (mappedItems.length === 0) {
      toast.error('Please add at least one item row')
      return
    }

    const isFourPlastic = company === 'four_plastic'
    const companyInfo = {
      name: isFourPlastic ? "FOUR (R) PLASTIC" : "RAJ PLASTIC",
      address: isFourPlastic 
        ? "WIRE GALI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST, SAKINAKA, MUMBAI - 400072." 
        : "3 NO. KHADI, SAKINAKA, MUMBAI, MAHARASHTRA - 400072",
      phone: isFourPlastic ? "9867976679" : "+91 9876543210",
      email: isFourPlastic ? "fourrplastic@gmali.com" : "contact@rajplastic.com",
      gst: isFourPlastic ? "27ABTPV9432F1ZX" : "27DEFAULTGST"
    }

    const tempInvoice = {
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      attachment_path: attachmentPath,
      challan_no: '',
      payment_type: 'cash',
      transport_mode: transportMode,
      is_sales: isSales,
      customer_name: isSales ? resolvedPartyName : '',
      vendor_name: !isSales ? resolvedPartyName : '',
      vendor_gst: !isSales ? billToGst : '',
      bill_to_address: billToAddress,
      bill_to_city: billToCity,
      bill_to_state: billToState,
      bill_to_pincode: billToPincode,
      bill_to_gst: billToGst,
      ship_to_address: shipToAddress,
      ship_to_city: shipToCity,
      ship_to_state: shipToState,
      ship_to_pincode: shipToPincode,
      ship_to_gst: shipToGst,
      subtotal: totals.subtotal,
      taxable_amount: totals.taxableAmount,
      cgst_total: totals.cgstTotal,
      sgst_total: totals.sgstTotal,
      igst_total: totals.igstTotal,
      gst_total: totals.gstTotal,
      grand_total: totals.grandTotal,
      items: mappedItems.map(item => ({
        item_name: item.matched_item_name || item.parsed_name || 'Item',
        discount: Number(item.discount) || 0,
        hsn_code: item.hsn_code || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'KG',
        rate: Number(item.rate) || 0,
        taxable_value: Number(item.taxable_value) || 0,
        total: Number(item.total) || 0,
        cgst_rate: taxType === 'cgst_sgst' ? Number(item.gst_rate) / 2 : 0,
        sgst_rate: taxType === 'cgst_sgst' ? Number(item.gst_rate) / 2 : 0,
        igst_rate: taxType === 'igst' ? Number(item.gst_rate) : 0,
        gst_rate: Number(item.gst_rate) || 0,
        cgst_amount: Number(item.cgst_amount) || 0,
        sgst_amount: Number(item.sgst_amount) || 0,
        igst_amount: Number(item.igst_amount) || 0
      }))
    }

    if (onLoadInvoiceData) {
      onLoadInvoiceData(tempInvoice)
      return
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const logoUrl = window.location.origin + (isFourPlastic ? '/logo_four_plastic.png' : '/logo_raj_plastic.png');
    const primaryColor = isFourPlastic ? '#004aad' : '#1b8a5a';
    const secondaryColor = isFourPlastic ? '#c8102e' : '#f57c00';

    const ourCompanyName = companyInfo.name;
    const ourCompanyAddress = companyInfo.address;
    const ourCompanyGST = companyInfo.gst;
    const ourCompanyState = "Maharashtra";
    const ourCompanyStateCode = "27";

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

      buyerName = tempInvoice.customer_name || "";
      buyerAddress = `${tempInvoice.bill_to_address || ''}, ${tempInvoice.bill_to_city || ''}, ${tempInvoice.bill_to_state || ''} ${tempInvoice.bill_to_pincode || ''}`.trim();
      buyerGST = tempInvoice.bill_to_gst || 'URD';
      buyerState = tempInvoice.bill_to_state || "";

      consigneeName = tempInvoice.customer_name || "";
      consigneeAddress = `${tempInvoice.ship_to_address || tempInvoice.bill_to_address || ''}, ${tempInvoice.ship_to_city || tempInvoice.bill_to_city || ''}, ${tempInvoice.ship_to_state || tempInvoice.bill_to_state || ''} ${tempInvoice.ship_to_pincode || tempInvoice.bill_to_pincode || ''}`.trim();
      consigneeGST = tempInvoice.ship_to_gst || tempInvoice.bill_to_gst || 'URD';
      consigneeState = tempInvoice.ship_to_state || tempInvoice.bill_to_state || "";
    } else {
      sellerName = tempInvoice.vendor_name || "";
      sellerAddress = `${tempInvoice.ship_to_address || ''}, ${tempInvoice.ship_to_city || ''}, ${tempInvoice.ship_to_state || ''} ${tempInvoice.ship_to_pincode || ''}`.trim();
      sellerGST = tempInvoice.vendor_gst || 'URD';
      sellerState = tempInvoice.ship_to_state || "";

      buyerName = ourCompanyName;
      buyerAddress = ourCompanyAddress;
      buyerGST = ourCompanyGST;
      buyerState = ourCompanyState;

      consigneeName = ourCompanyName;
      consigneeAddress = ourCompanyAddress;
      consigneeGST = ourCompanyGST;
      consigneeState = ourCompanyState;
    }

    const isIGST = tempInvoice.igst_total > 0;
    const cgstRate = tempInvoice.items?.[0]?.cgst_rate || (tempInvoice.items?.[0]?.gst_rate / 2) || 9;
    const sgstRate = tempInvoice.items?.[0]?.sgst_rate || (tempInvoice.items?.[0]?.gst_rate / 2) || 9;
    const igstRate = tempInvoice.items?.[0]?.igst_rate || tempInvoice.items?.[0]?.gst_rate || 18;

    const formattedPhone = companyInfo.phone;
    const formattedEmail = companyInfo.email;

    // Helper functions for formatting
    const localFormatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount)
    }

    const localFormatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const localNumberToWords = (num) => {
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

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoiceTitle} - ${tempInvoice.invoice_no}</title>
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
            font-size: 8.5px;
            color: #000;
            font-weight: 500;
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
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
            width: 320px;
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
                      <span>Mob : ${formattedPhone}</span>
                    </div>
                    <div class="contact-item">
                      <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span>Email : ${formattedEmail}</span>
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
                    <div class="metadata-value">: ${tempInvoice.invoice_no || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Dated</div>
                    <div class="metadata-value">: ${localFormatDate(tempInvoice.invoice_date) || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Delivery Note</div>
                    <div class="metadata-value">: ${tempInvoice.challan_no || '-'}</div>
                  </div>
                  <div class="metadata-row">
                    <div class="metadata-label">Mode/Terms of Payment</div>
                    <div class="metadata-value">: ${tempInvoice.payment_type || '-'}</div>
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
                    <div class="metadata-value">: ${tempInvoice.transport_mode || '-'}</div>
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
                  ${tempInvoice.items?.map((item, index) => `
                    <tr class="item-row">
                      <td class="text-center">${index + 1}</td>
                      <td>
                        <div class="font-bold">${item.item_name}</div>
                        ${item.discount > 0 ? `<div style="font-size: 8px; color: #555;">Less: Discount ${item.discount}%</div>` : ''}
                      </td>
                      <td class="text-center">${item.hsn_code || ''}</td>
                      <td class="text-right font-bold">${item.quantity} ${item.unit || 'KG'}</td>
                      <td class="text-right">${localFormatCurrency(item.rate).replace('₹', '')}</td>
                      <td class="text-center">${item.unit || 'KG'}</td>
                      <td class="text-right font-bold">${localFormatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                    </tr>
                  `).join('')}
                  
                  <!-- GST Output Rows inside table body -->
                  ${isIGST ? `
                    <tr class="tax-row">
                      <td></td>
                      <td class="text-right">Output IGST @ ${igstRate}%</td>
                      <td></td><td></td><td></td>
                      <td class="text-center">${igstRate} %</td>
                      <td class="text-right">${localFormatCurrency(tempInvoice.igst_total).replace('₹', '')}</td>
                    </tr>
                  ` : `
                    ${(tempInvoice.cgst_total > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right">Output CGST @ ${cgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${cgstRate} %</td>
                        <td class="text-right">${localFormatCurrency(tempInvoice.cgst_total).replace('₹', '')}</td>
                      </tr>
                    ` : ''}
                    ${(tempInvoice.sgst_total > 0) ? `
                      <tr class="tax-row">
                        <td></td>
                        <td class="text-right">Output SGST @ ${sgstRate}%</td>
                        <td></td><td></td><td></td>
                        <td class="text-center">${sgstRate} %</td>
                        <td class="text-right">${localFormatCurrency(tempInvoice.sgst_total).replace('₹', '')}</td>
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
                <div class="words-value">INR ${localNumberToWords(Math.round(tempInvoice.grand_total))}</div>
              </div>
              <div class="totals-value-box">
                <span>Total</span>
                <span>${localFormatCurrency(tempInvoice.grand_total)}</span>
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
                  ${tempInvoice.items?.map(item => `
                    <tr>
                      <td class="text-center">${item.hsn_code || ''}</td>
                      <td>${localFormatCurrency(item.taxable_value || item.total).replace('₹', '')}</td>
                      ${isIGST ? `
                        <td class="text-center">${item.igst_rate || igstRate}%</td>
                        <td>${localFormatCurrency(item.igst_amount || 0).replace('₹', '')}</td>
                      ` : `
                        <td class="text-center">${item.cgst_rate || cgstRate}%</td>
                        <td>${localFormatCurrency(item.cgst_amount || 0).replace('₹', '')}</td>
                        <td class="text-center">${item.sgst_rate || sgstRate}%</td>
                        <td>${localFormatCurrency(item.sgst_amount || 0).replace('₹', '')}</td>
                      `}
                      <td class="font-bold">${localFormatCurrency((item.igst_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0)).replace('₹', '')}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-tax-row">
                    <td class="text-center font-bold">Total</td>
                    <td class="font-bold">${localFormatCurrency(tempInvoice.taxable_amount || tempInvoice.subtotal).replace('₹', '')}</td>
                    ${isIGST ? `
                      <td></td>
                      <td class="font-bold">${localFormatCurrency(tempInvoice.igst_total).replace('₹', '')}</td>
                    ` : `
                      <td></td>
                      <td class="font-bold">${localFormatCurrency(tempInvoice.cgst_total).replace('₹', '')}</td>
                      <td></td>
                      <td class="font-bold">${localFormatCurrency(tempInvoice.sgst_total).replace('₹', '')}</td>
                    `}
                    <td class="font-bold">${localFormatCurrency(tempInvoice.gst_total || (tempInvoice.cgst_total + tempInvoice.sgst_total + tempInvoice.igst_total) || 0).replace('₹', '')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="tax-words-row font-bold">
              Tax Amount (in words) : INR ${localNumberToWords(Math.round(tempInvoice.gst_total || (tempInvoice.cgst_total + tempInvoice.sgst_total + tempInvoice.igst_total) || 0))}
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
                <span>${formattedPhone}</span>
              </div>
              <div class="contact-bar-item">
                <div class="bar-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span>${formattedEmail}</span>
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

  if (!isOpen) return null

  // Dropdown list for items
  const dbItemsList = isSales ? finishedGoods : rawMaterials
  const partiesList = isSales ? customers : vendors

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tally PDF Import Wizard</h2>
              <p className="text-xs text-white/50">Convert a Tally PDF invoice layout directly into structured data</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading} 
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="flex bg-white/5 border-b border-white/10 p-2 text-xs font-semibold uppercase tracking-wider text-center text-white/50">
          <div className={`flex-1 py-1 rounded ${step === 1 ? 'bg-pink-500/20 text-pink-400 font-bold' : ''}`}>1. Upload Tally PDF</div>
          <div className={`flex-1 py-1 rounded ${step === 2 ? 'bg-pink-500/20 text-pink-400 font-bold' : ''}`}>2. Review & Map Entities</div>
        </div>

        {/* Content Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900"
        >
          
          {/* STEP 1: UPLOAD DROPZONE */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-xl p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white/5 hover:bg-white/10 
                  ${isDragOver ? 'border-pink-400 bg-pink-500/10 scale-102 shadow-lg shadow-pink-500/10' : 'border-white/20'}
                  ${loading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden" 
                />

                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <ArrowPathIcon className="h-16 w-16 text-pink-400 animate-spin" />
                    <p className="text-white text-lg font-bold tracking-wide">Processing PDF Layout...</p>
                    <p className="text-xs text-white/50">Executing layout regex engines & database resolution lookups</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-pink-500/20 rounded-full text-pink-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white text-lg font-bold">Drag & Drop Tally PDF Invoice</h4>
                      <p className="text-white/60 text-sm mt-1">or click to browse local files</p>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs text-white/50 font-mono border border-white/5">
                      Accepts: .pdf only (Tally layout format)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & MAP GRID */}
          {step === 2 && (
            <form id="tally-import-form" onSubmit={handleImportSubmit} className="space-y-6">
              
              {/* Header Toggle & Type */}
              <div className={`bg-white/5 border border-white/10 rounded-xl p-5 grid grid-cols-1 ${!selectedPartyId ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6`}>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Invoice Mode</label>
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleTypeToggle(true)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${isSales ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'text-white/60 hover:text-white'}`}
                    >
                      Sales (Customer)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeToggle(false)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${!isSales ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'text-white/60 hover:text-white'}`}
                    >
                      Purchase (Vendor)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="Enter Invoice Number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                    {isSales ? 'Customer' : 'Vendor'} Select
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPartyId}
                      onChange={(e) => handlePartyChange(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none font-semibold"
                      style={{ backgroundColor: '#1f2937' }}
                    >
                      <option value="">-- Match Party (No DB) --</option>
                      {partiesList.map(party => (
                        <option key={party.id} value={party.id} style={{ backgroundColor: '#111827', color: 'white' }}>
                          {party.name} {party.gst ? `(${party.gst})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedPartyId && (
                  <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                      {isSales ? 'Customer Name (Custom)' : 'Vendor Name (Custom)'}
                    </label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-pink-500"
                      placeholder={isSales ? "Enter Customer Name" : "Enter Vendor Name"}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Bill To & Ship To Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bill To Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                  <h3 className="text-white text-sm font-bold tracking-wider border-b border-white/10 pb-2">Bill To</h3>
                  <input
                    type="text"
                    placeholder="Address"
                    value={billToAddress}
                    onChange={(e) => setBillToAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={billToCity}
                      onChange={(e) => setBillToCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={billToState}
                      onChange={(e) => setBillToState(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={billToPincode}
                      onChange={(e) => setBillToPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={billToGst}
                      onChange={(e) => setBillToGst(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Ship To Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h3 className="text-white text-sm font-bold tracking-wider">Ship To</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShipToAddress(billToAddress)
                        setShipToCity(billToCity)
                        setShipToState(billToState)
                        setShipToPincode(billToPincode)
                        setShipToGst(billToGst)
                      }}
                      className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
                    >
                      Copy Bill To
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Address"
                    value={shipToAddress}
                    onChange={(e) => setShipToAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={shipToCity}
                      onChange={(e) => setShipToCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={shipToState}
                      onChange={(e) => setShipToState(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={shipToPincode}
                      onChange={(e) => setShipToPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={shipToGst}
                      onChange={(e) => setShipToGst(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* GST and Transport Options */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Tax Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="radio"
                        checked={taxType === 'cgst_sgst'}
                        onChange={() => setTaxType('cgst_sgst')}
                        className="text-pink-500 focus:ring-0 rounded-full"
                      />
                      CGST + SGST (In-state)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="radio"
                        checked={taxType === 'igst'}
                        onChange={() => setTaxType('igst')}
                        className="text-pink-500 focus:ring-0 rounded-full"
                      />
                      IGST (Out-of-state)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Transport Mode</label>
                  <input
                    type="text"
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="Road, Train, etc."
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="MH-02-AB-1234"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Place of Supply</label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="Maharashtra, Gujarat..."
                  />
                </div>
              </div>

              {/* Items Mapping Grid */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                  <h3 className="text-white text-sm font-bold tracking-wider uppercase">Item Grid Line Items</h3>
                  <button
                    type="button"
                    onClick={addNewRow}
                    className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Row
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-white/60 uppercase tracking-wider text-[10px]">
                        <th className="p-3">Parsed Item Info</th>
                        <th className="p-3 w-72">Map to Database Item</th>
                        <th className="p-3 text-right">Qty</th>
                        {/* Lot info columns (only for purchases) */}
                        {!isSales && (
                          <>
                            <th className="p-3">Lot/Batch</th>
                            <th className="p-3 text-right">Recv Qty</th>
                          </>
                        )}
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Disc%</th>
                        <th className="p-3 text-right">GST%</th>
                        <th className="p-3 text-right">Taxable</th>
                        <th className="p-3 text-right">GST</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mappedItems.map((item, idx) => {
                        const searchQuery = itemSearchQuery[idx] || ''
                        const filteredDbItems = dbItemsList.filter(dbItem => 
                          dbItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (dbItem.code && dbItem.code.toLowerCase().includes(searchQuery.toLowerCase()))
                        )

                        return (
                          <tr key={idx} className="hover:bg-white/2 transition-colors">
                            <td className="p-3">
                              <span className="text-white font-medium block">{item.parsed_name || '(Custom Line)'}</span>
                              {item.parsed_name && (
                                <span className="text-white/40 text-[10px] block mt-0.5 italic">Tally: {item.parsed_name}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Search database item..."
                                  value={searchQuery}
                                  onChange={(e) => setItemSearchQuery({ ...itemSearchQuery, [idx]: e.target.value })}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/25 rounded text-white text-[11px]"
                                />
                                <select
                                  value={item.matched_item_id}
                                  onChange={(e) => handleRowChange(idx, 'matched_item_id', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-white/20 rounded text-white text-[11px]"
                                  style={{ backgroundColor: '#1f2937' }}
                                >
                                  <option value="">-- Match Item --</option>
                                  {(searchQuery ? filteredDbItems : dbItemsList).slice(0, 50).map(dbItem => (
                                    <option key={dbItem.id} value={dbItem.id}>
                                      {dbItem.name} {dbItem.code ? `[${dbItem.code}]` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                step="0.001"
                                value={item.quantity}
                                onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1 bg-white/5 border border-white/20 rounded text-white text-right text-[11px]"
                                required
                              />
                              <span className="text-[10px] text-white/40 text-center block mt-1 uppercase font-semibold">{item.unit || 'KG'}</span>
                            </td>
                            
                            {/* Lot & Recv Qty input fields for purchases */}
                            {!isSales && (
                              <>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={item.lot_no || ''}
                                    onChange={(e) => handleRowChange(idx, 'lot_no', e.target.value)}
                                    placeholder="Batch No"
                                    className="w-20 px-2 py-1 bg-white/5 border border-white/20 rounded text-white text-[11px]"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={item.received_quantity}
                                    onChange={(e) => handleRowChange(idx, 'received_quantity', e.target.value)}
                                    className="w-16 px-2 py-1 bg-white/5 border border-white/20 rounded text-white text-right text-[11px]"
                                  />
                                </td>
                              </>
                            )}

                            <td className="p-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handleRowChange(idx, 'rate', e.target.value)}
                                className="w-20 px-2 py-1 bg-white/5 border border-white/20 rounded text-white text-right text-[11px]"
                                required
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                step="0.1"
                                value={item.discount || 0}
                                onChange={(e) => handleRowChange(idx, 'discount', e.target.value)}
                                className="w-12 px-2 py-1 bg-white/5 border border-white/20 rounded text-white text-right text-[11px]"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.gst_rate}
                                onChange={(e) => handleRowChange(idx, 'gst_rate', e.target.value)}
                                className="w-14 px-1.5 py-1 bg-gray-800 border border-white/20 rounded text-white text-[11px]"
                                style={{ backgroundColor: '#1f2937' }}
                              >
                                <option value="0">0%</option>
                                <option value="3">3%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="p-3 text-right text-white/80 font-mono font-medium">
                              {item.taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right text-green-400 font-mono">
                              {((item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right text-white font-bold font-mono">
                              {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                className="p-1 hover:bg-white/10 rounded text-red-400 hover:text-red-300"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes & Totals Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Notes Input Panel */}
                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <h3 className="text-white text-sm font-bold tracking-wider uppercase border-b border-white/10 pb-2">Notes & Remarks</h3>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="Enter any specific invoice terms, reference details, or internal descriptions..."
                  />
                  {attachmentPath && (
                    <div className="p-3 bg-pink-500/10 border border-pink-500/25 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-pink-400 text-lg">📄</span>
                        <div className="text-[11px]">
                          <span className="text-white font-bold block">Tally PDF Attachment Archive</span>
                          <span className="text-white/40 block font-mono mt-0.5">{attachmentPath}</span>
                        </div>
                      </div>
                      <a 
                        href={attachmentPath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-pink-500 text-white font-semibold text-[10px] rounded uppercase hover:bg-pink-600 transition-colors"
                      >
                        Preview Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Final Billing Totals Card */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-5 space-y-4">
                  <h3 className="text-white text-sm font-bold tracking-wider uppercase border-b border-white/10 pb-2">Billing Summary</h3>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal (Lines):</span>
                      <span className="text-white font-mono font-medium">₹ {totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-white/60">
                      <span>Discount (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white text-right text-[11px]"
                      />
                    </div>

                    <div className="flex justify-between text-white/60 border-t border-white/10 pt-2">
                      <span>Taxable Amount:</span>
                      <span className="text-white font-mono font-medium">₹ {totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {taxType === 'cgst_sgst' ? (
                      <>
                        <div className="flex justify-between text-white/60">
                          <span>Central Tax (CGST):</span>
                          <span className="text-green-400 font-mono font-medium">₹ {totals.cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>State Tax (SGST):</span>
                          <span className="text-green-400 font-mono font-medium">₹ {totals.sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-white/60">
                        <span>Integrated Tax (IGST):</span>
                        <span className="text-green-400 font-mono font-medium">₹ {totals.igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-white/60">
                      <span>Total GST:</span>
                      <span className="text-green-400 font-mono font-medium">₹ {totals.gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between text-white font-bold text-base border-t border-white/20 pt-3">
                      <span>Grand Total:</span>
                      <span className="text-pink-400 font-mono">₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-white/40 text-[10px] font-medium tracking-wide">
                    Please click "Confirm & Import Invoice" below to save.
                  </div>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 text-xs font-bold uppercase tracking-wider"
              >
                ← Back to Upload
              </button>
            )}
          </div>

          {step === 2 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice (No Save)
              </button>

              <button
                type="submit"
                form="tally-import-form"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm & Import Invoice
              </button>
            </div>
          )}

          <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Powered by Tally PDF Parsing OCR v2.0</span>
        </div>
      </div>
    </div>
  )
}
