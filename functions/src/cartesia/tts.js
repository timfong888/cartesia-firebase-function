/**
 * Cartesia TTS Client
 * 
 * Handles text-to-speech generation with retry logic
 * Integrates with Cartesia API using p-retry for resilience
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Generates TTS audio using Cartesia API
 * @param {Object} params - TTS parameters
 * @param {string} params.transcript - Text to convert to speech
 * @param {string} params.voiceId - Voice ID for TTS
 * @param {string} params.compactionId - Compaction ID for logging
 * @param {string} params.userId - User ID for logging
 * @param {string} params.apiKey - Cartesia API key
 * @returns {Promise<{audioBuffer: Buffer, cartesiaRequestId: string}>} - Audio buffer and Cartesia request ID
 */
async function generateTTS({ transcript, voiceId, compactionId, userId, apiKey }) {
  const requestId = generateRequestId();

  logger.info('cartesia_tts_start', {
    compactionId,
    userId,
    requestId,
    textLength: transcript.length,
    voiceId
  });

  try {
    // Dynamic import for p-retry ES module
    const { default: pRetry } = await import('p-retry');

    const result = await pRetry(
      () => makeCartesiaRequest(transcript, voiceId, requestId, compactionId, userId, apiKey),
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        onFailedAttempt: (error) => {
          logger.warn('cartesia_retry_attempt', {
            compactionId,
            userId,
            requestId,
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
            error: error.message
          });
        }
      }
    );

    logger.info('cartesia_tts_success', {
      compactionId,
      userId,
      requestId,
      cartesiaRequestId: result.cartesiaRequestId,
      audioSize: result.audioBuffer.length
    });

    return result;

  } catch (error) {
    logger.error('cartesia_tts_failure', {
      compactionId,
      userId,
      requestId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Makes the actual request to Cartesia API
 * @param {string} transcript - Text to convert
 * @param {string} voiceId - Voice ID
 * @param {string} requestId - Request ID for tracking
 * @param {string} compactionId - Compaction ID for logging
 * @param {string} userId - User ID for logging
 * @param {string} apiKey - Cartesia API key
 * @returns {Promise<{audioBuffer: Buffer, cartesiaRequestId: string}>} - Audio buffer and Cartesia request ID
 */
async function makeCartesiaRequest(transcript, voiceId, requestId, compactionId, userId, apiKey) {
  const startTime = Date.now();
  
  try {
    const requestPayload = {
      model_id: 'sonic-2',
      transcript: transcript,
      voice: {
        mode: 'id',
        id: voiceId
      },
      output_format: {
        container: 'mp3',
        bit_rate: 128000,
        sample_rate: 44100
      },
      language: 'en'
    };

    // API key passed as parameter
    if (!apiKey) {
      throw new Error('Cartesia API key not provided');
    }

    logger.info('cartesia_request_start', {
      compactionId,
      userId,
      requestId,
      payload: {
        model_id: requestPayload.model_id,
        textLength: transcript.length,
        voiceId: voiceId,
        outputFormat: requestPayload.output_format
      },
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10)
    });

    const response = await axios({
      method: 'POST',
      url: 'https://api.cartesia.ai/tts/bytes',
      headers: {
        'Cartesia-Version': '2025-04-16',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Firebase-Function/1.0'
      },
      data: requestPayload,
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });

    const responseTime = Date.now() - startTime;
    const cartesiaRequestId = response.headers['x-request-id'];
    const audioBuffer = Buffer.from(response.data);

    logger.info('cartesia_request_success', {
      compactionId,
      userId,
      requestId,
      cartesiaRequestId,
      statusCode: response.status,
      audioSize: audioBuffer.length,
      responseTime
    });

    // Enhanced logging for x-request-id tracing
    logger.info('cartesia_x_request_id_received', {
      compactionId,
      userId,
      cartesiaRequestId,
      message: `Cartesia x-request-id: ${cartesiaRequestId}`
    });

    // Validate response
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Empty audio response from Cartesia API');
    }

    return { audioBuffer, cartesiaRequestId };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.response) {
      // HTTP error response
      const statusCode = error.response.status;
      const cartesiaRequestId = error.response.headers['x-request-id'];
      
      logger.error('cartesia_request_http_error', {
        compactionId,
        userId,
        requestId,
        cartesiaRequestId,
        statusCode,
        responseTime,
        error: error.message,
        responseData: error.response.data ? error.response.data.toString() : null
      });

      // Create more specific error for different status codes
      if (statusCode === 401) {
        throw new Error('Cartesia API authentication failed');
      } else if (statusCode === 429) {
        throw new Error('Cartesia API rate limit exceeded');
      } else if (statusCode >= 500) {
        throw new Error(`Cartesia API server error: ${statusCode}`);
      } else {
        throw new Error(`Cartesia API error: ${statusCode} - ${error.message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      logger.error('cartesia_request_timeout', {
        compactionId,
        userId,
        requestId,
        responseTime,
        timeout: 30000
      });
      throw new Error('Cartesia API request timeout');
    } else {
      // Network or other error
      logger.error('cartesia_request_network_error', {
        compactionId,
        userId,
        requestId,
        responseTime,
        error: error.message,
        code: error.code
      });
      throw new Error(`Cartesia API network error: ${error.message}`);
    }
  }
}

/**
 * Generates a unique request ID for tracking
 * @returns {string} - Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

module.exports = {
  generateTTS
};
