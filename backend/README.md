# AdultIQ Backend - MongoDB Edition

Complete Express.js + MongoDB backend for AdultIQ platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Anthropic API key

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/adultiq
JWT_SECRET=your_super_secret_jwt_key_change_in_production
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### MongoDB Setup

#### Option 1: Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or download from https://www.mongodb.com/try/download/community

# Start MongoDB
brew services start mongodb-community

# MongoDB will run on mongodb://localhost:27017
```

#### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (free tier available)
4. Get connection string
5. Update `MONGODB_URI` in `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/adultiq?retryWrites=true&w=majority
```

### Run Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on http://localhost:3001

## 📊 Database Models

### User
- Authentication and profile
- AdultIQ score tracking
- XP and level system
- Quiz completion status

### Conversation
- AI coach chat history
- Message threading
- Conversation types (coach, simulation)

### Simulation
- Interactive scenario tracking
- Conversation history
- Score and feedback
- XP rewards

### Progress
- Life milestone tracking
- Completion status
- Stage-based progression

### Achievement
- Badge system
- Unique achievements per user
- Earned timestamps

### CourseCompletion
- Micro course tracking
- Completion timestamps
- Prevents duplicates

### CommunityPost
- Discussion forum posts
- Replies and likes
- Category organization
- Anonymous posting option

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup          - Create account
POST   /api/auth/signin          - Sign in
GET    /api/auth/me              - Get current user (protected)
```

### AI Coach
```
POST   /api/coach/chat           - Send message (protected)
GET    /api/coach/conversations  - Get chat history (protected)
GET    /api/coach/conversations/:id - Get specific chat (protected)
```

### User Management
```
GET    /api/user/profile         - Get profile (protected)
PUT    /api/user/profile         - Update profile (protected)
POST   /api/user/quiz            - Submit quiz (protected)
GET    /api/user/progress        - Get milestones (protected)
POST   /api/user/progress        - Update milestone (protected)
GET    /api/user/achievements    - Get badges (protected)
POST   /api/user/achievements    - Award badge (protected)
GET    /api/user/courses         - Get completed courses (protected)
POST   /api/user/courses         - Complete course (protected)
GET    /api/user/stats           - Get user stats (protected)
```

### Simulations
```
POST   /api/simulations/start    - Start simulation (protected)
POST   /api/simulations/continue - Continue simulation (protected)
POST   /api/simulations/complete - Complete simulation (protected)
GET    /api/simulations/history  - Get history (protected)
```

### Documents
```
POST   /api/documents/decode     - Decode document (protected)
```

### Community
```
GET    /api/community/posts      - Get all posts
GET    /api/community/posts/:id  - Get single post
POST   /api/community/posts      - Create post (protected)
PUT    /api/community/posts/:id  - Update post (protected)
DELETE /api/community/posts/:id  - Delete post (protected)
POST   /api/community/posts/:id/like - Like post (protected)
POST   /api/community/posts/:id/replies - Add reply (protected)
POST   /api/community/posts/:postId/replies/:replyId/like - Like reply (protected)
```

### Health Check
```
GET    /health                   - Server status
```

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for authentication.

### Protected Routes
Add `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Token Generation
Tokens are generated on signup/signin and expire in 30 days.

## 🎮 XP System

Users earn XP for various activities:
- Complete quiz: +50 XP
- Use AI coach: +5 XP per message
- Complete simulation: +0-200 XP (based on score)
- Decode document: +10 XP
- Complete milestone: +20 XP
- Complete course: +15 XP
- Create community post: +10 XP
- Reply to post: +5 XP
- Earn achievement: +30 XP

Level = floor(XP / 100) + 1

## 🏆 Achievement System

Achievements are unique per user (compound index on userId + badgeType).

Available badges:
- `first-steps` - Complete your first quiz
- `money-master` - Complete 5 finance simulations
- `career-ready` - Ace the job interview
- `negotiation-pro` - Win 3 salary negotiations
- `life-master` - Reach AdultIQ score of 90+
- `consistent-learner` - 30-day learning streak

## 📝 Request Examples

### Sign Up
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### AI Coach Chat
```bash
curl -X POST http://localhost:3001/api/coach/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "How do I negotiate my salary?"
  }'
```

### Start Simulation
```bash
curl -X POST http://localhost:3001/api/simulations/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "simulationType": "salary-negotiation",
    "userContext": {}
  }'
```

### Decode Document
```bash
curl -X POST http://localhost:3001/api/documents/decode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentText": "LEASE AGREEMENT...",
    "documentType": "lease"
  }'
```

## 🔧 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Conversation.js   # Chat history
│   │   ├── Simulation.js     # Simulations
│   │   ├── Progress.js       # Milestones
│   │   ├── Achievement.js    # Badges
│   │   ├── Course.js         # Course completions
│   │   └── CommunityPost.js  # Forum posts
│   ├── routes/
│   │   ├── auth.js           # Authentication
│   │   ├── coach.js          # AI Coach
│   │   ├── user.js           # User management
│   │   ├── simulations.js    # Simulations
│   │   ├── documents.js      # Document decoder
│   │   └── community.js      # Community forum
│   └── server.js             # Express app
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚢 Deployment

### Railway

1. Create Railway account
2. New Project > Deploy from GitHub
3. Add environment variables
4. Deploy!

### Render

1. Create Render account
2. New > Web Service
3. Connect GitHub repo
4. Add environment variables
5. Deploy!

### MongoDB Atlas

For production, use MongoDB Atlas:
1. Create cluster
2. Whitelist IP addresses (or allow all for testing)
3. Create database user
4. Get connection string
5. Update `MONGODB_URI` in production env

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service
```bash
brew services start mongodb-community
```

### JWT Error
```
Error: Not authorized, token failed
```
**Solution**: Check token is valid and not expired

### Anthropic API Error
```
Error: Invalid API key
```
**Solution**: Verify `ANTHROPIC_API_KEY` in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Kill process on port 3001
```bash
lsof -ti:3001 | xargs kill -9
```

## 📊 Database Indexes

Automatically created indexes:
- User: email (unique)
- Progress: userId + milestoneId (unique compound)
- Achievement: userId + badgeType (unique compound)
- CourseCompletion: userId + courseId (unique compound)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation with express-validator
- CORS configuration
- Request size limits
- Protected routes middleware

## 📈 Performance

- Mongoose connection pooling
- Indexed queries
- Lean queries where appropriate
- Pagination support
- Request size limits

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

## 📝 License

MIT

---

**Built with Express.js, MongoDB, and Anthropic Claude** 🚀
