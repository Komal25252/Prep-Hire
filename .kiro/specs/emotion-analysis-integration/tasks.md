# Implementation Plan: Emotion Analysis Integration

## Overview

Implement real-time facial emotion analysis into PrepHire's interview flow. The pipeline is entirely fire-and-forget: a Flask endpoint runs EmotiEffLib inference, a Next.js store API persists scores to MongoDB, a Next.js analysis API computes rule-based metrics, and the results page renders an emotion section alongside the existing answer evaluation. Webcam access is opt-in and the interview degrades gracefully at every failure point.

## Tasks

- [~] 1. Add Flask `/analyze-emotion` endpoint to `ML/app.py`
  - Install `emotiefflib`, `facenet-pytorch`, `opencv-python`, `numpy`, `Pillow` into the ML venv
  - Load `EmotiEffLib(model_name='enet_b0_8_best_vgaf')` once at module level (ONNX backend, no torch needed)
  - Implement `POST /analyze-emotion`: decode base64 JPEG → PIL Image → `emotion_model.predict(np.array(img))` → return `{ emotion, scores }` with 7 float values 0–100
  - Return HTTP 400 if `frame` field is missing or image cannot be decoded; HTTP 500 if EmotiEffLib raises
  - Never store or log the raw image bytes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 1.1 Write unit tests for the Flask endpoint
    - Test 400 on missing `frame` field
    - Test 400 on non-decodable base64 value
    - Test 500 when EmotiEffLib raises an exception (mock the model)
    - Test 200 response shape: `emotion` is one of the 7 labels, `scores` has all 7 keys with numeric values
    - _Requirements: 3.3, 3.5, 3.6_

  - [ ]* 1.2 Write property test for Flask endpoint response shape (Property 5)
    - **Property 5: Flask endpoint response shape is always valid**
    - For any valid base64 JPEG, response must be HTTP 200 with `emotion` ∈ 7 labels and `scores` keys all in [0, 100]
    - **Validates: Requirements 3.3**

  - [ ]* 1.3 Write property test for Flask endpoint invalid input rejection (Property 6)
    - **Property 6: Flask endpoint rejects invalid input**
    - For any request missing `frame` or with non-decodable value, response must be HTTP 400 with `error` field
    - **Validates: Requirements 3.5**

- [~] 2. Create `EmotionReading` Mongoose model
  - Create `PrepHire/src/models/EmotionReading.ts` with the schema defined in the design: `sessionId` (String, indexed), `questionIndex` (Number), `timestamp` (String), `emotion` (String), `scores` (sub-document with 7 Number fields, min 0 max 100)
  - Export the model using the `models.EmotionReading || mongoose.model(...)` pattern consistent with existing models
  - _Requirements: 5.3_

- [~] 3. Implement `POST /api/interview/emotions` store route
  - Create `PrepHire/src/app/api/interview/emotions/route.ts`
  - Validate all five required fields (`sessionId`, `questionIndex`, `timestamp`, `emotion`, `scores`); return HTTP 400 with descriptive `error` if any are missing
  - Call `connectDB()`, insert via `EmotionReading.create(body)`, return HTTP 201 on success
  - Return HTTP 500 with JSON error if MongoDB insert throws
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.1 Write unit tests for the store route
    - Test 201 on valid body
    - Test 400 for each of the five missing-field cases individually
    - Test 500 when `EmotionReading.create` throws (mock mongoose)
    - _Requirements: 5.2, 5.4, 5.5_

  - [ ]* 3.2 Write property test for store API field validation (Property 3)
    - **Property 3: Store API validates required fields**
    - For any POST body missing one or more required fields, response must be HTTP 400 with `error` field
    - **Validates: Requirements 5.4**

  - [ ]* 3.3 Write property test for store API persistence (Property 4)
    - **Property 4: Store API persists all schema fields**
    - For any valid random emotion reading, a successful POST must result in a MongoDB document containing all five fields with correct values (use `mongodb-memory-server`)
    - **Validates: Requirements 5.3**

- [ ] 4. Checkpoint — Ensure Flask endpoint and store route tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Extract and implement pure analysis computation functions
  - Create `PrepHire/src/lib/emotionAnalysis.ts` exporting:
    - `computePerQuestionMetrics(readings)` — implements the five formulas from Requirement 7.3
    - `classifySession({ avgVariation, confidenceScore, fearIncrease })` — implements the three threshold rules from Requirement 7.4
    - `buildInterpretation(session)` — returns a human-readable string summarising the emotional pattern
  - Keep these as pure functions (no I/O) so they are trivially testable
  - _Requirements: 7.3, 7.4_

  - [ ]* 5.1 Write property test for per-question metric formulas (Property 1)
    - **Property 1: Per-question metric formulas are correct**
    - Generate random arrays of readings with `fc.array(fc.record({ scores: fc.record({ fear, happy, neutral }) }), { minLength: 1 })`
    - Assert `avgFear`, `maxFear`, `fearIncrease`, `avgVariation`, `confidenceScore` match the exact formulas
    - **Validates: Requirements 7.3**

  - [ ]* 5.2 Write property test for session-level classification thresholds (Property 2)
    - **Property 2: Session-level classification thresholds are applied correctly**
    - Generate random `avgVariation`, `confidenceScore`, `fearIncrease` floats; assert `emotionalStability`, `confidenceLevel`, `stressPattern` match the exact threshold rules
    - **Validates: Requirements 7.4**

- [~] 6. Implement `GET /api/emotion/analyze` analysis route
  - Create `PrepHire/src/app/api/emotion/analyze/route.ts`
  - Return HTTP 400 if `sessionId` query param is missing
  - Call `connectDB()`, query `EmotionReading.find({ sessionId })`, group by `questionIndex`
  - Call `computePerQuestionMetrics` for each group; call `classifySession` and `buildInterpretation` for session-level summary
  - Return HTTP 200 with `{ perQuestion, session }` — if no readings, return `{ perQuestion: [], session: null }`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 6.1 Write unit tests for the analysis route
    - Test 400 on missing `sessionId`
    - Test 200 with `{ perQuestion: [], session: null }` when no readings exist
    - Test 200 with correct per-question and session fields for a known set of readings (mock mongoose)
    - _Requirements: 7.5, 7.6, 7.7_

- [ ] 7. Checkpoint — Ensure analysis computation and route tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Update `InterviewPage` to generate and propagate `sessionId`
  - Generate `sessionId = crypto.randomUUID()` once on mount using `useRef` (survives re-renders without triggering effects)
  - Add `sessionId: string` to the `interviewResults` object written to `sessionStorage` in both `advance` (final question) and `handleEndInterview`
  - Pass `sessionId`, `currentIndex` (as `currentQuestionIndex`), and `status === 'active'` (as `isInterviewActive`) as new props to `WebcamPanel`
  - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.1 Write unit tests for `InterviewPage` session identity
    - Test that `sessionId` is present in the `sessionStorage` write on session end
    - Test that `sessionId` and `currentIndex` are passed to `WebcamPanel` as props
    - _Requirements: 6.1, 6.3_

  - [ ]* 8.2 Write property test for session identity (Property 7)
    - **Property 7: Session identity is preserved end-to-end**
    - Assert generated `sessionId` matches UUID v4 regex; assert it appears in the `sessionStorage` payload; assert two independently generated IDs are distinct
    - **Validates: Requirements 6.1, 6.3**

- [ ] 9. Update `WebcamPanel` to capture frames and submit emotion data
  - Add new props: `sessionId: string`, `currentQuestionIndex: number`, `isInterviewActive: boolean`
  - Add `canvasRef` (`useRef<HTMLCanvasElement>`) — off-screen, never rendered
  - Add `captureIntervalRef` (`useRef<NodeJS.Timeout | null>`) to hold the `setInterval` handle
  - Implement `captureAndSubmit()`: draw video frame onto canvas (capped at 640×480), call `canvas.toDataURL('image/jpeg', 0.8)`, fire-and-forget POST to `http://localhost:5000/analyze-emotion`, then on success fire-and-forget POST to `/api/interview/emotions` with `sessionId`, `currentQuestionIndex`, `timestamp`, `emotion`, `scores`; all `.catch(() => {})` — no awaits at call site
  - Start `setInterval(captureAndSubmit, 5000)` when `isInterviewActive` is `true` and stream is live; `clearInterval` when `isInterviewActive` becomes `false` or component unmounts
  - Apply spike filtering: ignore readings where `scores.fear` jumps more than 30 points from the previous reading
  - Apply rolling window smoothing: keep the last 10 seconds of readings (last 2 readings at 5 s interval), average the scores before storing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.1 Write unit tests for `WebcamPanel` capture behaviour
    - Test `setInterval` is called with 5 000 ms when stream is active and `isInterviewActive` is `true`
    - Test `clearInterval` is called on unmount
    - Test `clearInterval` is called when `isInterviewActive` transitions to `false`
    - Test canvas dimensions are capped at 640×480
    - Test fire-and-forget pattern: interval callback does not block (no unresolved promise at call site)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1_

- [ ] 10. Checkpoint — Ensure interview page and webcam panel tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Update `ResultsPage` to fetch and display emotion analysis
  - Extend the `InterviewResults` interface to include optional `sessionId: string`
  - After reading `sessionStorage`, if `sessionId` is present, call `GET /api/emotion/analyze?sessionId=...` in parallel with the existing `/api/evaluate` call (use `Promise.allSettled` or independent state)
  - Add `emotionData` state (`EmotionAnalysisResult | null`) — set to `null` on fetch error or empty result
  - After the per-question breakdown section, render an "Emotional Analysis" section only when `emotionData` is non-null and `emotionData.perQuestion.length > 0`
  - Session-level summary card: show `dominantEmotion`, `emotionalStability`, `confidenceLevel`, `stressPattern`, `interpretation`
  - Per-question emotion row: show `avgFear` and `confidenceScore` alongside each question's existing evaluation card
  - If `emotionData` is null or empty, omit the emotion section entirely — no error message
  - The existing answer evaluation (scores, strengths, weaknesses, suggestions) must always render regardless of emotion data availability
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.4_

  - [ ]* 11.1 Write unit tests for `ResultsPage` emotion rendering
    - Test emotion section is absent when `emotionData` is null
    - Test emotion section is absent when `perQuestion` array is empty
    - Test emotion section renders all required fields when data is present
    - Test answer evaluation section always renders regardless of emotion data state
    - _Requirements: 8.4, 8.5_

  - [ ]* 11.2 Write property test for results page rendering completeness (Property 8)
    - **Property 8: Results page renders all emotion fields when data is present**
    - For any valid `EmotionAnalysisResult` with non-empty `perQuestion` and non-null `session`, assert all of `dominantEmotion`, `emotionalStability`, `confidenceLevel`, `stressPattern`, `interpretation`, per-question `avgFear` and `confidenceScore` are rendered
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 11.3 Write property test for answer evaluation invariant (Property 9)
    - **Property 9: Answer evaluation is always rendered regardless of emotion data**
    - For any combination of emotion data availability (present, empty, null, fetch error), assert the per-question answer evaluation section (scores, strengths, weaknesses, suggestions) is always rendered
    - **Validates: Requirements 8.5**

- [ ] 12. Final checkpoint — Ensure all tests pass end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The entire emotion pipeline is fire-and-forget — no emotion error should ever surface to the user or block the interview
- Property tests use `fast-check` (already in `devDependencies`); tag each with `// Feature: emotion-analysis-integration, Property N: <property text>`
- Unit tests use Jest + `@testing-library/react`; integration tests for MongoDB routes can use `mongodb-memory-server`
- Flask runs on port 5000 (existing); CORS is already enabled via `flask-cors`
- EmotiEffLib install: `pip install emotiefflib` (ONNX backend, no torch needed); also needs `pip install facenet-pytorch opencv-python numpy Pillow`
