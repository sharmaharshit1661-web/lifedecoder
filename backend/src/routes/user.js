import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Achievement from '../models/Achievement.js';
import CourseCompletion from '../models/Course.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lifeDecoderScore: user.lifeDecoderScore,
        quizCompleted: user.quizCompleted,
        level: user.level,
        xp: user.xp,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (name) req.user.name = name;
    if (email) req.user.email = email;

    await req.user.save();

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        lifeDecoderScore: req.user.lifeDecoderScore,
        quizCompleted: req.user.quizCompleted,
        level: req.user.level,
        xp: req.user.xp,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz results
router.post('/quiz', protect, async (req, res) => {
  try {
    const { answers, score } = req.body;

    // Normalize answers — support both flat { category: answer } and enriched { category: { answer, correct } }
    const normalizedAnswers = {};
    if (answers && typeof answers === 'object') {
      Object.entries(answers).forEach(([cat, val]) => {
        if (val && typeof val === 'object' && 'answer' in val) {
          normalizedAnswers[cat] = val.answer; // store just the answer string
        } else {
          normalizedAnswers[cat] = val;
        }
      });
    }

    req.user.quizCompleted = true;
    req.user.lifeDecoderScore = score;
    req.user.quizAnswers = normalizedAnswers;
    req.user.xp += 50;
    req.user.calculateLevel();
    await req.user.save();

    // Award "First Steps" achievement
    try {
      await Achievement.create({
        userId: req.user.id,
        badgeName: 'First Steps',
        badgeType: 'first-steps',
        description: 'Complete your first quiz',
      });
    } catch (err) {
      // Achievement might already exist
      console.log('Achievement already exists or error:', err.message);
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        lifeDecoderScore: req.user.lifeDecoderScore,
        quizCompleted: req.user.quizCompleted,
        level: req.user.level,
        xp: req.user.xp,
      },
      xpEarned: 50,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user progress/milestones
router.get('/progress', protect, async (req, res) => {
  try {
    const progress = await Progress.findByUserId(req.user.id);

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update milestone progress
router.post('/progress', protect, async (req, res) => {
  try {
    const { milestoneId, milestoneType, milestoneName, completed } = req.body;

    let progress = await Progress.findByUserAndMilestone(req.user.id, milestoneId);

    if (progress) {
      progress.completed = completed;
      if (completed) {
        progress.completedAt = new Date().toISOString();
        // Award XP for completing milestone
        req.user.xp += 20;
        req.user.calculateLevel();
        await req.user.save();
      }
      await progress.save();
    } else {
      progress = await Progress.create({
        userId: req.user.id,
        milestoneId,
        milestoneType,
        milestoneName,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });

      if (completed) {
        req.user.xp += 20;
        req.user.calculateLevel();
        await req.user.save();
      }
    }

    res.json({
      success: true,
      progress,
      xpEarned: completed ? 20 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user achievements
router.get('/achievements', protect, async (req, res) => {
  try {
    const achievements = await Achievement.findByUserId(req.user.id);

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Award achievement
router.post('/achievements', protect, async (req, res) => {
  try {
    const { badgeName, badgeType, description } = req.body;

    const achievement = await Achievement.create({
      userId: req.user.id,
      badgeName,
      badgeType,
      description,
    });

    // Award XP for achievement
    req.user.xp += 30;
    req.user.calculateLevel();
    await req.user.save();

    res.json({
      success: true,
      achievement,
      xpEarned: 30,
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: 'Achievement already earned' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get completed courses
router.get('/courses', protect, async (req, res) => {
  try {
    const courses = await CourseCompletion.findByUserId(req.user.id);

    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a course
router.post('/courses', protect, async (req, res) => {
  try {
    const { courseId, courseName } = req.body;

    const course = await CourseCompletion.create({
      userId: req.user.id,
      courseId,
      courseName,
    });

    // Award XP for completing course
    req.user.xp += 15;
    req.user.calculateLevel();
    await req.user.save();

    res.json({
      success: true,
      course,
      xpEarned: 15,
    });
  } catch (error) {
    if (error.message.includes('already completed')) {
      return res.status(400).json({ error: 'Course already completed' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get personalized recommendations based on quiz score + weak categories
router.get('/recommendations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const score = user.lifeDecoderScore || 0;
    const quizAnswers = user.quizAnswers || {};

    // Map of category → resource recommendations
    const CATEGORY_RESOURCES = {
      credit: {
        label: 'Credit & Credit Scores',
        icon: '💳',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'salary-negotiation',
        tip: 'Your credit score affects loans, rentals, and even jobs. Start building it now.',
        href: '/finance',
        priority: 1,
      },
      taxes: {
        label: 'Filing Taxes',
        icon: '🧾',
        course: { id: 'taxes-20-min', title: 'File Taxes in 20 Minutes', xp: 50 },
        simulation: null,
        tip: 'Filing taxes is mandatory. Learn the basics before your first deadline.',
        href: '/courses',
        priority: 2,
      },
      insurance: {
        label: 'Health Insurance',
        icon: '🏥',
        course: { id: 'insurance-basics', title: 'What is Insurance', xp: 35 },
        simulation: null,
        tip: 'Understanding deductibles and premiums can save you thousands.',
        href: '/healthcare',
        priority: 3,
      },
      renting: {
        label: 'Renting & Leases',
        icon: '🏠',
        course: { id: 'lease-agreements', title: 'Understanding Lease Agreements', xp: 35 },
        simulation: 'lease-negotiation',
        tip: 'Know what you\'re signing before you move in.',
        href: '/renting',
        priority: 4,
      },
      finance: {
        label: 'Emergency Fund',
        icon: '💰',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'budget-crisis',
        tip: '3–6 months of expenses saved = financial safety net.',
        href: '/finance',
        priority: 5,
      },
      employment: {
        label: 'Employment & Pay Stubs',
        icon: '💼',
        course: { id: 'employment-contract', title: 'Understanding Employment Contracts', xp: 30 },
        simulation: 'job-interview',
        tip: 'Know the difference between gross and net pay before your first job.',
        href: '/courses',
        priority: 6,
      },
      rights: {
        label: 'Tenant & Legal Rights',
        icon: '⚖️',
        course: { id: 'lease-agreements', title: 'Understanding Lease Agreements', xp: 35 },
        simulation: null,
        tip: 'Landlords must give notice before entering. Know your rights.',
        href: '/rights',
        priority: 7,
      },
      debt: {
        label: 'Managing Debt',
        icon: '📉',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'budget-crisis',
        tip: 'Minimum payments trap you in debt. Learn to pay strategically.',
        href: '/finance',
        priority: 8,
      },
      healthcare: {
        label: 'Healthcare Navigation',
        icon: '🩺',
        course: { id: 'medical-bill', title: 'Read a Medical Bill', xp: 45 },
        simulation: null,
        tip: 'Urgent care vs ER — choosing right saves time and money.',
        href: '/healthcare',
        priority: 9,
      },
      investing: {
        label: 'Investing & Retirement',
        icon: '📈',
        course: { id: 'negotiate-salary', title: 'Negotiate Your Salary', xp: 75 },
        simulation: 'salary-negotiation',
        tip: 'A 401(k) match is free money. Never leave it on the table.',
        href: '/finance',
        priority: 10,
      },
      contracts: {
        label: 'Reading Contracts',
        icon: '📝',
        course: { id: 'employment-contract', title: 'Understanding Employment Contracts', xp: 30 },
        simulation: null,
        tip: 'Always read before signing — every clause matters.',
        href: '/documents',
        priority: 11,
      },
      budgeting: {
        label: 'Budgeting (50/30/20)',
        icon: '📊',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'budget-crisis',
        tip: 'The 50/30/20 rule is the simplest way to take control of money.',
        href: '/finance',
        priority: 12,
      },
    };

    // Determine weak categories from quiz answers
    const CORRECT_ANSWERS = {
      credit:     'To assess your creditworthiness for loans and rentals',
      taxes:      'A document showing your annual wages and taxes withheld',
      insurance:  'The amount you pay before insurance starts covering costs',
      renting:    "Security deposit and first month's rent",
      finance:    '3-6 months of expenses',
      employment: 'Income before any deductions',
      rights:     'No, they must provide reasonable notice except in emergencies',
      debt:       'You pay significantly more in interest over time',
      healthcare: 'For non-life-threatening issues like minor injuries or flu',
      investing:  'An employer-sponsored retirement savings plan',
      contracts:  'Read it carefully and ask questions about unclear terms',
      budgeting:  '50% needs, 30% wants, 20% savings',
    };

    const weakCategories = [];
    const strongCategories = [];

    Object.entries(CORRECT_ANSWERS).forEach(([cat, correct]) => {
      const userAnswer = quizAnswers[cat];
      if (userAnswer && userAnswer !== correct) {
        weakCategories.push(cat);
      } else if (userAnswer === correct) {
        strongCategories.push(cat);
      }
    });

    // Build recommendations: weak categories first, then score-based
    let recommendations = [];

    // Priority 1: Weak categories (wrong answers)
    weakCategories
      .sort((a, b) => CATEGORY_RESOURCES[a].priority - CATEGORY_RESOURCES[b].priority)
      .slice(0, 4)
      .forEach(cat => {
        const r = CATEGORY_RESOURCES[cat];
        recommendations.push({
          type: 'weak_area',
          category: cat,
          label: r.label,
          icon: r.icon,
          tip: r.tip,
          course: r.course,
          simulation: r.simulation,
          href: r.href,
          urgency: 'high',
          reason: `You missed this in the quiz — let's fix that!`,
        });
      });

    // Priority 2: Score-based global recommendations
    if (score < 40) {
      recommendations.push({
        type: 'score_based',
        category: 'budgeting',
        label: 'Start with Budgeting Basics',
        icon: '🌱',
        tip: 'The 50/30/20 rule is the foundation of financial health.',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'budget-crisis',
        href: '/finance',
        urgency: 'high',
        reason: 'Great starting point for building your financial foundation.',
      });
      recommendations.push({
        type: 'score_based',
        category: 'employment',
        label: 'Understand Your First Paycheck',
        icon: '💵',
        tip: 'Know what gross vs net pay means before you start working.',
        course: { id: 'employment-contract', title: 'Understanding Employment Contracts', xp: 30 },
        simulation: 'job-interview',
        href: '/courses',
        urgency: 'medium',
        reason: 'Essential knowledge for your first job.',
      });
    } else if (score < 65) {
      recommendations.push({
        type: 'score_based',
        category: 'credit',
        label: 'Build Your Credit Score',
        icon: '📊',
        tip: 'Start building credit now — it takes time and pays off big.',
        course: { id: 'emergency-fund', title: 'Create an Emergency Fund', xp: 40 },
        simulation: 'salary-negotiation',
        href: '/finance',
        urgency: 'medium',
        reason: 'Good credit opens doors to better rates and opportunities.',
      });
    } else if (score < 85) {
      recommendations.push({
        type: 'score_based',
        category: 'investing',
        label: 'Level Up: Start Investing',
        icon: '🚀',
        tip: 'You have the basics. Now grow your wealth with smart investing.',
        course: { id: 'negotiate-salary', title: 'Negotiate Your Salary', xp: 75 },
        simulation: 'salary-negotiation',
        href: '/finance',
        urgency: 'low',
        reason: 'You\'re ready to go beyond basics.',
      });
    } else {
      recommendations.push({
        type: 'score_based',
        category: 'investing',
        label: 'Advanced: Salary Negotiation',
        icon: '🏆',
        tip: 'You\'re an expert — now maximize your earning potential.',
        course: { id: 'negotiate-salary', title: 'Negotiate Your Salary', xp: 75 },
        simulation: 'salary-negotiation',
        href: '/simulations',
        urgency: 'low',
        reason: 'Challenge yourself with advanced life skills.',
      });
    }

    // Deduplicate by category
    const seen = new Set();
    recommendations = recommendations.filter(r => {
      if (seen.has(r.category)) return false;
      seen.add(r.category);
      return true;
    }).slice(0, 6);

    // Score tier info
    const tier = score >= 85 ? { label: 'Expert', emoji: '🏆', color: '#059669' }
      : score >= 65 ? { label: 'Competent', emoji: '🎯', color: '#2563eb' }
      : score >= 40 ? { label: 'Learning', emoji: '📚', color: '#7c3aed' }
      : { label: 'Beginner', emoji: '🌱', color: '#d97706' };

    res.json({
      success: true,
      score,
      tier,
      weakCategories,
      strongCategories,
      recommendations,
      totalQuestions: Object.keys(CORRECT_ANSWERS).length,
      correctCount: strongCategories.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', protect, async (req, res) => {
  try {
    const achievements = await Achievement.findByUserId(req.user.id);
    const progress = await Progress.findCompleted(req.user.id);
    const courses = await CourseCompletion.findByUserId(req.user.id);

    res.json({
      success: true,
      stats: {
        level: req.user.level,
        xp: req.user.xp,
        lifeDecoderScore: req.user.lifeDecoderScore,
        achievementsEarned: achievements.length,
        milestonesCompleted: progress.length,
        coursesCompleted: courses.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
