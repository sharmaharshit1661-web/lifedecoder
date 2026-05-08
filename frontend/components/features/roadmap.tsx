'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Star, Trophy, CheckCircle, Circle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Level {
  id: string
  number: number
  title: string
  description: string
  xp: number
  completed: boolean
  icon: string
}

interface Chapter {
  id: string
  number: number
  title: string
  totalLevels: number
  completedLevels: number
  levels: Level[]
}

interface RoadmapProgress {
  [levelId: string]: {
    _id: string
    userId: string
    milestoneId: string
    milestoneType: string
    milestoneName: string
    completed: boolean
    completedAt?: string
    createdAt: string
  }
}

const ROADMAP_CHAPTERS: Chapter[] = [
  {
    id: 'finance',
    number: 1,
    title: 'Finance & Money',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'finance-1',
        number: 1,
        title: 'Open a savings account and set up auto-transfer every month',
        description: 'Start building your financial foundation with automated savings',
        xp: 100,
        completed: false,
        icon: '🏦'
      },
      {
        id: 'finance-2',
        number: 2,
        title: 'Get your first credit card — use it small, pay it full',
        description: 'Build credit history responsibly',
        xp: 150,
        completed: false,
        icon: '💳'
      },
      {
        id: 'finance-3',
        number: 3,
        title: 'Learn the difference between needs vs wants',
        description: 'Master the fundamentals of smart spending',
        xp: 80,
        completed: false,
        icon: '🤔'
      },
      {
        id: 'finance-4',
        number: 4,
        title: 'Track monthly expenses using an app or notebook',
        description: 'Gain visibility into your spending patterns',
        xp: 120,
        completed: false,
        icon: '📊'
      },
      {
        id: 'finance-5',
        number: 5,
        title: 'Understand income tax basics — TDS & ITR filing',
        description: 'Navigate the tax system with confidence',
        xp: 200,
        completed: false,
        icon: '📋'
      },
      {
        id: 'finance-6',
        number: 6,
        title: 'Follow the 50/30/20 budget rule (needs/wants/savings)',
        description: 'Implement a sustainable budgeting framework',
        xp: 180,
        completed: false,
        icon: '📈'
      }
    ]
  },
  {
    id: 'health',
    number: 2,
    title: 'Health & Fitness',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'health-1',
        number: 1,
        title: 'Book your first independent doctor checkup',
        description: 'Take charge of your health with regular checkups',
        xp: 120,
        completed: false,
        icon: '🩺'
      },
      {
        id: 'health-2',
        number: 2,
        title: 'Get a dental checkup at least once a year',
        description: 'Maintain your oral health with regular visits',
        xp: 100,
        completed: false,
        icon: '🦷'
      },
      {
        id: 'health-3',
        number: 3,
        title: 'Start a basic fitness routine — even 20 min walks count',
        description: 'Build healthy exercise habits',
        xp: 150,
        completed: false,
        icon: '🏃'
      },
      {
        id: 'health-4',
        number: 4,
        title: 'Learn to cook at least 5 basic meals',
        description: 'Develop essential cooking skills for healthy eating',
        xp: 180,
        completed: false,
        icon: '👨‍🍳'
      },
      {
        id: 'health-5',
        number: 5,
        title: 'Understand what your health insurance covers',
        description: 'Know your coverage and how to make claims',
        xp: 140,
        completed: false,
        icon: '🏥'
      },
      {
        id: 'health-6',
        number: 6,
        title: 'Prioritize 7–8 hours of sleep every night',
        description: 'Establish healthy sleep patterns',
        xp: 160,
        completed: false,
        icon: '😴'
      }
    ]
  },
  {
    id: 'career',
    number: 3,
    title: 'Career & Education',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'career-1',
        number: 1,
        title: 'Build your first 1-page resume',
        description: 'Create a professional resume that stands out',
        xp: 120,
        completed: false,
        icon: '📄'
      },
      {
        id: 'career-2',
        number: 2,
        title: 'Create a LinkedIn profile and connect with 50+ people',
        description: 'Build your professional network online',
        xp: 150,
        completed: false,
        icon: '💼'
      },
      {
        id: 'career-3',
        number: 3,
        title: 'Explore internships, freelancing, or part-time work',
        description: 'Gain real-world work experience',
        xp: 200,
        completed: false,
        icon: '🎯'
      },
      {
        id: 'career-4',
        number: 4,
        title: 'Learn one high-value skill (coding, design, sales, etc.)',
        description: 'Develop marketable skills for your career',
        xp: 250,
        completed: false,
        icon: '💻'
      },
      {
        id: 'career-5',
        number: 5,
        title: 'Research the gap between your degree and job market',
        description: 'Understand industry requirements and expectations',
        xp: 180,
        completed: false,
        icon: '🔍'
      },
      {
        id: 'career-6',
        number: 6,
        title: 'Set a 3-year career goal and reverse-engineer the steps',
        description: 'Create a strategic plan for your career growth',
        xp: 220,
        completed: false,
        icon: '🎯'
      }
    ]
  },
  {
    id: 'legal',
    number: 4,
    title: 'Legal & Civic Rights',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'legal-1',
        number: 1,
        title: 'Register to vote',
        description: 'Exercise your democratic rights and civic duty',
        xp: 100,
        completed: false,
        icon: '🗳️'
      },
      {
        id: 'legal-2',
        number: 2,
        title: 'Get government-issued ID — Aadhar, PAN, Passport',
        description: 'Obtain essential identity documents',
        xp: 150,
        completed: false,
        icon: '🆔'
      },
      {
        id: 'legal-3',
        number: 3,
        title: 'Always read a contract before signing anything',
        description: 'Protect yourself by understanding legal agreements',
        xp: 120,
        completed: false,
        icon: '📋'
      },
      {
        id: 'legal-4',
        number: 4,
        title: 'Know your rights if stopped by police',
        description: 'Understand your legal rights and protections',
        xp: 140,
        completed: false,
        icon: '⚖️'
      },
      {
        id: 'legal-5',
        number: 5,
        title: 'Learn basic tenant rights before renting',
        description: 'Know your rights and responsibilities as a renter',
        xp: 160,
        completed: false,
        icon: '🏠'
      },
      {
        id: 'legal-6',
        number: 6,
        title: 'Link your PAN card to your bank account',
        description: 'Complete essential financial documentation',
        xp: 80,
        completed: false,
        icon: '🔗'
      }
    ]
  },
  {
    id: 'mental',
    number: 5,
    title: 'Mental Health',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'mental-1',
        number: 1,
        title: 'Talk about your feelings — to friends, family, or a therapist',
        description: 'Build emotional support networks',
        xp: 150,
        completed: false,
        icon: '💬'
      },
      {
        id: 'mental-2',
        number: 2,
        title: 'Identify your stress triggers and healthy coping methods',
        description: 'Develop stress management strategies',
        xp: 180,
        completed: false,
        icon: '🧘'
      },
      {
        id: 'mental-3',
        number: 3,
        title: 'Set daily screen time limits on social media',
        description: 'Create healthy digital boundaries',
        xp: 120,
        completed: false,
        icon: '📱'
      },
      {
        id: 'mental-4',
        number: 4,
        title: 'Learn the difference between sadness and depression',
        description: 'Understand mental health basics',
        xp: 140,
        completed: false,
        icon: '🧠'
      },
      {
        id: 'mental-5',
        number: 5,
        title: 'Build a morning or evening routine that grounds you',
        description: 'Establish stabilizing daily practices',
        xp: 160,
        completed: false,
        icon: '🌅'
      },
      {
        id: 'mental-6',
        number: 6,
        title: 'Remember — seeking help is strength, not weakness',
        description: 'Normalize mental health support',
        xp: 100,
        completed: false,
        icon: '💪'
      }
    ]
  },
  {
    id: 'relationships',
    number: 6,
    title: 'Relationships & Social',
    totalLevels: 6,
    completedLevels: 0,
    levels: [
      {
        id: 'relationships-1',
        number: 1,
        title: 'Learn to set healthy boundaries with everyone in your life',
        description: 'Protect your energy and well-being',
        xp: 180,
        completed: false,
        icon: '🚧'
      },
      {
        id: 'relationships-2',
        number: 2,
        title: 'Recognize the signs of toxic vs healthy relationships',
        description: 'Identify and avoid harmful relationship patterns',
        xp: 160,
        completed: false,
        icon: '🚩'
      },
      {
        id: 'relationships-3',
        number: 3,
        title: 'Build a small, trusted inner circle over a large shallow network',
        description: 'Focus on quality over quantity in relationships',
        xp: 140,
        completed: false,
        icon: '👥'
      },
      {
        id: 'relationships-4',
        number: 4,
        title: 'Practice communicating your needs clearly and calmly',
        description: 'Develop effective communication skills',
        xp: 170,
        completed: false,
        icon: '💬'
      },
      {
        id: 'relationships-5',
        number: 5,
        title: 'Develop active listening — be present, not just waiting to reply',
        description: 'Improve your listening and empathy skills',
        xp: 150,
        completed: false,
        icon: '👂'
      },
      {
        id: 'relationships-6',
        number: 6,
        title: 'Accept that outgrowing friendships is a normal part of life',
        description: 'Navigate changing relationships with maturity',
        xp: 130,
        completed: false,
        icon: '🌱'
      }
    ]
  }
]

export default function Roadmap() {
  const [selectedChapter, setSelectedChapter] = useState(ROADMAP_CHAPTERS[0])
  const [progress, setProgress] = useState<RoadmapProgress>({})
  const [loading, setLoading] = useState(true)
  const [completingLevel, setCompletingLevel] = useState<string | null>(null)
  const [xpNotification, setXpNotification] = useState<{ show: boolean; xp: number; levelUp?: boolean }>({ show: false, xp: 0 })

  // Load progress from backend
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await api.getRoadmapProgress()
        if (response.success) {
          setProgress(response.progress)
        }
      } catch (error) {
        console.error('Failed to load roadmap progress:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  // Update chapters with completion status
  const chaptersWithProgress = ROADMAP_CHAPTERS.map(chapter => ({
    ...chapter,
    levels: chapter.levels.map(level => ({
      ...level,
      completed: progress[level.id]?.completed || false
    })),
    completedLevels: chapter.levels.filter(level => progress[level.id]?.completed).length
  }))

  const currentChapter = chaptersWithProgress.find(c => c.id === selectedChapter.id) || chaptersWithProgress[0]

  const completeLevel = async (level: Level) => {
    if (level.completed || completingLevel) return

    setCompletingLevel(level.id)

    try {
      const response = await api.completeRoadmapLevel(
        level.id,
        level.title,
        level.xp,
        currentChapter.title
      )

      if (response.success) {
        // Update progress state
        setProgress(prev => ({
          ...prev,
          [level.id]: response.progress
        }))

        // Show XP notification
        setXpNotification({
          show: true,
          xp: response.xpEarned,
          levelUp: response.levelUp
        })

        // Hide notification after 3 seconds
        setTimeout(() => {
          setXpNotification({ show: false, xp: 0 })
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to complete level:', error)
    } finally {
      setCompletingLevel(null)
    }
  }

  const StarRating = ({ filled = 0, total = 3 }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const totalXP = currentChapter.levels.reduce((sum, level) => 
    level.completed ? sum + level.xp : sum, 0
  )

  if (loading) {
    return (
      <div className="-m-6 lg:-m-8 bg-gradient-to-br from-[#FFFFFF] via-[#F8F8F9] to-[#DDDDE6] dark:from-[#111439] dark:via-[#111439]  flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="flex items-center gap-3 text-[#252866]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your roadmap...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 lg:-m-8 bg-gradient-to-br from-[#FFFFFF] via-[#F8F8F9] to-[#DDDDE6] dark:from-[#111439] dark:via-[#111439] ">
      {/* XP Notification */}
      {xpNotification.show && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#252866] to-[#111439] text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">+{xpNotification.xp} XP earned!</span>
            {xpNotification.levelUp && (
              <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs">Level Up! 🎉</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 lg:p-8 pb-16">{/* Added pb-16 for bottom padding */}
        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111439] mb-2">Life Skills Roadmap</h1>
          <p className="text-[#252866] mb-6">Master essential adult life skills across 6 key areas</p>
          
          {/* Horizontally Scrollable Topic Tabs */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {chaptersWithProgress.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedChapter.id === chapter.id
                      ? 'bg-gradient-to-r from-[#252866] to-[#111439] text-white shadow-md'
                      : 'bg-white/80 text-[#252866] hover:bg-white border border-[#DDDDE6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{chapter.title}</span>
                    {chapter.completedLevels > 0 && (
                      <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                        {chapter.completedLevels}/{chapter.totalLevels}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Chapter Content */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-[#111439] uppercase tracking-wide mb-1">
                CHAPTER {currentChapter.number} OF {ROADMAP_CHAPTERS.length}
              </p>
              <h2 className="text-3xl font-bold text-[#111439]">
                {currentChapter.title}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#252866] mb-1">
                {currentChapter.completedLevels} of {currentChapter.totalLevels} complete
              </p>
              <div className="flex items-center gap-2 justify-end">
                <Trophy className="w-4 h-4 text-[#111439]" />
                <span className="text-sm font-medium text-[#252866]">{totalXP} XP</span>
              </div>
            </div>
          </div>
          
          {/* Professional Progress Bar */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#DDDDE6] rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#252866]">Chapter Progress</span>
              <span className="text-sm font-semibold text-[#111439]">
                {Math.round((currentChapter.completedLevels / currentChapter.totalLevels) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#F8F8F9] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#252866] to-[#111439] h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(currentChapter.completedLevels / currentChapter.totalLevels) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#111439]">
              <span>{currentChapter.completedLevels} completed</span>
              <span>{currentChapter.totalLevels - currentChapter.completedLevels} remaining</span>
            </div>
          </div>
        </div>

        {/* Roadmap Path */}
        <div className="relative">
          {/* Clean Central Path Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#DDDDE6] transform -translate-x-px" />
          
          {/* Level Cards with Professional Styling */}
          <div className="space-y-12">
            {currentChapter.levels.map((level, index) => {
              const isLeft = index % 2 === 0
              const isCompleted = level.completed
              const isCompleting = completingLevel === level.id
              
              return (
                <div key={level.id} className="relative h-28">
                  {/* Clean Path Dot */}
                  <div className="absolute left-1/2 top-8 transform -translate-x-1/2 z-10">
                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-[#252866] border-[#252866] shadow-md' 
                        : 'bg-white border-[#DDDDE6] shadow-sm'
                    }`}>
                      {isCompleted && (
                        <div className="w-full h-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Professional Level Card */}
                  <div className={`absolute top-0 w-64 sm:w-72 md:w-80 lg:w-96 ${
                    isLeft 
                      ? 'right-1/2 mr-4'
                      : 'left-1/2 ml-4'
                  }`}>
                    <Card className={`p-4 md:p-5 transition-all duration-200 hover:shadow-xl border ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-[#F8F8F9] to-white border-[#111439]' 
                        : 'bg-white/90 backdrop-blur-sm border-[#DDDDE6] hover:border-[#111439] dark:hover:border-gray-500'
                    } rounded-lg shadow-lg`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="text-2xl">
                            {level.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-[#111439] uppercase tracking-wide">
                              LEVEL {level.number}
                            </span>
                            <StarRating filled={isCompleted ? 3 : 0} />
                          </div>
                          <h3 className="font-semibold text-[#111439] text-base leading-tight">
                            {level.title}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-[#111439]" />
                          <span className="text-sm font-medium text-[#252866]">{level.xp} XP</span>
                        </div>
                        <button
                          onClick={() => completeLevel(level)}
                          disabled={isCompleted || isCompleting}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-[#252866] to-[#111439] text-white cursor-default'
                              : isCompleting
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#111439] to-[#111439] text-white hover:shadow-md hover:scale-105'
                          }`}
                        >
                          {isCompleting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              COMPLETING...
                            </>
                          ) : isCompleted ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              COMPLETED
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4" />
                              COMPLETE
                            </>
                          )}
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}