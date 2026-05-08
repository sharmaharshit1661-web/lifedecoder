import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userAnswers, questions } = await request.json();

    if (!userAnswers || !questions || userAnswers.length !== questions.length) {
      return NextResponse.json(
        { error: 'Invalid data provided' },
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

    // Create a comprehensive analysis prompt
    const conversationSummary = questions.map((q: any, index: number) => 
      `SCENARIO ${index + 1} (${q.level}): ${q.question}\nUSER RESPONSE: "${userAnswers[index]}"\n`
    ).join('\n');

    const prompt = `You are an expert salary negotiation coach. Analyze this complete negotiation training session and provide comprehensive feedback.

COMPLETE CONVERSATION:
${conversationSummary}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": [1-100 percentage],
  "level": "Beginner/Developing/Skilled/Expert/Master Negotiator",
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "nextSteps": ["step1", "step2", "step3", "step4"],
  "levelBreakdown": {
    "beginner": "Performance on beginner questions",
    "intermediate": "Performance on intermediate questions", 
    "advanced": "Performance on advanced questions",
    "rapid": "Performance on rapid-fire questions"
  },
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendedResources": ["resource1", "resource2", "resource3"]
}

Evaluate based on:
- Professional communication
- Strategic thinking
- Confidence and assertiveness
- Use of research/data
- Emotional intelligence
- Negotiation tactics
- Consistency across difficulty levels

Be thorough, encouraging, and provide actionable advice for career growth.`;

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
            content: 'You are an expert salary negotiation coach with 20+ years of experience. Provide detailed, actionable feedback in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get AI analysis' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Try to parse the JSON response
    try {
      const analysis = JSON.parse(aiResponse);
      return NextResponse.json({ analysis });
    } catch (parseError) {
      // If JSON parsing fails, return a fallback structured response
      return NextResponse.json({
        analysis: {
          overallScore: 75,
          level: "Developing Negotiator",
          summary: "You show good potential in salary negotiation with room for strategic improvement.",
          strengths: ["Engaged with all scenarios", "Showed willingness to learn", "Maintained professional tone"],
          improvements: ["Use more market research", "Develop stronger value propositions", "Practice handling pressure"],
          nextSteps: ["Research salary ranges for your field", "Practice mock negotiations", "Build achievement portfolio", "Seek mentorship"],
          levelBreakdown: {
            beginner: "Good foundation with basic concepts",
            intermediate: "Developing strategic thinking",
            advanced: "Needs more experience with complex scenarios",
            rapid: "Quick thinking shows potential"
          },
          keyInsights: ["Focus on preparation", "Build confidence through practice", "Learn to articulate value clearly"],
          recommendedResources: ["Salary negotiation courses", "Industry salary reports", "Professional networking groups"]
        }
      });
    }

  } catch (error) {
    console.error('Error in salary analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}