// src/chatbot/utils/promptTemplates.js
import { PromptTemplate } from "@langchain/core/prompts";

export class PromptTemplates {
  // RAG Chat Prompt
  static getRAGChatPrompt() {
    return PromptTemplate.fromTemplate(`
      You are FlowDesk AI, a helpful assistant integrated into the FlowDesk productivity platform.
      You have access to a knowledge base and chat history to provide accurate, helpful responses.
      
      Current Date and Time: {current_datetime}
      
      Context from Knowledge Base:
      {context}
      
      Chat History (last 10 messages):
      {chat_history}
      
      User Profile (if available):
      {user_profile}
      
      User Question: {question}
      
      Instructions:
      1. Answer based on the provided context when possible
      2. If context doesn't contain relevant information, say so clearly
      3. Be concise but thorough
      4. Format responses for readability (use bullet points, numbered lists when appropriate)
      5. If suggesting actions, be specific and actionable
      6. Maintain a professional, helpful tone
      7. Reference the source document if relevant
      
      Response:
    `);
  }

  // Document Summarization Prompt
  static getSummarizationPrompt() {
    return PromptTemplate.fromTemplate(`
      You are an expert document analyzer. Summarize the following document content:
      
      Document Type: {document_type}
      Document Name: {document_name}
      Document Size: {document_size}
      
      Content:
      {content}
      
      Provide a comprehensive summary with the following sections:
      
      1. **Executive Summary** (2-3 sentences)
      2. **Key Points** (bullet points)
      3. **Main Takeaways** (bullet points)
      4. **Action Items** (if any, in bullet points)
      5. **Recommendations** (if applicable)
      6. **Keywords/Tags** (comma-separated)
      
      Format the response in markdown with clear section headers.
    `);
  }

  // Suggestion Generation Prompt
  static getSuggestionPrompt() {
    return PromptTemplate.fromTemplate(`
      Based on the chat context below, generate 3 relevant follow-up questions or suggestions.
      
      Chat Context:
      {chat_context}
      
      Recent Messages:
      {recent_messages}
      
      Available Documents:
      {available_documents}
      
      Generate suggestions in this JSON format:
      {{
        "suggestions": [
          {{
            "id": "suggestion_1",
            "type": "question|action|exploration",
            "text": "Suggested question or action",
            "reason": "Why this is relevant",
            "confidence": 0.95
          }},
          {{
            "id": "suggestion_2",
            "type": "question|action|exploration",
            "text": "Suggested question or action",
            "reason": "Why this is relevant",
            "confidence": 0.95
          }},
          {{
            "id": "suggestion_3",
            "type": "question|action|exploration",
            "text": "Suggested question or action",
            "reason": "Why this is relevant",
            "confidence": 0.95
          }}
        ]
      }}
      
      Guidelines:
      - Questions should be natural follow-ups
      - Actions should be specific and achievable
      - Exploration suggestions should broaden understanding
      - Match the user's apparent expertise level
    `);
  }

  // Document Q&A Prompt
  static getDocumentQAPrompt() {
    return PromptTemplate.fromTemplate(`
      Answer the question based ONLY on the following document context.
      If you cannot answer based on the context, say "I cannot answer based on the provided document."
      
      Document Context:
      {document_context}
      
      Question: {question}
      
      Answer Guidelines:
      1. Be precise and factual
      2. Quote relevant parts if helpful
      3. Specify which document section the information comes from
      4. If multiple documents contain information, mention all relevant sources
      
      Answer:
    `);
  }

  // Meeting Notes Analysis Prompt
  static getMeetingNotesPrompt() {
    return PromptTemplate.fromTemplate(`
      Analyze these meeting notes and extract key information:
      
      Meeting Notes:
      {meeting_notes}
      
      Extract and organize the following:
      
      1. **Meeting Summary** (brief overview)
      2. **Participants** (list of names/roles)
      3. **Key Decisions** (bullet points)
      4. **Action Items** (with assignees and deadlines)
      5. **Discussion Topics** (main points discussed)
      6. **Next Steps** (with owners)
      7. **Follow-up Required** (yes/no and details)
      
      Format as structured markdown with clear sections.
    `);
  }

  // Code Analysis Prompt
  static getCodeAnalysisPrompt() {
    return PromptTemplate.fromTemplate(`
      Analyze the following code and provide insights:
      
      Code Language: {language}
      Code Context: {context}
      
      Code:
      {code}
      
      Provide analysis in this structure:
      
      ## Code Analysis
      
      ### Summary
      [Brief summary of what the code does]
      
      ### Key Functions/Methods
      [List and describe main functions]
      
      ### Complexity Analysis
      [Time/space complexity if applicable]
      
      ### Potential Issues
      [Bugs, inefficiencies, security concerns]
      
      ### Improvement Suggestions
      [Specific, actionable improvements]
      
      ### Best Practices Check
      [Compliance with language/framework best practices]
      
      ### Test Recommendations
      [Suggested test cases/scenarios]
      
      Format with appropriate markdown headers and bullet points.
    `);
  }

  // Email Drafting Prompt
  static getEmailDraftPrompt() {
    return PromptTemplate.fromTemplate(`
      Draft an email based on the following requirements:
      
      Purpose: {purpose}
      Tone: {tone}
      Recipient: {recipient}
      Key Points to Include: {key_points}
      Length: {length}
      
      Additional Context:
      {context}
      
      Write a professional email with:
      1. Appropriate subject line
      2. Proper salutation
      3. Clear body with paragraphs
      4. Call to action if needed
      5. Professional closing
      
      Also provide:
      - Suggested follow-up timing
      - Keywords to include for searchability
      - Alternative versions if applicable
      
      Format the response as JSON:
      {{
        "subject": "Email subject",
        "body": "Full email body",
        "key_points_covered": ["point1", "point2"],
        "tone_analysis": "analysis of tone used",
        "suggested_follow_up": "when to follow up",
        "keywords": ["keyword1", "keyword2"],
        "alternative_versions": [
          {{
            "version": "short",
            "body": "short version"
          }}
        ]
      }}
    `);
  }

  // Task Extraction Prompt
  static getTaskExtractionPrompt() {
    return PromptTemplate.fromTemplate(`
      Extract tasks and action items from the following text:
      
      Text:
      {text}
      
      Extract and categorize:
      
      1. **Immediate Tasks** (to be done today/this week)
      2. **Future Tasks** (to be scheduled)
      3. **Recurring Tasks** (daily/weekly/monthly)
      4. **Blocked Tasks** (dependencies mentioned)
      5. **Completed Tasks** (if mentioned as done)
      
      For each task, extract:
      - Description
      - Priority (high/medium/low)
      - Estimated effort
      - Dependencies
      - Due date (if mentioned)
      - Assignee (if mentioned)
      
      Format as JSON:
      {{
        "tasks": [
          {{
            "id": "task_1",
            "description": "Task description",
            "category": "immediate|future|recurring|blocked|completed",
            "priority": "high|medium|low",
            "estimated_effort": "estimate in hours",
            "dependencies": ["dependency1", "dependency2"],
            "due_date": "YYYY-MM-DD or null",
            "assignee": "name or null",
            "status": "pending|in_progress|completed|blocked"
          }}
        ],
        "summary": {{
          "total_tasks": 0,
          "by_priority": {{"high": 0, "medium": 0, "low": 0}},
          "by_category": {{"immediate": 0, "future": 0, "recurring": 0}}
        }}
      }}
    `);
  }

  // Get all available prompts
  static getAllPrompts() {
    return {
      ragChat: this.getRAGChatPrompt(),
      summarization: this.getSummarizationPrompt(),
      suggestions: this.getSuggestionPrompt(),
      documentQA: this.getDocumentQAPrompt(),
      meetingNotes: this.getMeetingNotesPrompt(),
      codeAnalysis: this.getCodeAnalysisPrompt(),
      emailDraft: this.getEmailDraftPrompt(),
      taskExtraction: this.getTaskExtractionPrompt()
    };
  }

  // Create custom prompt from template string
  static createCustomPrompt(templateString, inputVariables) {
    return new PromptTemplate({
      template: templateString,
      inputVariables: inputVariables
    });
  }
}