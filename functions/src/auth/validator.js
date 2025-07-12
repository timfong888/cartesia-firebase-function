/**
 * Authentication Validator
 *
 * Handles bearer token validation for incoming requests
 * Validates against Firebase secret AUTH_TOKENS
 */

const { defineSecret } = require('firebase-functions/params');
const { logger } = require('../utils/logger');

// Define secret for authentication token
const authToken = defineSecret('AUTH_TOKEN');

/**
 * Validates authorization header against Firebase secret AUTH_TOKENS
 * @param {string} authorization - Authorization header value
 * @returns {Promise<{success: boolean, userId?: string}>}
 */
async function validateAuth(authorization) {
  try {
    // Check if authorization header exists
    if (!authorization) {
      logger.warn('auth_missing_header');
      return { success: false };
    }

    // Check if it's a Bearer token
    if (!authorization.startsWith('Bearer ')) {
      logger.warn('auth_invalid_format', { authorization: authorization.substring(0, 20) + '...' });
      return { success: false };
    }

    // Extract token
    const token = authorization.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.length < 10) {
      logger.warn('auth_invalid_token_length', { tokenLength: token.length });
      return { success: false };
    }

    // Simple hardcoded token check using Firebase secret
    const expectedToken = authToken.value();

    if (!expectedToken) {
      logger.error('auth_secret_missing', { message: 'AUTH_TOKEN secret not configured' });
      return { success: false };
    }

    const isValidToken = token === expectedToken.trim();

    logger.info('auth_token_validation', {
      receivedToken: token.substring(0, 10) + '...',
      receivedTokenLength: token.length,
      expectedTokenLength: expectedToken.length,
      isValidToken
    });

    if (!isValidToken) {
      logger.warn('auth_invalid_token', {
        token: token.substring(0, 10) + '...'
      });
      return { success: false };
    }

    // Extract user ID from token
    const userId = extractUserIdFromToken(token);

    if (!userId) {
      logger.warn('auth_cannot_extract_user_id', { token: token.substring(0, 10) + '...' });
      return { success: false };
    }

    logger.info('auth_validation_success', { userId });
    return { success: true, userId };

  } catch (error) {
    logger.error('auth_validation_error', {
      error: error.message,
      authorization: authorization ? authorization.substring(0, 20) + '...' : 'null'
    });
    return { success: false };
  }
}

/**
 * Extracts user ID from token
 * @param {string} token - Bearer token
 * @returns {string|null} - User ID or null if extraction fails
 */
function extractUserIdFromToken(token) {
  try {
    // Simple extraction logic - in production this would be more sophisticated
    // For now, we'll look for patterns like:
    // - "user_123_abc" -> userId: "123"
    // - Base64 encoded user info
    // - Or just use a hash of the token as user ID for simplicity
    
    // Method 1: Look for user_ prefix pattern
    const userMatch = token.match(/user_([^_]+)/);
    if (userMatch) {
      return userMatch[1];
    }

    // Method 2: Try to decode if it looks like base64
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const decodedMatch = decoded.match(/user[_:]([^_:,}]+)/i);
      if (decodedMatch) {
        return decodedMatch[1];
      }
    } catch (decodeError) {
      // Not base64, continue with other methods
    }

    // Method 3: Generate consistent user ID from token hash (fallback)
    // This ensures the same token always maps to the same user ID
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `user_${hash.substring(0, 8)}`;

  } catch (error) {
    logger.error('user_id_extraction_error', { error: error.message });
    return null;
  }
}

module.exports = {
  validateAuth
};
