'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, PieChart, Target, MessageSquare, Sparkles, Plus, CheckCircle } from 'lucide-react'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const TIPS = [
  { title: '50/30/20 Rule', desc: 'Spend 50% on needs, 30% on wants, 20% on savings.', icon: '📊', xp: 10 },
  { title: 'Emergency Fund', desc: 'Save 3–6 months of expenses before investing.', icon: '🛡️', xp: 10 },
  { title: 'Credit Score', desc: 'Pay bills on time — it\'s 35% of your credit score.', icon: '💳', xp: 10 },
  { title: 'Compound Interest', desc: 'Start investing early — time is your biggest asset.', icon: '📈', xp: 10 },
  { title: 'Debt Avalanche', desc: 'Pay off highest-interest debt first to save money.', icon: '⚡', xp: 10 },
  { title: 'Automate Savings', desc: 'Set up auto-transfer on payday so you save first.', icon: '🤖', xp: 10 },
]

const TOPICS = [
  { q: 'How do I create a budget?', icon: '📋' },
  { q: 'What is a credit score and how do I improve it?', icon: '💳' },
  { q: 'How do I start investing with little money?', icon: '📈' },
  { q: 'What is the difference between a Roth IRA and 401k?', icon: '🏦' },
  { q: 'How do I get out of debt fast?', icon: '💸' },
  { q: 'What is compound interest?', icon: '🔢' },
]

function getToken() {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('currentUser')
  return u ? JSON.parse(u).token : null
}

async function awardXP(amount: number, activity: string) {
  const token = getToken()
  if (!token) return
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ milestoneId: `finance-${activity}-${Date.now()}`, milestoneType: 'just-turned-18', milestoneName: activity, completed: true }),
    })
    // Update local XP
    const u = localStorage.getItem('currentUser')
    if (u) {
      const parsed = JSON.parse(u)
      parsed.xp = (parsed.xp || 0) + amount
      localStorage.setItem('currentUser', JSON.stringify(parsed))
    }
  } catch {}
}

export default function FinancialHealth() {
  const [readTips, setReadTips] = useState<Set<number>>(new Set())
  const [xpEarned, setXpEarned] = useState(0)
  const [aiQ, setAiQ] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const markTipRead = async (i: number) => {
    if (readTips.has(i)) return
    setReadTips(prev => new Set([...prev, i]))
    const xp = TIPS[i].xp
    setXpEarned(p => p + xp)
    await awardXP(xp, `finance-tip-${i}`)
    showToast(`+${xp} XP earned! 🎉`)
  }

  const askAI = async (question: string) => {
    const q = question || aiQ
    if (!q.trim()) return
    setAiLoading(true); setAiAnswer('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          systemPrompt: 'You are a financial advisor for young adults. Give clear, practical advice in 3-5 sentences. Focus on actionable steps.'
        })
      })
      const data = await res.json()
      setAiAnswer(data.response || 'Sorry, try again.')
      await awardXP(5, `finance-ai-${Date.now()}`)
      setXpEarned(p => p + 5)
      showToast('+5 XP for asking a question! 🧠')
    } catch { setAiAnswer('Could not connect. Please try again.') }
    setAiLoading(false)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-white font-semibold text-sm shadow-xl anim-bounce-in"
          style={{ background: `linear-gradient(135deg,${N},${NL})` }}>{toast}</div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <TrendingUp className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Financial Health</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: N }}>Finance Hub</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6f9e' }}>Learn money skills, ask AI, earn XP.</p>
          </div>
          {xpEarned > 0 && (
            <div className="px-4 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
              +{xpEarned} XP earned this session ⚡
            </div>
          )}
        </div>
      </div>

      {/* AI Ask */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: N }}>
          <Sparkles className="w-4 h-4" style={{ color: NL }} /> Ask AI About Finance
        </h2>
        <div className="flex gap-2 mb-3">
          <input value={aiQ} onChange={e => setAiQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAI('')}
            placeholder="e.g. How do I build an emergency fund?"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{ border: `1.5px solid ${LD}`, color: N, background: '#fff' }} />
          <Button onClick={() => askAI('')} disabled={aiLoading || !aiQ.trim()}
            className="text-white font-semibold px-5"
            style={{ background: `linear-gradient(135deg,${N},${NL})` }}>
            {aiLoading ? '...' : 'Ask'}
          </Button>
        </div>
        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {TOPICS.map(t => (
            <button key={t.q} onClick={() => { setAiQ(t.q); askAI(t.q) }}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(17,20,57,0.07)', color: N, border: `1px solid ${LD}` }}>
              {t.icon} {t.q.slice(0, 28)}…
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

      {/* Tips — click to earn XP */}
      <div>
        <h2 className="font-bold mb-3" style={{ color: N }}>
          💡 Financial Tips — Click to Read & Earn XP ({readTips.size}/{TIPS.length})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPS.map((tip, i) => (
            <div key={i} onClick={() => markTipRead(i)}
              className="rounded-2xl p-4 cursor-pointer transition-all duration-200 bg-white"
              style={{ border: `1.5px solid ${readTips.has(i) ? '#059669' : LD}`,
                background: readTips.has(i) ? 'rgba(5,150,105,0.05)' : '#fff' }}
              onMouseEnter={e => { if (!readTips.has(i)) e.currentTarget.style.borderColor = NL }}
              onMouseLeave={e => { if (!readTips.has(i)) e.currentTarget.style.borderColor = LD }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{tip.icon}</span>
                {readTips.has(i)
                  ? <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                  : <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(17,20,57,0.08)', color: N }}>+{tip.xp} XP</span>}
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: N }}>{tip.title}</h3>
              <p className="text-xs" style={{ color: '#6b6f9e' }}>{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spending breakdown visual */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <h2 className="font-bold mb-4" style={{ color: N }}>📊 50/30/20 Budget Rule</h2>
        {[
          { label: 'Needs (50%)', pct: 50, color: N, ex: 'Rent, food, utilities, transport' },
          { label: 'Wants (30%)', pct: 30, color: NL, ex: 'Entertainment, dining out, hobbies' },
          { label: 'Savings (20%)', pct: 20, color: '#059669', ex: 'Emergency fund, investments, debt payoff' },
        ].map(b => (
          <div key={b.label} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold" style={{ color: N }}>{b.label}</span>
              <span style={{ color: '#6b6f9e' }}>{b.ex}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: LD }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
