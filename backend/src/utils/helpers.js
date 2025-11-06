import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../Config/index.js';

// Password utilities
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 10000); // Limit length
};

// Date utilities
export const formatDate = (date, format = 'iso') => {
  const d = new Date(date);
  
  switch (format) {
    case 'iso':
      return d.toISOString();
    case 'date':
      return d.toISOString().split('T')[0];
    case 'time':
      return d.toISOString().split('T')[1].split('.')[0];
    case 'human':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    default:
      return d.toISOString();
  }
};

export const getDateRange = (period = '7d') => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '1d':
      start.setDate(start.getDate() - 1);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

// File utilities
export const validateFileType = (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

export const getFileSizeMB = (sizeInBytes) => {
  return (sizeInBytes / (1024 * 1024)).toFixed(2);
};

// String utilities
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Array utilities
export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const uniqueArray = (array, key = null) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

// Object utilities
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const sanitizeObject = (obj, fieldsToRemove = ['password', 'token', 'secret']) => {
  const sanitized = { ...obj };
  fieldsToRemove.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
};

// Error handling utilities
export const createError = (message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Response formatting
export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

export const errorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    errors,
    statusCode
  };
};

// Logging utilities
export const logInfo = (message, data = null) => {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export const logError = (message, error = null) => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error ? error.stack : '');
};

export const logWarning = (message, data = null) => {
  console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  isValidEmail,
  isValidPhone,
  sanitizeInput,
  formatDate,
  getDateRange,
  validateFileType,
  getFileSizeMB,
  truncateText,
  capitalizeWords,
  generateRandomString,
  chunkArray,
  uniqueArray,
  deepClone,
  sanitizeObject,
  createError,
  handleAsync,
  successResponse,
  errorResponse,
  logInfo,
  logError,
  logWarning
};