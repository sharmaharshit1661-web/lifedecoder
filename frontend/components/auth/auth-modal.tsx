'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode: 'login' | 'signup'
}

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0'

const AGE_GROUPS = [
  { label: '13–16 years', value: '15', emoji: '🌱' },
  { label: '17–19 years', value: '18', emoji: '🚀' },
  { label: '20–24 years', value: '22', emoji: '💼' },
  { label: '25–30 years', value: '27', emoji: '📈' },
  { label: '30+ years',   value: '32', emoji: '🏆' },
]

export default function AuthModal({ open, onOpenChange, initialMode }: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode]         = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [age, setAge]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [focused, setFocused]   = useState<string | null>(null)

  useEffect(() => { setMode(initialMode) }, [initialMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signup' && !age) { setError('Please select your age group.'); return }
    setLoading(true); setError('')
    try {
      if (mode === 'signup') {
        const r = await api.signup(email, password, name)
        if (r.success) {
          // Store age so quiz-flow can use it
          const stored = JSON.parse(localStorage.getItem('currentUser') || '{}')
          localStorage.setItem('currentUser', JSON.stringify({ ...stored, age }))

          // Pre-fetch AI questions in background — store with age key so we validate on use
          sessionStorage.removeItem('quizQuestions')
          fetch('/api/quiz-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ age }),
          }).then(res => res.json()).then(data => {
            if (data.questions?.length >= 8) {
              // Store with the age so quiz-flow can verify it matches
              sessionStorage.setItem('quizQuestions', JSON.stringify({ ...data, forAge: age }))
            }
          }).catch(() => {})

          onOpenChange(false)
          router.push('/quiz')
        }
      } else {
        const r = await api.signin(email, password)
        if (r.success) {
          onOpenChange(false)
          router.push(r.user.quizCompleted ? '/dashboard' : '/quiz')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally { setLoading(false) }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    background: '#fff',
    border: `1.5px solid ${focused === field ? NL : LD}`,
    color: N,
    height: '46px',
    borderRadius: '10px',
    boxShadow: focused === field ? `0 0 0 3px rgba(37,40,102,0.1)` : 'none',
    transition: 'all 0.2s ease',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden"
        style={{ background: '#fff', border: `1px solid ${LD}`, borderRadius: '20px' }}>

        {/* Gradient top bar */}
        <div className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${N}, ${NL}, #3d4fa8, ${NL}, ${N})`,
            backgroundSize: '200% 100%', animation: 'gradient-shift 3s ease infinite' }} />

        <div className="p-7">
          {/* Header */}
          <div className="mb-6 text-center">
            <img src="/logo.png" alt="LifeDecoder" className="h-12 w-auto object-contain mx-auto mb-3" />
            <DialogTitle className="text-2xl font-bold mb-1" style={{ color: N }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </DialogTitle>
            <p className="text-sm" style={{ color: '#6b6f9e' }}>
              {mode === 'login' ? 'Sign in to continue your journey.' : 'Start mastering adult life today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold" style={{ color: N }}>Full Name</Label>
                <Input placeholder="John Doe" value={name}
                  onChange={e => setName(e.target.value)} required
                  style={inputStyle('name')}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: N }}>Email address</Label>
              <Input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={inputStyle('email')}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: N }}>Password</Label>
              <Input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
                style={inputStyle('password')}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)} />
            </div>

            {/* Age group — only on signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold" style={{ color: N }}>
                  Your Age Group <span style={{ color: '#dc2626' }}>*</span>
                </Label>
                <p className="text-xs" style={{ color: '#6b6f9e' }}>
                  We'll personalise your quiz questions based on your age.
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {AGE_GROUPS.map(g => (
                    <button key={g.value} type="button"
                      onClick={() => setAge(g.value)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all duration-200 hover:scale-105"
                      style={{
                        border: `2px solid ${age === g.value ? NL : LD}`,
                        background: age === g.value ? `rgba(37,40,102,0.08)` : '#fff',
                        boxShadow: age === g.value ? `0 0 0 3px rgba(37,40,102,0.1)` : 'none',
                      }}>
                      <span className="text-xl">{g.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight" style={{ color: age === g.value ? NL : '#6b6f9e' }}>
                        {g.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm p-3 rounded-xl"
                style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full h-12 text-white font-bold rounded-xl btn-shimmer"
              style={{ background: `linear-gradient(135deg, ${N}, ${NL})`,
                boxShadow: '0 6px 20px rgba(17,20,57,0.25)', fontSize: '15px' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </span>
              ) : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: '#6b6f9e' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setAge('') }}
              className="font-bold hover:underline" style={{ color: NL }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
