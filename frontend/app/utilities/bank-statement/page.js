'use client'

import React, { useState } from 'react';
import axios from 'axios';
import { 
  ArrowUpTrayIcon as Upload, 
  DocumentTextIcon as FileText, 
  LockClosedIcon as Lock, 
  ArrowDownTrayIcon as FileDown, 
  CheckCircleIcon as CheckCircle2, 
  ExclamationCircleIcon as AlertCircle, 
  ArrowLeftIcon as ArrowLeft 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function BankStatementConverter() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    if (password) {
      formData.append('password', password);
    }

    try {
      const response = await axios.post('/api/utilities/bank-statement/convert', formData, {
        responseType: 'blob', // Important for downloading files
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.replace('.pdf', '')}_converted.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Successfully converted! Your download should begin automatically.');
    } catch (err) {
      console.error('Convert Error:', err.message);
      if (err.response && err.response.data) {
        // Blob responses need to be read to extract error messages
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.error || 'Failed to process the PDF.');
          } catch {
            setError('Failed to process the PDF. It may be heavily encrypted or not contain readable text tables.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setError('Network error. Could not connect to the server.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans selection:bg-blue-500/30">
      
      <main className="p-8 pt-12 relative z-10 max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Bank Statement Converter</h1>
          <p className="text-white/60">Upload your PDF bank statement and let the AI extract the transaction tables into a clean Excel file.</p>
        </div>

        {/* Upload Zone */}
        <div 
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            file ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="pdf-upload" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileChange}
          />
          
          <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
            <div className="h-20 w-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-10 w-10 text-blue-400" />
            </div>
            
            {file ? (
              <div className="flex items-center gap-3 text-lg font-medium text-white mb-2">
                <FileText className="h-5 w-5 text-blue-400" />
                {file.name}
              </div>
            ) : (
              <h3 className="text-xl font-semibold text-white mb-2">Click or drag & drop to upload PDF</h3>
            )}
            
            <p className="text-sm text-white/50 max-w-sm">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Works with HDFC, ICICI, SBI, Axis, Kotak, and most computer-generated bank statement PDFs.'}
            </p>
          </label>
        </div>

        {/* Options & Action */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              PDF Password <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Required if your statement is locked"
                className="w-full bg-[#1e222d] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              !file 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : isProcessing 
                  ? 'bg-blue-600/50 text-white/70 cursor-wait' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing & Extracting...
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5" />
                Convert to Excel
              </>
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

      </main>
    </div>
  );
}
