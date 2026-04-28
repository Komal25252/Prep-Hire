'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, CheckCircle, TrendingUp, Download, 
  Loader2, ChevronDown, ChevronUp, Sparkles, 
  Activity, Shield, MessageSquare, Brain
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip as ChartTooltip, Legend as ChartLegend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Navigation from '@/components/Navigation';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, ChartTooltip, ChartLegend, Filler
);

interface QuestionEval {
  score: number;
  strength: string;
  weakness: string;
  grammar: string;
  suggestion: string;
}

interface EmotionAnalysis {
  perQuestion: any[];
  session: {
    emotionalStability: string;
    confidenceLevel: string;
    stressPattern: string;
    dominantEmotion: string;
    interpretation: string;
    suggestions: string[];
    trends: {
      fear: { early: number; mid: number; late: number };
      happy: { early: number; mid: number; late: number };
    };
    events: { time: string; type: string }[];
    transitions: number;
  };
  timeline: any[];
}

interface Evaluation {
  perQuestion: QuestionEval[];
  overall: {
    score: number;
    strengths: string[];
    improvements: string[];
    recommendation: string;
    summary: string;
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('interviewResults');
    if (!raw) { router.push('/prepare'); return; }
    const data = JSON.parse(raw);
    setResults(data);

    const pairs = data.questions.map((q: string, i: number) => ({
      question: q,
      answer: data.responses[i] || '',
      isMock: data.isMockQuestion?.[i] ?? false,
    }));

    // Fetch Content Evaluation
    fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: data.domain,
        difficulty: data.difficulty,
        interviewType: 'audio',
        pairs,
        resumeId: data.resumeId,
      }),
    })
      .then(r => r.json())
      .then(ev => {
        setEvaluation(ev);
      })
      .catch(err => console.error("Evaluation error:", err))
      .finally(() => setLoading(false));

    // Fetch Emotion Analysis
    if (data.sessionId) {
      fetch(`/api/emotion/analyze?sessionId=${data.sessionId}`)
        .then(r => r.json())
        .then(ed => {
          if (!ed.error && ed.session) setEmotionData(ed);
        });
    }
  }, [router]);

  // Persist session to History Dashboard
  useEffect(() => {
    if (evaluation && emotionData && results) {
      const history = JSON.parse(sessionStorage.getItem('sessionHistory') || '[]');
      const isAlreadySaved = history.some((s: any) => s.id === results.sessionId);
      
      if (!isAlreadySaved) {
        const newSession = {
          id: results.sessionId,
          date: results.date || new Date().toISOString(),
          domain: results.domain,
          difficulty: results.difficulty,
          score: evaluation.overall.score,
          duration: results.responses.length > 5 ? '15m' : '5m', // Simple estimation
          status: 'completed'
        };
        const updatedHistory = [newSession, ...history].slice(0, 50); // Keep last 50
        sessionStorage.setItem('sessionHistory', JSON.stringify(updatedHistory));
        console.log(">>> Session successfully saved to dashboard history.");
      }
    }
  }, [evaluation, emotionData, results]);

  const chartData = useMemo(() => {
    if (!emotionData?.timeline || emotionData.timeline.length === 0) return null;
    const sorted = [...emotionData.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const startTime = new Date(sorted[0].timestamp).getTime();
    const labels = sorted.map(p => {
      const sec = Math.floor((new Date(p.timestamp).getTime() - startTime) / 1000);
      return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
    });

    // SMOOTHING FUNCTION: Moving Average (window of 3)
    const smooth = (arr: number[]) => {
      const windowSize = 3;
      return arr.map((_, i) => {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(arr.length, i + Math.floor(windowSize / 2) + 1);
        const slice = arr.slice(start, end);
        return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
      });
    };

    return {
      labels,
      datasets: [
        {
          label: 'Fear',
          data: smooth(sorted.map(p => p.fear)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          tension: 0.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
        },
        {
          label: 'Confident',
          data: smooth(sorted.map(p => p.happy)),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          tension: 0.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
        },
        {
          label: 'Neutral',
          data: smooth(sorted.map(p => p.neutral)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
        }
      ]
    };
  }, [emotionData]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-accent)' }} />
      <p className="font-medium animate-pulse" style={{ color: 'var(--color-text)', opacity: 0.6 }}>Generating Professional Performance Report...</p>
    </div>
  );

  if (!evaluation || !results) return null;

  return (
    <div className="min-h-screen selection:bg-accent/30" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* EXECUTIVE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border" 
              style={{ backgroundColor: 'rgba(245, 143, 124, 0.1)', borderColor: 'rgba(245, 143, 124, 0.2)', color: 'var(--color-accent)' }}>
              Performance Review
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase" style={{ color: 'var(--color-text)' }}>{results.domain}</h1>
            <p className="max-w-xl text-lg leading-relaxed opacity-40">
              {emotionData?.session.interpretation || "Evaluation complete. Review your technical and behavioral performance metrics below."}
            </p>
          </div>
        </div>

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Overall Mastery', 
              value: `${evaluation.overall.score}%`, 
              icon: Shield, 
              desc: 'Combined assessment score',
              color: 'var(--color-accent)' 
            },
            { 
              label: 'Focus Index', 
              value: `${emotionData?.session.focusRate || 0}%`, 
              icon: Activity, 
              desc: 'Eye-contact & engagement rate',
              color: 'var(--color-secondary)' 
            },
            { 
              label: 'Behavioral Stability', 
              value: emotionData?.session.emotionalStability || 'N/A', 
              icon: Activity, 
              desc: 'Emotional composure index',
              color: 'var(--color-accent)' 
            },
            { 
              label: 'Communication', 
              value: evaluation.overall.score > 80 ? 'Exceptional' : 'Functional', 
              icon: MessageSquare, 
              desc: 'Linguistic & engagement flow',
              color: 'var(--color-secondary)' 
            },
          ].map((m, idx) => (
            <div key={idx} className="p-6 rounded-2xl border transition-colors group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="p-2 rounded-lg bg-black/20 group-hover:scale-110 transition-transform" style={{ color: m.color }}>
                  <m.icon size={20} />
                </div>
                <div className="text-2xl font-black italic uppercase" style={{ color: m.color }}>{m.value}</div>
              </div>
              <div className="text-sm font-bold text-white/90 mb-1">{m.label}</div>
              <div className="text-xs opacity-40">{m.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* BEHAVIORAL ANALYSIS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-3xl border overflow-hidden relative" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black italic uppercase flex items-center gap-3">
                  <Activity style={{ color: 'var(--color-accent)' }} /> Behavioral Timeline
                </h3>
              </div>
              
              <div className="h-[300px] w-full">
                {chartData ? (
                  <Line 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          titleFont: { size: 12, weight: 'bold' },
                          bodyFont: { size: 12 },
                          padding: 10,
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          displayColors: true,
                          callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`
                          }
                        }
                      },
                      scales: {
                        x: { display: false },
                        y: { 
                          min: 0, max: 100, 
                          grid: { color: 'rgba(255,255,255,0.03)' },
                          ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10 } }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 italic">Timeline data visualizing...</div>
                )}
              </div>

              {/* Phase Trends */}
              {emotionData && (
                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-center">
                    <div className="text-xs font-bold opacity-30 uppercase mb-2">Phase 1 (Start)</div>
                    <div className="text-lg font-black italic">{Math.round(emotionData.session.trends.fear.early)}% Fear</div>
                  </div>
                  <div className="text-center border-x" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="text-xs font-bold opacity-30 uppercase mb-2">Phase 2 (Peak)</div>
                    <div className="text-lg font-black italic">{Math.round(emotionData.session.trends.fear.mid)}% Fear</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold opacity-30 uppercase mb-2">Phase 3 (Final)</div>
                    <div className="text-lg font-black italic">{Math.round(emotionData.session.trends.fear.late)}% Fear</div>
                  </div>
                </div>
              )}
            </div>

            {/* COACHING SUGGESTIONS */}
            <div className="p-8 rounded-3xl border relative overflow-hidden" 
              style={{ backgroundColor: 'rgba(245, 143, 124, 0.03)', borderColor: 'rgba(245, 143, 124, 0.1)' }}>
               <div className="absolute top-0 right-0 p-8 opacity-5" style={{ color: 'var(--color-accent)' }}>
                <Sparkles size={120} />
               </div>
               <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                <Sparkles style={{ color: 'var(--color-accent)' }} /> AI Career Insights
               </h3>
               <div className="space-y-4 relative z-10">
                {(emotionData?.session.suggestions || []).map((s, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border items-start bg-black/10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold"
                      style={{ backgroundColor: 'rgba(245, 143, 124, 0.15)', color: 'var(--color-accent)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">{s}</p>
                  </div>
                ))}
               </div>
            </div>
          </div>

          {/* SIDEBAR: STRENGTHS & IMPROVEMENTS */}
          <div className="space-y-6">
             <div className="p-8 rounded-3xl border h-fit" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.2em] mb-6">Technical Synthesis</h3>
                <div className="space-y-8">
                  <div>
                    <h4 className="font-bold text-xs uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                       <CheckCircle size={14} /> Key Proficiencies
                    </h4>
                    <ul className="space-y-3">
                      {evaluation.overall.strengths.map((s, i) => (
                        <li key={i} className="text-sm opacity-60 flex items-start gap-3">
                          <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h4 className="font-bold text-xs uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                       <AlertCircle size={14} /> Optimization Opportunities
                    </h4>
                    <ul className="space-y-3">
                      {evaluation.overall.improvements.map((s, i) => (
                        <li key={i} className="text-sm opacity-60 flex items-start gap-3">
                          <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--color-secondary)' }} /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* PER QUESTION DEEP DIVE */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <TrendingUp size={24} /> Technical Deep Dive
          </h2>
          <div className="space-y-4">
            {results.questions.map((q: string, idx: number) => {
              const qEval = evaluation.perQuestion[idx];
              const answer = results.responses[idx];
              const isLocked = openQuestion !== idx;

              return (
                <div key={idx} className={`rounded-2xl transition-all duration-300 border overflow-hidden`} 
                  style={{ 
                    backgroundColor: isLocked ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)',
                    borderColor: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'
                  }}>
                  <button 
                    onClick={() => setOpenQuestion(isLocked ? idx : null)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic text-xl border`}
                        style={{ 
                          borderColor: qEval?.score > 50 ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                          color: qEval?.score > 50 ? 'var(--color-accent)' : 'var(--color-text)',
                          backgroundColor: qEval?.score > 50 ? 'rgba(245,143,124,0.1)' : 'rgba(255,255,255,0.05)',
                          opacity: qEval?.score > 0 ? 1 : 0.4
                        }}>
                        {qEval?.score || '?'}%
                      </div>
                      <div>
                        <div className="text-xs font-bold opacity-30 uppercase mb-1">Question {idx + 1}</div>
                        <div className="font-bold opacity-90 line-clamp-1">{q}</div>
                      </div>
                    </div>
                    {isLocked ? <ChevronDown className="opacity-20" /> : <ChevronUp className="opacity-60" />}
                  </button>

                  {!isLocked && (
                    <div className="px-6 pb-8 pt-0 space-y-6 animate-in slide-in-from-top-1 duration-300">
                      
                      <div className="p-4 rounded-xl border space-y-2 bg-black/20" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="text-[10px] font-black opacity-20 uppercase tracking-widest leading-none">Your Answer</div>
                        <p className="text-sm italic opacity-80 leading-relaxed">
                          {answer || "(The candidate did not provide a verbal response to this question.)"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                           <div className="flex items-start gap-4">
                              <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                              <div className="flex-1">
                                <div className="text-xs font-black uppercase mb-1 opacity-50" style={{ color: 'var(--color-accent)' }}>Technical Strength</div>
                                <p className="text-sm opacity-70">{qEval?.strength || "N/A"}</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--color-secondary)' }} />
                              <div className="flex-1">
                                <div className="text-xs font-black uppercase mb-1 opacity-50" style={{ color: 'var(--color-secondary)' }}>Area of Improvement</div>
                                <p className="text-sm opacity-70">{qEval?.weakness || "N/A"}</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                           <div>
                              <div className="text-xs font-black opacity-30 uppercase mb-1 tracking-widest">Grammar & Communication</div>
                              <p className="text-sm opacity-90 italic">&ldquo;{qEval?.grammar || "Evaluation pending..."}&rdquo;</p>
                           </div>
                           <div>
                              <div className="text-xs font-black opacity-30 uppercase mb-1 tracking-widest">Actionable Suggestion</div>
                              <p className="text-sm opacity-60">{qEval?.suggestion || "Practice technical articulation."}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FINAL ACTIONS */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-12 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
           <button 
             onClick={() => window.print()}
             className="w-full md:w-auto px-10 py-4 rounded-xl font-black italic uppercase text-sm flex items-center justify-center gap-2 transition-colors hover:brightness-110"
             style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-background)' }}
           >
             <Download size={18} /> Export PDF Report
           </button>
           <button 
             onClick={() => router.push('/prepare')}
             className="w-full md:w-auto px-10 py-4 rounded-xl border transition-colors font-black italic uppercase text-sm hover:bg-white/5"
             style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
           >
             New Session
           </button>
           <button 
             onClick={() => router.push('/dashboard')}
             className="w-full md:w-auto px-10 py-4 rounded-xl border transition-colors font-black italic uppercase text-sm hover:bg-white/5"
             style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
           >
             Return to Dashboard
           </button>
        </div>

      </main>
    </div>
  );
}
