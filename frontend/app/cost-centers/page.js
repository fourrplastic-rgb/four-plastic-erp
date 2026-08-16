'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon as Plus, 
  PencilIcon as Edit2, 
  TrashIcon as Trash2,
  XMarkIcon as X,
  CalculatorIcon as Calculator,
  ArrowLeftIcon as ArrowLeft
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CostCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hourly_rate: ''
  });

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const res = await axios.get('/api/cost-centers');
      setCenters(res.data);
    } catch (error) {
      console.error('Error fetching cost centers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/cost-centers/${editingId}`, formData);
      } else {
        await axios.post('/api/cost-centers', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', description: '', hourly_rate: '' });
      fetchCostCenters();
    } catch (error) {
      console.error('Error saving cost center', error);
      alert('Failed to save cost center');
    }
  };

  const handleEdit = (center) => {
    setEditingId(center.id);
    setFormData({
      name: center.name,
      description: center.description || '',
      hourly_rate: center.hourly_rate || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cost center?')) {
      try {
        await axios.delete(`/api/cost-centers/${id}`);
        fetchCostCenters();
      } catch (error) {
        console.error('Error deleting', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                <Calculator className="h-8 w-8 text-indigo-400" />
                Cost Centers
              </h1>
              <p className="text-white/60">Manage production overheads, departments, and hourly machine rates.</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', description: '', hourly_rate: '' });
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Cost Center
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/40">Loading...</div>
        ) : (
          <div className="bg-[#1a1d24] rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="py-4 px-6 font-medium text-white/60">Name</th>
                  <th className="py-4 px-6 font-medium text-white/60">Description</th>
                  <th className="py-4 px-6 font-medium text-white/60">Hourly Rate (₹)</th>
                  <th className="py-4 px-6 font-medium text-white/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 px-6 text-center text-white/40">
                      No cost centers found. Create one to track production overheads.
                    </td>
                  </tr>
                ) : (
                  centers.map((center) => (
                    <tr key={center.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-white font-medium">{center.name}</td>
                      <td className="py-4 px-6 text-white/60">{center.description || '-'}</td>
                      <td className="py-4 px-6 text-emerald-400 font-mono">₹{center.hourly_rate?.toFixed(2)} / hr</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleEdit(center)}
                          className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(center.id)}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors ml-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1d24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Cost Center' : 'New Cost Center'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Cost Center Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Injection Molding Dept"
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional details"
                    className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Hourly Rate (₹/hr)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                      placeholder="500.00"
                      className="w-full bg-[#0f1115] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Used to calculate overhead cost (Rate × Hours Taken) for production entries.
                  </p>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium"
                  >
                    Save Cost Center
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
