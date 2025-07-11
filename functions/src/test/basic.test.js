/**
 * Basic tests for Cartesia TTS Firebase Function
 * 
 * Tests core modules and integration
 */

const { validateAuth } = require('../auth/validator');
const { logger } = require('../utils/logger');

describe('Authentication Validator', () => {
  test('should reject missing authorization', async () => {
    const result = await validateAuth(null);
    expect(result.success).toBe(false);
  });

  test('should reject invalid format', async () => {
    const result = await validateAuth('InvalidToken');
    expect(result.success).toBe(false);
  });

  test('should accept valid bearer token', async () => {
    const result = await validateAuth('Bearer user_123_validtoken');
    expect(result.success).toBe(true);
    expect(result.userId).toBe('123');
  });

  test('should extract user ID from token hash', async () => {
    const result = await validateAuth('Bearer somevalidtokenstring');
    expect(result.success).toBe(true);
    expect(result.userId).toMatch(/^user_[a-f0-9]{8}$/);
  });
});

describe('Logger Utility', () => {
  test('should create log entries', () => {
    // Mock console methods
    const originalConsoleInfo = console.info;
    console.info = jest.fn();

    logger.info('test_event', { key: 'value' });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"test_event"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"key":"value"')
    );

    // Restore console
    console.info = originalConsoleInfo;
  });

  test('should create child logger with context', () => {
    const childLogger = logger.createChildLogger({ userId: '123' });
    
    const originalConsoleInfo = console.info;
    console.info = jest.fn();

    childLogger.info('test_event', { additional: 'data' });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"userId":"123"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"additional":"data"')
    );

    console.info = originalConsoleInfo;
  });
});

describe('Module Imports', () => {
  test('should import all modules without errors', () => {
    expect(() => require('../auth/validator')).not.toThrow();
    expect(() => require('../utils/logger')).not.toThrow();
    expect(() => require('../firestore/compaction')).not.toThrow();
    expect(() => require('../cartesia/tts')).not.toThrow();
    expect(() => require('../storage/uploader')).not.toThrow();
  });
});
