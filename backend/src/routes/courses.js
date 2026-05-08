import express from 'express';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const COURSES = [
  {
    id: 'taxes-20-min',
    title: 'File Taxes in 20 Minutes',
    duration: '20 min',
    difficulty: 'Beginner',
    xpReward: 50,
    category: 'tax filing',
    videoUrl: 'https://youtu.be/7jknxuR0kiw?si=FbyiHK9UuIWZbPec'
  },
  {
    id: 'negotiate-salary',
    title: 'Negotiate Your Salary',
    duration: '15 min',
    difficulty: 'Advanced',
    xpReward: 75,
    category: 'salary negotiation',
    videoUrl: 'https://youtu.be/J30wmYgzVXM?si=9cnZ8HFXX7Xoni42'
  },
  {
    id: 'emergency-fund',
    title: 'Create an Emergency Fund',
    duration: '12 min',
    difficulty: 'Beginner',
    xpReward: 40,
    category: 'emergency fund',
    videoUrl: 'https://youtu.be/vO2KGm8NM8E?si=ldcc69JRUZU1Oe1H'
  },
  {
    id: 'medical-bill',
    title: 'Read a Medical Bill',
    duration: '10 min',
    difficulty: 'Intermediate',
    xpReward: 45,
    category: 'read a medical bill',
    videoUrl: 'https://youtu.be/8rfYW7cOq_c?si=HmDhjrCvVY79wmZR'
  },
  {
    id: 'lease-agreements',
    title: 'Understanding Lease Agreements',
    duration: '8 min',
    difficulty: 'Intermediate',
    xpReward: 35,
    category: 'lease agreements',
    videoUrl: 'https://youtu.be/KnVW_wx8zKo?si=MonPedrzkz0XyaP-'
  },
  {
    id: 'employment-contract',
    title: 'Two Things to Know Before Signing Your Employment Contract',
    duration: '6 min',
    difficulty: 'Beginner',
    xpReward: 30,
    category: 'employment contract',
    videoUrl: 'https://youtu.be/-JZIY2YC4UQ?si=nWWlD7Ky1fUZ0lU4'
  },
  {
    id: 'insurance-basics',
    title: 'What is Insurance',
    duration: '7 min',
    difficulty: 'Beginner',
    xpReward: 35,
    category: 'insurance',
    videoUrl: 'https://youtu.be/ifTxb9eY5jc?si=1PYusXUyTl1jz9ix'
  }
];

// Get all courses
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      courses: COURSES
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// Get user's course progress
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get completed courses from Progress model
    const completedProgress = await Progress.findByUserId(userId);
    const courseProgress = completedProgress.filter(p => p.milestoneType === 'course' && p.completed);
    const completedCourses = courseProgress.map(p => p.milestoneId);

    // Get user's current XP and level
    const user = await User.findById(userId);

    res.json({
      success: true,
      completedCourses,
      totalXp: user.xp,
      level: user.level
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course progress'
    });
  }
});

// Complete a course
router.post('/complete', protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find the course
    const course = COURSES.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is already completed
    const existingProgress = await Progress.findByUserAndMilestone(userId, courseId);

    if (existingProgress && existingProgress.completed) {
      return res.status(400).json({
        success: false,
        message: 'Course already completed'
      });
    }

    // Create or update progress record
    const progressData = {
      userId,
      milestoneId: courseId,
      milestoneType: 'course',
      milestoneName: course.title,
      completed: true,
      completedAt: new Date().toISOString()
    };

    if (existingProgress) {
      existingProgress.completed = true;
      existingProgress.completedAt = new Date().toISOString();
      await existingProgress.save();
    } else {
      await Progress.create(progressData);
    }

    // Award XP to user
    const user = await User.findById(userId);
    user.xp += course.xpReward;
    user.calculateLevel(); // This updates the level based on XP
    await user.save();

    res.json({
      success: true,
      courseCompleted: true,
      xpAwarded: course.xpReward,
      courseTitle: course.title,
      newXp: user.xp,
      newLevel: user.level,
      message: `Congratulations! You've completed "${course.title}" and earned ${course.xpReward} XP!`
    });
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing course'
    });
  }
});

export default router;