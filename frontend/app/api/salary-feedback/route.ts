import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userResponse, question, scenario } = await request.json();

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

    const prompt = `Analyze this salary negotiation response and provide detailed feedback.

SCENARIO: ${scenario}
QUESTION: ${question}
USER RESPONSE: "${userResponse}"

Respond with ONLY this JSON format (no other text):
{
  "score": [number 1-10],
  "feedback": "[detailed 3-4 sentence analysis of their response quality, relevance, and professionalism]",
  "tip": "[specific actionable advice for improvement, 2-3 sentences]",
  "relevance": "[assess if response addresses the question - 'relevant', 'partially relevant', or 'irrelevant']"
}

Evaluation criteria:
- Relevance to the salary negotiation question (heavily weighted)
- Professional communication style
- Use of market research/data
- Confidence and assertiveness
- Strategic thinking
- Negotiation tactics

Scoring guidelines:
- 1-3: Irrelevant, unprofessional, or completely off-topic responses
- 4-5: Somewhat relevant but lacks professionalism or strategy
- 6-7: Good relevance and professionalism, room for improvement
- 8-9: Excellent response with strong negotiation elements
- 10: Perfect response demonstrating expert negotiation skills

If the response is completely unrelated to salary negotiation, give a score of 1-2 and explain why it's inappropriate.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
            content: 'You are a salary negotiation expert. Respond ONLY with valid JSON. No explanations, no markdown, just the JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 250,
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
      
      // Validate the response structure
      if (feedback.score && feedback.feedback && feedback.tip) {
        return NextResponse.json({ feedback });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Try to extract information from non-JSON response
      const scoreMatch = aiResponse.match(/score["\s]*:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      
      // Use the raw response as feedback if it's not too long
      const feedback = aiResponse.length > 300 ? 
        "Your response needs more strategic thinking and professional communication. Consider focusing on market research, your unique value proposition, and maintaining a collaborative but confident tone throughout the negotiation process." : 
        aiResponse;
      
      return NextResponse.json({
        feedback: {
          score: score,
          feedback: feedback,
          tip: "Research market rates thoroughly, practice articulating your value with specific examples, and maintain professional confidence while being open to collaborative solutions."
        }
      });
    }

  } catch (error) {
    console.error('Error in salary feedback API:', error);
    
    // Handle timeout or network errors with fast fallback
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      console.log('API timeout, using fast fallback');
    }
    
    // Quick fallback response
    const quickScore = Math.floor(Math.random() * 4) + 6; // 6-9 range
    const quickFeedbacks = [
      "Your response shows engagement with the scenario but could benefit from more strategic thinking and specific negotiation tactics. Consider incorporating market research data and demonstrating your unique value proposition more clearly. The tone is appropriate but needs more confidence and structure.",
      "This is a professional approach that demonstrates basic understanding of negotiation principles. However, you could strengthen your position by providing more specific examples of your achievements and quantifiable value. Consider being more assertive while maintaining collaborative spirit.",
      "Your response indicates good awareness of the negotiation context and shows willingness to engage professionally. To improve, focus on presenting concrete data about market rates and your specific contributions. Practice articulating your worth with more confidence and strategic positioning.",
      "You've demonstrated basic communication skills and professional courtesy in your response. For stronger negotiation outcomes, incorporate more research-backed arguments, specific salary ranges, and clearer value propositions. Work on balancing assertiveness with collaborative problem-solving approaches."
    ];
    const quickTips = [
      "Research industry salary ranges thoroughly using multiple sources like Glassdoor, PayScale, and industry reports. Practice your negotiation conversation with specific examples of your achievements and quantifiable contributions to previous employers.",
      "Develop a clear value proposition by listing 3-5 specific accomplishments with measurable results. Practice stating your desired salary range confidently while remaining open to discussing the complete compensation package including benefits and growth opportunities.",
      "Prepare market data from at least 3 reliable sources and practice presenting it professionally. Focus on collaborative language like 'based on my research' and 'I'd like to discuss' rather than demanding or ultimatum-style phrasing.",
      "Build confidence through mock negotiations with friends or mentors. Prepare responses to common objections and practice maintaining professional composure while advocating for your worth. Remember that negotiation is expected and shows you value yourself appropriately."
    ];
    
    const randomIndex = Math.floor(Math.random() * quickFeedbacks.length);
    
    return NextResponse.json({
      feedback: {
        score: quickScore,
        feedback: quickFeedbacks[randomIndex],
        tip: quickTips[randomIndex]
      }
    });
  }
}