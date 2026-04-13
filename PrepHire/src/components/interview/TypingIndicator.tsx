'use client';

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 1rem 0.75rem' }}>
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-text)',
          borderRadius: '0.75rem 0.75rem 0.75rem 0.125rem',
          padding: '0.625rem 0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="animate-bounce"
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text)',
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
