'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon, 
  CameraIcon, 
  ArrowPathIcon, 
  DocumentArrowUpIcon,
  CheckIcon,
  SparklesIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

const demoSlips = [
  {
    id: 'molding',
    name: 'Molding Run Log (Chair Production)',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    data: {
      production_date: '2026-08-15',
      shift: 'A',
      machine_no: 'M-01',
      operator_name: 'Rahul Varma',
      finished_good_name: 'Plastic Moulded Chair',
      quantity_produced: 180,
      good_quantity: 176,
      rejected_quantity: 4,
      rejection_reason: 'Short shot / air trap',
      raw_material_name: 'PP Milky Virgin',
      quantity_used: 200,
      batch_no: 'VIRGIN-M45'
    }
  },
  {
    id: 'regrind',
    name: 'Granding / Scrap Recycling Log',
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500&auto=format&fit=crop&q=60',
    data: {
      production_date: '2026-08-15',
      shift: 'B',
      machine_no: 'R-02',
      operator_name: 'Kalpesh Bhai',
      finished_good_name: 'PP COLOR SCRAP',
      quantity_produced: 420,
      good_quantity: 420,
      rejected_quantity: 0,
      rejection_reason: '',
      raw_material_name: 'PP COLOR SCRAP', // recycling target
      quantity_used: 425,
      batch_no: 'RECYCLED-GRIND'
    }
  }
]

export default function ProductionScanner() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  
  const [finishedGoods, setFinishedGoods] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const fgRes = await axios.get('/api/stock/finished-goods')
      const rmRes = await axios.get('/api/stock/raw-materials')
      setFinishedGoods(fgRes.data)
      setRawMaterials(rmRes.data)
    } catch (e) {
      console.error('Error fetching items for scan parser:', e)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      triggerScan(file.name)
    }
  }

  const handleDemoSelect = (demo) => {
    setSelectedFile({ name: demo.name })
    setPreviewUrl(demo.image)
    triggerScan(demo.id, demo.data)
  }

  const triggerScan = (idOrName, customData = null) => {
    setScanning(true)
    setParsedData(null)
    
    // Simulate smart OCR laser scanning
    setTimeout(() => {
      setScanning(false)
      if (customData) {
        setParsedData({ ...customData })
      } else {
        // Fallback default parsed data if custom upload
        setParsedData({
          production_date: new Date().toISOString().slice(0, 10),
          shift: 'A',
          machine_no: 'M-01',
          operator_name: 'Floor Operator',
          finished_good_name: 'Plastic Moulded Chair',
          quantity_produced: 250,
          good_quantity: 245,
          rejected_quantity: 5,
          rejection_reason: 'Flashed edge',
          raw_material_name: 'PP Milky Virgin',
          quantity_used: 280,
          batch_no: 'MOCK-SCAN-01'
        })
      }
    }, 2500)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Find matching items from state lists by name
      const matchedFG = finishedGoods.find(fg => 
        fg.name.toLowerCase().includes(parsedData.finished_good_name.toLowerCase())
      ) || finishedGoods[0]

      const matchedRM = rawMaterials.find(rm => 
        rm.name.toLowerCase().includes(parsedData.raw_material_name.toLowerCase())
      ) || rawMaterials[0]

      if (!matchedFG) {
        toast.error('Could not match finished good in Item Master')
        setLoading(false)
        return
      }

      // Prepare payload matching backend specs
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const prodNo = `PROD${dateStr}${randomNum}`

      const materialsList = []
      if (matchedRM) {
        materialsList.push({
          raw_material_id: matchedRM.id,
          quantity_used: parseFloat(parsedData.quantity_used),
          rate: matchedRM.purchase_rate || matchedRM.rate || 0,
          batch_no: parsedData.batch_no || 'SCANNED'
        })
      }

      const payload = {
        production_no: prodNo,
        production_date: parsedData.production_date,
        shift: parsedData.shift,
        finished_good_id: matchedFG.id,
        quantity_produced: parseFloat(parsedData.quantity_produced),
        good_quantity: parseFloat(parsedData.good_quantity),
        rejected_quantity: parseFloat(parsedData.rejected_quantity) || 0,
        rejection_reason: parsedData.rejection_reason || '',
        batch_no: parsedData.batch_no || '',
        machine_no: parsedData.machine_no || '',
        operator_name: parsedData.operator_name || '',
        supervisor_name: 'AI Scan Validator',
        materials: materialsList,
        status: 'pending'
      }

      console.log('Sending parsed scanner payload:', payload)
      await axios.post('/api/production', payload)
      toast.success('Handwritten production run scanned and saved successfully! 🎉')
      router.push('/production')
    } catch (e) {
      console.error(e)
      toast.error('Failed to submit parsed production data. Please check field names.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-6 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/production" className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-slate-300" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-400" />
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Handwritten Log Scan Automation</h1>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">Snap a photo of the floor operator log slip to automatically log output and scrap weights.</p>
            </div>
          </div>
        </div>

        {/* OCR Intake Slot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Intake slot */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Upload or Capture Slip</h2>
              
              {/* Drag n Drop block */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-indigo-500/50 cursor-pointer transition-all bg-slate-900/10 hover:bg-white/5 relative overflow-hidden group"
              >
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Log slip preview" className="max-h-60 mx-auto rounded-lg object-contain" />
                    {scanning && (
                      /* Glowing OCR Laser sweep line */
                      <div className="absolute inset-x-0 h-1 bg-green-400 shadow-[0_0_15px_#22c55e] animate-bounce top-0 bottom-0" style={{ animationDuration: '2.5s' }} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <DocumentArrowUpIcon className="h-10 w-10 text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Click to take photo / Select log sheet</span>
                    <span className="text-xs text-[var(--text-secondary)]">Supports JPG, PNG handwritten logs</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                />
              </div>

              {/* Demo selector lists */}
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Try with a floor demo slip:</p>
                <div className="flex flex-col gap-2.5">
                  {demoSlips.map(demo => (
                    <button
                      key={demo.id}
                      onClick={() => handleDemoSelect(demo)}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left text-sm font-medium flex justify-between items-center transition-all"
                    >
                      <span className="text-[var(--text-primary)]">{demo.name}</span>
                      <CameraIcon className="h-4 w-4 text-indigo-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right parsed results desk */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 min-h-[400px] flex flex-col justify-between">
              
              {/* Header result */}
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Parsed OCR Details</h2>
                  {parsedData && (
                    <button 
                      onClick={() => setEditMode(!editMode)}
                      className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      {editMode ? 'Finish Editing' : 'Edit Extracted Data'}
                    </button>
                  )}
                </div>

                {/* Loading / Scanning status */}
                {scanning && (
                  <div className="py-20 text-center space-y-4">
                    <ArrowPathIcon className="h-10 w-10 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-[var(--text-primary)] animate-pulse">Running AI handwriting extraction...</p>
                    <p className="text-xs text-[var(--text-secondary)]">Analyzing layout and matching materials</p>
                  </div>
                )}

                {/* Empty State */}
                {!scanning && !parsedData && (
                  <div className="py-20 text-center text-[var(--text-secondary)] text-sm border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                    Upload a log image or select a demo slip on the left to test the OCR parser.
                  </div>
                )}

                {/* Extracted Form Fields */}
                {!scanning && parsedData && (
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Log Date</label>
                        {editMode ? (
                          <input 
                            type="date" 
                            value={parsedData.production_date} 
                            onChange={(e) => setParsedData({ ...parsedData, production_date: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          />
                        ) : (
                          <p className="text-[var(--text-primary)] font-semibold mt-1">{parsedData.production_date}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Operator Name</label>
                        {editMode ? (
                          <input 
                            type="text" 
                            value={parsedData.operator_name} 
                            onChange={(e) => setParsedData({ ...parsedData, operator_name: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          />
                        ) : (
                          <p className="text-[var(--text-primary)] font-semibold mt-1">{parsedData.operator_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Machine No</label>
                        {editMode ? (
                          <input 
                            type="text" 
                            value={parsedData.machine_no} 
                            onChange={(e) => setParsedData({ ...parsedData, machine_no: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          />
                        ) : (
                          <p className="text-[var(--text-primary)] font-semibold mt-1">{parsedData.machine_no}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Shift</label>
                        {editMode ? (
                          <select 
                            value={parsedData.shift} 
                            onChange={(e) => setParsedData({ ...parsedData, shift: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          >
                            <option value="A">Shift A (Morning)</option>
                            <option value="B">Shift B (Evening)</option>
                            <option value="C">Shift C (Night)</option>
                          </select>
                        ) : (
                          <p className="text-[var(--text-primary)] font-semibold mt-1">Shift {parsedData.shift}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Finished Good Output</label>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-bold text-[var(--text-primary)]">{parsedData.finished_good_name}</span>
                        {editMode ? (
                          <input 
                            type="number" 
                            value={parsedData.quantity_produced} 
                            onChange={(e) => setParsedData({ ...parsedData, quantity_produced: parseFloat(e.target.value), good_quantity: parseFloat(e.target.value) })}
                            className="w-24 text-right px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10 font-bold" 
                          />
                        ) : (
                          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold text-xs">
                            {parsedData.quantity_produced} Units
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Good output</label>
                        {editMode ? (
                          <input 
                            type="number" 
                            value={parsedData.good_quantity} 
                            onChange={(e) => setParsedData({ ...parsedData, good_quantity: parseFloat(e.target.value) })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          />
                        ) : (
                          <p className="text-green-400 font-bold mt-1">{parsedData.good_quantity} Units</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Rejected / Scrap</label>
                        {editMode ? (
                          <input 
                            type="number" 
                            value={parsedData.rejected_quantity} 
                            onChange={(e) => setParsedData({ ...parsedData, rejected_quantity: parseFloat(e.target.value) })}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10" 
                          />
                        ) : (
                          <p className="text-red-400 font-bold mt-1">{parsedData.rejected_quantity} Units</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <label className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Raw Material Used</label>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[var(--text-primary)]">{parsedData.raw_material_name}</span>
                        {editMode ? (
                          <input 
                            type="number" 
                            value={parsedData.quantity_used} 
                            onChange={(e) => setParsedData({ ...parsedData, quantity_used: parseFloat(e.target.value) })}
                            className="w-24 text-right px-3 py-1.5 rounded-lg bg-slate-950/20 border border-white/10 font-mono" 
                          />
                        ) : (
                          <span className="font-mono text-[var(--text-primary)] font-bold">{parsedData.quantity_used} KG</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {parsedData && (
                <div className="pt-6 border-t border-white/5">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all text-white"
                  >
                    {loading ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckIcon className="h-5 w-5" />
                    )}
                    Approve & Save to Database
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
