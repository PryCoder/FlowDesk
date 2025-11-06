// agents/meetingAgent.js
import fetch from 'node-fetch';

class MeetingAgent {
  constructor() {
    this.model = process.env.MEETING_AGENT_MODEL || 'mistral';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async process({ transcript, audioDuration, participants = [], meetingTitle = '' }) {
    try {
      if (!transcript || transcript.trim().length < 30) {
        throw new Error('Transcript too short or missing.');
      }

      const prompt = `
You are an AI meeting assistant. Analyze the following meeting transcript and provide structured JSON.

Meeting Title: ${meetingTitle || 'Untitled Meeting'}
Duration: ${audioDuration || 'unknown'}
Participants: ${participants.map((p) => p.name || p).join(', ') || 'N/A'}

Transcript:
"""
${transcript}
"""

Respond strictly in JSON with this structure:
{
  "summary": "string - concise meeting summary",
  "actionItems": [
    {"task": "string", "owner": "string or null", "due": "string or null"}
  ],
  "decisions": ["string"],
  "sentiment": {
    "overall": "positive|neutral|negative",
    "notes": "string summary of tone"
  },
  "participants": [
    {"name": "string", "participation": "string notes on engagement"}
  ],
  "followUps": ["string recommendations for next steps"]
}
`;

      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: this.model, 
          prompt,
          stream: false 
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error: ${text}`);
      }

      const data = await response.json();
      const raw = data.response || data.output || '';

      // Attempt to parse JSON safely
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Failed to parse JSON response from model');
      }

      const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);

      return {
        summary: parsed.summary || null,
        actionItems: parsed.actionItems || [],
        decisions: parsed.decisions || [],
        sentiment: parsed.sentiment || { overall: 'neutral', notes: '' },
        participants: parsed.participants || [],
        followUps: parsed.followUps || [],
      };
    } catch (err) {
      console.error('MeetingAgent.process error:', err);
      
      // Return fallback analysis
      return {
        summary: 'Meeting analysis failed. Please try again.',
        actionItems: [],
        decisions: [],
        sentiment: { overall: 'neutral', notes: 'Analysis unavailable' },
        participants: [],
        followUps: [],
      };
    }
  }
}

const meetingAgent = new MeetingAgent();
export default meetingAgent;