# Goal
A cost-effective, minimal, resilient service which receives a payload, creates a request to the cartesia tts endpoint, receives back the audio binary, uploads to firebase storage, returns a public accessible url, and stores it in the compaction record identified in the paylod.

## Steps - Overview
1. Each step should be clear, atomic, and DRY
2. Each step should have clear logs
3. Each step should report it's failure into the original compactionId
4. Failures should persist status code and message to `status_code` and `error`; `enumStatus` update to `failed`

## Steps List - Break into clear functions for readability and ease of writing/debugging
1. Authenticate header from the payload
2. - Log `authentication_succeed` with `user_id` and `compaction_id` ; Log `authentication_failure`
2a. HTTP response: `200` if `authentication_succeed`; unauthorized status code if `authentication_failure`.
3. Read the `compactionDoc` from the Firestore `compactions` collection based on the received `compaction_id` as `docRef`
4. - Log `read_compaction_doc_succeed` with `user_id` and `compaction_id` ; Log `read_compaction_doc_failure`
5. Send request to cartesia-tts 
6. - `model_id` = `sonic-2`
   - `transcript` = `compactionDoc.compaction_text_human`
   - `voice` = {`mode`:`id`, `id`:`compactionDoc.voice_id`}
   - `output_format` = {`container`:`mp3`,`bit_rate`:` 128000`,`44100`}
   - `language` = `en`
7. - Log `cartesia-tts-request`: `compaction_id`, `user_id`, `cartesia-request-id` (which comes in the http response header `x-request-id`);
   - Use a retry package 
8. Receive response payload from cartesia-tts
9. - Log `cartesia-tts-response`: `compaction_id`, `user_id`, `cartesia-request-id` (which comes in the http response header), `file-size`, `receive-time`
10. Store with Firebase Storage
11. - Log `store-in-firebase`: `compaction_id`, `user_id`, `cartesia-request-id` (which comes in the http response header); what comes back from firebase storage operation..., `public_url`
12. Update `compactionDoc` with `audio_url`:`public_url` (this is the public url from the upload to firebase storage).

