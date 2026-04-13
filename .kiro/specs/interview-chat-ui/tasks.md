# Implementation Plan: interview-chat-ui

## Overview

Redesign `PrepHire/src/app/interview/page.tsx` into a split-screen chat UI. All existing logic (Web Speech API, TTS, question batching, session timer, results flow) is preserved and reorganized into focused sub-components. No new routes or API changes are needed.

## Tasks

- [x] 1. Define the ChatMessage data model and shared types
  - Add `ChatMessage` interface (`id`, `role: 'ai' | 'candidate'`, `text`, `timestamp`) to the interview page file
  - Keep existing `PrepareData` and `InterviewResults` interfaces unchanged
  - Add `messages: ChatMessage[]` and `isTypingIndicatorVisible: boolean` to component state alongside existing state fields
  - _Requirements: 3.2, 3.3, 5.5_

- [x] 2. Build the WebcamPanel component
  - [x] 2.1 Implement WebcamPanel with getUserMedia and video feed
    - Create `WebcamPanel` component (same file or `PrepHire/src/components/interview/WebcamPanel.tsx`)
    - Accept props: `domain`, `difficulty`, `questionCount`, `sessionTimeLeft`
    - On mount call `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` and assign stream to `<video>` `srcObject`
    - On unmount stop all tracks
    - Render "AI Interviewer Connected" badge (`#4F4F51` bg, `#F2C4CE` text), domain/difficulty/questionCount labels, and `MM:SS` timer
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - [x] 2.2 Handle camera denial gracefully
    - Catch `getUserMedia` rejection and set `cameraError` state
    - Render placeholder graphic and "Camera unavailable" text (`#D6D6D6`) when `cameraError` is true
    - Interview must remain fully functional when camera is denied
    - _Requirements: 2.2_
  - [ ]* 2.3 Write property test for WebcamPanel — PrepareData values rendered
    - **Property 6: PrepareData values rendered in webcam panel**
    - **Validates: Requirements 2.4**
    - Generate random `PrepareData` objects with arbitrary `domain`, `difficulty`, `questionCount` using `fc.record`; render `WebcamPanel`; assert all three values appear in the output
  - [ ]* 2.4 Write property test for WebcamPanel — session timer format
    - **Property 7: Session timer format**
    - **Validates: Requirements 2.5**
    - Generate integers in [0, 2700] with `fc.integer({ min: 0, max: 2700 })`; assert `formatTime(n)` matches `/^\d{2}:\d{2}$/`
  - [ ]* 2.5 Write property test for camera denial
    - **Property 8: Camera denial does not block interview**
    - **Validates: Requirements 2.2**
    - Mock `navigator.mediaDevices.getUserMedia` to reject; render `WebcamPanel`; assert "Camera unavailable" is shown and no unhandled error is thrown

- [x] 3. Build the ChatPanel sub-components
  - [x] 3.1 Implement MessageThread with auto-scroll
    - Create `MessageThread` component rendering each `ChatMessage` as a bubble
    - AI bubbles: left-aligned, `#4F4F51` bg, `#D6D6D6` text
    - Candidate bubbles: right-aligned, `#F58F7C` bg, `#2C2B30` text
    - Attach `bottomRef` and call `scrollIntoView({ behavior: 'smooth' })` in a `useEffect` whenever `messages` changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.2 Write property test for message bubble styling by role
    - **Property 1: Message bubble styling by role**
    - **Validates: Requirements 3.2, 3.3**
    - Generate random `ChatMessage[]` arrays with `fc.array(fc.record({ id: fc.string(), role: fc.constantFrom('ai', 'candidate'), text: fc.string(), timestamp: fc.integer() }))`; render `MessageThread`; assert each bubble has correct alignment class and background color matching its role
  - [ ]* 3.3 Write property test for message thread auto-scroll
    - **Property 3: Message thread auto-scrolls on append**
    - **Validates: Requirements 3.4**
    - Append messages one at a time; after each React render assert `scrollIntoView` was called (mock via `jest.fn()`)
  - [x] 3.4 Implement TypingIndicator component
    - Three `<span>` dots with staggered `animation-delay` (0 ms, 150 ms, 300 ms) rendered inside an AI-bubble wrapper
    - Shown when `isTypingIndicatorVisible` is `true`
    - _Requirements: 3.6, 5.4_
  - [ ]* 3.5 Write property test for typing indicator visibility invariant
    - **Property 5: Typing indicator visibility invariant**
    - **Validates: Requirements 3.6, 5.4**
    - Generate random sequences of submit events; assert `isTypingIndicatorVisible` is `true` immediately after each submit and `false` after the next AI bubble is appended
  - [x] 3.6 Implement ChatInputBar component
    - Textarea (or single-line input) for answer text, Mic button, Send button, Skip link
    - Mic button active state: `#F58F7C` color; shows live interim transcript while `SpeechRecognizer` is active
    - Send button disabled when `inputText.trim()` is empty
    - Emit `onMicToggle`, `onSend`, `onSkip` callbacks to parent
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 3.7 Write property test for empty input cannot be submitted
    - **Property 2: Empty input cannot be submitted**
    - **Validates: Requirements 4.6**
    - Generate whitespace-only strings with `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`; render `ChatInputBar` with each as `value`; assert Send button has `disabled` attribute

- [x] 4. Assemble ChatPanel from sub-components
  - Create `ChatPanel` wrapper accepting `messages`, `inputText`, `isRecording`, `isTypingIndicatorVisible`, and the four callbacks
  - Compose `MessageThread`, `TypingIndicator`, and `ChatInputBar` inside a flex-column container
  - `MessageThread` takes all available vertical space (`flex-1 overflow-y-auto`); `ChatInputBar` is pinned to the bottom
  - _Requirements: 3.1, 4.1_

- [ ] 5. Checkpoint — Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Rewrite InterviewPage with split-screen layout
  - [x] 6.1 Replace the existing single-column layout with the two-column split
    - Left column: `WebcamPanel` at ~40% width; right column: `ChatPanel` at ~60% width
    - Full viewport height below the navigation bar (`h-[calc(100vh-4rem)]`)
    - "End Interview" button in the top-right area, styled with `border-color: #F58F7C` and `color: #F58F7C`
    - On mobile (`< 768px`) stack `WebcamPanel` above `ChatPanel` full-width
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.3_
  - [x] 6.2 Wire question loading into the messages array
    - After the initial `/api/questions` fetch succeeds, append the first question as an `AI_Bubble` to `messages`
    - Preserve existing loading state (animated dots) and error state (error message + "Go Back" button)
    - Preserve redirect to `/prepare` when `prepareData` is absent
    - _Requirements: 3.5, 7.1, 7.2, 7.3_
  - [x] 6.3 Wire answer submission through the chat flow
    - `onSend`: append `Candidate_Bubble`, set `isTypingIndicatorVisible = true`, call `advance(inputText)`
    - `onSkip`: call `advance('')` directly (no bubble appended), record empty response
    - Inside `advance`: after updating `responses` and `currentIndex`, hide typing indicator and append next `AI_Bubble` (or trigger batch fetch if at boundary)
    - Preserve all existing batch-fetch logic (`fetchedBatches`, boundary checks at index 5 and 10)
    - _Requirements: 4.5, 4.7, 5.1, 5.2, 5.3, 5.4_
  - [x] 6.4 Wire "End Interview" button
    - On click: pad `responses` with empty strings for unanswered questions, write `interviewResults` to `sessionStorage`, navigate to `/results`
    - _Requirements: 6.1, 6.2_
  - [x] 6.5 Preserve session timer auto-submit and cleanup
    - When `sessionTimeLeft` reaches 0: call `advance(currentInputText)` to auto-submit and navigate
    - On page unmount: clear session timer interval and stop all webcam tracks
    - _Requirements: 2.6, 7.4_
  - [ ]* 6.6 Write property test for responses array round-trip
    - **Property 4: Responses array round-trip**
    - **Validates: Requirements 5.5, 6.2**
    - Generate `questionCount` from `fc.constantFrom(5, 10, 15)` and random answer sequences (mix of strings and empty strings for skips) with `fc.array`; run through `advance` logic; assert `sessionStorage` `interviewResults.responses` has exactly `questionCount` entries

- [x] 7. Preserve TTS (text-to-speech) behaviour
  - Keep `speakQuestion` and `stopSpeaking` helpers unchanged
  - Auto-speak each new AI question bubble when it is appended (reuse existing `useEffect` on `currentIndex` / `questions`)
  - Retain the Hear/Stop TTS toggle button; place it inside the `WebcamPanel` or as a floating control near the chat header
  - _Requirements: (existing behaviour, no new requirement)_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Install fast-check and set up property test infrastructure
  - Run `npm install --save-dev fast-check` inside `PrepHire/`
  - Create `PrepHire/src/app/interview/__tests__/` directory
  - Add `interview-chat-ui.property.test.tsx` with imports for `fast-check`, `@testing-library/react`, and the components under test
  - _Requirements: (testing infrastructure)_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Run the full test suite (`npx jest --testPathPattern=interview-chat-ui`); ensure all property tests and unit tests pass.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use **fast-check** with a minimum of 100 iterations per property
- The `responses: string[]` array written to `sessionStorage` is the only external contract — `messages: ChatMessage[]` is ephemeral UI state
- No new routes, API endpoints, or backend changes are introduced
