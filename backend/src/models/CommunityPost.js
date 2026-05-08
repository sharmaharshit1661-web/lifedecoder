import { localStorage } from '../config/database.js';

class CommunityPost {
  constructor(data) {
    this.id = data.id;
    this._id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.content = data.content;
    this.category = data.category;
    this.anonymous = data.anonymous || false;
    this.likes = data.likes || 0;
    this.likedBy = data.likedBy || [];
    this.replies = data.replies || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async create(data) {
    if (!data.userId || !data.title || !data.content || !data.category) {
      throw new Error('userId, title, content, and category are required');
    }
    const record = localStorage.create('communityPosts', {
      userId: data.userId.toString(),
      title: data.title,
      content: data.content,
      category: data.category,
      anonymous: data.anonymous || false,
      likes: 0,
      likedBy: [],
      replies: [],
    });
    return new CommunityPost(record);
  }

  static async findById(id) {
    const data = localStorage.findOne('communityPosts', { id });
    return data ? new CommunityPost(data) : null;
  }

  static async findOne(query) {
    const normalizedQuery = { ...query };
    if (normalizedQuery._id) { normalizedQuery.id = normalizedQuery._id; delete normalizedQuery._id; }
    if (normalizedQuery.userId) normalizedQuery.userId = normalizedQuery.userId.toString();
    const data = localStorage.findOne('communityPosts', normalizedQuery);
    return data ? new CommunityPost(data) : null;
  }

  static async findOneAndDelete(query) {
    const post = await CommunityPost.findOne(query);
    if (!post) return null;
    localStorage.delete('communityPosts', { id: post.id });
    return post;
  }

  // Returns array with chainable .populate() and .sort() (no-ops for local storage)
  static find(query = {}) {
    const normalizedQuery = { ...query };
    if (normalizedQuery.userId) normalizedQuery.userId = normalizedQuery.userId.toString();
    let results = localStorage.find('communityPosts', normalizedQuery);

    const chain = {
      _results: results,
      populate: function() { return this; },
      sort: function(sortObj) {
        const [key, dir] = Object.entries(sortObj)[0];
        this._results = this._results.sort((a, b) =>
          dir === -1 ? new Date(b[key]) - new Date(a[key]) : new Date(a[key]) - new Date(b[key])
        );
        return this;
      },
      limit: function(n) { this._results = this._results.slice(0, n); return this; },
      skip: function(n) { this._results = this._results.slice(n); return this; },
      then: function(resolve) {
        resolve(this._results.map(d => new CommunityPost(d)));
      }
    };
    return chain;
  }

  async save() {
    const updated = localStorage.update('communityPosts', { id: this.id }, {
      userId: this.userId,
      title: this.title,
      content: this.content,
      category: this.category,
      anonymous: this.anonymous,
      likes: this.likes,
      likedBy: this.likedBy,
      replies: this.replies,
    });
    if (updated) Object.assign(this, updated);
    this._id = this.id;
    return this;
  }
}

export default CommunityPost;
