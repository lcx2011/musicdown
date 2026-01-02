/**
 * Environment configuration module
 * Handles environment variables for both Vite and Jest environments
 */

// Detect if we're in a test environment
const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';

/**
 * API Configuration from environment variables
 * 
 * In test environment: uses process.env
 * In Vite environment: uses import.meta.env (handled by Vite)
 */
export const ENV = isTest ? {
  // Test environment - use process.env
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.example.com',
  API_TIMEOUT: parseInt(process.env.VITE_API_TIMEOUT || '30000', 10),
  API_ENABLE_RETRY: process.env.VITE_API_ENABLE_RETRY !== 'false',
} : {
  // Vite environment - these will be replaced by Vite at build time
  API_BASE_URL: 'https://api.example.com',
  API_TIMEOUT: 30000,
  API_ENABLE_RETRY: true,
};
