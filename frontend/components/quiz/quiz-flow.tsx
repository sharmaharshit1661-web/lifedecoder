'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import QuizQuestion from './quiz-question'
import QuizResults from './quiz-results'
import { api } from '@/lib/api'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0'; const L = '#E9F1FA';

interface Question {
  id: number
  category: string
  question: string
  options: string[]
  correctAnswer: string
}

// Shown immediately — zero wait time
const FALLBACK_QUESTIONS: Question[] = [
  { id: 1,  category: 'credit',     question: 'What is a credit score primarily used for?',                    options: ['To determine your income level', 'To assess your creditworthiness for loans and rentals', 'To calculate your tax bracket', 'To track your spending habits'],                                                                correctAnswer: 'To assess your creditworthiness for loans and rentals' },
  { id: 2,  category: 'taxes',      question: 'What is a W-2 form?',                                           options: ['A form to apply for unemployment benefits', 'A document showing your annual wages and taxes withheld', 'A lease agreement for apartments', 'A health insurance enrollment form'],                                              correctAnswer: 'A document showing your annual wages and taxes withheld' },
  { id: 3,  category: 'insurance',  question: 'What is a deductible in health insurance?',                     options: ['The monthly payment you make for insurance', 'The amount you pay before insurance starts covering costs', 'The maximum amount insurance will pay per year', 'A discount for healthy lifestyle choices'],                          correctAnswer: 'The amount you pay before insurance starts covering costs' },
  { id: 4,  category: 'renting',    question: 'What is typically required when signing a lease?',              options: ["Only first month's rent", "Security deposit and first month's rent", 'Six months rent upfront', 'Just a verbal agreement'],                                                                                                    correctAnswer: "Security deposit and first month's rent" },
  { id: 5,  category: 'finance',    question: 'What is the recommended emergency fund size?',                  options: ['1 month of expenses', '3-6 months of expenses', '1 year of expenses', 'No emergency fund needed'],                                                                                                                            correctAnswer: '3-6 months of expenses' },
  { id: 6,  category: 'employment', question: 'What does "gross income" mean on a pay stub?',                  options: ['Income after all deductions', 'Income before any deductions', 'Only overtime pay', 'Annual salary divided by 12'],                                                                                                            correctAnswer: 'Income before any deductions' },
  { id: 7,  category: 'rights',     question: 'Can a landlord enter your apartment without notice?',           options: ['Yes, anytime since they own the property', 'No, they must provide reasonable notice except in emergencies', 'Only during business hours', 'Yes, but only once per month'],                                                    correctAnswer: 'No, they must provide reasonable notice except in emergencies' },
  { id: 8,  category: 'debt',       question: 'What happens if you only pay the minimum on a credit card?',    options: ['You avoid all interest charges', 'You pay significantly more in interest over time', 'Your credit score automatically improves', 'The remaining balance is forgiven'],                                                        correctAnswer: 'You pay significantly more in interest over time' },
  { id: 9,  category: 'healthcare', question: 'When should you go to urgent care instead of the ER?',         options: ['For life-threatening emergencies', 'For non-life-threatening issues like minor injuries or flu', 'Never, always go to the ER', "Only if you don't have insurance"],                                                            correctAnswer: 'For non-life-threatening issues like minor injuries or flu' },
  { id: 10, category: 'budgeting',  question: 'What is the 50/30/20 budgeting rule?',                         options: ['50% savings, 30% needs, 20% wants', '50% needs, 30% wants, 20% savings', '50% wants, 30% savings, 20% needs', '50% rent, 30% food, 20% entertainment'],                                                                    correctAnswer: '50% needs, 30% wants, 20% savings' },
]

export default function QuizFlow() {
  const router = useRouter()

  // Start with empty array, wait for AI
  const [questions, setQuestions]     = useState<Question[]>([])
  const [ageGroup, setAgeGroup]       = useState('')
  const [difficulty, setDifficulty]   = useState('')
  const [aiReady, setAiReady]         = useState(false)   // true once AI questions loaded
  const [aiLoading, setAiLoading]     = useState(true)    // subtle indicator only
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers]         = useState<Record<string, string | string[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore]             = useState(0)
  const swapped = useRef(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    // 1. Check sessionStorage cache — only use if age matches current user
    const stored = localStorage.getItem('currentUser')
    const age = stored ? JSON.parse(stored).age || '18' : '18'

    const cached = sessionStorage.getItem('quizQuestions')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        // Only use cache if it was generated for this exact age group
        if (data.questions?.length >= 8 && data.forAge === age) {
          setQuestions(data.questions)
          setAgeGroup(data.ageGroup || '')
          setDifficulty(data.difficulty || '')
          setAiReady(true)
          setAiLoading(false)
          sessionStorage.removeItem('quizQuestions')
          console.log(`✅ Quiz loaded from cache for age ${age}`)
          return
        } else {
          // Cache is stale or wrong age — discard it
          sessionStorage.removeItem('quizQuestions')
        }
      } catch {
        sessionStorage.removeItem('quizQuestions')
      }
    }

    // 2. Fetch in background — quiz already visible with fallback questions
    console.log(`🎯 Fetching AI questions for age: ${age}`)
    try {
      const res = await fetch('/api/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      if (data.questions?.length >= 8 && !swapped.current && currentStep === 0) {
        // Only swap if user hasn't answered anything yet
        swapped.current = true
        setQuestions(data.questions)
        setAgeGroup(data.ageGroup || '')
        setDifficulty(data.difficulty || '')
        setAiReady(true)
      }
    } catch {
      if (questions.length === 0) {
        setQuestions(FALLBACK_QUESTIONS)
      }
    }
    setAiLoading(false)
  }

  const handleAnswer = (answer: string | string[]) => {
    const q = questions[currentStep]
    // Once user answers Q1, lock in current questions (don't swap mid-quiz)
    swapped.current = true
    setAnswers(prev => ({ ...prev, [q.category + '_' + q.id]: answer }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      let correct = 0
      questions.forEach(q => {
        if (answers[q.category + '_' + q.id] === q.correctAnswer) correct++
      })
      setScore(Math.round((correct / questions.length) * 100))
      setShowResults(true)
    }
  }

  const handleFinish = async () => {
    try {
      const enrichedAnswers: Record<string, { answer: string | string[]; correct: boolean }> = {}
      questions.forEach(q => {
        const key = q.category + '_' + q.id
        enrichedAnswers[q.category] = { answer: answers[key] ?? '', correct: answers[key] === q.correctAnswer }
      })
      const response = await api.submitQuiz(enrichedAnswers, score)
      if (response.success) {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}')
        localStorage.setItem('currentUser', JSON.stringify({ ...u, ...response.user }))
      }
    } catch {}
    router.push('/dashboard')
  }

  // Loading State
  if (aiLoading || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg, var(--background) 0%, var(--muted) 60%, var(--border) 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-6"
            style={{ borderColor: `${NL}40`, borderTopColor: NL }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: N }}>Personalising your quiz...</h2>
          <p className="text-sm" style={{ color: '#6b6f9e' }}>Generating age-specific life skills questions using AI</p>
        </div>
      </div>
    )
  }

  // Results
  if (showResults) {
    const categoryAnswers: Record<string, string | string[]> = {}
    questions.forEach(q => { categoryAnswers[q.category] = answers[q.category + '_' + q.id] ?? '' })
    return <QuizResults score={score} answers={categoryAnswers} onFinish={handleFinish} />
  }

  const question = questions[currentStep]
  const answerKey = question.category + '_' + question.id
  const isAnswered = answers[answerKey] !== undefined
  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <div className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, var(--background) 0%, var(--muted) 60%, var(--border) 100%)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="LifeDecoder" className="h-10 w-auto object-contain mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
            style={{ background: 'var(--card)', border: `1px solid ${LD}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span className="text-base">🎯</span>
            <span className="text-sm font-semibold" style={{ color: N }}>LifeDecoder Assessment</span>
            {ageGroup && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(17,20,57,0.08)', color: NL }}>
                {ageGroup}
              </span>
            )}
            {aiReady && (
              <span className="text-xs font-medium" style={{ color: '#059669' }}>✓ AI personalised</span>
            )}
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: N }}>Discover your Life Skills Score</h1>
          {difficulty && (
            <p className="text-xs" style={{ color: '#6b6f9e' }}>
              {difficulty} level questions — tailored for you
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ background: `linear-gradient(135deg, ${N}, ${NL})` }}>
                {currentStep + 1}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: N }}>Question {currentStep + 1} of {questions.length}</p>
                <p className="text-xs capitalize" style={{ color: '#6b6f9e' }}>{question.category}</p>
              </div>
            </div>
            <span className="text-xs font-bold" style={{ color: N }}>{Math.round(progress)}%</span>
          </div>
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: LD }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${N}, ${NL})` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--card)', border: `1.5px solid ${LD}` }}>
          <QuizQuestion
            question={question}
            selected={answers[answerKey]}
            onSelect={handleAnswer}
          />
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0} className="flex-1 text-sm"
              style={{ borderColor: LD, color: N }}>
              ← Back
            </Button>
            <Button onClick={handleNext} disabled={!isAnswered}
              className="flex-1 text-sm font-semibold text-white btn-shimmer"
              style={{ background: `linear-gradient(135deg, ${N}, ${NL})`, boxShadow: '0 4px 12px rgba(17,20,57,0.2)' }}>
              {currentStep === questions.length - 1 ? 'See Results →' : 'Next →'}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#9999b8' }}>
          {questions.length} questions · Takes about 3 minutes
        </p>
      </div>
    </div>
  )
}
