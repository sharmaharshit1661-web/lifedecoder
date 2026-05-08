import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Providers — lazily initialised on first use
let _nvidiaClient = null;
let _openai       = null;
let _anthropic    = null;
let _initialised  = false;

function initProviders() {
  if (_initialised) return;
  _initialised = true;

  const nvidiaKey   = process.env.NVIDIA_API_KEY;
  const openaiKey   = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (nvidiaKey && nvidiaKey !== 'your_nvidia_api_key_here') {
    _nvidiaClient = {
      apiKey: nvidiaKey,
      apiUrl: process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',
      model:  process.env.NVIDIA_MODEL   || 'meta/llama-3.1-405b-instruct',
    };
    console.log('✅ NVIDIA client initialised');
  }

  if (openaiKey && openaiKey !== 'your-openai-api-key-here') {
    _openai = new OpenAI({ apiKey: openaiKey });
    console.log('✅ OpenAI client initialised');
  }

  if (anthropicKey && anthropicKey !== 'your-anthropic-api-key-here') {
    _anthropic = new Anthropic({ apiKey: anthropicKey });
    console.log('✅ Anthropic client initialised');
  }

  const active = _nvidiaClient ? 'nvidia' : _openai ? 'openai' : _anthropic ? 'anthropic' : 'NONE';
  console.log(`🤖 Active AI provider: ${active}`);
}

// ─── Core: try NVIDIA → OpenAI → Anthropic ──────────────────────────────────
async function generateText(prompt, temperature = 0.3, maxTokens = 2000) {
  initProviders();
  const errors = [];

  if (_nvidiaClient) {
    try {
      const res = await fetch(_nvidiaClient.apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${_nvidiaClient.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: _nvidiaClient.model, messages: [{ role: 'user', content: prompt }], temperature, top_p: 0.7, max_tokens: maxTokens, stream: false }),
      });
      if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty NVIDIA response');
      console.log('✅ Response from NVIDIA');
      return { text: content, provider: 'nvidia' };
    } catch (e) {
      console.warn('⚠️  NVIDIA failed:', e.message);
      errors.push(`NVIDIA: ${e.message}`);
    }
  }

  if (_openai) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o';
      const completion = await _openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], temperature, max_tokens: maxTokens });
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');
      console.log('✅ Response from OpenAI');
      return { text: content, provider: 'openai' };
    } catch (e) {
      console.warn('⚠️  OpenAI failed:', e.message);
      errors.push(`OpenAI: ${e.message}`);
    }
  }

  if (_anthropic) {
    try {
      const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
      const response = await _anthropic.messages.create({ model, max_tokens: maxTokens, temperature, messages: [{ role: 'user', content: prompt }] });
      const content = response.content[0]?.text;
      if (!content) throw new Error('Empty Anthropic response');
      console.log('✅ Response from Anthropic');
      return { text: content, provider: 'anthropic' };
    } catch (e) {
      console.warn('⚠️  Anthropic failed:', e.message);
      errors.push(`Anthropic: ${e.message}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─── Public API ──────────────────────────────────────────────────────────────
export class ResponseGenerator {

  static async generateDocumentAnalysis(query, context, options = {}) {
    const { temperature = 0.1, includeConfidence = true, documentType = 'general' } = options;
    const prompt = this.buildDocumentAnalysisPrompt(query, context, documentType);
    const { text, provider } = await generateText(prompt, temperature, 3000);
    const structured = this.parseDocumentAnalysisResponse(text, includeConfidence);
    return { ...structured, query, provider, timestamp: new Date().toISOString() };
  }

  static async generateCoachResponse(query, context, userProfile, options = {}) {
    const { temperature = 0.3, conversationHistory = [] } = options;
    const prompt = this.buildCoachPrompt(query, context, userProfile, conversationHistory);
    const { text, provider } = await generateText(prompt, temperature, 2000);
    return {
      response: text.trim(),
      personalization: { adaptedFor: userProfile.knowledgeLevel, tone: this.determineTone(userProfile) },
      query, provider, timestamp: new Date().toISOString(),
    };
  }

  static async generateQuickResponse(query, userProfile) {
    const prompt = `As LifeDecoder's AI coach, give a brief helpful response (under 100 words) to: "${query}"\nUser: ${userProfile.age || 'young adult'} years old, ${userProfile.knowledgeLevel || 'beginner'} level. Be friendly and actionable.`;
    try {
      const { text } = await generateText(prompt, 0.3, 300);
      return text.trim();
    } catch {
      return "I'd be happy to help! Could you provide a bit more detail about your situation?";
    }
  }

  static async generateWithNvidia(prompt, temperature = 0.1) {
    initProviders();
    if (!_nvidiaClient) throw new Error('NVIDIA not configured');
    const { text } = await generateText(prompt, temperature, 3000);
    return text;
  }

  static async generateWithOpenAI(prompt, model = null, temperature = 0.1) {
    initProviders();
    if (!_openai) throw new Error('OpenAI not configured');
    const m = model || process.env.OPENAI_MODEL || 'gpt-4o';
    const c = await _openai.chat.completions.create({ model: m, messages: [{ role: 'user', content: prompt }], temperature, max_tokens: 2000 });
    return c.choices[0].message.content;
  }

  static async generateWithAnthropic(prompt, model = null, temperature = 0.1) {
    initProviders();
    if (!_anthropic) throw new Error('Anthropic not configured');
    const m = model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    const r = await _anthropic.messages.create({ model: m, max_tokens: 2000, temperature, messages: [{ role: 'user', content: prompt }] });
    return r.content[0].text;
  }

  // ── Prompts ────────────────────────────────────────────────────────────────
  static buildDocumentAnalysisPrompt(query, context, documentType) {
    const instructions = {
      lease: 'Focus on rent, deposits, lease terms, pet policies, maintenance, and termination clauses.',
      contract: 'Focus on obligations, deadlines, payment terms, penalties, and termination conditions.',
      medical: 'Highlight covered services, copays, deductibles, network restrictions, and claim procedures.',
      insurance: 'Identify coverage limits, exclusions, deductibles, claim processes, and renewal terms.',
      financial: 'Point out fees, interest rates, payment schedules, penalties, and account terms.',
      tax: 'Explain deductions, filing requirements, deadlines, and potential penalties.',
    };
    return `You are an expert document analyzer helping young adults understand complex documents.

DOCUMENT CONTEXT:
${context}

USER QUERY: ${query}
DOCUMENT TYPE: ${documentType}
INSTRUCTIONS: ${instructions[documentType] || 'Analyze all important terms and conditions.'}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence plain-language summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "redFlags": ["concern 1", "concern 2"],
  "recommendations": ["action 1", "action 2"],
  "confidence": 0.9,
  "sourceSnippets": ["quote 1", "quote 2"]
}`;
  }

  static buildCoachPrompt(query, context, userProfile, conversationHistory) {
    const profile = this.summarizeUserProfile(userProfile);
    const history = conversationHistory.length > 0
      ? `\nCONVERSATION HISTORY:\n${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`
      : '';
    return `You are LifeDecoder's AI Life Coach for young adults.

USER PROFILE:\n${profile}
RELEVANT CONTEXT:\n${context || 'No specific document context.'}
${history}

USER QUESTION: ${query}

Provide personalised, actionable advice adapted to their knowledge level (${userProfile.knowledgeLevel || 'beginner'}). Be encouraging and concise.`;
  }

  // ── Parsers ────────────────────────────────────────────────────────────────
  static parseDocumentAnalysisResponse(response, includeConfidence = true) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          redFlags: parsed.redFlags || [],
          recommendations: parsed.recommendations || [],
          confidence: includeConfidence ? (parsed.confidence || 0.8) : undefined,
          sourceSnippets: parsed.sourceSnippets || [],
        };
      }
    } catch {}
    return {
      summary: response.substring(0, 300),
      keyPoints: ['See summary above'],
      redFlags: [],
      recommendations: ['Review the document carefully'],
      confidence: includeConfidence ? 0.5 : undefined,
      sourceSnippets: [],
    };
  }

  static summarizeUserProfile(p) {
    return [
      p.age && `Age: ${p.age}`,
      p.employmentStatus && `Employment: ${p.employmentStatus}`,
      p.knowledgeLevel && `Knowledge Level: ${p.knowledgeLevel}`,
      p.lifeDecoderScore && `LifeDecoder Score: ${p.lifeDecoderScore}/100`,
    ].filter(Boolean).join('\n') || 'New user.';
  }

  static determineTone(p) {
    if (p.knowledgeLevel === 'beginner') return 'simple, encouraging, step-by-step';
    if (p.knowledgeLevel === 'advanced') return 'detailed, comprehensive, efficient';
    return 'balanced, informative, supportive';
  }
}

// Provider status for health endpoint
export const providerStatus = {
  get nvidia()    { initProviders(); return !!_nvidiaClient; },
  get openai()    { initProviders(); return !!_openai; },
  get anthropic() { initProviders(); return !!_anthropic; },
  get active()    { initProviders(); return _nvidiaClient ? 'nvidia' : _openai ? 'openai' : _anthropic ? 'anthropic' : null; },
};

export default ResponseGenerator;
