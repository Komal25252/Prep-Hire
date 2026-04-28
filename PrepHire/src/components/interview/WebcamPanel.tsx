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
  const faceMeshRef = useRef<any>(null);
  const [attentionState, setAttentionState] = useState<'focused' | 'drift' | 'absent'>('focused');
  const attentionRef = useRef<'focused' | 'drift' | 'absent'>('focused');

  // Load MediaPipe Face Mesh via CDN
  useEffect(() => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
    ];
    let loadedCount = 0;

    scripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) {
          initFaceMesh();
        }
      };
      document.head.appendChild(script);
    });

    const initFaceMesh = () => {
      // @ts-ignore
      const faceMesh = new window.FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          attentionRef.current = 'absent';
          setAttentionState('absent');
          return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        // Landmarks: Nose Tip (1), Left Eye Inner (33), Right Eye Inner (263)
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;

        const yaw = nose.x - eyeCenterX;
        const pitch = nose.y - eyeCenterY;

        // Thresholds based on typical "looking at screen" range
        // Looking away usually results in yaw/pitch > 0.05
        if (Math.abs(yaw) < 0.06 && Math.abs(pitch) < 0.06) {
          attentionRef.current = 'focused';
          setAttentionState('focused');
        } else {
          attentionRef.current = 'drift';
          setAttentionState('drift');
        }
      });

      faceMeshRef.current = faceMesh;
    };

    return () => {
      if (faceMeshRef.current) faceMeshRef.current.close();
    };
  }, []);

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

    // Run FaceMesh for attention tracking
    if (faceMeshRef.current) {
      faceMeshRef.current.send({ image: video });
    }
    
    // POST to local Next.js proxy (which forwards to Flask)
    fetch('/api/emotion/analyze', {
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
          attention: attentionRef.current, // Sync with MediaPipe state
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

        {/* Floating Attention Badge */}
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            color: attentionState === 'focused' ? '#4ade80' : attentionState === 'drift' ? '#fbbf24' : '#f87171',
            border: `1px solid ${attentionState === 'focused' ? '#4ade80' : attentionState === 'drift' ? '#fbbf24' : '#f87171'}44`
          }}
        >
          {attentionState}
        </div>
      </div>

      {/* Status Badges */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div
          style={{
            flex: 1,
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
            AI Connected
          </span>
        </div>
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
