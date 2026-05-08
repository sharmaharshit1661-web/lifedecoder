import { localStorage } from '../config/database.js';

class Progress {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.milestoneId = data.milestoneId;
    this.milestoneType = data.milestoneType;
    this.milestoneName = data.milestoneName;
    this.completed = data.completed || false;
    this.completedAt = data.completedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Static methods for database operations
  static async create(progressData) {
    // Validate required fields
    if (!progressData.userId || !progressData.milestoneId || !progressData.milestoneType || !progressData.milestoneName) {
      throw new Error('UserId, milestoneId, milestoneType, and milestoneName are required');
    }

    // Validate milestone type
    const validTypes = ['just-turned-18', 'first-job', 'moving-out', 'building-credit', 'career-growth', 'course', 'roadmap-level'];
    if (!validTypes.includes(progressData.milestoneType)) {
      throw new Error('Invalid milestone type');
    }

    // Check if progress already exists
    const existingProgress = localStorage.findOne('progress', { 
      userId: progressData.userId, 
      milestoneId: progressData.milestoneId 
    });
    
    if (existingProgress) {
      throw new Error('Progress for this milestone already exists for this user');
    }

    // Create progress data
    const progressToCreate = {
      userId: progressData.userId,
      milestoneId: progressData.milestoneId,
      milestoneType: progressData.milestoneType,
      milestoneName: progressData.milestoneName,
      completed: progressData.completed || false,
      completedAt: progressData.completedAt
    };

    const newProgress = localStorage.create('progress', progressToCreate);
    return new Progress(newProgress);
  }

  static async findById(id) {
    const progressData = localStorage.findOne('progress', { id });
    return progressData ? new Progress(progressData) : null;
  }

  static async findByUserId(userId) {
    const progressList = localStorage.find('progress', { userId });
    return progressList.map(data => new Progress(data));
  }

  static async findByUserAndMilestone(userId, milestoneId) {
    const progressData = localStorage.findOne('progress', { userId, milestoneId });
    return progressData ? new Progress(progressData) : null;
  }

  static async findByMilestoneType(milestoneType) {
    const progressList = localStorage.find('progress', { milestoneType });
    return progressList.map(data => new Progress(data));
  }

  static async findCompleted(userId) {
    const progressList = localStorage.find('progress', { userId, completed: true });
    return progressList.map(data => new Progress(data));
  }

  static async findAll() {
    const progressList = localStorage.find('progress');
    return progressList.map(data => new Progress(data));
  }

  // Instance methods
  async save() {
    const updated = localStorage.update('progress', { id: this.id }, {
      userId: this.userId,
      milestoneId: this.milestoneId,
      milestoneType: this.milestoneType,
      milestoneName: this.milestoneName,
      completed: this.completed,
      completedAt: this.completedAt
    });
    
    if (updated) {
      Object.assign(this, updated);
    }
    return this;
  }

  async markCompleted() {
    this.completed = true;
    this.completedAt = new Date().toISOString();
    return await this.save();
  }

  async delete() {
    return localStorage.delete('progress', { id: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      milestoneId: this.milestoneId,
      milestoneType: this.milestoneType,
      milestoneName: this.milestoneName,
      completed: this.completed,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Progress;
