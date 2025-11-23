import supabase from '../utils/supabaseClient.js';
import googleClient from '../utils/googleClient.js';

export class TokenService {
  constructor() {
    this.services = {
      CALENDAR: 'calendar',
      MEET: 'meet',
      GMAIL: 'gmail'
    };
  }

  // -------------------- Token Storage --------------------
  async storeUserTokens(userId, service, tokens) {
    try {
      console.log(`🔐 [TokenService] Storing ${service} tokens for user ${userId}`);
      
      const tokenData = {
        user_id: userId,
        service: service,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope,
        token_type: tokens.token_type,
        updated_at: new Date().toISOString()
      };

      // Check if tokens already exist for this user and service
      const { data: existingTokens } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('service', service)
        .single();

      let result;
      if (existingTokens) {
        // Update existing tokens
        result = await supabase
          .from('user_tokens')
          .update(tokenData)
          .eq('user_id', userId)
          .eq('service', service)
          .select()
          .single();
      } else {
        // Insert new tokens
        result = await supabase
          .from('user_tokens')
          .insert(tokenData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      console.log(`✅ [TokenService] Successfully stored ${service} tokens for user ${userId}`);
      return result.data;
    } catch (error) {
      console.error(`💥 [TokenService] Failed to store ${service} tokens for user ${userId}:`, error);
      throw new Error(`TokenService.storeUserTokens: ${error.message}`);
    }
  }

  // -------------------- Token Retrieval --------------------
  async getUserTokens(userId, service) {
    try {
      console.log(`🔐 [TokenService] Retrieving ${service} tokens for user ${userId}`);
      
      const { data: tokens, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('service', service)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No tokens found
          console.log(`❌ [TokenService] No ${service} tokens found for user ${userId}`);
          throw new Error(`No ${service} tokens found. Please reconnect your account.`);
        }
        throw error;
      }

      // Check if access token is expired
      if (this.isTokenExpired(tokens)) {
        console.log(`🔄 [TokenService] ${service} tokens expired for user ${userId}, refreshing...`);
        return await this.refreshAndUpdateTokens(userId, service, tokens);
      }

      console.log(`✅ [TokenService] Successfully retrieved ${service} tokens for user ${userId}`);
      return this.formatTokensForClient(tokens);
    } catch (error) {
      console.error(`💥 [TokenService] Failed to retrieve ${service} tokens for user ${userId}:`, error);
      throw new Error(`TokenService.getUserTokens: ${error.message}`);
    }
  }

  // -------------------- Token Refresh --------------------
  async refreshAndUpdateTokens(userId, service, tokens) {
    try {
      if (!tokens.refresh_token) {
        throw new Error('No refresh token available. Please reconnect your account.');
      }

      const refreshedTokens = await googleClient.refreshAccessToken(tokens.refresh_token);
      
      // Update tokens in database
      const updatedTokenData = {
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token || tokens.refresh_token, // Keep old refresh token if new one not provided
        expiry_date: refreshedTokens.expiry_date ? new Date(refreshedTokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedTokens, error } = await supabase
        .from('user_tokens')
        .update(updatedTokenData)
        .eq('user_id', userId)
        .eq('service', service)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ [TokenService] Successfully refreshed ${service} tokens for user ${userId}`);
      return this.formatTokensForClient(updatedTokens);
    } catch (error) {
      console.error(`💥 [TokenService] Failed to refresh ${service} tokens for user ${userId}:`, error);
      
      // If refresh fails, delete the invalid tokens
      await this.deleteUserTokens(userId, service);
      throw new Error('Token refresh failed. Please reconnect your account.');
    }
  }

  // -------------------- Token Management --------------------
  async deleteUserTokens(userId, service) {
    try {
      const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('service', service);

      if (error) throw error;

      console.log(`✅ [TokenService] Successfully deleted ${service} tokens for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`💥 [TokenService] Failed to delete ${service} tokens for user ${userId}:`, error);
      throw new Error(`TokenService.deleteUserTokens: ${error.message}`);
    }
  }

  async getUserConnectedServices(userId) {
    try {
      const { data: tokens, error } = await supabase
        .from('user_tokens')
        .select('service, created_at, updated_at')
        .eq('user_id', userId);

      if (error) throw error;

      const services = {
        calendar: false,
        meet: false,
        gmail: false
      };

      tokens.forEach(token => {
        services[token.service] = {
          connected: true,
          connectedSince: token.created_at,
          lastUpdated: token.updated_at
        };
      });

      return services;
    } catch (error) {
      console.error(`💥 [TokenService] Failed to get connected services for user ${userId}:`, error);
      throw new Error(`TokenService.getUserConnectedServices: ${error.message}`);
    }
  }

  // -------------------- Token Validation --------------------
  isTokenExpired(tokens) {
    if (!tokens.expiry_date) return true;
    
    const now = new Date();
    const expiryDate = new Date(tokens.expiry_date);
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    
    return now >= (expiryDate - buffer);
  }

  // -------------------- Token Formatting --------------------
  formatTokensForClient(tokens) {
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : null,
      scope: tokens.scope,
      token_type: tokens.token_type
    };
  }

  // -------------------- Bulk Operations --------------------
  async getValidTokensForUser(userId) {
    try {
      const { data: allTokens, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const validTokens = {};
      
      for (const token of allTokens) {
        try {
          if (this.isTokenExpired(token) && token.refresh_token) {
            // Refresh expired tokens
            validTokens[token.service] = await this.refreshAndUpdateTokens(userId, token.service, token);
          } else {
            validTokens[token.service] = this.formatTokensForClient(token);
          }
        } catch (error) {
          console.error(`Failed to process ${token.service} tokens:`, error.message);
          // Skip invalid tokens
        }
      }

      return validTokens;
    } catch (error) {
      console.error(`💥 [TokenService] Failed to get valid tokens for user ${userId}:`, error);
      throw new Error(`TokenService.getValidTokensForUser: ${error.message}`);
    }
  }
}

export default new TokenService();