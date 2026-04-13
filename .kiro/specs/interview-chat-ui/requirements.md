# Requirements Document

## Introduction

This feature redesigns the PrepHire interview page (`/interview`) from a single-question card format into a split-screen chat UI. The left panel shows a live webcam feed of the candidate alongside session context. The right panel presents the interview as a scrolling chat thread where AI questions appear as left-aligned bubbles and the candidate's transcribed voice answers appear as right-aligned bubbles. All existing logic — question fetching, Web Speech API transcription, session timer, results flow, and prepare-page settings — is preserved unchanged.

## Glossary

- **Interview_Page**: The Next.js page at `/interview` that hosts the interview session.
- **Chat_Panel**: The right-side panel containing the scrollable message thread.
- **Webcam_Panel**: The left-side panel containing the live webcam feed and session metadata.
- **AI_Bubble**: A chat message bubble aligned to the left representing a question from the AI interviewer.
- **Candidate_Bubble**: A chat message bubble aligned to the right representing the candidate's submitted answer.
- **Mic_Button**: The interactive button the candidate presses to start or stop voice recording.
- **Send_Button**: The button the candidate presses to submit a transcribed answer as a Candidate_Bubble.
- **Speech_Recognizer**: The Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) used for real-time transcription.
- **Session_Timer**: The countdown timer tracking remaining interview time, initialized from `questionCount × 3` minutes.
- **Question_Queue**: The ordered list of questions fetched in batches of 5 from `/api/questions`.
- **Prepare_Data**: The session-storage object written by the prepare page containing `domain`, `difficulty`, `questionCount`, and `interviewType`.
- **Results_Page**: The Next.js page at `/results` that displays post-interview feedback.

---

## Requirements

### Requirement 1: Split-Screen Layout

**User Story:** As a candidate, I want the interview page to show my webcam on the left and the chat on the right, so that I feel like I am in a real video interview.

#### Acceptance Criteria

1. THE Interview_Page SHALL render a two-column split-screen layout occupying the full viewport height below the navigation bar.
2. THE Webcam_Panel SHALL occupy the left column and THE Chat_Panel SHALL occupy the right column.
3. WHEN the viewport width is below 768 px, THE Interview_Page SHALL stack the Webcam_Panel above the Chat_Panel in a single column.
4. THE Interview_Page SHALL apply the existing color scheme: background `#2C2B30`, card background `#4F4F51`, accent `#F58F7C`, secondary `#F2C4CE`, and text `#D6D6D6`.

---

### Requirement 2: Webcam Panel

**User Story:** As a candidate, I want to see my live webcam feed prominently on the left, so that I can monitor my own presence during the interview.

#### Acceptance Criteria

1. WHEN the Interview_Page loads, THE Webcam_Panel SHALL request access to the candidate's camera via the browser `getUserMedia` API and display the live video stream.
2. IF the candidate denies camera permission, THEN THE Webcam_Panel SHALL display a placeholder graphic and the text "Camera unavailable" in color `#D6D6D6` without blocking the rest of the interview.
3. THE Webcam_Panel SHALL display an "AI Interviewer Connected" badge styled with background `#4F4F51` and text color `#F2C4CE` overlaid on or directly below the video feed.
4. THE Webcam_Panel SHALL display the session's `domain`, `difficulty`, and `questionCount` values read from Prepare_Data below the video feed.
5. THE Webcam_Panel SHALL display the Session_Timer in the same countdown format (`MM:SS`) currently used on the interview page.
6. WHEN the Session_Timer reaches 0 seconds, THE Interview_Page SHALL automatically submit the current in-progress answer and navigate to the Results_Page.

---

### Requirement 3: Chat Panel — Message Thread

**User Story:** As a candidate, I want to see the interview as a conversation thread, so that I can follow the flow of questions and my own answers naturally.

#### Acceptance Criteria

1. THE Chat_Panel SHALL render a vertically scrollable message thread.
2. WHEN a new AI question is added to the thread, THE Chat_Panel SHALL render it as an AI_Bubble left-aligned with background `#4F4F51` and text color `#D6D6D6`.
3. WHEN the candidate submits an answer, THE Chat_Panel SHALL render it as a Candidate_Bubble right-aligned with background `#F58F7C` and text color `#2C2B30`.
4. WHEN a new message is appended to the thread, THE Chat_Panel SHALL automatically scroll to the bottom so the latest message is visible.
5. THE Chat_Panel SHALL display the first question from the Question_Queue as an AI_Bubble immediately after questions finish loading.
6. THE Chat_Panel SHALL display a typing indicator (three animated dots) as an AI_Bubble WHILE the next question is being prepared after the candidate submits an answer.

---

### Requirement 4: Voice Input and Answer Submission

**User Story:** As a candidate, I want to press a mic button to record my answer and then send it as a chat message, so that the interaction feels like a natural voice-driven conversation.

#### Acceptance Criteria

1. THE Chat_Panel SHALL display a Mic_Button and a Send_Button in a fixed input area at the bottom of the panel.
2. WHEN the candidate presses the Mic_Button while not recording, THE Speech_Recognizer SHALL start continuous transcription and THE Mic_Button SHALL change to an active/stop state styled with color `#F58F7C`.
3. WHEN the candidate presses the Mic_Button while recording, THE Speech_Recognizer SHALL stop and the transcribed text SHALL remain visible in the input area for review.
4. WHILE the Speech_Recognizer is active, THE Chat_Panel SHALL display the live interim transcript in the input area in real time.
5. WHEN the candidate presses the Send_Button and the input area contains non-empty text, THE Chat_Panel SHALL append a Candidate_Bubble with that text, clear the input area, and advance to the next question.
6. IF the candidate presses the Send_Button and the input area is empty, THEN THE Send_Button SHALL remain disabled and no Candidate_Bubble SHALL be appended.
7. THE Chat_Panel SHALL display a "Skip" option that, when activated, advances to the next question without appending a Candidate_Bubble and records an empty response for that question.

---

### Requirement 5: Question Progression and Batch Fetching

**User Story:** As a candidate, I want questions to appear seamlessly in the chat without interruption, so that the interview flow is not broken by loading delays.

#### Acceptance Criteria

1. THE Interview_Page SHALL fetch the first batch of 5 questions from `/api/questions` on load using the `domain`, `difficulty`, `count: 5`, and `interviewType` values from Prepare_Data.
2. WHEN the candidate submits the answer to question 5 and `questionCount` is greater than 5, THE Interview_Page SHALL fetch a second batch of 5 questions from `/api/questions` and append them to the Question_Queue.
3. WHEN the candidate submits the answer to question 10 and `questionCount` is 15, THE Interview_Page SHALL fetch a third batch of 5 questions from `/api/questions` and append them to the Question_Queue.
4. WHILE a batch is being fetched, THE Chat_Panel SHALL display the typing indicator so the candidate is aware the next question is loading.
5. WHEN all `questionCount` questions have been answered, THE Interview_Page SHALL write the results to `sessionStorage` under the key `interviewResults` and navigate to the Results_Page.

---

### Requirement 6: End Interview Early

**User Story:** As a candidate, I want an "End Interview" button always visible, so that I can terminate the session at any time without being stuck.

#### Acceptance Criteria

1. THE Interview_Page SHALL display an "End Interview" button in the top-right area of the page, visible at all times during an active session.
2. WHEN the candidate activates the "End Interview" button, THE Interview_Page SHALL write all answers collected so far (with empty strings for unanswered questions) to `sessionStorage` under the key `interviewResults` and navigate to the Results_Page.
3. THE "End Interview" button SHALL be styled with border color `#F58F7C` and text color `#F58F7C` to indicate a destructive action without being visually dominant.

---

### Requirement 7: Session Initialization and Error Handling

**User Story:** As a candidate, I want the interview to load reliably and inform me clearly if something goes wrong, so that I am not left with a broken or blank screen.

#### Acceptance Criteria

1. WHEN the Interview_Page loads and `sessionStorage` does not contain a valid `prepareData` entry, THE Interview_Page SHALL redirect the candidate to `/prepare`.
2. WHILE questions are being fetched on initial load, THE Interview_Page SHALL display a loading state with animated indicators in colors `#F58F7C` and `#F2C4CE`.
3. IF the `/api/questions` request fails or returns no questions, THEN THE Interview_Page SHALL display an error message in color `#F58F7C` and a "Go Back" button that navigates to `/prepare`.
4. THE Interview_Page SHALL stop the Session_Timer and release the webcam stream WHEN the candidate navigates away from the page.
