'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  HomeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const API_BASE_URL = '/api'

export default function BackupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState([])
  const [restoreFile, setRestoreFile] = useState(null)
  const [creatingBackup, setCreatingBackup] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchBackups()
  }, [])

  const checkAuth = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!user) {
      router.push('/')
    }
  }

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/backup/list`)
      setBackups(response.data.backups || [])
    } catch (error) {
      console.error('Error fetching backups:', error)
      toast.error('Failed to fetch backups')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setCreatingBackup(true)
      const response = await axios.post(`${API_BASE_URL}/backup/create`)
      if (response.data.success) {
        toast.success('Backup created successfully!')
        fetchBackups()
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const downloadBackup = async (filename) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/backup/download/${filename}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Backup downloaded successfully!')
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  const restoreBackup = async () => {
    if (!restoreFile) {
      toast.error('Please select a backup file')
      return
    }

    if (!confirm('⚠️ WARNING: This will overwrite your current database! Make sure you have a recent backup. Continue?')) {
      return
    }

    const formData = new FormData()
    formData.append('file', restoreFile)

    try {
      setCreatingBackup(true)
      const response = await axios.post(`${API_BASE_URL}/backup/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        toast.success('Database restored successfully!')
        fetchBackups()
        setRestoreFile(null)
        const fileInput = document.getElementById('restore-file')
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Failed to restore backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const deleteBackup = async (filename) => {
    if (!confirm(`Delete backup ${filename}? This action cannot be undone.`)) return

    try {
      const response = await axios.delete(`${API_BASE_URL}/backup/delete/${filename}`)
      if (response.data.success) {
        toast.success('Backup deleted successfully!')
        fetchBackups()
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Failed to delete backup')
    }
  }

  const formatFileSize = (sizeMB) => {
    if (sizeMB < 1) return `${(sizeMB * 1024).toFixed(2)} KB`
    return `${sizeMB.toFixed(2)} MB`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToDashboard}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20"
                  title="Back to Dashboard"
                >
                  <HomeIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Backup & Restore
                  </h1>
                  <p className="text-white/60 text-sm">Protect your data with automated backups</p>
                </div>
              </div>
              <button
                onClick={createBackup}
                disabled={creatingBackup}
                className="px-4 py-2 bg-green-500/20 border border-green-500/30  rounded-lg text-green-400 hover:bg-green-500/30 flex items-center gap-2 disabled:opacity-50"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                {creatingBackup ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Backup Location</p>
                  <p className="text-white font-semibold text-sm">/backups/ folder</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Backups</p>
                  <p className="text-white font-bold text-2xl">{backups.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ArrowDownTrayIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Latest Backup</p>
                  <p className="text-white font-semibold text-sm">
                    {backups.length > 0 ? formatDate(backups[0].created) : 'No backups'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CloudArrowDownIcon className="h-5 w-5 text-yellow-400" />
              Restore from Backup
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Select Backup File (.zip)</label>
                <input
                  id="restore-file"
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={restoreBackup}
                  disabled={!restoreFile || creatingBackup}
                  className="px-6 py-2 bg-yellow-500/20 border border-yellow-500/30  rounded-lg text-yellow-400 hover:bg-yellow-500/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  Restore Database
                </button>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-3">
              ⚠️ Warning: Restoring will overwrite your current database. Please ensure you have a recent backup before restoring.
            </p>
          </div>

          {/* Backups List */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-400" />
              Available Backups
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                <p className="text-white/70 mt-2">Loading backups...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No backups found</p>
                <p className="text-white/30 text-sm mt-1">Click "Create Backup" to protect your data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Filename</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/60">Size</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {backups.map((backup, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-mono">{backup.filename}</td>
                        <td className="px-4 py-3 text-sm text-white/70">{formatDate(backup.created)}</td>
                        <td className="px-4 py-3 text-sm text-white/70 text-right">{formatFileSize(backup.size_mb)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => downloadBackup(backup.filename)}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded transition-colors"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteBackup(backup.filename)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
