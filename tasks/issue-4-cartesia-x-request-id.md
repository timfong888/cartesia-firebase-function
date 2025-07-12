# Task: Implement Cartesia x-request-id Logging and Storage

**Issue:** [#4 - Log and store cartesia's x-request-id from response header](https://github.com/timfong888/cartesia-firebase-function/issues/4)
**Branch:** `4-cartesia-x-request-id`
**Status:** ✅ COMPLETED

## Objective
Capture, log, and store Cartesia's `x-request-id` response header for tracing and debugging purposes.

## Requirements Analysis
- ✅ Cartesia API already returns `x-request-id` in response headers
- ✅ Code was already capturing the header but not storing it
- ✅ Need to store `x-request-id` in Firestore compaction document
- ✅ Need enhanced logging for better visibility
- ✅ Need to include in API response for client-side tracing

## Implementation Details

### Files Modified
1. **`functions/src/cartesia/tts.js`**
   - Updated `generateTTS()` return type to include `cartesiaRequestId`
   - Enhanced logging with dedicated `cartesia_x_request_id_received` event
   - Fixed JSDoc documentation

2. **`functions/src/index.js`**
   - Updated to destructure `{audioBuffer, cartesiaRequestId}` from `generateTTS()`
   - Added `cartesia_request_id` field to Firestore updates
   - Enhanced logging with `cartesia_request_id_stored` event
   - Include `cartesia_request_id` in API response

### Key Changes

#### Enhanced TTS Function
```javascript
// Before: return audioBuffer
// After: return { audioBuffer, cartesiaRequestId }
```

#### Firestore Storage
```javascript
await updateCompactionDoc(compactionId, { 
  audio_url: publicUrl,
  cartesia_request_id: cartesiaRequestId,  // NEW FIELD
  enumStatus: 'completed'
});
```

#### Enhanced Logging
- `cartesia_x_request_id_received` - Dedicated x-request-id log
- `cartesia_request_id_stored` - Confirms Firestore storage
- Updated existing logs to include `cartesiaRequestId`

#### API Response
```json
{
  "success": true,
  "audio_url": "https://storage.googleapis.com/...",
  "cartesia_request_id": "req_abc123",
  "processing_time_ms": 1234
}
```

## Testing Strategy
- ✅ Syntax validation passed
- ✅ Code committed and pushed
- 🔄 **Next:** Deploy and test with real Cartesia API calls
- 🔄 **Verify:** Check logs for new events
- 🔄 **Validate:** Confirm Firestore document includes `cartesia_request_id`

## Deployment Notes
- No breaking changes to existing API
- Backward compatible (adds new fields)
- Enhanced tracing capabilities
- Better debugging support

## Commit Information
- **Commit:** `f920ac0`
- **Message:** "Add Cartesia x-request-id logging and storage"
- **Branch:** `4-cartesia-x-request-id`
- **Pushed:** ✅ Yes

## Verification Checklist
- [x] Code changes implemented
- [x] Syntax validation passed
- [x] Committed to git
- [x] Pushed to remote branch
- [x] GitHub issue commented
- [x] Task file created
- [ ] Deploy to Cloud Run
- [ ] Test with real API calls
- [ ] Verify logs contain new events
- [ ] Confirm Firestore storage working

## Expected Log Events
After deployment, look for these new log events:
1. `cartesia_x_request_id_received`
2. `cartesia_request_id_stored`
3. Updated `tts_processing_complete` with `cartesiaRequestId`

## Success Criteria
✅ **COMPLETED:** All implementation requirements met
🔄 **PENDING:** Production deployment and testing
