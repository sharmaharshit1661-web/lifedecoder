#!/usr/bin/env node

/**
 * AdultIQ Database Setup Script
 * Sets up PostgreSQL with pgvector extension for RAG functionality
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Setting up AdultIQ Database...\n');

  // Check if PostgreSQL configuration is available
  if (!process.env.POSTGRES_HOST) {
    console.log('⚠️  PostgreSQL configuration not found in environment variables.');
    console.log('📝 The application will use local JSON storage as fallback.');
    console.log('✅ Setup complete - local storage ready!\n');
    return;
  }

  try {
    // Connect to PostgreSQL
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });

    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create pgvector extension
    console.log('📦 Installing pgvector extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension installed');
    } catch (error) {
      console.log('⚠️  Could not install pgvector extension:', error.message);
      console.log('📝 Make sure pgvector is installed on your PostgreSQL server');
    }

    // Create tables
    console.log('📋 Creating database tables...');

    // Documents table
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
    console.log('✅ Documents table created');

    // Document chunks table
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
    console.log('✅ Document chunks table created');

    // User profiles table
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
        adult_iq_score INTEGER DEFAULT 0,
        profile_data JSONB DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User profiles table created');

    // Activities table
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
    console.log('✅ Activities table created');

    // Recommendations table
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
    console.log('✅ Recommendations table created');

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
        ON document_chunks USING ivfflat (embedding vector_cosine_ops)
      `);
      console.log('✅ Vector similarity index created');
    } catch (error) {
      console.log('⚠️  Could not create vector index:', error.message);
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp 
      ON activities(user_id, timestamp DESC)
    `);
    console.log('✅ Activities index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_type 
      ON documents(user_id, document_type)
    `);
    console.log('✅ Documents index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
      ON user_profiles(user_id)
    `);
    console.log('✅ User profiles index created');

    // Insert sample data (optional)
    console.log('📝 Checking for sample data...');
    
    const sampleUserCheck = await client.query(
      'SELECT COUNT(*) FROM user_profiles WHERE user_id = $1',
      ['demo_user']
    );

    if (parseInt(sampleUserCheck.rows[0].count) === 0) {
      console.log('📊 Creating demo user profile...');
      await client.query(`
        INSERT INTO user_profiles (
          user_id, age, employment_status, living_situation, 
          knowledge_level, adult_iq_score, profile_data
        ) VALUES (
          'demo_user', 19, 'student', 'with_parents', 
          'beginner', 45, '{"activityCount": 0, "completedModules": []}'
        )
      `);
      console.log('✅ Demo user profile created');
    }

    await client.end();
    console.log('🔌 Database connection closed');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Your AdultIQ platform is ready with:');
    console.log('   - PostgreSQL database with pgvector');
    console.log('   - RAG-enabled document storage');
    console.log('   - User personalization tables');
    console.log('   - Behavior tracking system');
    console.log('   - Recommendation engine storage');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📝 Fallback: The application will use local JSON storage.');
    console.log('✅ You can still run AdultIQ without PostgreSQL.');
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export default setupDatabase;