import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'agentic-ai-secret'
  }
};