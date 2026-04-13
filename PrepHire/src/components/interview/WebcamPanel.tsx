'use client';

import { useEffect, useRef, useState } from 'react';

interface WebcamPanelProps {
  domain: string;
  difficulty: string;
  questionCount: number;
  sessionTimeLeft: number;
}

export default function WebcamPanel({
  domain,
  difficulty,
  questionCount,
  sessionTimeLeft,
}: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) setCameraError(true);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const formattedTime =
    Math.floor(sessionTimeLeft / 60).toString().padStart(2, '0') +
    ':' +
    (sessionTimeLeft % 60).toString().padStart(2, '0');

  const isUrgent = sessionTimeLeft < 60;

  const capitalizedDifficulty =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        height: '100%',
      }}
    >
      {/* Video feed or placeholder */}
      <div
        style={{
          flex: 1,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--color-card)',
          position: 'relative',
          minHeight: 0,
        }}
      >
        {cameraError ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              minHeight: '200px',
            }}
          >
            {/* Camera icon placeholder */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span style={{ color: 'var(--color-text)', fontSize: '14px' }}>
              Camera unavailable
            </span>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* AI Interviewer Connected badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-card)',
          borderRadius: '8px',
          padding: '8px 12px',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4ade80',
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--color-secondary)', fontSize: '13px', fontWeight: 600 }}>
          AI Interviewer Connected
        </span>
      </div>

      {/* Session metadata */}
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text)', fontSize: '12px' }}>Domain</span>
          <span style={{ color: 'var(--color-secondary)', fontSize: '12px', fontWeight: 600 }}>
            {domain}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text)', fontSize: '12px' }}>Difficulty</span>
          <span style={{ color: 'var(--color-secondary)', fontSize: '12px', fontWeight: 600 }}>
            {capitalizedDifficulty}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text)', fontSize: '12px' }}>Questions</span>
          <span style={{ color: 'var(--color-secondary)', fontSize: '12px', fontWeight: 600 }}>
            {questionCount}
          </span>
        </div>
      </div>

      {/* Session timer */}
      <div
        style={{
          backgroundColor: 'var(--color-card)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: 'var(--color-text)', fontSize: '12px' }}>
          Time Remaining
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 700,
            color: isUrgent ? 'var(--color-accent)' : 'var(--color-text)',
          }}
        >
          ⏱ {formattedTime}
        </span>
      </div>
    </div>
  );
}
