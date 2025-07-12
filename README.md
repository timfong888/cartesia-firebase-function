# Cartesia TTS Firebase Function

A Firebase Cloud Function that integrates with Cartesia's text-to-speech API to generate audio files from text, store them in Firebase Storage, and update Firestore documents.

## 🚀 Live Function

**Endpoint:** https://us-central1-sophia-db784.cloudfunctions.net/cartesiaTTS

## 📋 Overview

This function processes text-to-speech requests by:
1. Authenticating incoming requests via Bearer token
2. Reading compaction documents from Firestore
3. Generating audio using Cartesia's TTS API
4. Uploading audio files to Firebase Storage
5. Updating compaction documents with public audio URLs

## 🏗️ Architecture

```
Request → Authentication → Firestore Read → Cartesia TTS → Storage Upload → Firestore Update → Response
```

### Key Components

- **Main Function** (`src/index.js`) - Request processing pipeline
- **Authentication** (`src/auth/validator.js`) - Bearer token validation
- **Firestore Operations** (`src/firestore/compaction.js`) - Document read/update
- **Cartesia Client** (`src/cartesia/tts.js`) - TTS API integration with retry
- **Storage Uploader** (`src/storage/uploader.js`) - Firebase Storage operations
- **Logger** (`src/utils/logger.js`) - Structured logging

## 📡 API Usage

### Request

```bash
POST https://us-central1-sophia-db784.cloudfunctions.net/cartesiaTTS
Content-Type: application/json

{
  "compaction_id": "your-compaction-document-id",
  "authorization": "Bearer your-auth-token"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "audio_url": "https://storage.googleapis.com/bucket/video_id.mp3",
  "processing_time_ms": 1234
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error description",
  "processing_time_ms": 567
}
```

## 📊 Prerequisites

### Firestore Document Structure

The compaction document must exist in the `compactions` collection with:

```json
{
  "compaction_text_human": "Text to convert to speech",
  "voice_id": "cartesia-voice-id",
  "video_id": "unique-video-identifier"
}
```

### Authentication

Requests must include a Bearer token that matches one of the tokens configured in the `AUTH_TOKENS` Firebase secret. Tokens should be in the format `user_{userId}_{randomString}` for proper user ID extraction.

## 🛠️ Development

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/timfong888/cartesia-firebase-function
   cd cartesia-firebase-function
   ```

2. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

3. **Configure Firebase:**
   ```bash
   firebase login
   firebase use sophia-db784
   ```

4. **Configure Firebase secrets:**
   ```bash
   # Set Cartesia API key
   firebase functions:secrets:set CARTESIA_API_KEY

   # Set authentication tokens (comma-separated)
   firebase functions:secrets:set AUTH_TOKENS
   ```

### Local Development

```bash
# Start Firebase emulator
npm run serve

# Run tests
npm test

# Deploy to Firebase
npm run deploy
```

### Project Structure

```
├── functions/
│   ├── src/
│   │   ├── index.js              # Main function entry point
│   │   ├── auth/validator.js     # Authentication logic
│   │   ├── firestore/compaction.js # Firestore operations
│   │   ├── cartesia/tts.js       # Cartesia API client
│   │   ├── storage/uploader.js   # Firebase Storage operations
│   │   ├── utils/logger.js       # Structured logging
│   │   └── test/                 # Test files
│   ├── package.json              # Dependencies and scripts
│   └── jest.config.js            # Test configuration
├── docs/                         # Project documentation
├── firebase.json                 # Firebase configuration
├── storage.rules                 # Storage security rules
└── README.md                     # This file
```

## 🔧 Configuration

### Firebase Secrets

- `CARTESIA_API_KEY` - Cartesia API key for TTS generation
- `AUTH_TOKENS` - Comma-separated list of valid bearer tokens (e.g., "user_123_token1,user_456_token2")

### Firebase Services

- **Functions** - Node.js 22 runtime, 1GiB memory, 540s timeout
- **Firestore** - Document storage for compaction data
- **Storage** - Audio file hosting with public access

## 📈 Monitoring

### Logging

The function uses structured JSON logging compatible with Firebase Cloud Logging:

- Authentication events
- Firestore operations
- Cartesia API requests/responses
- Storage operations
- Error tracking

### Performance

- Request processing time tracking
- Retry logic with exponential backoff
- Memory and timeout optimizations

## 🔒 Security

### Authentication Tokens
- All valid bearer tokens are stored in Firebase secret `AUTH_TOKENS`
- Tokens should follow format: `user_{userId}_{randomString}`
- Multiple tokens supported (comma-separated in secret)
- No tokens are committed to the repository

### API Security
- Cartesia API key stored as Firebase secret `CARTESIA_API_KEY`
- Firebase Storage rules restrict write access to functions only
- Input validation and sanitization on all requests
- Structured logging for security monitoring

### Secret Management
```bash
# Configure authentication tokens
firebase functions:secrets:set AUTH_TOKENS
# Enter: user_123_mytoken1,user_456_mytoken2

# Configure Cartesia API key
firebase functions:secrets:set CARTESIA_API_KEY
# Enter: sk_car_your_api_key_here
```

## 📚 Documentation

- [PRD](docs/prd-main-1.md) - Product Requirements Document
- [Design](docs/design-1-main.md) - Engineering Design
- [Tasks](docs/tasks-1-main.md) - Implementation Tasks
- [Code Review](docs/review-1-main.md) - Code Quality Assessment
- [Changelog](CHANGELOG.md) - Version History

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in this repository
- Check the [troubleshooting guide](docs/tasks-1-main.md)
- Review function logs in Firebase Console
