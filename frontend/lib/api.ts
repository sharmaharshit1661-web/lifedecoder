// API client for LifeDecoder backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('currentUser');
  if (!user) return null;
  const parsed = JSON.parse(user);
  return parsed.token;
};

// Helper for authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('🔗 API Request:', `${API_URL}${url}`);
  console.log('🔑 Has token:', !!token);

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('❌ API Error:', error);
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data.success ? 'Success' : 'Response received');
    return data;
  } catch (error) {
    console.error('🚨 Network Error:', error);
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to server at ${API_URL}. Please check if the backend is running.`);
    }
    throw error;
  }
};

export const api = {
  // Auth
  async signup(email: string, password: string, name: string) {
    const data = await authFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    // Store user and token
    if (data.success && data.token) {
      localStorage.setItem('currentUser', JSON.stringify({
        ...data.user,
        token: data.token,
      }));
    }
    
    return data;
  },

  async signin(email: string, password: string) {
    const data = await authFetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store user and token
    if (data.success && data.token) {
      localStorage.setItem('currentUser', JSON.stringify({
        ...data.user,
        token: data.token,
      }));
    }
    
    return data;
  },

  async getCurrentUser() {
    return authFetch('/api/auth/me');
  },

  // Coach
  async sendCoachMessage(message: string, conversationId?: string) {
    console.log('🚀 Sending coach message to:', `${API_URL}/api/coach/chat`);
    console.log('📝 Message:', message);
    return authFetch('/api/coach/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },

  async getConversations() {
    return authFetch('/api/coach/conversations');
  },

  async getConversation(id: string) {
    return authFetch(`/api/coach/conversations/${id}`);
  },

  // Simulations
  async startSimulation(simulationType: string, userContext: any = {}) {
    return authFetch('/api/simulations/start', {
      method: 'POST',
      body: JSON.stringify({ simulationType, userContext }),
    });
  },

  async continueSimulation(simulationId: string, userMessage: string) {
    return authFetch('/api/simulations/continue', {
      method: 'POST',
      body: JSON.stringify({ simulationId, userMessage }),
    });
  },

  async completeSimulation(simulationId: string, score: number, feedback: string) {
    return authFetch('/api/simulations/complete', {
      method: 'POST',
      body: JSON.stringify({ simulationId, score, feedback }),
    });
  },

  async getSimulationHistory() {
    return authFetch('/api/simulations/history');
  },

  // Documents
  async decodeDocument(documentText: string, documentType: string) {
    return authFetch('/api/documents/decode', {
      method: 'POST',
      body: JSON.stringify({ documentText, documentType }),
    });
  },

  // User
  async getUserProfile() {
    return authFetch('/api/user/profile');
  },

  async updateUserProfile(updates: any) {
    return authFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async submitQuiz(answers: any, score: number) {
    return authFetch('/api/user/quiz', {
      method: 'POST',
      body: JSON.stringify({ answers, score }),
    });
  },

  async getProgress() {
    return authFetch('/api/user/progress');
  },

  async updateProgress(milestoneId: string, milestoneType: string, milestoneName: string, completed: boolean) {
    return authFetch('/api/user/progress', {
      method: 'POST',
      body: JSON.stringify({ milestoneId, milestoneType, milestoneName, completed }),
    });
  },

  async getAchievements() {
    return authFetch('/api/user/achievements');
  },

  // Courses
  async getCourses() {
    return authFetch('/api/courses');
  },

  async getCourseProgress() {
    return authFetch('/api/courses/progress');
  },

  async completeCourse(courseId: string) {
    return authFetch('/api/courses/complete', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  // Roadmap
  async getRoadmapProgress() {
    return authFetch('/api/roadmap/progress');
  },

  async completeRoadmapLevel(levelId: string, levelTitle: string, xpReward: number, chapterTitle: string) {
    return authFetch('/api/roadmap/complete-level', {
      method: 'POST',
      body: JSON.stringify({ levelId, levelTitle, xpReward, chapterTitle }),
    });
  },

  async getRoadmapSteps(levelId: string) {
    return authFetch(`/api/roadmap/steps/${levelId}`);
  },

  async getUserStats() {
    return authFetch('/api/user/stats');
  },

  async getRecommendations() {
    return authFetch('/api/user/recommendations');
  },

  // Community
  async getPosts(category?: string, limit = 20, skip = 0) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    
    return authFetch(`/api/community/posts?${params}`);
  },

  async getPost(id: string) {
    return authFetch(`/api/community/posts/${id}`);
  },

  async createPost(title: string, content: string, category: string, anonymous = false) {
    return authFetch('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category, anonymous }),
    });
  },

  async updatePost(id: string, title: string, content: string) {
    return authFetch(`/api/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
  },

  async deletePost(id: string) {
    return authFetch(`/api/community/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async likePost(id: string) {
    return authFetch(`/api/community/posts/${id}/like`, {
      method: 'POST',
    });
  },

  async addReply(postId: string, content: string) {
    return authFetch(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async likeReply(postId: string, replyId: string) {
    return authFetch(`/api/community/posts/${postId}/replies/${replyId}/like`, {
      method: 'POST',
    });
  },
};
