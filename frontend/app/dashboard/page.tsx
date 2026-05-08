'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import DashboardHome from '@/components/dashboard/dashboard-home'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  lifeDecoderScore: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = localStorage.getItem('currentUser')
      if (!currentUser) {
        router.push('/')
        return
      }

      try {
        // Try to get fresh user data from API
        const response = await api.getUserProfile()
        if (response.success) {
          setUser(response.user)
        }
      } catch (error) {
        // Fallback to localStorage if API fails
        console.error('Failed to load user from API:', error)
        const parsed = JSON.parse(currentUser)
        setUser({
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          lifeDecoderScore: parsed.lifeDecoderScore || 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadUser()
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
      <DashboardHome user={user} />
    </DashboardLayout>
  )
}
