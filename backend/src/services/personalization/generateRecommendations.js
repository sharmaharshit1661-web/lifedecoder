import { localStorage, vectorDB } from '../../config/database.js';
import UserProfileUpdater from './updateUserProfile.js';

/**
 * Recommendation Engine
 * Generates personalized recommendations based on user profile and behavior
 */

export class RecommendationEngine {
  /**
   * Generate personalized recommendations for a user
   * @param {string} userId - User ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of recommendations
   */
  static async generateRecommendations(userId, options = {}) {
    try {
      const {
        maxRecommendations = 5,
        categories = ['courses', 'simulations', 'documents', 'general'],
        refreshCache = false
      } = options;

      console.log(`🎯 Generating recommendations for user ${userId}`);

      // Get user profile and activity history
      const profile = await UserProfileUpdater.getUserProfile(userId);
      const activityHistory = await UserProfileUpdater.getActivityHistory(userId, 20);

      // Check for cached recommendations
      if (!refreshCache) {
        const cachedRecommendations = await this.getCachedRecommendations(userId);
        if (cachedRecommendations.length > 0) {
          console.log(`✅ Using cached recommendations (${cachedRecommendations.length})`);
          return cachedRecommendations.slice(0, maxRecommendations);
        }
      }

      // Generate new recommendations
      const recommendations = [];

      // Course recommendations
      if (categories.includes('courses')) {
        const courseRecs = await this.generateCourseRecommendations(profile, activityHistory);
        recommendations.push(...courseRecs);
      }

      // Simulation recommendations
      if (categories.includes('simulations')) {
        const simRecs = await this.generateSimulationRecommendations(profile, activityHistory);
        recommendations.push(...simRecs);
      }

      // Document analysis recommendations
      if (categories.includes('documents')) {
        const docRecs = await this.generateDocumentRecommendations(profile, activityHistory);
        recommendations.push(...docRecs);
      }

      // General life advice recommendations
      if (categories.includes('general')) {
        const generalRecs = await this.generateGeneralRecommendations(profile, activityHistory);
        recommendations.push(...generalRecs);
      }

      // Rank and filter recommendations
      const rankedRecommendations = this.rankRecommendations(recommendations, profile);
      const finalRecommendations = rankedRecommendations.slice(0, maxRecommendations);

      // Cache recommendations
      await this.cacheRecommendations(userId, finalRecommendations);

      console.log(`✅ Generated ${finalRecommendations.length} personalized recommendations`);
      return finalRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return await this.getFallbackRecommendations(userId);
    }
  }

  /**
   * Generate course recommendations
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Recent activities
   * @returns {Promise<Array>} Course recommendations
   */
  static async generateCourseRecommendations(profile, activityHistory) {
    const recommendations = [];
    const completedCourses = profile.profileData.completedModules || [];

    // Define course progression paths
    const coursePaths = {
      beginner: [
        { id: 'taxes-20-min', priority: 10, reason: 'Essential life skill for tax season' },
        { id: 'emergency-fund', priority: 9, reason: 'Build financial security foundation' },
        { id: 'insurance-basics', priority: 8, reason: 'Understand protection basics' }
      ],
      intermediate: [
        { id: 'negotiate-salary', priority: 10, reason: 'Increase your earning potential' },
        { id: 'medical-bill', priority: 8, reason: 'Navigate healthcare costs' },
        { id: 'lease-agreements', priority: 7, reason: 'Understand rental contracts' }
      ],
      advanced: [
        { id: 'employment-contract', priority: 9, reason: 'Master professional agreements' },
        { id: 'negotiate-salary', priority: 8, reason: 'Advanced negotiation techniques' }
      ]
    };

    // Get appropriate courses for knowledge level
    const levelCourses = coursePaths[profile.knowledgeLevel] || coursePaths.beginner;

    // Filter out completed courses and add recommendations
    levelCourses.forEach(course => {
      if (!completedCourses.includes(course.id)) {
        recommendations.push({
          type: 'course',
          id: course.id,
          title: this.getCourseTitle(course.id),
          description: `Complete the ${this.getCourseTitle(course.id)} course`,
          priority: course.priority,
          reasoning: this.buildReasoning(course.reason, profile),
          category: 'learning',
          estimatedTime: '15-20 minutes',
          xpReward: 50
        });
      }
    });

    // Add personalized course recommendations based on profile
    if (profile.employmentStatus === 'student' && !completedCourses.includes('employment-contract')) {
      recommendations.push({
        type: 'course',
        id: 'employment-contract',
        title: 'Employment Contract Basics',
        description: 'Prepare for your first job with contract knowledge',
        priority: 9,
        reasoning: this.buildReasoning('As a student, understanding employment contracts will help you when you start job hunting', profile),
        category: 'career',
        estimatedTime: '10 minutes',
        xpReward: 30
      });
    }

    if (profile.livingSituation === 'with_parents' && !completedCourses.includes('lease-agreements')) {
      recommendations.push({
        type: 'course',
        id: 'lease-agreements',
        title: 'Understanding Lease Agreements',
        description: 'Get ready for independent living',
        priority: 8,
        reasoning: this.buildReasoning('Living with parents now? This course will prepare you for when you move out', profile),
        category: 'housing',
        estimatedTime: '12 minutes',
        xpReward: 35
      });
    }

    return recommendations;
  }

  /**
   * Generate simulation recommendations
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Recent activities
   * @returns {Promise<Array>} Simulation recommendations
   */
  static async generateSimulationRecommendations(profile, activityHistory) {
    const recommendations = [];
    const simulationScores = profile.profileData.simulationScores || {};

    // Recommend simulations based on knowledge level and experience
    const simulationSuggestions = [
      {
        type: 'job_interview',
        title: 'Job Interview Practice',
        minLevel: 'beginner',
        priority: 9,
        reason: 'Practice makes perfect for job interviews'
      },
      {
        type: 'salary_negotiation',
        title: 'Salary Negotiation Simulation',
        minLevel: 'intermediate',
        priority: 8,
        reason: 'Learn to negotiate your worth confidently'
      },
      {
        type: 'lease_review',
        title: 'Lease Agreement Review',
        minLevel: 'beginner',
        priority: 7,
        reason: 'Practice identifying important lease terms'
      }
    ];

    simulationSuggestions.forEach(sim => {
      const hasAttempted = simulationScores[sim.type];
      const shouldRecommend = !hasAttempted || (hasAttempted.bestScore < 80);

      if (shouldRecommend && this.meetsLevelRequirement(profile.knowledgeLevel, sim.minLevel)) {
        let priority = sim.priority;
        let reasoning = sim.reason;

        // Adjust priority and reasoning based on previous attempts
        if (hasAttempted) {
          priority += 2; // Higher priority for improvement
          reasoning = `Your best score: ${hasAttempted.bestScore}%. ${reasoning} - aim for 80%+!`;
        }

        recommendations.push({
          type: 'simulation',
          id: sim.type,
          title: sim.title,
          description: `Interactive ${sim.title.toLowerCase()} practice`,
          priority,
          reasoning: this.buildReasoning(reasoning, profile),
          category: 'practice',
          estimatedTime: '10-15 minutes',
          difficulty: sim.minLevel
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate document analysis recommendations
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Recent activities
   * @returns {Promise<Array>} Document recommendations
   */
  static async generateDocumentRecommendations(profile, activityHistory) {
    const recommendations = [];
    const documentExperience = profile.profileData.documentExperience || {};

    // Recommend document types based on life stage and experience
    const documentSuggestions = [
      {
        type: 'lease',
        title: 'Analyze a Lease Agreement',
        condition: () => profile.age >= 18 && !documentExperience.lease,
        priority: 8,
        reason: 'Most young adults will need to sign a lease'
      },
      {
        type: 'employment_contract',
        title: 'Review an Employment Contract',
        condition: () => profile.employmentStatus !== 'unemployed' && !documentExperience.employment_contract,
        priority: 9,
        reason: 'Understanding your employment terms is crucial'
      },
      {
        type: 'insurance',
        title: 'Decode an Insurance Policy',
        condition: () => profile.age >= 20 && !documentExperience.insurance,
        priority: 7,
        reason: 'Insurance policies can be confusing but important'
      },
      {
        type: 'medical',
        title: 'Understand a Medical Bill',
        condition: () => !documentExperience.medical,
        priority: 6,
        reason: 'Medical bills are often the first complex documents young adults encounter'
      }
    ];

    documentSuggestions.forEach(doc => {
      if (doc.condition()) {
        recommendations.push({
          type: 'document_analysis',
          id: doc.type,
          title: doc.title,
          description: `Upload and analyze a ${doc.type} document`,
          priority: doc.priority,
          reasoning: this.buildReasoning(doc.reason, profile),
          category: 'documents',
          estimatedTime: '5-10 minutes',
          documentType: doc.type
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate general life recommendations
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Recent activities
   * @returns {Promise<Array>} General recommendations
   */
  static async generateGeneralRecommendations(profile, activityHistory) {
    const recommendations = [];

    // Life stage specific recommendations
    if (profile.age && profile.age < 20) {
      recommendations.push({
        type: 'general',
        id: 'financial_basics',
        title: 'Start Building Financial Literacy',
        description: 'Focus on budgeting and saving fundamentals',
        priority: 8,
        reasoning: this.buildReasoning('At your age, building strong financial habits early will pay off for decades', profile),
        category: 'finance',
        actionItems: ['Open a savings account', 'Track your spending', 'Learn about compound interest']
      });
    }

    if (profile.employmentStatus === 'student') {
      recommendations.push({
        type: 'general',
        id: 'career_prep',
        title: 'Prepare for Your Career',
        description: 'Build skills for job market success',
        priority: 7,
        reasoning: this.buildReasoning('As a student, now is the perfect time to prepare for your future career', profile),
        category: 'career',
        actionItems: ['Update your resume', 'Practice interview skills', 'Build a professional network']
      });
    }

    if (profile.lifeDecoderScore < 50) {
      recommendations.push({
        type: 'general',
        id: 'skill_building',
        title: 'Focus on Core Life Skills',
        description: 'Build fundamental adult life competencies',
        priority: 9,
        reasoning: this.buildReasoning('Your LifeDecoder score suggests focusing on core skills will have the biggest impact', profile),
        category: 'skills',
        actionItems: ['Complete more courses', 'Practice simulations', 'Ask questions in AI Coach']
      });
    }

    // Activity-based recommendations
    const recentActivityTypes = activityHistory.slice(0, 5).map(a => a.activityType);
    
    if (!recentActivityTypes.includes('coach_interaction')) {
      recommendations.push({
        type: 'general',
        id: 'try_coach',
        title: 'Chat with Your AI Life Coach',
        description: 'Get personalized advice for your situation',
        priority: 6,
        reasoning: this.buildReasoning('The AI Coach can provide personalized guidance based on your specific situation', profile),
        category: 'support',
        actionItems: ['Ask about your biggest life challenge', 'Get advice on financial goals', 'Discuss career planning']
      });
    }

    return recommendations;
  }

  /**
   * Rank recommendations by relevance and priority
   * @param {Array} recommendations - All recommendations
   * @param {Object} profile - User profile
   * @returns {Array} Ranked recommendations
   */
  static rankRecommendations(recommendations, profile) {
    return recommendations
      .map(rec => ({
        ...rec,
        finalScore: this.calculateRecommendationScore(rec, profile)
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(rec => {
        const { finalScore, ...recommendation } = rec;
        return recommendation;
      });
  }

  /**
   * Calculate recommendation score for ranking
   * @param {Object} recommendation - Recommendation object
   * @param {Object} profile - User profile
   * @returns {number} Score for ranking
   */
  static calculateRecommendationScore(recommendation, profile) {
    let score = recommendation.priority || 5;

    // Boost based on user's interests
    if (profile.profileData.topicInterests?.includes(recommendation.category)) {
      score += 2;
    }

    // Boost based on knowledge level match
    if (recommendation.difficulty === profile.knowledgeLevel) {
      score += 1;
    }

    // Boost time-sensitive recommendations
    if (recommendation.type === 'course' && recommendation.id === 'taxes-20-min') {
      const now = new Date();
      if (now.getMonth() >= 0 && now.getMonth() <= 3) { // Tax season
        score += 3;
      }
    }

    // Boost based on life stage relevance
    if (profile.age) {
      if (profile.age < 20 && recommendation.category === 'finance') {
        score += 1;
      }
      if (profile.age >= 18 && recommendation.category === 'housing') {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Build personalized reasoning text
   * @param {string} baseReason - Base reasoning text
   * @param {Object} profile - User profile
   * @returns {string} Personalized reasoning
   */
  static buildReasoning(baseReason, profile) {
    const personalizations = [];

    if (profile.age) {
      personalizations.push(`At age ${profile.age}`);
    }

    if (profile.employmentStatus && profile.employmentStatus !== 'unknown') {
      personalizations.push(`as a ${profile.employmentStatus}`);
    }

    if (profile.knowledgeLevel && profile.knowledgeLevel !== 'beginner') {
      personalizations.push(`with ${profile.knowledgeLevel} knowledge`);
    }

    const prefix = personalizations.length > 0 
      ? `${personalizations.join(' ')}, ` 
      : '';

    return `${prefix}${baseReason.toLowerCase()}`;
  }

  /**
   * Check if user meets level requirement
   * @param {string} userLevel - User's knowledge level
   * @param {string} requiredLevel - Required level
   * @returns {boolean} Whether requirement is met
   */
  static meetsLevelRequirement(userLevel, requiredLevel) {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    return levels[userLevel] >= levels[requiredLevel];
  }

  /**
   * Get course title by ID
   * @param {string} courseId - Course ID
   * @returns {string} Course title
   */
  static getCourseTitle(courseId) {
    const titles = {
      'taxes-20-min': 'File Taxes in 20 Minutes',
      'negotiate-salary': 'Negotiate Your Salary',
      'emergency-fund': 'Create an Emergency Fund',
      'medical-bill': 'Read a Medical Bill',
      'lease-agreements': 'Understanding Lease Agreements',
      'employment-contract': 'Employment Contract Basics',
      'insurance-basics': 'What is Insurance'
    };
    return titles[courseId] || 'Unknown Course';
  }

  /**
   * Cache recommendations
   * @param {string} userId - User ID
   * @param {Array} recommendations - Recommendations to cache
   * @returns {Promise<void>}
   */
  static async cacheRecommendations(userId, recommendations) {
    try {
      const cacheData = {
        userId,
        recommendations,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        await client.query(`
          INSERT INTO recommendations (user_id, recommendation_type, title, description, priority, reasoning, created_at, expires_at, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id) DO UPDATE SET
            recommendation_type = EXCLUDED.recommendation_type,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            priority = EXCLUDED.priority,
            reasoning = EXCLUDED.reasoning,
            created_at = EXCLUDED.created_at,
            expires_at = EXCLUDED.expires_at,
            metadata = EXCLUDED.metadata
        `, [
          userId, 'cached_batch', 'Cached Recommendations', 'Batch of cached recommendations',
          1, 'Generated recommendations', cacheData.generatedAt, cacheData.expiresAt,
          JSON.stringify(cacheData)
        ]);
        client.release();
      } catch (pgError) {
        // Fallback to local storage
        localStorage.create('recommendationCache', cacheData);
      }
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }

  /**
   * Get cached recommendations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Cached recommendations
   */
  static async getCachedRecommendations(userId) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        const result = await client.query(`
          SELECT metadata FROM recommendations 
          WHERE user_id = $1 AND recommendation_type = 'cached_batch' 
          AND expires_at > NOW()
        `, [userId]);
        client.release();

        if (result.rows.length > 0) {
          const cacheData = result.rows[0].metadata;
          return cacheData.recommendations || [];
        }
      } catch (pgError) {
        // Fallback to local storage
        const cache = localStorage.find('recommendationCache', { userId });
        const validCache = cache.find(c => new Date(c.expiresAt) > new Date());
        if (validCache) {
          return validCache.recommendations;
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting cached recommendations:', error);
      return [];
    }
  }

  /**
   * Get fallback recommendations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Fallback recommendations
   */
  static async getFallbackRecommendations(userId) {
    return [
      {
        type: 'course',
        id: 'taxes-20-min',
        title: 'File Taxes in 20 Minutes',
        description: 'Learn the basics of tax filing',
        priority: 8,
        reasoning: 'Tax filing is an essential life skill everyone needs',
        category: 'finance',
        estimatedTime: '20 minutes'
      },
      {
        type: 'simulation',
        id: 'job_interview',
        title: 'Job Interview Practice',
        description: 'Practice your interview skills',
        priority: 7,
        reasoning: 'Interview skills are crucial for career success',
        category: 'career',
        estimatedTime: '15 minutes'
      }
    ];
  }
}

export default RecommendationEngine;