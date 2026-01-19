// src/chatbot/utils/documentLoader.js
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { promises as fs } from 'fs';
import path from 'path';

export class DocumentLoader {
  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    });
  }

  async loadPDF(fileBuffer, filename) {
    try {
      const pdfData = await pdfParse(fileBuffer);
      
      const documents = await this.textSplitter.splitDocuments([
        new Document({
          pageContent: this.cleanText(pdfData.text),
          metadata: {
            source: filename,
            type: 'pdf',
            pages: pdfData.numpages,
            info: pdfData.info || {},
            totalPages: pdfData.numpages,
            extractedAt: new Date().toISOString()
          }
        })
      ]);
      
      // Add page information to each chunk
      documents.forEach((doc, index) => {
        doc.metadata.chunkIndex = index;
        doc.metadata.totalChunks = documents.length;
      });
      
      return {
        success: true,
        documents,
        summary: {
          totalChunks: documents.length,
          totalPages: pdfData.numpages,
          estimatedTokens: Math.ceil(pdfData.text.length / 4)
        }
      };
    } catch (error) {
      throw new Error(`PDF loading error: ${error.message}`);
    }
  }

  async loadPPTX(fileBuffer, filename) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      
      const documents = await this.textSplitter.splitDocuments([
        new Document({
          pageContent: this.cleanText(result.value),
          metadata: {
            source: filename,
            type: 'pptx',
            extractedAt: new Date().toISOString()
          }
        })
      ]);
      
      // Extract any images or additional data
      const images = result.messages
        .filter(msg => msg.type === 'image')
        .map(img => img.src);
      
      documents.forEach((doc, index) => {
        doc.metadata.chunkIndex = index;
        doc.metadata.totalChunks = documents.length;
        doc.metadata.images = images;
      });
      
      return {
        success: true,
        documents,
        summary: {
          totalChunks: documents.length,
          imagesCount: images.length,
          estimatedTokens: Math.ceil(result.value.length / 4)
        }
      };
    } catch (error) {
      throw new Error(`PPTX loading error: ${error.message}`);
    }
  }

  async loadText(fileBuffer, filename) {
    try {
      const content = fileBuffer.toString('utf-8');
      
      const documents = await this.textSplitter.splitDocuments([
        new Document({
          pageContent: this.cleanText(content),
          metadata: {
            source: filename,
            type: 'text',
            extractedAt: new Date().toISOString()
          }
        })
      ]);
      
      documents.forEach((doc, index) => {
        doc.metadata.chunkIndex = index;
        doc.metadata.totalChunks = documents.length;
      });
      
      return {
        success: true,
        documents,
        summary: {
          totalChunks: documents.length,
          estimatedTokens: Math.ceil(content.length / 4)
        }
      };
    } catch (error) {
      throw new Error(`Text loading error: ${error.message}`);
    }
  }

  async loadFromBuffer(fileBuffer, mimetype, filename) {
    try {
      let result;
      
      switch (mimetype) {
        case 'application/pdf':
          result = await this.loadPDF(fileBuffer, filename);
          break;
          
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          result = await this.loadPPTX(fileBuffer, filename);
          break;
          
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          result = await this.loadText(fileBuffer, filename);
          break;
          
        default:
          throw new Error(`Unsupported file type: ${mimetype}. Supported types: PDF, PPTX, TXT, MD, CSV`);
      }
      
      return result;
    } catch (error) {
      console.error('Document loading error:', error);
      throw error;
    }
  }

  async loadFromFile(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      let mimetype;
      switch (ext) {
        case '.pdf':
          mimetype = 'application/pdf';
          break;
        case '.pptx':
          mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        case '.txt':
          mimetype = 'text/plain';
          break;
        case '.md':
          mimetype = 'text/markdown';
          break;
        case '.csv':
          mimetype = 'text/csv';
          break;
        default:
          throw new Error(`Unsupported file extension: ${ext}`);
      }
      
      return await this.loadFromBuffer(fileBuffer, mimetype, filename);
    } catch (error) {
      throw new Error(`File loading error: ${error.message}`);
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    
    // Remove non-printable characters but keep common symbols
    cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, '');
    
    // Fix common encoding issues
    cleaned = cleaned
      .replace(/â€œ|â€/g, '"')
      .replace(/â€™/g, "'")
      .replace(/â€"/g, '-')
      .replace(/â€¢/g, '•')
      .replace(/â€¦/g, '...');
    
    // Trim and return
    return cleaned.trim();
  }

  async extractMetadata(fileBuffer, mimetype) {
    try {
      let metadata = {
        mimetype,
        size: fileBuffer.length,
        extractedAt: new Date().toISOString()
      };
      
      if (mimetype === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        metadata = {
          ...metadata,
          pages: pdfData.numpages,
          pdfInfo: pdfData.info || {},
          version: pdfData.version
        };
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        metadata = {
          ...metadata,
          messages: result.messages,
          images: result.messages.filter(m => m.type === 'image').length
        };
      }
      
      return metadata;
    } catch (error) {
      console.error('Metadata extraction error:', error);
      return {
        mimetype,
        size: fileBuffer.length,
        extractionError: error.message
      };
    }
  }
}