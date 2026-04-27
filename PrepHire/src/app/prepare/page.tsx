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

const TECH_KEYWORDS = [
  'java', 'python', 'dotnet', 'react', 'sql', 'sap', 'etl', 
  'devops', 'network', 'database', 'data science', 'business analyst', 
  'testing', 'design', 'web', 'engineer', 'technology', 'it', 'developer'
];

function isTechRole(domainName: string): boolean {
  const normalized = domainName.toLowerCase();
  return TECH_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export default function PreparePage() {
  const { data: session } = useSession();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [step, setStep] = useState<'selection' | 'interviewType' | 'difficulty'>('selection');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | null>(null);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [interviewType, setInterviewType] = useState<'dsa' | 'audio' | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeId, setResumeId] = useState<string | null>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setPredicting(true);
    
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/predict', { method: 'POST', body: form });
      const data = await res.json();
      
      if (data.domain) {
        setDetectedDomain(data.domain);
        setDetectedConfidence(data.confidence);
        setResumeText(data.resumeText || '');
        setResumeId(data.resumeId || null);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setPredicting(false);
    }
  };

  const handleStartInterview = async () => {
    if (!(selectedDomain || detectedDomain) || !difficulty) return;
    
    const finalDomain = detectedDomain || selectedDomain;
    
    sessionStorage.setItem('prepareData', JSON.stringify({ 
      domain: finalDomain, 
      hasResume: !!resumeFile, 
      difficulty, 
      questionCount, 
      interviewType, 
      resumeText,
      resumeId
    }));

    if (!session) window.dispatchEvent(new Event('openAuthModal'));
    else window.location.href = '/interview';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      
      {/* Classification Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg rounded-2xl p-8 border-t-4 shadow-2xl animate-in zoom-in-95 duration-300"
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-accent)' }}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
                style={{ backgroundColor: 'var(--color-background)', border: '2px solid var(--color-accent)' }}
              >
                <div className="text-4xl">🤖</div>
              </div>
              
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>
                {isTechRole(detectedDomain || '') ? 'Analysis Complete!' : 'Domain Not Supported'}
              </h2>
              <p className="mb-8" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                {isTechRole(detectedDomain || '') 
                  ? 'Our AI has analyzed your resume and classified your professional background.'
                  : 'We currently only support technical interview simulations. Please upload a technical resume (Engineering, IT, Data, or Design).'}
              </p>
              
              <div className="w-full rounded-xl p-6 mb-8 border" style={{ backgroundColor: 'var(--color-background)', borderColor: isTechRole(detectedDomain || '') ? 'var(--color-secondary)' : 'var(--color-accent)' }}>
                <div className="text-xs font-bold mb-2 uppercase tracking-widest opacity-60" style={{ color: 'var(--color-text)' }}>Detected Domain</div>
                <div className="text-2xl font-bold capitalize mb-2" style={{ color: isTechRole(detectedDomain || '') ? 'var(--color-accent)' : 'var(--color-text)' }}>
                  {detectedDomain}
                </div>
                {isTechRole(detectedDomain || '') && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ backgroundColor: 'var(--color-accent)', width: `${detectedConfidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{detectedConfidence?.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => {
                    setResumeFile(null);
                    setDetectedDomain(null);
                    setShowResultModal(false);
                  }}
                  className="flex-1 py-3 rounded-lg font-semibold border-2 transition hover:opacity-80"
                  style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)' }}
                >
                  {isTechRole(detectedDomain || '') ? 'Start Over' : 'Try Another Resume'}
                </button>
                {isTechRole(detectedDomain || '') && (
                  <button 
                    onClick={() => {
                      setSelectedDomain(null); // Clear manual selection to use detected
                      setShowResultModal(false);
                      setStep('interviewType');
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold transition hover:opacity-90 shadow-lg"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
                  >
                    Confirm & Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {step === 'selection' && (
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Prepare Your Interview</h1>
            <p className="text-xl mb-12" style={{ color: 'var(--color-text)' }}>Choose how you want to get started</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Resume Upload */}
              <div className="rounded-xl p-8 border-2 border-dashed transition cursor-pointer" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-secondary)' }}>
                <label className="block cursor-pointer">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                  <div className="flex flex-col items-center">
                    <Upload className="w-16 h-16 mb-4" style={{ color: 'var(--color-accent)' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>Upload Your Resume</h3>
                    <p className="text-center mb-4" style={{ color: 'var(--color-text)' }}>
                      We&apos;ll analyze your skills and create personalized questions based on your experience
                    </p>
                    {predicting ? (
                      <div className="flex flex-col items-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-t-transparent animate-spin rounded-full mb-4" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
                        <p className="font-bold" style={{ color: 'var(--color-accent)' }}>Analyzing Resume...</p>
                      </div>
                    ) : resumeFile ? (
                      <div style={{ width: '100%' }}>
                        <div className="rounded p-3 w-full text-center" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-accent)' }}>
                          <p className="font-semibold" style={{ color: 'var(--color-accent)' }}>✓ {resumeFile.name}</p>
                        </div>
                        {detectedDomain && detectedConfidence && (
                          <div className="mt-3 rounded p-3 text-center" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-secondary)' }}>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-text)', opacity: 0.7 }}>Detected domain</p>
                            <p className="font-bold capitalize" style={{ color: 'var(--color-secondary)' }}>{detectedDomain}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.6 }}>{detectedConfidence.toFixed(1)}% confidence</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--color-text)' }}>PDF, DOC, or DOCX (Max 5MB)</p>
                    )}
                  </div>
                </label>
              </div>

              {/* Job Domain Selection */}
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                  <Briefcase className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                  Or Select a Job Domain
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {JOB_DOMAINS.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain.id)}
                      className="p-4 rounded-lg border-2 transition font-semibold text-sm"
                      style={{
                        backgroundColor: selectedDomain === domain.id ? 'var(--color-secondary)' : 'var(--color-card)',
                        borderColor: selectedDomain === domain.id ? 'var(--color-accent)' : 'var(--color-text)',
                        color: selectedDomain === domain.id ? 'var(--color-background)' : 'var(--color-text)',
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
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'interviewType' && (
          <div>
            <button onClick={() => setStep('selection')} className="mb-8 flex items-center gap-2 hover:opacity-80 transition" style={{ color: 'var(--color-secondary)' }}>
              ← Back
            </button>

            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Select Interview Type</h1>
            <p className="text-xl mb-12" style={{ color: 'var(--color-text)' }}>Choose the format that matches your preparation goals</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* DSA Interview */}
              <div
                onClick={() => setInterviewType('dsa')}
                className="p-8 rounded-xl border-2 cursor-pointer transition"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: interviewType === 'dsa' ? 'var(--color-accent)' : 'var(--color-text)',
                  opacity: interviewType && interviewType !== 'dsa' ? 0.6 : 1,
                }}
              >
                <div className="text-5xl mb-4">💻</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-accent)' }}>DSA Interview</h3>
                <ul className="space-y-2" style={{ color: 'var(--color-text)' }}>
                  <li>✓ Data structures &amp; algorithms</li>
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
                  backgroundColor: 'var(--color-card)',
                  borderColor: interviewType === 'audio' ? 'var(--color-secondary)' : 'var(--color-text)',
                  opacity: interviewType && interviewType !== 'audio' ? 0.6 : 1,
                }}
              >
                <div className="text-5xl mb-4">🎤</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Audio-Based Interview</h3>
                <ul className="space-y-2" style={{ color: 'var(--color-text)' }}>
                  <li>✓ Behavioral questions</li>
                  <li>✓ Voice-based responses</li>
                  <li>✓ Communication skills</li>
                  <li>✓ Real interview simulation</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setStep('selection')} className="border-2 px-8 py-3 rounded-lg font-semibold transition" style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)' }}>
                Back
              </button>
              <button
                onClick={() => setStep('difficulty')}
                disabled={!interviewType}
                className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'difficulty' && (
          <div>
            <button onClick={() => setStep('interviewType')} className="mb-8 flex items-center gap-2 hover:opacity-80 transition" style={{ color: 'var(--color-secondary)' }}>
              ← Back
            </button>

            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Select Difficulty Level</h1>
            <p className="text-xl mb-12" style={{ color: 'var(--color-text)' }}>Questions will be adapted to your chosen level</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { key: 'easy', label: 'Easy', points: ['Foundational concepts', 'Common interview questions', 'Lower pace'], accent: 'var(--color-accent)' },
                { key: 'moderate', label: 'Moderate', points: ['Practical applications', 'Problem-solving focused', 'Balanced difficulty'], accent: 'var(--color-secondary)' },
                { key: 'hard', label: 'Hard', points: ['Advanced topics', 'System design questions', 'High challenge'], accent: 'var(--color-text)' },
              ].map(({ key, label, points, accent }) => (
                <div
                  key={key}
                  onClick={() => setDifficulty(key as 'easy' | 'moderate' | 'hard')}
                  className="p-8 rounded-xl border-2 cursor-pointer transition"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: difficulty === key ? accent : 'var(--color-text)',
                    opacity: difficulty && difficulty !== key ? 0.6 : 1,
                  }}
                >
                  <h3 className="text-2xl font-bold mb-4" style={{ color: accent }}>{label}</h3>
                  <ul className="space-y-2" style={{ color: 'var(--color-text)' }}>
                    {points.map((p) => <li key={p}>✓ {p}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Question Count */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Number of Questions</h2>
              <div className="flex gap-4">
                {([5, 10, 15] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className="flex-1 py-4 rounded-xl border-2 font-bold text-lg transition"
                    style={{
                      backgroundColor: questionCount === count ? 'var(--color-secondary)' : 'var(--color-card)',
                      borderColor: questionCount === count ? 'var(--color-accent)' : 'var(--color-text)',
                      color: questionCount === count ? 'var(--color-background)' : 'var(--color-text)',
                    }}
                  >
                    {count} Questions
                    <p className="text-sm font-normal mt-1" style={{ color: questionCount === count ? 'var(--color-card)' : 'var(--color-text)' }}>
                      ~{count * 3} mins
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Info */}
            <div className="rounded-lg p-6 mb-12" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-secondary)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Your Interview Session</h3>
              <ul className="space-y-2" style={{ color: 'var(--color-text)' }}>
                <li>Questions: {questionCount} questions at {difficulty || 'selected'} difficulty</li>
                <li>Duration: ~{questionCount * 3} minutes</li>
                <li>Format: Text-based responses with speech recognition</li>
                <li>Feedback: Real-time scoring and suggestions</li>
              </ul>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setStep('interviewType')} className="border-2 px-8 py-3 rounded-lg font-semibold transition" style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)' }}>
                Back
              </button>
              <button
                onClick={handleStartInterview}
                disabled={!difficulty || predicting}
                className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
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
