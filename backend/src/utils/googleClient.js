import { google } from 'googleapis';

export class GoogleClient {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(scopes = []) {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    return authUrl;
  }

  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  isTokenExpired(tokens) {
    if (!tokens.expiry_date) return true;
    return Date.now() >= tokens.expiry_date;
  }

  // Calendar client
  getCalendarClient(tokens) {
    this.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Meet client
  getMeetClient(tokens) {
    this.setCredentials(tokens);
    return google.meet({ version: 'v2', auth: this.oauth2Client });
  }
}

export default new GoogleClient();