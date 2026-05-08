'use client'

import { Briefcase, DollarSign, Heart, TrendingUp } from 'lucide-react'

const categories = [
  {
    icon: Briefcase,
    emoji: '💼',
    title: 'Career Planning',
    description: 'Navigate job searches, interviews, and career growth with confidence.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: DollarSign,
    emoji: '💰',
    title: 'Financial Wellness',
    description: 'Master budgeting, investing, and building long-term wealth.',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Heart,
    emoji: '❤️',
    title: 'Relationships',
    description: 'Build healthy connections in dating, friendships, and family.',
    color: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    icon: TrendingUp,
    emoji: '📈',
    title: 'Personal Growth',
    description: 'Develop confidence and skills for lasting success and happiness.',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
]

export default function ProblemCards() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Life Skills and Wellness
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From career decisions to financial planning, we've got you covered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <div
                key={index}
                className={`${category.color} p-8 rounded-3xl hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-3xl">{category.emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
