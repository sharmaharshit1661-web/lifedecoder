import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');

    // ── Demo user shortcut ─────────────────────────────────────────────────
    if (decoded.id === 'demo-user-001') {
      req.user = {
        id: 'demo-user-001',
        name: 'Demo User',
        email: 'demo@lifedecoder.com',
        lifeDecoderScore: 72,
        quizCompleted: true,
        level: 5,
        xp: 2350,
        calculateLevel() { return this.level; },
        async save() { return this; },
      };
      return next();
    }
    // ──────────────────────────────────────────────────────────────────────

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'demo-secret-key', {
    expiresIn: '30d',
  });
};
