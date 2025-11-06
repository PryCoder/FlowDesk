import { google } from 'googleapis';
import config from '../../Config/index.js';

// -------------------- OAuth2 Client --------------------
const oauth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  config.gmail.redirectUri
);

// -------------------- Gmail Client Helper --------------------
export const getGmailClient = (tokens) => {
  if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
    throw new Error('Access token or refresh token is required');
  }
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// -------------------- Generate Auth URL --------------------
export const getAuthUrl = () =>
  oauth2Client.generateAuthUrl({
    access_type: 'offline', // to get refresh token
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ]
  });

// -------------------- Exchange Code for Tokens --------------------
export const getTokensFromCode = async (code) => {
  if (!code) throw new Error('Authorization code is required');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (err) {
    console.error('❌ Error getting tokens:', err);
    throw new Error('Failed to get tokens from code');
  }
};

// -------------------- Refresh Access Token --------------------
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token is required');
  try {
    const tempClient = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret,
      config.gmail.redirectUri
    );
    tempClient.setCredentials({ refresh_token: refreshToken });

    const accessToken = await tempClient.getAccessToken();
    if (!accessToken?.token) throw new Error('Failed to refresh access token');

    return { access_token: accessToken.token, refresh_token: refreshToken };
  } catch (err) {
    console.error('❌ Error refreshing token:', err);
    throw new Error('Failed to refresh access token');
  }
};

// -------------------- List Emails --------------------
export const listEmails = async (tokens, maxResults = 50) => {
  try {
    const gmail = getGmailClient(tokens);
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox' // fetch only inbox messages
    });
    return res.data.messages || [];
  } catch (err) {
    console.error('❌ Error listing emails:', err.response?.data || err);
    throw new Error('Failed to list emails');
  }
};

// -------------------- Get Single Email --------------------
export const getEmail = async (tokens, messageId) => {
  if (!messageId) throw new Error('Invalid messageId');
  try {
    const gmail = getGmailClient(tokens);
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    return res.data;
  } catch (err) {
    console.error('❌ Error getting email:', err.response?.data || err);
    throw new Error('Failed to get email');
  }
};

// -------------------- Send Email --------------------
export const sendEmail = async (tokens, { to, subject, body, threadId, cc }) => {
  if (!to || !subject || !body) throw new Error('To, subject, and body are required');

  try {
    const gmail = getGmailClient(tokens);

    const lines = [
      `To: ${to}`,
      cc?.length ? `Cc: ${cc.join(', ')}` : '',
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].filter(Boolean);

    const raw = Buffer.from(lines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId }
    });

    return res.data;
  } catch (err) {
    console.error('❌ Error sending email:', err.response?.data || err);
    throw new Error('Failed to send email');
  }
};

// -------------------- Extract Email Data --------------------
export const extractEmailData = (message) => {
  const headers = message.payload.headers;
  const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

  const subject = getHeader('Subject') || 'No Subject';
  const from = getHeader('From') || 'Unknown Sender';
  const to = getHeader('To') || '';
  const date = getHeader('Date') || new Date().toISOString();

  const extractBody = (part) => {
    if (!part) return '';
    if (part.mimeType === 'text/plain' && part.body?.data)
      return Buffer.from(part.body.data, 'base64').toString();
    if (part.mimeType === 'text/html' && part.body?.data)
      return Buffer.from(part.body.data, 'base64').toString().replace(/<[^>]*>/g, '');
    if (part.parts) for (const sub of part.parts) { const b = extractBody(sub); if (b) return b; }
    return '';
  };

  const body = extractBody(message.payload) || '';

  return { subject, from, to, body, date, messageId: message.id, threadId: message.threadId, labelIds: message.labelIds || [] };
};

// -------------------- Default Export --------------------
export default {
  getGmailClient,
  getAuthUrl,
  getTokensFromCode,
  refreshAccessToken,
  listEmails,
  getEmail,
  sendEmail,
  extractEmailData
};
