'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, StopCircle, ChevronRight, SkipForward, Volume2, VolumeX } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface PrepareData {
  domain: string;
  hasResume: boolean;
  difficulty: 'easy' | 'moderate' | 'hard';
  questionCount: 5 | 10 | 15;
  interviewType: 'dsa' | 'audio';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [fetchedBatches, setFetchedBatches] = useState(1);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // TTS helpers
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Small delay to ensure cancellation completes
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      
      // Get voices - they might not be loaded immediately
      let voices = window.speechSynthesis.getVoices();
      
      // If voices aren't loaded yet, wait for them
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
        // Voices already loaded
        const preferred = voices.find((v) => 
          v.lang.startsWith('en') && 
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female') || v.default)
        );
        if (preferred) utterance.voice = preferred;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        // 'interrupted' fires when we cancel() to start a new utterance — not a real error
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('TTS error:', e.error);
        }
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
    // Preload voices for TTS consistency
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

  // Auto-speak when question changes
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      // Small delay to let the browser settle before speaking
      const t = setTimeout(() => speakQuestion(questions[currentIndex]), 300);
      return () => clearTimeout(t);
    }
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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const formatSessionTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

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

  const advance = (response: string) => {
    stopSpeaking();
    const updated = [...responses];
    updated[currentIndex] = response;
    setResponses(updated);
    setCurrentResponse('');
    setRecordingTime(0);

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
    } else {
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

  const handleNext = () => advance(currentResponse);
  const handleSkip = () => advance('');

  if (!prepareData) return null;

  if (loadingQuestions) return (
    <div className="min-h-screen" style={{ backgroundColor: '#2C2B30' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F58F7C', animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F2C4CE', animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F58F7C', animationDelay: '300ms' }} />
        </div>
        <p className="text-lg" style={{ color: '#D6D6D6' }}>Generating your questions...</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen" style={{ backgroundColor: '#2C2B30' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-lg" style={{ color: '#F58F7C' }}>{loadError}</p>
        <button onClick={() => router.push('/prepare')} className="px-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2C2B30' }}>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === 'active' && (
          <div>
            {/* Session badges */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#4F4F51', color: '#F2C4CE' }}>
                {prepareData.domain}
              </span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#4F4F51', color: '#F58F7C' }}>
                {prepareData.difficulty.charAt(0).toUpperCase() + prepareData.difficulty.slice(1)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold" style={{ color: '#D6D6D6' }}>
                  Question {currentIndex + 1} of {prepareData.questionCount ?? 5}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: sessionTimeLeft < 60 ? '#F58F7C' : '#4F4F51', color: sessionTimeLeft < 60 ? '#2C2B30' : '#F2C4CE' }}>
                    ⏱ {formatSessionTime(sessionTimeLeft)}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#4F4F51', color: '#D6D6D6' }}>
                    {Math.round(((currentIndex + 1) / (prepareData.questionCount ?? 5)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#4F4F51' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / (prepareData.questionCount ?? 5)) * 100}%`, backgroundColor: '#F58F7C' }} />
              </div>
            </div>

            {/* Question card */}
            <div className="rounded-xl p-8 mb-6 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#F2C4CE' }}>{questions[currentIndex]}</h2>
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(questions[currentIndex])}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
                  style={{ backgroundColor: isSpeaking ? '#F2C4CE' : '#2C2B30', color: isSpeaking ? '#2C2B30' : '#F2C4CE' }}
                >
                  {isSpeaking ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> Hear</>}
                </button>
              </div>

              <div className="border-l-4 p-4 rounded mb-6" style={{ backgroundColor: '#2C2B30', borderColor: '#F58F7C' }}>
                <p className="text-sm" style={{ color: '#D6D6D6' }}>
                  💡 Tip: Use the STAR method — Situation, Task, Action, Result. Be specific and concise.
                </p>
              </div>

              {/* Response area */}
              <div className="border-2 rounded-lg p-6 mb-6" style={{ backgroundColor: '#2C2B30', borderColor: '#4F4F51' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold" style={{ color: '#D6D6D6' }}>Your Response</h3>
                    <p className="text-sm" style={{ color: '#D6D6D6' }}>Speak or type your answer</p>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F58F7C' }} />
                      <span className="text-lg font-mono font-bold" style={{ color: '#F58F7C' }}>{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>

                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your answer here, or use the microphone to speak..."
                  rows={5}
                  className="w-full rounded-lg p-3 resize-none focus:outline-none focus:ring-2 mb-4"
                  style={{ backgroundColor: '#4F4F51', border: '1px solid #D6D6D6', color: '#D6D6D6' }}
                />

                <div className="flex gap-3">
                  {!isRecording ? (
                    <>
                      <button onClick={startRecording} className="px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition hover:opacity-90" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
                        <Mic className="w-4 h-4" /> Start Speaking
                      </button>
                      <button onClick={handleSkip} className="border-2 px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 hover:opacity-80" style={{ borderColor: '#D6D6D6', color: '#D6D6D6' }}>
                        <SkipForward className="w-4 h-4" /> Skip
                      </button>
                    </>
                  ) : (
                    <button onClick={stopRecording} className="px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition hover:opacity-90" style={{ backgroundColor: '#4F4F51', color: '#D6D6D6', border: '1px solid #D6D6D6' }}>
                      <StopCircle className="w-4 h-4" /> Stop Speaking
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!currentResponse.trim() || isRecording}
                  className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}
                >
                  {currentIndex === (prepareData.questionCount ?? 5) - 1 ? 'Finish Interview' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'submitting' && (
          <div className="text-center py-24">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#F2C4CE' }}>Session Complete!</h1>
            <p className="text-xl mb-8" style={{ color: '#D6D6D6' }}>Analyzing your responses...</p>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F58F7C', animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F2C4CE', animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#F58F7C', animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
