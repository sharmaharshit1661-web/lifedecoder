import bcrypt from 'bcryptjs';
import { localStorage } from '../config/database.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.lifeDecoderScore = data.lifeDecoderScore || 0;
    this.quizCompleted = data.quizCompleted || false;
    this.quizAnswers = data.quizAnswers || {};
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Static methods for database operations
  static async create(userData) {
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error('Name, email, and password are required');
    }

    // Check if user already exists
    const existingUser = localStorage.findOne('users', { email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user data
    const userToCreate = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      age: userData.age || null,
      lifeDecoderScore: userData.lifeDecoderScore || 0,
      quizCompleted: userData.quizCompleted || false,
      quizAnswers: userData.quizAnswers || {},
      level: userData.level || 1,
      xp: userData.xp || 0
    };

    const newUser = localStorage.create('users', userToCreate);
    return new User(newUser);
  }

  static async findById(id) {
    const userData = localStorage.findOne('users', { id });
    return userData ? new User(userData) : null;
  }

  static async findByEmail(email) {
    const userData = localStorage.findOne('users', { email: email.toLowerCase() });
    return userData ? new User(userData) : null;
  }

  static async findAll() {
    const users = localStorage.find('users');
    return users.map(userData => new User(userData));
  }

  // Instance methods
  async save() {
    const updated = localStorage.update('users', { id: this.id }, {
      name: this.name,
      email: this.email,
      password: this.password,
      lifeDecoderScore: this.lifeDecoderScore,
      quizCompleted: this.quizCompleted,
      quizAnswers: this.quizAnswers,
      level: this.level,
      xp: this.xp
    });
    
    if (updated) {
      Object.assign(this, updated);
    }
    return this;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  calculateLevel() {
    this.level = Math.floor(this.xp / 500) + 1;
    return this.level;
  }

  async delete() {
    return localStorage.delete('users', { id: this.id });
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export default User;
