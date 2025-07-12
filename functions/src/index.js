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
    console.log(`Processing request for compaction: ${compactionId}`);

    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Authentication failed: missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const expectedToken = authToken.value();

    if (token !== expectedToken) {
      console.log('Authentication failed: token mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful');
    userId = 'authenticated_user';

    // Step 4: Read compaction document
    console.log(`Reading compaction document: ${compactionId}`);
    const compactionDoc = await getCompactionDoc(compactionId);
    if (!compactionDoc) {
      console.log(`Compaction document not found: ${compactionId}`);
      return res.status(404).json({ error: 'Compaction document not found' });
    }
    console.log(`Found compaction document with voice: ${compactionDoc.voice_id}`);

    // Step 5: Generate TTS audio
    console.log(`Generating TTS audio for ${compactionId} (${compactionDoc.compaction_text_human.length} chars)`);
    const audioBuffer = await generateTTS({
      transcript: compactionDoc.compaction_text_human,
      voiceId: compactionDoc.voice_id,
      compactionId,
      userId,
      apiKey: cartesiaApiKey.value()
    });
    console.log(`TTS audio generated: ${audioBuffer.length} bytes`);

    // Step 6: Upload to Firebase Storage
    console.log(`Uploading audio to storage: ${compactionDoc.video_id}.mp3`);
    const publicUrl = await uploadAudio({
      audioBuffer,
      videoId: compactionDoc.video_id,
      compactionId,
      userId
    });
    console.log(`Audio uploaded successfully: ${publicUrl}`);

    // Step 7: Update compaction document
    console.log(`Updating compaction document with audio URL`);
    await updateCompactionDoc(compactionId, { audio_url: publicUrl });

    // Step 8: Return success response
    console.log(`Request completed successfully for ${compactionId}`);
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
