import VectorStore from './vectorStore.js';
import EmbeddingService from './embedChunks.js';

/**
 * Context Retrieval Service
 * Retrieves relevant context for RAG queries
 */

const MAX_CHUNKS_PER_QUERY = parseInt(process.env.MAX_CHUNKS_PER_QUERY) || 5;
const MIN_SIMILARITY_THRESHOLD = 0.1;
const MAX_CONTEXT_LENGTH = 4000; // Maximum tokens for context

export class ContextRetriever {
  /**
   * Retrieve relevant context for a query
   * @param {string} query - User query
   * @param {string} userId - User ID for personalized search
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved context with metadata
   */
  static async retrieveContext(query, userId, options = {}) {
    try {
      const {
        maxChunks = MAX_CHUNKS_PER_QUERY,
        threshold = MIN_SIMILARITY_THRESHOLD,
        documentTypes = null, // Filter by document types
        includeMetadata = true
      } = options;

      console.log(`🔍 Retrieving context for query: "${query.substring(0, 50)}..."`);

      // Perform similarity search
      const similarChunks = await VectorStore.similaritySearch(
        query, 
        userId, 
        maxChunks * 2, // Get more results to filter and rank
        threshold
      );

      if (similarChunks.length === 0) {
        console.log('⚠️  No relevant context found');
        return {
          context: '',
          chunks: [],
          totalChunks: 0,
          avgSimilarity: 0,
          sources: []
        };
      }

      // Filter by document types if specified
      let filteredChunks = similarChunks;
      if (documentTypes && documentTypes.length > 0) {
        filteredChunks = similarChunks.filter(chunk => 
          documentTypes.includes(chunk.documentType)
        );
      }

      // Rank and select best chunks
      const selectedChunks = this.rankAndSelectChunks(filteredChunks, maxChunks);

      // Build context string
      const context = this.buildContextString(selectedChunks);

      // Calculate statistics
      const avgSimilarity = selectedChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / selectedChunks.length;
      const sources = [...new Set(selectedChunks.map(chunk => chunk.documentTitle))];

      console.log(`✅ Retrieved context from ${selectedChunks.length} chunks (avg similarity: ${avgSimilarity.toFixed(3)})`);

      return {
        context,
        chunks: includeMetadata ? selectedChunks : selectedChunks.map(c => ({ content: c.content, similarity: c.similarity })),
        totalChunks: selectedChunks.length,
        avgSimilarity,
        sources,
        query
      };
    } catch (error) {
      console.error('Error retrieving context:', error);
      throw new Error(`Context retrieval failed: ${error.message}`);
    }
  }

  /**
   * Rank and select the best chunks for context
   * @param {Array} chunks - Similar chunks with scores
   * @param {number} maxChunks - Maximum number of chunks to select
   * @returns {Array} Selected and ranked chunks
   */
  static rankAndSelectChunks(chunks, maxChunks) {
    if (chunks.length <= maxChunks) {
      return chunks;
    }

    // Advanced ranking considering multiple factors
    const rankedChunks = chunks.map(chunk => ({
      ...chunk,
      rankScore: this.calculateRankScore(chunk)
    }));

    // Sort by rank score and select top chunks
    rankedChunks.sort((a, b) => b.rankScore - a.rankScore);

    // Ensure diversity in selected chunks (avoid too many from same document)
    const selectedChunks = [];
    const documentCounts = {};
    const maxPerDocument = Math.max(1, Math.floor(maxChunks / 2));

    for (const chunk of rankedChunks) {
      if (selectedChunks.length >= maxChunks) break;

      const docTitle = chunk.documentTitle;
      const currentCount = documentCounts[docTitle] || 0;

      if (currentCount < maxPerDocument || selectedChunks.length < maxChunks * 0.8) {
        selectedChunks.push(chunk);
        documentCounts[docTitle] = currentCount + 1;
      }
    }

    return selectedChunks;
  }

  /**
   * Calculate comprehensive rank score for a chunk
   * @param {Object} chunk - Chunk with similarity and metadata
   * @returns {number} Rank score
   */
  static calculateRankScore(chunk) {
    let score = chunk.similarity; // Base similarity score

    // Boost score based on document type relevance
    const typeBoosts = {
      'lease': 1.2,
      'contract': 1.2,
      'medical': 1.1,
      'insurance': 1.1,
      'financial': 1.1,
      'tax': 1.1
    };
    
    const typeBoost = typeBoosts[chunk.documentType?.toLowerCase()] || 1.0;
    score *= typeBoost;

    // Boost score for chunks with key terms
    if (chunk.metadata?.keyTerms?.length > 0) {
      score *= (1 + chunk.metadata.keyTerms.length * 0.05);
    }

    // Boost score for chunks with numbers/amounts (often important)
    if (chunk.metadata?.hasNumbers) {
      score *= 1.1;
    }

    if (chunk.metadata?.hasAmounts) {
      score *= 1.15;
    }

    // Slight penalty for very short or very long chunks
    const wordCount = chunk.metadata?.wordCount || chunk.content.split(/\s+/).length;
    if (wordCount < 20) {
      score *= 0.9; // Too short
    } else if (wordCount > 200) {
      score *= 0.95; // Too long
    }

    return score;
  }

  /**
   * Build context string from selected chunks
   * @param {Array} chunks - Selected chunks
   * @returns {string} Formatted context string
   */
  static buildContextString(chunks) {
    if (chunks.length === 0) {
      return '';
    }

    let context = '';
    let currentLength = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkText = `[Source: ${chunk.documentTitle}]\n${chunk.content}\n\n`;
      
      // Check if adding this chunk would exceed max context length
      if (currentLength + chunkText.length > MAX_CONTEXT_LENGTH && i > 0) {
        break;
      }

      context += chunkText;
      currentLength += chunkText.length;
    }

    return context.trim();
  }

  /**
   * Retrieve context with query expansion
   * @param {string} query - Original query
   * @param {string} userId - User ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Enhanced context with expanded queries
   */
  static async retrieveContextWithExpansion(query, userId, options = {}) {
    try {
      // Generate expanded queries for better retrieval
      const expandedQueries = this.expandQuery(query);
      
      console.log(`🔍 Expanding query into ${expandedQueries.length} variations`);

      // Retrieve context for each expanded query
      const allResults = await Promise.all(
        expandedQueries.map(expandedQuery => 
          this.retrieveContext(expandedQuery, userId, { ...options, maxChunks: 3 })
        )
      );

      // Combine and deduplicate results
      const combinedChunks = [];
      const seenContent = new Set();

      allResults.forEach(result => {
        result.chunks.forEach(chunk => {
          const contentHash = chunk.content.substring(0, 100); // Simple deduplication
          if (!seenContent.has(contentHash)) {
            seenContent.add(contentHash);
            combinedChunks.push(chunk);
          }
        });
      });

      // Re-rank combined results
      const finalChunks = this.rankAndSelectChunks(combinedChunks, options.maxChunks || MAX_CHUNKS_PER_QUERY);
      const context = this.buildContextString(finalChunks);

      const avgSimilarity = finalChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / finalChunks.length;
      const sources = [...new Set(finalChunks.map(chunk => chunk.documentTitle))];

      console.log(`✅ Enhanced retrieval: ${finalChunks.length} chunks from ${sources.length} sources`);

      return {
        context,
        chunks: finalChunks,
        totalChunks: finalChunks.length,
        avgSimilarity,
        sources,
        query,
        expandedQueries
      };
    } catch (error) {
      console.error('Error in enhanced context retrieval:', error);
      // Fallback to basic retrieval
      return await this.retrieveContext(query, userId, options);
    }
  }

  /**
   * Expand query with synonyms and related terms
   * @param {string} query - Original query
   * @returns {Array} Expanded query variations
   */
  static expandQuery(query) {
    const queries = [query]; // Always include original

    // Common synonyms and expansions for document analysis
    const expansions = {
      'rent': ['lease', 'rental agreement', 'tenancy'],
      'lease': ['rent', 'rental contract', 'tenancy agreement'],
      'contract': ['agreement', 'terms', 'conditions'],
      'payment': ['fee', 'cost', 'charge', 'amount'],
      'insurance': ['coverage', 'policy', 'benefits'],
      'medical': ['health', 'healthcare', 'treatment'],
      'bill': ['invoice', 'statement', 'charges'],
      'deposit': ['security deposit', 'advance payment'],
      'penalty': ['fee', 'fine', 'charge'],
      'termination': ['cancellation', 'ending', 'expiry']
    };

    // Extract key terms and expand
    const words = query.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (expansions[word]) {
        expansions[word].forEach(synonym => {
          const expandedQuery = query.toLowerCase().replace(word, synonym);
          if (expandedQuery !== query.toLowerCase()) {
            queries.push(expandedQuery);
          }
        });
      }
    });

    // Add question variations
    if (!query.includes('?')) {
      queries.push(`What about ${query}?`);
      queries.push(`Explain ${query}`);
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  /**
   * Get context statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Context statistics
   */
  static async getContextStats(userId) {
    try {
      const documents = await VectorStore.getUserDocuments(userId);
      const docStats = await VectorStore.getDocumentStats(userId);

      return {
        totalDocuments: documents.length,
        totalSize: docStats.totalSize,
        documentTypes: [...new Set(documents.map(doc => doc.documentType))],
        avgDocumentSize: documents.length > 0 ? Math.round(docStats.totalSize / documents.length) : 0,
        recentDocuments: documents.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting context stats:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        documentTypes: [],
        avgDocumentSize: 0,
        recentDocuments: []
      };
    }
  }
}

export default ContextRetriever;