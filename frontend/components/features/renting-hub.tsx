'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Home, AlertTriangle, CheckCircle, FileText, Shield, Sparkles } from 'lucide-react'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const CHECKLIST = [
  { item: 'Check landlord reviews online', category: 'Before Signing' },
  { item: 'Read the entire lease before signing', category: 'Before Signing' },
  { item: 'Document all existing damage with photos', category: 'Move-In' },
  { item: 'Get all promises in writing', category: 'Before Signing' },
  { item: 'Understand the security deposit terms', category: 'Before Signing' },
  { item: 'Know the notice period to vacate', category: 'Lease Terms' },
  { item: 'Confirm what utilities are included', category: 'Lease Terms' },
  { item: 'Check pet policy and fees', category: 'Lease Terms' },
  { item: 'Know the maintenance request process', category: 'During Tenancy' },
  { item: 'Keep copies of all payments', category: 'During Tenancy' },
]

const RED_FLAGS = [
  { flag: 'Landlord asks for cash only', why: 'No paper trail — major scam indicator' },
  { flag: 'Pressure to sign immediately', why: 'Legitimate landlords give you time to review' },
  { flag: 'Rent far below market rate', why: 'Too good to be true usually is' },
  { flag: 'No written lease offered', why: 'Verbal agreements are hard to enforce' },
  { flag: 'Refuses to show the property', why: 'Classic rental scam tactic' },
]

const TOPICS = [
  'What should I look for in a lease agreement?',
  'How do I get my security deposit back?',
  'What are my rights if my landlord enters without notice?',
  'How do I handle a rent increase?',
  'What is renters insurance and do I need it?',
]

function getToken() {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('currentUser'); return u ? JSON.parse(u).token : null
}
async function awardXP(amount: number, id: string) {
  const token = getToken(); if (!token) return
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ milestoneId: `rent-${id}`, milestoneType: 'moving-out', milestoneName: `Renting: ${id}`, completed: true }),
    })
    const u = localStorage.getItem('currentUser')
    if (u) { const p = JSON.parse(u); p.xp = (p.xp || 0) + amount; localStorage.setItem('currentUser', JSON.stringify(p)) }
  } catch {}
}

export default function RentingHub() {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [xpEarned, setXpEarned] = useState(0)
  const [aiQ, setAiQ] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const toggleCheck = async (i: number) => {
    if (checked.has(i)) { setChecked(prev => { const n = new Set(prev); n.delete(i); return n }); return }
    setChecked(prev => new Set([...prev, i]))
    setXpEarned(p => p + 5)
    await awardXP(5, `checklist-${i}`)
    showToast('+5 XP — Checklist item completed! ✅')
  }

  const askAI = async (q: string) => {
    const question = q || aiQ; if (!question.trim()) return
    setAiLoading(true); setAiAnswer(''); setAiQ(question)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question }],
          systemPrompt: 'You are a tenant rights advisor for young adults. Give practical, clear advice about renting in 3-4 sentences. Mention that laws vary by state/country.'
        })
      })
      const data = await res.json()
      setAiAnswer(data.response || 'Sorry, try again.')
      setXpEarned(p => p + 5); await awardXP(5, `ai-${Date.now()}`)
      showToast('+5 XP for learning! 🧠')
    } catch { setAiAnswer('Could not connect. Please try again.') }
    setAiLoading(false)
  }

  const categories = [...new Set(CHECKLIST.map(c => c.category))]

  return (
    <div className="p-6 md:p-8 space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-white font-semibold text-sm shadow-xl"
          style={{ background: `linear-gradient(135deg,${N},${NL})` }}>{toast}</div>
      )}

      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Home className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Renting 101</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: N }}>Renting 101 Hub</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6f9e' }}>Everything you need to rent smart and stay protected.</p>
          </div>
          {xpEarned > 0 && (
            <div className="px-4 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${N},${NL})` }}>+{xpEarned} XP ⚡</div>
          )}
        </div>
      </div>

      {/* AI */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: N }}>
          <Sparkles className="w-4 h-4" style={{ color: NL }} /> Ask AI About Renting
        </h2>
        <div className="flex gap-2 mb-3">
          <input value={aiQ} onChange={e => setAiQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI('')}
            placeholder="e.g. Can my landlord enter without notice?"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }} />
          <Button onClick={() => askAI('')} disabled={aiLoading || !aiQ.trim()}
            className="text-white px-5" style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
            {aiLoading ? '...' : 'Ask'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {TOPICS.map(t => (
            <button key={t} onClick={() => askAI(t)}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(17,20,57,0.07)', color: N, border: `1px solid ${LD}` }}>
              {t.slice(0, 32)}…
            </button>
          ))}
        </div>
        {aiAnswer && (
          <div className="p-4 rounded-xl text-sm leading-relaxed"
            style={{ background: 'rgba(17,20,57,0.05)', color: '#3d4280', border: `1px solid ${LD}` }}>
            {aiAnswer}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: N }}>
            ✅ Renter's Checklist — Earn 5 XP per item ({checked.size}/{CHECKLIST.length})
          </h2>
          <div className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(17,20,57,0.08)', color: N }}>
            {Math.round(checked.size / CHECKLIST.length * 100)}% done
          </div>
        </div>
        <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: LD }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${checked.size / CHECKLIST.length * 100}%`, background: `linear-gradient(90deg,${N},${NL})` }} />
        </div>
        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b6f9e' }}>{cat}</p>
            {CHECKLIST.filter(c => c.category === cat).map((c, i) => {
              const idx = CHECKLIST.indexOf(c)
              return (
                <div key={idx} onClick={() => toggleCheck(idx)}
                  className="flex items-center gap-3 p-3 rounded-xl mb-1.5 cursor-pointer transition-all"
                  style={{ background: checked.has(idx) ? 'rgba(5,150,105,0.07)' : 'rgba(17,20,57,0.03)',
                    border: `1px solid ${checked.has(idx) ? 'rgba(5,150,105,0.3)' : LD}` }}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: checked.has(idx) ? '#059669' : '#fff', border: `2px solid ${checked.has(idx) ? '#059669' : LD}` }}>
                    {checked.has(idx) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: N, textDecoration: checked.has(idx) ? 'line-through' : 'none', opacity: checked.has(idx) ? 0.6 : 1 }}>
                    {c.item}
                  </span>
                  {!checked.has(idx) && <span className="ml-auto text-xs" style={{ color: '#6b6f9e' }}>+5 XP</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Red Flags */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: N }}>
          <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} /> Rental Scam Red Flags
        </h2>
        <div className="space-y-3">
          {RED_FLAGS.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <span className="text-lg flex-shrink-0">🚩</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>{r.flag}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6f9e' }}>{r.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
