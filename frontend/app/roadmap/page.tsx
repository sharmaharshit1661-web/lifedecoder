'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import Roadmap from '@/components/features/roadmap'

interface User {
  id: string
  name: string
  email: string
  lifeDecoderScore: number
}

export default function RoadmapPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      router.push('/')
      return
    }

    try {
      const parsed = JSON.parse(currentUser)
      setUser({
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        lifeDecoderScore: parsed.lifeDecoderScore || 0,
      })
    } catch (error) {
      console.error('Failed to parse user data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout user={user}>
      <Roadmap />
    </DashboardLayout>
  )
}
