'use client'

import { Button } from '@/components/ui/button'
import { Clock, Play, CheckCircle, Star, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

const COURSES = [
  { id: 'taxes-20-min',      title: 'File Taxes in 20 Minutes',                                    duration: '20 min', difficulty: 'Beginner',     xpReward: 50, action: 'Learn the basics of tax filing with practical tips',          emoji: '🧾' },
  { id: 'negotiate-salary',  title: 'Negotiate Your Salary',                                        duration: '15 min', difficulty: 'Advanced',      xpReward: 75, action: 'Master salary negotiation techniques and strategies',         emoji: '💼' },
  { id: 'emergency-fund',    title: 'Create an Emergency Fund',                                     duration: '12 min', difficulty: 'Beginner',     xpReward: 40, action: 'Learn how to build and maintain an emergency fund',           emoji: '🛡️' },
  { id: 'medical-bill',      title: 'Read a Medical Bill',                                          duration: '10 min', difficulty: 'Intermediate', xpReward: 45, action: 'Understand medical billing and identify errors',               emoji: '🏥' },
  { id: 'lease-agreements',  title: 'Understanding Lease Agreements',                               duration: '8 min',  difficulty: 'Intermediate', xpReward: 35, action: 'Navigate lease agreements and know your rights',               emoji: '🏠' },
  { id: 'employment-contract',title: 'Two Things to Know Before Signing Your Employment Contract',  duration: '6 min',  difficulty: 'Beginner',     xpReward: 30, action: 'Essential knowledge for employment contracts',                  emoji: '📝' },
  { id: 'insurance-basics',  title: 'What is Insurance',                                            duration: '7 min',  difficulty: 'Beginner',     xpReward: 35, action: 'Learn the fundamentals of insurance coverage',                 emoji: '📋' },
]

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(5,150,105,0.1)',   text: '#059669' },
  Intermediate: { bg: 'rgba(217,119,6,0.1)',   text: '#d97706' },
  Advanced:     { bg: 'rgba(124,58,237,0.1)',  text: '#7c3aed' },
}

export default function MicroCourses() {
  const router = useRouter()
  const [completedCourses, setCompletedCourses] = useState<string[]>([])
  const [userXp, setUserXp] = useState(0)
  const [userLevel, setUserLevel] = useState(1)

  useEffect(() => {
    fetchProgress()
    const stored = localStorage.getItem('currentUser')
    if (stored) { const u = JSON.parse(stored); setUserXp(u.xp || 0); setUserLevel(u.level || 1) }
    const onFocus = () => fetchProgress()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const fetchProgress = async () => {
    try {
      const stored = localStorage.getItem('currentUser')
      const token = stored ? JSON.parse(stored).token : null
      if (!token) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/courses/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) { setCompletedCourses(data.completedCourses || []); setUserXp(data.totalXp || 0); setUserLevel(data.level || 1) }
      }
    } catch {}
  }

  const courses = COURSES.map(c => ({ ...c, completed: completedCourses.includes(c.id) }))
  const completedCount = courses.filter(c => c.completed).length
  const pct = Math.round((completedCount / COURSES.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
          style={{ background: 'rgba(17,20,57,0.07)', border: `1px solid ${LD}` }}>
          <Clock className="w-3.5 h-3.5" style={{ color: NL }} />
          <span className="text-xs font-semibold" style={{ color: N }}>Quick Skills</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: N }}>Micro Courses</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6b6f9e' }}>
              {completedCount}/{COURSES.length} completed · {userXp} XP · Level {userLevel}
            </p>
          </div>
          <div className="text-2xl font-bold" style={{ color: N }}>{pct}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl p-4 bg-white" style={{ border: `1.5px solid ${LD}` }}>
        <div className="flex justify-between text-xs mb-2" style={{ color: '#6b6f9e' }}>
          <span>Overall Progress</span>
          <span>{completedCount} of {COURSES.length} courses</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: LD }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${N}, ${NL})` }} />
        </div>
      </div>

      {/* Courses grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => {
          const diff = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner
          return (
            <div key={course.id}
              className="rounded-2xl bg-white flex flex-col transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              style={{ border: `1.5px solid ${course.completed ? 'rgba(5,150,105,0.3)' : LD}`,
                background: course.completed ? 'rgba(5,150,105,0.03)' : '#fff' }}
              onMouseEnter={e => { if (!course.completed) e.currentTarget.style.borderColor = NL; e.currentTarget.style.boxShadow = '0 8px 24px rgba(17,20,57,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = course.completed ? 'rgba(5,150,105,0.3)' : LD; e.currentTarget.style.boxShadow = 'none' }}>
              <div className="p-5 flex-1 flex flex-col">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{course.emoji}</span>
                  {course.completed
                    ? <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#059669' }} />
                    : <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(17,20,57,0.07)', color: N }}>+{course.xpReward} XP</span>}
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: N }}>{course.title}</h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(17,20,57,0.06)', color: '#6b6f9e' }}>
                    <Clock className="w-3 h-3" />{course.duration}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: diff.bg, color: diff.text }}>
                    {course.difficulty}
                  </span>
                </div>

                <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: '#6b6f9e' }}>{course.action}</p>

                <Button onClick={() => router.push(`/courses/${course.id}`)}
                  className="w-full text-sm font-semibold btn-shimmer"
                  style={course.completed
                    ? { background: 'transparent', border: `1.5px solid ${LD}`, color: N }
                    : { background: `linear-gradient(135deg, ${N}, ${NL})`, color: '#fff', boxShadow: '0 4px 12px rgba(17,20,57,0.2)' }}>
                  {course.completed ? 'Review' : <><Play className="w-3.5 h-3.5 mr-1.5" />Start Course</>}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
