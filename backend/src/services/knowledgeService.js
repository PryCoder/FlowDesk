import { GoogleGenerativeAI } from '@google/generative-ai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

class KnowledgeBaseService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 512,
      }
    });
    
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'embedding-001'
    });
    
    // In-memory knowledge base storage
    // For production, use database + vector database (Pinecone/ChromaDB/Qdrant)
    this.knowledgeBase = new Map(); // Map<companyId, Map<entryId, entry>>
    this.vectorStores = new Map(); // Map<companyId, vectorStore>
  }

  // Add entry to knowledge base
  async addEntry({ title, content, category = 'general', tags = [], isPublic = true, addedBy, companyId }) {
    try {
      console.log(`[KnowledgeBaseService] Adding entry: ${title} for company: ${companyId}`);
      
      const entryId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      // Create knowledge entry
      const entry = {
        id: entryId,
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [tags],
        isPublic,
        addedBy,
        companyId,
        createdAt: timestamp,
        updatedAt: timestamp,
        viewCount: 0,
        helpfulCount: 0,
        summary: await this.generateSummary(content, 200),
        vectorized: false
      };
      
      // Store in memory
      if (!this.knowledgeBase.has(companyId)) {
        this.knowledgeBase.set(companyId, new Map());
      }
      
      this.knowledgeBase.get(companyId).set(entryId, entry);
      
      // Add to vector store for semantic search
      await this.addToVectorStore(entry, companyId);
      
      return {
        success: true,
        entry: {
          id: entryId,
          title,
          category,
          tags: entry.tags,
          summary: entry.summary,
          createdAt: timestamp,
          addedBy,
          isPublic
        }
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Add entry error:', error.message);
      throw new Error(`Failed to add knowledge base entry: ${error.message}`);
    }
  }

  // Search knowledge base
  async search({ query, category, userId, companyId, userRole, limit = 10 }) {
    try {
      console.log(`[KnowledgeBaseService] Searching knowledge base: "${query}" for user: ${userId}`);
      
      let results = [];
      
      // Get company knowledge base
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        return {
          success: true,
          results: [],
          query,
          totalFound: 0
        };
      }
      
      // Convert Map to array
      const allEntries = Array.from(companyKB.values());
      
      // Filter by visibility
      const accessibleEntries = allEntries.filter(entry => 
        entry.isPublic || 
        entry.addedBy === userId || 
        userRole === 'admin' || 
        (entry.tags.includes('admin') && userRole === 'admin')
      );
      
      // Filter by category if specified
      const filteredEntries = category
        ? accessibleEntries.filter(entry => entry.category === category)
        : accessibleEntries;
      
      // Perform search
      if (query) {
        // Try semantic search first
        const semanticResults = await this.semanticSearch(query, filteredEntries, companyId, limit);
        
        if (semanticResults.length > 0) {
          results = semanticResults;
        } else {
          // Fallback to keyword search
          results = this.keywordSearch(query, filteredEntries, limit);
        }
      } else {
        // Return all filtered entries sorted by recency
        results = filteredEntries
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, limit);
      }
      
      // Increment view count for viewed entries
      results.forEach(entry => {
        entry.viewCount = (entry.viewCount || 0) + 1;
        companyKB.set(entry.id, entry);
      });
      
      return {
        success: true,
        results: results.map(entry => ({
          id: entry.id,
          title: entry.title,
          summary: entry.summary,
          category: entry.category,
          tags: entry.tags,
          addedBy: entry.addedBy,
          createdAt: entry.createdAt,
          viewCount: entry.viewCount,
          helpfulCount: entry.helpfulCount,
          relevance: entry.relevance || 0.8
        })),
        query,
        totalFound: results.length,
        searchMethod: results.length > 0 && results[0].relevance ? 'semantic' : 'keyword'
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Search error:', error.message);
      
      // Return empty results on error
      return {
        success: true,
        results: [],
        query,
        totalFound: 0,
        error: error.message
      };
    }
  }

  // Get entry by ID
  async getEntry(entryId, userId, companyId, userRole) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        throw new Error('Knowledge base not found for company');
      }
      
      const entry = companyKB.get(entryId);
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Check access
      if (!entry.isPublic && entry.addedBy !== userId && userRole !== 'admin') {
        throw new Error('Access denied to this entry');
      }
      
      // Increment view count
      entry.viewCount = (entry.viewCount || 0) + 1;
      companyKB.set(entryId, entry);
      
      return {
        success: true,
        entry: {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags,
          isPublic: entry.isPublic,
          addedBy: entry.addedBy,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          viewCount: entry.viewCount,
          helpfulCount: entry.helpfulCount,
          vectorized: entry.vectorized
        }
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Get entry error:', error.message);
      throw new Error(`Failed to get knowledge base entry: ${error.message}`);
    }
  }

  // Update entry
  async updateEntry(entryId, updates, userId, companyId, userRole) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        throw new Error('Knowledge base not found for company');
      }
      
      const entry = companyKB.get(entryId);
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Check permissions
      if (entry.addedBy !== userId && userRole !== 'admin') {
        throw new Error('Only the creator or admin can update this entry');
      }
      
      // Apply updates
      const updatedEntry = {
        ...entry,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Update vector store if content changed
      if (updates.content && updates.content !== entry.content) {
        updatedEntry.summary = await this.generateSummary(updates.content, 200);
        await this.updateVectorStore(updatedEntry, companyId);
        updatedEntry.vectorized = true;
      }
      
      companyKB.set(entryId, updatedEntry);
      
      return {
        success: true,
        entry: {
          id: updatedEntry.id,
          title: updatedEntry.title,
          category: updatedEntry.category,
          tags: updatedEntry.tags,
          updatedAt: updatedEntry.updatedAt
        }
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Update entry error:', error.message);
      throw new Error(`Failed to update knowledge base entry: ${error.message}`);
    }
  }

  // Delete entry
  async deleteEntry(entryId, userId, companyId, userRole) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        throw new Error('Knowledge base not found for company');
      }
      
      const entry = companyKB.get(entryId);
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Check permissions
      if (entry.addedBy !== userId && userRole !== 'admin') {
        throw new Error('Only the creator or admin can delete this entry');
      }
      
      // Remove from vector store
      await this.removeFromVectorStore(entryId, companyId);
      
      // Remove from knowledge base
      companyKB.delete(entryId);
      
      return {
        success: true,
        message: 'Entry deleted successfully',
        deletedEntry: {
          id: entryId,
          title: entry.title
        }
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Delete entry error:', error.message);
      throw new Error(`Failed to delete knowledge base entry: ${error.message}`);
    }
  }

  // Mark entry as helpful
  async markAsHelpful(entryId, userId, companyId) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        throw new Error('Knowledge base not found for company');
      }
      
      const entry = companyKB.get(entryId);
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Track who found it helpful (optional)
      entry.helpfulCount = (entry.helpfulCount || 0) + 1;
      entry.helpfulUsers = entry.helpfulUsers || [];
      if (!entry.helpfulUsers.includes(userId)) {
        entry.helpfulUsers.push(userId);
      }
      
      companyKB.set(entryId, entry);
      
      return {
        success: true,
        helpfulCount: entry.helpfulCount,
        message: 'Thank you for your feedback!'
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Mark helpful error:', error.message);
      throw new Error(`Failed to mark entry as helpful: ${error.message}`);
    }
  }

  // Get knowledge base statistics
  async getStats(companyId, userRole) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        return {
          success: true,
          stats: {
            totalEntries: 0,
            categories: {},
            topContributors: [],
            totalViews: 0,
            mostHelpful: []
          }
        };
      }
      
      const entries = Array.from(companyKB.values());
      
      // Calculate category distribution
      const categories = {};
      entries.forEach(entry => {
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      });
      
      // Find top contributors
      const contributorMap = {};
      entries.forEach(entry => {
        contributorMap[entry.addedBy] = (contributorMap[entry.addedBy] || 0) + 1;
      });
      
      const topContributors = Object.entries(contributorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));
      
      // Find most helpful entries
      const mostHelpful = entries
        .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0))
        .slice(0, 5)
        .map(entry => ({
          id: entry.id,
          title: entry.title,
          helpfulCount: entry.helpfulCount || 0
        }));
      
      // Calculate total views
      const totalViews = entries.reduce((sum, entry) => sum + (entry.viewCount || 0), 0);
      
      return {
        success: true,
        stats: {
          totalEntries: entries.length,
          categories,
          topContributors,
          totalViews,
          mostHelpful,
          publicEntries: entries.filter(e => e.isPublic).length,
          lastUpdated: entries.length > 0 
            ? new Date(Math.max(...entries.map(e => new Date(e.updatedAt).getTime()))).toISOString()
            : null
        }
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Get stats error:', error.message);
      throw new Error(`Failed to get knowledge base statistics: ${error.message}`);
    }
  }

  // Get suggestions based on user activity
  async getSuggestions(userId, companyId, userRole, limit = 5) {
    try {
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        return {
          success: true,
          suggestions: []
        };
      }
      
      const entries = Array.from(companyKB.values())
        .filter(entry => entry.isPublic || entry.addedBy === userId || userRole === 'admin');
      
      // Simple suggestion logic
      // In production, implement ML-based recommendations
      const suggestions = entries
        .sort((a, b) => {
          // Sort by helpfulness and recency
          const scoreA = (a.helpfulCount || 0) * 2 + (new Date(a.updatedAt).getTime() / 10000000000);
          const scoreB = (b.helpfulCount || 0) * 2 + (new Date(b.updatedAt).getTime() / 10000000000);
          return scoreB - scoreA;
        })
        .slice(0, limit)
        .map(entry => ({
          id: entry.id,
          title: entry.title,
          reason: `${entry.helpfulCount || 0} people found this helpful`,
          category: entry.category
        }));
      
      return {
        success: true,
        suggestions,
        basedOn: 'popularity and recency'
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Get suggestions error:', error.message);
      return {
        success: true,
        suggestions: [],
        error: error.message
      };
    }
  }

  // ==================== PRIVATE METHODS ====================

  // Add entry to vector store for semantic search
  async addToVectorStore(entry, companyId) {
    try {
      if (!this.vectorStores.has(companyId)) {
        this.vectorStores.set(companyId, await MemoryVectorStore.fromTexts(
          [],
          [],
          this.embeddings
        ));
      }
      
      const vectorStore = this.vectorStores.get(companyId);
      
      // Create document for vector store
      const doc = new Document({
        pageContent: `${entry.title}\n\n${entry.content}\n\n${entry.tags.join(' ')}`,
        metadata: {
          id: entry.id,
          title: entry.title,
          category: entry.category,
          tags: entry.tags,
          addedBy: entry.addedBy,
          isPublic: entry.isPublic
        }
      });
      
      // Add to vector store
      await vectorStore.addDocuments([doc]);
      
      entry.vectorized = true;
      
    } catch (error) {
      console.warn('[KnowledgeBaseService] Vector store add error:', error.message);
      entry.vectorized = false;
    }
  }

  // Update entry in vector store
  async updateVectorStore(entry, companyId) {
    try {
      // First remove old entry
      await this.removeFromVectorStore(entry.id, companyId);
      
      // Then add updated entry
      await this.addToVectorStore(entry, companyId);
      
    } catch (error) {
      console.warn('[KnowledgeBaseService] Vector store update error:', error.message);
    }
  }

  // Remove entry from vector store
  async removeFromVectorStore(entryId, companyId) {
    try {
      // Note: MemoryVectorStore doesn't have delete method
      // For production, use a vector DB that supports deletion
      console.log(`[KnowledgeBaseService] Entry ${entryId} marked for deletion from vector store`);
      
    } catch (error) {
      console.warn('[KnowledgeBaseService] Vector store remove error:', error.message);
    }
  }

  // Semantic search using vector embeddings
  async semanticSearch(query, entries, companyId, limit) {
    try {
      const vectorStore = this.vectorStores.get(companyId);
      if (!vectorStore) {
        return [];
      }
      
      const results = await vectorStore.similaritySearch(query, limit * 2);
      
      // Map results to entries
      return results
        .map(result => {
          const entry = entries.find(e => e.id === result.metadata.id);
          if (entry) {
            return {
              ...entry,
              relevance: result.score || 0.8,
              matchedContent: result.pageContent.substring(0, 200) + '...'
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, limit);
      
    } catch (error) {
      console.warn('[KnowledgeBaseService] Semantic search error:', error.message);
      return [];
    }
  }

  // Keyword search (fallback)
  keywordSearch(query, entries, limit) {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    return entries
      .map(entry => {
        const searchText = `${entry.title} ${entry.content} ${entry.tags.join(' ')} ${entry.category}`.toLowerCase();
        
        let score = 0;
        queryWords.forEach(word => {
          if (searchText.includes(word)) {
            score += 1;
          }
        });
        
        // Title matches are more important
        if (entry.title.toLowerCase().includes(lowerQuery)) {
          score += 3;
        }
        
        return {
          ...entry,
          relevance: score / (queryWords.length + 3)
        };
      })
      .filter(entry => entry.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // Generate summary using AI
  async generateSummary(content, maxLength) {
    try {
      if (content.length <= maxLength) {
        return content;
      }
      
      const prompt = `
Summarize the following text in ${maxLength} characters or less:

${content.substring(0, 5000)}

Summary:`;

      const result = await this.model.generateContent(prompt);
      const summary = result.response.text().trim();
      
      return summary.length > maxLength 
        ? summary.substring(0, maxLength) + '...'
        : summary;
        
    } catch (error) {
      console.warn('[KnowledgeBaseService] Summary generation failed:', error.message);
      return content.substring(0, maxLength) + '...';
    }
  }

  // Export knowledge base (for backup or migration)
  async exportKnowledgeBase(companyId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw new Error('Only admins can export knowledge base');
      }
      
      const companyKB = this.knowledgeBase.get(companyId);
      if (!companyKB) {
        throw new Error('Knowledge base not found for company');
      }
      
      const entries = Array.from(companyKB.values());
      
      return {
        success: true,
        exportedAt: new Date().toISOString(),
        companyId,
        entryCount: entries.length,
        entries: entries.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags,
          isPublic: entry.isPublic,
          addedBy: entry.addedBy,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }))
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Export error:', error.message);
      throw new Error(`Failed to export knowledge base: ${error.message}`);
    }
  }

  // Import knowledge base
  async importKnowledgeBase(companyId, data, userId, userRole) {
    try {
      if (userRole !== 'admin') {
        throw new Error('Only admins can import knowledge base');
      }
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid import data format');
      }
      
      const importedEntries = [];
      const errors = [];
      
      for (const entryData of data.entries) {
        try {
          const result = await this.addEntry({
            title: entryData.title,
            content: entryData.content,
            category: entryData.category || 'general',
            tags: entryData.tags || [],
            isPublic: entryData.isPublic !== false,
            addedBy: userId, // Current user becomes the creator
            companyId
          });
          
          importedEntries.push(result.entry);
        } catch (error) {
          errors.push({
            title: entryData.title,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        importedCount: importedEntries.length,
        errorCount: errors.length,
        importedEntries: importedEntries.slice(0, 10), // First 10 for preview
        errors: errors.slice(0, 10) // First 10 errors for review
      };
      
    } catch (error) {
      console.error('[KnowledgeBaseService] Import error:', error.message);
      throw new Error(`Failed to import knowledge base: ${error.message}`);
    }
  }
}

export default new KnowledgeBaseService();