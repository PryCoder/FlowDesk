import { google } from 'googleapis';
import config from '../../rec/index.js';

// -------------------- OAuth2 Client --------------------
const oauth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
   config.gmail.clientSecret,
   config.gmail.redirectUri
);

console.log("CALENDAR REDIRECT:",config.gmail.redirectUri);
console.log("CALENDAR CLIENT ID:", process.env.GOOGLE_CLIENT_ID);

// -------------------- Generate Auth URL --------------------
export const getCalendarAuthUrl = () =>
  oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/meetings.space.created'
    ]
  });

// -------------------- Exchange Code for Tokens --------------------
export const getTokensFromCode = async (code) => {
  if (!code) throw new Error("Authorization code is required");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (err) {
    console.error("❌ Error getting tokens:", err);
    throw new Error("Failed to get tokens from code");
  }
};

// -------------------- Refresh Access Token --------------------
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is required");

  try {
    const tempClient = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    tempClient.setCredentials({ refresh_token: refreshToken });

    const accessToken = await tempClient.getAccessToken();
    if (!accessToken?.token) throw new Error("Failed to refresh access token");

    return { access_token: accessToken.token, refresh_token: refreshToken };
  } catch (err) {
    console.error("❌ Error refreshing token:", err);
    throw new Error("Failed to refresh access token");
  }
};

// -------------------- Calendar Client --------------------
export const getCalendarClient = (tokens) => {
  if (!tokens) throw new Error("Tokens missing");
  oauth2Client.setCredentials(tokens);

  return google.calendar({
    version: "v3",
    auth: oauth2Client
  });
};

// -------------------- Google Meet Client --------------------
export const getMeetClient = (tokens) => {
  if (!tokens) throw new Error("Tokens missing");
  oauth2Client.setCredentials(tokens);

  return google.meet({
    version: "v2",
    auth: oauth2Client
  });
};

// -------------------- Default Export --------------------
export default {
  getCalendarAuthUrl,
  getTokensFromCode,
  refreshAccessToken,
  getCalendarClient,
  getMeetClient
};
