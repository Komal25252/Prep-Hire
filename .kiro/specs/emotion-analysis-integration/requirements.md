# Requirements Document

## Introduction

This feature adds real-time facial emotion analysis to PrepHire's interview session flow. During an interview, the browser captures a webcam frame every 5 seconds and sends it to a new Flask endpoint (`POST /analyze-emotion`) backed by EmotiEffLib. EmotiEffLib returns confidence scores for 7 emotion classes. Only the scores — never the raw image — are stored in MongoDB under an `emotionReadings` collection, grouped by session and question. After the interview ends, a Next.js API route reads all readings for the session and runs rule-based JS analysis to produce per-question and session-level emotional metrics. Those results are displayed on the results page alongside the existing answer evaluation. Webcam access is opt-in and the interview degrades gracefully if permission is denied.

---

## Glossary

- **Interview_Page**: The Next.js page at `/interview` where candidates answer questions.
- **Session**: A single interview run, identified by a unique `sessionId`, from the first question to finish or redirect.
- **Frame_Capture**: The browser-side process of drawing a webcam video frame onto a canvas and encoding it as a base64 JPEG string.
- **Webcam_Stream**: The `MediaStream` object obtained from `navigator.mediaDevices.getUserMedia` with video constraints.
- **Emotion_API**: The Flask endpoint at `POST /analyze-emotion` in `ML/app.py` that accepts a JPEG frame and returns emotion scores from EmotiEffLib.
- **EmotiEffLib**: The Python emotion recognition library used by the Emotion_API, returning confidence scores for 7 emotion classes.
- **Emotion_Scores**: The confidence scores (0–100) for all 7 emotion classes: `neutral`, `happy`, `fear`, `angry`, `sad`, `surprise`, `disgust`.
- **Dominant_Emotion**: The single emotion label with the highest score in a given Emotion_Scores object.
- **Emotion_Reading**: A MongoDB document in the `emotionReadings` collection storing the Emotion_Scores for one captured frame, linked to a Session and question index.
- **Emotion_Store_API**: The Next.js API route at `POST /api/interview/emotions` that persists Emotion_Readings to MongoDB.
- **Emotion_Analysis_API**: The Next.js API route at `GET /api/emotion/analyze` that reads all Emotion_Readings for a session and computes the Emotion_Analysis_Result.
- **Emotion_Analysis_Result**: The structured output of the JS-based analysis, containing per-question metrics and session-level summary fields.
- **MongoDB**: The existing MongoDB database (PrepHire) accessed via the shared `connectDB` utility.
- **Results_Page**: The Next.js page at `/results` where candidates view their interview evaluation.

---

## Requirements

### Requirement 1: Webcam Permission and Live Preview

**User Story:** As an interview candidate, I want to be asked for webcam access when the interview starts, so that I can choose whether to enable facial emotion capture.

#### Acceptance Criteria

1. WHEN the Interview_Page loads and the first question is ready, THE Interview_Page SHALL request webcam access via `navigator.mediaDevices.getUserMedia` with video-only constraints.
2. IF the user denies webcam access, THEN THE Interview_Page SHALL continue the interview session without webcam functionality and SHALL display a non-blocking notice that facial emotion capture is unavailable.
3. IF the browser does not support `getUserMedia`, THEN THE Interview_Page SHALL skip the webcam prompt entirely and proceed with the standard interview flow.
4. WHILE the Webcam_Stream is active, THE Interview_Page SHALL display a live video preview so the user can confirm the camera is working.

---

### Requirement 2: Periodic Frame Capture

**User Story:** As a candidate, I want the app to silently capture webcam frames during my interview, so that my facial expression data can be collected without interrupting my flow.

#### Acceptance Criteria

1. WHILE the Webcam_Stream is active and the interview status is `active`, THE Interview_Page SHALL perform Frame_Capture at a fixed interval of 5 seconds.
2. WHEN a frame is captured, THE Interview_Page SHALL encode the frame as a base64 JPEG string at a resolution no greater than 640×480 pixels.
3. WHEN the interview status transitions to `submitting` or the Session ends, THE Interview_Page SHALL stop Frame_Capture and release the Webcam_Stream.
4. THE Frame_Capture process SHALL NOT block speech recognition, text input, or question navigation interactions.

---

### Requirement 3: Flask Emotion Analysis Endpoint

**User Story:** As a developer, I want a Flask endpoint that accepts a webcam frame and returns emotion scores, so that the browser can obtain structured emotion data without storing raw images.

#### Acceptance Criteria

1. THE Emotion_API SHALL expose a `POST /analyze-emotion` endpoint that accepts a JSON body containing a base64-encoded JPEG frame under the key `frame`.
2. WHEN a valid frame is received, THE Emotion_API SHALL pass the decoded image to EmotiEffLib and obtain Emotion_Scores for all 7 classes.
3. WHEN EmotiEffLib returns a result, THE Emotion_API SHALL respond with HTTP 200 and a JSON object containing:
   - `emotion` (string) — the Dominant_Emotion label
   - `scores` (object) — `{ neutral, happy, fear, angry, sad, surprise, disgust }` with values 0–100
4. THE Emotion_API SHALL NOT store or log the raw image data at any point.
5. IF the request body is missing the `frame` field or the image cannot be decoded, THEN THE Emotion_API SHALL return HTTP 400 with a descriptive JSON error message.
6. IF EmotiEffLib raises an exception during inference, THEN THE Emotion_API SHALL return HTTP 500 with a JSON error message.

---

### Requirement 4: Fire-and-Forget Emotion Submission

**User Story:** As a candidate, I want frame analysis and emotion storage to happen in the background, so that network latency or API errors never pause or disrupt my interview.

#### Acceptance Criteria

1. WHEN a frame is captured, THE Interview_Page SHALL send the frame to the Emotion_API as a non-blocking fetch request without awaiting the response before continuing.
2. WHEN the Emotion_API returns a successful response, THE Interview_Page SHALL forward the emotion result to the Emotion_Store_API as a non-blocking fetch request without awaiting the response.
3. IF the Emotion_API request fails or times out, THEN THE Interview_Page SHALL silently discard the error and SHALL NOT display an error message to the user.
4. IF the Emotion_Store_API request fails, THEN THE Interview_Page SHALL silently discard the error and SHALL NOT display an error message to the user.

---

### Requirement 5: Emotion Reading Storage API

**User Story:** As a developer, I want a Next.js API route that accepts emotion results and stores them in MongoDB, so that per-frame emotion data is persisted for post-interview analysis.

#### Acceptance Criteria

1. THE Emotion_Store_API SHALL expose a `POST /api/interview/emotions` endpoint that accepts a JSON body with the fields: `sessionId`, `questionIndex`, `timestamp`, `emotion`, and `scores`.
2. WHEN a valid request is received, THE Emotion_Store_API SHALL insert an Emotion_Reading into the `emotionReadings` MongoDB collection and return HTTP 201.
3. THE Emotion_Store_API SHALL store each Emotion_Reading with the following schema:
   - `sessionId` (string) — links the reading to a specific interview Session
   - `questionIndex` (number) — the index of the question being answered when the frame was captured
   - `timestamp` (ISO 8601 string) — the UTC time the frame was captured
   - `emotion` (string) — the Dominant_Emotion label
   - `scores` (object) — `{ neutral, happy, fear, angry, sad, surprise, disgust }` with values 0–100
4. IF the request body is missing any required field, THEN THE Emotion_Store_API SHALL return HTTP 400 with a descriptive JSON error message.
5. IF the MongoDB insert operation fails, THEN THE Emotion_Store_API SHALL return HTTP 500 with a JSON error message.

---

### Requirement 6: Session Identification

**User Story:** As a developer, I want each interview session to have a unique ID, so that all Emotion_Readings captured during a session can be retrieved and associated with the correct interview.

#### Acceptance Criteria

1. WHEN the Interview_Page initializes a new Session, THE Interview_Page SHALL generate a unique `sessionId` (UUID v4) and store it in component state for the duration of the Session.
2. THE Interview_Page SHALL include the `sessionId` and the current `questionIndex` in every emotion submission request sent to the Emotion_Store_API.
3. THE Interview_Page SHALL persist the `sessionId` in the `interviewResults` object written to `sessionStorage` when the Session ends, so that the Results_Page can retrieve the correct Emotion_Readings.

---

### Requirement 7: Post-Interview Emotion Analysis

**User Story:** As a developer, I want a Next.js API route that reads all stored emotion readings for a session and computes structured analysis metrics, so that the results page can display meaningful emotional feedback.

#### Acceptance Criteria

1. THE Emotion_Analysis_API SHALL expose a `GET /api/emotion/analyze` endpoint that accepts a `sessionId` query parameter.
2. WHEN called with a valid `sessionId`, THE Emotion_Analysis_API SHALL retrieve all Emotion_Readings for that session from the `emotionReadings` collection, grouped by `questionIndex`.
3. WHEN computing per-question metrics, THE Emotion_Analysis_API SHALL calculate the following for each question's set of readings:
   - `avgFear` — arithmetic mean of `scores.fear` across all readings for that question
   - `maxFear` — maximum `scores.fear` value across all readings for that question
   - `fearIncrease` — `lastReading.scores.fear − firstReading.scores.fear` (positive value indicates increasing nervousness)
   - `avgVariation` — arithmetic mean of the absolute differences between consecutive `scores.fear` values (higher value indicates emotional instability)
   - `confidenceScore` — arithmetic mean of `(scores.happy + scores.neutral) / 2` across all readings for that question
4. WHEN computing session-level metrics, THE Emotion_Analysis_API SHALL calculate:
   - `dominantEmotion` — the most frequently occurring `emotion` label across all readings in the session
   - `emotionalStability` — `"stable"` if the session-level `avgVariation` is less than 10, `"moderate"` if less than 25, `"unstable"` if 25 or greater
   - `confidenceLevel` — `"high"` if the session-level `confidenceScore` is greater than 60, `"moderate"` if greater than 40, `"low"` if 40 or less
   - `stressPattern` — `"increasing"` if the session-level `fearIncrease` is greater than 20, `"decreasing"` if less than −20, `"stable"` otherwise
   - `interpretation` — a human-readable string summarising the candidate's emotional pattern (e.g. `"Shows signs of increasing stress during technical questions"`)
5. WHEN the analysis is complete, THE Emotion_Analysis_API SHALL respond with HTTP 200 and a JSON object containing the per-question metrics array and the session-level summary.
6. IF no Emotion_Readings exist for the given `sessionId`, THEN THE Emotion_Analysis_API SHALL return HTTP 200 with an empty per-question array and null session-level fields.
7. IF the `sessionId` query parameter is missing, THEN THE Emotion_Analysis_API SHALL return HTTP 400 with a descriptive JSON error message.

---

### Requirement 8: Emotion Results on the Results Page

**User Story:** As a candidate, I want to see my emotional analysis results on the results page, so that I can understand how my stress and confidence levels changed during the interview.

#### Acceptance Criteria

1. WHEN the Results_Page loads and a `sessionId` is present in `sessionStorage`, THE Results_Page SHALL call the Emotion_Analysis_API with that `sessionId` to retrieve the Emotion_Analysis_Result.
2. WHEN the Emotion_Analysis_Result is available, THE Results_Page SHALL display the session-level summary including `dominantEmotion`, `emotionalStability`, `confidenceLevel`, `stressPattern`, and `interpretation`.
3. WHEN the Emotion_Analysis_Result is available, THE Results_Page SHALL display per-question emotional metrics alongside each question's answer evaluation.
4. IF the Emotion_Analysis_Result contains no data (webcam was not used), THEN THE Results_Page SHALL omit the emotion section entirely without displaying an error.
5. THE Results_Page SHALL display the existing answer evaluation (scores, strengths, weaknesses, suggestions) regardless of whether emotion data is available.

---

### Requirement 9: Graceful Degradation

**User Story:** As a candidate, I want the interview to work fully even if I decline camera access or my camera fails mid-session, so that my practice session is never lost.

#### Acceptance Criteria

1. IF the Webcam_Stream is never obtained, THEN THE Interview_Page SHALL complete the Session and store results without any error state.
2. IF the Webcam_Stream is lost mid-Session, THEN THE Interview_Page SHALL stop Frame_Capture, release the stream reference, and continue the interview without attempting to restart webcam access.
3. THE existing interview flow (question display, speech recognition, text input, navigation, session timer) SHALL remain fully functional regardless of webcam state.
4. IF no Emotion_Readings were stored for a session, THEN THE Emotion_Analysis_API SHALL return an empty result and THE Results_Page SHALL render without the emotion section.
