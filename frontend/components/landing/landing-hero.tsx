'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'

interface LandingHeroProps { onSignup: () => void; onLogin: () => void }

const LB  = '#E9F1FA'   // light blue
const BB  = '#00ABE4'   // bright blue
const BB2 = '#0090c0'   // bright blue darker
const W   = '#FFFFFF'
const T   = '#0a2540'   // text

const WORDS = ['Master.', 'Learn.', 'Grow.']

const FEATURES = [
  { icon: '🎯', title: 'AI Life Coach',    desc: 'Personalized 24/7 guidance on career, finances, and relationships.' },
  { icon: '⚡', title: 'Real Simulations', desc: 'Practice salary negotiation, interviews, and lease signing safely.' },
  { icon: '📚', title: 'Micro Courses',    desc: 'Bite-sized lessons on taxes, credit, insurance, and more.' },
  { icon: '🏆', title: 'Track Progress',   desc: 'Earn XP, badges, and build your LifeDecoder score over time.' },
]

export default function LandingHero({ onSignup, onLogin }: LandingHeroProps) {
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const word = WORDS[wordIdx]
    const speed = deleting ? 55 : 95
    const t = setTimeout(() => {
      if (!deleting && charIdx < word.length) setCharIdx(c => c + 1)
      else if (!deleting && charIdx === word.length) setTimeout(() => setDeleting(true), 1400)
      else if (deleting && charIdx > 0) setCharIdx(c => c - 1)
      else { setDeleting(false); setWordIdx(i => (i + 1) % WORDS.length) }
    }, speed)
    return () => clearTimeout(t)
  }, [charIdx, deleting, wordIdx])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!heroRef.current) return
      const r = heroRef.current.getBoundingClientRect()
      setMousePos({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 })
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const currentWord = WORDS[wordIdx].slice(0, charIdx)

  return (
    <section ref={heroRef} className="w-full overflow-hidden relative"
      style={{ background: `linear-gradient(160deg, ${LB} 0%, #d0e8f7 40%, #bddff5 100%)` }}>

      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full anim-float"
          style={{ width: 600, height: 600, top: '-20%', left: '-12%', opacity: 0.18,
            background: `radial-gradient(circle, ${BB}, transparent 65%)`,
            transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -12}px)`, transition: 'transform 1.2s ease-out' }} />
        <div className="absolute rounded-full anim-float2"
          style={{ width: 450, height: 450, top: '10%', right: '-8%', opacity: 0.14,
            background: `radial-gradient(circle, ${BB2}, transparent 65%)`,
            transform: `translate(${mousePos.x * 16}px, ${mousePos.y * 10}px)`, transition: 'transform 1s ease-out' }} />
        <div className="absolute rounded-full anim-float3"
          style={{ width: 350, height: 350, bottom: '0%', left: '30%', opacity: 0.12,
            background: `radial-gradient(circle, ${BB}, transparent 65%)`,
            transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 7}px)`, transition: 'transform 0.8s ease-out' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `radial-gradient(circle, ${BB} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 anim-nav"
        style={{ background: 'rgba(233,241,250,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,171,228,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
          <img src="/logo.png" alt="LifeDecoder" className="h-9 sm:h-11 w-auto object-contain" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}
              className="text-sm font-semibold hidden sm:inline-flex transition-all rounded-lg"
              style={{ color: BB }}>
              Login
            </Button>
            <Button onClick={onSignup}
              className="rounded-full px-5 sm:px-6 py-2 text-sm font-bold text-white btn-shimmer"
              style={{ background: `linear-gradient(135deg, ${BB}, ${BB2})`, boxShadow: `0 4px 20px rgba(0,171,228,0.35)` }}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-24 lg:pt-32 pb-16 lg:pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[75vh]">

            {/* Left */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold anim-slide-up"
                style={{ background: `rgba(0,171,228,0.12)`, border: `1px solid rgba(0,171,228,0.3)`, color: BB2 }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: BB }} />
                AI-Powered Life Skills Platform
              </div>

              <div className="anim-slide-up-1">
                <h1 className="font-extrabold leading-[1.05] tracking-tight">
                  <span className="block text-5xl sm:text-6xl lg:text-7xl"
                    style={{ background: `linear-gradient(135deg, ${T} 0%, ${BB} 60%, ${BB2} 100%)`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {currentWord || '\u00A0'}
                    <span className="inline-block w-[3px] h-[0.85em] ml-1 align-middle rounded-sm animate-pulse"
                      style={{ background: BB, verticalAlign: 'middle' }} />
                  </span>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl font-semibold mt-2" style={{ color: '#2d5a7b' }}>
                    Your adult life starts here.
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg leading-relaxed anim-slide-up-2" style={{ color: '#2d5a7b', maxWidth: 480 }}>
                Navigate finances, career, housing, and more with AI-powered guidance built for young adults.
              </p>

              <div className="flex flex-wrap gap-3 anim-slide-up-3">
                <Button onClick={onSignup}
                  className="px-7 py-3.5 rounded-xl font-bold text-sm text-white btn-shimmer"
                  style={{ background: `linear-gradient(135deg, ${BB}, ${BB2})`, boxShadow: `0 8px 28px rgba(0,171,228,0.35)`, fontSize: '15px' }}>
                  Start for Free →
                </Button>
                <Button onClick={onLogin} variant="ghost"
                  className="px-7 py-3.5 rounded-xl font-semibold text-sm border transition-all"
                  style={{ color: BB2, borderColor: `rgba(0,171,228,0.35)`, background: `rgba(0,171,228,0.06)` }}>
                  Sign In
                </Button>
              </div>

              <div className="flex items-center gap-8 anim-slide-up-4">
                {[['10K+', 'Young Adults'], ['50+', 'Life Skills'], ['4.9★', 'Rating']].map(([val, label]) => (
                  <div key={label}>
                    <div className="text-2xl font-extrabold" style={{ color: T }}>{val}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#5a8aaa' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 anim-slide-right">
              <div className="col-span-2 relative rounded-2xl overflow-hidden group cursor-pointer h-52 sm:h-60 lg:h-72"
                style={{ transform: `perspective(1000px) rotateY(${mousePos.x * -4}deg) rotateX(${mousePos.y * 3}deg)`,
                  transition: 'transform 0.6s ease-out',
                  boxShadow: `0 24px 64px rgba(0,171,228,0.2), 0 0 0 1px rgba(0,171,228,0.15)` }}>
                <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop"
                  alt="Financial Planning" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,100,160,0.85), rgba(0,100,160,0.15), transparent)` }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, rgba(0,171,228,0.2), transparent)` }} />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <p className="text-white font-bold text-lg mb-0.5">Financial Planning</p>
                  <p className="text-white/60 text-xs">Most popular course</p>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: `rgba(0,171,228,0.75)`, backdropFilter: 'blur(4px)' }}>50+</div>
                </div>
              </div>

              {[
                { src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop', label: 'Career', sub: '12 courses' },
                { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop', label: 'Life Skills', sub: '8 courses' },
              ].map((c, i) => (
                <div key={c.label} className="relative rounded-2xl overflow-hidden group cursor-pointer h-36 sm:h-40 lg:h-44"
                  style={{ transform: `perspective(800px) rotateY(${mousePos.x * -3}deg) rotateX(${mousePos.y * 2}deg) translateY(${i === 0 ? mousePos.y * -8 : mousePos.y * 8}px)`,
                    transition: 'transform 0.6s ease-out',
                    boxShadow: `0 16px 40px rgba(0,171,228,0.18), 0 0 0 1px rgba(0,171,228,0.12)` }}>
                  <img src={c.src} alt={c.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,100,160,0.8), transparent)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(135deg, rgba(0,171,228,0.2), transparent)' }} />
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
                    <p className="text-white font-bold text-sm">{c.label}</p>
                    <p className="text-white/55 text-xs">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 lg:py-28 relative z-10" style={{ background: W, borderTop: `1px solid rgba(0,171,228,0.12)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ color: T }}>
              Everything you need to{' '}
              <span style={{ background: `linear-gradient(90deg, ${BB}, ${BB2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                thrive
              </span>
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: '#2d5a7b' }}>
              Master essential life skills with our comprehensive AI platform
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="group rounded-2xl p-6 cursor-pointer card-lift relative overflow-hidden bg-white"
                style={{ border: `1.5px solid rgba(0,171,228,0.15)` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.background = LB }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,171,228,0.15)'; e.currentTarget.style.background = W }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 30% 30%, rgba(0,171,228,0.08), transparent 70%)` }} />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: `rgba(0,171,228,0.1)`, border: `1px solid rgba(0,171,228,0.2)` }}>
                  <span className="text-3xl">{f.icon}</span>
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: T }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#2d5a7b' }}>{f.desc}</p>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
                  style={{ background: `linear-gradient(90deg, ${BB}, ${BB2})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-12 relative z-10" style={{ background: LB, borderTop: `1px solid rgba(0,171,228,0.12)` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              { val: '10,000+', label: 'Active Users',      icon: '👥' },
              { val: '50+',     label: 'Life Skills',        icon: '📚' },
              { val: '95%',     label: 'Satisfaction Rate',  icon: '⭐' },
              { val: '24/7',    label: 'AI Coach Available', icon: '🤖' },
            ].map(s => (
              <div key={s.label} className="p-5 rounded-2xl bg-white"
                style={{ border: `1px solid rgba(0,171,228,0.15)`, boxShadow: '0 2px 12px rgba(0,171,228,0.08)' }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold" style={{ color: BB }}>{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: '#5a8aaa' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 lg:py-28 relative z-10 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${BB} 0%, ${BB2} 100%)` }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-80 rounded-full anim-float2 opacity-20"
            style={{ background: 'radial-gradient(circle, #ffffff, transparent)', top: '-20%', left: '10%' }} />
          <div className="absolute w-64 h-64 rounded-full anim-float3 opacity-15"
            style={{ background: 'radial-gradient(circle, #ffffff, transparent)', bottom: '-10%', right: '15%' }} />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: W }}>
            🚀 Join 10,000+ young adults
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Ready to master adulting?
          </h2>
          <p className="text-base sm:text-lg mb-8 text-white/80">
            Start free. No credit card required. Get your personalised LifeDecoder score in 3 minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onSignup}
              className="px-8 py-4 text-base rounded-full font-bold btn-shimmer"
              style={{ background: W, color: BB2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: '16px' }}>
              Start Free Trial →
            </Button>
            <Button onClick={onLogin} variant="ghost"
              className="px-8 py-4 text-base rounded-full font-semibold border transition-all text-white"
              style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)' }}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
