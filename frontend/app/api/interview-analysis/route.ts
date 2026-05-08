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

    const conversationSummary = questions.map((q: any, index: number) => 
      `QUESTION ${index + 1} (${q.level}): ${q.question}\nCANDIDATE RESPONSE: "${userAnswers[index]}"\n`
    ).join('\n');

    const prompt = `You are an expert job interview coach. Analyze this complete interview session and provide comprehensive feedback.

COMPLETE INTERVIEW:
${conversationSummary}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": [1-100 percentage],
  "level": "Interview Beginner/Developing Candidate/Strong Candidate/Interview Ready/Interview Expert",
  "summary": "2-3 sentence overall assessment of interview performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "nextSteps": ["step1", "step2", "step3", "step4"],
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendedResources": ["resource1", "resource2", "resource3"]
}

Evaluate based on:
- Professional communication and articulation
- Use of specific examples and STAR method
- Confidence and enthusiasm
- Relevance and depth of responses
- Interview best practices and etiquette
- Career awareness and goal alignment

Be thorough, encouraging, and provide actionable advice for interview improvement.`;

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
            content: 'You are an expert job interview coach with 20+ years of experience. Provide detailed, actionable feedback in valid JSON format.'
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

    try {
      const analysis = JSON.parse(aiResponse);
      return NextResponse.json({ analysis });
    } catch (parseError) {
      return NextResponse.json({
        analysis: {
          overallScore: 75,
          level: "Developing Candidate",
          summary: "You show good potential in job interviews with room for improvement in specific examples and confidence.",
          strengths: ["Engaged with all questions", "Showed professional awareness", "Completed the interview simulation"],
          improvements: ["Use more specific examples with quantified results", "Practice the STAR method for behavioral questions", "Build confidence in your responses"],
          nextSteps: ["Practice mock interviews with friends or mentors", "Prepare 5-7 strong professional examples", "Research common interview questions in your field", "Work on confident body language and tone"],
          keyInsights: ["Focus on storytelling with specific examples", "Build confidence through practice", "Learn to articulate your unique value proposition"],
          recommendedResources: ["Interview skills workshops", "STAR method training", "Professional networking groups", "Career coaching services"]
        }
      });
    }

  } catch (error) {
    console.error('Error in interview analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}