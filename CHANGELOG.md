# Changelog

All notable changes to the Cartesia Firebase Function project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-11

### Added
- Initial Firebase Cloud Function implementation for Cartesia TTS integration
- Modular architecture with separate modules for authentication, Firestore, TTS, storage, and logging
- Bearer token authentication system with user ID extraction
- Firestore compaction document operations (read/update)
- Cartesia TTS client with p-retry exponential backoff resilience
- Firebase Storage uploader with public URL generation
- Structured logger utility for comprehensive monitoring and debugging
- Firebase configuration with Node.js 22 runtime support
- Storage security rules for public audio file access
- Jest testing framework with comprehensive mocks
- Complete error handling with compaction document status updates
- Performance timing and monitoring throughout request pipeline

### Features
- **Authentication**: Bearer token validation with multiple format support
- **TTS Processing**: Integration with Cartesia API using sonic-2 model
- **Storage**: Automatic upload to Firebase Storage with public URL generation
- **Logging**: Structured logging compatible with Firebase Cloud Logging
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Retry Logic**: Exponential backoff retry for API resilience
- **Security**: Secure storage rules and authentication validation

### Technical Details
- **Runtime**: Node.js 22 with Firebase Functions v2
- **Dependencies**: firebase-admin, firebase-functions, p-retry, axios
- **Architecture**: Modular design with clear separation of concerns
- **Testing**: Jest framework with mocks for Firebase services
- **Logging**: JSON-structured logs for Cloud Logging integration

### Configuration
- Firebase project configuration with Functions v2
- Storage rules for public read access to audio files
- Secret management for Cartesia API key
- Memory and timeout optimizations for audio processing

### Documentation
- Comprehensive code documentation and comments
- PRD, design, and task documentation in `/docs` folder
- Test setup and configuration files
- Security and performance considerations

### Files Added
- `functions/src/index.js` - Main Cloud Function entry point
- `functions/src/auth/validator.js` - Authentication validation
- `functions/src/firestore/compaction.js` - Firestore operations
- `functions/src/cartesia/tts.js` - Cartesia TTS client
- `functions/src/storage/uploader.js` - Firebase Storage operations
- `functions/src/utils/logger.js` - Structured logging utility
- `functions/package.json` - Node.js dependencies and scripts
- `firebase.json` - Firebase project configuration
- `storage.rules` - Firebase Storage security rules
- `functions/jest.config.js` - Jest testing configuration
- `functions/src/test/` - Test files and setup
- `docs/review-1-main.md` - Code review documentation

### Next Steps
- Firebase authentication setup required
- Cartesia API key configuration needed
- Dependency installation and deployment
- Integration testing with real API endpoints
