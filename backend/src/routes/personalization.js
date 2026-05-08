import express from 'express';
import { protect } from '../middleware/auth.js';
import UserProfileUpdater from '../services/personalization/updateUserProfile.js';
import RecommendationEngine from '../services/personalization/generateRecommendations.js';
import LifeDecoderCalculator from '../services/personalization/calculateAdultIQScore.js';
import BehaviorTracker from '../services/personalization/behaviorTracking.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfileUpdater.getUserProfile(userId);

    res.json({
      success: true,
      profile: {
        userId: profile.userId,
        age: profile.age,
        income: profile.income,
        employmentStatus: profile.employmentStatus,
        livingSituation: profile.livingSituation,
        financialGoals: profile.financialGoals,
        knowledgeLevel: profile.knowledgeLevel,
        riskTolerance: profile.riskTolerance,
        lifeDecoderScore: profile.lifeDecoderScore,
        lastUpdated: profile.lastUpdated,
        profileData: {
          activityCount: profile.profileData.activityCount,
          completedModules: profile.profileData.completedModules,
          topicInterests: profile.profileData.topicInterests,
          learningStyle: profile.profileData.learningStyle,
          behaviorPatterns: profile.profileData.behaviorPatterns
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Get current profile
    const profile = await UserProfileUpdater.getUserProfile(userId);

    // Update allowed fields
    const allowedFields = [
      'age', 'income', 'employmentStatus', 'livingSituation', 
      'financialGoals', 'riskTolerance'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    // Save updated profile
    await UserProfileUpdater.saveUserProfile(userId, profile);

    res.json({
      success: true,
      profile: {
        userId: profile.userId,
        age: profile.age,
        income: profile.income,
        employmentStatus: profile.employmentStatus,
        livingSituation: profile.livingSituation,
        financialGoals: profile.financialGoals,
        knowledgeLevel: profile.knowledgeLevel,
        riskTolerance: profile.riskTolerance,
        lifeDecoderScore: profile.lifeDecoderScore,
        lastUpdated: profile.lastUpdated
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

// Get personalized recommendations
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      maxRecommendations = 5, 
      categories = 'courses,simulations,documents,general',
      refreshCache = false 
    } = req.query;

    const categoryArray = categories.split(',').map(c => c.trim());

    const recommendations = await RecommendationEngine.generateRecommendations(
      userId,
      {
        maxRecommendations: parseInt(maxRecommendations),
        categories: categoryArray,
        refreshCache: refreshCache === 'true'
      }
    );

    res.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
      categories: categoryArray
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

// Calculate LifeDecoder Score
router.post('/calculate-score', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const scoreResult = await LifeDecoderCalculator.calculateScore(userId);

    // Update user model with new score
    req.user.lifeDecoderScore = scoreResult.totalScore;
    await req.user.save();

    res.json({
      success: true,
      score: scoreResult
    });
  } catch (error) {
    console.error('Error calculating LifeDecoder score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate LifeDecoder score'
    });
  }
});

// Get LifeDecoder Score breakdown
router.get('/score-breakdown', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const scoreResult = await LifeDecoderCalculator.calculateScore(userId);

    res.json({
      success: true,
      score: scoreResult
    });
  } catch (error) {
    console.error('Error getting score breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get score breakdown'
    });
  }
});

// Track behavior event
router.post('/track-behavior', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventType, eventData, context } = req.body;

    if (!eventType || !eventData) {
      return res.status(400).json({
        success: false,
        error: 'eventType and eventData are required'
      });
    }

    await BehaviorTracker.trackBehavior(userId, eventType, eventData, context);

    res.json({
      success: true,
      message: 'Behavior tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track behavior'
    });
  }
});

// Get behavior analytics
router.get('/behavior-analytics', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const analytics = await BehaviorTracker.getBehaviorAnalytics(
      userId, 
      parseInt(days)
    );

    res.json({
      success: true,
      analytics,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error getting behavior analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get behavior analytics'
    });
  }
});

// Get activity history
router.get('/activity-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const activities = await UserProfileUpdater.getActivityHistory(
      userId, 
      parseInt(limit)
    );

    res.json({
      success: true,
      activities: activities.map(activity => ({
        id: activity.id,
        activityType: activity.activityType,
        timestamp: activity.timestamp,
        score: activity.score,
        metadata: activity.metadata
      })),
      total: activities.length
    });
  } catch (error) {
    console.error('Error getting activity history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity history'
    });
  }
});

// Update profile from activity (internal endpoint)
router.post('/update-from-activity', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityData } = req.body;

    if (!activityData || !activityData.type) {
      return res.status(400).json({
        success: false,
        error: 'activityData with type is required'
      });
    }

    const updatedProfile = await UserProfileUpdater.updateFromActivity(
      userId, 
      activityData
    );

    res.json({
      success: true,
      profile: {
        knowledgeLevel: updatedProfile.knowledgeLevel,
        lifeDecoderScore: updatedProfile.lifeDecoderScore,
        lastUpdated: updatedProfile.lastUpdated
      },
      message: 'Profile updated from activity'
    });
  } catch (error) {
    console.error('Error updating profile from activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile from activity'
    });
  }
});

// Get learning insights
router.get('/learning-insights', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfileUpdater.getUserProfile(userId);
    const activities = await UserProfileUpdater.getActivityHistory(userId, 100);

    // Calculate learning insights
    const learningActivities = activities.filter(a => 
      ['course_completed', 'simulation_completed', 'quiz_completed'].includes(a.activityType)
    );

    const scores = learningActivities
      .map(a => a.activityData?.score)
      .filter(s => s !== undefined);

    const avgScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    const recentScores = scores.slice(0, 5);
    const olderScores = scores.slice(5, 10);

    const recentAvg = recentScores.length > 0 
      ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length 
      : 0;

    const olderAvg = olderScores.length > 0 
      ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length 
      : 0;

    const trend = recentAvg > olderAvg + 5 ? 'improving' : 
                  recentAvg < olderAvg - 5 ? 'declining' : 'stable';

    const insights = {
      totalLearningActivities: learningActivities.length,
      averageScore: Math.round(avgScore),
      recentAverageScore: Math.round(recentAvg),
      trend,
      knowledgeLevel: profile.knowledgeLevel,
      completedModules: profile.profileData.completedModules?.length || 0,
      topicInterests: profile.profileData.topicInterests || [],
      learningStyle: profile.profileData.learningStyle || 'visual',
      strongAreas: [], // Could be enhanced with more analysis
      improvementAreas: [] // Could be enhanced with more analysis
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error getting learning insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning insights'
    });
  }
});

// Get personalization dashboard data
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all personalization data in parallel
    const [profile, recommendations, scoreResult, analytics] = await Promise.all([
      UserProfileUpdater.getUserProfile(userId),
      RecommendationEngine.generateRecommendations(userId, { maxRecommendations: 3 }),
      LifeDecoderCalculator.calculateScore(userId).catch(() => null),
      BehaviorTracker.getBehaviorAnalytics(userId, 7).catch(() => null)
    ]);

    const dashboard = {
      profile: {
        knowledgeLevel: profile.knowledgeLevel,
        lifeDecoderScore: profile.lifeDecoderScore,
        completedModules: profile.profileData.completedModules?.length || 0,
        activityCount: profile.profileData.activityCount || 0
      },
      recommendations: recommendations.slice(0, 3),
      score: scoreResult ? {
        totalScore: scoreResult.totalScore,
        level: scoreResult.level,
        topStrength: Object.keys(scoreResult.breakdown).reduce((a, b) => 
          scoreResult.breakdown[a].score > scoreResult.breakdown[b].score ? a : b
        ),
        topImprovement: Object.keys(scoreResult.breakdown).reduce((a, b) => 
          scoreResult.breakdown[a].score < scoreResult.breakdown[b].score ? a : b
        )
      } : null,
      recentActivity: analytics ? {
        totalEvents: analytics.totalEvents,
        uniqueDays: analytics.uniqueDays,
        engagementTrend: analytics.engagementTrends?.trend || 'stable'
      } : null
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Error getting personalization dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalization dashboard'
    });
  }
});

export default router;