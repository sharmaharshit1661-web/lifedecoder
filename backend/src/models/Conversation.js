import { localStorage } from '../config/database.js';

class Conversation {
  constructor(data) {
    this.id = data.id;
    this._id = data.id;
    this.userId = data.userId;
    this.type = data.type || 'coach';
    this.messages = data.messages || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async create(data) {
    const record = localStorage.create('conversations', {
      userId: data.userId ? data.userId.toString() : data.userId,
      type: data.type || 'coach',
      messages: data.messages || [],
    });
    return new Conversation(record);
  }

  static async findById(id) {
    const data = localStorage.findOne('conversations', { id });
    return data ? new Conversation(data) : null;
  }

  async save() {
    const updated = localStorage.update('conversations', { id: this.id }, {
      userId: this.userId,
      type: this.type,
      messages: this.messages,
    });
    if (updated) Object.assign(this, updated);
    this._id = this.id;
    return this;
  }
}

export default Conversation;
