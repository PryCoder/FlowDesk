// src/config/langchain.config.js
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export class LangChainConfig {
  static createLLM(modelType = 'gemini', options = {}) {
    const defaultOptions = {
      temperature: 0.3,
      streaming: true,
      maxTokens: 2000,
      ...options
    };

    switch (modelType.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: options.modelName || "gpt-3.5-turbo",
          ...defaultOptions
        });
        
      case 'anthropic':
        return new ChatAnthropic({
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          modelName: options.modelName || "claude-3-opus-20240229",
          ...defaultOptions
        });
        
      case 'ollama':
        return new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
          model: options.modelName || "llama2",
          ...defaultOptions
        });
        
      case 'gemini':
        return new ChatGoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY,
          modelName: options.modelName || "gemini-2.5-flash", // Default to 2.5 flash
          ...defaultOptions
        });
        
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  static createEmbeddings(modelType = 'openai') {
    switch (modelType.toLowerCase()) {
      case 'openai':
        return new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          model: "text-embedding-3-small",
          dimensions: 1536
        });
        
      default:
        return new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          model: "text-embedding-3-small"
        });
    }
  }

  static getAvailableModels() {
    return {
      openai: [
        "gpt-4-turbo-preview",
        "gpt-4",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-16k"
      ],
      anthropic: [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
      ],
      ollama: [
        "llama2",
        "mistral",
        "codellama",
        "neural-chat"
      ],
      gemini: [
        "gemini-2.5-flash", // Primary model - RECOMMENDED for chatbot
        "gemini-2.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-pro-vision"
      ]
    };
  }
}