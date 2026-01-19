import pdfParse from 'pdf-parse';
import officeParser from 'officeparser';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

class DocumentService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'embedding-001'
    });
    
    // In-memory vector stores (for production, use Pinecone/ChromaDB)
    this.vectorStores = new Map();
  }

  // Process different document types
  async processDocument({ userId, companyId, filePath, originalName, mimeType, title, description, category, isPublic }) {
    try {
      console.log(`[DocumentService] Processing document: ${originalName}, Type: ${mimeType}`);
      
      // Read file
      const fileBuffer = await fs.readFile(filePath);
      
      let textContent = '';
      let metadata = {
        pageCount: 0,
        wordCount: 0,
        images: 0
      };

      // Process based on file type
      switch (mimeType) {
        case 'application/pdf':
          const pdfData = await pdfParse(fileBuffer);
          textContent = pdfData.text;
          metadata.pageCount = pdfData.numpages || 0;
          break;

        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': // PPTX
          const pptxData = await officeParser.parseOfficeAsync(filePath);
          textContent = pptxData;
          metadata.pageCount = this.extractSlideCount(textContent);
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
          const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
          textContent = docxResult.value;
          break;

        case 'text/plain':
          textContent = fileBuffer.toString('utf-8');
          break;

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Clean and process text
      textContent = this.cleanText(textContent);
      metadata.wordCount = this.countWords(textContent);

      // Generate summary using AI
      const summary = await this.generateSummary(textContent);

      // Create vector embeddings
      const vectorStore = await this.createVectorStore(textContent, {
        userId,
        companyId,
        documentId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        originalName,
        mimeType,
        category
      });

      // Store document metadata
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const document = {
        id: documentId,
        userId,
        companyId,
        title,
        description,
        originalName,
        mimeType,
        category,
        summary,
        textPreview: textContent.substring(0, 500) + '...',
        pageCount: metadata.pageCount,
        wordCount: metadata.wordCount,
        processedAt: new Date().toISOString(),
        vectorized: true,
        isPublic
      };

      // Store vector store reference
      this.vectorStores.set(documentId, vectorStore);

      // Save document metadata to database (you should implement this)
      // await this.saveDocumentMetadata(document);

      return document;

    } catch (error) {
      console.error('[DocumentService] Document processing error:', error.message);
      throw new Error(`Failed to process document: ${error.message}`);
    } finally {
      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('[DocumentService] Failed to cleanup file:', cleanupError.message);
      }
    }
  }

  // Query documents
  async queryDocuments({ userId, companyId, question, documentIds, semanticSearch = true, userRole, includeSource = true }) {
    try {
      console.log(`[DocumentService] Querying documents: ${question}`);
      
      let relevantDocs = [];
      
      if (documentIds.length > 0) {
        // Query specific documents
        for (const docId of documentIds) {
          const vectorStore = this.vectorStores.get(docId);
          if (vectorStore) {
            const results = await vectorStore.similaritySearch(question, 3);
            relevantDocs.push(...results.map(r => ({
              content: r.pageContent,
              metadata: r.metadata,
              score: r.score || 1.0
            })));
          }
        }
      } else {
        // Query all user's documents
        // You would implement fetching user's documents from database
        // For now, we'll return a generic response
      }

      if (relevantDocs.length === 0) {
        return {
          answer: "I couldn't find relevant information in the specified documents. Please try rephrasing your question or select different documents.",
          sources: [],
          confidence: 0.3,
          documentCount: 0,
          processingTime: 0
        };
      }

      // Prepare context from relevant documents
      const context = relevantDocs
        .slice(0, 5)
        .map(doc => `From "${doc.metadata.title}": ${doc.content.substring(0, 1000)}`)
        .join('\n\n');

      // Generate answer using AI
      const prompt = `
Based on the following document excerpts, answer the question.

Documents Context:
${context}

Question: ${question}

Instructions:
1. Answer based only on the provided documents
2. If the answer isn't in the documents, say so
3. Be precise and cite sources when possible
4. Format your answer clearly

Answer:`;

      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const answer = result.response.text();
      const processingTime = Date.now() - startTime;

      // Extract sources
      const sources = includeSource 
        ? [...new Set(relevantDocs.map(d => d.metadata.title))].slice(0, 3)
        : [];

      return {
        answer,
        sources,
        confidence: this.calculateConfidence(relevantDocs),
        documentCount: relevantDocs.length,
        processingTime
      };

    } catch (error) {
      console.error('[DocumentService] Document query error:', error.message);
      
      return {
        answer: "I encountered an error while searching the documents. Please try again.",
        sources: [],
        confidence: 0.1,
        documentCount: 0,
        processingTime: 0
      };
    }
  }

  // Helper methods
  async createVectorStore(text, metadata) {
    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(text);
    
    // Create documents with metadata
    const documents = chunks.map((chunk, index) => new Document({
      pageContent: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        chunkCount: chunks.length
      }
    }));

    // Create vector store
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );

    return vectorStore;
  }

  async generateSummary(text, maxLength = 500) {
    try {
      const prompt = `
Summarize the following document in ${maxLength} characters or less:

${text.substring(0, 10000)}

Summary:`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().substring(0, maxLength);
    } catch (error) {
      console.warn('[DocumentService] Summary generation failed:', error.message);
      return text.substring(0, maxLength) + '...';
    }
  }

  extractSlideCount(text) {
    const slideMatches = text.match(/slide\s*\d+/gi);
    return slideMatches ? slideMatches.length : 1;
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  calculateConfidence(relevantDocs) {
    if (relevantDocs.length === 0) return 0;
    
    const avgScore = relevantDocs.reduce((sum, doc) => sum + (doc.score || 1), 0) / relevantDocs.length;
    return Math.min(avgScore, 1);
  }

  // Get user documents (mock - implement database integration)
  async getUserDocuments(filters) {
    // This should query your database
    // Returning mock data for now
    return [
      {
        id: 'doc_1',
        title: 'Quarterly Report Q3',
        type: 'PDF',
        summary: 'Financial performance and projections',
        pageCount: 15,
        processedAt: new Date().toISOString(),
        vectorized: true
      },
      {
        id: 'doc_2',
        title: 'Project Kickoff Presentation',
        type: 'PPTX',
        summary: 'New project overview and timelines',
        pageCount: 10,
        processedAt: new Date().toISOString(),
        vectorized: true
      }
    ];
  }

  async getCompanyDocumentInsights(companyId) {
    // Mock insights - implement real analytics
    return {
      totalDocuments: 42,
      documentTypes: {
        PDF: 25,
        PPTX: 12,
        DOCX: 5
      },
      mostActiveUsers: ['User A', 'User B', 'User C'],
      popularCategories: ['Reports', 'Presentations', 'Manuals'],
      storageUsed: '450MB'
    };
  }
}

export default new DocumentService();