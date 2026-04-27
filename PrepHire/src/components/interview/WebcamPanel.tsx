'use client';

import { useEffect, useRef, useState } from 'react';

interface WebcamPanelProps {
  domain: string;
  difficulty: string;
  questionCount: number;
  sessionTimeLeft: number;
  sessionId: string;
  currentQuestionIndex: number;
  isInterviewActive: boolean;
}

export default function WebcamPanel({
  domain,
  difficulty,
  questionCount,
  sessionTimeLeft,
  sessionId,
  currentQuestionIndex,
  isInterviewActive,
}: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFearScoreRef = useRef<number | null>(null);
  const scoresBufferRef = useRef<{ scores: any, timestamp: number }[]>([]);

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
        if (!cancelled) setIsCameraReady(true);
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

  useEffect(() => {
    if (isInterviewActive && streamRef.current) {
      captureIntervalRef.current = setInterval(captureAndSubmit, 5000);
    } else {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    }
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [isInterviewActive, isCameraReady]);

  const captureAndSubmit = () => {
    if (!videoRef.current || !streamRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Wait until video has metadata
    if (video.videoWidth === 0) return;
    
    // Cap at 640x480
    const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight, 1);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const frame = canvas.toDataURL('image/jpeg', 0.8);
    
    // Fire-and-forget POST to Flask
    fetch('http://localhost:5000/analyze-emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame }),
    })
    .then(res => res.json())
    .then(data => {
      if (!data || data.error || !data.scores) return;
      
      const { emotion, scores } = data;
      
      // Spike filtering: ignore readings where scores.fear jumps more than 30 points
      if (lastFearScoreRef.current !== null && Math.abs(scores.fear - lastFearScoreRef.current) > 30) {
        return;
      }
      lastFearScoreRef.current = scores.fear;
      
      // Rolling window smoothing: keep last 10 seconds (last 2 readings at 5s interval)
      const now = Date.now();
      scoresBufferRef.current = [
        ...scoresBufferRef.current.filter(s => now - s.timestamp < 10000),
        { scores, timestamp: now }
      ];
      
      // Average scores
      const avgScores = { ...scores };
      if (scoresBufferRef.current.length > 1) {
        const labels = Object.keys(scores);
        labels.forEach(label => {
          const sum = scoresBufferRef.current.reduce((acc, curr) => acc + curr.scores[label], 0);
          avgScores[label] = sum / scoresBufferRef.current.length;
        });
      }
      
      // Fire-and-forget POST to Next.js API
      fetch('/api/interview/emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentQuestionIndex,
          timestamp: new Date().toISOString(),
          emotion,
          scores: avgScores,
        }),
      }).catch(() => {});
    })
    .catch(() => {});
  };

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
