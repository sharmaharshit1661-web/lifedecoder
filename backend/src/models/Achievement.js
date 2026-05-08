import { localStorage } from '../config/database.js';

class Achievement {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.badgeName = data.badgeName;
    this.badgeType = data.badgeType;
    this.description = data.description;
    this.earnedAt = data.earnedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Static methods for database operations
  static async create(achievementData) {
    // Validate required fields
    if (!achievementData.userId || !achievementData.badgeName || !achievementData.badgeType) {
      throw new Error('UserId, badgeName, and badgeType are required');
    }

    // Validate badge type
    const validTypes = ['first-steps', 'money-master', 'career-ready', 'negotiation-pro', 'life-master', 'consistent-learner', 'level-up', 'chapter-complete'];
    if (!validTypes.includes(achievementData.badgeType)) {
      throw new Error('Invalid badge type');
    }

    // Check if achievement already exists
    const existingAchievement = localStorage.findOne('achievements', { 
      userId: achievementData.userId, 
      badgeType: achievementData.badgeType 
    });
    
    if (existingAchievement) {
      throw new Error('Achievement already earned by this user');
    }

    // Create achievement data
    const achievementToCreate = {
      userId: achievementData.userId,
      badgeName: achievementData.badgeName,
      badgeType: achievementData.badgeType,
      description: achievementData.description,
      earnedAt: achievementData.earnedAt || new Date().toISOString()
    };

    const newAchievement = localStorage.create('achievements', achievementToCreate);
    return new Achievement(newAchievement);
  }

  static async findById(id) {
    const achievementData = localStorage.findOne('achievements', { id });
    return achievementData ? new Achievement(achievementData) : null;
  }

  static async findByUserId(userId) {
    const achievements = localStorage.find('achievements', { userId });
    // Sort by earnedAt descending (most recent first)
    achievements.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
    return achievements.map(data => new Achievement(data));
  }

  static async findByBadgeType(badgeType) {
    const achievements = localStorage.find('achievements', { badgeType });
    return achievements.map(data => new Achievement(data));
  }

  static async findByUserAndBadge(userId, badgeType) {
    const achievementData = localStorage.findOne('achievements', { userId, badgeType });
    return achievementData ? new Achievement(achievementData) : null;
  }

  static async findAll() {
    const achievements = localStorage.find('achievements');
    return achievements.map(data => new Achievement(data));
  }

  // Instance methods
  async save() {
    const updated = localStorage.update('achievements', { id: this.id }, {
      userId: this.userId,
      badgeName: this.badgeName,
      badgeType: this.badgeType,
      description: this.description,
      earnedAt: this.earnedAt
    });
    
    if (updated) {
      Object.assign(this, updated);
    }
    return this;
  }

  async delete() {
    return localStorage.delete('achievements', { id: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      badgeName: this.badgeName,
      badgeType: this.badgeType,
      description: this.description,
      earnedAt: this.earnedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Achievement;
