/**
 * Basic tests for Cartesia TTS Firebase Function
 * 
 * Tests core modules and integration
 */

const { logger } = require('../utils/logger');

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
    expect(() => require('../utils/logger')).not.toThrow();
    expect(() => require('../firestore/compaction')).not.toThrow();
    expect(() => require('../cartesia/tts')).not.toThrow();
    expect(() => require('../storage/uploader')).not.toThrow();
  });
});
