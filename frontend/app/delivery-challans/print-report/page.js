'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

const API_BASE_URL = '/api'

function PrintReportContent() {
  const searchParams = useSearchParams()
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ count: 0, qty: 0, amount: 0 })

  const fromDate = searchParams.get('from') || ''
  const toDate = searchParams.get('to') || ''
  const searchTerm = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || 'all'
  const showRates = searchParams.get('showRates') === 'true'

  useEffect(() => {
    fetchAndFilterChallans()
  }, [searchParams])

  const calculateTotalAmount = (challan) => {
    if (challan.items && Array.isArray(challan.items) && challan.items.length > 0) {
      return challan.items.reduce((sum, item) => {
        const qty = Number(item.qty) || Number(item.quantity) || 0;
        const rate = Number(item.rate) || Number(item.price) || 0;
        return sum + (qty * rate);
      }, 0);
    }
    return 0;
  }

  const calculateTotalQuantity = (challan) => {
    if (challan.items && Array.isArray(challan.items) && challan.items.length > 0) {
      return challan.items.reduce((sum, item) => {
        return sum + (Number(item.qty) || Number(item.quantity) || 0);
      }, 0);
    }
    return Number(challan.total_quantity) || 0;
  }

  const fetchAndFilterChallans = async () => {
    try {
      setLoading(true)
      
      const response = await axios.get(`${API_BASE_URL}/delivery-challans`)
      let challansData = response.data
      
      for (let i = 0; i < challansData.length; i++) {
        try {
          const challanDetail = await axios.get(`${API_BASE_URL}/delivery-challans/${challansData[i].id}`)
          challansData[i].items = challanDetail.data.items || []
        } catch (e) {
          challansData[i].items = []
        }
      }
      
      if (challansData.length > 0 && !challansData[0].customer_name) {
        try {
          const custRes = await axios.get(`${API_BASE_URL}/customers`)
          const custMap = {}
          custRes.data.forEach(c => custMap[c.id] = c.name)
          challansData = challansData.map(c => ({
            ...c,
            customer_name: custMap[c.customer_id] || 'Unknown'
          }))
        } catch (e) {
          challansData = challansData.map(c => ({...c, customer_name: 'Unknown'}))
        }
      }

      let filtered = [...challansData]
      
      if (searchTerm) {
        filtered = filtered.filter(c => 
          c.challan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.transporter_name && c.transporter_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (c.vehicle_no && c.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(c => (c.status || 'PENDING').toUpperCase() === statusFilter.toUpperCase())
      }
      
      if (fromDate) {
        filtered = filtered.filter(c => {
          const date = new Date(c.challan_date || c.date || c.created_at)
          return date >= new Date(fromDate)
        })
      }
      
      if (toDate) {
        filtered = filtered.filter(c => {
          const date = new Date(c.challan_date || c.date || c.created_at)
          const to = new Date(toDate)
          to.setHours(23, 59, 59, 999)
          return date <= to
        })
      }

      let totalQty = 0
      let totalAmt = 0
      filtered.forEach(c => { 
        totalQty += calculateTotalQuantity(c)
        totalAmt += calculateTotalAmount(c)
      })

      setChallans(filtered)
      setTotals({ count: filtered.length, qty: totalQty, amount: totalAmt })
      
      setTimeout(() => {
        window.print()
      }, 1000)

    } catch (error) {
      console.error('Error fetching for print:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-')
    } catch {
      return '-'
    }
  }

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/ /g, '-').replace(',', '');
  }

  if (loading) {
    return <div className="p-10 text-center font-mono text-black">Generating Professional Report...</div>
  }

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 text-black print-preview">
      <div className="max-w-5xl mx-auto bg-white">
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-1">FOUR (R) PLASTIC</h1>
          <p className="text-sm font-medium text-gray-600 mb-4">Complete ERP Solution - Delivery Challan Summary Report</p>
          
          <div className="flex justify-between items-end px-4 mt-6">
            <div className="text-left">
              <p className="text-xs text-gray-500 uppercase font-bold">Reporting Period</p>
              <p className="text-sm font-bold text-black">
                {fromDate || toDate ? (
                  `${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : 'Present'}`
                ) : (
                  'All Available Records'
                )}
              </p>
              {statusFilter !== 'all' && (
                <p className="text-xs text-gray-600 mt-1">Status: <span className="font-bold">{statusFilter}</span></p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold">Report Generated On</p>
              <p className="text-sm font-bold text-black">{formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-6 mb-8 px-4">
          <div className="flex-1 border border-black p-4 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Challans</p>
            <p className="text-2xl font-black text-black">{totals.count}</p>
          </div>
          <div className="flex-1 border border-black p-4 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Quantity (KG)</p>
            <p className="text-2xl font-black text-black">{totals.qty.toFixed(2)}</p>
          </div>
          {showRates && (
            <div className="flex-1 border border-black p-4 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Amount (₹)</p>
              <p className="text-2xl font-black text-black">{totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        <table className="w-full border-collapse border border-black text-base">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-3 py-2 text-left font-bold w-12">S.No</th>
              <th className="border border-black px-3 py-2 text-left font-bold">Date</th>
              <th className="border border-black px-3 py-2 text-left font-bold">Challan No</th>
              <th className="border border-black px-3 py-2 text-left font-bold">Type</th>
              <th className="border border-black px-3 py-2 text-left font-bold w-1/4">Customer</th>
              <th className="border border-black px-3 py-2 text-left font-bold">Transport Name</th>
              <th className="border border-black px-3 py-2 text-right font-bold">Freight Amount</th>
              <th className="border border-black px-3 py-2 text-right font-bold">Status</th>
              <th className="border border-black px-3 py-2 text-right font-bold">Qty (KG)</th>
              {showRates && (
                <>
                  <th className="border border-black px-3 py-2 text-right font-bold">Avg Rate</th>
                  <th className="border border-black px-3 py-2 text-right font-bold">Amount (₹)</th>
                  <th className="border border-black px-3 py-2 text-left font-bold w-28">Remarks</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {challans.map((challan, index) => {
              const qty = calculateTotalQuantity(challan);
              return (
                <tr key={challan.id}>
                  <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                  <td className="border border-black px-3 py-2">{formatDate(challan.date || challan.challan_date || challan.created_at)}</td>
                  <td className="border border-black px-3 py-2 font-mono text-sm font-bold">{challan.challan_no}</td>
                  <td className="border border-black px-3 py-2 text-sm uppercase">{challan.challan_type || 'OUTWARD'}</td>
                  <td className="border border-black px-3 py-2">{challan.customer_name}</td>
                  <td className="border border-black px-3 py-2">{challan.transporter_name || '-'}</td>
                  <td className="border border-black px-3 py-2 text-right font-mono font-semibold">₹{Number(challan.freight_charges || 0).toFixed(2)}</td>
                  <td className="border border-black px-3 py-2 text-right text-sm font-bold uppercase">{challan.status || 'PENDING'}</td>
                  <td className="border border-black px-3 py-2 text-right">
                    <div className="flex flex-col items-end">
                      {challan.items?.map((item, itemIdx) => {
                        const itemQty = Number(item.qty) || Number(item.quantity) || 0;
                        return (
                          <div key={itemIdx} className="text-[12px] text-gray-600 font-normal">
                            {item.item_name || item.name}: <span className="font-semibold text-black">{itemQty.toFixed(2)}</span>
                          </div>
                        )
                      })}
                      <div className="border-t border-black/25 mt-1 pt-0.5 font-bold text-black w-full text-right">
                        {qty.toFixed(2)}
                      </div>
                    </div>
                  </td>
                  {showRates && (
                    <>
                      <td className="border border-black px-3 py-2 text-right">{qty > 0 ? (calculateTotalAmount(challan) / qty).toFixed(2) : '-'}</td>
                      <td className="border border-black px-3 py-2 text-right font-bold">{calculateTotalAmount(challan).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="border border-black px-3 py-2 text-left"></td>
                    </>
                  )}
                </tr>
              )
            })}
            
            <tr className="bg-gray-100 font-bold">
              <td colSpan="8" className="border border-black px-3 py-3 text-right">GRAND TOTAL</td>
              <td className="border border-black px-3 py-3 text-right">{totals.qty.toFixed(2)}</td>
              {showRates && (
                <>
                  <td className="border border-black px-3 py-3 bg-gray-100"></td>
                  <td className="border border-black px-3 py-3 text-right">{totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-black px-3 py-3 bg-gray-100"></td>
                </>
              )}
            </tr>
          </tbody>
        </table>

        <div className="mt-16 flex justify-between px-8">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-xs font-bold">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-xs font-bold">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          * This is a computer-generated report.
        </div>
      </div>
    </div>
  )
}

export default function DeliveryChallanPrintReport() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-black">Loading report data...</div>}>
      <PrintReportContent />
    </Suspense>
  )
}
