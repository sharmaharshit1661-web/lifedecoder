'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Trophy, Star, Zap, Award, Lock } from 'lucide-react'
import { api } from '@/lib/api'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const ALL_BADGES = [
  { badgeType: 'first-steps',       badgeName: 'First Steps',        description: 'Complete your first quiz',                  icon: '🌱', color: '#059669' },
  { badgeType: 'money-master',      badgeName: 'Money Master',       description: 'Complete 5 finance activities',             icon: '💰', color: '#d97706' },
  { badgeType: 'career-ready',      badgeName: 'Career Ready',       description: 'Ace the job interview simulation',          icon: '💼', color: '#2563eb' },
  { badgeType: 'negotiation-pro',   badgeName: 'Negotiation Pro',    description: 'Complete salary negotiation simulation',    icon: '🤝', color: '#7c3aed' },
  { badgeType: 'life-master',       badgeName: 'Life Master',        description: 'Reach LifeDecoder score of 90+',               icon: '🏆', color: '#dc2626' },
  { badgeType: 'consistent-learner',badgeName: 'Consistent Learner', description: 'Complete 5 micro courses',                 icon: '📚', color: '#0891b2' },
  { badgeType: 'level-up',          badgeName: 'Level Up',           description: 'Reach Level 2 or higher',                  icon: '⚡', color: '#f59e0b' },
  { badgeType: 'chapter-complete',  badgeName: 'Chapter Complete',   description: 'Complete a full roadmap chapter',          icon: '🗺️', color: '#10b981' },
]

interface Achievement {
  id?: string
  _id?: string
  badgeName: string
  badgeType: string
  description: string
  earnedAt: string
}

interface UserStats {
  level: number
  xp: number
  lifeDecoderScore: number
  achievementsEarned: number
  coursesCompleted: number
  milestonesCompleted: number
}

export default function AchievementsHub() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [a, s] = await Promise.all([api.getAchievements(), api.getUserStats()])
        if (a.success) setAchievements(a.achievements || [])
        if (s.success) setStats(s.stats)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const earnedTypes = new Set(achievements.map(a => a.badgeType))
  const earned = ALL_BADGES.filter(b => earnedTypes.has(b.badgeType))
  const locked = ALL_BADGES.filter(b => !earnedTypes.has(b.badgeType))

  // Find earnedAt for a badge
  const getEarnedAt = (type: string) => {
    const a = achievements.find(a => a.badgeType === type)
    return a ? new Date(a.earnedAt).toLocaleDateString() : ''
  }

  if (loading) return (
    <div className="p-6 md:p-8 space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: LD }} />
      ))}
    </div>
  )

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Trophy className="w-4 h-4" style={{ color: NL }} />
          <span className="text-sm font-medium" style={{ color: N }}>Track Your Growth</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: N }}>Achievements & Badges</h1>
        <p className="text-sm" style={{ color: '#6b6f9e' }}>Earn badges and level up as you master the art of adulting.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total XP',    value: stats?.xp ?? 0,                    icon: '⚡' },
          { label: 'Level',       value: stats?.level ?? 1,                  icon: '🏅' },
          { label: 'Badges',      value: earned.length,                      icon: '🏆' },
          { label: 'LifeDecoder',     value: stats?.lifeDecoderScore ?? 0,           icon: '🧠' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 text-center bg-white" style={{ border: `1.5px solid ${LD}` }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold" style={{ color: N }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b6f9e' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: N }}>
            <Trophy className="w-5 h-5" style={{ color: '#d97706' }} />
            Earned ({earned.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earned.map(badge => (
              <div key={badge.badgeType} className="rounded-2xl p-5 flex flex-col items-center text-center bg-white"
                style={{ border: `2px solid ${badge.color}30`, boxShadow: `0 4px 16px ${badge.color}15` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3"
                  style={{ background: `${badge.color}15` }}>
                  {badge.icon}
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: N }}>{badge.badgeName}</h3>
                <p className="text-xs mb-2" style={{ color: '#6b6f9e' }}>{badge.description}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${badge.color}15`, color: badge.color }}>
                  {getEarnedAt(badge.badgeType)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: N }}>
          <Lock className="w-5 h-5" style={{ color: '#6b6f9e' }} />
          To Unlock ({locked.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {locked.map(badge => (
            <div key={badge.badgeType} className="rounded-2xl p-5 flex flex-col items-center text-center bg-white opacity-55"
              style={{ border: `1.5px solid ${LD}` }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3"
                style={{ background: 'rgba(17,20,57,0.06)' }}>
                {badge.icon}
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: N }}>{badge.badgeName}</h3>
              <p className="text-xs" style={{ color: '#6b6f9e' }}>{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {earned.length === 0 && (
        <div className="mt-6 rounded-2xl p-8 text-center bg-white" style={{ border: `1.5px solid ${LD}` }}>
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="font-bold text-lg mb-2" style={{ color: N }}>No badges yet</h3>
          <p className="text-sm" style={{ color: '#6b6f9e' }}>
            Complete the quiz, finish courses, and try simulations to earn your first badge!
          </p>
        </div>
      )}
    </div>
  )
}
