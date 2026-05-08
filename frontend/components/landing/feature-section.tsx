'use client'

import { MessageSquare, Zap, TrendingUp, BookOpen, Shield, Sparkles } from 'lucide-react'

const features = [
  {
    icon: '💬',
    title: 'AI Life Coach',
    description: 'Get personalized advice on careers, relationships, finances, and more.',
    color: 'bg-blue-50',
  },
  {
    icon: '⚡',
    title: 'Real Simulations',
    description: 'Experience realistic scenarios and make decisions with real consequences.',
    color: 'bg-amber-50',
  },
  {
    icon: '📈',
    title: 'Track Progress',
    description: 'Build skills and watch your LifeDecoder score increase over time.',
    color: 'bg-emerald-50',
  },
  {
    icon: '📚',
    title: 'Learn Essentials',
    description: 'Master topics from taxes to relationships with bite-sized lessons.',
    color: 'bg-purple-50',
  },
  {
    icon: '🛡️',
    title: 'Safe Space',
    description: 'Ask anything without judgment. Your data and privacy matter.',
    color: 'bg-pink-50',
  },
  {
    icon: '🎯',
    title: 'Gamified',
    description: 'Earn badges, unlock achievements, and compete with friends.',
    color: 'bg-cyan-50',
  },
]

export default function FeatureSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-gray-700">Comprehensive Life Skills</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Everything You Need to Adult
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools designed for young adults navigating the complexities of modern life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-teal-200 group"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-5 text-3xl group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
