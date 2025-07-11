/**
 * Test setup file
 * Configures test environment and mocks
 */

// Mock Firebase Admin SDK
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn()
      }))
    }))
  }))
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        makePublic: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn()
      }))
    }))
  }))
}));

// Mock Firebase Functions
jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((handler) => handler)
}));

jest.mock('firebase-functions/v2', () => ({
  setGlobalOptions: jest.fn()
}));

jest.mock('firebase-functions/params', () => ({
  defineSecret: jest.fn(() => ({
    value: jest.fn(() => 'mock-api-key')
  }))
}));

// Mock axios
jest.mock('axios', () => jest.fn());

// Mock p-retry
jest.mock('p-retry', () => jest.fn((fn) => fn()));

// Suppress console output during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}
