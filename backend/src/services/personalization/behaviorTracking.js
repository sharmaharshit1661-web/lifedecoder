import { localStorage, vectorDB } from '../../config/database.js';
import UserProfileUpdater from './updateUserProfile.js';

/**
 * Behavior Tracking Service
 * Tracks and analyzes user behavior patterns for personalization
 */

export class BehaviorTracker {
  /**
   * Track user behavior event
   * @param {string} userId - User ID
   * @param {string} eventType - Type of behavior event
   * @param {Object} eventData - Event data
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  static async trackBehavior(userId, eventType, eventData, context = {}) {
    try {
      console.log(`📊 Tracking behavior: ${eventType} for user ${userId}`);

      const behaviorEvent = {
        userId,
        eventType,
        eventData,
        context: {
          timestamp: new Date().toISOString(),
          userAgent: context.userAgent,
          sessionId: context.sessionId,
          ...context
        },
        patterns: await this.detectPatterns(userId, eventType, eventData)
      };

      // Store the behavior event
      await this.storeBehaviorEvent(behaviorEvent);

      // Update user profile based on behavior
      await this.updateProfileFromBehavior(userId, behaviorEvent);

      // Check for behavior-based triggers
      await this.checkBehaviorTriggers(userId, behaviorEvent);

      console.log(`✅ Behavior tracked: ${eventType}`);
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  }

  /**
   * Store behavior event
   * @param {Object} behaviorEvent - Behavior event data
   * @returns {Promise<void>}
   */
  static async storeBehaviorEvent(behaviorEvent) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        await client.query(`
          INSERT INTO activities (user_id, activity_type, activity_data, timestamp, metadata)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          behaviorEvent.userId,
          `behavior_${behaviorEvent.eventType}`,
          JSON.stringify(behaviorEvent.eventData),
          behaviorEvent.context.timestamp,
          JSON.stringify({
            context: behaviorEvent.context,
            patterns: behaviorEvent.patterns
          })
        ]);
        client.release();
      } catch (pgError) {
        // Fallback to local storage
        localStorage.create('behaviorEvents', behaviorEvent);
      }
    } catch (error) {
      console.error('Error storing behavior event:', error);
    }
  }

  /**
   * Detect behavior patterns
   * @param {string} userId - User ID
   * @param {string} eventType - Current event type
   * @param {Object} eventData - Current event data
   * @returns {Promise<Object>} Detected patterns
   */
  static async detectPatterns(userId, eventType, eventData) {
    try {
      const recentBehaviors = await this.getRecentBehaviors(userId, 50);
      const patterns = {};

      // Detect frequency patterns
      patterns.frequency = this.detectFrequencyPatterns(recentBehaviors, eventType);

      // Detect time-based patterns
      patterns.timing = this.detectTimingPatterns(recentBehaviors, eventType);

      // Detect sequence patterns
      patterns.sequences = this.detectSequencePatterns(recentBehaviors, eventType);

      // Detect engagement patterns
      patterns.engagement = this.detectEngagementPatterns(recentBehaviors, eventData);

      // Detect learning patterns
      patterns.learning = this.detectLearningPatterns(recentBehaviors, eventType, eventData);

      return patterns;
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return {};
    }
  }

  /**
   * Get recent behavior events for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of events to retrieve
   * @returns {Promise<Array>} Recent behavior events
   */
  static async getRecentBehaviors(userId, limit = 50) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        const result = await client.query(`
          SELECT activity_type, activity_data, timestamp, metadata
          FROM activities 
          WHERE user_id = $1 AND activity_type LIKE 'behavior_%'
          ORDER BY timestamp DESC 
          LIMIT $2
        `, [userId, limit]);
        client.release();

        return result.rows.map(row => ({
          eventType: row.activity_type.replace('behavior_', ''),
          eventData: row.activity_data,
          timestamp: row.timestamp,
          context: row.metadata?.context || {},
          patterns: row.metadata?.patterns || {}
        }));
      } catch (pgError) {
        // Fallback to local storage
        const behaviors = localStorage.find('behaviorEvents', { userId });
        return behaviors
          .sort((a, b) => new Date(b.context.timestamp) - new Date(a.context.timestamp))
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting recent behaviors:', error);
      return [];
    }
  }

  /**
   * Detect frequency patterns
   * @param {Array} behaviors - Recent behaviors
   * @param {string} currentEventType - Current event type
   * @returns {Object} Frequency patterns
   */
  static detectFrequencyPatterns(behaviors, currentEventType) {
    const eventCounts = {};
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    behaviors.forEach(behavior => {
      const eventTime = new Date(behavior.timestamp || behavior.context.timestamp);
      const eventType = behavior.eventType;

      if (!eventCounts[eventType]) {
        eventCounts[eventType] = { total: 0, daily: 0, weekly: 0 };
      }

      eventCounts[eventType].total++;

      if (eventTime > oneDayAgo) {
        eventCounts[eventType].daily++;
      }

      if (eventTime > oneWeekAgo) {
        eventCounts[eventType].weekly++;
      }
    });

    return {
      currentEventCount: eventCounts[currentEventType] || { total: 0, daily: 0, weekly: 0 },
      mostFrequent: Object.keys(eventCounts).length > 0 ? Object.keys(eventCounts).reduce((a, b) => 
        (eventCounts[a]?.total || 0) > (eventCounts[b]?.total || 0) ? a : b, Object.keys(eventCounts)[0]
      ) : 'none',
      dailyActivity: Object.values(eventCounts).reduce((sum, count) => sum + count.daily, 0),
      weeklyActivity: Object.values(eventCounts).reduce((sum, count) => sum + count.weekly, 0)
    };
  }

  /**
   * Detect timing patterns
   * @param {Array} behaviors - Recent behaviors
   * @param {string} currentEventType - Current event type
   * @returns {Object} Timing patterns
   */
  static detectTimingPatterns(behaviors, currentEventType) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    const currentHour = new Date().getHours();
    const currentDayOfWeek = new Date().getDay();

    behaviors.forEach(behavior => {
      const eventTime = new Date(behavior.timestamp || behavior.context.timestamp);
      hourCounts[eventTime.getHours()]++;
      dayOfWeekCounts[eventTime.getDay()]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));

    return {
      peakHour,
      peakDay,
      currentHourActivity: hourCounts[currentHour],
      currentDayActivity: dayOfWeekCounts[currentDayOfWeek],
      isTypicalTime: Math.abs(currentHour - peakHour) <= 2,
      timeOfDayPattern: this.categorizeTimeOfDay(peakHour)
    };
  }

  /**
   * Detect sequence patterns
   * @param {Array} behaviors - Recent behaviors
   * @param {string} currentEventType - Current event type
   * @returns {Object} Sequence patterns
   */
  static detectSequencePatterns(behaviors, currentEventType) {
    const sequences = [];
    const sequenceLength = 3;

    // Build sequences of events
    for (let i = 0; i < behaviors.length - sequenceLength + 1; i++) {
      const sequence = behaviors.slice(i, i + sequenceLength).map(b => b.eventType);
      sequences.push(sequence);
    }

    // Find common sequences
    const sequenceCounts = {};
    sequences.forEach(seq => {
      const key = seq.join('->');
      sequenceCounts[key] = (sequenceCounts[key] || 0) + 1;
    });

    const commonSequences = Object.entries(sequenceCounts)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);

    // Check if current event follows a pattern
    const recentEvents = behaviors.slice(0, sequenceLength - 1).map(b => b.eventType);
    const potentialSequence = [...recentEvents, currentEventType].join('->');
    const followsPattern = sequenceCounts[potentialSequence] > 0;

    return {
      commonSequences: commonSequences.map(([seq, count]) => ({ sequence: seq, count })),
      followsPattern,
      potentialSequence,
      sequenceBreaker: !followsPattern && recentEvents.length > 0
    };
  }

  /**
   * Detect engagement patterns
   * @param {Array} behaviors - Recent behaviors
   * @param {Object} currentEventData - Current event data
   * @returns {Object} Engagement patterns
   */
  static detectEngagementPatterns(behaviors, currentEventData) {
    const sessionLengths = [];
    const interactionDepths = [];
    let currentSession = [];
    let lastTimestamp = null;

    behaviors.forEach(behavior => {
      const timestamp = new Date(behavior.timestamp || behavior.context.timestamp);
      
      if (lastTimestamp && timestamp - lastTimestamp > 30 * 60 * 1000) { // 30 min gap = new session
        if (currentSession.length > 0) {
          sessionLengths.push(currentSession.length);
          currentSession = [];
        }
      }
      
      currentSession.push(behavior);
      lastTimestamp = timestamp;

      // Track interaction depth
      if (behavior.eventData?.duration) {
        interactionDepths.push(behavior.eventData.duration);
      }
    });

    if (currentSession.length > 0) {
      sessionLengths.push(currentSession.length);
    }

    const avgSessionLength = sessionLengths.length > 0 
      ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length 
      : 0;

    const avgInteractionDepth = interactionDepths.length > 0
      ? interactionDepths.reduce((a, b) => a + b, 0) / interactionDepths.length
      : 0;

    return {
      avgSessionLength,
      avgInteractionDepth,
      totalSessions: sessionLengths.length,
      currentSessionLength: currentSession.length,
      engagementLevel: this.calculateEngagementLevel(avgSessionLength, avgInteractionDepth),
      isDeepEngagement: (currentEventData.duration || 0) > avgInteractionDepth * 1.5
    };
  }

  /**
   * Detect learning patterns
   * @param {Array} behaviors - Recent behaviors
   * @param {string} currentEventType - Current event type
   * @param {Object} currentEventData - Current event data
   * @returns {Object} Learning patterns
   */
  static detectLearningPatterns(behaviors, currentEventType, currentEventData) {
    const learningEvents = behaviors.filter(b => 
      ['course_completed', 'simulation_completed', 'quiz_completed', 'document_analyzed'].includes(b.eventType)
    );

    const scores = learningEvents
      .map(event => event.eventData?.score)
      .filter(score => score !== undefined);

    const progressionTrend = this.calculateProgressionTrend(scores);
    const learningVelocity = this.calculateLearningVelocity(learningEvents);
    const preferredLearningStyle = this.detectLearningStyle(behaviors);

    return {
      totalLearningEvents: learningEvents.length,
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      progressionTrend, // 'improving', 'stable', 'declining'
      learningVelocity, // events per day
      preferredLearningStyle, // 'visual', 'interactive', 'reading'
      isLearningEvent: ['course_completed', 'simulation_completed', 'quiz_completed'].includes(currentEventType),
      strugglingArea: this.identifyStrugglingArea(learningEvents)
    };
  }

  /**
   * Update user profile based on behavior
   * @param {string} userId - User ID
   * @param {Object} behaviorEvent - Behavior event
   * @returns {Promise<void>}
   */
  static async updateProfileFromBehavior(userId, behaviorEvent) {
    try {
      const profile = await UserProfileUpdater.getUserProfile(userId);
      
      // Update learning style based on behavior patterns
      if (behaviorEvent.patterns.learning?.preferredLearningStyle) {
        profile.profileData.learningStyle = behaviorEvent.patterns.learning.preferredLearningStyle;
      }

      // Update activity patterns
      if (!profile.profileData.behaviorPatterns) {
        profile.profileData.behaviorPatterns = {};
      }

      profile.profileData.behaviorPatterns = {
        ...profile.profileData.behaviorPatterns,
        lastUpdated: new Date().toISOString(),
        engagementLevel: behaviorEvent.patterns.engagement?.engagementLevel,
        peakActivityHour: behaviorEvent.patterns.timing?.peakHour,
        learningVelocity: behaviorEvent.patterns.learning?.learningVelocity
      };

      await UserProfileUpdater.saveUserProfile(userId, profile);
    } catch (error) {
      console.error('Error updating profile from behavior:', error);
    }
  }

  /**
   * Check for behavior-based triggers
   * @param {string} userId - User ID
   * @param {Object} behaviorEvent - Behavior event
   * @returns {Promise<void>}
   */
  static async checkBehaviorTriggers(userId, behaviorEvent) {
    try {
      const triggers = [];

      // Inactivity trigger
      if (behaviorEvent.patterns.frequency?.dailyActivity === 0) {
        triggers.push({
          type: 'inactivity_reminder',
          message: 'We miss you! Come back and continue your learning journey.',
          priority: 'low'
        });
      }

      // Struggling learner trigger
      if (behaviorEvent.patterns.learning?.strugglingArea) {
        triggers.push({
          type: 'learning_support',
          message: `Need help with ${behaviorEvent.patterns.learning.strugglingArea}? Try our AI Coach!`,
          priority: 'medium'
        });
      }

      // High engagement trigger
      if (behaviorEvent.patterns.engagement?.isDeepEngagement) {
        triggers.push({
          type: 'engagement_reward',
          message: 'Great focus! You\'re making excellent progress.',
          priority: 'low'
        });
      }

      // Sequence break trigger (trying something new)
      if (behaviorEvent.patterns.sequences?.sequenceBreaker) {
        triggers.push({
          type: 'exploration_encouragement',
          message: 'Exploring new areas? That\'s great for well-rounded learning!',
          priority: 'low'
        });
      }

      // Process triggers (could send notifications, update recommendations, etc.)
      for (const trigger of triggers) {
        await this.processBehaviorTrigger(userId, trigger, behaviorEvent);
      }
    } catch (error) {
      console.error('Error checking behavior triggers:', error);
    }
  }

  /**
   * Process a behavior trigger
   * @param {string} userId - User ID
   * @param {Object} trigger - Trigger data
   * @param {Object} behaviorEvent - Original behavior event
   * @returns {Promise<void>}
   */
  static async processBehaviorTrigger(userId, trigger, behaviorEvent) {
    try {
      // Log the trigger
      console.log(`🎯 Behavior trigger: ${trigger.type} for user ${userId}`);

      // Store trigger for potential use in recommendations or notifications
      const triggerEvent = {
        userId,
        triggerType: trigger.type,
        message: trigger.message,
        priority: trigger.priority,
        originalEvent: behaviorEvent.eventType,
        timestamp: new Date().toISOString()
      };

      localStorage.create('behaviorTriggers', triggerEvent);

      // Could integrate with notification system, recommendation engine, etc.
    } catch (error) {
      console.error('Error processing behavior trigger:', error);
    }
  }

  // Helper methods

  static categorizeTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  static calculateEngagementLevel(avgSessionLength, avgInteractionDepth) {
    const sessionScore = Math.min(avgSessionLength / 10, 1); // Normalize to 0-1
    const depthScore = Math.min(avgInteractionDepth / 300, 1); // Normalize to 0-1 (5 min max)
    const combined = (sessionScore + depthScore) / 2;

    if (combined >= 0.7) return 'high';
    if (combined >= 0.4) return 'medium';
    return 'low';
  }

  static calculateProgressionTrend(scores) {
    if (scores.length < 3) return 'insufficient_data';

    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  static calculateLearningVelocity(learningEvents) {
    if (learningEvents.length < 2) return 0;

    const timestamps = learningEvents.map(e => new Date(e.timestamp || e.context.timestamp));
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const days = timeSpan / (1000 * 60 * 60 * 24);

    return days > 0 ? learningEvents.length / days : 0;
  }

  static detectLearningStyle(behaviors) {
    const styleCounts = {
      visual: 0,      // Courses, reading
      interactive: 0, // Simulations, quizzes
      practical: 0    // Document analysis, real-world application
    };

    behaviors.forEach(behavior => {
      switch (behavior.eventType) {
        case 'course_completed':
          styleCounts.visual++;
          break;
        case 'simulation_completed':
        case 'quiz_completed':
          styleCounts.interactive++;
          break;
        case 'document_analyzed':
          styleCounts.practical++;
          break;
      }
    });

    const maxStyle = Object.keys(styleCounts).reduce((a, b) => 
      styleCounts[a] > styleCounts[b] ? a : b
    );

    return styleCounts[maxStyle] > 0 ? maxStyle : 'visual'; // Default to visual
  }

  static identifyStrugglingArea(learningEvents) {
    const areaScores = {};

    learningEvents.forEach(event => {
      const area = event.eventData?.category || event.eventData?.simulationType || 'general';
      const score = event.eventData?.score || 0;

      if (!areaScores[area]) {
        areaScores[area] = { total: 0, count: 0 };
      }

      areaScores[area].total += score;
      areaScores[area].count++;
    });

    // Find area with lowest average score
    let lowestArea = null;
    let lowestAvg = 100;

    Object.keys(areaScores).forEach(area => {
      const avg = areaScores[area].total / areaScores[area].count;
      if (avg < lowestAvg && avg < 60) { // Only consider if below 60%
        lowestAvg = avg;
        lowestArea = area;
      }
    });

    return lowestArea;
  }

  /**
   * Get behavior analytics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Behavior analytics
   */
  static async getBehaviorAnalytics(userId, days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const behaviors = await this.getRecentBehaviors(userId, 1000);
      
      const recentBehaviors = behaviors.filter(b => 
        new Date(b.timestamp || b.context.timestamp) > cutoffDate
      );

      return {
        totalEvents: recentBehaviors.length,
        uniqueDays: [...new Set(recentBehaviors.map(b => 
          new Date(b.timestamp || b.context.timestamp).toDateString()
        ))].length,
        eventTypes: this.summarizeEventTypes(recentBehaviors),
        engagementTrends: this.analyzeEngagementTrends(recentBehaviors),
        learningProgress: this.analyzeLearningProgress(recentBehaviors),
        timePatterns: this.analyzeTimePatterns(recentBehaviors)
      };
    } catch (error) {
      console.error('Error getting behavior analytics:', error);
      return null;
    }
  }

  static summarizeEventTypes(behaviors) {
    const counts = {};
    behaviors.forEach(b => {
      counts[b.eventType] = (counts[b.eventType] || 0) + 1;
    });
    return counts;
  }

  static analyzeEngagementTrends(behaviors) {
    // Group by day and calculate daily engagement
    const dailyEngagement = {};
    
    behaviors.forEach(b => {
      const day = new Date(b.timestamp || b.context.timestamp).toDateString();
      if (!dailyEngagement[day]) {
        dailyEngagement[day] = 0;
      }
      dailyEngagement[day]++;
    });

    const days = Object.keys(dailyEngagement).sort();
    const values = days.map(day => dailyEngagement[day]);

    return {
      dailyAverage: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      trend: this.calculateTrend(values),
      peakDay: days[values.indexOf(Math.max(...values))],
      consistencyScore: this.calculateConsistency(values)
    };
  }

  static analyzeLearningProgress(behaviors) {
    const learningEvents = behaviors.filter(b => 
      ['course_completed', 'simulation_completed', 'quiz_completed'].includes(b.eventType)
    );

    const scores = learningEvents
      .map(e => e.eventData?.score)
      .filter(s => s !== undefined);

    return {
      totalLearningEvents: learningEvents.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      progressTrend: this.calculateProgressionTrend(scores),
      learningVelocity: this.calculateLearningVelocity(learningEvents)
    };
  }

  static analyzeTimePatterns(behaviors) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    behaviors.forEach(b => {
      const date = new Date(b.timestamp || b.context.timestamp);
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    return {
      peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
      peakDayOfWeek: dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts)),
      hourDistribution: hourCounts,
      dayOfWeekDistribution: dayOfWeekCounts
    };
  }

  static calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  static calculateConsistency(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Consistency score: lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  }
}

export default BehaviorTracker;