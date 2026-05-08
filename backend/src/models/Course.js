import { localStorage } from '../config/database.js';

class CourseCompletion {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.courseId = data.courseId;
    this.courseName = data.courseName;
    this.completedAt = data.completedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Static methods for database operations
  static async create(completionData) {
    // Validate required fields
    if (!completionData.userId || !completionData.courseId || !completionData.courseName) {
      throw new Error('UserId, courseId, and courseName are required');
    }

    // Check if completion already exists
    const existingCompletion = localStorage.findOne('courses', { 
      userId: completionData.userId, 
      courseId: completionData.courseId 
    });
    
    if (existingCompletion) {
      throw new Error('Course already completed by this user');
    }

    // Create completion data
    const completionToCreate = {
      userId: completionData.userId,
      courseId: completionData.courseId,
      courseName: completionData.courseName,
      completedAt: completionData.completedAt || new Date().toISOString()
    };

    const newCompletion = localStorage.create('courses', completionToCreate);
    return new CourseCompletion(newCompletion);
  }

  static async findById(id) {
    const completionData = localStorage.findOne('courses', { id });
    return completionData ? new CourseCompletion(completionData) : null;
  }

  static async findByUserId(userId) {
    const completions = localStorage.find('courses', { userId });
    return completions.map(data => new CourseCompletion(data));
  }

  static async findByCourseId(courseId) {
    const completions = localStorage.find('courses', { courseId });
    return completions.map(data => new CourseCompletion(data));
  }

  static async findByUserAndCourse(userId, courseId) {
    const completionData = localStorage.findOne('courses', { userId, courseId });
    return completionData ? new CourseCompletion(completionData) : null;
  }

  static async findAll() {
    const completions = localStorage.find('courses');
    return completions.map(data => new CourseCompletion(data));
  }

  // Instance methods
  async save() {
    const updated = localStorage.update('courses', { id: this.id }, {
      userId: this.userId,
      courseId: this.courseId,
      courseName: this.courseName,
      completedAt: this.completedAt
    });
    
    if (updated) {
      Object.assign(this, updated);
    }
    return this;
  }

  async delete() {
    return localStorage.delete('courses', { id: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      courseName: this.courseName,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default CourseCompletion;
