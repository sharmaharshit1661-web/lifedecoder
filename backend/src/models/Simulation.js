import { localStorage } from '../config/database.js';

class Simulation {
  constructor(data) {
    this.id = data.id;
    this._id = data.id;
    this.userId = data.userId;
    this.simulationType = data.simulationType;
    this.score = data.score;
    this.feedback = data.feedback;
    this.conversationHistory = data.conversationHistory || [];
    this.xpEarned = data.xpEarned || 0;
    this.completed = data.completed || false;
    this.completedAt = data.completedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async create(data) {
    if (!data.userId || !data.simulationType) {
      throw new Error('userId and simulationType are required');
    }
    const record = localStorage.create('simulations', {
      userId: data.userId,
      simulationType: data.simulationType,
      conversationHistory: data.conversationHistory || [],
      score: data.score || null,
      feedback: data.feedback || null,
      xpEarned: data.xpEarned || 0,
      completed: data.completed || false,
      completedAt: data.completedAt || null,
    });
    return new Simulation(record);
  }

  static async findById(id) {
    const data = localStorage.findOne('simulations', { id });
    return data ? new Simulation(data) : null;
  }

  static async findOne(query) {
    const q = { ...query };
    if (q._id) { q.id = q._id; delete q._id; }
    if (q.userId) q.userId = q.userId.toString();
    const data = localStorage.findOne('simulations', q);
    return data ? new Simulation(data) : null;
  }

  // Returns a thenable chain: supports .sort().limit() AND direct await
  static find(query) {
    const q = { ...query };
    if (q._id) { q.id = q._id; delete q._id; }
    if (q.userId) q.userId = q.userId.toString();

    let results = localStorage.find('simulations', q);

    const chain = {
      sort(sortObj) {
        const [key, dir] = Object.entries(sortObj)[0];
        results = [...results].sort((a, b) =>
          dir === -1
            ? new Date(b[key] || 0) - new Date(a[key] || 0)
            : new Date(a[key] || 0) - new Date(b[key] || 0)
        );
        return chain;
      },
      limit(n) {
        results = results.slice(0, n);
        return chain;
      },
      // Makes `await Simulation.find(...)` work directly
      then(resolve, reject) {
        try {
          resolve(results.map(d => new Simulation(d)));
        } catch (e) {
          reject(e);
        }
      },
    };

    return chain;
  }

  async save() {
    const updated = localStorage.update('simulations', { id: this.id }, {
      userId: this.userId,
      simulationType: this.simulationType,
      conversationHistory: this.conversationHistory,
      score: this.score,
      feedback: this.feedback,
      xpEarned: this.xpEarned,
      completed: this.completed,
      completedAt: this.completedAt,
    });
    if (updated) Object.assign(this, updated);
    this._id = this.id;
    return this;
  }
}

export default Simulation;
