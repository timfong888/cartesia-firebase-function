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

Requests must include a Bearer token in the authorization field. The function supports multiple token formats and extracts user IDs for logging.

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

4. **Set Cartesia API key:**
   ```bash
   firebase functions:secrets:set CARTESIA_API_KEY
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

### Environment Variables

- `CARTESIA_API_KEY` - Cartesia API key (Firebase secret)

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

- Bearer token authentication
- Firebase Storage rules restrict write access
- API keys stored as Firebase secrets
- Input validation and sanitization

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
