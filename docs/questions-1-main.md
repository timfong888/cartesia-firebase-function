# Questions: Cartesia TTS Firebase Function

**Branch:** main  
**GitHub Issue:** [#1](https://github.com/timfong888/cartesia-firebase-function/issues/1)

## July 11, 2025 - 3:37pm

**Question 1:** How should we handle Cartesia API authentication? Do you have an API key that should be stored as a Firebase secret?

**Hypothesized Answer:** You want the Cartesia API key stored in Firebase Functions secrets using `firebase functions:secrets:set CARTESIA_API_KEY`

**Answer:** yes but the docs need to tell me how to so this.

---

**Question 2:** What authentication mechanism should we use to validate the incoming request token? Is this a Firebase Auth token, JWT, or custom authentication?

**Hypothesized Answer:** Firebase Auth token validation using Firebase Admin SDK

**Answer:** i dont understsnd how this works. isnthisnjust a brarer token?

---

**Question 3:** What should be the Firebase Storage bucket structure for storing audio files? Should files be organized by user_id, compaction_id, or date?

**Hypothesized Answer:** Organize by user_id/compaction_id for easy access: `audio/{user_id}/{compaction_id}.mp3`

**Answer:** it shouod just be a single bucket thst can br at the root. 

---

**Question 4:** What retry strategy should we implement for Cartesia API calls? How many retries and what backoff strategy?

**Hypothesized Answer:** 3 retries with exponential backoff (1s, 2s, 4s) using a retry package like `async-retry`

**Answer:** i came across p-retry. backupnis exponentia but the times to make a tts that is 2 minites long is probably 1 minit. 

---

**Question 5:** Should the Firebase Storage files be publicly readable or require authentication? What are the security requirements?

**Hypothesized Answer:** Publicly readable URLs for easy access in client applications, but with obscure file paths for security through obscurity

**Answer:** the audio url should be the video_id when we generste these from youtube. 

---

**Question 6:** What should happen if the compaction document doesn't exist in Firestore? Should we create it or return an error?

**Hypothesized Answer:** Return 404 error since compaction_id should already exist before TTS processing

**Answer:** yes return 404 and log "compaction_not_found" compaction_id. 

---

**Question 7:** Do you want any rate limiting or usage quotas to control costs with the Cartesia API?

**Hypothesized Answer:** No rate limiting initially, but add monitoring for cost tracking

**Answer:** agree with your answer. 

---

**Question 8:** What Node.js version and Firebase Functions runtime should we target?

**Hypothesized Answer:** Node.js 18 with Firebase Functions v2 for better performance and modern features

**Answer:** i believe gen2 functions is on 22. 
