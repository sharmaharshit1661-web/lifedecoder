import express from 'express';
import { protect } from '../middleware/auth.js';
import ResponseGenerator from '../services/rag/generateResponse.js';
import ContextRetriever from '../services/rag/retrieveContext.js';
import UserProfileUpdater from '../services/personalization/updateUserProfile.js';
import BehaviorTracker from '../services/personalization/behaviorTracking.js';
import { localStorage } from '../config/database.js';

const router = express.Router();

// Enhanced AI Coach Chat with RAG and Personalization
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`💬 AI Coach chat from user ${userId}: "${message.substring(0, 50)}..."`);

    // Get user profile for personalization
    const userProfile = await UserProfileUpdater.getUserProfile(userId);

    // Get conversation history for context
    const conversationHistory = conversationId 
      ? await getConversationHistory(conversationId, userId)
      : [];

    // Retrieve relevant context from user's documents (if any)
    let documentContext = '';
    try {
      const contextResult = await ContextRetriever.retrieveContext(
        message,
        userId,
        { maxChunks: 3, threshold: 0.2 }
      );
      
      if (contextResult.context) {
        documentContext = `\n\nRelevant information from your documents:\n${contextResult.context}`;
      }
    } catch (contextError) {
      console.log('⚠️  Document context not available');
    }

    // Determine if this is a simple query that can use quick response
    const isSimpleQuery = message.length < 50 && !message.includes('?') && !documentContext;

    let response;
    try {
      if (isSimpleQuery) {
        // Use quick response for simple queries
        response = await ResponseGenerator.generateQuickResponse(message, userProfile);
      } else {
        // Use full context-aware response
        const fullResponse = await ResponseGenerator.generateCoachResponse(
          message,
          documentContext,
          userProfile,
          {
            conversationHistory: conversationHistory.slice(-3), // Last 3 messages for context
            model: 'nvidia', // Use NVIDIA as primary
            temperature: 0.3
          }
        );
        response = fullResponse.response || fullResponse;
      }
    } catch (aiError) {
      console.log('⚠️  AI response generation failed, using fallback');
      response = await getFallbackNvidiaResponse(message, userProfile, conversationHistory);
    }

    // Store conversation
    const conversation = await storeConversationMessage(
      conversationId || generateConversationId(),
      userId,
      message,
      response,
      {
        hasDocumentContext: !!documentContext,
        personalizedFor: userProfile.knowledgeLevel,
        responseType: isSimpleQuery ? 'quick' : 'contextual'
      }
    );

    // Track behavior
    await BehaviorTracker.trackBehavior(userId, 'coach_interaction', {
      messageLength: message.length,
      hasContext: !!documentContext,
      topic: extractTopic(message),
      sentiment: 'neutral', // Could be enhanced with sentiment analysis
      complexity: isSimpleQuery ? 'simple' : 'complex'
    });

    // Update user profile
    await UserProfileUpdater.updateFromActivity(userId, {
      type: 'coach_interaction',
      data: {
        topic: extractTopic(message),
        sentiment: 'neutral',
        complexity: isSimpleQuery ? 'simple' : 'complex'
      }
    });

    // Award XP for meaningful conversations
    const xpReward = message.length > 20 ? 5 : 2;
    req.user.xp += xpReward;
    req.user.calculateLevel();
    await req.user.save();

    res.json({
      success: true,
      response: response,
      conversationId: conversation.conversationId,
      personalization: {
        adaptedFor: userProfile.knowledgeLevel,
        tone: determineTone(userProfile)
      },
      context: {
        hasDocumentContext: !!documentContext,
        basedOnProfile: true,
        conversationLength: conversationHistory.length + 1
      },
      xpEarned: xpReward
    });

  } catch (error) {
    console.error('Coach chat error:', error);
    
    // Fallback response
    const fallbackResponse = getFallbackResponse(req.body.message, req.user);
    
    res.json({
      success: true,
      response: fallbackResponse,
      conversationId: req.body.conversationId || generateConversationId(),
      context: {
        hasDocumentContext: false,
        basedOnProfile: false,
        fallback: true
      },
      xpEarned: 2
    });
  }
});

// Get conversation history
router.get('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await getConversationHistory(conversationId, userId);

    if (!conversation || conversation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation: conversation.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      }))
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Get all user conversations
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await getUserConversations(userId);

    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        conversationId: conv.conversationId,
        title: conv.title,
        lastMessage: conv.lastMessage,
        messageCount: conv.messageCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Delete a conversation
router.delete('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const success = await deleteConversation(conversationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

// Get personalized coaching suggestions
router.get('/suggestions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await UserProfileUpdater.getUserProfile(userId);
    const activityHistory = await UserProfileUpdater.getActivityHistory(userId, 10);

    const suggestions = generateCoachingSuggestions(userProfile, activityHistory);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// Helper functions

async function getConversationHistory(conversationId, userId) {
  try {
    const conversations = localStorage.find('conversations', { conversationId, userId });
    return conversations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

async function storeConversationMessage(conversationId, userId, userMessage, aiResponse, metadata = {}) {
  try {
    const timestamp = new Date().toISOString();

    // Store user message
    const userMsg = localStorage.create('conversations', {
      conversationId,
      userId,
      role: 'user',
      content: userMessage,
      timestamp,
      metadata
    });

    // Store AI response
    const aiMsg = localStorage.create('conversations', {
      conversationId,
      userId,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(Date.now() + 1000).toISOString(), // Slight delay for ordering
      metadata
    });

    return {
      conversationId,
      userMessage: userMsg,
      aiResponse: aiMsg
    };
  } catch (error) {
    console.error('Error storing conversation:', error);
    return { conversationId };
  }
}

async function getUserConversations(userId) {
  try {
    const allMessages = localStorage.find('conversations', { userId });
    
    // Group by conversation ID
    const conversationGroups = {};
    allMessages.forEach(msg => {
      if (!conversationGroups[msg.conversationId]) {
        conversationGroups[msg.conversationId] = [];
      }
      conversationGroups[msg.conversationId].push(msg);
    });

    // Create conversation summaries
    const conversations = Object.keys(conversationGroups).map(conversationId => {
      const messages = conversationGroups[conversationId].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      const firstUserMessage = messages.find(m => m.role === 'user');
      const lastMessage = messages[messages.length - 1];

      return {
        conversationId,
        title: firstUserMessage ? 
          firstUserMessage.content.substring(0, 50) + '...' : 
          'Conversation',
        lastMessage: lastMessage.content.substring(0, 100) + '...',
        messageCount: messages.length,
        createdAt: messages[0].timestamp,
        updatedAt: lastMessage.timestamp
      };
    });

    return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}

async function deleteConversation(conversationId, userId) {
  try {
    const messages = localStorage.find('conversations', { conversationId, userId });
    
    if (messages.length === 0) {
      return false;
    }

    // Delete all messages in the conversation
    messages.forEach(msg => {
      localStorage.delete('conversations', { id: msg.id });
    });

    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}

// Fallback NVIDIA response (original implementation)
async function getFallbackNvidiaResponse(message, userProfile, conversationHistory) {
  try {
    // Check if NVIDIA API key is configured
    if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
      return getFallbackResponse(message, { profile: userProfile });
    }

    const systemPrompt = `You are an AI Life Coach for LifeDecoder, a platform helping young adults navigate real-world challenges. 
    
Your role is to provide practical, empathetic advice on:
- Career decisions and job searching
- Financial literacy and budgeting
- Relationships and communication
- Mental health and personal growth
- Renting, healthcare, and legal rights

User Context:
- Knowledge Level: ${userProfile.knowledgeLevel}
- Age: ${userProfile.age || 'young adult'}
- Employment: ${userProfile.employmentStatus || 'unknown'}

Guidelines:
- Be supportive and non-judgmental
- Provide actionable advice
- Use simple, clear language
- Ask clarifying questions when needed
- Encourage users to seek professional help for serious issues
- Keep responses concise but helpful`;

    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    conversationHistory.slice(-4).forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: message });

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
        messages: messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getFallbackResponse(message, { profile: userProfile });

  } catch (error) {
    console.error('NVIDIA fallback error:', error);
    return getFallbackResponse(message, { profile: userProfile });
  }
}

function generateConversationId() {
  return 'conv_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
}

function extractTopic(message) {
  const topicKeywords = {
    'finance': ['money', 'budget', 'save', 'spend', 'bank', 'credit', 'debt', 'loan', 'invest'],
    'career': ['job', 'work', 'career', 'interview', 'resume', 'salary', 'boss', 'promotion'],
    'housing': ['rent', 'lease', 'apartment', 'house', 'move', 'landlord', 'deposit'],
    'health': ['health', 'doctor', 'insurance', 'medical', 'hospital', 'sick', 'medicine'],
    'education': ['school', 'college', 'study', 'learn', 'course', 'degree', 'student'],
    'legal': ['legal', 'law', 'contract', 'rights', 'lawyer', 'court', 'sue'],
    'relationships': ['friend', 'family', 'relationship', 'dating', 'marriage', 'social']
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return topic;
    }
  }
  
  return 'general';
}

function determineTone(userProfile) {
  if (userProfile.knowledgeLevel === 'beginner') {
    return 'encouraging and simple';
  } else if (userProfile.knowledgeLevel === 'advanced') {
    return 'detailed and comprehensive';
  } else {
    return 'balanced and informative';
  }
}

function getFallbackResponse(message, user) {
  const fallbackResponses = [
    "I'd be happy to help! Could you tell me a bit more about your specific situation?",
    "That's a great question! Let me think about the best way to help you with that.",
    "I understand you're looking for guidance. What's the most important thing you'd like to know?",
    "Thanks for reaching out! I'm here to help you navigate adult life. What's on your mind?",
    "I'm here to support you! Could you provide a few more details so I can give you the best advice?"
  ];
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function generateCoachingSuggestions(userProfile, activityHistory) {
  const suggestions = [];

  // Based on knowledge level
  if (userProfile.knowledgeLevel === 'beginner') {
    suggestions.push({
      type: 'learning',
      title: 'Start with Financial Basics',
      description: 'Learn about budgeting and saving - the foundation of financial wellness',
      action: 'Take the Emergency Fund course'
    });
  }

  // Based on age
  if (userProfile.age && userProfile.age < 20) {
    suggestions.push({
      type: 'preparation',
      title: 'Prepare for Independence',
      description: 'Build skills you\'ll need when you move out on your own',
      action: 'Learn about lease agreements and renting'
    });
  }

  // Based on employment status
  if (userProfile.employmentStatus === 'student') {
    suggestions.push({
      type: 'career',
      title: 'Get Career Ready',
      description: 'Practice interview skills and learn about employment contracts',
      action: 'Try the job interview simulation'
    });
  }

  // Based on recent activity
  const recentActivityTypes = activityHistory.slice(0, 5).map(a => a.activityType);
  
  if (!recentActivityTypes.includes('simulation_completed')) {
    suggestions.push({
      type: 'practice',
      title: 'Practice Real Scenarios',
      description: 'Simulations help you practice important life skills in a safe environment',
      action: 'Try a simulation that matches your interests'
    });
  }

  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'general',
      title: 'Continue Learning',
      description: 'Keep building your adult life skills with courses and practice',
      action: 'Explore available courses and simulations'
    });
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

export default router;
