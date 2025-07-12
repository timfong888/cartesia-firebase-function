/**
 * Cartesia TTS Firebase Cloud Function
 * 
 * Main entry point for text-to-speech processing
 * Integrates with Firestore, Cartesia API, and Firebase Storage
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');

// Import modules
const { getCompactionDoc, updateCompactionDoc } = require('./firestore/compaction');
const { generateTTS } = require('./cartesia/tts');
const { uploadAudio } = require('./storage/uploader');
const { logger } = require('./utils/logger');

// Define secrets
const authToken = defineSecret('AUTH_TOKEN');
const cartesiaApiKey = defineSecret('cartesia_api_key');

// Configure global options for Node.js 22
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 540
});

/**
 * Main Cloud Function handler
 * Processes TTS requests and updates compaction documents
 */
exports.cartesiaTTS = onRequest(
  { secrets: [authToken, cartesiaApiKey] },
  async (req, res) => {
  const startTime = Date.now();
  let compactionId, userId;

  try {
    // Step 1: Validate request method
    if (req.method !== 'POST') {
      logger.error('invalid_method', { method: req.method });
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Step 2: Extract payload
    const { compaction_id } = req.body;
    compactionId = compaction_id;

    if (!compactionId) {
      logger.error('missing_compaction_id', { body: req.body });
      return res.status(400).json({ error: 'Missing compaction_id' });
    }

    // Step 3: Simple authentication
    const authorization = req.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const expectedToken = authToken.value();

    if (token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Simple user ID for logging
    userId = 'authenticated_user';

    // Step 4: Read compaction document
    const compactionDoc = await getCompactionDoc(compactionId);
    if (!compactionDoc) {
      return res.status(404).json({ error: 'Compaction document not found' });
    }

    // Step 5: Generate TTS audio
    const audioBuffer = await generateTTS({
      transcript: compactionDoc.compaction_text_human,
      voiceId: compactionDoc.voice_id,
      compactionId,
      userId,
      apiKey: cartesiaApiKey.value()
    });

    // Step 6: Upload to Firebase Storage
    const publicUrl = await uploadAudio({
      audioBuffer,
      videoId: compactionDoc.video_id,
      compactionId,
      userId
    });

    // Step 7: Update compaction document
    await updateCompactionDoc(compactionId, { audio_url: publicUrl });

    // Step 8: Return success response
    return res.status(200).json({
      success: true,
      audio_url: publicUrl
    });

  } catch (error) {
    console.error('TTS processing error:', error);

    // Update compaction document with error if we have the ID
    if (compactionId) {
      try {
        await updateCompactionDoc(compactionId, {
          enumStatus: 'failed',
          error: error.message
        });
      } catch (updateError) {
        console.error('Failed to update compaction doc:', updateError);
      }
    }

    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});
