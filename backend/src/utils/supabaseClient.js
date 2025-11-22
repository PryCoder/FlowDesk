import { createClient } from '@supabase/supabase-js';
import config from '../../rec/index.js';

// Create Supabase client
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key are required in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error.message);
    return false;
  }
};

// Helper functions for common operations
export const executeQuery = async (query, options = {}) => {
  try {
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

export const handleError = (error, customMessage = 'Database operation failed') => {
  console.error(`${customMessage}:`, error);
  throw new Error(error.message || customMessage);
};

export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Retry attempt ${attempt} failed, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default supabase;