// src/agents/emailAgent.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

class EmailAgent {
  constructor() {
    this.description = "AI agent for email analysis, sentiment detection, smart replies, and meeting extraction";
  }

  // ==================== ERROR HANDLING UTILITIES ====================

  handleError(methodName, error, fallbackResponse = null) {
    console.error(`[EmailAgent.${methodName}] Error:`, error);
    
    if (fallbackResponse !== null) {
      console.warn(`[EmailAgent.${methodName}] Using fallback response`);
      return fallbackResponse;
    }
    
    throw new Error(`${methodName} failed: ${error.message}`);
  }

  validateRequiredParams(params, required) {
    const missing = required.filter(param => !params[param]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn('JSON parse failed, using fallback:', error.message);
      return defaultValue;
    }
  }

  // ==================== GEMINI AI INTEGRATION ====================

  async generateWithGemini(prompt, context = {}, options = {}) {
    const methodName = 'generateWithGemini';
    
    try {
      this.validateRequiredParams({ prompt }, ['prompt']);
      
      const fullPrompt = this.buildPrompt(prompt, context);
      const generationConfig = {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
      };

      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig
      });
      
      const response = result.response;
      
      if (!response || !response.text) {
        throw new Error('Empty response from Gemini AI');
      }

      return {
        content: response.text(),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        success: true
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        content: 'AI service temporarily unavailable. Please try again later.',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        success: false
      });
    }
  }

  buildPrompt(basePrompt, context) {
    return `
      CONTEXT: ${JSON.stringify(context, null, 2)}
      
      INSTRUCTION: ${basePrompt}
      
      Please provide a comprehensive, well-structured response that addresses all aspects of the request.
      Be specific, actionable, and practical in your recommendations.
      Always return valid JSON when requested.
    `;
  }

  // ==================== CORE EMAIL PROCESSING ====================

  async process(emailData, options = {}) {
    const methodName = 'process';
    
    try {
      this.validateRequiredParams({ emailData }, ['emailData']);

      const { subject = "", from = "", body = "", date = new Date().toISOString(), to = [], cc = [], attachments = [] } = emailData;
      
      // Execute all analysis steps sequentially
      const [sentiment, priority, categorization, suggestedReplies, meetingDetection, actionRequired, urgency, summary] = await Promise.all([
        this.analyzeEmailSentiment({ email: { subject, from, body } }),
        this.determinePriority({ email: { subject, from, body }, sentiment: {} }),
        this.categorizeEmail({ email: { subject, from, body }, sentiment: {}, priority: {} }),
        this.generateSuggestedReplies({ email: { subject, from, body }, sentiment: {}, priority: {}, categorization: {} }),
        this.detectMeetingRequests({ email: { subject, body } }),
        this.checkActionRequirements({ email: { subject, body }, sentiment: {}, priority: {}, categorization: {} }),
        this.assessUrgency({ email: { subject, from, body }, sentiment: {}, priority: {}, categorization: {}, actionRequired: {} }),
        this.summarizeEmail({ email: { subject, from, body }, sentiment: {}, priority: {}, categorization: {}, actionRequired: {}, urgency: {} })
      ]);

      const result = {
        email: { subject, from, body, date, to, cc, attachments },
        sentiment: sentiment.sentiment || {},
        priority: priority.priority || {},
        categorization: categorization.categorization || {},
        suggestedReplies: suggestedReplies.suggestedReplies || [],
        meetingDetection: meetingDetection.meetingDetection || {},
        actionRequired: actionRequired.actionRequired || {},
        urgency: urgency.urgency || {},
        summary: summary.summary || {},
        processingInfo: {
          processedAt: new Date().toISOString(),
          agentVersion: "2.0",
          options
        }
      };

      return {
        success: true,
        ...result
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        email: emailData,
        sentiment: {},
        priority: {},
        categorization: {},
        suggestedReplies: [],
        meetingDetection: {},
        actionRequired: {},
        urgency: {},
        summary: {},
        processingInfo: {
          processedAt: new Date().toISOString(),
          agentVersion: "2.0",
          error: error.message
        }
      });
    }
  }

  async analyzeEmailSentiment(state) {
    const methodName = 'analyzeEmailSentiment';
    
    try {
      const { email } = state;
      const prompt = `
        Analyze the sentiment of this email and provide a detailed analysis:
        
        Subject: ${email.subject}
        From: ${email.from}
        Body: ${email.body}
        
        Please analyze and return ONLY a JSON object with this structure:
        {
          "overallSentiment": "positive|negative|neutral|mixed",
          "confidence": 0.0-1.0,
          "emotions": ["array", "of", "detected", "emotions"],
          "intensity": "low|medium|high",
          "keySentimentIndicators": ["list", "of", "phrases", "that", "influenced", "sentiment"]
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Sentiment analysis failed');
      }

      const sentiment = this.safeJsonParse(result.content, {
        overallSentiment: "neutral",
        confidence: 0.5,
        emotions: [],
        intensity: "medium",
        keySentimentIndicators: []
      });

      return {
        success: true,
        sentiment,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        sentiment: {
          overallSentiment: "neutral",
          confidence: 0.5,
          emotions: [],
          intensity: "medium",
          keySentimentIndicators: []
        }
      });
    }
  }

  async determinePriority(state) {
    const methodName = 'determinePriority';
    
    try {
      const { email, sentiment } = state;
      const prompt = `
        Determine the priority level of this email based on content, sender, and sentiment:
        
        Subject: ${email.subject}
        From: ${email.from}
        Sentiment: ${JSON.stringify(sentiment)}
        Body Preview: ${email.body.substring(0, 500)}...
        
        Return ONLY a JSON object with this structure:
        {
          "level": "low|medium|high|urgent",
          "score": 1-10,
          "reasons": ["list", "of", "reasons", "for", "priority"],
          "responseTimeSuggested": "within hours|within 1 day|within 3 days|when convenient"
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Priority determination failed');
      }

      const priority = this.safeJsonParse(result.content, {
        level: "medium",
        score: 5,
        reasons: [],
        responseTimeSuggested: "within 1 day"
      });

      return {
        success: true,
        priority,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        priority: {
          level: "medium",
          score: 5,
          reasons: [],
          responseTimeSuggested: "within 1 day"
        }
      });
    }
  }

  async categorizeEmail(state) {
    const methodName = 'categorizeEmail';
    
    try {
      const { email, sentiment, priority } = state;
      const prompt = `
        Categorize this email and provide relevant tags:
        
        Subject: ${email.subject}
        From: ${email.from}
        Priority: ${priority.level}
        Sentiment: ${sentiment.overallSentiment}
        Body: ${email.body.substring(0, 1000)}...
        
        Return ONLY a JSON object with this structure:
        {
          "primaryCategory": "work|personal|newsletter|notification|promotional|spam|other",
          "subcategories": ["array", "of", "relevant", "subcategories"],
          "tags": ["relevant", "tags", "for", "organization"],
          "isBusinessRelated": true/false,
          "requiresFollowUp": true/false
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Email categorization failed');
      }

      const categorization = this.safeJsonParse(result.content, {
        primaryCategory: "other",
        subcategories: [],
        tags: [],
        isBusinessRelated: false,
        requiresFollowUp: false
      });

      return {
        success: true,
        categorization,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        categorization: {
          primaryCategory: "other",
          subcategories: [],
          tags: [],
          isBusinessRelated: false,
          requiresFollowUp: false
        }
      });
    }
  }

  async generateSuggestedReplies(state) {
    const methodName = 'generateSuggestedReplies';
    
    try {
      const { email, sentiment, priority, categorization } = state;
      const prompt = `
        Generate 3-5 suggested replies for this email with different tones:
        
        Original Email:
        Subject: ${email.subject}
        From: ${email.from}
        Body: ${email.body}
        
        Context:
        - Sentiment: ${sentiment.overallSentiment}
        - Priority: ${priority.level}
        - Category: ${categorization.primaryCategory}
        
        Provide replies in different tones (professional, casual, concise).
        Return ONLY a JSON object with this structure:
        {
          "suggestedReplies": [
            {
              "text": "full reply text",
              "tone": "professional|casual|concise|empathetic",
              "estimatedTimeToRead": "seconds",
              "keyPoints": ["main", "points", "covered"]
            }
          ]
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Reply generation failed');
      }

      const suggestedReplies = this.safeJsonParse(result.content, { suggestedReplies: [] });

      return {
        success: true,
        suggestedReplies: suggestedReplies.suggestedReplies || [],
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        suggestedReplies: []
      });
    }
  }

  async detectMeetingRequests(state) {
    const methodName = 'detectMeetingRequests';
    
    try {
      const { email } = state;
      const prompt = `
        Analyze this email for meeting requests, dates, times, and locations:
        
        Subject: ${email.subject}
        Body: ${email.body}
        
        Extract any meeting-related information. Return ONLY a JSON object with this structure:
        {
          "hasMeetingRequest": true/false,
          "meetings": [
            {
              "proposedDate": "YYYY-MM-DD or unknown",
              "proposedTime": "HH:MM or unknown",
              "duration": "estimated duration or unknown",
              "location": "physical/virtual location or unknown",
              "purpose": "meeting purpose if mentioned",
              "confidence": 0.0-1.0
            }
          ],
          "proposedActions": ["list", "of", "suggested", "actions"]
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Meeting detection failed');
      }

      const meetingDetection = this.safeJsonParse(result.content, {
        hasMeetingRequest: false,
        meetings: [],
        proposedActions: []
      });

      return {
        success: true,
        meetingDetection,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        meetingDetection: {
          hasMeetingRequest: false,
          meetings: [],
          proposedActions: []
        }
      });
    }
  }

  async checkActionRequirements(state) {
    const methodName = 'checkActionRequirements';
    
    try {
      const { email, sentiment, priority, categorization } = state;
      const prompt = `
        Analyze what actions are required from this email:
        
        Subject: ${email.subject}
        Body: ${email.body}
        
        Context:
        - Priority: ${priority.level}
        - Category: ${categorization.primaryCategory}
        - Sentiment: ${sentiment.overallSentiment}
        
        Return ONLY a JSON object with this structure:
        {
          "actionRequired": true/false,
          "actions": [
            {
              "type": "reply|follow-up|meeting|document|other",
              "description": "clear description of required action",
              "deadline": "if mentioned or inferred",
              "priority": "low|medium|high",
              "estimatedEffort": "minutes|hours|days"
            }
          ],
          "nextSteps": ["recommended", "next", "steps"]
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Action requirement check failed');
      }

      const actionRequired = this.safeJsonParse(result.content, {
        actionRequired: false,
        actions: [],
        nextSteps: []
      });

      return {
        success: true,
        actionRequired,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        actionRequired: {
          actionRequired: false,
          actions: [],
          nextSteps: []
        }
      });
    }
  }

  async assessUrgency(state) {
    const methodName = 'assessUrgency';
    
    try {
      const { email, sentiment, priority, categorization, actionRequired } = state;
      const prompt = `
        Assess the urgency of responding to this email:
        
        Subject: ${email.subject}
        From: ${email.from}
        Body Preview: ${email.body.substring(0, 500)}...
        
        Context:
        - Priority: ${priority.level}
        - Actions Required: ${actionRequired.actionRequired}
        - Sentiment: ${sentiment.overallSentiment}
        - Category: ${categorization.primaryCategory}
        
        Return ONLY a JSON object with this structure:
        {
          "urgencyLevel": "low|medium|high|critical",
          "responseDeadline": "immediate|today|this week|when possible",
          "factors": ["list", "of", "urgency", "factors"],
          "riskOfDelay": "low|medium|high",
          "recommendedActions": ["immediate", "recommended", "actions"]
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Urgency assessment failed');
      }

      const urgency = this.safeJsonParse(result.content, {
        urgencyLevel: "medium",
        responseDeadline: "when possible",
        factors: [],
        riskOfDelay: "medium",
        recommendedActions: []
      });

      return {
        success: true,
        urgency,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        urgency: {
          urgencyLevel: "medium",
          responseDeadline: "when possible",
          factors: [],
          riskOfDelay: "medium",
          recommendedActions: []
        }
      });
    }
  }

  async summarizeEmail(state) {
    const methodName = 'summarizeEmail';
    
    try {
      const { email, sentiment, priority, categorization, actionRequired, urgency } = state;
      const prompt = `
        Create a comprehensive summary of this email analysis:
        
        Original Email:
        Subject: ${email.subject}
        From: ${email.from}
        
        Analysis Results:
        - Sentiment: ${JSON.stringify(sentiment)}
        - Priority: ${JSON.stringify(priority)}
        - Category: ${JSON.stringify(categorization)}
        - Urgency: ${JSON.stringify(urgency)}
        - Actions Required: ${JSON.stringify(actionRequired)}
        
        Return ONLY a JSON object with this structure:
        {
          "keyPoints": ["main", "points", "from", "email"],
          "summary": "brief overall summary",
          "recommendations": ["action", "recommendations"],
          "timeToHandle": "estimated time to handle this email",
          "importanceScore": 1-10
        }
      `;

      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Email summarization failed');
      }

      const summary = this.safeJsonParse(result.content, {
        keyPoints: [],
        summary: "Unable to generate summary",
        recommendations: [],
        timeToHandle: "unknown",
        importanceScore: 5
      });

      return {
        success: true,
        summary,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        summary: {
          keyPoints: [],
          summary: "Error generating summary",
          recommendations: [],
          timeToHandle: "unknown",
          importanceScore: 5
        }
      });
    }
  }

  // ==================== QUICK METHODS ====================

  async quickSentiment(emailText) {
    const methodName = 'quickSentiment';
    
    try {
      const prompt = `
        Quick sentiment analysis for: "${emailText.substring(0, 1000)}"
        Return ONLY: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0}
      `;
      
      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Quick sentiment analysis failed');
      }

      const sentiment = this.safeJsonParse(result.content, { sentiment: "neutral", confidence: 0.5 });

      return {
        success: true,
        sentiment,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        sentiment: { sentiment: "neutral", confidence: 0.5 }
      });
    }
  }

  async quickReply(emailContent, tone = "professional") {
    const methodName = 'quickReply';
    
    try {
      const prompt = `
        Generate a quick ${tone} reply for this email content: "${emailContent.substring(0, 1500)}"
        Return ONLY the reply text without any additional formatting or explanations.
      `;
      
      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Quick reply generation failed');
      }

      return {
        success: true,
        reply: result.content,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        reply: "Thank you for your email. I will get back to you soon."
      });
    }
  }

  async extractMeetingsOnly(emailContent) {
    const methodName = 'extractMeetingsOnly';
    
    try {
      const prompt = `
        Extract only meeting information from: "${emailContent}"
        Return ONLY a JSON array of meetings with proposed dates/times, or empty array if none.
        Format: [{"date": "...", "time": "...", "location": "...", "purpose": "..."}]
      `;
      
      const result = await this.generateWithGemini(prompt);
      
      if (!result.success) {
        throw new Error('Meeting extraction failed');
      }

      const meetings = this.safeJsonParse(result.content, []);

      return {
        success: true,
        meetings,
        usage: result.usage
      };
    } catch (error) {
      return this.handleError(methodName, error, {
        success: false,
        meetings: []
      });
    }
  }

  // ==================== AGENT CAPABILITIES ====================

  async getCapabilities() {
    return {
      aiModels: ['gemini-1.5-flash-latest'],
      capabilities: [
        'email_sentiment_analysis',
        'priority_determination',
        'email_categorization',
        'smart_reply_generation',
        'meeting_detection',
        'action_requirement_analysis',
        'urgency_assessment',
        'email_summarization',
        'quick_sentiment',
        'quick_reply',
        'meeting_extraction'
      ],
      integrations: ['google_gemini'],
      features: ['comprehensive_email_analysis', 'real_time_processing', 'fallback_handling']
    };
  }
}

// Create and export singleton instance
const emailAgent = new EmailAgent();
export default emailAgent;