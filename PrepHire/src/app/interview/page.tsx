'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Mic, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import WebcamPanel from '@/components/interview/WebcamPanel';
import ChatPanel from '@/components/interview/ChatPanel';

interface PrepareData {
  domain: string;
  hasResume: boolean;
  difficulty: 'easy' | 'moderate' | 'hard';
  questionCount: 5 | 10 | 15;
  interviewType: 'dsa' | 'audio';
  resumeText?: string;
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
  const [isMockQuestion, setIsMockQuestion] = useState<boolean[]>([]); // tracks which questions were fallback
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<'active' | 'submitting'>('active');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTypingIndicatorVisible, setIsTypingIndicatorVisible] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

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

  // Fetch a single adaptive question based on conversation history
  const fetchNextQuestion = async (
    data: PrepareData,
    history: { question: string; answer: string }[],
    questionNumber: number
  ): Promise<{ question: string; isMock: boolean } | null> => {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: data.domain,
          difficulty: data.difficulty,
          interviewType: data.interviewType,
          history,
          questionNumber,
          resumeText: data.resumeText || undefined,
          resumeId: (data as any).resumeId
        }),
      });
      const json = await res.json();
      if (!json.question) return null;
      return { question: json.question, isMock: json.isMock ?? false };
    } catch {
      return null;
    }
  };

  // Initial load — fetch first question
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }

    const raw = sessionStorage.getItem('prepareData');
    if (!raw) { router.push('/prepare'); return; }
    const data: PrepareData = JSON.parse(raw);
    setPrepareData(data);
    setResponses(Array(data.questionCount ?? 5).fill(''));

    let cancelled = false;
    fetchNextQuestion(data, [], 1).then((result) => {
      if (cancelled) return;
      if (result) {
        setQuestions([result.question]);
        setIsMockQuestion([result.isMock]);
        setMessages([{ id: crypto.randomUUID(), role: 'ai', text: result.question, timestamp: Date.now() }]);
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
      setLoadingQuestions(false);
    });

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

  // Auto-speak when a new question arrives (only after disclaimer accepted)
  useEffect(() => {
    if (!disclaimerAccepted) return;
    const q = questions[currentIndex];
    if (q) {
      const t = setTimeout(() => speakQuestion(q), 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIndex, disclaimerAccepted]);

  // Auto-start mic when a new question appears (only after disclaimer accepted)
  useEffect(() => {
    if (!disclaimerAccepted) return;
    const q = questions[currentIndex];
    if (q && status === 'active') {
      // Stop any existing recording first
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setCurrentResponse('');
      setRecordingTime(0);
      // Small delay so TTS starts first
      const t = setTimeout(() => startRecording(), 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIndex, disclaimerAccepted]);

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

    if (nextIndex < totalCount) {
      setCurrentIndex(nextIndex);
      setIsTypingIndicatorVisible(true);

      // Build history for adaptive question generation
      const history = questions.map((q, i) => ({ question: q, answer: updated[i] ?? '' }));

      fetchNextQuestion(prepareData!, history, nextIndex + 1).then((result) => {
        const q = result?.question ?? 'Can you tell me more about your experience?';
        const mock = result?.isMock ?? true;
        setQuestions((prev) => {
          const arr = [...prev];
          arr[nextIndex] = q;
          return arr;
        });
        setIsMockQuestion((prev) => {
          const arr = [...prev];
          arr[nextIndex] = mock;
          return arr;
        });
        setIsTypingIndicatorVisible(false);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'ai', text: q, timestamp: Date.now() },
        ]);
      });
    } else {
      setIsTypingIndicatorVisible(false);
      sessionStorage.setItem('interviewResults', JSON.stringify({
        domain: prepareData?.domain,
        difficulty: prepareData?.difficulty,
        questions,
        responses: updated,
        isMockQuestion,
        sessionId: sessionIdRef.current,
        resumeId: (prepareData as any).resumeId,
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
      isMockQuestion,
      sessionId: sessionIdRef.current,
      resumeId: (prepareData as any).resumeId,
      date: new Date().toISOString(),
    }));
    router.push('/results');
  };

  if (!prepareData) return null;

  if (showDisclaimer) return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Background purely for aesthetic depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: 'var(--color-accent)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: 'var(--color-secondary)' }} />
      
      <Navigation />
      
      <div 
        className="w-full max-w-xl rounded-3xl p-10 bg-black/40 backdrop-blur-xl border relative z-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-white/5 mb-6 border border-white/10">
            <ShieldCheck className="w-10 h-10" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h2 className="text-3xl font-black mb-3 italic tracking-tight" style={{ color: 'var(--color-text)' }}>SYSTEM INITIALIZATION</h2>
          <p className="text-sm opacity-60 px-8" style={{ color: 'var(--color-text)' }}>
            To provide an accurate technical and emotional evaluation, PrepHire requires active sensor calibration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {[
            { 
              Icon: Camera, 
              title: 'Facial Analysis', 
              desc: 'Syncs facial landmarks to detect stress and confidence levels. No recording is saved.',
              color: 'var(--color-accent)' 
            },
            { 
              Icon: Mic, 
              title: 'Voice Recognition', 
              desc: 'Converts your speech to text for real-time technical analysis. Data is processed locally.',
              color: 'var(--color-secondary)' 
            },
          ].map(({ Icon, title, desc, color }) => (
            <div 
              key={title} 
              className="group flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex-shrink-0 p-3 rounded-xl bg-black/20 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-wider" style={{ color }}>{title}</h4>
                <p className="text-xs opacity-60 leading-relaxed" style={{ color: 'var(--color-text)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => { setShowDisclaimer(false); setDisclaimerAccepted(true); }}
            className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
            style={{ backgroundColor: 'var(--color-accent)', color: '#000' }}
          >
            Begin Calibration <ChevronRight size={18} />
          </button>
          <button
            onClick={() => router.push('/prepare')}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-all flex items-center justify-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={14} /> Reconfigure Session
          </button>
        </div>
      </div>
    </div>
  );

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
            sessionId={sessionIdRef.current}
            currentQuestionIndex={currentIndex}
            isInterviewActive={status === 'active'}
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
