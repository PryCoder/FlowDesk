import { GoogleGenAI } from '@google/genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import DocumentService from './documentService.js';
import KnowledgeBaseService from './knowledgeService.js';
import TaskService from './taskService.js';

class ChatbotService {
  constructor() {
    // Initialize Google GenAI client
    this.genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    
    // Get the generative model with Gemini 2.5 Flash
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // Using Gemini 2.5 Flash
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    // In-memory session storage (for production, use Redis)
    this.sessions = new Map();
    this.conversationHistory = new Map();
  }

  // Helper method to generate content using the correct API
  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[ChatbotService] Content generation error:', error.message);
      throw error;
    }
  }

  // Create a new chat session
  async createChatSession({ userId, companyId, userRole, context, documentIds, chatType }) {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      userId,
      companyId,
      userRole,
      context: context || {},
      documentIds: documentIds || [],
      chatType: chatType || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    };
    
    this.sessions.set(sessionId, session);
    this.conversationHistory.set(sessionId, []);
    
    return session;
  }

  // Process user message with Knowledge Base priority
  async processMessage({ userId, sessionId, message, context, documentIds, includeDocuments = false, checkKnowledgeBaseFirst = true }) {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('Invalid session or unauthorized access');
    }

    // Update session
    session.updatedAt = new Date().toISOString();
    session.messageCount += 1;

    // Get conversation history
    const history = this.conversationHistory.get(sessionId) || [];
    
    // Prepare context
    const fullContext = {
      ...session.context,
      ...context,
      currentTime: new Date().toISOString(),
      userRole: session.userRole,
      companyId: session.companyId
    };

    // ==================== STEP 1: CHECK KNOWLEDGE BASE FIRST ====================
    let kbResponse = null;
    if (checkKnowledgeBaseFirst) {
      kbResponse = await this.getKnowledgeBaseAnswer(message, userId, session.companyId, session.userRole);
      
      if (kbResponse && kbResponse.confidence > 0.7) {
        // Update conversation history
        history.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          metadata: { queryType: 'knowledge_base' }
        });
        
        history.push({
          role: 'assistant',
          content: kbResponse.answer,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'knowledge_base',
            sources: kbResponse.sources,
            confidence: kbResponse.confidence
          }
        });

        // Keep history limited
        if (history.length > 20) {
          history.splice(0, history.length - 20);
        }
        
        this.conversationHistory.set(sessionId, history);

        return {
          text: kbResponse.answer,
          type: 'knowledge_base',
          sources: kbResponse.sources,
          suggestedActions: [
            'View full knowledge base entry',
            'Search related topics',
            'Ask for clarification'
          ],
          confidence: kbResponse.confidence,
          personalized: true,
          metadata: {
            sourceType: 'knowledge_base',
            responseTime: Date.now(),
            entryIds: kbResponse.entryIds || []
          }
        };
      }
    }

    // ==================== STEP 2: CHECK DOCUMENTS ====================
    let documentContext = '';
    if (includeDocuments && documentIds.length > 0) {
      try {
        const docResults = await DocumentService.queryDocuments({
          userId,
          question: message,
          documentIds,
          semanticSearch: true,
          limit: 5
        });
        
        if (docResults.answer && docResults.confidence > 0.6) {
          documentContext = `\nRelevant document information:\n${docResults.answer}\n\nSources: ${docResults.sources?.join(', ') || 'Documents'}`;
        }
      } catch (docError) {
        console.warn('[ChatbotService] Document query failed:', docError.message);
      }
    }

    // ==================== STEP 3: CHECK TASKS ====================
    let taskContext = '';
    const isTaskQuery = this.isTaskRelatedQuery(message);
    
    if (isTaskQuery) {
      try {
        const tasks = await TaskService.getUserTasks(userId, { limit: 10 });
        if (tasks && tasks.length > 0) {
          const taskSummary = tasks
            .filter(t => t.status !== 'completed')
            .slice(0, 5)
            .map(t => `- ${t.title} (${t.status}, Priority: ${t.priority})`)
            .join('\n');
          
          taskContext = `\nUser's current tasks:\n${taskSummary}`;
        }
      } catch (taskError) {
        console.warn('[ChatbotService] Task context fetch failed:', taskError.message);
      }
    }

    // ==================== STEP 4: CHECK FOR SYSTEM QUERIES ====================
    const systemResponse = this.handleSystemQuery(message, session);
    if (systemResponse) {
      return systemResponse;
    }

    // ==================== STEP 5: GENERATE AI RESPONSE ====================
    // Build enhanced prompt with all available context
    const prompt = this.buildEnhancedPrompt({
      message,
      history,
      context: fullContext,
      documentContext,
      taskContext,
      userRole: session.userRole,
      knowledgeBaseContext: kbResponse ? `Knowledge Base Info: ${kbResponse.answer.substring(0, 500)}...` : '',
      hasKnowledgeBase: !!kbResponse
    });

    try {
      // Generate response using the new API
      const text = await this.generateContent(prompt);

      // Parse response for structured data
      const structuredResponse = this.parseEnhancedResponse(text, {
        hasDocumentContext: !!documentContext,
        hasTaskContext: !!taskContext,
        hasKnowledgeBase: !!kbResponse
      });

      // Update conversation history
      history.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: {
          queryType: this.determineQueryType(message),
          hasDocuments: includeDocuments,
          hasTasks: isTaskQuery
        }
      });
      
      history.push({
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString(),
        structured: structuredResponse,
        metadata: {
          responseType: structuredResponse.type,
          confidence: structuredResponse.confidence || 0.9,
          sourcesUsed: structuredResponse.sources || []
        }
      });

      // Keep history limited
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      this.conversationHistory.set(sessionId, history);

      return {
        text,
        type: structuredResponse.type || 'text',
        sources: structuredResponse.sources || [],
        suggestedActions: this.generateSuggestedActions(message, structuredResponse),
        confidence: structuredResponse.confidence || 0.8,
        personalized: !!(taskContext || documentContext || kbResponse),
        metadata: {
          responseTime: Date.now(),
          queryComplexity: this.assessQueryComplexity(message),
          contextUsed: {
            documents: !!documentContext,
            tasks: !!taskContext,
            knowledgeBase: !!kbResponse
          }
        }
      };

    } catch (error) {
      console.error('[ChatbotService] Gemini API error:', error.message);
      
      // Fallback response with knowledge base suggestion
      let fallbackText = "I apologize, but I'm having trouble processing your request right now. ";
      
      if (kbResponse) {
        fallbackText += "Based on our knowledge base, here's what I found earlier: " + kbResponse.answer.substring(0, 300) + "...";
      } else {
        fallbackText += "Please try rephrasing your question or check our knowledge base for related information.";
      }
      
      return {
        text: fallbackText,
        type: 'fallback',
        confidence: 0.3,
        personalized: false,
        suggestedActions: ['Try rephrasing', 'Check knowledge base', 'Contact support']
      };
    }
  }

  // ==================== KNOWLEDGE BASE INTEGRATION METHODS ====================

  // Get answer from knowledge base
  async getKnowledgeBaseAnswer(question, userId, companyId, userRole) {
    try {
      // First, search knowledge base
      const searchResult = await KnowledgeBaseService.search({
        query: question,
        userId,
        companyId,
        userRole,
        limit: 3
      });

      if (searchResult.results.length === 0) {
        return null;
      }

      // Check if we have a direct match
      const directMatch = searchResult.results.find(r => 
        r.relevance > 0.9 || 
        r.title.toLowerCase().includes(question.toLowerCase().substring(0, 20))
      );

      if (directMatch) {
        // Get full entry
        const entryResult = await KnowledgeBaseService.getEntry(
          directMatch.id,
          userId,
          companyId,
          userRole
        );

        if (entryResult.success) {
          return {
            answer: entryResult.entry.content,
            sources: [directMatch.title],
            confidence: directMatch.relevance || 0.95,
            entryIds: [directMatch.id],
            sourceType: 'knowledge_base_direct'
          };
        }
      }

      // Prepare context from multiple knowledge base entries
      const kbContext = searchResult.results
        .slice(0, 3)
        .map(entry => `From "${entry.title}":\n${entry.summary}`)
        .join('\n\n');

      // Generate synthesized answer using AI
      const prompt = `
Based on the company knowledge base entries, answer the user's question.

Knowledge Base Entries:
${kbContext}

User Question: "${question}"

Instructions:
1. Answer based on the knowledge base entries above
2. Cite which entry(s) you're using
3. If the knowledge base doesn't fully answer, acknowledge this
4. Keep the answer concise and helpful
5. Format: Main answer first, then citations

Answer:`;

      const answer = await this.generateContent(prompt);

      return {
        answer,
        sources: searchResult.results.map(r => r.title),
        confidence: searchResult.results[0].relevance || 0.85,
        entryIds: searchResult.results.map(r => r.id),
        sourceType: 'knowledge_base_synthesized'
      };

    } catch (error) {
      console.warn('[ChatbotService] Knowledge base answer error:', error.message);
      return null;
    }
  }

  // Add to knowledge base from conversation
  async addConversationToKnowledgeBase(sessionId, userId, companyId, userRole, entryTitle) {
    try {
      const history = this.conversationHistory.get(sessionId);
      if (!history || history.length === 0) {
        throw new Error('No conversation history to save');
      }

      // Extract conversation summary
      const conversationText = history
        .slice(-10) // Last 10 messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate a summary of the conversation
      const summaryPrompt = `
Summarize the following conversation into a knowledge base entry:

${conversationText}

Provide:
1. A clear title (suggested: "${entryTitle || 'Conversation Summary'}")
2. Key points discussed
3. Solutions or recommendations provided
4. Any important context

Format as a knowledge base entry with sections.`;

      const content = await this.generateContent(summaryPrompt);

      // Extract title from response or use provided
      const titleMatch = content.match(/Title:\s*(.+)/i) || 
                        content.match(/#\s*(.+)/);
      const title = titleMatch ? titleMatch[1] : (entryTitle || 'Conversation Summary');

      // Add to knowledge base
      const kbResult = await KnowledgeBaseService.addEntry({
        title,
        content,
        category: 'conversations',
        tags: ['chatbot', 'conversation', userRole, `user_${userId}`],
        isPublic: userRole === 'admin', // Only admins can create public entries
        addedBy: userId,
        companyId
      });

      return {
        success: true,
        message: 'Conversation saved to knowledge base',
        entry: kbResult.entry,
        conversationSnippet: conversationText.substring(0, 200) + '...'
      };

    } catch (error) {
      console.error('[ChatbotService] Save conversation to KB error:', error.message);
      throw new Error(`Failed to save conversation to knowledge base: ${error.message}`);
    }
  }

  // Search knowledge base with AI-enhanced results
  async enhancedKnowledgeBaseSearch({ query, userId, companyId, userRole, limit = 5 }) {
    try {
      // First, get search results
      const searchResult = await KnowledgeBaseService.search({
        query,
        userId,
        companyId,
        userRole,
        limit: limit * 2 // Get more results for AI processing
      });

      if (searchResult.results.length === 0) {
        return {
          success: true,
          results: [],
          aiSummary: 'No relevant knowledge base entries found.',
          suggestions: ['Consider adding this information to the knowledge base']
        };
      }

      // Generate AI summary of search results
      const resultsContext = searchResult.results
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.title}: ${r.summary}`)
        .join('\n\n');

      const summaryPrompt = `
Based on the following knowledge base search results, provide:
1. A brief summary of what was found
2. The most relevant entries for the query: "${query}"
3. Any gaps in the knowledge base

Search Results:
${resultsContext}

Summary:`;

      const aiSummary = await this.generateContent(summaryPrompt);

      // Identify gaps and suggest new entries
      const gaps = this.identifyKnowledgeGaps(query, searchResult.results);

      return {
        success: true,
        results: searchResult.results.slice(0, limit),
        aiSummary,
        totalFound: searchResult.results.length,
        searchMethod: searchResult.searchMethod,
        knowledgeGaps: gaps,
        suggestions: gaps.length > 0 ? [
          'Consider creating new knowledge base entries for identified gaps',
          'Update existing entries with missing information'
        ] : ['All relevant information appears to be covered']
      };

    } catch (error) {
      console.error('[ChatbotService] Enhanced KB search error:', error.message);
      
      // Fallback to regular search
      return await KnowledgeBaseService.search({
        query,
        userId,
        companyId,
        userRole,
        limit
      });
    }
  }

  // ==================== TASK-INTEGRATED METHODS ====================

  // Task-specific query processing with knowledge base fallback
  async processTaskQuery({ userId, question, tasks, userContext }) {
    // First, check if this is a general task question that might be in KB
    const kbResponse = await this.getKnowledgeBaseAnswer(
      question,
      userId,
      userContext.companyId,
      userContext.userRole // Corrected from 'user' to 'userContext.userRole'
    );

    if (kbResponse && kbResponse.confidence > 0.7) {
      return {
        type: 'knowledge_base',
        answer: kbResponse.answer,
        sources: kbResponse.sources
      };
    }

    // If not in KB, proceed with task-specific logic
    const taskContext = tasks
      .slice(0, 5)
      .map(t => `- ${t.title} (Status: ${t.status}, Due: ${t.dueDate || 'N/A'})`)
      .join('\n');

    const prompt = `
You are a task management assistant. Based on the user's tasks and their question, provide a helpful response.

User's Tasks:
${taskContext}

User's Question: "${question}"

Analyze the question and tasks to provide a direct answer, create a new task, or update an existing one.
Response:`;

    const response = await this.generateContent(prompt);
    return {
      type: 'task_response',
      answer: response
    };
  }

  // ==================== HELPER & UTILITY METHODS ====================

  // Determine query type
  determineQueryType(message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('task') || lowerMsg.includes('todo') || lowerMsg.includes('deadline')) {
      return 'task_related';
    }
    if (lowerMsg.includes('search') || lowerMsg.includes('find') || lowerMsg.includes('what is')) {
      return 'information_retrieval';
    }
    return 'general_conversation';
  }

  // Check if a query is task-related
  isTaskRelatedQuery(message) {
    const keywords = ['task', 'todo', 'assign', 'complete', 'deadline', 'due date', 'my work'];
    return keywords.some(kw => message.toLowerCase().includes(kw));
  }

  // Handle system-level queries
  handleSystemQuery(message, session) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg === 'reset chat' || lowerMsg === 'clear history') {
      this.conversationHistory.set(session.id, []);
      return {
        text: 'Conversation history has been cleared.',
        type: 'system',
        personalized: false
      };
    }
    return null;
  }

  // Build the enhanced prompt for the AI model
  buildEnhancedPrompt({ message, history, context, documentContext, taskContext, userRole, knowledgeBaseContext, hasKnowledgeBase }) {
    const historyString = history
      .slice(-10)
      .map(h => `${h.role}: ${h.content}`)
      .join('\n');

    return `
You are PrismAlly, an advanced AI assistant for employees. Your role is to be helpful, accurate, and context-aware.

**User Information:**
- Role: ${userRole}
- Company ID: ${context.companyId}

**Conversation History:**
${historyString}

**Current Context:**
- Current Time: ${context.currentTime}
${knowledgeBaseContext ? `\n**Knowledge Base Context:**\n${knowledgeBaseContext}` : ''}
${documentContext ? `\n**Document Context:**\n${documentContext}` : ''}
${taskContext ? `\n**Task Context:**\n${taskContext}` : ''}

**User's New Message:** "${message}"

**Instructions:**
1.  **Prioritize Knowledge Base:** If a high-confidence answer from the knowledge base was found (${hasKnowledgeBase}), use it as the primary source.
2.  **Synthesize Information:** Combine information from the conversation history, documents, tasks, and knowledge base to form a comprehensive answer.
3.  **Be Structured:** Provide clear, concise answers. Use lists or bold text for clarity.
4.  **Action-Oriented:** If the user is asking about tasks, be direct and helpful.
5.  **Cite Sources:** If you use information from documents or the knowledge base, mention it (e.g., "According to the 'Onboarding Guide' document...").

**Response:**
`;
  }

  // Parse the AI's response to extract structured data
  parseEnhancedResponse(text, { hasDocumentContext, hasTaskContext, hasKnowledgeBase }) {
    let type = 'text';
    if (hasTaskContext) type = 'task_response';
    else if (hasDocumentContext) type = 'document_response';
    else if (hasKnowledgeBase) type = 'knowledge_base_response';

    // Simple source extraction (can be improved with more complex regex)
    const sources = (text.match(/Source(?:s)?: (.+)/) || [])[1]?.split(', ') || [];

    return {
      type,
      sources,
      confidence: 0.85 // Default confidence, can be refined
    };
  }

  // Generate suggested actions based on the response
  generateSuggestedActions(message, structuredResponse) {
    const actions = new Set();
    if (structuredResponse.type === 'task_response') {
      actions.add('View all my tasks');
      actions.add('Create a new task');
    }
    if (structuredResponse.type.includes('document')) {
      actions.add('Search for other documents');
    }
    if (structuredResponse.type.includes('knowledge_base')) {
      actions.add('Search knowledge base again');
      actions.add('Is this information helpful?');
    }
    actions.add('Ask a follow-up question');
    return Array.from(actions).slice(0, 3);
  }

  // Assess query complexity
  assessQueryComplexity(message) {
    const words = message.split(' ').length;
    if (words > 15) return 'high';
    if (words > 7) return 'medium';
    return 'low';
  }

  // Identify knowledge gaps
  identifyKnowledgeGaps(query, searchResults) {
    const gaps = [];
    if (searchResults.length === 0) {
      gaps.push(`No information found for query: "${query}"`);
    } else {
      const totalRelevance = searchResults.reduce((acc, r) => acc + (r.relevance || 0), 0);
      if (totalRelevance / searchResults.length < 0.5) {
        gaps.push(`Low-relevance results for query: "${query}". Existing content may not be a good match.`);
      }
    }
    return gaps;
  }
}

export default new ChatbotService();