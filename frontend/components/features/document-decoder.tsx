'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, FileText, ChevronRight, Upload, Sparkles, Eye, Download, X } from 'lucide-react'
import { api } from '@/lib/api'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const DOCUMENTS = [
  { id: 1, name: 'Tax Return (1040)',      category: 'Finance',  difficulty: 'Advanced',     pdfPath: '/tax_return.pdf',         docType: 'tax',       explanation: 'A tax return reports your annual income and calculates taxes owed or refunds due.' },
  { id: 2, name: 'Lease Agreement',        category: 'Housing',  difficulty: 'Intermediate', pdfPath: '/Lease_Agreement.pdf',    docType: 'lease',     explanation: 'A legal contract outlining the terms and conditions of renting a property.' },
  { id: 3, name: 'Job Contract',           category: 'Career',   difficulty: 'Intermediate', pdfPath: '/job_contract.pdf',       docType: 'contract',  explanation: 'An employment agreement that defines your job responsibilities, salary, and benefits.' },
  { id: 4, name: 'Insurance Policy',       category: 'Finance',  difficulty: 'Advanced',     pdfPath: '/insurance_policy.pdf',   docType: 'insurance', explanation: 'A contract that provides financial protection against specific risks.' },
  { id: 5, name: 'Credit Report',          category: 'Finance',  difficulty: 'Beginner',     pdfPath: '/credit_report (1).pdf',  docType: 'credit',    explanation: 'A detailed record of your credit history and creditworthiness.' },
]

export default function DocumentDecoder() {
  const [showUpload, setShowUpload]         = useState(false)
  const [documentText, setDocumentText]     = useState('')
  const [documentType, setDocumentType]     = useState('lease')
  const [analyzing, setAnalyzing]           = useState(false)
  const [analysis, setAnalysis]             = useState<any>(null)
  const [selectedDoc, setSelectedDoc]       = useState<any>(null)
  const [showPdf, setShowPdf]               = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Handle file picked from device
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFileName(file.name)
    setShowUpload(true)
    setAnalysis(null)

    // Auto-detect type
    const n = file.name.toLowerCase()
    if (n.includes('lease') || n.includes('rent'))          setDocumentType('lease')
    else if (n.includes('tax') || n.includes('1040'))       setDocumentType('tax')
    else if (n.includes('insurance'))                       setDocumentType('insurance')
    else if (n.includes('medical') || n.includes('bill'))   setDocumentType('medical')
    else if (n.includes('contract') || n.includes('job'))   setDocumentType('contract')
    else if (n.includes('credit'))                          setDocumentType('credit')

    if (file.type === 'application/pdf') {
      setDocumentText(`[PDF: ${file.name}] — Click "Decode Document" to analyze this PDF.`)
      ;(window as any).__uploadFile = file
    } else {
      const text = await file.text()
      setDocumentText(text)
      ;(window as any).__uploadFile = null
    }
  }

  const handleAnalyze = async () => {
    if (!documentText.trim()) return
    setAnalyzing(true)
    setAnalysis(null)

    try {
      const pendingFile = (window as any).__uploadFile
      const currentUser = localStorage.getItem('currentUser')
      const token = currentUser ? JSON.parse(currentUser).token : null

      if (pendingFile && pendingFile.type === 'application/pdf' && token) {
        // Upload PDF to backend
        const form = new FormData()
        form.append('document', pendingFile)
        form.append('documentType', documentType)
        form.append('title', pendingFile.name)

        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/upload`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
        )

        if (uploadRes.ok) {
          const analyzeRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/analyze`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ query: 'Analyze this document for key information, issues, and recommendations', documentType }),
            }
          )
          if (analyzeRes.ok) {
            const data = await analyzeRes.json()
            setAnalysis(data.analysis)
            setAnalyzing(false)
            return
          }
        }
      }

      // Fallback: text-based decode
      const res = await api.decodeDocument(documentText, documentType)
      if (res.success) setAnalysis(res.analysis || { summary: res.explanation || 'Analysis complete.' })
      else setAnalysis({ summary: res.error || 'Analysis failed.' })
    } catch (err: any) {
      setAnalysis({ summary: `Error: ${err.message}` })
    }
    setAnalyzing(false)
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <BookOpen className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Understand Real Documents</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: N }}>Document Decoder</h1>
        <p className="text-sm" style={{ color: '#6b6f9e' }}>
          Confused by official documents? Upload or paste any document and AI will explain it in plain English.
        </p>
      </div>

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => { setShowUpload(v => !v); setUploadedFileName('') }}
          style={{ background: `linear-gradient(135deg,${N},${NL})` }}
          className="text-white font-semibold">
          <Upload className="w-4 h-4 mr-2" /> Paste / Type Text
        </Button>

        {/* Upload from device */}
        <label className="cursor-pointer">
          <input ref={fileRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileChange} />
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}
            onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> Upload from Device
          </span>
        </label>

        {uploadedFileName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
            📄 {uploadedFileName}
          </span>
        )}
      </div>

      {/* PDF Viewer */}
      {showPdf && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,20,57,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col"
            style={{ border: `1.5px solid ${LD}` }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: LD }}>
              <h3 className="font-bold" style={{ color: N }}>{selectedDoc.name}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(selectedDoc.pdfPath, '_blank')}
                  style={{ borderColor: LD, color: N }}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPdf(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe src={selectedDoc.pdfPath} className="w-full h-full rounded-lg"
                style={{ border: `1px solid ${LD}` }} title={selectedDoc.name} />
            </div>
          </div>
        </div>
      )}

      {/* Upload / Paste section */}
      {showUpload && (
        <div className="rounded-2xl p-6 mb-6 bg-white" style={{ border: `1.5px solid ${LD}` }}>
          <h3 className="font-bold mb-4" style={{ color: N }}>
            {uploadedFileName ? `Analyzing: ${uploadedFileName}` : 'Paste Your Document Text'}
          </h3>
          <Textarea
            placeholder="Paste your lease agreement, medical bill, contract, or any document text here…"
            value={documentText}
            onChange={e => setDocumentText(e.target.value)}
            className="min-h-[180px] mb-4"
            style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }}
          />
          <div className="flex gap-3 flex-wrap items-center">
            <select value={documentType} onChange={e => setDocumentType(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }}>
              <option value="lease">Lease Agreement</option>
              <option value="medical">Medical Bill</option>
              <option value="insurance">Insurance Policy</option>
              <option value="contract">Job Contract</option>
              <option value="tax">Tax Document</option>
              <option value="credit">Credit Report</option>
              <option value="general">General Document</option>
            </select>
            <Button onClick={handleAnalyze} disabled={!documentText.trim() || analyzing}
              className="flex-1 text-white font-semibold"
              style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
              {analyzing ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" />Analyzing…</> : <><Sparkles className="w-4 h-4 mr-2" />Decode Document</>}
            </Button>
          </div>

          {/* Analysis result */}
          {analysis && (
            <div className="mt-5 space-y-3">
              {analysis.summary && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(37,40,102,0.06)', border: `1px solid ${LD}` }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: N }}>📋 Summary</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#3d4280' }}>{analysis.summary}</p>
                </div>
              )}
              {analysis.keyPoints?.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: '#059669' }}>✅ Key Points</h4>
                  <ul className="space-y-1">{analysis.keyPoints.map((p: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: '#3d4280' }}><span>•</span><span>{p}</span></li>
                  ))}</ul>
                </div>
              )}
              {analysis.redFlags?.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: '#dc2626' }}>🚩 Red Flags</h4>
                  <ul className="space-y-1">{analysis.redFlags.map((f: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: '#dc2626' }}><span>⚠️</span><span>{f}</span></li>
                  ))}</ul>
                </div>
              )}
              {analysis.recommendations?.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: '#d97706' }}>💡 Recommendations</h4>
                  <ul className="space-y-1">{analysis.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: '#3d4280' }}><span>→</span><span>{r}</span></li>
                  ))}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sample documents */}
      <h2 className="text-lg font-bold mb-4" style={{ color: N }}>Sample Documents</h2>
      <div className="space-y-3">
        {DOCUMENTS.map(doc => (
          <div key={doc.id} className="rounded-2xl p-5 bg-white group cursor-pointer transition-all duration-200"
            style={{ border: `1.5px solid ${LD}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = NL; e.currentTarget.style.boxShadow = '0 4px 16px rgba(17,20,57,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = LD; e.currentTarget.style.boxShadow = 'none' }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold mb-1" style={{ color: N }}>{doc.name}</h3>
                <p className="text-xs mb-3" style={{ color: '#6b6f9e' }}>{doc.explanation}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(17,20,57,0.07)', color: N }}>{doc.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg,${N},${NL})` }}>{doc.difficulty}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => { setSelectedDoc(doc); setShowPdf(true) }}
                    className="text-white text-xs" style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View PDF
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    style={{ borderColor: LD, color: N }}
                    onClick={() => {
                      setDocumentType(doc.docType)
                      setDocumentText(`[Sample: ${doc.name}]\n\n${doc.explanation}\n\nThis is a sample document. Paste the actual text above to get a full AI analysis.`)
                      setShowUpload(true)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Analyze
                  </Button>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: '#6b6f9e' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
