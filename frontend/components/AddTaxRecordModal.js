import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function AddTaxRecordModal({ isOpen, onClose, onAdd, editingRecord = null }) {
  const [formData, setFormData] = useState({
    tax_category: 'GST',
    tax_type: '',
    period_start: '',
    period_end: '',
    amount: '',
    payment_date: '',
    challan_no: '',
    bank_id: '',
    status: 'pending',
    notes: ''
  })
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBanks()
      if (editingRecord) {
        setFormData({
          tax_category: editingRecord.tax_category || 'GST',
          tax_type: editingRecord.tax_type || '',
          period_start: editingRecord.period_start || '',
          period_end: editingRecord.period_end || '',
          amount: editingRecord.amount || '',
          payment_date: editingRecord.payment_date || '',
          challan_no: editingRecord.challan_no || '',
          bank_id: editingRecord.bank_id || '',
          status: editingRecord.status || 'pending',
          notes: editingRecord.notes || ''
        })
      } else {
        setFormData({
          tax_category: 'GST',
          tax_type: '',
          period_start: '',
          period_end: '',
          amount: '',
          payment_date: '',
          challan_no: '',
          bank_id: '',
          status: 'pending',
          notes: ''
        })
      }
    }
  }, [isOpen, editingRecord])

  const fetchBanks = async () => {
    try {
      const response = await axios.get('/api/banks', {
        headers: { 'Company-Id': localStorage.getItem('companyId') || 1 }
      })
      setBanks(response.data)
    } catch (error) {
      console.error('Failed to load banks', error)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const headers = { 'Company-Id': localStorage.getItem('companyId') || 1 }
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        bank_id: formData.bank_id ? parseInt(formData.bank_id) : null
      }

      if (editingRecord) {
        await axios.put(`/api/tax-records/${editingRecord.id}`, payload, { headers })
        toast.success('Record updated successfully')
      } else {
        await axios.post('/api/tax-records', payload, { headers })
        toast.success('Record created successfully')
      }
      
      onAdd()
      onClose()
    } catch (error) {
      toast.error(editingRecord ? 'Failed to update record' : 'Failed to create record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">{editingRecord ? 'Edit' : 'Add'} Tax Record</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Tax Category *</label>
                <select
                  value={formData.tax_category}
                  onChange={(e) => setFormData({...formData, tax_category: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  required
                >
                  <option value="GST">GST</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="TDS">TDS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-1">Tax Type / Description</label>
                <input
                  type="text"
                  value={formData.tax_type}
                  onChange={(e) => setFormData({...formData, tax_type: e.target.value})}
                  placeholder="e.g. CGST, Advance Tax, 194C"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Period Start</label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Period End</label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="filed">Filed</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Date of Payment</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-1">Challan No. / PRN</label>
                <input
                  type="text"
                  value={formData.challan_no}
                  onChange={(e) => setFormData({...formData, challan_no: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm mb-1">Paid Via Bank</label>
                <select
                  value={formData.bank_id}
                  onChange={(e) => setFormData({...formData, bank_id: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">-- None / Cash --</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name} - {bank.account_no}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm mb-1">Notes / Remarks</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
