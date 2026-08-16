'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  CubeIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

export default function EditItemPage({ params }) {
  const unwrappedParams = use(params)
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemType = searchParams.get('type') || 'raw_material'
  const itemId = unwrappedParams.id

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'KG',
    hsn_code: '',
    gst_rate: 18,
    purchase_rate: 0,
    sales_rate: 0,
    mrp: 0,
    opening_stock: 0,
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    location: ''
  })

  useEffect(() => {
    fetchItem()
  }, [])

  const fetchItem = async () => {
    try {
      const response = await axios.get(`/api/items/${itemType}/${itemId}`)
      const item = response.data
      setItem(item)
      setFormData({
        name: item.name || '',
        category: item.category || '',
        unit: item.unit || 'KG',
        hsn_code: item.hsn_code || '',
        gst_rate: item.gst_rate || 18,
        purchase_rate: item.purchase_rate || 0,
        sales_rate: item.sales_rate || 0,
        mrp: item.mrp || 0,
        opening_stock: item.opening_stock || 0,
        current_stock: item.current_stock || 0,
        min_stock: item.min_stock || 0,
        max_stock: item.max_stock || 0,
        location: item.location || ''
      })
    } catch (error) {
      toast.error('Failed to fetch item')
      router.push('/items')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await axios.put(`/api/items/${itemType}/${itemId}`, formData)
      toast.success('Item updated successfully')
      router.push('/items')
    } catch (error) {
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
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
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              {itemType === 'raw_material' ? (
                <BeakerIcon className="h-8 w-8 text-blue-400" />
              ) : (
                <CubeIcon className="h-8 w-8 text-green-400" />
              )}
              <h1 className="text-2xl font-bold text-white">
                Edit {itemType === 'raw_material' ? 'Raw Material' : 'Finished Good'}
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 space-y-4">
            {/* Add your form fields here - same as new item page */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-medium"
              >
                {saving ? 'Saving...' : 'Update Item'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}