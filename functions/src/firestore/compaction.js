/**
 * Firestore Compaction Operations
 * 
 * Handles reading and updating compaction documents in Firestore
 */

const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp, getApps } = require('firebase-admin/app');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Retrieves a compaction document from Firestore
 * @param {string} compactionId - The compaction document ID
 * @returns {Promise<Object|null>} - Compaction document data or null if not found
 */
async function getCompactionDoc(compactionId) {
  try {
    logger.info('firestore_read_start', { compactionId });
    
    const docRef = db.collection('compactions').doc(compactionId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      logger.warn('firestore_doc_not_found', { compactionId });
      return null;
    }
    
    const data = docSnap.data();
    
    // Validate required fields
    const requiredFields = ['compaction_text_human', 'voice_id', 'video_id'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      logger.error('firestore_missing_required_fields', {
        compactionId,
        missingFields
      });
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    logger.info('firestore_read_success', {
      compactionId,
      hasText: !!data.compaction_text_human,
      voiceId: data.voice_id,
      videoId: data.video_id
    });
    
    return data;
    
  } catch (error) {
    logger.error('firestore_read_error', {
      compactionId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Updates a compaction document in Firestore
 * @param {string} compactionId - The compaction document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
async function updateCompactionDoc(compactionId, updateData) {
  try {
    logger.info('firestore_update_start', {
      compactionId,
      updateFields: Object.keys(updateData)
    });
    
    const docRef = db.collection('compactions').doc(compactionId);
    
    // Add timestamp to update
    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    await docRef.update(updatePayload);
    
    logger.info('firestore_update_success', {
      compactionId,
      updateFields: Object.keys(updateData)
    });
    
  } catch (error) {
    logger.error('firestore_update_error', {
      compactionId,
      updateData,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Creates a new compaction document (utility function for testing)
 * @param {string} compactionId - The compaction document ID
 * @param {Object} data - Initial document data
 * @returns {Promise<void>}
 */
async function createCompactionDoc(compactionId, data) {
  try {
    logger.info('firestore_create_start', { compactionId });
    
    const docRef = db.collection('compactions').doc(compactionId);
    
    const createPayload = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await docRef.set(createPayload);
    
    logger.info('firestore_create_success', { compactionId });
    
  } catch (error) {
    logger.error('firestore_create_error', {
      compactionId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  getCompactionDoc,
  updateCompactionDoc,
  createCompactionDoc
};
