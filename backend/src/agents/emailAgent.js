import { generateText } from '../utils/geminiClient.js';
import { StateGraph, END, Annotation } from '@langchain/langgraph';

class EmailAgent {
  constructor() {
    this.description = "AI agent for email analysis, sentiment detection, smart replies, and meeting extraction";
    this.setupAgents();
  }

  setupAgents() {
    // Correct schema using Annotation.Root
    const schema = Annotation.Root({
      email: Annotation({ default: {} }),
      sentiment: Annotation({ default: {} }),
      priority: Annotation({ default: {} }),
      suggestedReplies: Annotation({ default: [] }),
      actionRequired: Annotation({ default: {} }),
      meetingDetection: Annotation({ default: null }),
      categorization: Annotation({ default: {} }),
      urgency: Annotation({ default: {} }),
      summary: Annotation({ default: {} }),
    });

    const workflow = new StateGraph(schema);

    workflow.addNode("analyzeSentiment", this.analyzeEmailSentiment.bind(this));
    workflow.addNode("determinePriority", this.determinePriority.bind(this));
    workflow.addNode("categorizeEmail", this.categorizeEmail.bind(this));
    workflow.addNode("generateReplies", this.generateSuggestedReplies.bind(this));
    workflow.addNode("detectMeetings", this.detectMeetingRequests.bind(this));
    workflow.addNode("checkActions", this.checkActionRequirements.bind(this));
    workflow.addNode("assessUrgency", this.assessUrgency.bind(this));
    workflow.addNode("summarizeEmail", this.summarizeEmail.bind(this));

    workflow.addEdge("analyzeSentiment", "determinePriority");
    workflow.addEdge("determinePriority", "categorizeEmail");
    workflow.addEdge("categorizeEmail", "generateReplies");
    workflow.addEdge("generateReplies", "detectMeetings");
    workflow.addEdge("detectMeetings", "checkActions");
    workflow.addEdge("checkActions", "assessUrgency");
    workflow.addEdge("assessUrgency", "summarizeEmail");
    workflow.addEdge("summarizeEmail", END);

    workflow.setEntryPoint("analyzeSentiment");

    this.agent = workflow.compile();
  }

  async analyzeEmailSentiment(state) {
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

    try {
      const response = await generateText(prompt);
      const sentiment = this.safeJsonParse(response, {
        overallSentiment: "neutral",
        confidence: 0.5,
        emotions: [],
        intensity: "medium",
        keySentimentIndicators: []
      });
      
      return { sentiment };
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      return { 
        sentiment: {
          overallSentiment: "neutral",
          confidence: 0.5,
          emotions: [],
          intensity: "medium",
          keySentimentIndicators: []
        }
      };
    }
  }

  async determinePriority(state) {
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

    try {
      const response = await generateText(prompt);
      const priority = this.safeJsonParse(response, {
        level: "medium",
        score: 5,
        reasons: [],
        responseTimeSuggested: "within 1 day"
      });
      
      return { priority };
    } catch (error) {
      console.error('Error in priority determination:', error);
      return { 
        priority: {
          level: "medium",
          score: 5,
          reasons: [],
          responseTimeSuggested: "within 1 day"
        }
      };
    }
  }

  async categorizeEmail(state) {
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

    try {
      const response = await generateText(prompt);
      const categorization = this.safeJsonParse(response, {
        primaryCategory: "other",
        subcategories: [],
        tags: [],
        isBusinessRelated: false,
        requiresFollowUp: false
      });
      
      return { categorization };
    } catch (error) {
      console.error('Error in email categorization:', error);
      return { 
        categorization: {
          primaryCategory: "other",
          subcategories: [],
          tags: [],
          isBusinessRelated: false,
          requiresFollowUp: false
        }
      };
    }
  }

  async generateSuggestedReplies(state) {
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

    try {
      const response = await generateText(prompt);
      const suggestedReplies = this.safeJsonParse(response, { suggestedReplies: [] });
      
      return { suggestedReplies: suggestedReplies.suggestedReplies || [] };
    } catch (error) {
      console.error('Error generating suggested replies:', error);
      return { suggestedReplies: [] };
    }
  }

  async detectMeetingRequests(state) {
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

    try {
      const response = await generateText(prompt);
      const meetingDetection = this.safeJsonParse(response, {
        hasMeetingRequest: false,
        meetings: [],
        proposedActions: []
      });
      
      return { meetingDetection };
    } catch (error) {
      console.error('Error in meeting detection:', error);
      return { 
        meetingDetection: {
          hasMeetingRequest: false,
          meetings: [],
          proposedActions: []
        }
      };
    }
  }

  async checkActionRequirements(state) {
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

    try {
      const response = await generateText(prompt);
      const actionRequired = this.safeJsonParse(response, {
        actionRequired: false,
        actions: [],
        nextSteps: []
      });
      
      return { actionRequired };
    } catch (error) {
      console.error('Error in action requirement check:', error);
      return { 
        actionRequired: {
          actionRequired: false,
          actions: [],
          nextSteps: []
        }
      };
    }
  }

  async assessUrgency(state) {
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

    try {
      const response = await generateText(prompt);
      const urgency = this.safeJsonParse(response, {
        urgencyLevel: "medium",
        responseDeadline: "when possible",
        factors: [],
        riskOfDelay: "medium",
        recommendedActions: []
      });
      
      return { urgency };
    } catch (error) {
      console.error('Error in urgency assessment:', error);
      return { 
        urgency: {
          urgencyLevel: "medium",
          responseDeadline: "when possible",
          factors: [],
          riskOfDelay: "medium",
          recommendedActions: []
        }
      };
    }
  }

  async summarizeEmail(state) {
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

    try {
      const response = await generateText(prompt);
      const summary = this.safeJsonParse(response, {
        keyPoints: [],
        summary: "Unable to generate summary",
        recommendations: [],
        timeToHandle: "unknown",
        importanceScore: 5
      });
      
      return { summary };
    } catch (error) {
      console.error('Error in email summarization:', error);
      return { 
        summary: {
          keyPoints: [],
          summary: "Error generating summary",
          recommendations: [],
          timeToHandle: "unknown",
          importanceScore: 5
        }
      };
    }
  }

  safeJsonParse(str, defaultValue = null) {
    try { 
      return JSON.parse(str); 
    } catch (error) { 
      console.error('JSON Parse Error:', error); 
      return defaultValue; 
    }
  }

  async process(emailData, options = {}) {
    const { subject="", from="", body="", date=new Date().toISOString(), to=[], cc=[], attachments=[] } = emailData;
    const initialState = { 
      email: { 
        subject, 
        from, 
        body, 
        date, 
        to, 
        cc, 
        attachments, 
        bodyLength: body.length, 
        hasAttachments: attachments.length > 0 
      } 
    };
    
    const result = await this.agent.invoke(initialState);
    return { 
      ...result, 
      processingInfo: { 
        processedAt: new Date().toISOString(), 
        agentVersion: "1.0", 
        options 
      } 
    };
  }

  async quickSentiment(emailText) {
    const prompt = `
      Quick sentiment analysis for: "${emailText.substring(0, 1000)}"
      Return ONLY: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0}
    `;
    
    try {
      const response = await generateText(prompt);
      return this.safeJsonParse(response, { sentiment: "neutral", confidence: 0.5 });
    } catch (error) {
      console.error('Error in quick sentiment:', error);
      return { sentiment: "neutral", confidence: 0.5 };
    }
  }

  async quickReply(emailContent, tone = "professional") {
    const prompt = `
      Generate a quick ${tone} reply for this email content: "${emailContent.substring(0, 1500)}"
      Return ONLY the reply text without any additional formatting or explanations.
    `;
    
    try {
      return await generateText(prompt);
    } catch (error) {
      console.error('Error generating quick reply:', error);
      return "Thank you for your email. I will get back to you soon.";
    }
  }

  async extractMeetingsOnly(emailContent) {
    const prompt = `
      Extract only meeting information from: "${emailContent}"
      Return ONLY a JSON array of meetings with proposed dates/times, or empty array if none.
      Format: [{"date": "...", "time": "...", "location": "...", "purpose": "..."}]
    `;
    
    try {
      const response = await generateText(prompt);
      return this.safeJsonParse(response, []);
    } catch (error) {
      console.error('Error extracting meetings:', error);
      return [];
    }
  }
}

export default new EmailAgent();