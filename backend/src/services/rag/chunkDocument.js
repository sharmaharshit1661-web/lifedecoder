import { get_encoding } from 'tiktoken';

let _encoder = null;
function getEncoder() {
  if (!_encoder) {
    try {
      _encoder = get_encoding('cl100k_base');
    } catch {
      _encoder = null;
    }
  }
  return _encoder;
}

// Compatibility shim so existing code using encode() still works
const encode = (text) => {
  const enc = getEncoder();
  if (!enc) return [];
  return enc.encode(text);
};

/**
 * Document Chunking Service
 * Splits documents into optimal chunks for RAG processing
 */

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 100;

export class DocumentChunker {
  /**
   * Chunk text into overlapping segments
   * @param {string} text - The text to chunk
   * @param {Object} options - Chunking options
   * @returns {Array} Array of chunk objects
   */
  static chunkText(text, options = {}) {
    const {
      chunkSize = CHUNK_SIZE,
      chunkOverlap = CHUNK_OVERLAP,
      preserveSentences = true
    } = options;

    // Clean and normalize text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    if (!cleanText) {
      return [];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < cleanText.length) {
      let endIndex = Math.min(startIndex + chunkSize, cleanText.length);
      
      // Try to break at sentence boundaries if preserveSentences is true
      if (preserveSentences && endIndex < cleanText.length) {
        const sentenceEnd = this.findSentenceBreak(cleanText, startIndex, endIndex);
        if (sentenceEnd > startIndex + chunkSize * 0.5) {
          endIndex = sentenceEnd;
        }
      }

      const chunkText = cleanText.slice(startIndex, endIndex).trim();
      
      if (chunkText.length > 0) {
        const tokenCount = this.countTokens(chunkText);
        
        chunks.push({
          content: chunkText,
          startIndex,
          endIndex,
          tokenCount,
          chunkIndex: chunks.length
        });
      }

      // Move start index with overlap
      startIndex = Math.max(startIndex + chunkSize - chunkOverlap, endIndex);
      
      // Prevent infinite loop
      if (startIndex >= cleanText.length) break;
    }

    return chunks;
  }

  /**
   * Find the best sentence break point near the target end index
   * @param {string} text - The full text
   * @param {number} startIndex - Start of current chunk
   * @param {number} targetEnd - Target end index
   * @returns {number} Best break point
   */
  static findSentenceBreak(text, startIndex, targetEnd) {
    const searchStart = Math.max(startIndex, targetEnd - 200);
    const searchEnd = Math.min(text.length, targetEnd + 100);
    const searchText = text.slice(searchStart, searchEnd);
    
    // Look for sentence endings
    const sentenceEnders = /[.!?]\s+/g;
    let bestBreak = targetEnd;
    let match;
    
    while ((match = sentenceEnders.exec(searchText)) !== null) {
      const breakPoint = searchStart + match.index + match[0].length;
      if (breakPoint <= targetEnd + 50 && breakPoint >= targetEnd - 100) {
        bestBreak = breakPoint;
      }
    }
    
    return bestBreak;
  }

  /**
   * Count tokens in text using tiktoken
   * @param {string} text - Text to count tokens for
   * @returns {number} Token count
   */
  static countTokens(text) {
    try {
      const tokens = encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback: rough estimation (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Chunk document by type with specific strategies
   * @param {string} content - Document content
   * @param {string} documentType - Type of document
   * @returns {Array} Optimized chunks for document type
   */
  static chunkByDocumentType(content, documentType) {
    const baseOptions = {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP
    };

    switch (documentType.toLowerCase()) {
      case 'lease':
      case 'contract':
        return this.chunkLegalDocument(content, baseOptions);
      
      case 'medical':
      case 'insurance':
        return this.chunkMedicalDocument(content, baseOptions);
      
      case 'financial':
      case 'tax':
        return this.chunkFinancialDocument(content, baseOptions);
      
      default:
        return this.chunkText(content, baseOptions);
    }
  }

  /**
   * Specialized chunking for legal documents
   * Preserves clause structure and important legal language
   */
  static chunkLegalDocument(content, options) {
    // Look for section headers and clause numbers
    const sectionPattern = /(?:^|\n)\s*(?:\d+\.|\([a-z]\)|[A-Z][A-Z\s]+:)/gm;
    const chunks = [];
    
    let lastIndex = 0;
    let match;
    
    while ((match = sectionPattern.exec(content)) !== null) {
      if (lastIndex < match.index) {
        const sectionContent = content.slice(lastIndex, match.index).trim();
        if (sectionContent) {
          chunks.push(...this.chunkText(sectionContent, options));
        }
      }
      lastIndex = match.index;
    }
    
    // Handle remaining content
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex).trim();
      if (remainingContent) {
        chunks.push(...this.chunkText(remainingContent, options));
      }
    }
    
    return chunks.length > 0 ? chunks : this.chunkText(content, options);
  }

  /**
   * Specialized chunking for medical documents
   * Preserves medical terminology and procedure descriptions
   */
  static chunkMedicalDocument(content, options) {
    // Preserve medical sections and procedure codes
    const medicalOptions = {
      ...options,
      chunkSize: options.chunkSize * 0.8, // Smaller chunks for medical precision
      preserveSentences: true
    };
    
    return this.chunkText(content, medicalOptions);
  }

  /**
   * Specialized chunking for financial documents
   * Preserves numerical data and financial terms
   */
  static chunkFinancialDocument(content, options) {
    // Look for financial sections (amounts, dates, account numbers)
    const financialOptions = {
      ...options,
      preserveSentences: true
    };
    
    return this.chunkText(content, financialOptions);
  }

  /**
   * Extract metadata from chunks for better retrieval
   * @param {Array} chunks - Document chunks
   * @param {string} documentType - Document type
   * @returns {Array} Chunks with enhanced metadata
   */
  static enhanceChunksWithMetadata(chunks, documentType) {
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        documentType,
        hasNumbers: /\d+/.test(chunk.content),
        hasDates: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(chunk.content),
        hasAmounts: /\$[\d,]+\.?\d*/.test(chunk.content),
        wordCount: chunk.content.split(/\s+/).length,
        ...this.extractKeyTerms(chunk.content, documentType)
      }
    }));
  }

  /**
   * Extract key terms based on document type
   * @param {string} content - Chunk content
   * @param {string} documentType - Document type
   * @returns {Object} Key terms metadata
   */
  static extractKeyTerms(content, documentType) {
    const legalTerms = ['clause', 'section', 'agreement', 'party', 'liability', 'termination'];
    const medicalTerms = ['diagnosis', 'treatment', 'procedure', 'medication', 'insurance', 'copay'];
    const financialTerms = ['payment', 'interest', 'balance', 'account', 'fee', 'credit'];
    
    let relevantTerms = [];
    
    switch (documentType.toLowerCase()) {
      case 'lease':
      case 'contract':
        relevantTerms = legalTerms;
        break;
      case 'medical':
      case 'insurance':
        relevantTerms = medicalTerms;
        break;
      case 'financial':
      case 'tax':
        relevantTerms = financialTerms;
        break;
    }
    
    const foundTerms = relevantTerms.filter(term => 
      content.toLowerCase().includes(term)
    );
    
    return {
      keyTerms: foundTerms,
      termCount: foundTerms.length
    };
  }
}

export default DocumentChunker;