import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';

const router = express.Router();

// Sign up
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, age } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      age: age ? parseInt(age) : null,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lifeDecoderScore: user.lifeDecoderScore,
        quizCompleted: user.quizCompleted,
        level: user.level,
        xp: user.xp,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sign in
router.post('/signin', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // ── Demo account (hardcoded for presentation) ──────────────────────────
    if (email === 'demo@lifedecoder.com' && password === 'demo1234') {
      const token = generateToken('demo-user-001');
      return res.json({
        success: true,
        token,
        user: {
          id: 'demo-user-001',
          name: 'Demo User',
          email: 'demo@lifedecoder.com',
          lifeDecoderScore: 72,
          quizCompleted: true,
          level: 5,
          xp: 2350,
        },
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    // Find user (password is included in our model)
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lifeDecoderScore: user.lifeDecoderScore,
        quizCompleted: user.quizCompleted,
        level: user.level,
        xp: user.xp,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
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

export default router;
