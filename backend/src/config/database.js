import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

// Local storage configuration (fallback)
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

// PostgreSQL connection for vector operations
let pgPool = null;

const initializePostgreSQL = async () => {
  if (process.env.POSTGRES_HOST) {
    try {
      pgPool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
      });

      // Test connection
      const client = await pgPool.connect();

      // Create pgvector extension if not exists
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create tables for RAG
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          document_type VARCHAR(100) NOT NULL,
          file_size INTEGER,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id SERIAL PRIMARY KEY,
          document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          token_count INTEGER,
          embedding vector(1536),
          metadata JSONB DEFAULT '{}'
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) UNIQUE NOT NULL,
          age INTEGER,
          income INTEGER,
          employment_status VARCHAR(100),
          living_situation VARCHAR(100),
          financial_goals TEXT[],
          knowledge_level VARCHAR(50) DEFAULT 'beginner',
          risk_tolerance VARCHAR(50) DEFAULT 'moderate',
          life_decoder_score INTEGER DEFAULT 0,
          profile_data JSONB DEFAULT '{}',
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          activity_type VARCHAR(100) NOT NULL,
          activity_data JSONB NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          score FLOAT,
          metadata JSONB DEFAULT '{}'
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS recommendations (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          recommendation_type VARCHAR(100) NOT NULL,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          priority INTEGER DEFAULT 1,
          reasoning TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
        ON document_chunks USING ivfflat (embedding vector_cosine_ops)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp
        ON activities(user_id, timestamp DESC)
      `);

      client.release();
      console.log('✅ PostgreSQL Connected with pgvector extension');
      return true;
    } catch (error) {
      console.log('⚠️  PostgreSQL not available, using local storage:', error.message);
      return false;
    }
  }
  return false;
};

// Ensure data directory exists for local storage
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory for local storage');
  }
};

// Initialize empty JSON files if they don't exist
const initializeCollections = () => {
  Object.values(COLLECTIONS).forEach(filename => {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify([], null, 2));
      console.log(`📄 Initialized ${filename}`);
    }
  });
};

// Local storage operations (enhanced)
export const localStorage = {
  // Read data from a collection
  read: (collection) => {
    try {
      const filepath = path.join(DATA_DIR, COLLECTIONS[collection]);
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error.message);
      return [];
    }
  },

  // Write data to a collection
  write: (collection, data) => {
    try {
      const filepath = path.join(DATA_DIR, COLLECTIONS[collection]);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error.message);
      return false;
    }
  },

  // Add item to collection
  create: (collection, item) => {
    const data = localStorage.read(collection);
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    data.push(newItem);
    localStorage.write(collection, data);
    return newItem;
  },

  // Find items in collection
  find: (collection, query = {}) => {
    const data = localStorage.read(collection);
    if (Object.keys(query).length === 0) return data;

    return data.filter(item => {
      return Object.keys(query).every(key => {
        if (typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options || '');
          return regex.test(item[key]);
        }
        return item[key] === query[key];
      });
    });
  },

  // Find one item
  findOne: (collection, query) => {
    const results = localStorage.find(collection, query);
    return results.length > 0 ? results[0] : null;
  },

  // Update item
  update: (collection, query, update) => {
    const data = localStorage.read(collection);
    const index = data.findIndex(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...update,
        updatedAt: new Date().toISOString()
      };
      localStorage.write(collection, data);
      return data[index];
    }
    return null;
  },

  // Delete item
  delete: (collection, query) => {
    const data = localStorage.read(collection);
    const filteredData = data.filter(item => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });
    localStorage.write(collection, filteredData);
    return data.length - filteredData.length;
  }
};

// Utility for local cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// PostgreSQL operations for vector data
export const vectorDB = {
  // Get PostgreSQL client
  getClient: async () => {
    if (!pgPool) return null; // Used as indicator for local mode
    return await pgPool.connect();
  },

  // Store document with chunks and embeddings
  storeDocument: async (userId, title, content, documentType, chunks, embeddings) => {
    if (!pgPool) {
      // Local fallback
      const doc = localStorage.create('documents', {
        user_id: userId,
        title,
        content,
        document_type: documentType,
        file_size: content.length,
      });
      for (let i = 0; i < chunks.length; i++) {
        localStorage.create('documentChunks', {
          document_id: doc.id,
          chunk_index: i,
          content: chunks[i].content,
          token_count: chunks[i].tokenCount,
          embedding: embeddings[i]
        });
      }
      return doc.id;
    }

    const client = await vectorDB.getClient();
    try {
      await client.query('BEGIN');

      // Insert document
      const docResult = await client.query(
        'INSERT INTO documents (user_id, title, content, document_type, file_size) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, title, content, documentType, content.length]
      );

      const documentId = docResult.rows[0].id;

      // Insert chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          'INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding) VALUES ($1, $2, $3, $4, $5)',
          [documentId, i, chunks[i].content, chunks[i].tokenCount, JSON.stringify(embeddings[i])]
        );
      }

      await client.query('COMMIT');
      return documentId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Similarity search
  similaritySearch: async (queryEmbedding, limit = 5, userId = null) => {
    if (!pgPool) {
      // Local fallback
      const allChunks = localStorage.read('documentChunks');
      const allDocs = localStorage.read('documents');
      const results = [];

      for (const chunk of allChunks) {
        if (!chunk.embedding) continue;
        const doc = allDocs.find(d => d.id === chunk.document_id);
        if (!doc) continue;
        if (userId && doc.user_id !== userId) continue;

        const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
        results.push({
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          title: doc.title,
          document_type: doc.document_type,
          similarity: sim
        });
      }

      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, limit);
    }

    const client = await vectorDB.getClient();
    try {
      let query = `
        SELECT dc.content, dc.chunk_index, d.title, d.document_type,
               1 - (dc.embedding <=> $1::vector) as similarity
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
      `;

      const params = [JSON.stringify(queryEmbedding)];

      if (userId) {
        query += ' WHERE d.user_id = $2';
        params.push(userId);
      }

      query += ' ORDER BY similarity DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
};

const connectDB = async () => {
  try {
    // Initialize PostgreSQL for vector operations
    const pgConnected = await initializePostgreSQL();

    // Always initialize local storage as fallback
    ensureDataDir();
    initializeCollections();

    if (pgConnected) {
      console.log('✅ Hybrid Storage Connected: PostgreSQL + Local JSON');
      console.log(`📁 Vector DB: PostgreSQL with pgvector`);
    } else {
      console.log('✅ Local Storage Connected: JSON file-based storage');
    }
    console.log(`📁 Data directory: ${DATA_DIR}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export { pgPool };
export default connectDB;
