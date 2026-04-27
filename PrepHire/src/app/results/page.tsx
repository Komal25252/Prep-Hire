'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, TrendingUp, Download, Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Navigation from '@/components/Navigation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
);

interface InterviewResults {
  domain: string;
  difficulty: string;
  questions: string[];
  responses: string[];
  sessionId?: string;
  date: string;
}

interface EmotionAnalysis {
  perQuestion: {
    questionIndex: number;
    avgFear: number;
    maxFear: number;
    fearIncrease: number;
    avgVariation: number;
    confidenceScore: number;
  }[];
  session: {
    emotionalStability: string;
    confidenceLevel: string;
    stressPattern: string;
    dominantEmotion: string;
    interpretation: string;
    suggestions?: string[];
  };
  timeline?: {
    timestamp: string;
    fear: number;
    happy: number;
    neutral: number;
    surprise: number;
    anger: number;
    disgust: number;
    sadness: number;
  }[];
}

interface QuestionEval {
  score: number;
  strength: string;
  weakness: string;
  suggestion: string;
}

interface OverallEval {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendation: 'Strong Yes' | 'Yes' | 'Maybe' | 'No';
  summary: string;
}

interface Evaluation {
  perQuestion: QuestionEval[];
  overall: OverallEval;
}

function saveToHistory(results: InterviewResults, overallScore: number) {
  const history = JSON.parse(sessionStorage.getItem('sessionHistory') || '[]');
  history.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: results.date,
    domain: results.domain,
    difficulty: results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1),
    score: overallScore,
    duration: `${Math.round(results.responses.filter(Boolean).length * 3)} mins`,
    status: 'completed',
  });
  sessionStorage.setItem('sessionHistory', JSON.stringify(history.slice(0, 20)));
}

const recommendationColor = (r: string) => {
  if (r === 'Strong Yes') return 'var(--color-accent)';
  if (r === 'Yes') return 'var(--color-accent)';
  if (r === 'Maybe') return 'var(--color-secondary)';
  return 'var(--color-text)';
};

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useMemo must be called before any early returns (Rules of Hooks)
  const chartData = useMemo(() => {
    if (!emotionData?.timeline || emotionData.timeline.length === 0) return null;

    const sorted = [...emotionData.timeline].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const startTime = new Date(sorted[0].timestamp).getTime();

    const labels = sorted.map((point) => {
      const elapsedSeconds = Math.floor(
        (new Date(point.timestamp).getTime() - startTime) / 1000
      );
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Fear',
          data: sorted.map(p => Math.round(p.fear)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
        },
        {
          label: 'Happy',
          data: sorted.map(p => Math.round(p.happy)),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
        },
        {
          label: 'Neutral',
          data: sorted.map(p => Math.round(p.neutral)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
        },
        {
          label: 'Sadness',
          data: sorted.map(p => Math.round(p.sadness)),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
        },
      ],
    };
  }, [emotionData]);

  const emotionalInsights = useMemo(() => {
    if (!emotionData?.timeline || emotionData.timeline.length === 0) return [];
    
    const insights = [];
    const timeline = emotionData.timeline;
    
    // Calculate averages
    const avgAnger = timeline.reduce((acc, p) => acc + p.anger, 0) / timeline.length;
    const avgSurprise = timeline.reduce((acc, p) => acc + p.surprise, 0) / timeline.length;
    const surpriseSpikes = timeline.filter(p => p.surprise > 45).length;
    
    if (avgAnger > 25) {
      insights.push("You appeared tense or slightly frustrated at points. Try to relax your facial muscles when thinking.");
    }
    
    if (surpriseSpikes > 3) {
      insights.push("You seemed frequently caught off guard by questions. Consider practicing more common behavioral prompts.");
    }
    
    const lateSessionEnergy = timeline.slice(-5).reduce((acc, p) => acc + p.sadness + p.neutral, 0) / 5;
    if (lateSessionEnergy > 80) {
      insights.push("Your energy levels seemed to dip towards the end. Maintain high engagement until the final question.");
    }

    if (timeline.filter(p => p.happy > 40).length > timeline.length * 0.3) {
      insights.push("Great use of positive facial expressions! This builds rapport and shows confidence.");
    }

    return insights;
  }, [emotionData]);

  const derivedMetrics = useMemo(() => {
    if (!emotionData?.timeline || emotionData.timeline.length === 0) return null;
    const t = emotionData.timeline;
    const avgCount = t.length;
    
    const avgHappy = t.reduce((acc, p) => acc + p.happy, 0) / avgCount;
    const avgNeutral = t.reduce((acc, p) => acc + p.neutral, 0) / avgCount;
    const avgFear = t.reduce((acc, p) => acc + p.fear, 0) / avgCount;
    const avgSad = t.reduce((acc, p) => acc + p.sadness, 0) / avgCount;

    return {
      confidenceIndex: Math.min(100, Math.round(avgHappy + (avgNeutral * 0.6))),
      stressIndex: Math.min(100, Math.round(avgFear + (avgSad * 0.5))),
    };
  }, [emotionData]);

  useEffect(() => {
    const raw = sessionStorage.getItem('interviewResults');
    if (!raw) { router.push('/prepare'); return; }
    const data: InterviewResults = JSON.parse(raw);
    setResults(data);

    const pairs = data.questions.map((q, i) => ({
      question: q,
      answer: data.responses[i] || '',
      isMock: (data as any).isMockQuestion?.[i] ?? false,
    }));

    fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: data.domain,
        difficulty: data.difficulty,
        interviewType: 'audio',
        pairs,
        resumeId: (data as any).resumeId
      }),
    })
      .then((r) => r.json())
      .then((ev) => {
        if (ev.error) throw new Error(ev.error);
        setEvaluation(ev);
        saveToHistory(data, ev.overall?.score ?? 0);
      })
      .catch(() => setError('Could not load AI evaluation. Please try again.'))
      .finally(() => setLoading(false));

    if (data.sessionId) {
      fetch(`/api/emotion/analyze?sessionId=${data.sessionId}`)
        .then((r) => r.json())
        .then((ed) => {
          if (!ed.error && ed.session) {
            setEmotionData(ed);
          }
        })
        .catch(() => {});
    }
  }, [router]);

  if (!results) return null;

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-accent)' }} />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Analyzing your interview...</h2>
          <p style={{ color: 'var(--color-text)' }}>Our AI interviewer is reviewing your answers</p>
        </div>
      </div>
    </div>
  );

  if (error || !evaluation) return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p style={{ color: 'var(--color-accent)' }}>{error || 'Something went wrong.'}</p>
        <button onClick={() => router.push('/prepare')} className="px-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
          Try Again
        </button>
      </div>
    </div>
  );

  const { perQuestion, overall } = evaluation;
  const answeredCount = results.responses.filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Interview Results</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-secondary)' }}>{results.domain}</span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-accent)' }}>
              {results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)}
            </span>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Overall Score', value: `${overall.score}%`, icon: overall.score >= 75 ? CheckCircle : AlertCircle },
            { label: 'Answered', value: `${answeredCount}/${results.questions.length}`, sub: 'Questions' },
            { label: 'Strong Answers', value: perQuestion.filter(q => q.score >= 75).length, sub: 'Scored 75+' },
            { label: 'Recommendation', value: overall.recommendation, color: recommendationColor(overall.recommendation) },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="text-3xl font-bold mb-2" style={{ color: color ?? 'var(--color-accent)' }}>{value}</div>
              <p className="font-semibold" style={{ color: 'var(--color-secondary)' }}>{label}</p>
              {sub && <p className="text-sm mt-1" style={{ color: 'var(--color-text)' }}>{sub}</p>}
              {Icon && <div className="mt-2 flex justify-center"><Icon className="w-6 h-6" style={{ color: color ?? 'var(--color-accent)' }} /></div>}
            </div>
          ))}
        </div>

        {/* Interviewer Summary — moved to bottom, shown after per-question breakdown */}

        {/* Per Question Breakdown */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Question Breakdown</h2>
          <div className="space-y-6">
            {results.questions.map((question, idx) => {
              const qEval = perQuestion[idx];
              const answer = results.responses[idx];
              const scoreColor = qEval?.score >= 75 ? 'var(--color-accent)' : qEval?.score >= 50 ? 'var(--color-secondary)' : 'var(--color-text)';

              return (
                <div key={idx} className="rounded-xl p-8 border-l-4" style={{ backgroundColor: 'var(--color-card)', borderColor: scoreColor }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-secondary)' }}>Question {idx + 1}</h3>
                      <p style={{ color: 'var(--color-text)' }}>{question}</p>
                    </div>
                    {qEval && (
                      <span className="text-2xl font-bold ml-4" style={{ color: scoreColor }}>{qEval.score}%</span>
                    )}
                  </div>

                  {answer ? (
                    <div className="rounded-lg p-4 mb-4 text-sm italic" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                      &ldquo;{answer.length > 250 ? answer.slice(0, 250) + '...' : answer}&rdquo;
                    </div>
                  ) : (
                    <div className="rounded-lg p-3 mb-4 text-sm" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', opacity: 0.6 }}>
                      (skipped)
                    </div>
                  )}

                  {qEval && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderLeft: '3px solid var(--color-accent)' }}>
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-accent)' }}>WHAT WORKED</div>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{qEval.strength}</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderLeft: '3px solid var(--color-secondary)' }}>
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-secondary)' }}>WHAT WAS MISSING</div>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{qEval.weakness}</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderLeft: '3px solid var(--color-text)' }}>
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-text)' }}>SUGGESTION</div>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{qEval.suggestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Emotional Analysis Section */}
        {emotionData && emotionData.perQuestion.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Emotional Intelligence Report</h2>
            <div className="rounded-xl p-8 mb-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="text-xs font-bold mb-1 opacity-60">CONFIDENCE INDEX</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{derivedMetrics?.confidenceIndex}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold mb-1 opacity-60">STRESS INDEX</div>
                  <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{derivedMetrics?.stressIndex}%</div>
                </div>
                <div>
                  <div className="text-xs font-bold mb-1 opacity-60">DOMINANT STATE</div>
                  <div className="text-2xl font-bold capitalize" style={{ color: 'var(--color-secondary)' }}>{emotionData.session.dominantEmotion}</div>
                </div>
                <div>
                  <div className="text-xs font-bold mb-1 opacity-60">STABILITY</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{emotionData.session.emotionalStability}</div>
                </div>
              </div>

              {/* Smart Insights & Suggestions */}
              {(emotionalInsights.length > 0 || (emotionData.session.suggestions && emotionData.session.suggestions.length > 0)) && (
                <div className="mb-8 p-6 rounded-xl border-2 border-dashed" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-secondary)' }}>
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>Behavioral Feedback & Coaching</h3>
                  <ul className="space-y-4">
                    {/* Library-based Suggestions */}
                    {emotionData.session.suggestions?.map((suggestion, idx) => (
                      <li key={`sug-${idx}`} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        <span className="mt-1" title="Coaching Tip">🎯</span> 
                        <div>
                          <span className="font-bold block mb-1">Coaching Tip:</span>
                          {suggestion}
                        </div>
                      </li>
                    ))}
                    
                    {/* Custom Logic-based Insights */}
                    {emotionalInsights.map((insight, idx) => (
                      <li key={`ins-${idx}`} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        <span className="mt-1" title="AI Insight">💡</span> 
                        <div>
                          <span className="font-bold block mb-1">Behavioral Insight:</span>
                          {insight}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 rounded-lg italic" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderLeft: '4px solid var(--color-accent)' }}>
                &ldquo;{emotionData.session.interpretation}&rdquo;
              </div>

              {chartData && (
                <div className="w-full mt-8" style={{ height: '300px' }}>
                  <h3 className="text-sm font-bold mb-4 opacity-70" style={{ color: 'var(--color-text)' }}>EMOTIONAL TIMELINE</h3>
                  <Line 
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                          }
                        },
                        tooltip: {
                          mode: 'index' as const,
                          intersect: false,
                          backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          padding: 10,
                          cornerRadius: 8,
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } },
                        },
                        y: {
                          min: 0,
                          max: 100,
                          grid: { color: 'rgba(255, 255, 255, 0.05)' },
                          ticks: { 
                            color: 'rgba(255, 255, 255, 0.4)', 
                            font: { size: 10 },
                            callback: (value) => `${value}%`
                          },
                        },
                      },
                      interaction: {
                        mode: 'nearest' as const,
                        axis: 'x' as const,
                        intersect: false,
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overall Assessment — shown after all per-question evaluations */}
        <div className="rounded-xl p-8 mb-12" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-secondary)' }}>
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: 'var(--color-accent)' }} />
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-secondary)' }}>Overall Assessment</h3>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--color-text)' }}>{overall.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                    <CheckCircle className="w-4 h-4" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {overall.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-accent)' }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                    <AlertCircle className="w-4 h-4" /> Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {overall.improvements.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-secondary)' }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => {
              const text = results.questions.map((q, i) => {
                const ev = perQuestion[i];
                return `Q${i+1}: ${q}\nAnswer: ${results.responses[i] || '(skipped)'}\nScore: ${ev?.score ?? 0}%\nStrength: ${ev?.strength ?? ''}\nWeakness: ${ev?.weakness ?? ''}\nSuggestion: ${ev?.suggestion ?? ''}`;
              }).join('\n\n');
              const blob = new Blob([`PrepHire Interview Results\nDomain: ${results.domain}\nOverall: ${overall.score}%\nRecommendation: ${overall.recommendation}\n\nSummary: ${overall.summary}\n\n${text}`], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'interview-results.txt'; a.click();
            }}
            className="border-2 px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2 hover:opacity-80"
            style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)' }}
          >
            <Download className="w-5 h-5" /> Download Report
          </button>
          <Link href="/prepare" className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
            Practice Again
          </Link>
          <Link href="/dashboard" className="border-2 px-8 py-3 rounded-lg font-semibold hover:opacity-80 transition" style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}>
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
