/**
 * Firebase Storage Uploader
 * 
 * Handles uploading audio files to Firebase Storage
 * Creates public URLs for audio access
 */

const { getStorage } = require('firebase-admin/storage');
const { initializeApp, getApps } = require('firebase-admin/app');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Uploads audio buffer to Firebase Storage and returns public URL
 * @param {Object} params - Upload parameters
 * @param {Buffer} params.audioBuffer - Audio data to upload
 * @param {string} params.videoId - Video ID for file naming
 * @param {string} params.compactionId - Compaction ID for logging
 * @param {string} params.userId - User ID for logging
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadAudio({ audioBuffer, videoId, compactionId, userId }) {
  const uploadId = generateUploadId();
  const fileName = `${videoId}.mp3`;
  
  logger.info('storage_upload_start', {
    compactionId,
    userId,
    uploadId,
    fileName,
    audioSize: audioBuffer.length
  });

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(fileName);
    
    // Upload options
    const uploadOptions = {
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000', // 1 year cache
        metadata: {
          compactionId: compactionId,
          userId: userId,
          uploadId: uploadId,
          uploadedAt: new Date().toISOString()
        }
      },
      resumable: false, // Use simple upload for smaller files
      validation: 'crc32c' // Enable validation
    };

    // Upload the file
    const startTime = Date.now();
    await file.save(audioBuffer, uploadOptions);
    const uploadTime = Date.now() - startTime;

    logger.info('storage_upload_complete', {
      compactionId,
      userId,
      uploadId,
      fileName,
      uploadTime,
      audioSize: audioBuffer.length
    });

    // Make the file publicly accessible
    await file.makePublic();
    
    logger.info('storage_make_public_complete', {
      compactionId,
      userId,
      uploadId,
      fileName
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    logger.info('storage_upload_success', {
      compactionId,
      userId,
      uploadId,
      fileName,
      publicUrl,
      totalTime: Date.now() - startTime
    });

    return publicUrl;

  } catch (error) {
    logger.error('storage_upload_error', {
      compactionId,
      userId,
      uploadId,
      fileName,
      error: error.message,
      stack: error.stack,
      audioSize: audioBuffer.length
    });

    // Provide more specific error messages
    if (error.code === 'ENOENT') {
      throw new Error('Firebase Storage bucket not found');
    } else if (error.code === 'EACCES') {
      throw new Error('Firebase Storage permission denied');
    } else if (error.message.includes('quota')) {
      throw new Error('Firebase Storage quota exceeded');
    } else {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
  }
}

/**
 * Deletes an audio file from Firebase Storage (utility function)
 * @param {string} videoId - Video ID to delete
 * @param {string} compactionId - Compaction ID for logging
 * @param {string} userId - User ID for logging
 * @returns {Promise<void>}
 */
async function deleteAudio(videoId, compactionId, userId) {
  const fileName = `${videoId}.mp3`;
  
  logger.info('storage_delete_start', {
    compactionId,
    userId,
    fileName
  });

  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(fileName);
    
    await file.delete();
    
    logger.info('storage_delete_success', {
      compactionId,
      userId,
      fileName
    });

  } catch (error) {
    if (error.code === 404) {
      logger.warn('storage_delete_not_found', {
        compactionId,
        userId,
        fileName
      });
      return; // File doesn't exist, consider it deleted
    }

    logger.error('storage_delete_error', {
      compactionId,
      userId,
      fileName,
      error: error.message
    });
    throw error;
  }
}

/**
 * Checks if an audio file exists in Firebase Storage
 * @param {string} videoId - Video ID to check
 * @returns {Promise<boolean>} - True if file exists
 */
async function audioExists(videoId) {
  const fileName = `${videoId}.mp3`;
  
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(fileName);
    
    const [exists] = await file.exists();
    return exists;

  } catch (error) {
    logger.error('storage_exists_check_error', {
      fileName,
      error: error.message
    });
    return false;
  }
}

/**
 * Generates a unique upload ID for tracking
 * @returns {string} - Unique upload ID
 */
function generateUploadId() {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

module.exports = {
  uploadAudio,
  deleteAudio,
  audioExists
};
