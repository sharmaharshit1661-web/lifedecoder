'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, BookOpen, Zap, Target, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface QuizResultsProps {
  score: number
  answers: Record<string, string | string[]>
  onFinish: () => void
}

const N = '#0a2540'; const NL = '#00ABE4'; const L = '#E9F1FA'; const LD = '#c8dff0';

// All correct answers — mirrors backend
const CORRECT_ANSWERS: Record<string, string> = {
  credit:     'To assess your creditworthiness for loans and rentals',
  taxes:      'A document showing your annual wages and taxes withheld',
  insurance:  'The amount you pay before insurance starts covering costs',
  renting:    "Security deposit and first month's rent",
  finance:    '3-6 months of expenses',
  employment: 'Income before any deductions',
  rights:     'No, they must provide reasonable notice except in emergencies',
  debt:       'You pay significantly more in interest over time',
  healthcare: 'For non-life-threatening issues like minor injuries or flu',
  investing:  'An employer-sponsored retirement savings plan',
  contracts:  'Read it carefully and ask questions about unclear terms',
  budgeting:  '50% needs, 30% wants, 20% savings',
}

const CATEGORY_META: Record<string, { label: string; icon: string; href: string; courseId: string; courseTitle: string; simulation?: string; tip: string }> = {
  credit:     { label: 'Credit Scores',        icon: '💳', href: '/finance',      courseId: 'emergency-fund',       courseTitle: 'Create an Emergency Fund',              simulation: 'salary-negotiation', tip: 'Build credit early — it unlocks better rates on everything.' },
  taxes:      { label: 'Filing Taxes',          icon: '🧾', href: '/courses',      courseId: 'taxes-20-min',         courseTitle: 'File Taxes in 20 Minutes',              tip: 'Filing taxes is mandatory. Learn before your first deadline.' },
  insurance:  { label: 'Health Insurance',      icon: '🏥', href: '/healthcare',   courseId: 'insurance-basics',     courseTitle: 'What is Insurance',                    tip: 'Deductibles and premiums — know the difference before you need care.' },
  renting:    { label: 'Renting & Leases',      icon: '🏠', href: '/renting',      courseId: 'lease-agreements',     courseTitle: 'Understanding Lease Agreements',        simulation: 'lease-negotiation', tip: 'Always read your lease — every clause is legally binding.' },
  finance:    { label: 'Emergency Fund',        icon: '💰', href: '/finance',      courseId: 'emergency-fund',       courseTitle: 'Create an Emergency Fund',              simulation: 'budget-crisis', tip: '3–6 months of expenses saved = real financial security.' },
  employment: { label: 'Pay & Employment',      icon: '💼', href: '/courses',      courseId: 'employment-contract',  courseTitle: 'Understanding Employment Contracts',    simulation: 'job-interview', tip: 'Gross vs net pay — know what you\'re actually taking home.' },
  rights:     { label: 'Tenant Rights',         icon: '⚖️', href: '/rights',       courseId: 'lease-agreements',     courseTitle: 'Understanding Lease Agreements',        tip: 'Landlords must give notice. Know your rights before you rent.' },
  debt:       { label: 'Managing Debt',         icon: '📉', href: '/finance',      courseId: 'emergency-fund',       courseTitle: 'Create an Emergency Fund',              simulation: 'budget-crisis', tip: 'Minimum payments cost you thousands in interest over time.' },
  healthcare: { label: 'Healthcare Navigation', icon: '🩺', href: '/healthcare',   courseId: 'medical-bill',         courseTitle: 'Read a Medical Bill',                  tip: 'Urgent care vs ER — the right choice saves time and money.' },
  investing:  { label: 'Investing & 401(k)',    icon: '📈', href: '/finance',      courseId: 'negotiate-salary',     courseTitle: 'Negotiate Your Salary',                simulation: 'salary-negotiation', tip: 'A 401(k) match is free money — never leave it on the table.' },
  contracts:  { label: 'Reading Contracts',     icon: '📝', href: '/documents',    courseId: 'employment-contract',  courseTitle: 'Understanding Employment Contracts',    tip: 'Read every word before signing — no exceptions.' },
  budgeting:  { label: 'Budgeting (50/30/20)',  icon: '📊', href: '/finance',      courseId: 'emergency-fund',       courseTitle: 'Create an Emergency Fund',              simulation: 'budget-crisis', tip: 'The 50/30/20 rule is the simplest path to financial control.' },
}

function getTier(score: number) {
  if (score >= 85) return { label: 'Expert',     emoji: '🏆', color: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.2)' }
  if (score >= 65) return { label: 'Competent',  emoji: '🎯', color: '#2563eb', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.2)' }
  if (score >= 40) return { label: 'Learning',   emoji: '📚', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' }
  return             { label: 'Beginner',   emoji: '🌱', color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)' }
}

function getMessage(score: number) {
  if (score >= 85) return "Outstanding! You're an adulting expert!"
  if (score >= 65) return "Great job! You have solid life skills knowledge!"
  if (score >= 40) return "Good start! Keep learning to level up!"
  return "No worries! LifeDecoder will help you master these skills!"
}

// Animated counter
function AnimatedScore({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 20)
    return () => clearInterval(t)
  }, [target])
  return <>{val}</>
}

export default function QuizResults({ score, answers, onFinish }: QuizResultsProps) {
  const [showRecs, setShowRecs] = useState(false)
  const tier = getTier(score)
  const C = 2 * Math.PI * 44

  // Compute weak/strong from answers
  const weakCategories = Object.entries(CORRECT_ANSWERS)
    .filter(([cat, correct]) => answers[cat] !== correct)
    .map(([cat]) => cat)

  const strongCategories = Object.entries(CORRECT_ANSWERS)
    .filter(([cat, correct]) => answers[cat] === correct)
    .map(([cat]) => cat)

  // Build recommendations: weak first, then score-based extras
  const recommendations = [
    ...weakCategories.slice(0, 4).map(cat => ({
      cat, meta: CATEGORY_META[cat], urgency: 'high' as const,
      reason: 'You missed this in the quiz — let\'s fix it!',
    })),
    ...(score < 65 && !weakCategories.includes('budgeting') ? [{
      cat: 'budgeting', meta: CATEGORY_META['budgeting'], urgency: 'medium' as const,
      reason: 'A great foundation for financial health.',
    }] : []),
    ...(score >= 65 && !weakCategories.includes('investing') ? [{
      cat: 'investing', meta: CATEGORY_META['investing'], urgency: 'low' as const,
      reason: 'You\'re ready to level up to investing.',
    }] : []),
  ].slice(0, 5)

  useEffect(() => {
    const t = setTimeout(() => setShowRecs(true), 800)
    return () => clearTimeout(t)
  }, [])

  const progress = score / 100

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: `linear-gradient(160deg, ${L} 0%, #EEEEF2 60%, #E8E8F0 100%)` }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header badge */}
        <div className="text-center anim-slide-up">
          <img src="/logo.png" alt="LifeDecoder" className="h-10 w-auto object-contain mx-auto mb-3" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-2"
            style={{ background: '#fff', border: `1px solid ${LD}`, color: N, boxShadow: '0 2px 12px rgba(17,20,57,0.08)' }}>
            <Sparkles className="w-4 h-4" style={{ color: NL }} />
            Assessment Complete!
          </div>
          <h1 className="text-2xl font-bold" style={{ color: N }}>
            Your <span style={{ background: `linear-gradient(90deg, ${N}, ${NL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LifeDecoder Score</span>
          </h1>
        </div>

        {/* Score card */}
        <div className="rounded-2xl p-6 bg-white anim-fade-scale" style={{ border: `1.5px solid ${LD}`, boxShadow: '0 8px 32px rgba(17,20,57,0.1)' }}>
          <div className="flex items-center gap-6">
            {/* Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" strokeWidth="7" fill="none" stroke={LD} />
                <circle cx="50" cy="50" r="44" strokeWidth="7" fill="none"
                  stroke={`url(#scoreGrad)`}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)' }} />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={N} />
                    <stop offset="100%" stopColor={NL} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: N }}>
                  <AnimatedScore target={score} />
                </span>
                <span className="text-xs font-medium" style={{ color: '#6b6f9e' }}>/ 100</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                {tier.emoji} {tier.label}
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: N }}>{getMessage(score)}</h2>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: '#059669' }}>{strongCategories.length}</div>
                  <div className="text-xs" style={{ color: '#6b6f9e' }}>Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: '#dc2626' }}>{weakCategories.length}</div>
                  <div className="text-xs" style={{ color: '#6b6f9e' }}>To improve</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: NL }}>+50</div>
                  <div className="text-xs" style={{ color: '#6b6f9e' }}>XP earned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${LD}` }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#6b6f9e' }}>CATEGORY BREAKDOWN</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.entries(CORRECT_ANSWERS).map(([cat, correct]) => {
                const isCorrect = answers[cat] === correct
                const meta = CATEGORY_META[cat]
                return (
                  <div key={cat} className="flex items-center gap-1.5 p-2 rounded-lg text-xs"
                    style={{ background: isCorrect ? 'rgba(5,150,105,0.07)' : 'rgba(220,38,38,0.06)',
                      border: `1px solid ${isCorrect ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.15)'}` }}>
                    <span>{meta.icon}</span>
                    <span className="truncate font-medium" style={{ color: isCorrect ? '#059669' : '#dc2626' }}>
                      {meta.label.split(' ')[0]}
                    </span>
                    {isCorrect
                      ? <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: '#059669' }} />
                      : <XCircle className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: '#dc2626' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {showRecs && recommendations.length > 0 && (
          <div className="anim-slide-up-1">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: NL }} />
              <h3 className="font-bold" style={{ color: N }}>
                Your Personalized Learning Plan
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
                style={{ background: 'rgba(17,20,57,0.08)', color: N }}>
                {recommendations.length} recommendations
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map(({ cat, meta, urgency, reason }, i) => (
                <div key={cat} className="rounded-2xl p-4 bg-white anim-slide-up"
                  style={{ border: `1.5px solid ${urgency === 'high' ? 'rgba(220,38,38,0.2)' : LD}`,
                    animationDelay: `${i * 0.1}s`,
                    boxShadow: urgency === 'high' ? '0 4px 16px rgba(220,38,38,0.06)' : '0 2px 8px rgba(17,20,57,0.05)' }}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: urgency === 'high' ? 'rgba(220,38,38,0.08)' : 'rgba(17,20,57,0.06)' }}>
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm" style={{ color: N }}>{meta.label}</h4>
                        {urgency === 'high' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                            Needs work
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#6b6f9e' }}>{reason}</p>
                      <p className="text-xs italic mb-3" style={{ color: '#3d4280' }}>💡 {meta.tip}</p>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Link href={meta.href}>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white btn-shimmer"
                            style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
                            <BookOpen className="w-3 h-3" />
                            {meta.courseTitle}
                          </button>
                        </Link>
                        {meta.simulation && (
                          <Link href="/simulations">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: L, border: `1px solid ${LD}`, color: N }}>
                              <Zap className="w-3 h-3" />
                              Try Simulation
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong areas */}
        {strongCategories.length > 0 && (
          <div className="rounded-2xl p-4 bg-white anim-slide-up-2" style={{ border: `1.5px solid rgba(5,150,105,0.2)` }}>
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#059669' }}>
              <CheckCircle className="w-4 h-4" /> You already know these well!
            </h4>
            <div className="flex flex-wrap gap-2">
              {strongCategories.map(cat => (
                <span key={cat} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                  {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pb-8 anim-slide-up-3">
          <Button onClick={onFinish}
            className="w-full h-13 text-white font-bold rounded-xl btn-shimmer text-base"
            style={{ background: `linear-gradient(135deg, ${N}, ${NL})`,
              boxShadow: '0 8px 24px rgba(17,20,57,0.25)', height: 52 }}>
            Enter Your Dashboard →
          </Button>
          <p className="text-center text-xs mt-2" style={{ color: '#6b6f9e' }}>
            Your recommendations will also appear on your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
