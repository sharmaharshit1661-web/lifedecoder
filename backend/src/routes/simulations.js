import express from 'express';
import { protect } from '../middleware/auth.js';
import Simulation from '../models/Simulation.js';

const router = express.Router();

// Helper function to call NVIDIA API
async function callNvidiaAPI(messages, systemPrompt, maxTokens = 512) {
  // Get configuration from environment variables
  const apiUrl = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
  const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('NVIDIA API error:', response.status, errorData);
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from NVIDIA API');
  }

  return content;
}

// Start a simulation
router.post('/start', protect, async (req, res) => {
  try {
    const { simulationType, userContext } = req.body;

    const simulationPrompts = {
      'salary-negotiation': `You are simulating a hiring manager in a salary negotiation. 
      The user is negotiating their first job offer. Be realistic but fair. 
      Start by presenting an initial offer of $65,000 for an entry-level position.
      Respond to their negotiation attempts professionally. You can go up to $75,000 if they negotiate well.`,
      
      'job-interview': `You are conducting a job interview for an entry-level software developer position. 
      Ask relevant questions about their experience, skills, and motivation.
      Provide constructive feedback on their responses. Be professional but friendly.`,
      
      'lease-negotiation': `You are a landlord discussing lease terms with a potential tenant. 
      The apartment is $1,500/month. Be professional and willing to negotiate within reason.
      You can discuss security deposit, lease length, and minor repairs.`,

      'budget-crisis': `You are a financial advisor helping someone through an unexpected $2,000 car repair bill.
      They have $500 in savings. Guide them through options and decision-making.`,

      'career-change': `You are a career counselor helping someone explore switching from their current field.
      Ask about their interests, skills, and concerns. Provide realistic guidance.`,

      'family-conflict': `You are a family therapist helping navigate a difficult conversation.
      Be empathetic and provide communication strategies. Focus on healthy conflict resolution.`
    };

    const systemPrompt = simulationPrompts[simulationType] || 
      'You are facilitating a life skills simulation. Be helpful and realistic.';

    // Create simulation record
    const simulation = await Simulation.create({
      userId: req.user.id,
      simulationType,
      conversationHistory: [],
    });

    // Get initial message from AI
    const initialMessage = await callNvidiaAPI([{
      role: 'user',
      content: 'Start the simulation. Introduce the scenario and begin.'
    }], systemPrompt);

    // Save initial message
    simulation.conversationHistory.push({
      role: 'assistant',
      content: initialMessage,
    });
    await simulation.save();

    res.json({
      success: true,
      simulationId: simulation._id,
      systemPrompt,
      initialMessage,
      message: 'Simulation started'
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start simulation. Please try again later.' 
    });
  }
});

// Continue simulation
router.post('/continue', protect, async (req, res) => {
  try {
    const { simulationId, userMessage } = req.body;

    const simulation = await Simulation.findOne({
      _id: simulationId,
      userId: req.user.id,
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Get system prompt based on type
    const simulationPrompts = {
      'salary-negotiation': `You are simulating a hiring manager in a salary negotiation. 
      The user is negotiating their first job offer. Be realistic but fair. 
      Initial offer was $65,000. You can go up to $75,000 if they negotiate well.`,
      
      'job-interview': `You are conducting a job interview for an entry-level position. 
      Ask relevant questions and provide feedback on responses.`,
      
      'lease-negotiation': `You are a landlord discussing lease terms. 
      The apartment is $1,500/month. Be professional and willing to negotiate within reason.`,

      'budget-crisis': `You are a financial advisor helping with a $2,000 emergency expense.
      They have $500 in savings. Guide them through options.`,

      'career-change': `You are a career counselor helping someone explore career transitions.
      Provide realistic guidance and ask probing questions.`,

      'family-conflict': `You are a family therapist helping navigate difficult conversations.
      Be empathetic and provide communication strategies.`
    };

    const systemPrompt = simulationPrompts[simulation.simulationType];

    // Build message history
    const messages = simulation.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    messages.push({ role: 'user', content: userMessage });

    const assistantMessage = await callNvidiaAPI(messages, systemPrompt);

    // Save messages
    simulation.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    );
    await simulation.save();

    res.json({
      success: true,
      response: assistantMessage,
      simulationId: simulation._id
    });
  } catch (error) {
    console.error('Continue simulation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to continue simulation. Please try again later.' 
    });
  }
});

// Complete simulation
router.post('/complete', protect, async (req, res) => {
  try {
    const { simulationId, score, feedback } = req.body;

    const simulation = await Simulation.findOne({
      _id: simulationId,
      userId: req.user.id,
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Define XP rewards based on simulation type and performance
    const simulationXPRewards = {
      'job-interview': {
        base: 100,
        multiplier: 1.0
      },
      'salary-negotiation': {
        base: 150,
        multiplier: 1.0
      },
      'lease-negotiation': {
        base: 80,
        multiplier: 1.0
      },
      'budget-crisis': {
        base: 90,
        multiplier: 1.0
      },
      'career-change': {
        base: 70,
        multiplier: 1.0
      },
      'family-conflict': {
        base: 60,
        multiplier: 1.0
      }
    };

    const rewardConfig = simulationXPRewards[simulation.simulationType] || { base: 50, multiplier: 1.0 };
    
    // Calculate XP based on score (0-100) and simulation type
    // Score of 70+ gets full XP, lower scores get proportional XP
    const scoreMultiplier = Math.max(0.3, score / 100); // Minimum 30% XP even for poor performance
    const xpEarned = Math.floor(rewardConfig.base * scoreMultiplier * rewardConfig.multiplier);

    simulation.completed = true;
    simulation.completedAt = Date.now();
    simulation.score = score;
    simulation.feedback = feedback;
    simulation.xpEarned = xpEarned;
    await simulation.save();

    // Award XP to user
    const oldLevel = req.user.level;
    req.user.xp += xpEarned;
    req.user.calculateLevel();
    const newLevel = req.user.level;
    await req.user.save();

    // Check for level up
    const levelUp = newLevel > oldLevel;

    res.json({
      success: true,
      simulation,
      xpEarned,
      levelUp,
      oldLevel,
      newLevel: req.user.level,
      newXp: req.user.xp,
      message: `Simulation completed! You earned ${xpEarned} XP.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's simulation history
router.get('/history', protect, async (req, res) => {
  try {
    const simulations = await Simulation.find({
      userId: req.user.id,
      completed: true,
    }).sort({ completedAt: -1 }).limit(20);

    res.json({
      success: true,
      simulations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
