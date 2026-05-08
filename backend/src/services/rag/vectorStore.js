import { vectorDB, localStorage } from '../../config/database.js';
import EmbeddingService from './embedChunks.js';

/**
 * Vector Store Service
 * Manages storage and retrieval of document embeddings
 */

export class VectorStore {
  /**
   * Store document with embeddings in vector database
   * @param {string} userId - User ID
   * @param {string} title - Document title
   * @param {string} content - Full document content
   * @param {string} documentType - Type of document
   * @param {Array} chunks - Document chunks with embeddings
   * @returns {Promise<string>} Document ID
   */
  static async storeDocument(userId, title, content, documentType, chunks) {
    try {
      console.log(`📚 Storing document: ${title} (${chunks.length} chunks)`);

      // Try PostgreSQL first, fallback to local storage
      try {
        const embeddings = chunks.map(chunk => chunk.embedding);
        const documentId = await vectorDB.storeDocument(
          userId, title, content, documentType, chunks, embeddings
        );
        
        console.log(`✅ Document stored in PostgreSQL with ID: ${documentId}`);
        return documentId.toString();
      } catch (pgError) {
        console.log('⚠️  PostgreSQL unavailable, using local storage');
        return await this.storeDocumentLocal(userId, title, content, documentType, chunks);
      }
    } catch (error) {
      console.error('Error storing document:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }

  /**
   * Store document in local JSON storage (fallback)
   * @param {string} userId - User ID
   * @param {string} title - Document title
   * @param {string} content - Full document content
   * @param {string} documentType - Type of document
   * @param {Array} chunks - Document chunks with embeddings
   * @returns {Promise<string>} Document ID
   */
  static async storeDocumentLocal(userId, title, content, documentType, chunks) {
    try {
      // Store document metadata
      const document = localStorage.create('documents', {
        userId,
        title,
        content,
        documentType,
        fileSize: content.length,
        chunkCount: chunks.length,
        uploadDate: new Date().toISOString()
      });

      // Store chunks with embeddings
      chunks.forEach((chunk, index) => {
        localStorage.create('documentChunks', {
          documentId: document.id,
          chunkIndex: index,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding: chunk.embedding,
          metadata: chunk.metadata || {}
        });
      });

      console.log(`✅ Document stored locally with ID: ${document.id}`);
      return document.id;
    } catch (error) {
      console.error('Error storing document locally:', error);
      throw error;
    }
  }

  /**
   * Perform similarity search across stored documents
   * @param {string} query - Search query
   * @param {string} userId - User ID (optional, for user-specific search)
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Minimum similarity threshold
   * @returns {Promise<Array>} Similar chunks with metadata
   */
  static async similaritySearch(query, userId = null, limit = 5, threshold = 0.1) {
    try {
      console.log(`🔍 Performing similarity search: "${query}"`);

      let queryEmbedding = null;
      
      // Try to generate query embedding if OpenAI is available
      try {
        queryEmbedding = await EmbeddingService.embedQuery(query);
      } catch (embeddingError) {
        console.log('⚠️  Embeddings not available, using text-based search');
      }

      // Try PostgreSQL first
      try {
        const results = await vectorDB.similaritySearch(queryEmbedding, limit, userId);
        
        // Filter by threshold and format results
        const filteredResults = results
          .filter(result => result.similarity >= threshold)
          .map(result => ({
            content: result.content,
            similarity: result.similarity,
            chunkIndex: result.chunk_index,
            documentTitle: result.title,
            documentType: result.document_type,
            source: 'postgresql'
          }));

        console.log(`✅ Found ${filteredResults.length} results in PostgreSQL`);
        return filteredResults;
      } catch (pgError) {
        console.log('⚠️  PostgreSQL unavailable, using local search');
        return await this.similaritySearchLocal(queryEmbedding, userId, limit, threshold);
      }
    } catch (error) {
      console.error('Error in similarity search:', error);
      
      // Final fallback: return recent documents for the user
      try {
        const userDocuments = localStorage.find('documents', { userId });
        const recentChunks = [];
        
        userDocuments.slice(0, 2).forEach(doc => {
          const chunks = localStorage.find('documentChunks', { documentId: doc.id });
          chunks.slice(0, Math.ceil(limit / 2)).forEach(chunk => {
            recentChunks.push({
              content: chunk.content,
              similarity: 0.3, // Low similarity for fallback
              chunkIndex: chunk.chunkIndex,
              documentTitle: doc.title,
              documentType: doc.documentType,
              source: 'fallback'
            });
          });
        });
        
        console.log(`⚠️  Using fallback: returning ${recentChunks.length} recent chunks`);
        return recentChunks.slice(0, limit);
      } catch (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Perform similarity search in local storage (fallback)
   * @param {Array} queryEmbedding - Query embedding vector (or null for text search)
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Minimum similarity threshold
   * @returns {Promise<Array>} Similar chunks with metadata
   */
  static async similaritySearchLocal(queryEmbedding, userId = null, limit = 5, threshold = 0.1) {
    try {
      // Get all document chunks
      let chunks = localStorage.find('documentChunks');
      
      // Filter by user if specified
      if (userId) {
        const userDocuments = localStorage.find('documents', { userId });
        const userDocIds = userDocuments.map(doc => doc.id);
        chunks = chunks.filter(chunk => userDocIds.includes(chunk.documentId));
      }

      let scoredChunks = [];

      if (queryEmbedding && Array.isArray(queryEmbedding)) {
        // Use vector similarity if embeddings available
        scoredChunks = chunks
          .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
          .map(chunk => {
            const similarity = EmbeddingService.calculateSimilarity(queryEmbedding, chunk.embedding);
            
            // Get document metadata
            const document = localStorage.findOne('documents', { id: chunk.documentId });
            
            return {
              content: chunk.content,
              similarity,
              chunkIndex: chunk.chunkIndex,
              documentTitle: document?.title || 'Unknown',
              documentType: document?.documentType || 'unknown',
              tokenCount: chunk.tokenCount,
              metadata: chunk.metadata,
              source: 'local'
            };
          })
          .filter(chunk => chunk.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
      } else {
        // Use text-based search as fallback
        console.log('⚠️  Using text-based search fallback');
        
        // For text search, we need the original query string
        // This is a limitation - we'll return all chunks with basic scoring
        scoredChunks = chunks.map(chunk => {
          const document = localStorage.findOne('documents', { id: chunk.documentId });
          
          return {
            content: chunk.content,
            similarity: 0.5, // Default similarity for text-based fallback
            chunkIndex: chunk.chunkIndex,
            documentTitle: document?.title || 'Unknown',
            documentType: document?.documentType || 'unknown',
            tokenCount: chunk.tokenCount,
            metadata: chunk.metadata,
            source: 'local-text'
          };
        }).slice(0, limit);
      }

      console.log(`✅ Found ${scoredChunks.length} results in local storage`);
      return scoredChunks;
    } catch (error) {
      console.error('Error in local similarity search:', error);
      return [];
    }
  }

  /**
   * Get user's documents
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's documents
   */
  static async getUserDocuments(userId) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        const result = await client.query(
          'SELECT id, title, document_type, upload_date, file_size FROM documents WHERE user_id = $1 ORDER BY upload_date DESC',
          [userId]
        );
        client.release();
        
        return result.rows.map(row => ({
          id: row.id.toString(),
          title: row.title,
          documentType: row.document_type,
          uploadDate: row.upload_date,
          fileSize: row.file_size
        }));
      } catch (pgError) {
        // Fallback to local storage
        const documents = localStorage.find('documents', { userId });
        return documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          documentType: doc.documentType,
          uploadDate: doc.uploadDate,
          fileSize: doc.fileSize
        }));
      }
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }

  /**
   * Delete document and its chunks
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async deleteDocument(documentId, userId) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        await client.query('BEGIN');
        
        // Verify ownership
        const docResult = await client.query(
          'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
          [documentId, userId]
        );
        
        if (docResult.rows.length === 0) {
          throw new Error('Document not found or access denied');
        }
        
        // Delete chunks (cascades automatically due to foreign key)
        await client.query('DELETE FROM documents WHERE id = $1', [documentId]);
        
        await client.query('COMMIT');
        client.release();
        
        console.log(`✅ Document ${documentId} deleted from PostgreSQL`);
        return true;
      } catch (pgError) {
        // Fallback to local storage
        const document = localStorage.findOne('documents', { id: documentId, userId });
        if (!document) {
          throw new Error('Document not found or access denied');
        }
        
        // Delete chunks
        const chunks = localStorage.find('documentChunks', { documentId });
        chunks.forEach(chunk => {
          localStorage.delete('documentChunks', { id: chunk.id });
        });
        
        // Delete document
        localStorage.delete('documents', { id: documentId });
        
        console.log(`✅ Document ${documentId} deleted from local storage`);
        return true;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Document statistics
   */
  static async getDocumentStats(userId = null) {
    try {
      // Try PostgreSQL first
      try {
        const client = await vectorDB.getClient();
        let query = 'SELECT COUNT(*) as doc_count, SUM(file_size) as total_size FROM documents';
        const params = [];
        
        if (userId) {
          query += ' WHERE user_id = $1';
          params.push(userId);
        }
        
        const result = await client.query(query, params);
        client.release();
        
        return {
          documentCount: parseInt(result.rows[0].doc_count),
          totalSize: parseInt(result.rows[0].total_size) || 0,
          source: 'postgresql'
        };
      } catch (pgError) {
        // Fallback to local storage
        let documents = localStorage.find('documents');
        if (userId) {
          documents = documents.filter(doc => doc.userId === userId);
        }
        
        const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
        
        return {
          documentCount: documents.length,
          totalSize,
          source: 'local'
        };
      }
    } catch (error) {
      console.error('Error getting document stats:', error);
      return { documentCount: 0, totalSize: 0, source: 'error' };
    }
  }
}

export default VectorStore;