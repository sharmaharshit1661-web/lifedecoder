'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, DollarSign, Phone, Sparkles, CheckCircle } from 'lucide-react'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const TERMS = [
  { term: 'Premium', def: 'Monthly payment for your insurance plan.', ex: '$200/month', icon: '💰' },
  { term: 'Deductible', def: 'Amount you pay before insurance kicks in.', ex: '$1,500/year', icon: '🎯' },
  { term: 'Copay', def: 'Fixed fee per doctor visit or prescription.', ex: '$25/visit', icon: '🏥' },
  { term: 'Out-of-Pocket Max', def: 'Max you pay in a year — then insurance covers 100%.', ex: '$6,000/year', icon: '🛡️' },
  { term: 'In-Network', def: 'Doctors/hospitals your insurance has deals with (cheaper).', ex: 'Save 40-60%', icon: '✅' },
  { term: 'EOB', def: 'Explanation of Benefits — shows what insurance paid.', ex: 'Check for errors', icon: '📄' },
]

const CARE_TYPES = [
  { type: 'Emergency Room', when: 'Life-threatening: chest pain, severe bleeding, stroke symptoms', cost: '$$$', color: '#dc2626', icon: '🚨' },
  { type: 'Urgent Care', when: 'Non-life-threatening but urgent: sprains, minor cuts, high fever', cost: '$$', color: '#d97706', icon: '⚡' },
  { type: 'Primary Care', when: 'Routine checkups, prescriptions, chronic conditions', cost: '$', color: '#059669', icon: '👨‍⚕️' },
  { type: 'Telehealth', when: 'Minor issues, mental health, follow-ups — from home', cost: '$', color: '#2563eb', icon: '💻' },
]

const TOPICS = [
  'How do I find a doctor that accepts my insurance?',
  'What should I do if I get a surprise medical bill?',
  'How do I appeal an insurance denial?',
  'What is COBRA insurance?',
  'How do I get mental health coverage?',
]

function getToken() {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('currentUser')
  return u ? JSON.parse(u).token : null
}

async function awardXP(amount: number, id: string) {
  const token = getToken(); if (!token) return
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ milestoneId: `health-${id}`, milestoneType: 'just-turned-18', milestoneName: `Healthcare: ${id}`, completed: true }),
    })
    const u = localStorage.getItem('currentUser')
    if (u) { const p = JSON.parse(u); p.xp = (p.xp || 0) + amount; localStorage.setItem('currentUser', JSON.stringify(p)) }
  } catch {}
}

export default function HealthcareNavigator() {
  const [learnedTerms, setLearnedTerms] = useState<Set<number>>(new Set())
  const [xpEarned, setXpEarned] = useState(0)
  const [aiQ, setAiQ] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const learnTerm = async (i: number) => {
    if (learnedTerms.has(i)) return
    setLearnedTerms(prev => new Set([...prev, i]))
    setXpEarned(p => p + 8)
    await awardXP(8, `term-${i}`)
    showToast('+8 XP — Healthcare term learned! 🏥')
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
          systemPrompt: 'You are a healthcare advisor for young adults. Explain healthcare concepts clearly in 3-4 sentences. Always recommend consulting a doctor for medical decisions.'
        })
      })
      const data = await res.json()
      setAiAnswer(data.response || 'Sorry, try again.')
      setXpEarned(p => p + 5); await awardXP(5, `ai-${Date.now()}`)
      showToast('+5 XP for learning! 🧠')
    } catch { setAiAnswer('Could not connect. Please try again.') }
    setAiLoading(false)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-white font-semibold text-sm shadow-xl"
          style={{ background: `linear-gradient(135deg,${N},${NL})` }}>{toast}</div>
      )}

      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Heart className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Healthcare Navigator</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: N }}>Healthcare Navigator</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6f9e' }}>Understand insurance, find care, know your rights.</p>
          </div>
          {xpEarned > 0 && (
            <div className="px-4 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${N},${NL})` }}>+{xpEarned} XP ⚡</div>
          )}
        </div>
      </div>

      {/* AI Ask */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: N }}>
          <Sparkles className="w-4 h-4" style={{ color: NL }} /> Ask AI About Healthcare
        </h2>
        <div className="flex gap-2 mb-3">
          <input value={aiQ} onChange={e => setAiQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI('')}
            placeholder="e.g. How do I find a doctor?"
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
              {t.slice(0, 30)}…
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

      {/* Insurance Terms */}
      <div>
        <h2 className="font-bold mb-3" style={{ color: N }}>
          📚 Insurance Terms — Click to Learn & Earn XP ({learnedTerms.size}/{TERMS.length})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TERMS.map((t, i) => (
            <div key={i} onClick={() => learnTerm(i)}
              className="rounded-2xl p-4 cursor-pointer transition-all bg-white"
              style={{ border: `1.5px solid ${learnedTerms.has(i) ? '#059669' : LD}`,
                background: learnedTerms.has(i) ? 'rgba(5,150,105,0.05)' : '#fff' }}
              onMouseEnter={e => { if (!learnedTerms.has(i)) e.currentTarget.style.borderColor = NL }}
              onMouseLeave={e => { if (!learnedTerms.has(i)) e.currentTarget.style.borderColor = LD }}>
              <div className="flex justify-between mb-2">
                <span className="text-2xl">{t.icon}</span>
                {learnedTerms.has(i)
                  ? <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                  : <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(17,20,57,0.08)', color: N }}>+8 XP</span>}
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: N }}>{t.term}</h3>
              <p className="text-xs mb-1" style={{ color: '#6b6f9e' }}>{t.def}</p>
              <p className="text-xs font-semibold" style={{ color: NL }}>Example: {t.ex}</p>
            </div>
          ))}
        </div>
      </div>

      {/* When to go where */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-4" style={{ color: N }}>🏥 Where Should You Go?</h2>
        <div className="space-y-3">
          {CARE_TYPES.map(c => (
            <div key={c.type} className="flex items-start gap-4 p-4 rounded-xl"
              style={{ background: `${c.color}08`, border: `1px solid ${c.color}25` }}>
              <span className="text-2xl flex-shrink-0">{c.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm" style={{ color: N }}>{c.type}</h3>
                  <span className="text-xs font-bold" style={{ color: c.color }}>{c.cost}</span>
                </div>
                <p className="text-xs" style={{ color: '#6b6f9e' }}>{c.when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rights */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-3" style={{ color: N }}>⚖️ Your Medical Bill Rights</h2>
        {['You can negotiate medical bills — most hospitals offer payment plans.',
          'Always request an itemized bill to check for errors.',
          'Medical debt cannot be reported to credit bureaus for 1 year.',
          'You may qualify for financial assistance or charity care.',
          'You have the right to appeal any insurance denial.'].map((r, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b last:border-0" style={{ borderColor: LD }}>
            <span style={{ color: '#059669' }}>✓</span>
            <span className="text-sm" style={{ color: '#3d4280' }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
