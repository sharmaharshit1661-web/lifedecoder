import OpenAI from 'openai';

// Lazy-init so dotenv is loaded before we check env vars
let openai = null;
let _embeddingInit = false;

function initEmbedding() {
  if (_embeddingInit) return;
  _embeddingInit = true;
  const key = process.env.OPENAI_API_KEY;
  if (key && key !== 'your-openai-api-key-here') {
    openai = new OpenAI({ apiKey: key });
    console.log('✅ OpenAI embeddings client initialised');
  } else {
    console.log('⚠️  OpenAI embeddings not available — using text-based search fallback');
  }
}

// NVIDIA embedding via their NIM endpoint (free with NVIDIA API key)
async function generateNvidiaEmbedding(text) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey === 'your_nvidia_api_key_here') return null;

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: text.trim(),
        model: 'nvidia/nv-embedqa-e5-v5',
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'END'
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const BATCH_SIZE = 100; // Process embeddings in batches

export class EmbeddingService {
  /**
   * Generate embeddings for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  static async generateEmbedding(text) {
    initEmbedding();

    if (!text || text.trim().length === 0) throw new Error('Text cannot be empty');

    // Try NVIDIA embeddings first (free with NVIDIA API key)
    const nvidiaEmbedding = await generateNvidiaEmbedding(text);
    if (nvidiaEmbedding) {
      return nvidiaEmbedding;
    }

    // Fallback to OpenAI embeddings
    if (!openai) {
      throw new Error('OpenAI API key not configured for embeddings');
    }

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   * @param {Array} texts - Array of texts to embed
   * @returns {Promise<Array>} Array of embedding vectors
   */
  static async generateBatchEmbeddings(texts) {
    initEmbedding();
    if (!texts || texts.length === 0) return [];
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) return [];

    const embeddings = [];
    for (let i = 0; i < validTexts.length; i += BATCH_SIZE) {
      const batch = validTexts.slice(i, i + BATCH_SIZE);
      for (const text of batch) {
        // Try NVIDIA first
        const nv = await generateNvidiaEmbedding(text);
        if (nv) { embeddings.push(nv); continue; }
        // Fallback OpenAI
        if (openai) {
          const r = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text.trim() });
          embeddings.push(r.data[0].embedding);
        } else {
          throw new Error('No embedding provider available');
        }
      }
      if (i + BATCH_SIZE < validTexts.length) await new Promise(r => setTimeout(r, 100));
    }
    return embeddings;
  }

  /**
   * Generate embeddings for document chunks (fallback without OpenAI)
   * @param {Array} chunks - Document chunks with content
   * @returns {Promise<Array>} Chunks with mock embeddings or without embeddings
   */
  static async embedChunks(chunks) {
    initEmbedding();
    try {
      if (!chunks || chunks.length === 0) {
        return [];
      }

      console.log(`🔄 Processing ${chunks.length} chunks...`);

      // If OpenAI is available, generate real embeddings
      if (openai) {
        // Extract text content from chunks
        const texts = chunks.map(chunk => chunk.content);
        
        // Generate embeddings
        const embeddings = await this.generateBatchEmbeddings(texts);

        // Combine chunks with their embeddings
        const embeddedChunks = chunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddings[index]
        }));

        console.log(`✅ Generated ${embeddings.length} embeddings`);
        return embeddedChunks;
      } else {
        // Fallback: return chunks without embeddings but with search metadata
        console.log(`⚠️  OpenAI not available, using text-based search fallback`);
        const processedChunks = chunks.map((chunk, index) => ({
          ...chunk,
          embedding: null, // No embedding available
          searchTerms: this.extractSearchTerms(chunk.content), // Extract keywords for text search
          chunkIndex: index
        }));

        console.log(`✅ Processed ${processedChunks.length} chunks for text-based search`);
        return processedChunks;
      }
    } catch (error) {
      console.error('Error processing chunks:', error);
      // Return chunks without embeddings as fallback
      return chunks.map((chunk, index) => ({
        ...chunk,
        embedding: null,
        searchTerms: this.extractSearchTerms(chunk.content),
        chunkIndex: index
      }));
    }
  }

  /**
   * Generate query embedding for similarity search
   * @param {string} query - User query
   * @returns {Promise<Array>} Query embedding vector
   */
  static async embedQuery(query) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Query cannot be empty');
      }

      console.log(`🔍 Generating embedding for query: "${query.substring(0, 50)}..."`);
      
      const embedding = await this.generateEmbedding(query);
      
      console.log(`✅ Generated query embedding (${embedding.length} dimensions)`);
      return embedding;
    } catch (error) {
      console.error('Error embedding query:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array} embedding1 - First embedding vector
   * @param {Array} embedding2 - Second embedding vector
   * @returns {number} Similarity score (0-1)
   */
  static calculateSimilarity(embedding1, embedding2) {
    try {
      if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
        return 0;
      }

      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }

  /**
   * Find most similar chunks using cosine similarity
   * @param {Array} queryEmbedding - Query embedding vector
   * @param {Array} chunks - Chunks with embeddings
   * @param {number} topK - Number of top results to return
   * @returns {Array} Top K most similar chunks with scores
   */
  static findSimilarChunks(queryEmbedding, chunks, topK = 5) {
    try {
      if (!queryEmbedding || !chunks || chunks.length === 0) {
        return [];
      }

      // Calculate similarity scores
      const scoredChunks = chunks
        .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
        .map(chunk => ({
          ...chunk,
          similarity: this.calculateSimilarity(queryEmbedding, chunk.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      console.log(`🎯 Found ${scoredChunks.length} similar chunks`);
      scoredChunks.forEach((chunk, index) => {
        console.log(`  ${index + 1}. Similarity: ${chunk.similarity.toFixed(3)} - "${chunk.content.substring(0, 60)}..."`);
      });

      return scoredChunks;
    } catch (error) {
      console.error('Error finding similar chunks:', error);
      return [];
    }
  }

  /**
   * Validate embedding vector
   * @param {Array} embedding - Embedding vector to validate
   * @returns {boolean} True if valid
   */
  static validateEmbedding(embedding) {
    return (
      Array.isArray(embedding) &&
      embedding.length > 0 &&
      embedding.every(val => typeof val === 'number' && !isNaN(val))
    );
  }

  /**
   * Extract search terms from text for fallback text-based search
   * @param {string} text - Text to extract terms from
   * @returns {Array} Array of search terms
   */
  static extractSearchTerms(text) {
    if (!text) return [];
    
    // Convert to lowercase and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out short words
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);
    
    const filteredWords = words.filter(word => !stopWords.has(word));
    
    // Return unique terms
    return [...new Set(filteredWords)];
  }

  /**
   * Calculate text similarity using keyword matching (fallback)
   * @param {Array} queryTerms - Query search terms
   * @param {Array} chunkTerms - Chunk search terms
   * @returns {number} Similarity score (0-1)
   */
  static calculateTextSimilarity(queryTerms, chunkTerms) {
    if (!queryTerms.length || !chunkTerms.length) return 0;
    
    const querySet = new Set(queryTerms);
    const chunkSet = new Set(chunkTerms);
    
    // Calculate Jaccard similarity (intersection over union)
    const intersection = new Set([...querySet].filter(term => chunkSet.has(term)));
    const union = new Set([...querySet, ...chunkSet]);
    
    return intersection.size / union.size;
  }

  /**
   * Find similar chunks using text-based search (fallback)
   * @param {string} query - Search query
   * @param {Array} chunks - Chunks with search terms
   * @param {number} topK - Number of top results to return
   * @returns {Array} Top K most similar chunks with scores
   */
  static findSimilarChunksText(query, chunks, topK = 5) {
    try {
      if (!query || !chunks || chunks.length === 0) {
        return [];
      }

      const queryTerms = this.extractSearchTerms(query);
      
      // Calculate similarity scores using text matching
      const scoredChunks = chunks
        .filter(chunk => chunk.searchTerms && chunk.searchTerms.length > 0)
        .map(chunk => ({
          ...chunk,
          similarity: this.calculateTextSimilarity(queryTerms, chunk.searchTerms)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      console.log(`🎯 Found ${scoredChunks.length} similar chunks using text search`);
      scoredChunks.forEach((chunk, index) => {
        console.log(`  ${index + 1}. Similarity: ${chunk.similarity.toFixed(3)} - "${chunk.content.substring(0, 60)}..."`);
      });

      return scoredChunks;
    } catch (error) {
      console.error('Error finding similar chunks with text search:', error);
      return [];
    }
  }
}

export default EmbeddingService;