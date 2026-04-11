'use client';

import { useState } from 'react';
import { Upload, Briefcase, ChevronRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useSession } from 'next-auth/react';

const JOB_DOMAINS = [
  { id: 'frontend', name: 'Frontend Development' },
  { id: 'backend', name: 'Backend Development' },
  { id: 'fullstack', name: 'Full Stack Development' },
  { id: 'data_science', name: 'Data Science' },
  { id: 'devops', name: 'DevOps/Cloud' },
  { id: 'product', name: 'Product Management' },
  { id: 'design', name: 'UI/UX Design' },
  { id: 'qa', name: 'QA/Testing' },
];

export default function PreparePage() {
  const { data: session } = useSession();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [step, setStep] = useState<'selection' | 'interviewType' | 'difficulty'>('selection');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | null>(null);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [interviewType, setInterviewType] = useState<'dsa' | 'audio' | null>(null);
  const [predicting, setPredicting] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const handleStartInterview = async () => {
    if (!(selectedDomain || resumeFile) || !difficulty) return;
    let domain = selectedDomain;
    if (resumeFile) {
      setPredicting(true);
      try {
        const form = new FormData();
        form.append('file', resumeFile);
        const res = await fetch('/api/predict', { method: 'POST', body: form });
        const data = await res.json();
        if (data.domain) domain = data.domain;
      } catch (err) {
        console.error('Prediction error:', err);
      } finally {
        setPredicting(false);
      }
    }
    sessionStorage.setItem('prepareData', JSON.stringify({ domain, hasResume: !!resumeFile, difficulty, questionCount, interviewType }));
    if (!session) window.dispatchEvent(new Event('openAuthModal'));
    else window.location.href = '/interview';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2C2B30' }}>
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {step === 'selection' && (
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#D6D6D6' }}>Prepare Your Interview</h1>
            <p className="text-xl mb-12" style={{ color: '#D6D6D6' }}>Choose how you want to get started</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Resume Upload */}
              <div className="rounded-xl p-8 border-2 border-dashed transition cursor-pointer" style={{ backgroundColor: '#4F4F51', borderColor: '#F2C4CE' }}>
                <label className="block cursor-pointer">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                  <div className="flex flex-col items-center">
                    <Upload className="w-16 h-16 mb-4" style={{ color: '#F58F7C' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#F2C4CE' }}>Upload Your Resume</h3>
                    <p className="text-center mb-4" style={{ color: '#D6D6D6' }}>
                      We&apos;ll analyze your skills and create personalized questions based on your experience
                    </p>
                    {resumeFile ? (
                      <div className="rounded p-3 w-full text-center border" style={{ backgroundColor: '#2C2B30', borderColor: '#F58F7C' }}>
                        <p className="font-semibold" style={{ color: '#F58F7C' }}>✓ {resumeFile.name}</p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: '#D6D6D6' }}>PDF, DOC, or DOCX (Max 5MB)</p>
                    )}
                  </div>
                </label>
              </div>

              {/* Job Domain Selection */}
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#F2C4CE' }}>
                  <Briefcase className="w-6 h-6" style={{ color: '#F58F7C' }} />
                  Or Select a Job Domain
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {JOB_DOMAINS.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain.id)}
                      className="p-4 rounded-lg border-2 transition font-semibold text-sm"
                      style={{
                        backgroundColor: selectedDomain === domain.id ? '#F2C4CE' : '#4F4F51',
                        borderColor: selectedDomain === domain.id ? '#F58F7C' : '#D6D6D6',
                        color: selectedDomain === domain.id ? '#2C2B30' : '#D6D6D6',
                      }}
                    >
                      {domain.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={() => setStep('interviewType')}
                disabled={!selectedDomain && !resumeFile}
                className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'interviewType' && (
          <div>
            <button onClick={() => setStep('selection')} className="mb-8 flex items-center gap-2 hover:opacity-80 transition" style={{ color: '#F2C4CE' }}>
              ← Back
            </button>

            <h1 className="text-4xl font-bold mb-4" style={{ color: '#D6D6D6' }}>Select Interview Type</h1>
            <p className="text-xl mb-12" style={{ color: '#D6D6D6' }}>Choose the format that matches your preparation goals</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* DSA Interview */}
              <div
                onClick={() => setInterviewType('dsa')}
                className="p-8 rounded-xl border-2 cursor-pointer transition"
                style={{
                  backgroundColor: interviewType === 'dsa' ? '#4F4F51' : '#4F4F51',
                  borderColor: interviewType === 'dsa' ? '#F58F7C' : '#D6D6D6',
                  opacity: interviewType && interviewType !== 'dsa' ? 0.6 : 1,
                }}
              >
                <div className="text-5xl mb-4">💻</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#F58F7C' }}>DSA Interview</h3>
                <ul className="space-y-2" style={{ color: '#D6D6D6' }}>
                  <li>✓ Data structures & algorithms</li>
                  <li>✓ Coding challenges</li>
                  <li>✓ Problem-solving questions</li>
                  <li>✓ Technical depth focus</li>
                </ul>
              </div>

              {/* Audio-Based Interview */}
              <div
                onClick={() => setInterviewType('audio')}
                className="p-8 rounded-xl border-2 cursor-pointer transition"
                style={{
                  backgroundColor: interviewType === 'audio' ? '#4F4F51' : '#4F4F51',
                  borderColor: interviewType === 'audio' ? '#F2C4CE' : '#D6D6D6',
                  opacity: interviewType && interviewType !== 'audio' ? 0.6 : 1,
                }}
              >
                <div className="text-5xl mb-4">🎤</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#F2C4CE' }}>Audio-Based Interview</h3>
                <ul className="space-y-2" style={{ color: '#D6D6D6' }}>
                  <li>✓ Behavioral questions</li>
                  <li>✓ Voice-based responses</li>
                  <li>✓ Communication skills</li>
                  <li>✓ Real interview simulation</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setStep('selection')} className="border-2 px-8 py-3 rounded-lg font-semibold transition" style={{ borderColor: '#D6D6D6', color: '#D6D6D6' }}>
                Back
              </button>
              <button
                onClick={() => setStep('difficulty')}
                disabled={!interviewType}
                className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'difficulty' && (
          <div>
            <button onClick={() => setStep('interviewType')} className="mb-8 flex items-center gap-2 hover:opacity-80 transition" style={{ color: '#F2C4CE' }}>
              ← Back
            </button>

            <h1 className="text-4xl font-bold mb-4" style={{ color: '#D6D6D6' }}>Select Difficulty Level</h1>
            <p className="text-xl mb-12" style={{ color: '#D6D6D6' }}>Questions will be adapted to your chosen level</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { key: 'easy', label: 'Easy', points: ['Foundational concepts', 'Common interview questions', 'Lower pace'], accent: '#F58F7C' },
                { key: 'moderate', label: 'Moderate', points: ['Practical applications', 'Problem-solving focused', 'Balanced difficulty'], accent: '#F2C4CE' },
                { key: 'hard', label: 'Hard', points: ['Advanced topics', 'System design questions', 'High challenge'], accent: '#D6D6D6' },
              ].map(({ key, label, points, accent }) => (
                <div
                  key={key}
                  onClick={() => setDifficulty(key as any)}
                  className="p-8 rounded-xl border-2 cursor-pointer transition"
                  style={{
                    backgroundColor: difficulty === key ? '#4F4F51' : '#4F4F51',
                    borderColor: difficulty === key ? accent : '#D6D6D6',
                    opacity: difficulty && difficulty !== key ? 0.6 : 1,
                  }}
                >
                  <h3 className="text-2xl font-bold mb-4" style={{ color: accent }}>{label}</h3>
                  <ul className="space-y-2" style={{ color: '#D6D6D6' }}>
                    {points.map((p) => <li key={p}>✓ {p}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Question Count */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#D6D6D6' }}>Number of Questions</h2>
              <div className="flex gap-4">
                {([5, 10, 15] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className="flex-1 py-4 rounded-xl border-2 font-bold text-lg transition"
                    style={{
                      backgroundColor: questionCount === count ? '#F2C4CE' : '#4F4F51',
                      borderColor: questionCount === count ? '#F58F7C' : '#D6D6D6',
                      color: questionCount === count ? '#2C2B30' : '#D6D6D6',
                    }}
                  >
                    {count} Questions
                    <p className="text-sm font-normal mt-1" style={{ color: questionCount === count ? '#4F4F51' : '#D6D6D6' }}>
                      ~{count * 3} mins
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Info */}
            <div className="rounded-lg p-6 mb-12 border" style={{ backgroundColor: '#4F4F51', borderColor: '#F2C4CE' }}>
              <h3 className="font-bold mb-4" style={{ color: '#F2C4CE' }}>Your Interview Session</h3>
              <ul className="space-y-2" style={{ color: '#D6D6D6' }}>
                <li>Questions: {questionCount} questions at {difficulty || 'selected'} difficulty</li>
                <li>Duration: ~{questionCount * 3} minutes</li>
                <li>Format: Text-based responses with speech recognition</li>
                <li>Feedback: Real-time scoring and suggestions</li>
              </ul>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setStep('interviewType')} className="border-2 px-8 py-3 rounded-lg font-semibold transition" style={{ borderColor: '#D6D6D6', color: '#D6D6D6' }}>
                Back
              </button>
              <button
                onClick={handleStartInterview}
                disabled={!difficulty || predicting}
                className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}
              >
                {predicting ? 'Analyzing Resume...' : 'Start Interview Simulation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
