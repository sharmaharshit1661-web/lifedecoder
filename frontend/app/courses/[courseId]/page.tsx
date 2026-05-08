'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Star, Clock, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/dashboard-layout'

const COURSES = [
  {
    id: 'taxes-20-min',
    title: 'File Taxes in 20 Minutes',
    duration: '20 min',
    difficulty: 'Beginner',
    completed: false,
    action: 'Learn the basics of tax filing with practical tips',
    videoUrl: 'https://youtu.be/7jknxuR0kiw?si=FbyiHK9UuIWZbPec',
    xpReward: 50,
    category: 'tax filing'
  },
  {
    id: 'negotiate-salary',
    title: 'Negotiate Your Salary',
    duration: '15 min',
    difficulty: 'Advanced',
    completed: false,
    action: 'Master salary negotiation techniques and strategies',
    videoUrl: 'https://youtu.be/J30wmYgzVXM?si=9cnZ8HFXX7Xoni42',
    xpReward: 75,
    category: 'salary negotiation'
  },
  {
    id: 'emergency-fund',
    title: 'Create an Emergency Fund',
    duration: '12 min',
    difficulty: 'Beginner',
    completed: false,
    action: 'Learn how to build and maintain an emergency fund',
    videoUrl: 'https://youtu.be/vO2KGm8NM8E?si=ldcc69JRUZU1Oe1H',
    xpReward: 40,
    category: 'emergency fund'
  },
  {
    id: 'medical-bill',
    title: 'Read a Medical Bill',
    duration: '10 min',
    difficulty: 'Intermediate',
    completed: false,
    action: 'Understand medical billing and identify errors',
    videoUrl: 'https://youtu.be/8rfYW7cOq_c?si=HmDhjrCvVY79wmZR',
    xpReward: 45,
    category: 'read a medical bill'
  },
  {
    id: 'lease-agreements',
    title: 'Understanding Lease Agreements',
    duration: '8 min',
    difficulty: 'Intermediate',
    completed: false,
    action: 'Navigate lease agreements and know your rights',
    videoUrl: 'https://youtu.be/KnVW_wx8zKo?si=MonPedrzkz0XyaP-',
    xpReward: 35,
    category: 'lease agreements'
  },
  {
    id: 'employment-contract',
    title: 'Two Things to Know Before Signing Your Employment Contract',
    duration: '6 min',
    difficulty: 'Beginner',
    completed: false,
    action: 'Essential knowledge for employment contracts',
    videoUrl: 'https://youtu.be/-JZIY2YC4UQ?si=nWWlD7Ky1fUZ0lU4',
    xpReward: 30,
    category: 'employment contract'
  },
  {
    id: 'insurance-basics',
    title: 'What is Insurance',
    duration: '7 min',
    difficulty: 'Beginner',
    completed: false,
    action: 'Learn the fundamentals of insurance coverage',
    videoUrl: 'https://youtu.be/ifTxb9eY5jc?si=1PYusXUyTl1jz9ix',
    xpReward: 35,
    category: 'insurance'
  }
]

// Function to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState(COURSES.find(c => c.id === courseId))
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [completionMessage, setCompletionMessage] = useState('')

  useEffect(() => {
    if (!course) {
      router.push('/courses')
    }
  }, [course, router])

  if (!course) {
    return null
  }

  const embedUrl = getYouTubeEmbedUrl(course.videoUrl)

  const handleVideoComplete = async () => {
    setIsLoading(true)
    
    try {
      // Get the token from localStorage where it's stored as currentUser
      const currentUser = localStorage.getItem('currentUser')
      const token = currentUser ? JSON.parse(currentUser).token : null
      
      if (!token) {
        console.error('No authentication token found')
        // Fallback to local completion for demo
        setVideoCompleted(true)
        setXpAwarded(true)
        setCompletionMessage(`Congratulations! You've completed "${course.title}" and earned ${course.xpReward} XP!`)
        setIsLoading(false)
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/courses/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVideoCompleted(true)
        setXpAwarded(true)
        setCompletionMessage(data.message)
        
        // Update local storage with new XP and level
        const currentUserData = JSON.parse(currentUser!)
        currentUserData.xp = data.newXp
        currentUserData.level = data.newLevel
        localStorage.setItem('currentUser', JSON.stringify(currentUserData))
      } else {
        console.error('Failed to complete course:', data.message)
        // Fallback to local completion for demo
        setVideoCompleted(true)
        setXpAwarded(true)
        setCompletionMessage(`Congratulations! You've completed "${course.title}" and earned ${course.xpReward} XP!`)
      }
    } catch (error) {
      console.error('Error completing course:', error)
      // Fallback to local completion for demo
      setVideoCompleted(true)
      setXpAwarded(true)
      setCompletionMessage(`Congratulations! You've completed "${course.title}" and earned ${course.xpReward} XP!`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToCourses = () => {
    router.push('/courses')
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToCourses}
            className="mb-4 text-[#252866] hover:text-[#111439] hover:bg-[#F8F8F9]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-[#F8F8F9] text-[#252866] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.duration}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-gradient-to-r from-[#252866] to-[#111439] text-white">
              {course.difficulty}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <Star className="w-3 h-3" />
              {course.xpReward} XP
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-[#111439]">{course.title}</h1>
          <p className="text-[#252866]">{course.action}</p>
        </div>

        {/* Video Player */}
        <Card className="bg-white/90 backdrop-blur-sm border border-[#DDDDE6] mb-6 shadow-lg">
          <div className="aspect-video relative">
            <iframe
              src={embedUrl}
              title={course.title}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 border-t border-[#F8F8F9]">
            <p className="text-sm text-[#252866]">
              💡 <strong>Tip:</strong> Take notes while watching and click "Mark as Complete" when you finish to earn your XP!
            </p>
          </div>
        </Card>

        {/* Course Completion */}
        <Card className="bg-white/90 backdrop-blur-sm border border-[#DDDDE6] p-6 shadow-lg">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-[#111439]">Complete This Course</h3>
            <p className="text-[#252866] mb-6">
              Watch the video above to learn about {course.category}. 
              Click the button below when you've finished watching to earn your XP!
            </p>
            
            {!videoCompleted ? (
              <Button 
                onClick={handleVideoComplete}
                disabled={isLoading}
                className="w-full md:w-auto bg-gradient-to-r from-[#252866] to-[#111439] hover:from-[#111439] hover:to-[#111439] text-white shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Course Completed!</span>
                </div>
                
                {xpAwarded && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                      <Star className="w-5 h-5" />
                      <span className="font-semibold">+{course.xpReward} XP Earned!</span>
                    </div>
                    {completionMessage && (
                      <p className="text-sm text-center text-[#252866]">
                        {completionMessage}
                      </p>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={handleBackToCourses}
                  variant="outline"
                  className="w-full md:w-auto bg-white border border-[#DDDDE6] text-[#252866] hover:bg-[#F8F8F9]"
                >
                  Back to Courses
                </Button>
                
                <div className="mt-4 p-4 bg-gradient-to-br from-[#F8F8F9] to-white rounded-lg border border-[#DDDDE6]">
                  <h4 className="font-semibold mb-2 text-[#111439]">What's Next?</h4>
                  <p className="text-sm text-[#252866]">
                    Continue your learning journey with more micro-courses to build your adult life skills!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}