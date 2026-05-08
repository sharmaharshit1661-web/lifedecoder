import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Achievement from '../models/Achievement.js';

const router = express.Router();

// Get user's roadmap progress
router.get('/progress', protect, async (req, res) => {
  try {
    const progress = await Progress.findByUserId(req.user.id);
    const roadmapProgress = progress.filter(p => p.milestoneType === 'roadmap-level');

    const progressMap = {};
    roadmapProgress.forEach(p => {
      progressMap[p.milestoneId] = p;
    });

    res.json({
      success: true,
      progress: progressMap,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a roadmap level
router.post('/complete-level', protect, async (req, res) => {
  try {
    const { levelId, levelTitle, xpReward, chapterTitle } = req.body;

    // Check if already completed
    let progress = await Progress.findByUserAndMilestone(req.user.id, levelId);

    if (progress && progress.completed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Level already completed' 
      });
    }

    // Create or update progress
    if (progress) {
      progress.completed = true;
      progress.completedAt = new Date().toISOString();
      await progress.save();
    } else {
      progress = await Progress.create({
        userId: req.user.id,
        milestoneId: levelId,
        milestoneType: 'roadmap-level',
        milestoneName: `${chapterTitle}: ${levelTitle}`,
        completed: true,
        completedAt: new Date().toISOString(),
      });
    }

    // Award XP
    req.user.xp += xpReward;
    const oldLevel = req.user.level;
    req.user.calculateLevel();
    const newLevel = req.user.level;
    await req.user.save();

    // Check for level up achievement
    let levelUpAchievement = null;
    if (newLevel > oldLevel) {
      try {
        levelUpAchievement = await Achievement.create({
          userId: req.user.id,
          badgeName: `Level ${newLevel} Reached`,
          badgeType: 'level-up',
          description: `Reached level ${newLevel}!`,
        });
      } catch (err) {
        // Achievement might already exist
        console.log('Level up achievement error:', err.message);
      }
    }

    // Check for chapter completion achievements
    const allProgress = await Progress.findByUserId(req.user.id);
    const chapterLevels = allProgress.filter(p => 
      p.milestoneType === 'roadmap-level' && 
      p.milestoneName && 
      p.milestoneName.startsWith(`${chapterTitle}:`)
    );

    let chapterAchievement = null;
    if (chapterLevels.length >= getChapterLevelCount(chapterTitle)) {
      try {
        chapterAchievement = await Achievement.create({
          userId: req.user.id,
          badgeName: `${chapterTitle} Master`,
          badgeType: 'chapter-complete',
          description: `Completed all levels in ${chapterTitle}`,
        });
      } catch (err) {
        // Achievement might already exist
        console.log('Chapter achievement error:', err.message);
      }
    }

    res.json({
      success: true,
      progress,
      xpEarned: xpReward,
      levelUp: newLevel > oldLevel,
      newLevel,
      achievements: [levelUpAchievement, chapterAchievement].filter(Boolean),
      user: {
        level: req.user.level,
        xp: req.user.xp,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get roadmap steps for a level
router.get('/steps/:levelId', protect, async (req, res) => {
  try {
    const { levelId } = req.params;
    const steps = getRoadmapSteps(levelId);
    
    if (!steps) {
      return res.status(404).json({ 
        success: false, 
        error: 'Level not found' 
      });
    }

    res.json({
      success: true,
      steps,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get chapter level count
function getChapterLevelCount(chapterTitle) {
  const chapterCounts = {
    'Finance & Money': 6,
    'Health & Fitness': 6,
    'Career & Education': 6,
    'Legal & Civic Rights': 6,
    'Mental Health': 6,
    'Relationships & Social': 6,
  };
  return chapterCounts[chapterTitle] || 6;
}

// Helper function to get roadmap steps for each level
function getRoadmapSteps(levelId) {
  const stepsMap = {
    'finance-1': [
      'Research banks in your area and compare savings account options',
      'Visit a bank or apply online for a savings account',
      'Set up automatic monthly transfer from checking to savings'
    ],
    'finance-2': [
      'Check your credit score and understand credit basics',
      'Research beginner-friendly credit cards with no annual fee',
      'Apply for your first credit card and make small purchases'
    ],
    'finance-3': [
      'List your monthly expenses and categorize them as needs vs wants',
      'Track your spending for one week to identify patterns',
      'Create a simple budget prioritizing needs over wants'
    ],
    'finance-4': [
      'Download a budgeting app or create a simple spreadsheet',
      'Record all expenses for one month',
      'Review your spending patterns and identify areas to improve'
    ],
    'finance-5': [
      'Learn about TDS (Tax Deducted at Source) and how it works',
      'Understand when and how to file ITR (Income Tax Return)',
      'Gather necessary documents for tax filing'
    ],
    'finance-6': [
      'Calculate your monthly income after taxes',
      'Allocate 50% for needs, 30% for wants, 20% for savings',
      'Set up automatic transfers to enforce your budget'
    ],
    'health-1': [
      'Research doctors in your area and read reviews',
      'Schedule an appointment for a general health checkup',
      'Prepare questions about your health and family history'
    ],
    'health-2': [
      'Find a dentist in your area with good reviews',
      'Schedule a dental cleaning and checkup',
      'Learn about proper dental hygiene habits'
    ],
    'health-3': [
      'Choose a physical activity you enjoy (walking, dancing, sports)',
      'Start with 20 minutes, 3 times per week',
      'Track your progress and gradually increase duration'
    ],
    'health-4': [
      'Learn 5 basic recipes (pasta, rice, eggs, vegetables, simple curry)',
      'Practice cooking each meal at least twice',
      'Focus on balanced nutrition with proteins, carbs, and vegetables'
    ],
    'health-5': [
      'Read your health insurance policy documents carefully',
      'Understand what treatments and medications are covered',
      'Learn the process for making insurance claims'
    ],
    'health-6': [
      'Set a consistent bedtime and wake-up time',
      'Create a relaxing bedtime routine (no screens 1 hour before bed)',
      'Track your sleep for one week to identify patterns'
    ],
    'career-1': [
      'List your education, skills, and any work experience',
      'Use a simple resume template and keep it to one page',
      'Have someone review your resume for clarity and errors'
    ],
    'career-2': [
      'Create a professional LinkedIn profile with a good photo',
      'Connect with classmates, teachers, and family friends',
      'Join industry groups and engage with professional content'
    ],
    'career-3': [
      'Research internship opportunities in your field of interest',
      'Apply to at least 5 positions or freelance projects',
      'Prepare for interviews and follow up professionally'
    ],
    'career-4': [
      'Identify one skill that\'s in high demand in your field',
      'Find free or affordable courses online (Coursera, YouTube, etc.)',
      'Practice the skill through projects and build a portfolio'
    ],
    'career-5': [
      'Research job postings in your field and note required skills',
      'Talk to professionals in your industry about their career paths',
      'Identify skill gaps and create a plan to address them'
    ],
    'career-6': [
      'Define what success looks like for you in 3 years',
      'Break down your goal into yearly, monthly, and weekly actions',
      'Create accountability by sharing your plan with a mentor or friend'
    ],
    'legal-1': [
      'Check your eligibility to vote and gather required documents',
      'Register to vote online or at your local election office',
      'Learn about upcoming elections and research candidates'
    ],
    'legal-2': [
      'Apply for Aadhar card if you don\'t have one',
      'Apply for PAN card for tax purposes',
      'Consider applying for a passport for future travel'
    ],
    'legal-3': [
      'Always read contracts completely before signing',
      'Ask questions about anything you don\'t understand',
      'Keep copies of all signed documents in a safe place'
    ],
    'legal-4': [
      'Learn your basic rights during police interactions',
      'Understand when you can and cannot be searched',
      'Know important phone numbers (lawyer, family) to call if needed'
    ],
    'legal-5': [
      'Research tenant rights in your state/city',
      'Understand security deposits, rent increases, and eviction laws',
      'Learn what landlords can and cannot do'
    ],
    'legal-6': [
      'Visit your bank with PAN card and Aadhar card',
      'Fill out the PAN linking form',
      'Verify the linking is complete through online banking'
    ],
    'mental-1': [
      'Identify trusted people in your life you can talk to',
      'Practice expressing your feelings in a journal first',
      'Have one meaningful conversation about your emotions this week'
    ],
    'mental-2': [
      'Keep a stress diary for one week to identify triggers',
      'Learn 3 healthy coping strategies (deep breathing, exercise, music)',
      'Practice your coping strategies when you feel stressed'
    ],
    'mental-3': [
      'Check your current daily screen time on social media',
      'Set specific time limits using built-in app controls',
      'Replace some social media time with offline activities'
    ],
    'mental-4': [
      'Learn the symptoms of depression vs normal sadness',
      'Understand when to seek professional help',
      'Research mental health resources in your area'
    ],
    'mental-5': [
      'Choose 3-5 activities that make you feel grounded',
      'Create a consistent morning or evening routine',
      'Practice your routine for one week and adjust as needed'
    ],
    'mental-6': [
      'Challenge the stigma around mental health in conversations',
      'Learn about different types of mental health support',
      'Remember that asking for help shows strength and self-awareness'
    ],
    'relationships-1': [
      'Identify areas where you need better boundaries',
      'Practice saying "no" to requests that drain your energy',
      'Communicate your boundaries clearly and kindly'
    ],
    'relationships-2': [
      'Learn the warning signs of toxic relationships',
      'Identify healthy relationship patterns in your life',
      'Distance yourself from relationships that consistently harm you'
    ],
    'relationships-3': [
      'Focus on deepening 3-5 existing relationships',
      'Prioritize quality time over quantity of social connections',
      'Be intentional about who you invest your energy in'
    ],
    'relationships-4': [
      'Practice expressing your needs clearly without being aggressive',
      'Learn to stay calm during difficult conversations',
      'Ask for what you need instead of expecting others to guess'
    ],
    'relationships-5': [
      'Put away distractions when someone is talking to you',
      'Ask follow-up questions to show you\'re engaged',
      'Practice reflecting back what you heard before responding'
    ],
    'relationships-6': [
      'Accept that people grow and change over time',
      'Let go of friendships that no longer serve you',
      'Be grateful for what relationships taught you, even if they end'
    ]
  };

  return stepsMap[levelId] || null;
}

export default router;