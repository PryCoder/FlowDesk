// src/routes/knowledge.route.js
import express from 'express';
import multer from 'multer';
import databaseService from '../services/database.service.js'; // Correct: default import
import chatbotService from '../services/chatbot.service.js'; // Correct: default import

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Services are singletons, use the imported instances directly
// DO NOT create new instances

// Knowledge base management
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { userId, knowledgeBaseId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const uploadResults = [];
    
    for (const file of req.files) {
      try {
        const result = await chatbotService.uploadDocument(file, userId, {
          knowledgeBaseId,
          processImmediately: true,
          storeInDatabase: true,
          generateSummary: true
        });
        
        uploadResults.push({
          filename: file.originalname,
          success: true,
          documentId: result.documentId,
          summary: result.summary
        });
      } catch (error) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Files uploaded to knowledge base',
      results: uploadResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/documents/:knowledgeBaseId', async (req, res) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // This would query documents by knowledge base ID
    // For now, returning placeholder
    res.json({
      success: true,
      knowledgeBaseId,
      documents: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // This would delete document from knowledge base
    // For now, returning placeholder
    res.json({
      success: true,
      message: 'Document deleted from knowledge base',
      documentId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query, knowledgeBaseId, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    // This would search across knowledge base documents
    // For now, returning placeholder
    res.json({
      success: true,
      query,
      results: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;