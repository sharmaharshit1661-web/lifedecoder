# LifeDecoder - Your Life Manual for Everything School Never Taught You

**AI-Powered Life Skills Platform for Young Adults**

---

## 🎯 The Problem We Solve

Every year, **4.5 million people turn 18 in the US alone**, graduating from school with impressive academic knowledge but zero practical life skills. They know calculus but can't file taxes. They've memorized historical dates but don't understand health insurance. They can solve complex equations but fall victim to predatory loans.

### The Reality Check
- 📚 **Know calculus** → Don't know how to file taxes
- 🧮 **Memorized formulas** → Can't read health insurance cards  
- 📖 **Studied literature** → Don't understand lease agreements
- 🎓 **Graduated with honors** → Fall victim to predatory loans

### The Impact
- **76%** of young adults wish they learned more life skills in school
- **$1,230** average cost of financial mistakes in first year of independence
- **40%** lose security deposits due to lease misunderstandings
- **25%** damage credit scores within 2 years of turning 18

**The Gap**: Traditional education teaches academic skills but completely ignores the practical knowledge needed for independent adult life.

---

## 💡 Our Solution: LifeDecoder Platform

LifeDecoder bridges the gap between school and real life through an AI-powered platform that makes learning essential life skills engaging, interactive, and practical.

### 🤖 **AI Life Coach**
- 24/7 personalized advice on career, finance, relationships, and health
- Powered by advanced AI (NVIDIA's Llama models) for intelligent, contextual responses
- Non-judgmental, empathetic guidance tailored to your situation

### 🎮 **Interactive Simulations**
- Practice high-stakes decisions in a safe environment
- Salary negotiation, job interviews, lease discussions, budget crises
- Real-time AI roleplay with performance feedback and scoring

### � **Document Decoder**
- Upload complex documents for plain-English explanations
- Identify red flags, normal clauses, and action items
- Supports leases, medical bills, contracts, tax forms, credit reports

### 🎯 **Gamified Learning Experience**
- XP points, badges, achievements, and level progression
- Personalized roadmap based on your life stage and goals
- Makes learning engaging without being childish

### 🗺️ **Comprehensive Life Skills Coverage**
- Financial health and literacy
- Healthcare navigation and insurance
- Renting and tenant rights
- Career development and job skills
- Legal rights and consumer protection
- Micro-courses for quick skill building

---

## ✨ Complete Feature Set

### **Core Features**
| Feature | Purpose | Value |
|---------|---------|-------|
| 🗺️ **Life Stage Roadmap** | Personalized milestone tracking | Progressive learning path |
| 💬 **AI Life Coach** | Conversational assistance | 24/7 expert guidance |
| 🎮 **Real-Life Simulations** | Practice scenarios safely | Risk-free learning |
| 📄 **Document Decoder** | Complex paperwork explained | Immediate practical value |
| 💰 **Financial Health Dashboard** | Track money metrics | Financial literacy |
| ⏱️ **Micro Courses** | 5-minute skill lessons | Quick wins |
| 🏥 **Healthcare Navigator** | Insurance guidance | Medical literacy |
| 🏠 **Renting 101 Hub** | First-time renter guide | Housing security |
| ⚖️ **Know Your Rights** | Legal rights reference | Empowerment |
| 👥 **Community Support** | Peer learning platform | Social connection |
| 🏆 **Achievements & XP** | Gamified progress | Engagement |
| 📝 **Onboarding Quiz** | Personalized assessment | Custom experience |

### **Target Users**
- **College Freshmen (18-19)**: First time managing money independently
- **First-Generation Youth (18-25)**: No family financial context or guidance
- **Recent Graduates (22-24)**: Navigating first jobs, taxes, apartments
- **Trade School Students (18-22)**: Limited institutional guidance on life skills
- **Career Restarters (25-35)**: Rebuilding financial stability

---

## 🛠 Technology Stack

### **Frontend**
- **Framework**: Next.js 16 (React 19) - Latest features, SSR, app router
- **Styling**: Tailwind CSS - Rapid, responsive UI development
- **UI Components**: Radix UI + shadcn/ui - 57 accessible, customizable components
- **Features**: Dark mode, mobile responsive, PWA-ready

### **Backend**
- **Runtime**: Node.js with Express.js - Fast, flexible RESTful API
- **Database**: MongoDB - Flexible document database with 7 collections
- **Authentication**: JWT - Secure user sessions and API protection
- **API Design**: RESTful endpoints with proper error handling

### **AI Integration**
- **Provider**: NVIDIA API - Enterprise-grade AI infrastructure
- **Models**: Llama 3.1 (405B/8B) - Best-in-class reasoning and conversation
- **Features**: Natural language processing, contextual responses, conversation memory
- **Use Cases**: Life coaching, document analysis, simulation roleplay

### **Database Schema**
- **Users**: Authentication, profiles, LifeDecoder scores, XP/levels
- **Conversations**: AI coach chat history and context
- **Simulations**: Interactive scenario tracking with scoring
- **Progress**: Life milestone completion tracking
- **Achievements**: Badge system with unique constraints
- **Courses**: Micro course progress and certificates
- **Community**: Forum posts with replies and engagement

---

## 📁 Project Structure

```
adultiq/
├── frontend/                    # Next.js React application
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # User dashboard
│   │   ├── coach/             # AI Life Coach
│   │   ├── simulations/       # Interactive simulations
│   │   ├── documents/         # Document decoder
│   │   ├── finance/           # Financial health
│   │   ├── courses/           # Micro courses
│   │   ├── healthcare/        # Healthcare navigator
│   │   ├── renting/           # Renting 101
│   │   ├── rights/            # Know your rights
│   │   ├── community/         # Community support
│   │   ├── achievements/      # Achievements & badges
│   │   ├── roadmap/           # Life stage roadmap
│   │   ├── quiz/              # Onboarding quiz
│   │   └── api/               # API routes (5 endpoints)
│   ├── components/
│   │   ├── features/          # Feature-specific components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── landing/           # Landing page components
│   │   ├── quiz/              # Quiz components
│   │   ├── auth/              # Authentication components
│   │   └── ui/                # UI primitives (57 components)
│   └── lib/
│       ├── api.ts             # API client with authentication
│       └── utils.ts           # Utility functions
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── routes/            # API route modules
│   │   │   ├── auth.js        # Authentication (signup/signin/signout)
│   │   │   ├── coach.js       # AI Life Coach chat
│   │   │   ├── simulations.js # Interactive simulations
│   │   │   ├── documents.js   # Document decoder
│   │   │   ├── user.js        # User profile management
│   │   │   ├── community.js   # Community features
│   │   │   ├── courses.js     # Micro courses
│   │   │   └── roadmap.js     # Life stage roadmap
│   │   ├── models/            # MongoDB data models
│   │   │   ├── User.js        # User schema with methods
│   │   │   ├── Conversation.js # Chat history
│   │   │   ├── Simulation.js  # Simulation tracking
│   │   │   ├── Progress.js    # Milestone progress
│   │   │   ├── Achievement.js # Badge system
│   │   │   ├── Course.js      # Course completions
│   │   │   └── CommunityPost.js # Forum posts
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication
│   │   ├── config/
│   │   │   └── database.js    # MongoDB connection
│   │   └── server.js          # Express server setup
│   └── database/
│       └── schema.sql         # Database schema reference
└── docs/                      # Documentation
    ├── README.md              # This file
    ├── SECURITY_GUIDE.md      # Security best practices
    ├── FEATURES.md            # Detailed feature descriptions
    ├── PROJECT_SUMMARY.md     # Project overview
    └── PRESENTATION_SLIDES.md # Presentation materials
```

---

## 🎮 API Endpoints

### **Authentication**
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - User login with JWT token
- `POST /api/auth/signout` - Secure logout

### **AI Life Coach**
- `POST /api/coach/chat` - Send message to AI coach
- `GET /api/coach/conversations` - Get chat history
- `GET /api/coach/conversations/:id` - Get specific conversation

### **Interactive Simulations**
- `POST /api/simulations/start` - Initialize new simulation
- `POST /api/simulations/continue` - Progress through simulation
- `POST /api/simulations/complete` - Finish simulation with scoring
- `GET /api/simulations/history` - Get user's simulation history

### **Document Decoder**
- `POST /api/documents/decode` - Analyze uploaded document

### **User Management**
- `GET /api/user/profile/:userId` - Get user profile and progress
- `PUT /api/user/profile/:userId` - Update user information
- `POST /api/user/quiz/:userId` - Submit onboarding quiz results

### **Community & Learning**
- `GET /api/community/posts` - Get community discussions
- `POST /api/community/posts` - Create new discussion
- `GET /api/courses/available` - Get available micro courses
- `POST /api/courses/complete` - Mark course as completed
- `GET /api/roadmap/:userId` - Get personalized roadmap

---

## 🎯 Key Features Deep Dive

### **1. AI Life Coach**
**Technology**: NVIDIA Llama 3.1 405B model
**Capabilities**:
- Natural conversation with context memory
- Multi-topic expertise (career, finance, relationships, health)
- Personalized advice based on user profile and history
- Empathetic, non-judgmental responses
- Integration with user progress and achievements

**Example Interactions**:
- "How do I negotiate my first salary?"
- "What's the difference between HMO and PPO insurance?"
- "Should I pay off debt or save for emergency fund first?"
- "My landlord won't return my security deposit. What can I do?"

### **2. Interactive Simulations**
**Available Scenarios**:
- **Salary Negotiation**: Practice job offer discussions with AI hiring manager
- **Job Interview**: Prepare for interviews with realistic questions and feedback
- **Lease Negotiation**: Handle landlord conversations and contract terms
- **Budget Crisis**: Manage unexpected expenses and financial emergencies
- **Career Change**: Plan professional transitions and skill development

**Features**:
- Real-time AI roleplay with dynamic responses
- Performance scoring based on communication and decision-making
- Detailed feedback with improvement suggestions
- XP rewards and achievement unlocks
- Safe environment to practice and learn from mistakes

### **3. Document Decoder**
**Supported Documents**:
- Lease agreements and rental contracts
- Medical bills and insurance claims
- Job contracts and employment agreements
- Tax forms and financial documents
- Credit reports and loan agreements

**Analysis Features**:
- Plain-English explanations of complex legal language
- Red flag identification for concerning clauses
- Normal clause recognition for standard terms
- Financial implications breakdown
- Actionable next steps and recommendations

### **4. Gamification System**
**Elements**:
- **XP Points**: Earned for completing activities and learning
- **Levels**: Progress through experience-based advancement
- **Badges**: Achievement unlocks for specific accomplishments
- **LifeDecoder Score**: 0-100 assessment of life skills competency
- **Streaks**: Daily learning and engagement tracking

**Achievement Examples**:
- First Steps (complete onboarding quiz)
- Money Master (complete 5 financial simulations)
- Career Ready (ace job interview simulation)
- Negotiation Pro (successful salary negotiations)
- Life Master (achieve 90+ LifeDecoder score)

---

## 🎨 Design & User Experience

### **Design Principles**
- **Accessibility First**: WCAG compliant with proper contrast and navigation
- **Mobile Responsive**: Seamless experience across all devices
- **Dark Mode**: Automatic theme switching based on user preference
- **Clean Interface**: Minimal, focused design that reduces cognitive load
- **Consistent Branding**: Professional appearance that builds trust

### **User Journey**
1. **Landing**: Clear value proposition and problem statement
2. **Signup**: Quick account creation with email verification
3. **Onboarding Quiz**: 4-question assessment generating LifeDecoder score
4. **Dashboard**: Personalized hub with roadmap and feature access
5. **Feature Exploration**: Guided discovery of platform capabilities
6. **Skill Building**: Progressive learning through courses and simulations
7. **Community Engagement**: Peer support and expert guidance
8. **Achievement**: Recognition and celebration of progress

---

## 📊 Development Achievements

### **Built in 48 Hours**
- ✅ **Complete MVP**: 12 fully functional features
- ✅ **Full-Stack Application**: Frontend, backend, database, AI integration
- ✅ **Production Ready**: Proper error handling, security, deployment guides
- ✅ **Professional UI/UX**: 57 custom components, responsive design
- ✅ **Comprehensive Documentation**: Setup guides, API docs, security practices

### **Technical Highlights**
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized loading and rendering
- **Security**: JWT authentication, input validation, environment variables
- **Scalability**: Modular architecture supporting growth
- **Maintainability**: Clean code structure with proper separation of concerns

---

## 🔒 Security & Privacy

### **Data Protection**
- JWT-based authentication with secure token handling
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration for cross-origin security

### **Privacy Practices**
- Minimal data collection (only what's necessary)
- User control over personal information
- Secure AI conversation processing
- No selling of user data
- Transparent privacy policy

### **Environment Security**
- All sensitive data in environment variables
- No hardcoded secrets in source code
- Separate configurations for development and production
- Regular security updates and dependency management

---

## 🎯 Impact & Vision

### **Immediate Impact**
- **Individual**: Prevent costly financial mistakes and build confidence
- **Educational**: Fill critical gap in practical life skills education
- **Social**: Reduce inequality in access to essential knowledge
- **Economic**: Improve financial literacy and decision-making

### **Long-term Vision**
- **Scale**: Reach millions of young adults globally
- **Partnerships**: Integrate with universities, employers, and nonprofits
- **Expansion**: Add more languages, regions, and specialized content
- **Innovation**: Advance AI-powered personalized education

### **Success Metrics**
- User engagement and retention rates
- LifeDecoder score improvements over time
- Reduction in financial mistakes and improved outcomes
- Community growth and peer-to-peer learning
- Partnership adoption and institutional integration

---

## 📞 Contact & Support

### **Get in Touch**
- **Email**: [sharmaharshit1661@gmail.com](mailto:sharmaharshit1661@gmail.com)
- **LinkedIn**: [Harshit Sharma](https://www.linkedin.com/in/harshit-sharma-916218379/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with Love ❤️ for the 4.5 million young adults who turn 18 every year, ready to change the world but unprepared for adult life.**

**LifeDecoder - Your Life Manual for Everything School Never Taught You.** 🚀
