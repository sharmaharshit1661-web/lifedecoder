import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config(); // loads .env locally; on Render, env vars come from dashboard
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import coachRoutes from './routes/coach.js';
import userRoutes from './routes/user.js';
import simulationRoutes from './routes/simulations.js';
import documentRoutes from './routes/documents.js';
import communityRoutes from './routes/community.js';
import coursesRoutes from './routes/courses.js';
import roadmapRoutes from './routes/roadmap.js';
import personalizationRoutes from './routes/personalization.js';
import { providerStatus } from './services/rag/generateResponse.js';

// Connect to Database (hybrid: PostgreSQL + Local Storage)
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o) || o === '*')) {
      return callback(null, true);
    }
    // Also allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/user', userRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/personalization', personalizationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LifeDecoder AI Platform is running',
    timestamp: new Date().toISOString(),
    features: {
      rag: providerStatus.nvidia || providerStatus.openai || providerStatus.anthropic,
      personalization: true,
      vectorDB: true,
      activeProvider: providerStatus.active || 'none',
      aiModels: {
        nvidia:    providerStatus.nvidia,
        openai:    providerStatus.openai,
        anthropic: providerStatus.anthropic,
      }
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'LifeDecoder AI Platform API',
    version: '2.0.0',
    description: 'Production-ready AI platform with RAG and personalization',
    features: [
      'RAG-powered document analysis',
      'Context-aware AI life coach',
      'Personalized recommendations',
      'Behavior tracking and analytics',
      'LifeDecoder score calculation',
      'Adaptive simulations'
    ],
    endpoints: {
      auth: '/api/auth',
      coach: '/api/coach',
      documents: '/api/documents',
      personalization: '/api/personalization',
      user: '/api/user',
      courses: '/api/courses',
      simulations: '/api/simulations',
      community: '/api/community',
      roadmap: '/api/roadmap'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableEndpoints: [
      '/api',
      '/health',
      '/api/auth',
      '/api/coach',
      '/api/documents',
      '/api/personalization'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LifeDecoder AI Platform running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Providers:`);
  console.log(`   - NVIDIA:    ${providerStatus.nvidia    ? '✅' : '❌'}`);
  console.log(`   - OpenAI:    ${providerStatus.openai    ? '✅' : '❌'}`);
  console.log(`   - Anthropic: ${providerStatus.anthropic ? '✅' : '❌'}`);
  console.log(`   - Active:    ${providerStatus.active    || 'NONE ⚠️'}`);
});

export default app;