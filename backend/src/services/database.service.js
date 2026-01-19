// src/services/database.service.js
import { createClient } from '@supabase/supabase-js';
import config from "../../rec/index.js";

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.supabase) {
      return; // Already initialized
    }

    if (this.initializationPromise) {
      return this.initializationPromise; // Initialization in progress
    }

    this.initializationPromise = (async () => {
      try {
        const supabaseUrl = config.supabase.url;
        const supabaseKey = config.supabase.key;

        console.log('🔍 Checking Supabase environment variables...');
        console.log(`SUPABASE_URL: ${supabaseUrl ? 'Set' : 'NOT SET'}`);
        console.log(`SUPABASE_KEY: ${supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'NOT SET'}`);

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase URL and Key must be provided in environment variables.');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Database service initialized successfully.');
      } catch (error) {
        console.error('❌ Failed to initialize Database service:', error);
        this.supabase = null;
        throw error; // Re-throw so calling code knows initialization failed
      }
    })();

    return this.initializationPromise;
  }

  async saveChatMessage(messageData) {
    try {
      // Map camelCase to snake_case for database
      // Only include fields that exist in your schema
      const dbData = {
        user_id: messageData.userId,
        session_id: messageData.sessionId,
        conversation_id: messageData.conversation_id || messageData.conversationId, // Support both
        role: messageData.role,
        content: messageData.content,
        metadata: messageData.metadata
      };

      // Only add optional fields if they exist and have values
      if (messageData.knowledgeBaseId) {
        dbData.knowledge_base_id = messageData.knowledgeBaseId;
      }
      
      // Remove document_ids if your table doesn't have this column
      // If you need it, you'll need to add it to your database schema first
      // if (messageData.documentIds && messageData.documentIds.length > 0) {
      //   dbData.document_ids = messageData.documentIds;
      // }

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error saving chat message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveChatMessage:', error);
      throw error;
    }
  }

  async getChatHistory(userId, options = {}) {
    try {
      let query = this.supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId);

      if (options.conversationId) {
        query = query.eq('conversation_id', options.conversationId); // Use snake_case
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
     if (!this.supabase) throw new Error('Database service not initialized.');
     // Dummy implementation
     return { total_messages: 0, total_conversations: 0 };
  }

  async saveDocument(documentData) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    const { data, error } = await this.supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateDocumentProcessing(documentId, updateData) {
     if (!this.supabase) throw new Error('Database service not initialized.');
     const { data, error } = await this.supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);
    if (error) throw error;
    return data;
  }
  
  async getConversation(conversationId) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async saveSuggestions(suggestionData) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    // Dummy implementation
    return { success: true };
  }

  async getUserDocuments(userId, options = {}) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    
    try {
      let query = this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (options.fileType) {
        query = query.eq('file_type', options.fileType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  async checkHealth() {
    if (!this.supabase) return false;
    
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getTotalUsers() {
    if (!this.supabase) throw new Error('Database service not initialized.');
    
    try {
      const { count, error } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }

  async getTotalChatMessages() {
    if (!this.supabase) throw new Error('Database service not initialized.');
    
    try {
      const { count, error } = await this.supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting total chat messages:', error);
      return 0;
    }
  }

  async deleteConversation(conversationId, userId) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  async getSuggestions(conversationId) {
    if (!this.supabase) throw new Error('Database service not initialized.');
    
    try {
      const { data, error } = await this.supabase
        .from('suggestions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Initialize immediately (but don't await here, let it run in background)
databaseService.initialize().catch(err => {
  console.error('Critical: Database service failed to initialize on startup:', err);
});

export default databaseService;
