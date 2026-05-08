'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Scale, Search, Home, Briefcase, ShoppingCart, Heart, Sparkles, CheckCircle } from 'lucide-react'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const RIGHTS = [
  {
    category: 'Tenant Rights', icon: '🏠', color: '#2563eb',
    rights: [
      { right: 'Right to habitable living conditions', detail: 'Landlord must maintain heat, water, and safe structure.' },
      { right: 'Right to privacy (24-hour notice for entry)', detail: 'Except in emergencies, landlord must give advance notice.' },
      { right: 'Security deposit return within 30 days', detail: 'Must receive itemized deductions if any are made.' },
      { right: 'Protection from discrimination', detail: 'Fair Housing Act protects race, religion, sex, disability, and more.' },
      { right: 'Right to withhold rent for uninhabitable conditions', detail: 'In many states, you can withhold rent until repairs are made.' },
    ]
  },
  {
    category: 'Employee Rights', icon: '💼', color: '#7c3aed',
    rights: [
      { right: 'Right to minimum wage and overtime pay', detail: 'Federal minimum wage is $7.25/hr; overtime is 1.5x after 40 hrs/week.' },
      { right: 'Right to safe working conditions (OSHA)', detail: 'Employer must provide a safe workplace free from known hazards.' },
      { right: 'Protection from workplace discrimination', detail: 'Title VII protects race, color, religion, sex, and national origin.' },
      { right: 'Right to take unpaid leave (FMLA)', detail: 'Up to 12 weeks unpaid leave for family/medical reasons at qualifying employers.' },
      { right: 'Right to organize and join a union', detail: 'NLRA protects your right to collective bargaining.' },
    ]
  },
  {
    category: 'Consumer Rights', icon: '🛒', color: '#059669',
    rights: [
      { right: 'Right to accurate product information', detail: 'FTC requires truthful advertising and labeling.' },
      { right: 'Right to dispute credit report errors', detail: 'FCRA gives you the right to dispute inaccurate information for free.' },
      { right: 'Protection from predatory lending', detail: 'TILA requires lenders to disclose all loan terms clearly.' },
      { right: 'Right to cancel contracts within cooling-off period', detail: 'FTC gives 3 days to cancel door-to-door sales contracts.' },
      { right: 'Right to a refund for defective products', detail: 'Implied warranty of merchantability applies to most purchases.' },
    ]
  },
  {
    category: 'Healthcare Rights', icon: '🏥', color: '#dc2626',
    rights: [
      { right: 'Right to access your medical records', detail: 'HIPAA gives you the right to see and copy your records within 30 days.' },
      { right: 'Right to emergency care regardless of ability to pay', detail: 'EMTALA requires hospitals to treat emergency conditions.' },
      { right: 'Protection of health information (HIPAA)', detail: 'Your medical info cannot be shared without your consent.' },
      { right: 'Right to appeal insurance denials', detail: 'ACA requires insurers to have an appeals process.' },
      { right: 'Right to informed consent', detail: 'Doctors must explain procedures and get your agreement before treatment.' },
    ]
  },
]

const TOPICS = [
  'What are my rights if I get fired?',
  'Can my landlord evict me without notice?',
  'What should I do if a company violates my consumer rights?',
  'How do I file a complaint against my employer?',
  'What is the difference between at-will employment and a contract?',
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
      body: JSON.stringify({ milestoneId: `rights-${id}`, milestoneType: 'just-turned-18', milestoneName: `Rights: ${id}`, completed: true }),
    })
    const u = localStorage.getItem('currentUser')
    if (u) { const p = JSON.parse(u); p.xp = (p.xp || 0) + amount; localStorage.setItem('currentUser', JSON.stringify(p)) }
  } catch {}
}

export default function RightsGuide() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [learnedRights, setLearnedRights] = useState<Set<string>>(new Set())
  const [xpEarned, setXpEarned] = useState(0)
  const [aiQ, setAiQ] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const learnRight = async (key: string) => {
    if (learnedRights.has(key)) return
    setLearnedRights(prev => new Set([...prev, key]))
    setXpEarned(p => p + 6)
    await awardXP(6, key)
    showToast('+6 XP — Right learned! ⚖️')
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
          systemPrompt: 'You are a legal rights advisor for young adults. Explain legal rights clearly in 3-4 sentences. Always note that laws vary by state/country and recommend consulting a lawyer for serious matters.'
        })
      })
      const data = await res.json()
      setAiAnswer(data.response || 'Sorry, try again.')
      setXpEarned(p => p + 5); await awardXP(5, `ai-${Date.now()}`)
      showToast('+5 XP for learning! 🧠')
    } catch { setAiAnswer('Could not connect. Please try again.') }
    setAiLoading(false)
  }

  const filtered = RIGHTS.filter(cat =>
    cat.category.toLowerCase().includes(search.toLowerCase()) ||
    cat.rights.some(r => r.right.toLowerCase().includes(search.toLowerCase()) || r.detail.toLowerCase().includes(search.toLowerCase()))
  )

  const totalRights = RIGHTS.reduce((s, c) => s + c.rights.length, 0)

  return (
    <div className="p-6 md:p-8 space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-white font-semibold text-sm shadow-xl"
          style={{ background: `linear-gradient(135deg,${N},${NL})` }}>{toast}</div>
      )}

      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Scale className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Know Your Rights</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: N }}>Legal Rights Guide</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6f9e' }}>Know your rights as a tenant, employee, consumer, and patient.</p>
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
          <Sparkles className="w-4 h-4" style={{ color: NL }} /> Ask AI About Your Rights
        </h2>
        <div className="flex gap-2 mb-3">
          <input value={aiQ} onChange={e => setAiQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI('')}
            placeholder="e.g. Can my employer fire me without reason?"
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: '#6b6f9e' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search rights…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }} />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: LD }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${learnedRights.size / totalRights * 100}%`, background: `linear-gradient(90deg,${N},${NL})` }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: N }}>{learnedRights.size}/{totalRights} learned</span>
      </div>

      {/* Rights categories */}
      <div className="space-y-4">
        {filtered.map(cat => (
          <div key={cat.category} className="rounded-2xl overflow-hidden bg-white" style={{ border: `1.5px solid ${LD}` }}>
            <button className="w-full flex items-center gap-3 p-5 text-left"
              onClick={() => setExpanded(expanded === cat.category ? null : cat.category)}>
              <span className="text-2xl">{cat.icon}</span>
              <div className="flex-1">
                <h2 className="font-bold" style={{ color: N }}>{cat.category}</h2>
                <p className="text-xs" style={{ color: '#6b6f9e' }}>
                  {cat.rights.filter(r => learnedRights.has(`${cat.category}-${r.right}`)).length}/{cat.rights.length} learned
                </p>
              </div>
              <span className="text-lg">{expanded === cat.category ? '▲' : '▼'}</span>
            </button>

            {expanded === cat.category && (
              <div className="px-5 pb-5 space-y-2">
                {cat.rights.map(r => {
                  const key = `${cat.category}-${r.right}`
                  const learned = learnedRights.has(key)
                  return (
                    <div key={r.right} onClick={() => learnRight(key)}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{ background: learned ? 'rgba(5,150,105,0.06)' : 'rgba(17,20,57,0.03)',
                        border: `1px solid ${learned ? 'rgba(5,150,105,0.25)' : LD}` }}
                      onMouseEnter={e => { if (!learned) e.currentTarget.style.borderColor = NL }}
                      onMouseLeave={e => { if (!learned) e.currentTarget.style.borderColor = LD }}>
                      {learned
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#059669' }} />
                        : <span className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2" style={{ borderColor: LD }} />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: N }}>{r.right}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6f9e' }}>{r.detail}</p>
                      </div>
                      {!learned && <span className="text-xs flex-shrink-0" style={{ color: '#6b6f9e' }}>+6 XP</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
