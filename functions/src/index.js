/**
 * Cartesia TTS Firebase Cloud Function
 * 
 * Main entry point for text-to-speech processing
 * Integrates with Firestore, Cartesia API, and Firebase Storage
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

// Import modules
const { validateAuth } = require('./auth/validator');
const { getCompactionDoc, updateCompactionDoc } = require('./firestore/compaction');
const { generateTTS } = require('./cartesia/tts');
const { uploadAudio } = require('./storage/uploader');
const { logger } = require('./utils/logger');

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
  { secrets: ['AUTH_TOKEN', 'cartesia_api_key'] },
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

    // Step 3: Authenticate request (from Authorization header)
    const authorization = req.get('Authorization');

    // Enhanced logging for debugging
    logger.info('request_headers_debug', {
      compactionId,
      authorization: authorization ? authorization.substring(0, 20) + '...' : 'null',
      authorizationLength: authorization ? authorization.length : 0,
      allHeaders: Object.keys(req.headers),
      userAgent: req.get('User-Agent'),
      method: req.method,
      timestamp: new Date().toISOString()
    });

    const authResult = await validateAuth(authorization);
    if (!authResult.success) {
      logger.error('authentication_failure', { compactionId });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    userId = authResult.userId;
    logger.info('authentication_succeed', { userId, compactionId });

    // Step 4: Read compaction document
    const compactionDoc = await getCompactionDoc(compactionId);
    if (!compactionDoc) {
      logger.error('read_compaction_doc_failure', { userId, compactionId });
      return res.status(404).json({ error: 'Compaction document not found' });
    }
    
    logger.info('read_compaction_doc_succeed', { userId, compactionId });

    // Step 5: Generate TTS audio
    const audioBuffer = await generateTTS({
      transcript: compactionDoc.compaction_text_human,
      voiceId: compactionDoc.voice_id,
      compactionId,
      userId
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
    const processingTime = Date.now() - startTime;
    logger.info('tts_processing_complete', {
      userId,
      compactionId,
      publicUrl,
      processingTime
    });

    return res.status(200).json({
      success: true,
      audio_url: publicUrl,
      processing_time_ms: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('tts_processing_error', {
      userId,
      compactionId,
      error: error.message,
      stack: error.stack,
      processingTime
    });

    // Update compaction document with error if we have the ID
    if (compactionId) {
      try {
        await updateCompactionDoc(compactionId, {
          enumStatus: 'failed',
          status_code: error.statusCode || 500,
          error: error.message
        });
      } catch (updateError) {
        logger.error('error_update_failure', {
          compactionId,
          updateError: updateError.message
        });
      }
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
      processing_time_ms: processingTime
    });
  }
});
