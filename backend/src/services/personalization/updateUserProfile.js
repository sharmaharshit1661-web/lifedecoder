import { localStorage, vectorDB } from '../../config/database.js';

/**
 * User Profile Update Service
 * Manages dynamic user profile updates based on behavior and interactions
 */

export class UserProfileUpdater {
  /**
   * Update user profile based on activity
   * @param {string} userId - User ID
   * @param {Object} activityData - Activity data to process
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromActivity(userId, activityData) {
    try {
      console.log(`📊 Updating profile for user ${userId} based on activity: ${activityData.type}`);

      // Get current profile
      let profile = await this.getUserProfile(userId);
      
      // Process different activity types
      switch (activityData.type) {
        case 'quiz_completed':
          profile = await this.updateFromQuiz(profile, activityData);
          break;
        case 'simulation_completed':
          profile = await this.updateFromSimulation(profile, activityData);
          break;
        case 'course_completed':
          profile = await this.updateFromCourse(profile, activityData);
          break;
        case 'document_analyzed':
          profile = await this.updateFromDocumentAnalysis(profile, activityData);
          break;
        case 'coach_interaction':
          profile = await this.updateFromCoachInteraction(profile, activityData);
          break;
        default:
          console.log(`Unknown activity type: ${activityData.type}`);
      }

      // Save updated profile
      await this.saveUserProfile(userId, profile);

      // Log the activity
      await this.logActivity(userId, activityData);

      console.log(`✅ Profile updated for user ${userId}`);
      return profile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile (create if doesn't exist)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  static async getUserProfile(userId) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        const result = await client.query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [userId]
        );
        client.release();

        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            userId: row.user_id,
            age: row.age,
            income: row.income,
            employmentStatus: row.employment_status,
            livingSituation: row.living_situation,
            financialGoals: row.financial_goals || [],
            knowledgeLevel: row.knowledge_level || 'beginner',
            riskTolerance: row.risk_tolerance || 'moderate',
            lifeDecoderScore: row.life_decoder_score || 0,
            profileData: row.profile_data || {},
            lastUpdated: row.last_updated
          };
        }
      } catch (pgError) {
        // Fallback to local storage
        const profiles = localStorage.find('userProfiles', { userId });
        if (profiles.length > 0) {
          return profiles[0];
        }
      }

      // Create new profile if doesn't exist
      return await this.createDefaultProfile(userId);
    } catch (error) {
      console.error('Error getting user profile:', error);
      return await this.createDefaultProfile(userId);
    }
  }

  /**
   * Create default user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Default profile
   */
  static async createDefaultProfile(userId) {
    const defaultProfile = {
      userId,
      age: null,
      income: null,
      employmentStatus: 'student',
      livingSituation: 'with_parents',
      financialGoals: [],
      knowledgeLevel: 'beginner',
      riskTolerance: 'moderate',
      lifeDecoderScore: 0,
      profileData: {
        activityCount: 0,
        completedModules: [],
        simulationScores: {},
        preferences: {},
        learningStyle: 'visual',
        topicInterests: [],
        skillLevels: {}
      },
      lastUpdated: new Date().toISOString()
    };

    await this.saveUserProfile(userId, defaultProfile);
    return defaultProfile;
  }

  /**
   * Save user profile
   * @param {string} userId - User ID
   * @param {Object} profile - Profile data
   * @returns {Promise<void>}
   */
  static async saveUserProfile(userId, profile) {
    try {
      profile.lastUpdated = new Date().toISOString();

      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        await client.query(`
          INSERT INTO user_profiles (
            user_id, age, income, employment_status, living_situation,
            financial_goals, knowledge_level, risk_tolerance, life_decoder_score,
            profile_data, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (user_id) DO UPDATE SET
            age = EXCLUDED.age,
            income = EXCLUDED.income,
            employment_status = EXCLUDED.employment_status,
            living_situation = EXCLUDED.living_situation,
            financial_goals = EXCLUDED.financial_goals,
            knowledge_level = EXCLUDED.knowledge_level,
            risk_tolerance = EXCLUDED.risk_tolerance,
            life_decoder_score = EXCLUDED.life_decoder_score,
            profile_data = EXCLUDED.profile_data,
            last_updated = EXCLUDED.last_updated
        `, [
          userId, profile.age, profile.income, profile.employmentStatus,
          profile.livingSituation, profile.financialGoals, profile.knowledgeLevel,
          profile.riskTolerance, profile.lifeDecoderScore, JSON.stringify(profile.profileData),
          profile.lastUpdated
        ]);
        client.release();
      } catch (pgError) {
        // Fallback to local storage
        const profiles = localStorage.find('userProfiles');
        const existingIndex = profiles.findIndex(p => p.userId === userId);
        
        if (existingIndex >= 0) {
          profiles[existingIndex] = profile;
        } else {
          profiles.push(profile);
        }
        
        localStorage.write('userProfiles', profiles);
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Update profile from quiz completion
   * @param {Object} profile - Current profile
   * @param {Object} activityData - Quiz activity data
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromQuiz(profile, activityData) {
    const { score, answers, quizType } = activityData.data;

    // Update LifeDecoder score
    if (quizType === 'life_decoder') {
      profile.lifeDecoderScore = score;
    }

    // Analyze answers to infer profile attributes
    if (answers) {
      // Extract age if provided
      if (answers.age && !profile.age) {
        profile.age = parseInt(answers.age);
      }

      // Extract employment status
      if (answers.employment && !profile.employmentStatus) {
        profile.employmentStatus = answers.employment;
      }

      // Extract financial goals
      if (answers.goals && Array.isArray(answers.goals)) {
        profile.financialGoals = [...new Set([...profile.financialGoals, ...answers.goals])];
      }

      // Infer knowledge level from performance
      if (score >= 80) {
        profile.knowledgeLevel = 'advanced';
      } else if (score >= 60) {
        profile.knowledgeLevel = 'intermediate';
      } else {
        profile.knowledgeLevel = 'beginner';
      }

      // Update topic interests based on quiz content
      if (answers.interests) {
        profile.profileData.topicInterests = answers.interests;
      }
    }

    // Update activity count
    profile.profileData.activityCount = (profile.profileData.activityCount || 0) + 1;

    return profile;
  }

  /**
   * Update profile from simulation completion
   * @param {Object} profile - Current profile
   * @param {Object} activityData - Simulation activity data
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromSimulation(profile, activityData) {
    const { simulationType, score, performance } = activityData.data;

    // Track simulation scores
    if (!profile.profileData.simulationScores) {
      profile.profileData.simulationScores = {};
    }
    
    profile.profileData.simulationScores[simulationType] = {
      score,
      attempts: (profile.profileData.simulationScores[simulationType]?.attempts || 0) + 1,
      lastAttempt: new Date().toISOString(),
      bestScore: Math.max(score, profile.profileData.simulationScores[simulationType]?.bestScore || 0)
    };

    // Update skill levels based on simulation performance
    if (!profile.profileData.skillLevels) {
      profile.profileData.skillLevels = {};
    }

    const skillMapping = {
      'salary_negotiation': 'negotiation',
      'job_interview': 'communication',
      'financial_planning': 'financial_literacy',
      'lease_review': 'legal_awareness'
    };

    const skill = skillMapping[simulationType];
    if (skill) {
      const currentLevel = profile.profileData.skillLevels[skill] || 0;
      const improvement = Math.max(0, (score - 50) / 10); // Scale 50-100 to 0-5
      profile.profileData.skillLevels[skill] = Math.min(100, currentLevel + improvement);
    }

    // Adjust knowledge level based on consistent performance
    const avgScore = Object.values(profile.profileData.simulationScores)
      .reduce((sum, sim) => sum + sim.bestScore, 0) / 
      Object.keys(profile.profileData.simulationScores).length;

    if (avgScore >= 85 && profile.knowledgeLevel !== 'advanced') {
      profile.knowledgeLevel = 'advanced';
    } else if (avgScore >= 70 && profile.knowledgeLevel === 'beginner') {
      profile.knowledgeLevel = 'intermediate';
    }

    return profile;
  }

  /**
   * Update profile from course completion
   * @param {Object} profile - Current profile
   * @param {Object} activityData - Course activity data
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromCourse(profile, activityData) {
    const { courseId, courseName, category } = activityData.data;

    // Track completed modules
    if (!profile.profileData.completedModules) {
      profile.profileData.completedModules = [];
    }
    
    if (!profile.profileData.completedModules.includes(courseId)) {
      profile.profileData.completedModules.push(courseId);
    }

    // Update topic interests based on course category
    if (!profile.profileData.topicInterests) {
      profile.profileData.topicInterests = [];
    }
    
    if (category && !profile.profileData.topicInterests.includes(category)) {
      profile.profileData.topicInterests.push(category);
    }

    // Increment knowledge level progression
    const completedCount = profile.profileData.completedModules.length;
    if (completedCount >= 10 && profile.knowledgeLevel === 'beginner') {
      profile.knowledgeLevel = 'intermediate';
    } else if (completedCount >= 20 && profile.knowledgeLevel === 'intermediate') {
      profile.knowledgeLevel = 'advanced';
    }

    return profile;
  }

  /**
   * Update profile from document analysis
   * @param {Object} profile - Current profile
   * @param {Object} activityData - Document analysis activity data
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromDocumentAnalysis(profile, activityData) {
    const { documentType, complexity } = activityData.data;

    // Track document analysis experience
    if (!profile.profileData.documentExperience) {
      profile.profileData.documentExperience = {};
    }
    
    const docExp = profile.profileData.documentExperience[documentType] || 0;
    profile.profileData.documentExperience[documentType] = docExp + 1;

    // Infer life stage from document types
    if (documentType === 'lease' && !profile.livingSituation.includes('own')) {
      profile.livingSituation = 'renting';
    }
    
    if (documentType === 'employment_contract' && profile.employmentStatus === 'student') {
      profile.employmentStatus = 'employed';
    }

    // Update legal awareness skill
    if (!profile.profileData.skillLevels) {
      profile.profileData.skillLevels = {};
    }
    
    const currentLegal = profile.profileData.skillLevels.legal_awareness || 0;
    profile.profileData.skillLevels.legal_awareness = Math.min(100, currentLegal + 5);

    return profile;
  }

  /**
   * Update profile from coach interaction
   * @param {Object} profile - Current profile
   * @param {Object} activityData - Coach interaction data
   * @returns {Promise<Object>} Updated profile
   */
  static async updateFromCoachInteraction(profile, activityData) {
    const { topic, sentiment, complexity } = activityData.data;

    // Track interaction topics
    if (!profile.profileData.interactionTopics) {
      profile.profileData.interactionTopics = {};
    }
    
    const topicCount = profile.profileData.interactionTopics[topic] || 0;
    profile.profileData.interactionTopics[topic] = topicCount + 1;

    // Adjust communication preference based on interaction style
    if (!profile.profileData.preferences) {
      profile.profileData.preferences = {};
    }
    
    if (complexity === 'detailed') {
      profile.profileData.preferences.communicationStyle = 'detailed';
    } else if (complexity === 'simple') {
      profile.profileData.preferences.communicationStyle = 'simple';
    }

    return profile;
  }

  /**
   * Log activity for tracking
   * @param {string} userId - User ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<void>}
   */
  static async logActivity(userId, activityData) {
    try {
      const activity = {
        userId,
        activityType: activityData.type,
        activityData: activityData.data,
        timestamp: new Date().toISOString(),
        score: activityData.data.score || null,
        metadata: activityData.metadata || {}
      };

      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        await client.query(`
          INSERT INTO activities (user_id, activity_type, activity_data, timestamp, score, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          userId, activity.activityType, JSON.stringify(activity.activityData),
          activity.timestamp, activity.score, JSON.stringify(activity.metadata)
        ]);
        client.release();
      } catch (pgError) {
        // Fallback to local storage
        localStorage.create('activities', activity);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get user activity history
   * @param {string} userId - User ID
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Activity history
   */
  static async getActivityHistory(userId, limit = 50) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        const result = await client.query(`
          SELECT * FROM activities 
          WHERE user_id = $1 
          ORDER BY timestamp DESC 
          LIMIT $2
        `, [userId, limit]);
        client.release();

        return result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          activityType: row.activity_type,
          activityData: row.activity_data,
          timestamp: row.timestamp,
          score: row.score,
          metadata: row.metadata
        }));
      } catch (pgError) {
        // Fallback to local storage
        const activities = localStorage.find('activities', { userId });
        return activities
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting activity history:', error);
      return [];
    }
  }
}

export default UserProfileUpdater;