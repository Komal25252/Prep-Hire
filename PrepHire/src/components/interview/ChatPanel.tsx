'use client';

import MessageThread from './MessageThread';
import TypingIndicator from './TypingIndicator';
import ChatInputBar from './ChatInputBar';

interface ChatMessage {
  id: string;
  role: 'ai' | 'candidate';
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  inputText: string;
  isRecording: boolean;
  recordingTime: number;
  isTypingIndicatorVisible: boolean;
  onInputChange: (text: string) => void;
  onMicToggle: () => void;
  onSend: () => void;
  onSkip: () => void;
}

export default function ChatPanel({
  messages,
  inputText,
  isRecording,
  recordingTime,
  isTypingIndicatorVisible,
  onInputChange,
  onMicToggle,
  onSend,
  onSkip,
}: ChatPanelProps) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <MessageThread messages={messages} />
      </div>

      {isTypingIndicatorVisible && <TypingIndicator />}

      <ChatInputBar
        value={inputText}
        isRecording={isRecording}
        recordingTime={recordingTime}
        onChange={onInputChange}
        onMicToggle={onMicToggle}
        onSend={onSend}
        onSkip={onSkip}
      />
    </div>
  );
}
