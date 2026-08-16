'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon,
  TrashIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function JournalEntryPage() {
  const [ledgers, setLedgers] = useState([])
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: ''
  })

  const [entries, setEntries] = useState([
    { id: 1, ledger_id: '', party_type: '', party_id: '', debit: '', credit: '', notes: '' },
    { id: 2, ledger_id: '', party_type: '', party_id: '', debit: '', credit: '', notes: '' }
  ])

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchLedgers()
    fetchParties()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchLedgers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/accounting/ledgers`)
      setLedgers(res.data)
    } catch (error) {
      toast.error('Failed to fetch ledgers')
    }
  }

  const fetchParties = async () => {
    try {
      const [custRes, vendRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customers`),
        axios.get(`${API_BASE_URL}/vendors`)
      ])
      setCustomers(custRes.data.customers || custRes.data || [])
      setVendors(vendRes.data.vendors || vendRes.data || [])
    } catch (error) {
      console.error('Failed to fetch parties')
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEntryChange = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
         let newEntry = { ...e, [field]: value }
         if (field === 'debit' && value !== '') newEntry.credit = '' // Mutually exclusive
         if (field === 'credit' && value !== '') newEntry.debit = ''
         
         // Clear party_id if party_type is changed
         if (field === 'party_type') newEntry.party_id = ''
         
         return newEntry
      }
      return e
    }))
  }

  const addRow = () => {
    setEntries([...entries, { id: Date.now(), ledger_id: '', party_type: '', party_id: '', debit: '', credit: '', notes: '' }])
  }

  const removeRow = (id) => {
    if (entries.length <= 2) {
      toast.error('Journal must have at least 2 entries')
      return;
    }
    setEntries(entries.filter(e => e.id !== id))
  }

  // Calculate totals
  const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Filter out completely empty rows
    const validEntries = entries.filter(e => e.ledger_id && (e.debit || e.credit))
    
    if (validEntries.length < 2) {
      toast.error('Must have at least 2 valid entries')
      return
    }

    if (!isBalanced) {
      toast.error('Debits and Credits must be equal!')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        entries: validEntries
      }
      const res = await axios.post(`${API_BASE_URL}/accounting/journal`, payload)
      toast.success(`Journal Posted! Voucher: ${res.data.voucher_no}`)
      
      // Reset
      setFormData({
        voucher_date: new Date().toISOString().split('T')[0],
        reference_no: '',
        notes: ''
      })
      setEntries([
        { id: Date.now(), ledger_id: '', party_type: '', party_id: '', debit: '', credit: '', notes: '' },
        { id: Date.now()+1, ledger_id: '', party_type: '', party_id: '', debit: '', credit: '', notes: '' }
      ])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post journal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative">
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalculatorIcon className="h-8 w-8 text-blue-400" />
                  <h1 className="text-2xl font-bold text-white">Manual Journal Entry</h1>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="block text-white/80 text-sm mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    name="voucher_date"
                    value={formData.voucher_date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
               </div>
               <div>
                  <label className="block text-white/80 text-sm mb-1">Reference No</label>
                  <input
                    type="text"
                    name="reference_no"
                    value={formData.reference_no}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Sales Inv #1234"
                  />
               </div>
               <div>
                  <label className="block text-white/80 text-sm mb-1">Notes / Narration</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Description of transaction..."
                  />
               </div>
            </div>

            <div className="mt-8 border border-white/20 rounded-lg overflow-hidden">
               <table className="w-full">
                  <thead className="bg-white/5">
                     <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">Account (Ledger)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">Party (Optional)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/80 w-32">Debit (₹)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/80 w-32">Credit (₹)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">Line Narration</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-white/80 w-16">Act</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                     {entries.map((entry, index) => (
                        <tr key={entry.id} className="hover:bg-white/5">
                           <td className="p-2">
                              <select 
                                value={entry.ledger_id}
                                onChange={(e) => handleEntryChange(entry.id, 'ledger_id', e.target.value)}
                                className="w-full bg-transparent border border-white/20 rounded px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500"
                                required={index === 0 || index === 1}
                              >
                                 <option value="" className="text-black">Select Ledger...</option>
                                 {ledgers.map(l => (
                                   <option key={l.id} value={l.id} className="text-black">{l.name} ({l.group_name})</option>
                                 ))}
                              </select>
                           </td>
                           <td className="p-2">
                              <div className="flex gap-1">
                                <select 
                                  value={entry.party_type || ''}
                                  onChange={(e) => handleEntryChange(entry.id, 'party_type', e.target.value)}
                                  className="w-1/3 bg-transparent border border-white/20 rounded px-1 py-1.5 text-white/80 text-xs focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="" className="text-black">- Type -</option>
                                  <option value="customer" className="text-black">Customer</option>
                                  <option value="vendor" className="text-black">Vendor</option>
                                </select>
                                <select 
                                  value={entry.party_id || ''}
                                  onChange={(e) => handleEntryChange(entry.id, 'party_id', e.target.value)}
                                  disabled={!entry.party_type}
                                  className="w-2/3 bg-transparent border border-white/20 rounded px-1 py-1.5 text-white/80 text-xs disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="" className="text-black">- Party -</option>
                                  {entry.party_type === 'customer' && customers.map(c => (
                                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                                  ))}
                                  {entry.party_type === 'vendor' && vendors.map(v => (
                                    <option key={v.id} value={v.id} className="text-black">{v.name}</option>
                                  ))}
                                </select>
                              </div>
                           </td>
                           <td className="p-2">
                              <input 
                                type="number" step="any" min="0" placeholder="0.00"
                                value={entry.debit}
                                onChange={(e) => handleEntryChange(entry.id, 'debit', e.target.value)}
                                className="w-full bg-transparent border border-white/20 rounded px-2 py-1.5 text-right text-blue-400 font-mono disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                                disabled={entry.credit !== ''}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                type="number" step="any" min="0" placeholder="0.00"
                                value={entry.credit}
                                onChange={(e) => handleEntryChange(entry.id, 'credit', e.target.value)}
                                className="w-full bg-transparent border border-white/20 rounded px-2 py-1.5 text-right text-fuchsia-400 font-mono disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                                disabled={entry.debit !== ''}
                              />
                           </td>
                           <td className="p-2">
                              <input 
                                type="text" placeholder="Line notes..."
                                value={entry.notes}
                                onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                                className="w-full bg-transparent border border-white/20 rounded px-2 py-1.5 text-white/80 focus:ring-2 focus:ring-blue-500"
                              />
                           </td>
                           <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(entry.id)}
                                className="text-red-400 hover:text-red-300 transition p-1"
                              >
                                 <TrashIcon className="h-5 w-5" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot className="bg-black/20 font-mono text-sm">
                     <tr>
                        <td className="p-4 text-right font-bold text-white uppercase text-xs tracking-wider">
                           <button
                             type="button"
                             onClick={addRow}
                             className="text-blue-400 hover:text-blue-300 mr-8 flex items-center float-left"
                           >
                             <PlusIcon className="h-4 w-4 mr-1"/> Add Row
                           </button>
                           Totals:
                        </td>
                        <td className="p-4 text-right font-bold text-blue-400 border-t border-blue-500/30 font-mono text-lg">
                           ₹{(totalDebit || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-bold text-fuchsia-400 border-t border-fuchsia-500/30 font-mono text-lg">
                           ₹{(totalCredit || 0).toFixed(2)}
                        </td>
                        <td colSpan={2} className="p-4 pl-6 border-t border-white/10">
                           {isBalanced ? (
                             <span className="text-green-400 font-bold bg-green-500/20 px-3 py-1 rounded">BALANCED</span>
                           ) : (
                             <span className="text-red-400 font-bold bg-red-500/20 px-3 py-1 rounded">DIFFERENCE: ₹{Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                           )}
                        </td>
                     </tr>
                  </tfoot>
               </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || !isBalanced || (totalDebit === 0 && totalCredit === 0)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading ? 'Posting...' : 'Post Journal Voucher'}
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  )
}
