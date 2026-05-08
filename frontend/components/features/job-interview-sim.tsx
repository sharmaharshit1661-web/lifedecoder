"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, User, Zap, Target, CheckCircle, Mic, MicOff, Send } from "lucide-react";

const questions = [
  // Beginner Level
  {
    level: "beginner",
    question: "Tell me about yourself and why you're interested in this position.",
    scenario: "This is typically the first question in any interview. Your response sets the tone for the entire conversation.",
    idealResponse: "Provide a concise professional summary highlighting relevant experience, skills, and genuine interest in the role and company."
  },
  {
    level: "beginner", 
    question: "What are your greatest strengths and how do they relate to this job?",
    scenario: "The interviewer wants to understand your self-awareness and how your abilities align with their needs.",
    idealResponse: "Choose 2-3 relevant strengths with specific examples and connect them directly to job requirements."
  },
  {
    level: "beginner",
    question: "Where do you see yourself in 5 years?",
    scenario: "This tests your career planning, ambition, and whether you'll stay with the company long-term.",
    idealResponse: "Show growth mindset, alignment with company trajectory, and realistic but ambitious career goals."
  },
  // Intermediate Level
  {
    level: "intermediate",
    question: "Describe a challenging situation at work and how you handled it.",
    scenario: "Behavioral questions assess your problem-solving skills and how you handle pressure in real situations.",
    idealResponse: "Use STAR method (Situation, Task, Action, Result) with specific example showing problem-solving and positive outcome."
  },
  {
    level: "intermediate",
    question: "Why are you leaving your current job, and why do you want to work here?",
    scenario: "This reveals your motivations and whether you've done research about the company and role.",
    idealResponse: "Focus on positive reasons for change, show company research, and align your goals with their mission."
  },
  {
    level: "intermediate", 
    question: "How do you handle criticism or feedback from supervisors?",
    scenario: "This tests your emotional intelligence, growth mindset, and ability to work in a team environment.",
    idealResponse: "Show openness to feedback, specific example of implementing suggestions, and continuous improvement mindset."
  },
  // Advanced Level
  {
    level: "advanced",
    question: "Describe a time when you had to lead a team through a difficult project.",
    scenario: "Leadership questions assess your ability to manage people, navigate challenges, and deliver results.",
    idealResponse: "Demonstrate leadership style, conflict resolution, team motivation, and successful project delivery with metrics."
  },
  {
    level: "advanced",
    question: "How would you approach the first 90 days in this role if hired?",
    scenario: "This tests strategic thinking, planning abilities, and understanding of the role's priorities.",
    idealResponse: "Show structured approach: learning phase, relationship building, quick wins, and long-term strategy development."
  },
  // Rapid Questions
  {
    level: "rapid",
    question: "What questions do you have for me about the role or company?",
    scenario: "Your questions reveal your level of interest, preparation, and strategic thinking about the opportunity.",
    idealResponse: "Ask thoughtful questions about role expectations, team dynamics, company culture, and growth opportunities."
  },
  {
    level: "rapid",
    question: "How do you stay updated with industry trends and developments?",
    scenario: "This assesses your commitment to continuous learning and professional development.",
    idealResponse: "Mention specific resources, courses, networks, and how you apply new knowledge to your work."
  },
  {
    level: "rapid",
    question: "Describe your ideal work environment and management style.",
    scenario: "This helps determine cultural fit and whether you'll thrive in their specific environment.",
    idealResponse: "Show flexibility while highlighting preferences that align with the company's known culture and management approach."
  },
  {
    level: "rapid",
    question: "How do you prioritize tasks when everything seems urgent?",
    scenario: "Time management and prioritization skills are crucial in most roles, especially fast-paced environments.",
    idealResponse: "Demonstrate systematic approach using frameworks, stakeholder communication, and impact-based decision making."
  }
];

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface JobInterviewSimProps {
  onBack: () => void;
}

export default function JobInterviewSim({ onBack }: JobInterviewSimProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      content: "Hello! I'm your AI Interview Coach. I'll conduct a realistic job interview with you, asking questions that you'd encounter in real interviews. You can respond by typing or speaking. Let's begin!",
      timestamp: new Date()
    }
  ]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
  const [showingQuestion, setShowingQuestion] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        recognitionInstance.maxAlternatives = 1;
        
        recognitionInstance.onstart = () => {
          console.log('Speech recognition started');
          setSpeechError("");
        };
        
        recognitionInstance.onresult = (event: any) => {
          if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
              setCurrentAnswer(prev => {
                const newText = prev + (prev ? ' ' : '') + transcript.trim();
                return newText;
              });
            }
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          switch (event.error) {
            case 'not-allowed':
              setSpeechError("Microphone access denied. Please allow microphone permissions and refresh the page.");
              break;
            case 'no-speech':
              setSpeechError("No speech detected. Please speak louder or try again.");
              break;
            case 'audio-capture':
              setSpeechError("No microphone found. Please check your microphone connection.");
              break;
            case 'network':
              setSpeechError("Speech service temporarily unavailable. You can still type your response.");
              break;
            case 'aborted':
              setSpeechError("");
              break;
            case 'language-not-supported':
              setSpeechError("Language not supported. Please type your response.");
              break;
            default:
              setSpeechError("Speech recognition temporarily unavailable. Please type your response.");
          }
        };
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      } else {
        console.log('Speech recognition not supported');
        setSpeechSupported(false);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (currentAnswer.trim()) {
          handleSubmitAnswer();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        if (speechSupported) {
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentAnswer, isListening, speechSupported]);
  const startListening = async () => {
    if (!recognition) return;
    
    try {
      setSpeechError("");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isListening) {
        recognition.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsListening(true);
      recognition.start();
      
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Microphone permission error:', error);
      setSpeechError("Please allow microphone access to use voice input. Check browser settings if needed.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      setIsListening(false);
    }
  };

  const retryListening = () => {
    setSpeechError("");
    setTimeout(() => {
      startListening();
    }, 500);
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const question = questions[currentQuestion];
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentAnswer.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setUserAnswers(prev => [...prev, currentAnswer.trim()]);
    setCurrentAnswer("");
    setShowingQuestion(false);

    const thinkingMessage: ChatMessage = {
      type: 'ai',
      content: "Analyzing...",
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, thinkingMessage]);

    const maxWaitTime = 8000;

    try {
      const response = await Promise.race([
        fetch('/api/interview-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userResponse: currentAnswer.trim(),
            question: question.question,
            scenario: question.scenario
          }),
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Frontend timeout')), maxWaitTime)
        )
      ]) as Response;

      if (response.ok) {
        const data = await response.json();
        const aiFeedback = data.feedback;
        
        const aiResponse: ChatMessage = {
          type: 'ai',
          content: `📊 **Score: ${aiFeedback.score}/10**

${aiFeedback.feedback}

💡 **Quick tip:** ${aiFeedback.tip}`,
          timestamp: new Date()
        };

        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = aiResponse;
          return newMessages;
        });
      } else {
        console.error('API response not ok:', response.status);
        const fallbackFeedback = generateSimpleFeedback(currentAnswer.trim(), question);
        const aiResponse: ChatMessage = {
          type: 'ai',
          content: fallbackFeedback + "\n\n⚠️ (Using fallback analysis - AI service temporarily unavailable)",
          timestamp: new Date()
        };
        
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      const fallbackFeedback = generateSimpleFeedback(currentAnswer.trim(), question);
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: fallbackFeedback + "\n\n⚠️ (Using fallback analysis - AI service temporarily unavailable)",
        timestamp: new Date()
      };
      
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiResponse;
        return newMessages;
      });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowingQuestion(true);
        
        const nextQuestion: ChatMessage = {
          type: 'ai',
          content: `Great answer! Let's move to the next question. This one is ${questions[currentQuestion + 1].level} level.`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, nextQuestion]);
      } else {
        setIsGeneratingAI(true);
        const finalMessage: ChatMessage = {
          type: 'ai',
          content: "Excellent work! You've completed the interview simulation. Generating your comprehensive performance analysis...",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, finalMessage]);
        
        setTimeout(async () => {
          try {
            const response = await Promise.race([
              fetch('/api/interview-analysis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userAnswers,
                  questions
                }),
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Analysis timeout')), 10000)
              )
            ]) as Response;

            if (response.ok) {
              const data = await response.json();
              setFinalAnalysis(data.analysis);
              
              // Complete simulation and award XP
              try {
                // First start the simulation to get a proper ID
                const startResponse = await fetch('/api/simulations/start', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                  },
                  body: JSON.stringify({
                    simulationType: 'job-interview',
                    userContext: { questions: questions.length }
                  }),
                });
                
                let simulationId = 'job-interview-' + Date.now();
                if (startResponse.ok) {
                  const startData = await startResponse.json();
                  simulationId = startData.simulationId;
                }
                
                // Then complete it with the score
                const simulationResponse = await fetch('/api/simulations/complete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                  },
                  body: JSON.stringify({
                    simulationId: simulationId,
                    score: data.analysis.overallScore,
                    feedback: data.analysis.summary
                  }),
                });
                
                if (simulationResponse.ok) {
                  const simData = await simulationResponse.json();
                  console.log('XP awarded:', simData.xpEarned);
                  
                  // Update local storage with new XP
                  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                  currentUser.xp = simData.newXp;
                  currentUser.level = simData.newLevel;
                  localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
              } catch (xpError) {
                console.error('Failed to award XP:', xpError);
              }
            } else {
              setFinalAnalysis(analyzeOverallPerformance());
            }
          } catch (error) {
            console.error('Error getting final analysis:', error);
            setFinalAnalysis(analyzeOverallPerformance());
          }
          
          setIsGeneratingAI(false);
          setShowResults(true);
        }, 1500);
      }
    }, 1500);
  };
  const generateSimpleFeedback = (userResponse: string, question: any) => {
    const response = userResponse.toLowerCase();
    const responseLength = userResponse.trim().length;
    const questionLower = question.question.toLowerCase();
    
    // Check relevance to the question
    const questionWords = questionLower.split(' ').filter((word: string) => word.length > 3);
    const responseWords = response.split(' ');
    const relevantWords = questionWords.filter((word: string) => 
      responseWords.some((respWord: string) => respWord.includes(word) || word.includes(respWord))
    );
    const relevanceScore = relevantWords.length / Math.max(questionWords.length, 1);
    
    const positiveKeywords = [
      'experience', 'skills', 'team', 'project', 'achieved', 'successful', 'learned', 
      'challenge', 'solution', 'result', 'goal', 'passion', 'motivated', 'growth',
      'leadership', 'collaboration', 'problem', 'improve', 'develop', 'contribute',
      'example', 'situation', 'task', 'action', 'outcome', 'responsibility'
    ];
    
    const negativeKeywords = [
      'don\'t know', 'not sure', 'maybe', 'i guess', 'whatever', 'fine', 'okay',
      'um', 'uh', 'like', 'you know', 'sort of', 'kind of'
    ];
    
    const positiveCount = positiveKeywords.filter((keyword: string) => response.includes(keyword)).length;
    const negativeCount = negativeKeywords.filter((keyword: string) => response.includes(keyword)).length;
    
    let score = 1;
    let feedback = "";
    let tip = "";
    
    // STRICT scoring criteria
    if (responseLength < 15) {
      score = 1;
      feedback = "Your response is far too brief for a professional interview.";
      tip = "Provide detailed answers with specific examples - aim for at least 30-60 seconds of speaking.";
    } else if (relevanceScore < 0.2) {
      score = 2;
      feedback = "Your response doesn't address the interview question asked.";
      tip = "Listen carefully to the question and provide a direct, relevant answer.";
    } else if (responseLength < 30) {
      score = 2;
      feedback = "Your response lacks the depth and detail expected in an interview.";
      tip = "Expand your answers with specific examples, context, and results.";
    } else if (negativeCount >= 3) {
      score = 2;
      feedback = "Your response shows uncertainty and lacks professional confidence.";
      tip = "Speak with confidence, avoid filler words, and prepare specific examples in advance.";
    } else if (positiveCount === 0 && responseLength < 50) {
      score = 3;
      feedback = "Your response needs more professional language and specific examples.";
      tip = "Use action words, describe specific situations, and highlight your achievements.";
    } else if (relevanceScore < 0.4) {
      score = 3;
      feedback = "Your response partially addresses the question but lacks focus.";
      tip = "Stay on topic and directly answer what the interviewer is asking.";
    } else if (positiveCount >= 1 && responseLength >= 50 && relevanceScore >= 0.4) {
      if (positiveCount >= 4 && responseLength >= 100) {
        score = 7;
        feedback = "Good response with professional language and relevant details.";
        tip = "Continue using specific examples and quantify your achievements when possible.";
      } else if (positiveCount >= 3) {
        score = 6;
        feedback = "Solid response that addresses the question with some good elements.";
        tip = "Add more specific examples and demonstrate the impact of your actions.";
      } else {
        score = 5;
        feedback = "Your response addresses the question but needs more depth and examples.";
        tip = "Use the STAR method (Situation, Task, Action, Result) for stronger answers.";
      }
    } else {
      score = 4;
      feedback = "Your response shows effort but lacks the professional depth expected.";
      tip = "Include specific examples from your experience and speak with more confidence.";
    }
    
    // Cap excellent scores - they should be rare
    if (score > 7 && (responseLength < 80 || positiveCount < 3)) {
      score = Math.min(6, score);
    }
    
    return `📊 **Score: ${score}/10**

${feedback}

💡 **Quick tip:** ${tip}`;
  };

  const analyzeOverallPerformance = () => {
    const responses = userAnswers.join(' ').toLowerCase();
    const totalLength = userAnswers.join(' ').length;
    const avgLength = totalLength / userAnswers.length;
    
    const professionalWords = ['experience', 'skills', 'team', 'project', 'achieved', 'leadership', 'growth', 'result', 'successful'];
    const confidenceWords = ['confident', 'passionate', 'excited', 'motivated', 'capable', 'strong', 'excellent'];
    const specificityWords = ['example', 'situation', 'increased', 'improved', 'developed', 'managed', 'led', 'created'];
    const weakWords = ['maybe', 'i guess', 'not sure', 'don\'t know', 'whatever', 'fine', 'okay', 'um', 'uh'];
    
    const professionalScore = professionalWords.filter((word: string) => responses.includes(word)).length;
    const confidenceScore = confidenceWords.filter((word: string) => responses.includes(word)).length;
    const specificityScore = specificityWords.filter((word: string) => responses.includes(word)).length;
    const weakScore = weakWords.filter((word: string) => responses.includes(word)).length;
    
    // Calculate relevance by checking if responses actually address interview topics
    const interviewTopics = ['work', 'job', 'career', 'company', 'role', 'position', 'experience', 'skills'];
    const relevanceScore = interviewTopics.filter((topic: string) => responses.includes(topic)).length;
    
    let totalScore = professionalScore + confidenceScore + specificityScore + relevanceScore - (weakScore * 2);
    const maxPossibleScore = professionalWords.length + confidenceWords.length + specificityWords.length + interviewTopics.length;
    
    // Penalize very short responses
    if (avgLength < 30) {
      totalScore = Math.max(0, totalScore - 5);
    }
    
    const percentage = Math.max(0, (totalScore / maxPossibleScore) * 100);
    
    // MUCH MORE STRICT scoring thresholds
    if (percentage >= 80 && avgLength >= 80 && weakScore <= 1) {
      return {
        overallScore: Math.min(95, 85 + (percentage - 80) * 0.5),
        level: "🏆 Interview Ready",
        summary: "Outstanding interview performance! You demonstrate strong communication skills, confidence, and professional presence.",
        strengths: [
          "Excellent professional communication",
          "Strong use of specific examples and results",
          "Confident and enthusiastic responses",
          "Good understanding of interview best practices",
          "Effective storytelling and structure"
        ],
        improvements: [
          "Continue practicing with mock interviews",
          "Stay updated with industry trends",
          "Prepare more diverse examples for different scenarios"
        ],
        nextSteps: [
          "Apply to your target positions with confidence",
          "Prepare company-specific questions and research",
          "Practice salary negotiation skills",
          "Build your professional network"
        ]
      };
    } else if (percentage >= 60 && avgLength >= 60 && weakScore <= 2) {
      return {
        overallScore: Math.min(80, 65 + (percentage - 60) * 0.75),
        level: "🎯 Strong Candidate",
        summary: "Good interview skills with room for improvement. You show potential but need more practice with specific examples.",
        strengths: [
          "Basic professional communication",
          "Shows enthusiasm for opportunities",
          "Understands interview format"
        ],
        improvements: [
          "Use more specific examples with quantified results",
          "Practice the STAR method for behavioral questions",
          "Build confidence in your responses",
          "Prepare more diverse professional stories"
        ],
        nextSteps: [
          "Practice mock interviews with friends or mentors",
          "Prepare 5-7 strong professional examples",
          "Research common interview questions in your field",
          "Work on confident body language and tone"
        ]
      };
    } else if (percentage >= 35 && avgLength >= 40) {
      return {
        overallScore: Math.min(65, 40 + (percentage - 35) * 1.0),
        level: "📈 Developing Candidate",
        summary: "You have basic interview awareness but need significant practice to improve your responses and confidence.",
        strengths: [
          "Willingness to participate and learn",
          "Basic understanding of professional communication"
        ],
        improvements: [
          "Develop stronger professional vocabulary",
          "Practice telling your professional story",
          "Build confidence in articulating your value",
          "Learn to structure responses effectively",
          "Eliminate filler words and uncertain language"
        ],
        nextSteps: [
          "Take interview skills workshops or courses",
          "Practice with career counselors or mentors",
          "Prepare and memorize key professional examples",
          "Work on professional presentation skills"
        ]
      };
    } else {
      return {
        overallScore: Math.max(15, Math.min(40, percentage * 0.8)),
        level: "🌱 Interview Beginner",
        summary: "Focus on building fundamental interview skills and professional communication before applying to positions.",
        strengths: [
          "Completed the interview simulation",
          "Open to learning and feedback"
        ],
        improvements: [
          "Learn basic interview etiquette and expectations",
          "Develop professional communication skills",
          "Build confidence in speaking about yourself",
          "Practice basic question-answer formats",
          "Prepare relevant examples from your experience",
          "Work on providing complete, detailed responses"
        ],
        nextSteps: [
          "Take basic interview preparation courses",
          "Practice with simple questions daily",
          "Work with career counselors or coaches",
          "Build professional experience through internships or volunteering",
          "Practice speaking about your experiences confidently"
        ]
      };
    }
  };
  if (showResults && !finalAnalysis) {
    return (
      <div className="fixed inset-0 bg-white z-50 lg:left-64 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">AI Analyzing Your Interview Performance...</h2>
          <p className="text-gray-600">Evaluating your responses and communication skills</p>
        </div>
      </div>
    );
  }

  if (showResults && finalAnalysis) {
    return (
      <div className="fixed inset-0 bg-white z-50 lg:left-64">
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <Button 
              onClick={onBack}
              variant="ghost" 
              className="mb-6 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Simulations
            </Button>
          </div>

          <div className="px-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">{Math.round(finalAnalysis.overallScore)}%</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Analysis Complete!</h1>
              <p className="text-xl text-green-600 font-semibold">{finalAnalysis.level}</p>
            </div>

            <Card className="p-6 border-green-200 bg-green-50 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Interview Coach Summary
              </h3>
              <p className="text-green-700 leading-relaxed text-lg">{finalAnalysis.summary}</p>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6 border-blue-200 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-blue-700 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 border-orange-200 bg-orange-50">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-orange-700 flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Recommended Next Steps
              </h3>
              <div className="grid gap-3">
                {finalAnalysis.nextSteps.map((step: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="text-center mt-8 pb-6">
              <Button onClick={onBack} className="bg-green-500 hover:bg-green-600 text-white px-8 py-2">
                Try Another Simulation
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-white z-50 lg:left-64">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="mb-6 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Simulations
          </Button>
        </div>

        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">AI Job Interview Coach</h1>
            <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="px-6">
          <Card className="p-6 mb-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                      {message.type === 'ai' ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      message.type === 'ai' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isGeneratingAI && (
                <div className="flex justify-start">
                  <div className="flex items-start">
                    <div className="mr-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm ml-2">Analyzing your interview performance...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Current Question */}
        {showingQuestion && !showResults && (
          <div className="px-6 pb-6">
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Bot className="w-6 h-6 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {currentQ.level.toUpperCase()} LEVEL
                  </span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-700 mb-2"><strong>Interview Context:</strong></p>
                  <p className="text-green-800">{currentQ.scenario}</p>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 leading-relaxed mb-4">
                  {currentQ.question}
                </h2>
              </div>

              {/* Text Input Area */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your interview response here... or use the microphone to speak"
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                    rows={4}
                  />
                  
                  {/* Microphone Button */}
                  <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                    {speechSupported ? (
                      <Button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={`p-2 rounded-full ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                        title={isListening ? 'Stop recording' : 'Start voice input'}
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4 text-white" />
                        ) : (
                          <Mic className="w-4 h-4 text-white" />
                        )}
                      </Button>
                    ) : (
                      <div 
                        className="p-2 rounded-full bg-gray-300 cursor-not-allowed"
                        title="Speech recognition not supported in this browser"
                      >
                        <MicOff className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 p-2 rounded-full"
                      title="Send response"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
                
                {isListening && (
                  <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium">🎤 Listening... Speak clearly (click mic to stop)</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  </div>
                )}
                
                {speechError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-600">⚠️</span>
                        <span className="text-sm text-yellow-800">{speechError}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {speechError.includes("temporarily unavailable") || speechError.includes("service") ? (
                          <button 
                            onClick={retryListening}
                            className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded"
                          >
                            Retry
                          </button>
                        ) : null}
                        <button 
                          onClick={() => setSpeechError("")}
                          className="text-xs text-yellow-600 hover:text-yellow-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!speechSupported && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">ℹ️</span>
                      <span className="text-sm text-blue-800">
                        Speech recognition not supported. Please type your response or try Chrome/Edge browser.
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <div>💡 Tip: Use the STAR method (Situation, Task, Action, Result) for behavioral questions. Be specific and confident!</div>
                  <div className="flex items-center justify-center space-x-4 text-xs">
                    {speechSupported && (
                      <span>🎤 Ctrl+M: Toggle microphone</span>
                    )}
                    <span>⌨️ Ctrl+Enter: Send response</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}