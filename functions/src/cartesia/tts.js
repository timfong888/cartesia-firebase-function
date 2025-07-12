/**
 * Cartesia TTS Client
 * 
 * Handles text-to-speech generation with retry logic
 * Integrates with Cartesia API using p-retry for resilience
 */

const axios = require('axios');

/**
 * Generates TTS audio using Cartesia API
 * @param {Object} params - TTS parameters
 * @param {string} params.transcript - Text to convert to speech
 * @param {string} params.voiceId - Voice ID for TTS
 * @param {string} params.compactionId - Compaction ID for logging
 * @param {string} params.userId - User ID for logging
 * @param {string} params.apiKey - Cartesia API key
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function generateTTS({ transcript, voiceId, compactionId, userId, apiKey }) {
  try {
    // Dynamic import for p-retry ES module
    const { default: pRetry } = await import('p-retry');

    const audioBuffer = await pRetry(
      () => makeCartesiaRequest(transcript, voiceId, compactionId, userId, apiKey),
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        onFailedAttempt: (error) => {
          console.warn(`Cartesia retry attempt ${error.attemptNumber} for ${compactionId}: ${error.message}`);
        }
      }
    );

    return audioBuffer;

  } catch (error) {
    console.error(`Cartesia TTS failed for ${compactionId}:`, error.message);
    throw error;
  }
}

/**
 * Makes the actual request to Cartesia API
 * @param {string} transcript - Text to convert
 * @param {string} voiceId - Voice ID
 * @param {string} compactionId - Compaction ID for logging
 * @param {string} userId - User ID for logging
 * @param {string} apiKey - Cartesia API key
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function makeCartesiaRequest(transcript, voiceId, compactionId, userId, apiKey) {
  
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

    const response = await axios({
      method: 'POST',
      url: 'https://api.cartesia.ai/tts/bytes',
      headers: {
        'Cartesia-Version': '2025-04-16',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      data: requestPayload,
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioBuffer = Buffer.from(response.data);

    // Validate response
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Empty audio response from Cartesia API');
    }

    return audioBuffer;

  } catch (error) {
    if (error.response) {
      const statusCode = error.response.status;
      if (statusCode === 401) {
        throw new Error('Cartesia API authentication failed');
      } else if (statusCode === 429) {
        throw new Error('Cartesia API rate limit exceeded');
      } else if (statusCode >= 500) {
        throw new Error(`Cartesia API server error: ${statusCode}`);
      } else {
        throw new Error(`Cartesia API error: ${statusCode}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Cartesia API request timeout');
    } else {
      throw new Error(`Cartesia API network error: ${error.message}`);
    }
  }
}



module.exports = {
  generateTTS
};
