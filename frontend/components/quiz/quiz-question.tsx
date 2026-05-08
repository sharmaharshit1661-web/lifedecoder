'use client'

const N = '#0a2540'; const NL = '#00ABE4'; const LD = '#c8dff0';

interface QuizQuestionProps {
  question: {
    id: number
    question: string
    options: string[]
    correctAnswer?: string
  }
  selected: string | string[] | undefined
  onSelect: (answer: string | string[]) => void
}

export default function QuizQuestion({ question, selected, onSelect }: QuizQuestionProps) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="text-base font-bold leading-snug mb-3" style={{ color: N }}>
          {question.question}
        </h3>
        <div className="w-10 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${N}, ${NL})` }} />
      </div>

      <div className="space-y-2.5">
        {question.options.map((option, index) => {
          const isSelected = selected === option
          const letter = String.fromCharCode(65 + index)

          return (
            <button key={option} onClick={() => onSelect(option)}
              className="w-full text-left rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                padding: '10px 14px',
                border: `2px solid ${isSelected ? NL : LD}`,
                background: isSelected ? `rgba(37,40,102,0.06)` : '#fff',
                boxShadow: isSelected ? `0 2px 12px rgba(37,40,102,0.12)` : 'none',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isSelected ? `linear-gradient(135deg, ${N}, ${NL})` : '#fff',
                    border: `2px solid ${isSelected ? NL : LD}`,
                    color: isSelected ? '#fff' : '#6b6f9e',
                  }}>
                  {letter}
                </div>
                <span className="text-sm font-medium leading-snug" style={{ color: N }}>
                  {option}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
