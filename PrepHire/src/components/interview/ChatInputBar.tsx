'use client';

import { Mic, StopCircle, Send } from 'lucide-react';

interface ChatInputBarProps {
  value: string;
  isRecording: boolean;
  recordingTime: number;
  onChange: (text: string) => void;
  onMicToggle: () => void;
  onSend: () => void;
  onSkip: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ChatInputBar({
  value,
  isRecording,
  recordingTime,
  onChange,
  onMicToggle,
  onSend,
  onSkip,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-background)',
        borderTop: '1px solid var(--color-border)',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Speak or type your answer..."
        rows={3}
        style={{
          width: '100%',
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.75rem',
          fontSize: '0.9375rem',
          lineHeight: '1.5',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Mic button */}
        <button
          onClick={onMicToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: isRecording ? 'rgba(245,143,124,0.15)' : 'var(--color-card)',
            color: isRecording ? 'var(--color-accent)' : 'var(--color-text)',
            border: isRecording ? '1px solid var(--color-accent)' : '1px solid transparent',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.875rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {isRecording ? (
            <>
              <StopCircle size={16} />
              <span style={{ color: 'var(--color-accent)' }}>{formatTime(recordingTime)}</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span>Speak</span>
            </>
          )}
        </button>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: canSend ? 'var(--color-accent)' : 'var(--color-card)',
            color: canSend ? 'var(--color-background)' : 'var(--color-text)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            cursor: canSend ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'background-color 0.15s',
            opacity: canSend ? 1 : 0.5,
          }}
        >
          <Send size={16} />
          Send
        </button>

        {/* Skip button */}
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: '0.5rem',
            marginLeft: 'auto',
            opacity: 0.7,
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
