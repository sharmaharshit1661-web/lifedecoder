"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, User, Zap, Target, CheckCircle, Mic, MicOff, Send } from "lucide-react";

const questions = [
  // Beginner Level
  {
    level: "beginner",
    question: "You receive your first job offer of ₹4 LPA, but you know the market average is ₹6 LPA. What would you say to the HR?",
    scenario: "You're excited about your first job offer, but the salary seems low compared to what you've researched.",
    idealResponse: "Thank the employer, express enthusiasm, then professionally present market research data and request a salary discussion."
  },
  {
    level: "beginner", 
    question: "The HR asks: 'What are your salary expectations?' How do you respond?",
    scenario: "This is a direct question that many candidates struggle with. Your response sets the tone for the entire negotiation.",
    idealResponse: "Provide a researched salary range based on market data, your skills, and the role's requirements."
  },
  {
    level: "beginner",
    question: "You're feeling nervous during the salary negotiation. What approach would you take to handle this situation?",
    scenario: "Nervousness is natural, but how you handle it can make or break your negotiation.",
    idealResponse: "Take a deep breath, rely on prepared facts and data, speak confidently about your value, and remember that negotiation is normal."
  },
  // Intermediate Level
  {
    level: "intermediate",
    question: "You have two offers: ₹6 LPA from Company A and ₹7.5 LPA from Company B. How would you approach Company A about this?",
    scenario: "You prefer Company A but they offered less. You want to give them a chance to match or improve their offer.",
    idealResponse: "Honestly inform Company A about the competing offer, express your preference for them, and ask if there's flexibility in their package."
  },
  {
    level: "intermediate",
    question: "The HR says: 'This is our final offer, we can't go any higher.' How do you respond?",
    scenario: "You're facing pressure and a seemingly non-negotiable position. Your response needs to be strategic.",
    idealResponse: "Stay calm, acknowledge their position, restate your value proposition, and explore non-salary benefits or future review timelines."
  },
  {
    level: "intermediate", 
    question: "You're offered a salary lower than your expectations. What would you say to open negotiations?",
    scenario: "The offer is disappointing, but you want to handle this professionally and keep the door open for negotiation.",
    idealResponse: "Express gratitude for the offer, then professionally explain your expectations based on your qualifications and market research."
  },
  // Advanced Level
  {
    level: "advanced",
    question: "During your appraisal, your manager says the budget is tight this year. How do you respond to still get a raise?",
    scenario: "Budget constraints are common excuses. You need to demonstrate your value and find creative solutions.",
    idealResponse: "Present concrete achievements, quantify your contributions, propose a timeline for review, or discuss non-monetary benefits."
  },
  {
    level: "advanced",
    question: "You realize the company culture is toxic, but they're offering great money. What's your decision and reasoning?",
    scenario: "This tests your long-term thinking and ability to weigh financial benefits against personal well-being.",
    idealResponse: "Prioritize long-term career growth and mental health over short-term financial gains, politely decline and continue job search."
  },
  // Rapid Questions
  {
    level: "rapid",
    question: "Should you always negotiate your first job offer? Explain your reasoning.",
    scenario: "Quick decision-making about negotiation strategy.",
    idealResponse: "Yes, professional negotiation shows you understand your value and is expected in most professional settings."
  },
  {
    level: "rapid",
    question: "Is it appropriate to mention other job offers during negotiation? How would you do it?",
    scenario: "Testing honesty and leverage strategy.",
    idealResponse: "Yes, but be honest about them. Use them as professional leverage while expressing genuine interest in the current opportunity."
  },
  {
    level: "rapid",
    question: "Would you negotiate via email or phone call? Why?",
    scenario: "Communication method strategy.",
    idealResponse: "Start with a phone call for personal connection, then follow up with email for documentation and clarity."
  },
  {
    level: "rapid",
    question: "The HR hasn't responded to your negotiation request for a week. What's your next move?",
    scenario: "Handling delays and maintaining professionalism.",
    idealResponse: "Send one polite follow-up email expressing continued interest and asking for a timeline on their decision."
  }
];

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export default function SalarySim({ onBack }: { onBack: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      content: "Hello! I'm your AI Salary Negotiation Coach. I'll present you with real-world scenarios, and you can respond by typing or speaking your answer. Let's begin with your first scenario!",
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
              // Don't show error for user-initiated stops
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
      // Ctrl/Cmd + Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (currentAnswer.trim()) {
          handleSubmitAnswer();
        }
      }
      // Ctrl/Cmd + M to toggle microphone
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
      // Clear any previous errors
      setSpeechError("");
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop any existing recognition
      if (isListening) {
        recognition.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsListening(true);
      recognition.start();
      
      // Auto-stop after 30 seconds to prevent hanging
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
    
    // Add user response to chat
    const userMessage: ChatMessage = {
      type: 'user',
      content: currentAnswer.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setUserAnswers(prev => [...prev, currentAnswer.trim()]);
    setCurrentAnswer("");
    setShowingQuestion(false);

    // Show AI thinking message with shorter text
    const thinkingMessage: ChatMessage = {
      type: 'ai',
      content: "Analyzing...",
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, thinkingMessage]);

    // Set a maximum wait time of 8 seconds total
    const maxWaitTime = 8000;
    const startTime = Date.now();

    try {
      // Get AI feedback from NVIDIA API with timeout
      const response = await Promise.race([
        fetch('/api/salary-feedback', {
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
        
        // Create concise AI response
        const aiResponse: ChatMessage = {
          type: 'ai',
          content: `📊 **Score: ${aiFeedback.score}/10**

${aiFeedback.feedback}

💡 **Improvement Strategy:** ${aiFeedback.tip}

${aiFeedback.relevance === 'irrelevant' ? '⚠️ **Note:** Your response didn\'t address the salary negotiation question. Please stay focused on the scenario.' : ''}`,
          timestamp: new Date()
        };

        // Replace thinking message with actual feedback
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = aiResponse;
          return newMessages;
        });
      } else {
        console.error('API response not ok:', response.status);
        // Fallback to simple feedback if API fails
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
      // Fallback to simple feedback
      const fallbackFeedback = generateSimpleFeedback(currentAnswer.trim(), question);
      const aiResponse: ChatMessage = {
        type: 'ai',
        content: fallbackFeedback,
        timestamp: new Date()
      };
      
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiResponse;
        return newMessages;
      });
    }

    // Move to next question or finish (reduced delay)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowingQuestion(true);
        
        const nextQuestion: ChatMessage = {
          type: 'ai',
          content: `Ready for the next challenge? This one is ${questions[currentQuestion + 1].level} level.`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, nextQuestion]);
      } else {
        // All questions completed
        setIsGeneratingAI(true);
        const finalMessage: ChatMessage = {
          type: 'ai',
          content: "Great work! Generating your final analysis...",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, finalMessage]);
        
        setTimeout(async () => {
          try {
            // Get comprehensive AI analysis with shorter timeout
            const response = await Promise.race([
              fetch('/api/salary-analysis', {
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
                    simulationType: 'salary-negotiation',
                    userContext: { questions: questions.length }
                  }),
                });
                
                let simulationId = 'salary-negotiation-' + Date.now();
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
                    score: data.analysis.overallScore || 50,
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
              // Fallback to simple analysis
              const analysis = analyzeOverallPerformance();
              setFinalAnalysis(analysis);
              
              // Still try to award XP with fallback analysis
              try {
                // First start the simulation
                const startResponse = await fetch('/api/simulations/start', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                  },
                  body: JSON.stringify({
                    simulationType: 'salary-negotiation',
                    userContext: { questions: questions.length }
                  }),
                });
                
                let simulationId = 'salary-negotiation-' + Date.now();
                if (startResponse.ok) {
                  const startData = await startResponse.json();
                  simulationId = startData.simulationId;
                }
                
                const simulationResponse = await fetch('/api/simulations/complete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                  },
                  body: JSON.stringify({
                    simulationId: simulationId,
                    score: analysis.overallScore || 50,
                    feedback: analysis.summary
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
            }
          } catch (error) {
            console.error('Error getting final analysis:', error);
            const analysis = analyzeOverallPerformance();
            setFinalAnalysis(analysis);
            
            // Still try to award XP even with error
            try {
              // First start the simulation
              const startResponse = await fetch('/api/simulations/start', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                },
                body: JSON.stringify({
                  simulationType: 'salary-negotiation',
                  userContext: { questions: questions.length }
                }),
              });
              
              let simulationId = 'salary-negotiation-' + Date.now();
              if (startResponse.ok) {
                const startData = await startResponse.json();
                simulationId = startData.simulationId;
              }
              
              const simulationResponse = await fetch('/api/simulations/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).token : ''}`,
                },
                body: JSON.stringify({
                  simulationId: simulationId,
                  score: analysis.overallScore || 50,
                  feedback: analysis.summary
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
    
    // Keywords for positive responses
    const positiveKeywords = [
      'research', 'market', 'data', 'professional', 'thank', 'grateful', 'value', 
      'skills', 'experience', 'achievements', 'contribute', 'range', 'flexible',
      'discuss', 'negotiate', 'honest', 'transparent', 'timeline', 'benefits'
    ];
    
    const negativeKeywords = [
      'fine', 'whatever', 'okay', 'sure', 'yes', 'no problem', 'accept'
    ];

    // Check for completely irrelevant responses
    const salaryKeywords = ['salary', 'pay', 'compensation', 'money', 'offer', 'negotiate', 'job', 'work', 'position'];
    const hasRelevantContent = salaryKeywords.some(keyword => response.includes(keyword));
    
    const positiveCount = positiveKeywords.filter(keyword => response.includes(keyword)).length;
    const negativeCount = negativeKeywords.filter(keyword => response.includes(keyword)).length;
    
    let score = 5; // Base score
    let feedback = "";
    let tip = "";
    
    // Check for irrelevant responses first
    if (!hasRelevantContent && responseLength > 10) {
      score = Math.max(1, 2);
      feedback = "Your response appears to be completely unrelated to the salary negotiation scenario presented. In a real negotiation, staying focused on the topic is crucial for achieving your goals. This type of response would confuse the employer and potentially harm your professional reputation. You need to directly address the salary discussion with relevant, strategic communication.";
      tip = "Please read the scenario carefully and respond specifically to the salary negotiation question. Focus on professional communication, market research, and your value proposition. Practice staying on topic and addressing the employer's concerns while advocating for your worth.";
    }
    // Adjust score based on content
    else if (responseLength < 10) {
      score = Math.max(1, score - 3);
      feedback = "Your response is far too brief for a salary negotiation context. Successful negotiations require thoughtful, detailed communication that demonstrates your professionalism and preparation. Such short responses suggest lack of preparation or disinterest, which can significantly weaken your negotiating position.";
      tip = "Provide more comprehensive responses that include specific examples, market research data, and clear articulation of your value. Practice explaining your reasoning and demonstrating your worth through detailed, professional communication.";
    } else if (positiveCount >= 3) {
      score = Math.min(10, score + 3);
      feedback = "Excellent professional approach that demonstrates strong strategic thinking and negotiation awareness! You've incorporated key elements like market research, professional communication, and value-driven arguments. Your response shows confidence while maintaining collaborative spirit, which is exactly what effective salary negotiation requires.";
      tip = "Continue using data-driven arguments and maintain this confident, professional tone. Consider adding specific examples of your achievements and quantifiable contributions to strengthen your position even further. Practice presenting salary ranges and discussing total compensation packages.";
    } else if (positiveCount >= 2) {
      score = Math.min(10, score + 2);
      feedback = "Good response that shows professional awareness and basic negotiation understanding. You've demonstrated appropriate communication style and some strategic thinking. However, your response could be strengthened with more specific examples, market data, and clearer articulation of your unique value proposition.";
      tip = "Add more market research data to support your position and include specific examples of your achievements with quantifiable results. Practice being more assertive while maintaining professional courtesy, and prepare responses to common negotiation objections.";
    } else if (negativeCount >= 2) {
      score = Math.max(1, score - 2);
      feedback = "Your response is too passive and accepting for effective salary negotiation. This approach suggests you're not prepared to advocate for your worth, which can result in significantly lower compensation offers. Employers expect some negotiation, and your passive stance may actually work against you professionally.";
      tip = "Don't just accept offers without discussion - research market rates and negotiate confidently. Practice articulating your value with specific examples and learn to present counter-offers professionally. Remember that negotiation is expected and shows you understand your professional worth.";
    } else if (responseLength > 100) {
      score = Math.min(10, score + 1);
      feedback = "Your detailed response shows good engagement with the negotiation scenario and demonstrates thoughtful consideration of the situation. You've provided substantial content which indicates preparation and seriousness about the discussion. However, focus on making your key points more strategically and concisely.";
      tip = "Focus on the most strategic points and use structured approaches like presenting market data, your value proposition, and desired outcomes clearly. Practice organizing your thoughts to maximize impact while maintaining professional brevity and clarity.";
    } else {
      feedback = "Your response shows basic engagement but needs more strategic depth and professional sophistication for effective salary negotiation. The content lacks specific examples, market awareness, and confident value articulation that successful negotiations require. This approach may result in missed opportunities for better compensation.";
      tip = "Research market rates thoroughly and practice confident, data-backed communication. Develop a clear value proposition with specific examples of your contributions and achievements. Learn to balance assertiveness with collaborative problem-solving in your negotiation approach.";
    }
    
    return `📊 **Score: ${score}/10**

${feedback}

💡 **Improvement Strategy:** ${tip}`;
  };

  const analyzeOverallPerformance = () => {
    // Analyze all user responses for comprehensive feedback
    const responses = userAnswers.join(' ').toLowerCase();
    
    const professionalWords = ['professional', 'research', 'market', 'data', 'value', 'skills', 'experience'];
    const strategicWords = ['negotiate', 'discuss', 'flexible', 'timeline', 'benefits', 'range'];
    const confidenceWords = ['confident', 'worth', 'deserve', 'contribute', 'achieve'];
    
    const professionalScore = professionalWords.filter(word => responses.includes(word)).length;
    const strategicScore = strategicWords.filter(word => responses.includes(word)).length;
    const confidenceScore = confidenceWords.filter(word => responses.includes(word)).length;
    
    const totalScore = professionalScore + strategicScore + confidenceScore;
    const maxScore = professionalWords.length + strategicWords.length + confidenceWords.length;
    const percentage = (totalScore / maxScore) * 100;
    
    if (percentage >= 70) {
      return {
        overallScore: Math.min(95, 70 + percentage * 0.3),
        level: "🏆 Expert Negotiator",
        summary: "Outstanding! Your responses demonstrate exceptional negotiation skills. You consistently used professional language, strategic thinking, and showed confidence in your worth.",
        strengths: [
          "Professional communication throughout all scenarios",
          "Strategic approach to complex negotiations",
          "Strong confidence in articulating value",
          "Data-driven decision making",
          "Excellent emotional intelligence"
        ],
        improvements: [
          "Continue practicing with real-world scenarios",
          "Stay updated with industry salary trends",
          "Mentor others in negotiation skills"
        ],
        nextSteps: [
          "Apply these skills in your next salary discussion",
          "Share your knowledge with colleagues",
          "Explore advanced negotiation courses",
          "Consider leadership roles requiring negotiation"
        ]
      };
    } else if (percentage >= 50) {
      return {
        overallScore: Math.min(80, 50 + percentage * 0.4),
        level: "🎯 Skilled Negotiator",
        summary: "Great job! You show solid understanding of negotiation principles. Your responses were generally professional with good strategic elements.",
        strengths: [
          "Good grasp of professional communication",
          "Understanding of basic negotiation principles",
          "Willingness to engage in discussions"
        ],
        improvements: [
          "Use more specific data and research in responses",
          "Develop stronger confidence in stating your worth",
          "Practice handling pressure situations",
          "Learn more strategic negotiation techniques"
        ],
        nextSteps: [
          "Practice mock negotiations with friends",
          "Research salary data for your field",
          "Read advanced negotiation books",
          "Join professional development workshops"
        ]
      };
    } else if (percentage >= 30) {
      return {
        overallScore: Math.min(65, 30 + percentage * 0.5),
        level: "📈 Developing Negotiator",
        summary: "You're making progress! Your responses show awareness of negotiation importance, but need more strategic development.",
        strengths: [
          "Awareness that negotiation is important",
          "Willingness to participate in discussions",
          "Basic understanding of professional behavior"
        ],
        improvements: [
          "Build confidence in your communication",
          "Learn to use market research effectively",
          "Practice articulating your value clearly",
          "Develop better responses to pressure"
        ],
        nextSteps: [
          "Start with salary research tools",
          "Practice basic negotiation scenarios",
          "Build a list of your achievements",
          "Seek mentorship from experienced professionals"
        ]
      };
    } else {
      return {
        overallScore: Math.max(25, percentage),
        level: "🌱 Beginner Negotiator",
        summary: "Everyone starts somewhere! Focus on building confidence and learning fundamental negotiation principles.",
        strengths: [
          "Completed the assessment",
          "Open to learning and feedback",
          "Recognized the importance of negotiation skills"
        ],
        improvements: [
          "Build basic confidence in professional conversations",
          "Learn fundamental negotiation principles",
          "Practice articulating your thoughts clearly",
          "Understand your market value"
        ],
        nextSteps: [
          "Read beginner negotiation guides",
          "Practice with low-stakes conversations",
          "Use salary comparison websites",
          "Join communication skills workshops"
        ]
      };
    }
  };

  if (showResults && !finalAnalysis) {
    return (
      <div className="fixed inset-0 bg-white z-50 lg:left-64 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">AI Generating Comprehensive Analysis...</h2>
          <p className="text-gray-600">Analyzing your negotiation skills across all scenarios</p>
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
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">{finalAnalysis.overallScore}%</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Analysis Complete!</h1>
              <p className="text-xl text-blue-600 font-semibold">{finalAnalysis.level}</p>
            </div>

            <Card className="p-6 border-blue-200 bg-blue-50 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Coach Summary
              </h3>
              <p className="text-blue-700 leading-relaxed text-lg">{finalAnalysis.summary}</p>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6 border-green-200 bg-green-50">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-green-700 flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
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

            {finalAnalysis.levelBreakdown && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Beginner</div>
                    <div className="font-semibold text-blue-600 text-xs">{finalAnalysis.levelBreakdown.beginner}</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600">Intermediate</div>
                    <div className="font-semibold text-purple-600 text-xs">{finalAnalysis.levelBreakdown.intermediate}</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600">Advanced</div>
                    <div className="font-semibold text-red-600 text-xs">{finalAnalysis.levelBreakdown.advanced}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Rapid Fire</div>
                    <div className="font-semibold text-green-600 text-xs">{finalAnalysis.levelBreakdown.rapid}</div>
                  </div>
                </div>
              </Card>
            )}

            {finalAnalysis.keyInsights && (
              <Card className="p-6 border-purple-200 bg-purple-50 mb-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {finalAnalysis.keyInsights.map((insight: string, index: number) => (
                    <li key={index} className="text-purple-700 flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Recommended Next Steps
              </h3>
              <div className="grid gap-3">
                {finalAnalysis.nextSteps.map((step: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            {finalAnalysis.recommendedResources && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Recommended Resources</h3>
                <ul className="space-y-2">
                  {finalAnalysis.recommendedResources.map((resource: string, index: number) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {resource}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="text-center mt-8 pb-6">
              <Button onClick={onBack} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2">
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
            <h1 className="text-2xl font-bold text-gray-800">AI Salary Negotiation Coach</h1>
            <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
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
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
                        ? 'bg-blue-100 text-blue-800' 
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
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-sm ml-2">Analyzing your responses...</span>
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
                  <Bot className="w-6 h-6 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {currentQ.level.toUpperCase()} LEVEL
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700 mb-2"><strong>Scenario:</strong></p>
                  <p className="text-blue-800">{currentQ.scenario}</p>
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
                    placeholder="Type your response here... or use the microphone to speak"
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
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
                            : 'bg-blue-500 hover:bg-blue-600'
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
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 p-2 rounded-full"
                      title="Send response"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
                
                {isListening && (
                  <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium">🎤 Listening... Speak now (click mic to stop)</span>
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
                  <div>💡 Tip: Be specific about your approach, mention research or data if relevant, and maintain a professional tone.</div>
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