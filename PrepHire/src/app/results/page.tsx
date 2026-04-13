'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, TrendingUp, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface InterviewResults {
  domain: string;
  difficulty: string;
  questions: string[];
  responses: string[];
  date: string;
}

interface QuestionFeedback {
  question: string;
  response: string;
  score: number;
  sentiment: 'positive' | 'neutral' | 'needs_improvement';
  keywords: string[];
  fillerWords: number;
  suggestions: string[];
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'so', 'right'];

function analyzeResponse(question: string, response: string, domain: string): QuestionFeedback {
  if (!response.trim()) {
    return { question, response: '(skipped)', score: 0, sentiment: 'needs_improvement', keywords: [], fillerWords: 0, suggestions: ['This question was skipped. Try to answer every question in your next session.'] };
  }
  const words = response.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const fillerCount = FILLER_WORDS.reduce((count, filler) => count + (response.match(new RegExp(`\\b${filler}\\b`, 'gi'))?.length || 0), 0);
  const domainKeywords: Record<string, string[]> = {
    'Frontend Development': ['component', 'react', 'css', 'javascript', 'dom', 'responsive', 'performance', 'accessibility', 'state', 'hook'],
    'Backend Development': ['api', 'database', 'server', 'authentication', 'cache', 'scalable', 'endpoint', 'query', 'security', 'microservice'],
    'Full Stack Development': ['frontend', 'backend', 'database', 'api', 'deploy', 'architecture', 'state', 'server', 'client', 'integration'],
    'Data Science': ['model', 'data', 'algorithm', 'training', 'accuracy', 'feature', 'classification', 'regression', 'overfitting', 'validation'],
    'DevOps/Cloud': ['pipeline', 'deploy', 'container', 'kubernetes', 'monitoring', 'ci/cd', 'infrastructure', 'automation', 'scaling', 'cloud'],
    'Product Management': ['user', 'metric', 'roadmap', 'stakeholder', 'priority', 'feedback', 'sprint', 'kpi', 'launch', 'strategy'],
    'UI/UX Design': ['user', 'research', 'prototype', 'wireframe', 'usability', 'accessibility', 'iteration', 'feedback', 'flow', 'design'],
    'QA/Testing': ['test', 'automation', 'coverage', 'regression', 'bug', 'integration', 'unit', 'end-to-end', 'ci', 'quality'],
  };
  const detectedKeywords = (domainKeywords[domain] || []).filter((kw) => response.toLowerCase().includes(kw));
  let score = 50;
  score += Math.min(detectedKeywords.length * 5, 25);
  score += wordCount >= 50 ? 10 : wordCount >= 20 ? 5 : 0;
  score -= Math.min(fillerCount * 3, 15);
  score += response.toLowerCase().includes('example') || response.toLowerCase().includes('for instance') ? 5 : 0;
  score += response.toLowerCase().includes('result') || response.toLowerCase().includes('outcome') ? 5 : 0;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const sentiment: QuestionFeedback['sentiment'] = score >= 75 ? 'positive' : score >= 50 ? 'neutral' : 'needs_improvement';
  const suggestions: string[] = [];
  if (wordCount < 30) suggestions.push('Your answer was quite short. Aim for at least 3-4 sentences with specific details.');
  if (fillerCount > 3) suggestions.push(`You used ${fillerCount} filler words. Practice pausing instead of saying "um" or "uh".`);
  if (detectedKeywords.length < 2) suggestions.push('Try to incorporate more domain-specific terminology in your answers.');
  if (!response.toLowerCase().includes('example') && !response.toLowerCase().includes('for instance')) suggestions.push('Back up your points with a concrete example from your experience.');
  if (score >= 75) suggestions.push('Strong answer! Keep using specific examples and measurable outcomes.');
  return { question, response, score, sentiment, keywords: detectedKeywords, fillerWords: fillerCount, suggestions };
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

export default function ResultsPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<QuestionFeedback[]>([]);
  const [domain, setDomain] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('interviewResults');
    if (!raw) { router.push('/prepare'); return; }
    const results: InterviewResults = JSON.parse(raw);
    setDomain(results.domain);
    setDifficulty(results.difficulty);
    const analyzed = results.questions.map((q, i) => analyzeResponse(q, results.responses[i] || '', results.domain));
    setFeedback(analyzed);
    const overall = Math.round(analyzed.reduce((s, f) => s + f.score, 0) / analyzed.length);
    saveToHistory(results, overall);
  }, [router]);

  if (feedback.length === 0) return null;

  const overallScore = Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length);
  const avgFillerWords = Math.round(feedback.reduce((s, f) => s + f.fillerWords, 0) / feedback.length);
  const answeredCount = feedback.filter((f) => f.response !== '(skipped)').length;

  const sentimentColor = (s: QuestionFeedback['sentiment']) =>
    s === 'positive' ? 'var(--color-accent)' : s === 'neutral' ? 'var(--color-secondary)' : 'var(--color-text)';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Interview Session Results</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-secondary)' }}>{domain}</span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-accent)' }}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Overall Score', value: overallScore, sub: null, icon: overallScore >= 75 ? CheckCircle : AlertCircle },
            { label: 'Answered', value: `${answeredCount}/${feedback.length}`, sub: 'Questions', icon: null },
            { label: 'Avg Filler Words', value: avgFillerWords, sub: 'Per response', icon: null },
            { label: 'Strong Answers', value: feedback.filter((f) => f.sentiment === 'positive').length, sub: 'Scored 75+', icon: null },
          ].map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="text-5xl font-bold mb-2" style={{ color: 'var(--color-accent)' }}>{value}</div>
              <p className="font-semibold" style={{ color: 'var(--color-secondary)' }}>{label}</p>
              {sub && <p className="text-sm mt-2" style={{ color: 'var(--color-text)' }}>{sub}</p>}
              {Icon && <div className="mt-3 flex justify-center"><Icon className="w-7 h-7" style={{ color: 'var(--color-accent)' }} /></div>}
            </div>
          ))}
        </div>

        {/* Question Breakdown */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Question Breakdown</h2>
          <div className="space-y-6">
            {feedback.map((item, idx) => (
              <div key={idx} className="rounded-xl p-8 border-l-4" style={{ backgroundColor: 'var(--color-card)', borderColor: sentimentColor(item.sentiment) }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-secondary)' }}>Question {idx + 1}</h3>
                    <p style={{ color: 'var(--color-text)' }}>{item.question}</p>
                  </div>
                  <span className="text-2xl font-bold ml-4" style={{ color: sentimentColor(item.sentiment) }}>{item.score}%</span>
                </div>

                {item.response !== '(skipped)' && (
                  <div className="rounded-lg p-4 mb-4 text-sm italic" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                    &ldquo;{item.response.length > 200 ? item.response.slice(0, 200) + '...' : item.response}&rdquo;
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text)' }}>Filler Words</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{item.fillerWords}</div>
                  </div>
                  <div className="p-3 rounded-lg col-span-2" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-text)' }}>Keywords Detected</div>
                    <div className="flex gap-2 flex-wrap">
                      {item.keywords.length > 0 ? item.keywords.map((kw) => (
                        <span key={kw} className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-background)' }}>{kw}</span>
                      )) : <span className="text-xs" style={{ color: 'var(--color-text)' }}>No domain keywords detected</span>}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-secondary)' }}>
                  <h4 className="font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Feedback</h4>
                  <ul className="space-y-1">
                    {item.suggestions.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text)' }}>
                        <span style={{ color: 'var(--color-accent)' }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Recommendations */}
        <div className="rounded-xl p-8 mb-12" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-secondary)' }}>
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: 'var(--color-accent)' }} />
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Overall Recommendations</h3>
              <ul className="space-y-3">
                {overallScore >= 75 && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                    <span style={{ color: 'var(--color-text)' }}>Strong performance overall — keep using specific examples and measurable outcomes.</span>
                  </li>
                )}
                {avgFillerWords > 3 && (
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ color: 'var(--color-text)' }}>Work on reducing filler words — practice pausing silently instead of saying &ldquo;um&rdquo; or &ldquo;uh&rdquo;.</span>
                  </li>
                )}
                {answeredCount < feedback.length && (
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ color: 'var(--color-text)' }}>You skipped {feedback.length - answeredCount} question(s). Try to answer every question in your next session.</span>
                  </li>
                )}
                {feedback.some((f) => f.keywords.length < 2) && (
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ color: 'var(--color-text)' }}>Use more {domain}-specific terminology to demonstrate domain expertise.</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-text)' }}>Keep practicing regularly — consistency is the key to interview confidence.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => {
              const text = feedback.map((f, i) => `Q${i+1}: ${f.question}\nScore: ${f.score}%\nFeedback: ${f.suggestions.join(' ')}`).join('\n\n');
              const blob = new Blob([`PrepHire Interview Results\nDomain: ${domain}\n\n${text}`], { type: 'text/plain' });
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
