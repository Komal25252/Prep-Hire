# Requirements Document

## Introduction

This feature adds real-time facial emotion analysis to PrepHire's interview session flow. During an interview, the browser captures a webcam frame every 5 seconds and sends it to a Flask endpoint backed by EmotiEffLib. EmotiEffLib returns a dominant emotion label and confidence scores for all 7 emotion classes. That emotion data — not the raw image — is stored in MongoDB, linked to the session and the current question index. No candidate grading occurs in this phase. The stored records are the raw signal for a future ML model that will compute Emotional Stability and Confidence scores as part of the overall candidate grade. Webcam access is opt-in and the interview degrades gracefully if permission is denied.

---

## Glossary

- **Interview_Page**: The Next.js page at `/interview` where candidates answer questions.
- **Session**: A single interview run, identified by a unique `sessionId`, from the first question to finish or redirect.
- **Frame_Capture**: The browser-side process of drawing a webcam video frame onto a canvas and encoding it as a base64 JPEG string.
- **Webcam_Stream**: The `MediaStream` object obtained from `navigator.mediaDevices.getUserMedia` with video constraints.
- **Emotion_API**: The Flask endpoint at `POST /analyze-emotion` that accepts a JPEG frame and returns emotion analysis results from EmotiEffLib.
- **EmotiEffLib**: The Python emotion recognition library used by the Emotion_API, running the `enet_b0_8_best_vgaf` model with an ONNX backend.
- **Emotion_Record**: A MongoDB document storing the emotion analysis result for a single captured frame, linked to a Session and question.
- **Emotion_Store_API**: The Next.js API route at `POST /api/interview/emotions` that persists Emotion_Records to MongoDB.
- **MongoDB**: The existing MongoDB database (PrepHire) accessed via the shared `connectDB` utility.
- **Dominant_Emotion**: The single emotion label with the highest confidence score returned by EmotiEffLib.
- **Emotion_Scores**: The confidence scores for all 7 emotion classes: `neutral`, `happy`, `fear`, `angry`, `sad`, `surprise`, `disgust`.
- **Emotional_Stability**: A future ML-derived score measuring how consistent and calm a candidate's emotions were across a Session.
- **Confidence_Score**: A future ML-derived score measuring the ratio of positive/neutral emotions (`happy`, `neutral`) to negative emotions (`fear`, `sad`, `angry`, `disgust`) across a Session.

---

## Requirements

### Requirement 1: Webcam Permission Request

**User Story:** As an interview candidate, I want to be asked for webcam access before the interview starts, so that I can choose whether to enable facial emotion capture.

#### Acceptance Criteria

1. WHEN the Interview_Page loads and questions are ready, THE Interview_Page SHALL prompt the user to grant or deny webcam access via the browser's `getUserMedia` API before the first question is displayed.
2. IF the user denies webcam access, THEN THE Interview_Page SHALL continue the interview session without webcam functionality and SHALL display a non-blocking notice that facial emotion capture is unavailable.
3. IF the browser does not support `getUserMedia`, THEN THE Interview_Page SHALL skip the webcam prompt entirely and proceed with the standard interview flow.
4. WHILE the Webcam_Stream is active, THE Interview_Page SHALL display a small live video preview so the user can confirm the camera is working.

---

### Requirement 2: Periodic Frame Capture

**User Story:** As a candidate, I want the app to silently capture webcam frames during my interview, so that my facial expression data can be collected for later analysis without interrupting my flow.

#### Acceptance Criteria

1. WHILE the Webcam_Stream is active and the interview status is `active`, THE Interview_Page SHALL perform Frame_Capture at a fixed interval of 5 seconds.
2. WHEN a frame is captured, THE Interview_Page SHALL encode the frame as a base64 JPEG string at a resolution no greater than 640×480 pixels.
3. WHEN the interview status transitions to `submitting` or the Session ends, THE Interview_Page SHALL stop Frame_Capture and release the Webcam_Stream.
4. THE Frame_Capture process SHALL NOT block speech recognition, text input, or question navigation interactions.

---

### Requirement 3: Flask Emotion Analysis Endpoint

**User Story:** As a developer, I want a Flask endpoint that accepts a webcam frame and returns emotion analysis results, so that the browser can obtain structured emotion data without storing raw images.

#### Acceptance Criteria

1. THE Emotion_API SHALL expose a `POST /analyze-emotion` endpoint that accepts a JSON body containing a base64-encoded JPEG frame.
2. WHEN a valid frame is received, THE Emotion_API SHALL pass the decoded image to EmotiEffLib using the `enet_b0_8_best_vgaf` model with the ONNX backend.
3. WHEN EmotiEffLib returns a result, THE Emotion_API SHALL respond with a JSON object containing:
   - `emotion` (string) — the Dominant_Emotion label
   - `emotionScores` (object) — confidence scores for all 7 classes: `neutral`, `happy`, `fear`, `angry`, `sad`, `surprise`, `disgust`
4. THE Emotion_API SHALL NOT store or log the raw image data at any point.
5. IF the request body is missing the frame field or the image cannot be decoded, THEN THE Emotion_API SHALL return a `400` status with a descriptive JSON error message.
6. IF EmotiEffLib raises an exception during inference, THEN THE Emotion_API SHALL return a `500` status with a JSON error message.

---

### Requirement 4: Fire-and-Forget Emotion Submission

**User Story:** As a candidate, I want frame analysis and emotion storage to happen in the background, so that network latency or API errors never pause or disrupt my interview.

#### Acceptance Criteria

1. WHEN a frame is captured, THE Interview_Page SHALL send the frame to the Emotion_API as a non-blocking fetch request without awaiting the response before continuing.
2. WHEN the Emotion_API returns a successful response, THE Interview_Page SHALL forward the emotion result to the Emotion_Store_API as a non-blocking fetch request without awaiting the response.
3. IF the Emotion_API request fails or times out, THEN THE Interview_Page SHALL silently discard the error and SHALL NOT display an error message to the user.
4. IF the Emotion_Store_API request fails, THEN THE Interview_Page SHALL silently discard the error and SHALL NOT display an error message to the user.

---

### Requirement 5: Emotion Record Storage API

**User Story:** As a developer, I want a Next.js API route that accepts emotion analysis results and stores them in MongoDB, so that per-frame emotion data is persisted for future ML-based candidate scoring.

#### Acceptance Criteria

1. THE Emotion_Store_API SHALL expose a `POST /api/interview/emotions` endpoint that accepts a JSON body containing `sessionId`, `questionIndex`, `timestamp`, `emotion`, and `emotionScores` fields.
2. WHEN a valid request is received, THE Emotion_Store_API SHALL insert an Emotion_Record into the `emotionRecords` MongoDB collection and return a `201` status.
3. THE Emotion_Store_API SHALL store each Emotion_Record with the following schema:
   - `sessionId` (string) — links the record to a specific interview Session
   - `questionIndex` (number) — the index of the question being answered when the frame was captured
   - `timestamp` (ISO 8601 string) — the UTC time the frame was captured
   - `emotion` (string) — the Dominant_Emotion label returned by EmotiEffLib
   - `emotionScores` (object) — confidence scores for all 7 emotion classes: `{ neutral, happy, fear, angry, sad, surprise, disgust }`
4. IF the request body is missing any required field, THEN THE Emotion_Store_API SHALL return a `400` status with a descriptive JSON error message.
5. IF the MongoDB insert operation fails, THEN THE Emotion_Store_API SHALL return a `500` status with a JSON error message.

---

### Requirement 6: Schema Design for Future ML Scoring

**User Story:** As a developer, I want the Emotion_Record schema to contain all data needed for future ML-based scoring, so that Emotional_Stability and Confidence_Score can be computed without re-capturing or re-processing any data.

#### Acceptance Criteria

1. THE Emotion_Record schema SHALL include `sessionId` so that a future ML model can retrieve all records belonging to a single Session in one query.
2. THE Emotion_Record schema SHALL include `questionIndex` so that a future ML model can segment emotion data by question and detect per-question emotional patterns.
3. THE Emotion_Record schema SHALL include the full `emotionScores` object for all 7 emotion classes so that a future ML model can compute Emotional_Stability from score variance across the Session.
4. THE Emotion_Record schema SHALL include the full `emotionScores` object so that a future ML model can compute Confidence_Score as the ratio of `happy` + `neutral` scores to `fear` + `sad` + `angry` + `disgust` scores across the Session.
5. THE Emotion_Store_API SHALL support bulk retrieval of all Emotion_Records for a given `sessionId` so that a future ML model can read the complete emotion signal for a Session.
6. WHEN a future ML model has finished processing all Emotion_Records for a Session, THE Emotion_Store_API SHALL support deletion of those records by `sessionId` to avoid indefinite storage of temporary data.

---

### Requirement 7: Session Identification

**User Story:** As a developer, I want each interview session to have a unique ID, so that all Emotion_Records captured during a session can be retrieved and associated with the correct candidate and interview.

#### Acceptance Criteria

1. WHEN the Interview_Page initializes a new Session, THE Interview_Page SHALL generate a unique `sessionId` (UUID v4) and store it in component state for the duration of the Session.
2. THE Interview_Page SHALL include the `sessionId` in every emotion submission request sent to the Emotion_Store_API.
3. THE Interview_Page SHALL persist the `sessionId` in the `interviewResults` object written to `sessionStorage` when the Session ends, so that results can be linked to stored Emotion_Records.

---

### Requirement 8: Graceful Degradation

**User Story:** As a candidate, I want the interview to work fully even if I decline camera access or my camera fails mid-session, so that my practice session is never lost.

#### Acceptance Criteria

1. IF the Webcam_Stream is never obtained, THEN THE Interview_Page SHALL complete the Session and store results without any error state.
2. IF the Webcam_Stream is lost mid-Session, THEN THE Interview_Page SHALL stop Frame_Capture, release the stream reference, and continue the interview without attempting to restart webcam access.
3. THE existing interview flow (question display, speech recognition, text input, navigation, session timer) SHALL remain fully functional regardless of webcam state.
