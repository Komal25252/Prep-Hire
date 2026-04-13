'use client';

import { useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'ai' | 'candidate';
  text: string;
  timestamp: number;
}

interface MessageThreadProps {
  messages: ChatMessage[];
}

export default function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      style={{ overflowY: 'auto', flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      {messages.map((msg) =>
        msg.role === 'ai' ? (
          <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-text)',
                borderRadius: '0.75rem 0.75rem 0.75rem 0.125rem',
                padding: '0.625rem 0.875rem',
                maxWidth: '75%',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              }}
            >
              {msg.text}
            </div>
          </div>
        ) : (
          <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-background)',
                borderRadius: '0.75rem 0.75rem 0.125rem 0.75rem',
                padding: '0.625rem 0.875rem',
                maxWidth: '75%',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              }}
            >
              {msg.text}
            </div>
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
