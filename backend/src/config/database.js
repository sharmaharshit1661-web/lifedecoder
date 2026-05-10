import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// ── Local JSON fallback (used only if MongoDB is unavailable) ─────────────────
const DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTIONS = {
  users: 'users.json',
  courses: 'courses.json',
  progress: 'progress.json',
  achievements: 'achievements.json',
  conversations: 'conversations.json',
  communityPosts: 'communityPosts.json',
  simulations: 'simulations.json',
  documents: 'documents.json',
  documentChunks: 'documentChunks.json',
  userProfiles: 'userProfiles.json',
  activities: 'activities.json',
  recommendations: 'recommendations.json',
  behaviorEvents: 'behaviorEvents.json',
  behaviorTriggers: 'behaviorTriggers.json',
  recommendationCache: 'recommendationCache.json'
};

let mongoConnected = false;

// ── MongoDB collections (lazy-loaded after connection) ────────────────────────
let mongoCollections = {};

export const getMongoCollection = (name) => mongoCollections[name] || null;
export const isMongoConnected = () => mongoConnected;

// ── MongoDB generic CRUD helpers (mirrors localStorage API) ──────────────────
const mongoDB = {
  read: async (collection) => {
    try {
      const col = mongoose.connection.db.collection(collection);
      return await col.find({}).toArray();
    } catch { return []; }
  },
  create: async (collection, item) => {
    const col = mongoose.connection.db.collection(collection);
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    await col.insertOne({ ...newItem });
    return newItem;
  },
  find: async (collection, query = {}) => {
    const col = mongoose.connection.db.collection(collection);
    return await col.find(query).toArray();
  },
  findOne: async (collection, query) => {
    const col = mongoose.connection.db.collection(collection);
    return await col.findOne(query);
  },
  update: async (collection, query, update) => {
    const col = mongoose.connection.db.collection(collection);
    const updatedDoc = { ...update, updatedAt: new Date().toISOString() };
    await col.updateOne(query, { $set: updatedDoc });
    return await col.findOne(query);
  },
  delete: async (collection, query) => {
    const col = mongoose.connection.db.collection(collection);
    const result = await col.deleteMany(query);
    return result.deletedCount;
  },
  write: async (collection, data) => {
    const col = mongoose.connection.db.collection(collection);
    await col.deleteMany({});
    if (data.length > 0) await col.insertMany(data);
    return true;
  }
};

// ── Local JSON storage (fallback) ─────────────────────────────────────────────
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const initializeCollections = () => {
  Object.values(COLLECTIONS).forEach(filename => {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify([], null, 2));
    }
  });
};

const localJSON = {
  read: (collection) => {
    try {
      const data = fs.readFileSync(path.join(DATA_DIR, COLLECTIONS[collection]), 'utf8');
      return JSON.parse(data);
    } catch { return []; }
  },
  write: (collection, data) => {
    try {
      fs.writeFileSync(path.join(DATA_DIR, COLLECTIONS[collection]), JSON.stringify(data, null, 2));
      return true;
    } catch { return false; }
  },
  create: (collection, item) => {
    const data = localJSON.read(collection);
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    data.push(newItem);
    localJSON.write(collection, data);
    return newItem;
  },
  find: (collection, query = {}) => {
    const data = localJSON.read(collection);
    if (Object.keys(query).length === 0) return data;
    return data.filter(item =>
      Object.keys(query).every(key => {
        if (typeof query[key] === 'object' && query[key].$regex) {
          return new RegExp(query[key].$regex, query[key].$options || '').test(item[key]);
        }
        return item[key] === query[key];
      })
    );
  },
  findOne: (collection, query) => {
    const results = localJSON.find(collection, query);
    return results.length > 0 ? results[0] : null;
  },
  update: (collection, query, update) => {
    const data = localJSON.read(collection);
    const index = data.findIndex(item =>
      Object.keys(query).every(key => item[key] === query[key])
    );
    if (index !== -1) {
      data[index] = { ...data[index], ...update, updatedAt: new Date().toISOString() };
      localJSON.write(collection, data);
      return data[index];
    }
    return null;
  },
  delete: (collection, query) => {
    const data = localJSON.read(collection);
    const filtered = data.filter(item =>
      !Object.keys(query).every(key => item[key] === query[key])
    );
    localJSON.write(collection, filtered);
    return data.length - filtered.length;
  }
};

// ── Unified localStorage export (auto-routes to MongoDB or JSON) ──────────────
// All methods are async-safe: MongoDB returns Promises, JSON returns values.
// Callers that already await will work with both.
export const localStorage = {
  read:    (col)         => mongoConnected ? mongoDB.read(col)            : localJSON.read(col),
  write:   (col, data)   => mongoConnected ? mongoDB.write(col, data)     : localJSON.write(col, data),
  create:  (col, item)   => mongoConnected ? mongoDB.create(col, item)    : localJSON.create(col, item),
  find:    (col, q = {}) => mongoConnected ? mongoDB.find(col, q)         : localJSON.find(col, q),
  findOne: (col, q)      => mongoConnected ? mongoDB.findOne(col, q)      : localJSON.findOne(col, q),
  update:  (col, q, upd) => mongoConnected ? mongoDB.update(col, q, upd)  : localJSON.update(col, q, upd),
  delete:  (col, q)      => mongoConnected ? mongoDB.delete(col, q)       : localJSON.delete(col, q),
};

// ── vectorDB stub (PostgreSQL removed — kept for import compatibility) ─────────
export const vectorDB = {
  getClient: async () => null,
  storeDocument: async (userId, title, content, documentType, chunks, embeddings) => {
    const doc = await localStorage.create('documents', {
      user_id: userId, title, content,
      document_type: documentType, file_size: content.length,
    });
    for (let i = 0; i < chunks.length; i++) {
      await localStorage.create('documentChunks', {
        document_id: doc.id, chunk_index: i,
        content: chunks[i].content, token_count: chunks[i].tokenCount,
        embedding: embeddings[i]
      });
    }
    return doc.id;
  },
  similaritySearch: async (queryEmbedding, limit = 5, userId = null) => {
    const allChunks = await localStorage.read('documentChunks');
    const allDocs   = await localStorage.read('documents');
    const results   = [];

    for (const chunk of allChunks) {
      if (!chunk.embedding) continue;
      const doc = allDocs.find(d => d.id === chunk.document_id);
      if (!doc || (userId && doc.user_id !== userId)) continue;
      results.push({
        content: chunk.content, chunk_index: chunk.chunk_index,
        title: doc.title, document_type: doc.document_type,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
      });
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }
};

function cosineSimilarity(vecA, vecB) {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    nA  += vecA[i] * vecA[i];
    nB  += vecB[i] * vecB[i];
  }
  return (nA === 0 || nB === 0) ? 0 : dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

// ── Main connectDB ─────────────────────────────────────────────────────────────
const connectDB = async () => {
  // Always prepare local JSON as fallback
  ensureDataDir();
  initializeCollections();

  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      mongoConnected = true;
      console.log('✅ MongoDB Connected:', mongoose.connection.host);
    } catch (error) {
      console.warn('⚠️  MongoDB connection failed, falling back to local JSON:', error.message);
      mongoConnected = false;
    }
  } else {
    console.log('ℹ️  MONGODB_URI not set — using local JSON storage');
  }

  if (!mongoConnected) {
    console.log('✅ Local JSON storage ready');
    console.log(`📁 Data directory: ${DATA_DIR}`);
  }
};

export const pgPool = null; // kept for import compatibility
export default connectDB;
