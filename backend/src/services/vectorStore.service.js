// src/services/vectorStore.service.js
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export class VectorStoreService {
  constructor(storeType = 'memory') {
    this.storeType = storeType;
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small"
    });
    this.stores = new Map();
    
    // Initialize Supabase client for vector storage
    if (storeType === 'supabase') {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  async createStore(documents, storeId = 'default', metadata = {}) {
    let vectorStore;
    
    try {
      switch (this.storeType) {
        case 'supabase':
          // Create Supabase vector store
          vectorStore = await SupabaseVectorStore.fromDocuments(
            documents,
            this.embeddings,
            {
              client: this.supabase,
              tableName: 'document_vectors',
              queryName: 'match_documents'
            }
          );
          break;
          
        case 'memory':
        default:
          vectorStore = await MemoryVectorStore.fromDocuments(
            documents,
            this.embeddings
          );
          break;
      }
      
      this.stores.set(storeId, {
        store: vectorStore,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          documentCount: documents.length,
          storeType: this.storeType
        }
      });
      
      console.log(`✅ Vector store created: ${storeId} with ${documents.length} documents`);
      return vectorStore;
      
    } catch (error) {
      console.error('Error creating vector store:', error);
      throw error;
    }
  }

  async getStore(storeId = 'default') {
    return this.stores.get(storeId)?.store || null;
  }

  async addDocuments(documents, storeId = 'default') {
    try {
      const storeData = this.stores.get(storeId);
      
      if (!storeData) {
        return this.createStore(documents, storeId);
      }
      
      await storeData.store.addDocuments(documents);
      
      // Update metadata
      storeData.metadata.documentCount += documents.length;
      storeData.metadata.updatedAt = new Date().toISOString();
      
      console.log(`✅ Added ${documents.length} documents to store: ${storeId}`);
      return storeData.store;
      
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async similaritySearch(query, k = 4, storeId = 'default', filter = {}) {
    try {
      const storeData = this.stores.get(storeId);
      
      if (!storeData) {
        console.warn(`Store ${storeId} not found`);
        return [];
      }
      
      const results = await storeData.store.similaritySearch(query, k, filter);
      
      // Add store metadata to results
      return results.map(result => ({
        ...result,
        metadata: {
          ...result.metadata,
          storeId,
          searchScore: result.metadata?._distance || 1.0
        }
      }));
      
    } catch (error) {
      console.error('Error performing similarity search:', error);
      return [];
    }
  }

  async similaritySearchWithScore(query, k = 4, storeId = 'default') {
    try {
      const storeData = this.stores.get(storeId);
      
      if (!storeData) {
        return [];
      }
      
      return await storeData.store.similaritySearchWithScore(query, k);
      
    } catch (error) {
      console.error('Error performing similarity search with score:', error);
      return [];
    }
  }

  async getStoreInfo(storeId = 'default') {
    const storeData = this.stores.get(storeId);
    
    if (!storeData) {
      return null;
    }
    
    return {
      storeId,
      ...storeData.metadata,
      storeType: this.storeType
    };
  }

  async getAllStoresInfo() {
    const storesInfo = [];
    
    for (const [storeId, storeData] of this.stores) {
      storesInfo.push({
        storeId,
        ...storeData.metadata
      });
    }
    
    return storesInfo;
  }

  async deleteStore(storeId) {
    try {
      const deleted = this.stores.delete(storeId);
      
      if (deleted) {
        console.log(`✅ Deleted vector store: ${storeId}`);
        
        // If using Supabase, clean up the table
        if (this.storeType === 'supabase' && this.supabase) {
          await this.supabase
            .from('document_vectors')
            .delete()
            .eq('metadata->>storeId', storeId);
        }
      }
      
      return deleted;
    } catch (error) {
      console.error('Error deleting vector store:', error);
      throw error;
    }
  }

  async searchAcrossAllStores(query, k = 4) {
    try {
      const allResults = [];
      
      for (const [storeId, storeData] of this.stores) {
        const results = await this.similaritySearch(query, k, storeId);
        allResults.push(...results.map(result => ({
          ...result,
          metadata: {
            ...result.metadata,
            storeId
          }
        })));
      }
      
      // Sort by relevance score
      allResults.sort((a, b) => {
        const scoreA = a.metadata.searchScore || 0;
        const scoreB = b.metadata.searchScore || 0;
        return scoreA - scoreB; // Lower score = better match
      });
      
      return allResults.slice(0, k);
    } catch (error) {
      console.error('Error searching across all stores:', error);
      return [];
    }
  }

  async exportStore(storeId) {
    try {
      const storeData = this.stores.get(storeId);
      
      if (!storeData) {
        throw new Error(`Store ${storeId} not found`);
      }
      
      // For memory stores, we can export the documents
      const documents = await storeData.store.similaritySearch('', 1000); // Get all documents
      
      return {
        storeId,
        storeType: this.storeType,
        documents: documents.map(doc => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata
        })),
        metadata: storeData.metadata,
        exportedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error exporting vector store:', error);
      throw error;
    }
  }

  async importStore(data) {
    try {
      const { storeId, documents, metadata } = data;
      
      if (!storeId || !documents || !Array.isArray(documents)) {
        throw new Error('Invalid store data format');
      }
      
      // Convert back to Document objects
      const langchainDocs = documents.map(doc => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata
      }));
      
      // Create new store with imported documents
      await this.createStore(langchainDocs, storeId, {
        ...metadata,
        importedAt: new Date().toISOString()
      });
      
      console.log(`✅ Imported vector store: ${storeId} with ${documents.length} documents`);
      return true;
      
    } catch (error) {
      console.error('Error importing vector store:', error);
      throw error;
    }
  }
}