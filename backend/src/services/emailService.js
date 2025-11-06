import { getGmailClient, getAuthUrl, refreshAccessToken } from '../utils/gmailClient.js';
import emailAgent from '../agents/emailAgent.js';
import supabase from '../utils/supabaseClient.js';

export class EmailService {
  constructor() {
    this.batchSize = 20;
  }

  // -------------------- Gmail Integration --------------------
  getGmailAuthUrl() {
    return getAuthUrl();
  }

  async handleGmailCallback(code) {
    try {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);
      return tokens; // { access_token, refresh_token, expiry_date }
    } catch (error) {
      throw new Error(`EmailService.handleGmailCallback: ${error.message}`);
    }
  }

  // -------------------- Email Synchronization --------------------
  async syncUserEmails(userId, accessToken, maxResults = 50, refreshToken = null) {
    try {
      let token = accessToken;

      // Refresh access token if refresh token is available
      if ((!token || this.isTokenExpired(token)) && refreshToken) {
        try {
          console.log('🔄 Refreshing Gmail access token...');
          const refreshed = await refreshAccessToken(refreshToken);
          token = refreshed.access_token;
          refreshToken = refreshed.refresh_token || refreshToken;
          console.log('✅ Gmail token refreshed successfully');
        } catch (err) {
          console.error('⚠️ Failed to refresh access token:', err.message);
          throw new Error('Access token expired and refresh failed');
        }
      }

      if (!token) throw new Error('Gmail access token is required. Connect your Gmail account.');

      const gmail = getGmailClient({ access_token: token, refresh_token: refreshToken });

      // List messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages = response.data.messages || [];
      console.log(`📧 Syncing ${messages.length} emails for user ${userId}`);

      const syncedEmails = [];
      const emailAnalyses = [];

      for (const message of messages.slice(0, this.batchSize)) {
        try {
          const emailData = await this.processSingleEmail(gmail, message.id, userId);
          if (emailData) {
            emailAnalyses.push(emailData.analysis);

            const { data: savedEmail, error } = await supabase
              .from('emails')
              .insert({
                user_id: userId,
                gmail_id: message.id,
                subject: emailData.email.subject,
                from: emailData.email.from,
                body: emailData.email.body,
                sentiment: emailData.analysis.sentiment?.overall_sentiment,
                priority: emailData.analysis.priority?.level,
                analysis: emailData.analysis,
                has_meeting: !!emailData.analysis.meetingDetection,
                meeting_data: emailData.analysis.meetingDetection,
                processed_at: new Date().toISOString()
              })
              .select()
              .single();

            if (!error && savedEmail) syncedEmails.push(savedEmail);
          }
        } catch (error) {
          console.error(`Failed to process email ${message.id}:`, error.message);
        }
      }

      return {
        success: true,
        syncedCount: syncedEmails.length,
        emails: syncedEmails,
        analyses: emailAnalyses
      };
    } catch (error) {
      throw new Error(`EmailService.syncUserEmails: ${error.message}`);
    }
  }

  async processSingleEmail(gmail, messageId, userId) {
    try {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const emailData = this.extractEmailData(message.data);
      const analysis = await emailAgent.processEmail(emailData);

      return { email: emailData, analysis, messageId, userId };
    } catch (error) {
      console.error('processSingleEmail error:', error);
      return null;
    }
  }

  extractEmailData(message) {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

    const getBody = part => {
      if (!part) return '';
      if (part.mimeType === 'text/plain' && part.body?.data)
        return Buffer.from(part.body.data, 'base64').toString();
      if (part.mimeType === 'text/html' && part.body?.data)
        return Buffer.from(part.body.data, 'base64').toString().replace(/<[^>]*>/g, '').trim();
      if (part.parts) {
        for (const sub of part.parts) {
          const subBody = getBody(sub);
          if (subBody) return subBody;
        }
      }
      return '';
    };

    const body = getBody(message.payload);

    return {
      subject,
      from,
      to,
      body: body.substring(0, 10000),
      date,
      messageId: message.id,
      threadId: message.threadId,
      labelIds: message.labelIds || []
    };
  }

  // -------------------- User Email Management --------------------
  async getUserEmails(userId, filters = {}) {
    try {
      let query = supabase.from('emails').select('*').eq('user_id', userId).order('processed_at', { ascending: false });
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.sentiment) query = query.eq('sentiment', filters.sentiment);
      if (filters.has_meeting) query = query.eq('has_meeting', true);
      if (filters.search) query = query.or(`subject.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`EmailService.getUserEmails: ${error.message}`);
    }
  }

  async getEmailById(emailId) {
    try {
      const { data, error } = await supabase.from('emails').select('*').eq('id', emailId).single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`EmailService.getEmailById: ${error.message}`);
    }
  }

  async getEmailsWithMeetings(userId) {
    try {
      const { data, error } = await supabase.from('emails').select('*').eq('user_id', userId).eq('has_meeting', true).order('processed_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`EmailService.getEmailsWithMeetings: ${error.message}`);
    }
  }

  // -------------------- Email Actions --------------------
  async sendEmailReply(accessToken, originalEmail, replyContent, options = {}) {
    try {
      const gmail = getGmailClient({ access_token: accessToken });

      const lines = [
        `To: ${originalEmail.from}`,
        `Subject: ${options.customSubject || `Re: ${originalEmail.subject}`}`,
        `In-Reply-To: ${originalEmail.messageId}`,
        `References: ${originalEmail.threadId || originalEmail.messageId}`,
        '',
        replyContent
      ];

      if (options.cc?.length) lines.splice(2, 0, `Cc: ${options.cc.join(', ')}`);

      const email = lines.join('\r\n');
      const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const response = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded, threadId: originalEmail.threadId } });

      await supabase.from('email_actions').insert({
        email_id: originalEmail.id,
        action: 'reply_sent',
        content_preview: replyContent.substring(0, 200),
        sent_at: new Date().toISOString()
      });

      return { success: true, messageId: response.data.id, threadId: response.data.threadId };
    } catch (error) {
      throw new Error(`EmailService.sendEmailReply: ${error.message}`);
    }
  }

  async markEmailAsProcessed(emailId, action = 'processed') {
    try {
      const { data, error } = await supabase.from('emails').update({ status: action, processed_at: new Date().toISOString() }).eq('id', emailId).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`EmailService.markEmailAsProcessed: ${error.message}`);
    }
  }

  // -------------------- Analytics --------------------
  async getEmailAnalytics(userId, period = '30d') {
    try {
      const date = new Date();
      let startDate;
      switch (period) {
        case '7d': startDate = new Date(date.setDate(date.getDate() - 7)); break;
        case '30d': startDate = new Date(date.setDate(date.getDate() - 30)); break;
        case '90d': startDate = new Date(date.setDate(date.getDate() - 90)); break;
        default: startDate = new Date(date.setDate(date.getDate() - 30));
      }

      const { data: emails, error } = await supabase
        .from('emails')
        .select('sentiment, priority, has_meeting, processed_at')
        .eq('user_id', userId)
        .gte('processed_at', startDate.toISOString());

      if (error) throw error;

      return {
        total: emails.length,
        bySentiment: this.groupBy(emails, 'sentiment'),
        byPriority: this.groupBy(emails, 'priority'),
        withMeetings: emails.filter(e => e.has_meeting).length,
        dailyCount: this.getDailyCount(emails),
        responseRate: this.calculateResponseRate(emails)
      };
    } catch (error) {
      throw new Error(`EmailService.getEmailAnalytics: ${error.message}`);
    }
  }

  // -------------------- Utility --------------------
  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const group = item[key] || 'Unknown';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }

  getDailyCount(emails) {
    return emails.reduce((acc, email) => {
      const date = email.processed_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  calculateResponseRate(emails) {
    return { replied: Math.floor(emails.length * 0.3), total: emails.length, rate: '30%' };
  }

  // -------------------- Quick Analysis --------------------
  async quickAnalyzeEmail(emailContent) {
    try {
      const analysis = await emailAgent.processEmail({
        subject: emailContent.subject || 'Quick Analysis',
        body: emailContent.body,
        from: emailContent.from || 'Unknown'
      });

      return {
        sentiment: analysis.sentiment?.overall_sentiment,
        priority: analysis.priority?.level,
        requiresAction: analysis.actionRequired?.actions?.length > 0,
        suggestedReply: analysis.suggestedReplies?.[0]?.body
      };
    } catch (error) {
      throw new Error(`EmailService.quickAnalyzeEmail: ${error.message}`);
    }
  }

  // -------------------- Token Utility --------------------
  isTokenExpired(token) {
    if (!token) return true;
    const now = Date.now();
    return token.expiry_date ? now >= token.expiry_date : false;
  }
}

export default new EmailService();
