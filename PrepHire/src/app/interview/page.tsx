'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import WebcamPanel from '@/components/interview/WebcamPanel';
import ChatPanel from '@/components/interview/ChatPanel';

interface PrepareData {
  domain: string;
  hasResume: boolean;
  difficulty: 'easy' | 'moderate' | 'hard';
  questionCount: 5 | 10 | 15;
  interviewType: 'dsa' | 'audio';
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'candidate';
  text: string;
  timestamp: number;
}

export default function InterviewPage() {
  const router = useRouter();
  const [prepareData, setPrepareData] = useState<PrepareData | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<'active' | 'submitting'>('active');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [fetchedBatches, setFetchedBatches] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTypingIndicatorVisible, setIsTypingIndicatorVisible] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // TTS helpers
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          const preferred = voices.find((v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female') || v.default)
          );
          if (preferred) utterance.voice = preferred;
        };
      } else {
        const preferred = voices.find((v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female') || v.default)
        );
        if (preferred) utterance.voice = preferred;
      }
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('TTS error:', e.error);
        }
      };
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Fetch a batch of 5 questions
  const fetchQuestions = async (data: PrepareData, append = false) => {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: data.domain, difficulty: data.difficulty, count: 5, interviewType: data.interviewType }),
      });
      const json = await res.json();
      if (json.questions?.length) {
        setQuestions((prev) => append ? [...prev, ...json.questions] : json.questions);
      } else {
        setLoadError('Failed to load questions. Please try again.');
      }
    } catch {
      setLoadError('Network error. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const raw = sessionStorage.getItem('prepareData');
    if (!raw) { router.push('/prepare'); return; }
    const data: PrepareData = JSON.parse(raw);
    setPrepareData(data);
    setResponses(Array(data.questionCount ?? 5).fill(''));

    let cancelled = false;
    fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: data.domain, difficulty: data.difficulty, count: 5, interviewType: data.interviewType }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.questions?.length) {
          setQuestions(json.questions);
          setMessages([{ id: crypto.randomUUID(), role: 'ai', text: json.questions[0], timestamp: Date.now() }]);
          const totalSeconds = (data.questionCount ?? 5) * 3 * 60;
          setSessionTimeLeft(totalSeconds);
          sessionTimerRef.current = setInterval(() => {
            setSessionTimeLeft((t) => {
              if (t <= 1) { clearInterval(sessionTimerRef.current!); return 0; }
              return t - 1;
            });
          }, 1000);
        } else {
          setLoadError('Failed to load questions. Please try again.');
        }
      })
      .catch(() => { if (!cancelled) setLoadError('Network error. Please try again.'); })
      .finally(() => { if (!cancelled) setLoadingQuestions(false); });

    return () => {
      cancelled = true;
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [router]);

  // Auto-submit when session timer hits 0
  useEffect(() => {
    if (sessionTimeLeft === 0 && !loadingQuestions && status === 'active' && questions.length > 0) {
      advance(currentResponse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTimeLeft]);

  // Auto-speak when question changes
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      const t = setTimeout(() => speakQuestion(questions[currentIndex]), 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = () => {
    setRecordingTime(0);
    setIsRecording(true);
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ');
        setCurrentResponse(transcript);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const handleMicToggle = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const advance = (response: string) => {
    stopSpeaking();
    const updated = [...responses];
    updated[currentIndex] = response;
    setResponses(updated);
    setCurrentResponse('');
    setRecordingTime(0);
    if (isRecording) stopRecording();

    const nextIndex = currentIndex + 1;
    const totalCount = prepareData?.questionCount ?? 5;

    if (nextIndex === 5 && totalCount > 5 && fetchedBatches === 1) {
      setFetchedBatches(2);
      fetchQuestions(prepareData!, true);
    } else if (nextIndex === 10 && totalCount > 10 && fetchedBatches === 2) {
      setFetchedBatches(3);
      fetchQuestions(prepareData!, true);
    }

    if (nextIndex < totalCount) {
      setCurrentIndex(nextIndex);
      setIsTypingIndicatorVisible(false);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ai', text: questions[nextIndex] ?? '...', timestamp: Date.now() },
      ]);
    } else {
      setIsTypingIndicatorVisible(false);
      setStatus('submitting');
      sessionStorage.setItem('interviewResults', JSON.stringify({
        domain: prepareData?.domain,
        difficulty: prepareData?.difficulty,
        questions,
        responses: updated,
        date: new Date().toISOString(),
      }));
      setTimeout(() => router.push('/results'), 1500);
    }
  };

  const handleSend = () => {
    if (!currentResponse.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'candidate', text: currentResponse, timestamp: Date.now() },
    ]);
    setIsTypingIndicatorVisible(true);
    advance(currentResponse);
  };

  const handleSkip = () => {
    advance('');
  };

  const handleEndInterview = () => {
    const totalCount = prepareData?.questionCount ?? 5;
    const padded = [...responses];
    while (padded.length < totalCount) padded.push('');
    sessionStorage.setItem('interviewResults', JSON.stringify({
      domain: prepareData?.domain,
      difficulty: prepareData?.difficulty,
      questions,
      responses: padded,
      date: new Date().toISOString(),
    }));
    router.push('/results');
  };

  if (!prepareData) return null;

  if (loadingQuestions) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-secondary)', animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '300ms' }} />
        </div>
        <p className="text-lg" style={{ color: 'var(--color-text)' }}>Generating your questions...</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-lg" style={{ color: 'var(--color-accent)' }}>{loadError}</p>
        <button onClick={() => router.push('/prepare')} className="px-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
          Go Back
        </button>
      </div>
    </div>
  );

  if (status === 'submitting') return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="text-center py-24">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Session Complete!</h1>
        <p className="text-xl mb-8" style={{ color: 'var(--color-text)' }}>Analyzing your responses...</p>
        <div className="flex items-center gap-3 justify-center">
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-secondary)', animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />

      {/* Top bar with End Interview button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <button
          onClick={handleEndInterview}
          style={{
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            padding: '0.375rem 0.875rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          End Interview
        </button>
      </div>

      {/* Split-screen layout */}
      <div
        className="flex flex-col md:flex-row"
        style={{ height: 'calc(100vh - 4rem)', overflow: 'hidden' }}
      >
        {/* Left: WebcamPanel ~40% */}
        <div className="w-full md:w-2/5" style={{ flexShrink: 0, overflow: 'hidden' }}>
          <WebcamPanel
            domain={prepareData.domain}
            difficulty={prepareData.difficulty}
            questionCount={prepareData.questionCount}
            sessionTimeLeft={sessionTimeLeft}
          />
        </div>

        {/* Right: ChatPanel ~60% */}
        <div className="w-full md:w-3/5" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel
            messages={messages}
            inputText={currentResponse}
            isRecording={isRecording}
            recordingTime={recordingTime}
            isTypingIndicatorVisible={isTypingIndicatorVisible}
            onInputChange={setCurrentResponse}
            onMicToggle={handleMicToggle}
            onSend={handleSend}
            onSkip={handleSkip}
          />
        </div>
      </div>
    </div>
  );
}
