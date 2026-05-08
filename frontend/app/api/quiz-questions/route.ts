import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { age } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Determine age group and difficulty
    const ageNum = parseInt(age) || 18;
    let ageGroup: string;
    let difficulty: string;
    let context: string;

    if (ageNum <= 16) {
      ageGroup = 'teenager (13-16)';
      difficulty = 'very basic and simple';
      context = 'Focus on: pocket money, saving, basic banking, school jobs, online safety, understanding bills at home, basic rights as a minor.';
    } else if (ageNum <= 19) {
      ageGroup = 'young adult just turning 18-19';
      difficulty = 'beginner to intermediate';
      context = 'Focus on: first bank account, credit basics, first job, taxes (W-2), renting for the first time, health insurance basics, tenant rights, budgeting.';
    } else if (ageNum <= 24) {
      ageGroup = 'young adult (20-24)';
      difficulty = 'intermediate';
      context = 'Focus on: credit scores, investing basics, salary negotiation, lease agreements, health insurance deductibles, student loans, 401k basics, emergency funds.';
    } else if (ageNum <= 30) {
      ageGroup = 'adult (25-30)';
      difficulty = 'intermediate to advanced';
      context = 'Focus on: investing (stocks, ETFs, Roth IRA), mortgage basics, life insurance, career growth, tax deductions, debt management, building wealth.';
    } else {
      ageGroup = 'adult (30+)';
      difficulty = 'advanced';
      context = 'Focus on: retirement planning, real estate, tax optimization, estate planning, insurance coverage, wealth building, financial independence.';
    }

    const prompt = `Generate exactly 10 multiple-choice life skills quiz questions for a ${ageGroup} (${difficulty} level).

${context}

Return ONLY this JSON (no markdown, no extra text):
{"questions":[{"id":1,"category":"finance","question":"...?","options":["A","B","C","D"],"correctAnswer":"A"}]}

Rules: 4 options each, 1 correct answer, practical real-world questions, varied categories from: finance, credit, taxes, insurance, renting, employment, rights, healthcare, investing, budgeting`;

    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const model = 'gpt-4o';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      questions: parsed.questions,
      ageGroup,
      difficulty,
    });

  } catch (error: any) {
    console.error('Quiz questions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
