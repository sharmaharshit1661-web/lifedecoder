import UserProfileUpdater from './updateUserProfile.js';

/**
 * LifeDecoder Score Calculator
 * Calculates comprehensive life skills score based on multiple factors
 */

export class LifeDecoderCalculator {
  /**
   * Calculate comprehensive LifeDecoder score for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Score breakdown and total
   */
  static async calculateScore(userId) {
    try {
      console.log(`🧮 Calculating LifeDecoder score for user ${userId}`);

      const profile = await UserProfileUpdater.getUserProfile(userId);
      const activityHistory = await UserProfileUpdater.getActivityHistory(userId, 100);

      // Calculate component scores
      const components = {
        financialLiteracy: this.calculateFinancialLiteracy(profile, activityHistory),
        careerReadiness: this.calculateCareerReadiness(profile, activityHistory),
        legalAwareness: this.calculateLegalAwareness(profile, activityHistory),
        healthManagement: this.calculateHealthManagement(profile, activityHistory),
        practicalSkills: this.calculatePracticalSkills(profile, activityHistory),
        digitalLiteracy: this.calculateDigitalLiteracy(profile, activityHistory)
      };

      // Calculate weighted total score
      const weights = {
        financialLiteracy: 0.25,    // 25% - Most important for young adults
        careerReadiness: 0.20,      // 20% - Critical for independence
        legalAwareness: 0.15,       // 15% - Important for protection
        healthManagement: 0.15,     // 15% - Essential for wellbeing
        practicalSkills: 0.15,      // 15% - Daily life competency
        digitalLiteracy: 0.10       // 10% - Modern necessity
      };

      let totalScore = 0;
      const breakdown = {};

      Object.keys(components).forEach(component => {
        const componentScore = Math.min(100, Math.max(0, components[component]));
        breakdown[component] = {
          score: Math.round(componentScore),
          weight: weights[component],
          contribution: Math.round(componentScore * weights[component])
        };
        totalScore += componentScore * weights[component];
      });

      const finalScore = Math.round(Math.min(100, Math.max(0, totalScore)));

      // Update user profile with new score
      profile.lifeDecoderScore = finalScore;
      await UserProfileUpdater.saveUserProfile(userId, profile);

      // Generate insights
      const insights = this.generateScoreInsights(breakdown, finalScore);

      console.log(`✅ LifeDecoder Score calculated: ${finalScore}/100`);

      return {
        totalScore: finalScore,
        breakdown,
        insights,
        level: this.getScoreLevel(finalScore),
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating LifeDecoder score:', error);
      throw error;
    }
  }

  /**
   * Calculate Financial Literacy score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Financial literacy score
   */
  static calculateFinancialLiteracy(profile, activityHistory) {
    let score = 0;

    // Base knowledge assessment
    if (profile.profileData.completedModules) {
      const financialCourses = ['taxes-20-min', 'emergency-fund', 'insurance-basics'];
      const completedFinancial = financialCourses.filter(course => 
        profile.profileData.completedModules.includes(course)
      ).length;
      score += (completedFinancial / financialCourses.length) * 30; // Up to 30 points
    }

    // Simulation performance
    if (profile.profileData.simulationScores?.financial_planning) {
      score += (profile.profileData.simulationScores.financial_planning.bestScore / 100) * 25; // Up to 25 points
    }

    // Document analysis experience
    if (profile.profileData.documentExperience) {
      const financialDocs = ['tax', 'financial', 'insurance'].filter(type => 
        profile.profileData.documentExperience[type] > 0
      ).length;
      score += (financialDocs / 3) * 20; // Up to 20 points
    }

    // Profile completeness and sophistication
    if (profile.financialGoals && profile.financialGoals.length > 0) {
      score += 10; // 10 points for having financial goals
    }

    if (profile.riskTolerance && profile.riskTolerance !== 'unknown') {
      score += 5; // 5 points for understanding risk tolerance
    }

    // Activity engagement
    const financialActivities = activityHistory.filter(activity => 
      activity.activityType.includes('financial') || 
      activity.activityType === 'course_completed' && 
      ['taxes-20-min', 'emergency-fund', 'insurance-basics'].includes(activity.activityData.courseId)
    ).length;
    
    score += Math.min(10, financialActivities * 2); // Up to 10 points for engagement

    return score;
  }

  /**
   * Calculate Career Readiness score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Career readiness score
   */
  static calculateCareerReadiness(profile, activityHistory) {
    let score = 0;

    // Employment status
    const employmentScores = {
      'employed': 30,
      'part_time': 20,
      'internship': 25,
      'freelance': 20,
      'student': 10,
      'unemployed': 0
    };
    score += employmentScores[profile.employmentStatus] || 0;

    // Career-related courses
    if (profile.profileData.completedModules) {
      const careerCourses = ['negotiate-salary', 'employment-contract'];
      const completedCareer = careerCourses.filter(course => 
        profile.profileData.completedModules.includes(course)
      ).length;
      score += (completedCareer / careerCourses.length) * 25; // Up to 25 points
    }

    // Interview and negotiation simulations
    const careerSims = ['job_interview', 'salary_negotiation'];
    let simScore = 0;
    careerSims.forEach(sim => {
      if (profile.profileData.simulationScores?.[sim]) {
        simScore += profile.profileData.simulationScores[sim].bestScore;
      }
    });
    score += (simScore / (careerSims.length * 100)) * 30; // Up to 30 points

    // Document experience with employment contracts
    if (profile.profileData.documentExperience?.employment_contract) {
      score += 10; // 10 points for contract analysis experience
    }

    // Age-based career development expectations
    if (profile.age) {
      if (profile.age >= 22 && profile.employmentStatus === 'student') {
        score -= 5; // Slight penalty for extended student status
      }
      if (profile.age >= 18 && profile.age <= 25 && profile.employmentStatus === 'employed') {
        score += 5; // Bonus for early career engagement
      }
    }

    return score;
  }

  /**
   * Calculate Legal Awareness score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Legal awareness score
   */
  static calculateLegalAwareness(profile, activityHistory) {
    let score = 0;

    // Legal document analysis experience
    if (profile.profileData.documentExperience) {
      const legalDocs = ['lease', 'contract', 'employment_contract'];
      let docScore = 0;
      legalDocs.forEach(docType => {
        if (profile.profileData.documentExperience[docType]) {
          docScore += Math.min(20, profile.profileData.documentExperience[docType] * 10);
        }
      });
      score += Math.min(40, docScore); // Up to 40 points
    }

    // Legal-related courses
    if (profile.profileData.completedModules) {
      const legalCourses = ['lease-agreements', 'employment-contract'];
      const completedLegal = legalCourses.filter(course => 
        profile.profileData.completedModules.includes(course)
      ).length;
      score += (completedLegal / legalCourses.length) * 30; // Up to 30 points
    }

    // Lease review simulation
    if (profile.profileData.simulationScores?.lease_review) {
      score += (profile.profileData.simulationScores.lease_review.bestScore / 100) * 20; // Up to 20 points
    }

    // Living situation awareness
    if (profile.livingSituation === 'renting' || profile.livingSituation === 'own_home') {
      score += 10; // 10 points for independent living experience
    }

    return score;
  }

  /**
   * Calculate Health Management score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Health management score
   */
  static calculateHealthManagement(profile, activityHistory) {
    let score = 0;

    // Health-related courses
    if (profile.profileData.completedModules) {
      const healthCourses = ['medical-bill', 'insurance-basics'];
      const completedHealth = healthCourses.filter(course => 
        profile.profileData.completedModules.includes(course)
      ).length;
      score += (completedHealth / healthCourses.length) * 40; // Up to 40 points
    }

    // Medical document analysis
    if (profile.profileData.documentExperience?.medical) {
      score += Math.min(25, profile.profileData.documentExperience.medical * 12); // Up to 25 points
    }

    // Insurance document analysis
    if (profile.profileData.documentExperience?.insurance) {
      score += Math.min(25, profile.profileData.documentExperience.insurance * 12); // Up to 25 points
    }

    // Age-based health awareness expectations
    if (profile.age && profile.age >= 18) {
      score += 10; // Base points for adult health responsibility
    }

    return score;
  }

  /**
   * Calculate Practical Skills score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Practical skills score
   */
  static calculatePracticalSkills(profile, activityHistory) {
    let score = 0;

    // Overall course completion rate
    const totalCourses = 7; // Total available courses
    const completedCount = profile.profileData.completedModules?.length || 0;
    score += (completedCount / totalCourses) * 30; // Up to 30 points

    // Simulation diversity and performance
    const simTypes = Object.keys(profile.profileData.simulationScores || {});
    score += Math.min(20, simTypes.length * 5); // Up to 20 points for variety

    // Average simulation performance
    if (simTypes.length > 0) {
      const avgSimScore = simTypes.reduce((sum, type) => 
        sum + profile.profileData.simulationScores[type].bestScore, 0
      ) / simTypes.length;
      score += (avgSimScore / 100) * 25; // Up to 25 points
    }

    // Document analysis diversity
    const docTypes = Object.keys(profile.profileData.documentExperience || {});
    score += Math.min(15, docTypes.length * 3); // Up to 15 points

    // Activity engagement level
    const recentActivities = activityHistory.filter(activity => 
      new Date(activity.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    ).length;
    score += Math.min(10, recentActivities); // Up to 10 points for recent engagement

    return score;
  }

  /**
   * Calculate Digital Literacy score (0-100)
   * @param {Object} profile - User profile
   * @param {Array} activityHistory - Activity history
   * @returns {number} Digital literacy score
   */
  static calculateDigitalLiteracy(profile, activityHistory) {
    let score = 40; // Base score for using the platform

    // Platform feature usage
    const featureUsage = {
      coach_interaction: 15,
      document_analysis: 15,
      simulation_completed: 15,
      course_completed: 10,
      quiz_completed: 5
    };

    const usedFeatures = [...new Set(activityHistory.map(a => a.activityType))];
    usedFeatures.forEach(feature => {
      if (featureUsage[feature]) {
        score += featureUsage[feature];
      }
    });

    // Consistent platform usage
    const activityDays = [...new Set(activityHistory.map(a => 
      new Date(a.timestamp).toDateString()
    ))].length;
    
    if (activityDays >= 7) score += 10; // Bonus for multi-day usage
    if (activityDays >= 14) score += 5;  // Additional bonus for extended usage

    return Math.min(100, score);
  }

  /**
   * Generate insights based on score breakdown
   * @param {Object} breakdown - Score breakdown by component
   * @param {number} totalScore - Total LifeDecoder score
   * @returns {Object} Insights and recommendations
   */
  static generateScoreInsights(breakdown, totalScore) {
    const insights = {
      strengths: [],
      improvements: [],
      nextSteps: [],
      level: this.getScoreLevel(totalScore)
    };

    // Identify strengths (scores >= 70)
    Object.keys(breakdown).forEach(component => {
      if (breakdown[component].score >= 70) {
        insights.strengths.push({
          area: this.getComponentDisplayName(component),
          score: breakdown[component].score,
          message: this.getStrengthMessage(component, breakdown[component].score)
        });
      }
    });

    // Identify improvement areas (scores < 50)
    Object.keys(breakdown).forEach(component => {
      if (breakdown[component].score < 50) {
        insights.improvements.push({
          area: this.getComponentDisplayName(component),
          score: breakdown[component].score,
          message: this.getImprovementMessage(component, breakdown[component].score),
          priority: breakdown[component].weight > 0.15 ? 'high' : 'medium'
        });
      }
    });

    // Generate next steps
    insights.nextSteps = this.generateNextSteps(breakdown, totalScore);

    return insights;
  }

  /**
   * Get score level description
   * @param {number} score - LifeDecoder score
   * @returns {Object} Level information
   */
  static getScoreLevel(score) {
    if (score >= 85) {
      return {
        name: 'Expert',
        description: 'You have excellent adult life skills and are well-prepared for independence',
        color: '#10B981' // Green
      };
    } else if (score >= 70) {
      return {
        name: 'Proficient',
        description: 'You have solid adult life skills with room for some improvement',
        color: '#3B82F6' // Blue
      };
    } else if (score >= 50) {
      return {
        name: 'Developing',
        description: 'You have basic adult life skills but should focus on key areas',
        color: '#F59E0B' // Yellow
      };
    } else {
      return {
        name: 'Beginner',
        description: 'You are just starting your adult life skills journey - great time to learn!',
        color: '#EF4444' // Red
      };
    }
  }

  /**
   * Get display name for component
   * @param {string} component - Component key
   * @returns {string} Display name
   */
  static getComponentDisplayName(component) {
    const names = {
      financialLiteracy: 'Financial Literacy',
      careerReadiness: 'Career Readiness',
      legalAwareness: 'Legal Awareness',
      healthManagement: 'Health Management',
      practicalSkills: 'Practical Skills',
      digitalLiteracy: 'Digital Literacy'
    };
    return names[component] || component;
  }

  /**
   * Get strength message for component
   * @param {string} component - Component key
   * @param {number} score - Component score
   * @returns {string} Strength message
   */
  static getStrengthMessage(component, score) {
    const messages = {
      financialLiteracy: 'You have strong financial knowledge and money management skills',
      careerReadiness: 'You are well-prepared for professional success and career growth',
      legalAwareness: 'You understand legal documents and your rights well',
      healthManagement: 'You have good knowledge of healthcare and insurance systems',
      practicalSkills: 'You have developed excellent practical life skills',
      digitalLiteracy: 'You are comfortable with digital tools and online platforms'
    };
    return messages[component] || `Strong performance in ${this.getComponentDisplayName(component)}`;
  }

  /**
   * Get improvement message for component
   * @param {string} component - Component key
   * @param {number} score - Component score
   * @returns {string} Improvement message
   */
  static getImprovementMessage(component, score) {
    const messages = {
      financialLiteracy: 'Focus on budgeting, taxes, and financial planning basics',
      careerReadiness: 'Work on interview skills, resume building, and professional networking',
      legalAwareness: 'Learn about contracts, leases, and your legal rights',
      healthManagement: 'Understand insurance, medical bills, and healthcare navigation',
      practicalSkills: 'Complete more courses and practice real-world scenarios',
      digitalLiteracy: 'Explore more platform features and digital tools'
    };
    return messages[component] || `Room for improvement in ${this.getComponentDisplayName(component)}`;
  }

  /**
   * Generate next steps based on score breakdown
   * @param {Object} breakdown - Score breakdown
   * @param {number} totalScore - Total score
   * @returns {Array} Next steps
   */
  static generateNextSteps(breakdown, totalScore) {
    const steps = [];

    // Find lowest scoring high-weight component
    const priorityComponents = Object.keys(breakdown)
      .filter(comp => breakdown[comp].weight >= 0.15)
      .sort((a, b) => breakdown[a].score - breakdown[b].score);

    if (priorityComponents.length > 0) {
      const lowestComponent = priorityComponents[0];
      steps.push({
        action: `Improve ${this.getComponentDisplayName(lowestComponent)}`,
        description: this.getImprovementMessage(lowestComponent, breakdown[lowestComponent].score),
        priority: 'high'
      });
    }

    // General recommendations based on total score
    if (totalScore < 30) {
      steps.push({
        action: 'Start with Financial Basics',
        description: 'Complete the emergency fund and tax filing courses',
        priority: 'high'
      });
    } else if (totalScore < 60) {
      steps.push({
        action: 'Practice Real Scenarios',
        description: 'Try job interview and salary negotiation simulations',
        priority: 'medium'
      });
    } else {
      steps.push({
        action: 'Master Advanced Skills',
        description: 'Focus on document analysis and specialized knowledge',
        priority: 'low'
      });
    }

    return steps.slice(0, 3); // Return top 3 steps
  }
}

export default LifeDecoderCalculator;