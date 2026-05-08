'use client'

import { useState } from 'react'
import AuthModal from '@/components/auth/auth-modal'
import LandingHero from '@/components/landing/landing-hero'

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Full Screen Hero */}
      <LandingHero 
        onSignup={() => handleAuthClick('signup')}
        onLogin={() => handleAuthClick('login')}
      />

      {/* Auth Modal */}
      <AuthModal 
        open={authOpen} 
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </div>
  )
}
