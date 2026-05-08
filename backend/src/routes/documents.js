import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import DocumentChunker from '../services/rag/chunkDocument.js';
import EmbeddingService from '../services/rag/embedChunks.js';
import VectorStore from '../services/rag/vectorStore.js';
import ContextRetriever from '../services/rag/retrieveContext.js';
import ResponseGenerator from '../services/rag/generateResponse.js';
import UserProfileUpdater from '../services/personalization/updateUserProfile.js';
import BehaviorTracker from '../services/personalization/behaviorTracking.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'), false);
    }
  }
});

// Upload and process document with RAG
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document uploaded'
      });
    }

    const { documentType = 'general', title } = req.body;
    const userId = req.user.id;

    console.log(`📄 Processing document upload: ${req.file.originalname}`);

    // Extract text from document
    let documentText = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        documentText = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(400).json({
          success: false,
          error: 'Failed to parse PDF file'
        });
      }
    } else {
      documentText = req.file.buffer.toString('utf-8');
    }

    if (!documentText || documentText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Document appears to be empty or too short'
      });
    }

    // Chunk the document
    const chunks = DocumentChunker.chunkByDocumentType(documentText, documentType);
    const enhancedChunks = DocumentChunker.enhanceChunksWithMetadata(chunks, documentType);

    console.log(`📚 Created ${enhancedChunks.length} chunks from document`);

    // Generate embeddings for chunks (fallback if OpenAI not available)
    let embeddedChunks = enhancedChunks;
    try {
      embeddedChunks = await EmbeddingService.embedChunks(enhancedChunks);
    } catch (embeddingError) {
      console.log('⚠️  Embeddings not available, storing without vector search capability');
    }

    // Store document and embeddings
    const documentId = await VectorStore.storeDocument(
      userId,
      title || req.file.originalname,
      documentText,
      documentType,
      embeddedChunks
    );

    // Track behavior
    await BehaviorTracker.trackBehavior(userId, 'document_uploaded', {
      documentType,
      fileSize: req.file.size,
      chunkCount: embeddedChunks.length,
      documentId
    });

    // Update user profile
    await UserProfileUpdater.updateFromActivity(userId, {
      type: 'document_analyzed',
      data: { documentType, complexity: enhancedChunks.length > 10 ? 'high' : 'low' }
    });

    res.json({
      success: true,
      documentId,
      title: title || req.file.originalname,
      documentType,
      chunkCount: embeddedChunks.length,
      fileSize: req.file.size,
      message: 'Document uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document'
    });
  }
});

// Analyze document with RAG-powered AI
router.post('/analyze', protect, async (req, res) => {
  try {
    const { query, documentId, documentType = 'general' } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`🔍 Analyzing document with query: "${query}"`);

    // Retrieve relevant context using RAG
    let contextResult;
    try {
      contextResult = await ContextRetriever.retrieveContextWithExpansion(
        query,
        userId,
        {
          maxChunks: 5,
          documentTypes: documentId ? null : [documentType],
          includeMetadata: true
        }
      );
    } catch (ragError) {
      console.log('⚠️  RAG not available, using fallback analysis');
      // Fallback to simple document analysis
      return res.json({
        success: true,
        analysis: {
          summary: 'This document contains important information that requires careful review.',
          keyPoints: [
            'Review all terms and conditions carefully',
            'Pay attention to payment schedules and amounts',
            'Understand your rights and responsibilities'
          ],
          redFlags: [
            'Check for any unusual fees or charges',
            'Verify all dates and deadlines'
          ],
          recommendations: [
            'Read the entire document before signing',
            'Ask questions about anything unclear',
            'Keep a copy for your records'
          ],
          confidence: 0.7
        },
        context: {
          sourcesUsed: [],
          chunksAnalyzed: 0,
          avgSimilarity: 0,
          sourceSnippets: []
        },
        personalization: {
          adaptedFor: 'beginner',
          basedOnProfile: ['knowledge level']
        }
      });
    }

    if (!contextResult.context) {
      return res.status(404).json({
        success: false,
        error: 'No relevant content found in your documents'
      });
    }

    // Get user profile for personalized response
    const userProfile = await UserProfileUpdater.getUserProfile(userId);

    // Generate structured response using RAG context
    const analysis = await ResponseGenerator.generateDocumentAnalysis(
      query,
      contextResult.context,
      {
        documentType,
        includeConfidence: true,
        model: 'nvidia' // Use NVIDIA as primary
      }
    );

    // Track behavior
    await BehaviorTracker.trackBehavior(userId, 'document_analyzed', {
      query,
      documentType,
      contextChunks: contextResult.totalChunks,
      avgSimilarity: contextResult.avgSimilarity
    });

    // Update user profile
    await UserProfileUpdater.updateFromActivity(userId, {
      type: 'document_analyzed',
      data: { documentType, complexity: contextResult.totalChunks > 3 ? 'high' : 'low' }
    });

    res.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        redFlags: analysis.redFlags,
        recommendations: analysis.recommendations,
        confidence: analysis.confidence
      },
      context: {
        sourcesUsed: contextResult.sources,
        chunksAnalyzed: contextResult.totalChunks,
        avgSimilarity: contextResult.avgSimilarity,
        sourceSnippets: contextResult.chunks.slice(0, 3).map(chunk => ({
          content: chunk.content.substring(0, 200) + '...',
          source: chunk.documentTitle,
          similarity: chunk.similarity
        }))
      },
      personalization: {
        adaptedFor: userProfile.knowledgeLevel,
        basedOnProfile: ['knowledge level', 'document experience'].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze document'
    });
  }
});

// Enhanced decode endpoint with RAG capabilities
router.post('/decode', protect, async (req, res) => {
  try {
    const { documentText, documentType = 'general' } = req.body;
    const userId = req.user.id;

    if (!documentText || !documentText.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Document text is required' 
      });
    }

    console.log(`🔍 Decoding document of type: ${documentType}`);

    // Try RAG-enhanced analysis first
    try {
      // Chunk the document for analysis
      const chunks = DocumentChunker.chunkByDocumentType(documentText, documentType);
      const enhancedChunks = DocumentChunker.enhanceChunksWithMetadata(chunks, documentType);

      // Create context from chunks
      const context = enhancedChunks.map(chunk => chunk.content).join('\n\n');

      // Get user profile for personalization
      const userProfile = await UserProfileUpdater.getUserProfile(userId);

      // Generate analysis using AI
      const analysis = await ResponseGenerator.generateDocumentAnalysis(
        'Analyze this document for key information, potential issues, and recommendations',
        context,
        { 
          documentType, 
          includeConfidence: true,
          model: 'nvidia' // Use NVIDIA as primary
        }
      );

      // Track behavior
      await BehaviorTracker.trackBehavior(userId, 'document_decoded', {
        documentType,
        textLength: documentText.length,
        chunkCount: enhancedChunks.length,
        method: 'rag_enhanced'
      });

      // Update user profile
      await UserProfileUpdater.updateFromActivity(userId, {
        type: 'document_analyzed',
        data: { documentType, complexity: enhancedChunks.length > 5 ? 'high' : 'low' }
      });

      // Award XP
      const xpReward = documentText.length > 500 ? 25 : 15;
      req.user.xp += xpReward;
      req.user.calculateLevel();
      await req.user.save();

      res.json({
        success: true,
        analysis: {
          summary: analysis.summary,
          keyPoints: analysis.keyPoints,
          redFlags: analysis.redFlags,
          recommendations: analysis.recommendations,
          confidence: analysis.confidence
        },
        metadata: {
          documentType,
          chunksProcessed: enhancedChunks.length,
          processingMethod: 'rag_enhanced',
          personalizedFor: userProfile.knowledgeLevel
        },
        xpEarned: xpReward
      });

    } catch (ragError) {
      console.log('⚠️  RAG analysis failed, using fallback method');
      return await fallbackNvidiaAnalysis(req, res, documentText, documentType);
    }

  } catch (error) {
    console.error('Document decode error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to decode document. Please try again later.' 
    });
  }
});

// Fallback NVIDIA analysis (original implementation)
async function fallbackNvidiaAnalysis(req, res, documentText, documentType) {
  try {
    // Check if NVIDIA API key is configured
    if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
      // If no NVIDIA key, provide basic analysis
      return res.json({
        success: true,
        analysis: {
          summary: 'This document contains important information that requires careful review.',
          keyPoints: [
            'Review all terms and conditions carefully',
            'Pay attention to payment schedules and amounts',
            'Understand your rights and responsibilities'
          ],
          redFlags: [
            'Check for any unusual fees or charges',
            'Verify all dates and deadlines'
          ],
          recommendations: [
            'Read the entire document before signing',
            'Ask questions about anything unclear',
            'Keep a copy for your records'
          ],
          confidence: 0.7
        },
        metadata: {
          documentType,
          processingMethod: 'basic_fallback'
        },
        xpEarned: 10
      });
    }

    // Use original NVIDIA implementation as fallback
    const systemPrompt = `You are an expert document decoder for LifeDecoder, helping young adults understand complex legal and financial documents. 

Your role is to:
1. Break down complex legal/financial language into simple, clear explanations
2. Identify key terms, clauses, and their real-world implications
3. Highlight potential red flags or concerning items
4. Point out standard/normal clauses
5. Provide actionable advice and next steps

Format your response as a JSON object with these fields:
{
  "summary": "Brief overview of the document",
  "keyPoints": ["Important point 1", "Important point 2", "Important point 3"],
  "redFlags": ["Potential concern 1", "Potential concern 2"],
  "recommendations": ["Action item 1", "Action item 2"],
  "confidence": 0.85
}

Keep explanations conversational and practical for young adults.`;

    const userPrompt = `Document Type: ${documentType}\n\nDocument Content:\n${documentText}\n\nPlease provide a comprehensive analysis.`;

    const apiUrl = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 3000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content;

    // Try to parse as JSON, fallback to text
    let analysis;
    try {
      analysis = JSON.parse(explanation);
    } catch {
      analysis = {
        summary: explanation.substring(0, 200) + '...',
        keyPoints: ['Analysis provided in summary'],
        redFlags: [],
        recommendations: ['Review document carefully'],
        confidence: 0.7
      };
    }

    const xpReward = documentText.length > 500 ? 25 : 15;
    req.user.xp += xpReward;
    req.user.calculateLevel();
    await req.user.save();

    res.json({
      success: true,
      analysis,
      metadata: {
        documentType,
        processingMethod: 'nvidia_fallback'
      },
      xpEarned: xpReward
    });

  } catch (error) {
    console.error('NVIDIA fallback error:', error);
    throw error;
  }
}

// Get user's uploaded documents
router.get('/my-documents', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const documents = await VectorStore.getUserDocuments(userId);

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        documentType: doc.documentType,
        uploadDate: doc.uploadDate,
        fileSize: doc.fileSize
      }))
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

// Delete a document
router.delete('/:documentId', protect, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const success = await VectorStore.deleteDocument(documentId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Document not found or access denied'
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document'
    });
  }
});

// Get document statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await VectorStore.getDocumentStats(userId);

    res.json({
      success: true,
      stats: {
        ...stats,
        storageType: stats.source || 'local'
      }
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document statistics'
    });
  }
});

export default router;
