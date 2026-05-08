'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Sparkles, ArrowRight, Zap, BookOpen, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface DashboardHomeProps {
  user: { id: string; name: string; email: string; lifeDecoderScore: number; level?: number; xp?: number }
}
interface UserStats { level: number; xp: number; lifeDecoderScore: number; achievementsEarned: number; milestonesCompleted: number; coursesCompleted: number }
interface Achievement { _id: string; badgeName: string; badgeType: string; description: string; earnedAt: string }
interface Recommendation {
  type: string; category: string; label: string; icon: string; tip: string;
  course: { id: string; title: string; xp: number };
  simulation?: string | null; href: string; urgency: 'high' | 'medium' | 'low'; reason: string;
}
interface RecommendationData {
  score: number; tier: { label: string; emoji: string; color: string };
  weakCategories: string[]; strongCategories: string[];
  recommendations: Recommendation[];
  correctCount: number; totalQuestions: number;
}

const BB  = '#00ABE4'   // bright blue
const BB2 = '#0090c0'   // bright blue darker
const T   = '#0a2540'   // deep text
const LB  = '#E9F1FA'   // light blue bg
const LD  = '#c8dff0'   // border

const QUICK_ACTIONS = [
  { title: 'AI Life Coach',  description: 'Get instant advice',  href: '/coach',       emoji: '🤖', icon: MessageSquare, color: '#3b4fd4' },
  { title: 'Simulations',    description: 'Practice scenarios',  href: '/simulations', emoji: '⚡', icon: Zap,           color: '#7c3aed' },
  { title: 'Documents',      description: 'Decode paperwork',    href: '/documents',   emoji: '📋', icon: BookOpen,      color: '#0891b2' },
  { title: 'Finance',        description: 'Track your money',    href: '/finance',     emoji: '💰', icon: TrendingUp,    color: '#059669' },
]

// Animated counter hook
function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function DashboardHome({ user }: DashboardHomeProps) {
  const [stats, setStats]               = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recData, setRecData]           = useState<RecommendationData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [hoveredAction, setHoveredAction] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, r] = await Promise.all([api.getUserStats(), api.getAchievements(), api.getRecommendations()])
        if (s.success) setStats(s.stats)
        if (a.success) setAchievements(a.achievements)
        if (r.success) setRecData(r)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const level        = stats?.level || user.level || 1
  const xp           = stats?.xp || user.xp || 0
  const lifeDecoderScore = stats?.lifeDecoderScore || user.lifeDecoderScore || 0
  const progress     = (xp % 500) / 500 * 100
  const C            = 2 * Math.PI * 42

  const animScore = useCounter(lifeDecoderScore)
  const animXP    = useCounter(xp)

  if (loading) return (
    <div className="space-y-5">
      {[1,2,3].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: `1px solid ${LD}` }}>
          <div className="anim-shimmer h-32" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Hero banner */}
      <div className="relative rounded-2xl p-6 overflow-hidden anim-fade-scale"
        style={{ background: `linear-gradient(135deg, ${T} 0%, ${BB2} 50%, ${BB} 100%)`,
          boxShadow: '0 12px 40px rgba(0,171,228,0.25)' }}>

        {/* Animated bg shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full anim-float"
            style={{ background: 'rgba(255,255,255,0.04)', top: '-30%', right: '-5%' }} />
          <div className="absolute w-40 h-40 rounded-full anim-float2"
            style={{ background: 'rgba(255,255,255,0.03)', bottom: '-20%', left: '10%' }} />
          <div className="absolute w-20 h-20 rounded-full anim-float3"
            style={{ background: 'rgba(255,255,255,0.06)', top: '20%', left: '40%' }} />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl font-bold text-white">
                Hey {user.name.split(' ')[0]}!
              </h1>
            </div>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Ready to level up your adult skills today?
            </p>

            {/* Stat pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'LifeDecoder Score', value: animScore },
                { label: 'Total XP',      value: animXP },
                { label: 'Level',         value: level },
              ].map((s, i) => (
                <div key={s.label} className="rounded-xl px-4 py-2.5 anim-slide-up"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    animationDelay: `${i * 0.1}s`, backdropFilter: 'blur(8px)' }}>
                  <div className="text-xl font-bold text-white tabular-nums">{s.value}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Level ring */}
          <div className="relative w-28 h-28 flex-shrink-0 anim-bounce-in">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" strokeWidth="7" fill="none" stroke="rgba(255,255,255,0.1)" />
              <circle cx="50" cy="50" r="42" strokeWidth="7" fill="none"
                stroke="url(#ringGrad)"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)' }} />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-18 h-18 rounded-full flex flex-col items-center justify-center"
                style={{ width: 68, height: 68, background: 'rgba(255,255,255,0.12)',
                  border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Level</span>
                <span className="text-2xl font-bold text-white leading-none">{level}</span>
                <span className="text-[10px] text-white/50">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative z-10 mt-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>XP Progress</span>
            <span>{xp % 500} / 500</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-1500 ease-out"
              style={{ width: `${progress}%`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))',
                boxShadow: '0 0 8px rgba(255,255,255,0.4)' }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="anim-slide-up-1">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: T }}>
          <Sparkles className="w-4 h-4" style={{ color: BB }} />
          Jump into action
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={a.href} href={a.href}>
              <div className="group rounded-2xl p-4 cursor-pointer bg-white relative overflow-hidden"
                style={{ border: `1.5px solid ${LD}`, transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                onMouseEnter={e => {
                  setHoveredAction(i)
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(17,20,57,0.14)'
                  e.currentTarget.style.borderColor = BB
                }}
                onMouseLeave={e => {
                  setHoveredAction(null)
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = LD
                }}>
                {/* Hover gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, rgba(17,20,57,0.03), transparent)` }} />
                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-400 rounded-b-2xl"
                  style={{ background: `linear-gradient(90deg, ${T}, ${BB})` }} />

                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10"
                  style={{ background: 'rgba(17,20,57,0.07)' }}>
                  <span className="text-2xl">{a.emoji}</span>
                </div>
                <h3 className="font-bold text-sm mb-0.5 relative z-10" style={{ color: T }}>{a.title}</h3>
                <p className="text-xs relative z-10" style={{ color: '#6b6f9e' }}>{a.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations from Quiz */}
      {recData && recData.recommendations.length > 0 && (
        <div className="anim-slide-up-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: T }}>
              <Target className="w-4 h-4" style={{ color: BB }} />
              Your Learning Plan
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(17,20,57,0.08)', color: T }}>
                Based on your quiz
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: recData.tier.color + '15', color: recData.tier.color, border: `1px solid ${recData.tier.color}30` }}>
              {recData.tier.emoji} {recData.tier.label} · {recData.correctCount}/{recData.totalQuestions}
            </div>
          </div>

          {/* Score progress bar */}
          <div className="rounded-2xl p-4 mb-3 bg-white" style={{ border: `1.5px solid ${LD}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: T }}>LifeDecoder Score</span>
              <span className="text-2xl font-bold" style={{ color: T }}>{recData.score}<span className="text-sm font-normal text-gray-400">/100</span></span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: LD }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${recData.score}%`,
                  background: `linear-gradient(90deg, ${T}, ${BB})`,
                  boxShadow: '0 0 8px rgba(17,20,57,0.3)' }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs" style={{ color: '#6b6f9e' }}>
              <span>🌱 Beginner</span><span>📚 Learning</span><span>🎯 Competent</span><span>🏆 Expert</span>
            </div>
          </div>

          {/* Recommendation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recData.recommendations.map((rec, i) => (
              <div key={rec.category} className="rounded-2xl p-4 bg-white group cursor-default transition-all duration-300"
                style={{ border: `1.5px solid ${rec.urgency === 'high' ? 'rgba(220,38,38,0.2)' : LD}`,
                  animationDelay: `${i * 0.08}s` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(17,20,57,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: rec.urgency === 'high' ? 'rgba(220,38,38,0.08)' : 'rgba(17,20,57,0.06)' }}>
                    {rec.icon}
                  </div>
                  {rec.urgency === 'high' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                      Needs work
                    </span>
                  )}
                  {rec.urgency === 'low' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                      Level up
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm mb-1" style={{ color: T }}>{rec.label}</h4>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: '#6b6f9e' }}>{rec.tip}</p>

                {/* Actions */}
                <div className="space-y-1.5">
                  <Link href={rec.href}>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-white btn-shimmer"
                      style={{ background: `linear-gradient(135deg, ${T}, ${BB})` }}>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" /> {rec.course.title.length > 22 ? rec.course.title.slice(0, 22) + '…' : rec.course.title}
                      </span>
                      <span className="opacity-70">+{rec.course.xp}xp</span>
                    </button>
                  </Link>
                  {rec.simulation && (
                    <Link href="/simulations">
                      <button className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: LB, border: `1px solid ${LD}`, color: T }}>
                        <Zap className="w-3 h-3" style={{ color: BB }} /> Practice Simulation
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 anim-slide-up-2">

        {/* Achievements */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2" style={{ color: T }}>
              <Trophy className="w-4 h-4" style={{ color: BB }} /> Achievements
            </h3>
            <Link href="/achievements"
              className="text-xs font-semibold flex items-center gap-1 group"
              style={{ color: BB }}>
              View all
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.slice(0, 3).map((ach, i) => (
                <div key={ach._id} className="flex items-center gap-3 p-3 rounded-xl group cursor-default transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: LB, border: `1px solid ${LD}`, animationDelay: `${i * 0.1}s` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.boxShadow = '0 4px 12px rgba(17,20,57,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = LD; e.currentTarget.style.boxShadow = 'none' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${T}, ${BB})` }}>
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate" style={{ color: T }}>{ach.badgeName}</h4>
                    <p className="text-xs" style={{ color: '#6b6f9e' }}>{new Date(ach.earnedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 anim-float"
                style={{ background: 'rgba(17,20,57,0.07)' }}>
                <Trophy className="w-7 h-7" style={{ color: BB }} />
              </div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: T }}>No achievements yet</h4>
              <p className="text-xs" style={{ color: '#6b6f9e' }}>Complete activities to earn badges!</p>
            </div>
          )}
        </div>

        {/* Recommended */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: `1.5px solid ${LD}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: T }}>
            <Target className="w-4 h-4" style={{ color: BB }} /> Recommended
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Try a Simulation', desc: 'Practice salary negotiation', xp: '+150 XP', href: '/simulations', primary: true },
              { title: 'Learn a Skill',    desc: '5-minute course on credit',   xp: '+15 XP',  href: '/courses',     primary: false },
            ].map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl group transition-all duration-200"
                style={{ background: LB, border: `1.5px solid ${LD}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(17,20,57,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = LD; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm" style={{ color: T }}>{item.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={item.primary
                      ? { background: `linear-gradient(135deg, ${T}, ${BB})`, color: '#fff' }
                      : { background: 'rgba(17,20,57,0.08)', color: T }}>
                    {item.xp}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#6b6f9e' }}>{item.desc}</p>
                <Link href={item.href}>
                  <Button size="sm" className="w-full text-xs font-semibold btn-shimmer transition-all duration-200"
                    style={item.primary
                      ? { background: `linear-gradient(135deg, ${T}, ${BB})`, color: '#fff', boxShadow: '0 4px 12px rgba(17,20,57,0.2)' }
                      : { background: 'transparent', color: T, border: `1.5px solid ${LD}` }}
                    onMouseEnter={e => { if (!item.primary) e.currentTarget.style.borderColor = BB }}
                    onMouseLeave={e => { if (!item.primary) e.currentTarget.style.borderColor = LD }}>
                    {item.primary ? 'Start Now →' : 'Browse Courses'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
