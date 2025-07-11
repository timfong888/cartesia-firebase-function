# PRD: Cartesia TTS Firebase Function

**Branch:** main  
**GitHub Issue:** [#1](https://github.com/timfong888/cartesia-firebase-function/issues/1)

## Overview
Cost-effective, minimal, resilient Firebase Cloud Function that converts text to speech using Cartesia TTS API and stores audio files in Firebase Storage.

## User Stories

### Primary User Story
**As a** client application  
**I want to** send text content and receive a publicly accessible audio URL  
**So that** I can play generated speech audio in my application

### Edge Cases & Exceptions
- **Authentication failure:** Return 401 with clear error message
- **Cartesia API failure:** Retry with exponential backoff, log failure details
- **Firebase Storage failure:** Log error, update compaction status to failed
- **Invalid compaction_id:** Return 400 with validation error
- **Missing required fields:** Return 400 with field validation errors

## Technical Requirements

### Input Payload
```json
{
  "compaction_id": "string",
  "user_id": "string"
}
```
headers have bearer token. thsi is checked for aithentication. 

### Authentication
- Validate authentication token from request header
- Extract user_id from validated token (how is this done?)
- Log authentication success/failure with user_id and compaction_id

### Data Flow
1. **Authentication** → Validate token, extract user_id
2. **Read Compaction** → Fetch document from Firestore `compactions` collection
3. **TTS Request** → Send to Cartesia API with retry logic
4. **Storage** → Upload audio binary to Firebase Storage
5. **Update Record** → Store public URL in compaction document

### Cartesia TTS Configuration
- **model_id:** `sonic-2`
- **transcript:** `compactionDoc.compaction_text_human`
- **voice:** `{mode: "id", id: compactionDoc.voice_id}`
- **output_format:** `{container: "mp3", bit_rate: 128000, sample_rate: 44100}`
- **language:** `en`

### Error Handling
- All failures update compaction record with:
  - `status_code`: HTTP status code
  - `error`: Error message
  - `enumStatus`: `failed`

### Logging Requirements
- `authentication_succeed/failure`: user_id, compaction_id
- `read_compaction_doc_succeed/failure`: user_id, compaction_id
- `cartesia-tts-request`: compaction_id, user_id, cartesia-request-id
- `cartesia-tts-response`: compaction_id, user_id, cartesia-request-id, file-size, receive-time
- `store-in-firebase`: compaction_id, user_id, cartesia-request-id, public_url

### Non-Functional Requirements
- **Resilience:** Retry logic for external API calls
- **Cost-effectiveness:** Minimal resource usage, efficient error handling
- **Observability:** Comprehensive logging for debugging
- **Atomicity:** Each step clearly defined and isolated

## Success Criteria
- Function successfully processes valid requests
- Audio files stored in Firebase Storage with public URLs
- Compaction records updated with audio_url
- Comprehensive error handling and logging
- Retry mechanism for API failures

## Dependencies
- Firebase Cloud Functions
- Firebase Storage
- Firebase Firestore
- Cartesia TTS API
- Authentication service (token validation)
- Retry package for resilient API calls
