// src/chatbot/controllers/chatbot.controller.js
import { GoogleGenAI } from '@google/genai';
import { DocumentLoader } from '../utils/documentLoader.js';
import { VectorStoreService } from './vectorStore.service.js';
import databaseService from './database.service.js';
import { v4 as uuidv4 } from 'uuid';
import { formatDocumentsAsString } from "langchain/util/document";
import config from "../../rec/index.js";

export class ChatbotService {
  constructor() {
    this.documentLoader = new DocumentLoader();
    this.vectorStoreService = new VectorStoreService('memory');
    this.databaseService = databaseService;
    
    // Initialize Gemini client directly (faster than LangChain)
    this.genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.modelName = 'gemini-2.5-flash'; // Using fastest model
    
    this.userSessions = new Map();
    this.conversationContexts = new Map();
  }

  // Direct Gemini API call (faster than LangChain)
  async generateContent(prompt) {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });
      return response.text || '';
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      throw error;
    }
  }

  async initializeUserSession(userId, options = {}) {
    try {
      const sessionId = uuidv4();
      const conversationId = options.conversationId || uuidv4();
      const storeId = `user_${userId}_session_${sessionId}`;
      
      const sessionData = {
        sessionId,
        userId,
        conversationId,
        storeId,
        modelType: 'gemini',
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 2000,
        contextWindow: options.contextWindow || 10,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: options.metadata || {}
      };
      
      this.userSessions.set(userId, sessionData);
      
      // Initialize conversation context
      this.conversationContexts.set(conversationId, {
        messages: [],
        documents: [],
        topics: [],
        sentiment: 'neutral',
        complexity: 'medium'
      });
      
      console.log(`✅ Session initialized for user ${userId}: ${sessionId}`);
      return sessionData;
      
    } catch (error) {
      console.error('Error initializing user session:', error);
      throw error;
    }
  }

  async getSession(userId) {
    return this.userSessions.get(userId);
  }

  async updateSessionActivity(userId) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.lastActivity = new Date().toISOString();
      this.userSessions.set(userId, session);
    }
  }

  async uploadDocument(file, userId, options = {}) {
    try {
      const {
        knowledgeBaseId = null,
        processImmediately = true,
        storeInDatabase = true,
        generateSummary = true
      } = options;
      
      console.log(`📄 Processing document upload for user ${userId}: ${file.originalname}`);
      
      // Load and process document
      const loadResult = await this.documentLoader.loadFromBuffer(
        file.buffer,
        file.mimetype,
        file.originalname
      );
      
      if (!loadResult.success) {
        throw new Error('Document loading failed');
      }
      
      const { documents, summary: loadSummary } = loadResult;
      
      // Store in vector store
      const storeId = knowledgeBaseId || `user_${userId}_uploads`;
      await this.vectorStoreService.addDocuments(documents, storeId);
      
      let documentSummary = null;
      let documentRecord = null;
      
      // Generate summary if requested
      if (generateSummary) {
        documentSummary = await this.summarizeDocument(
          documents.map(d => d.pageContent).join('\n\n'),
          file.mimetype,
          file.originalname
        );
      }
      
      // Store in database if requested
      if (storeInDatabase) {
        documentRecord = await this.databaseService.saveDocument({
          userId,
          filename: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          content: documents.map(d => d.pageContent).join('\n\n'),
          summary: documentSummary,
          metadata: {
            chunks: documents.length,
            ...loadSummary,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        });
        
        // Update processing status
        await this.databaseService.updateDocumentProcessing(documentRecord.id, {
          isProcessed: true,
          processingError: null
        });
      }
      
      // Update conversation context if this is part of an active conversation
      const session = this.getSession(userId);
      if (session) {
        const context = this.conversationContexts.get(session.conversationId);
        if (context) {
          context.documents.push({
            filename: file.originalname,
            type: file.mimetype,
            summary: documentSummary,
            chunks: documents.length,
            storeId
          });
        }
      }
      
      return {
        success: true,
        documentId: documentRecord?.id,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        chunks: documents.length,
        storeId,
        summary: documentSummary,
        loadSummary,
        processedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Document upload error:', error);
      
      // Save error to database if document record was created
      if (options.storeInDatabase && error.documentId) {
        await this.databaseService.updateDocumentProcessing(error.documentId, {
          isProcessed: false,
          processingError: error.message
        });
      }
      
      throw error;
    }
  }

  async summarizeDocument(content, documentType, documentName) {
    try {
      const prompt = `Summarize the following document:
      
Document Name: ${documentName}
Document Type: ${documentType}
Content Length: ${content.length} characters

Content:
${content.substring(0, 4000)}

Provide a concise summary:`;
      
      const summary = await this.generateContent(prompt);
      return summary;
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }

  async getResponse(userId, message, options = {}) {
    const requestId = options.requestId || 'unknown';
    
    console.log(`\n🤖 [${requestId}] ChatbotService.getResponse called`);
    console.log(`👤 [${requestId}] User ID: ${userId}`);
    console.log(`💬 [${requestId}] Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    
    try {
      // SPEED OPTIMIZATION: Run all setup operations in parallel
      const setupPromises = [];
      
      // 1. Session management (quick, in-memory)
      const sessionPromise = this.userSessions.get(userId) 
        ? Promise.resolve(this.userSessions.get(userId))
        : this.initializeUserSession(userId, options);
      setupPromises.push(sessionPromise);
      
      // 2. OPTIONAL: Chat history (only if needed, run in parallel)
      const historyPromise = options.includeHistory !== false
        ? this.databaseService.getChatHistory(userId, {
            conversationId: options.conversationId,
            limit: options.contextWindow || 3
          }).catch(err => {
            console.warn(`⚠️ [${requestId}] History fetch failed, continuing without it`);
            return [];
          })
        : Promise.resolve([]);
      setupPromises.push(historyPromise);
      
      // 3. OPTIONAL: Vector search (only if RAG enabled, run in parallel)
      const documentsPromise = options.useRAG === true
        ? this.vectorStoreService.searchAcrossAllStores(message, 2)
            .catch(err => {
              console.warn(`⚠️ [${requestId}] Vector search failed, continuing without it`);
              return [];
            })
        : Promise.resolve([]);
      setupPromises.push(documentsPromise);
      
      // Wait for all setup operations in parallel
      const aiStartTime = Date.now();
      const [session, chatHistory, relevantDocuments] = await Promise.all(setupPromises);
      const setupDuration = Date.now() - aiStartTime;
      console.log(`✅ [${requestId}] Setup completed in ${setupDuration}ms`);
      
      const { conversationId, storeId } = session;
      
      // SPEED OPTIMIZATION: Build minimal prompt
      const formattedHistory = chatHistory.length > 0
        ? chatHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')
        : '';
      
      const context = relevantDocuments.length > 0
        ? formatDocumentsAsString(relevantDocuments).substring(0, 1000)
        : '';
      
      // FAST AI CALL: Direct Gemini API call
      console.log(`🤖 [${requestId}] Generating AI response (FAST MODE - Direct Gemini)...`);
      const generationStartTime = Date.now();
      
      // Build simple, fast prompt
      const promptText = this.buildFastPrompt(message, formattedHistory, context);
      
      // Direct Gemini call (much faster than LangChain)
      const responseText = await this.generateContent(promptText);
      
      const generationDuration = Date.now() - generationStartTime;
      console.log(`✅ [${requestId}] AI response generated in ${generationDuration}ms`);
      console.log(`📝 [${requestId}] Response length: ${responseText.length} characters`);
      
      // ASYNC: Save to database (don't wait for it, fire and forget)
      this.saveMessageAsync(userId, session, message, responseText, conversationId, requestId, relevantDocuments)
        .catch(err => console.error(`❌ [${requestId}] Async save failed:`, err.message));
      
      // ASYNC: Update conversation context (don't wait)
      setImmediate(() => {
        this.updateConversationContext(conversationId, {
          userMessage: message,
          assistantResponse: responseText,
          suggestions: [],
          relevantDocuments
        });
      });
      
      // Return response immediately
      const totalDuration = Date.now() - aiStartTime;
      console.log(`✅ [${requestId}] Total response time: ${totalDuration}ms`);
      
      return {
        success: true,
        response: responseText,
        suggestions: this.getFallbackSuggestions(message).slice(0, 2),
        conversationId,
        timestamp: new Date().toISOString(),
        metadata: {
          model: this.modelName,
          temperature: session.temperature,
          tokens: {
            input: message.length / 4,
            output: responseText.length / 4
          },
          performance: {
            setupTime: setupDuration,
            generationTime: generationDuration,
            totalTime: totalDuration
          },
          relevantSources: relevantDocuments.slice(0, 2).map(doc => ({
            source: doc.metadata?.source || 'unknown',
            relevance: doc.metadata?.searchScore || 0
          }))
        }
      };
      
    } catch (error) {
      console.error(`💥 [${requestId}] ChatbotService.getResponse error:`, {
        message: error.message,
        stack: error.stack
      });
      
      throw new Error(`Chat response failed: ${error.message}`);
    }
  }

  // Build fast, minimal prompt
  buildFastPrompt(message, history, context) {
    let prompt = 'You are PrismAlly, a helpful AI assistant.\n\n';
    
    if (history) {
      prompt += `Previous messages:\n${history}\n\n`;
    }
    
    if (context) {
      prompt += `Relevant context:\n${context.substring(0, 500)}\n\n`;
    }
    
    prompt += `User: ${message}\nAssistant:`;
    
    return prompt;
  }

  // Async save (fire and forget)
  async saveMessageAsync(userId, session, userMessage, assistantMessage, conversationId, requestId, relevantDocuments) {
    try {
      // Save user message
      await this.databaseService.saveChatMessage({
        userId,
        sessionId: session.sessionId,
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      });
      
      // Save assistant message
      await this.databaseService.saveChatMessage({
        userId,
        sessionId: session.sessionId,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          sources: relevantDocuments.length
        }
      });
      
      console.log(`✅ [${requestId}] Messages saved asynchronously`);
    } catch (error) {
      console.error(`❌ [${requestId}] Async save error:`, error.message);
      // Don't throw - this is fire and forget
    }
  }

  getFallbackSuggestions(userMessage) {
    return [
      {
        id: 'fallback_1',
        type: 'question',
        text: 'Could you provide more details about that?',
        reason: 'General follow-up to understand better',
        confidence: 0.8
      },
      {
        id: 'fallback_2',
        type: 'exploration',
        text: 'Would you like me to search for more information on this topic?',
        reason: 'Offer to expand on the topic',
        confidence: 0.8
      },
      {
        id: 'fallback_3',
        type: 'action',
        text: 'Should I summarize the key points we discussed?',
        reason: 'Help with retention and clarity',
        confidence: 0.8
      }
    ];
  }

  updateConversationContext(conversationId, newData) {
    let context = this.conversationContexts.get(conversationId);
    
    if (!context) {
      context = {
        messages: [],
        documents: [],
        topics: [],
        sentiment: 'neutral',
        complexity: 'medium'
      };
    }
    
    // Add new message
    context.messages.push({
      role: 'user',
      content: newData.userMessage,
      timestamp: new Date().toISOString()
    });
    
    context.messages.push({
      role: 'assistant',
      content: newData.assistantResponse,
      timestamp: new Date().toISOString(),
      suggestions: newData.suggestions
    });
    
    // Update topics (simple keyword extraction)
    const words = newData.userMessage.toLowerCase().split(/\W+/);
    const commonTopics = ['meeting', 'document', 'task', 'email', 'schedule', 'project', 'team'];
    
    words.forEach(word => {
      if (commonTopics.includes(word) && !context.topics.includes(word)) {
        context.topics.push(word);
      }
    });
    
    // Keep only last 20 messages
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }
    
    this.conversationContexts.set(conversationId, context);
  }

  async analyzeDocumentQA(documentId, question) {
    try {
      // Get document from database
      const documents = await this.databaseService.getUserDocuments('system', {
        fileType: null,
        limit: 1
      });
      
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      const prompt = `Answer the following question based on the document:

Document: ${document.filename}
Content: ${document.content.substring(0, 4000)}

Question: ${question}

Answer:`;
      
      const answer = await this.generateContent(prompt);
      
      return {
        success: true,
        answer,
        document: {
          id: document.id,
          filename: document.filename,
          type: document.file_type
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Document QA error:', error);
      throw error;
    }
  }

  async extractTasksFromText(text, userId) {
    try {
      const prompt = `Extract tasks from the following text. Return a JSON array of tasks with title, description, and priority.

Text: ${text}

Return format: {"tasks": [{"title": "...", "description": "...", "priority": "high|medium|low"}]}`;
      
      const response = await this.generateContent(prompt);
      
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : { tasks: [] };
      
      if (userId) {
        console.log(`Extracted ${tasks.tasks.length} tasks for user ${userId}`);
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Task extraction error:', error);
      throw error;
    }
  }

  async getConversationAnalysis(conversationId) {
    try {
      const messages = await this.databaseService.getConversation(conversationId);
      
      if (messages.length === 0) {
        return null;
      }
      
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      
      const totalTokens = messages.reduce((sum, msg) => sum + (msg.content.length / 4), 0);
      const avgUserMessageLength = userMessages.length > 0 
        ? userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
        : 0;
      
      const allText = messages.map(m => m.content.toLowerCase()).join(' ');
      const words = allText.split(/\W+/).filter(w => w.length > 3);
      const wordFreq = {};
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const commonTopics = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      return {
        conversationId,
        messageCount: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        duration: messages.length > 1 
          ? (new Date(messages[messages.length - 1].created_at) - new Date(messages[0].created_at)) / 1000
          : 0,
        totalTokens,
        avgUserMessageLength,
        commonTopics,
        firstMessage: messages[0]?.content.substring(0, 100),
        lastMessage: messages[messages.length - 1]?.content.substring(0, 100),
        startTime: messages[0]?.created_at,
        endTime: messages[messages.length - 1]?.created_at
      };
      
    } catch (error) {
      console.error('Conversation analysis error:', error);
      throw error;
    }
  }

  async cleanupInactiveSessions(maxInactiveMinutes = 60) {
    try {
      const now = new Date();
      const inactiveSessions = [];
      
      for (const [userId, session] of this.userSessions) {
        const lastActivity = new Date(session.lastActivity);
        const minutesInactive = (now - lastActivity) / (1000 * 60);
        
        if (minutesInactive > maxInactiveMinutes) {
          inactiveSessions.push({ userId, sessionId: session.sessionId });
          this.userSessions.delete(userId);
          this.conversationContexts.delete(session.conversationId);
        }
      }
      
      if (inactiveSessions.length > 0) {
        console.log(`🧹 Cleaned up ${inactiveSessions.length} inactive sessions`);
      }
      
      return inactiveSessions;
      
    } catch (error) {
      console.error('Session cleanup error:', error);
      return [];
    }
  }

  async getSystemStats() {
    try {
      const stats = {
        activeSessions: this.userSessions.size,
        activeConversations: this.conversationContexts.size,
        vectorStores: await this.vectorStoreService.getAllStoresInfo(),
        sessionCleanup: await this.cleanupInactiveSessions(),
        model: this.modelName,
        timestamp: new Date().toISOString()
      };
      
      return stats;
      
    } catch (error) {
      console.error('System stats error:', error);
      throw error;
    }
  }
}

// Export a single instance of the service
export default new ChatbotService();