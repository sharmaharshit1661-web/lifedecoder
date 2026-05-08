import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let userResponse = '';
  let question = '';
  let scenario = '';
  
  try {
    const requestData = await request.json();
    userResponse = requestData.userResponse;
    question = requestData.question;
    scenario = requestData.scenario;

    if (!userResponse || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NVIDIA API key not configured' },
        { status: 500 }
      );
    }

    // Get configuration from environment variables
    const apiUrl = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';

    const prompt = `You are a STRICT job interview evaluator. Analyze this interview response with HARSH but FAIR scoring.

INTERVIEW CONTEXT: ${scenario}
QUESTION: ${question}
CANDIDATE RESPONSE: "${userResponse}"

STRICT SCORING CRITERIA:
- 1-2: Completely irrelevant, nonsensical, or extremely unprofessional responses
- 3-4: Poor responses with no examples, very brief, or shows lack of preparation
- 5-6: Basic responses that answer the question but lack depth, examples, or professionalism
- 7-8: Good responses with relevant examples, professional tone, and clear structure
- 9-10: Exceptional responses with specific examples, quantified results, and excellent communication

IMPORTANT: If the response is NOT directly related to the question, score 1-3 maximum.
If the response is too brief (under 20 words), score 1-4 maximum.
If the response lacks any specific examples or details, score 3-5 maximum.

Respond with ONLY this JSON format (no other text):
{
  "score": [number 1-10],
  "feedback": "[one sentence explaining why this score was given]",
  "tip": "[one specific actionable tip for improvement]"
}

Examples:
- Irrelevant response: {"score": 2, "feedback": "Your response doesn't address the interview question at all.", "tip": "Listen carefully to the question and provide a direct, relevant answer."}
- Too brief: {"score": 3, "feedback": "Your response is too short and lacks the detail expected in an interview.", "tip": "Expand your answers with specific examples and context."}
- No examples: {"score": 4, "feedback": "Your response lacks concrete examples to support your claims.", "tip": "Use the STAR method with specific situations from your experience."}
- Good response: {"score": 8, "feedback": "Excellent use of specific examples and confident delivery.", "tip": "Quantify your achievements with numbers when possible."}

BE STRICT. Most responses should score 3-6. Only truly excellent responses deserve 8-10.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a STRICT job interview evaluator. Be harsh but fair in your scoring. Most responses should score 3-6. Only exceptional responses deserve 8-10. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        top_p: 0.7,
        max_tokens: 150,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', response.status, errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('NVIDIA API response:', data);
    
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error('No AI response content');
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    console.log('AI response content:', aiResponse);

    // Try to parse the JSON response
    try {
      const feedback = JSON.parse(aiResponse);
      
      if (feedback.score && feedback.feedback && feedback.tip) {
        return NextResponse.json({ feedback });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Fallback with STRICT scoring
      const userResponseLower = userResponse.toLowerCase();
      const questionLower = question.toLowerCase();
      
      // Check if response is relevant to the question
      const questionWords = questionLower.split(' ').filter((word: string) => word.length > 3);
      const responseWords = userResponseLower.split(' ');
      const relevanceScore = questionWords.filter((word: string) => 
        responseWords.some((respWord: string) => respWord.includes(word) || word.includes(respWord))
      ).length;
      
      let score = 1;
      let feedback = "Your response needs significant improvement.";
      let tip = "Listen carefully to the question and provide a relevant, detailed answer.";
      
      // Length check
      if (userResponse.trim().length < 20) {
        score = Math.min(3, score + 1);
        feedback = "Your response is too brief for an interview setting.";
        tip = "Provide more detailed answers with specific examples.";
      }
      // Relevance check
      else if (relevanceScore === 0) {
        score = Math.min(2, score + 1);
        feedback = "Your response doesn't address the interview question.";
        tip = "Listen carefully and answer the specific question asked.";
      }
      // Basic response check
      else if (userResponse.trim().length < 50) {
        score = Math.min(4, score + 2);
        feedback = "Your response lacks the depth expected in an interview.";
        tip = "Expand your answer with specific examples and details.";
      }
      // Decent length but needs improvement
      else {
        score = Math.min(5, score + 3);
        feedback = "Your response shows effort but needs more structure and examples.";
        tip = "Use the STAR method and provide concrete examples from your experience.";
      }
      
      return NextResponse.json({
        feedback: {
          score: score,
          feedback: feedback,
          tip: tip
        }
      });
    }

  } catch (error) {
    console.error('Error in interview feedback API:', error);
    
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      console.log('API timeout, using strict fallback');
    }
    
    // STRICT fallback scoring - most responses should be 2-5
    const userResponseText = userResponse || '';
    const userResponseLower = userResponseText.toLowerCase();
    const responseLength = userResponseText.trim().length;
    
    let score = 2;
    let feedback = "Unable to properly analyze your response.";
    let tip = "Please provide a clear, relevant answer to the interview question.";
    
    if (responseLength < 15) {
      score = 1;
      feedback = "Your response is too brief and lacks substance.";
      tip = "Provide detailed answers with specific examples from your experience.";
    } else if (responseLength < 40) {
      score = 3;
      feedback = "Your response needs more detail and examples.";
      tip = "Expand your answers using the STAR method (Situation, Task, Action, Result).";
    } else if (responseLength < 80) {
      score = 4;
      feedback = "Your response shows effort but lacks professional depth.";
      tip = "Include specific examples and demonstrate your value to the employer.";
    } else {
      score = 5;
      feedback = "Your response has good length but may need better structure.";
      tip = "Focus on relevance, specific examples, and confident delivery.";
    }
    
    return NextResponse.json({
      feedback: {
        score: score,
        feedback: feedback,
        tip: tip
      }
    });
  }
}