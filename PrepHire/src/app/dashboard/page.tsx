'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, TrendingUp, Award, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface SessionData {
  id: string;
  date: string;
  domain: string;
  difficulty: string;
  score: number;
  duration: string;
  status: 'completed' | 'in_progress';
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    const history = JSON.parse(sessionStorage.getItem('sessionHistory') || '[]');
    setSessions(history);
  }, []);

  const totalSessions = sessions.length;
  const averageScore = totalSessions ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions) : 0;
  const highestScore = totalSessions ? Math.max(...sessions.map((s) => s.score)) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#2C2B30' }}>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#D6D6D6' }}>Your Progress Dashboard</h1>
          <p className="text-lg" style={{ color: '#D6D6D6' }}>Track your interview preparation journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Sessions', value: totalSessions, sub: 'Completed interviews', icon: Calendar, accent: '#F58F7C' },
            { label: 'Average Score', value: totalSessions ? `${averageScore}%` : '—', sub: 'Your performance level', icon: TrendingUp, accent: '#F2C4CE' },
            { label: 'Highest Score', value: totalSessions ? `${highestScore}%` : '—', sub: 'Your best interview', icon: Award, accent: '#F58F7C' },
            { label: 'Domains Practiced', value: new Set(sessions.map((s) => s.domain)).size || '—', sub: 'Unique domains', icon: Zap, accent: '#F2C4CE' },
          ].map(({ label, value, sub, icon: Icon, accent }) => (
            <div key={label} className="rounded-xl p-8 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#D6D6D6' }}>{label}</h3>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#2C2B30' }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
              </div>
              <div className="text-4xl font-bold" style={{ color: accent }}>{value}</div>
              <p className="text-sm mt-2" style={{ color: '#D6D6D6' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl p-8 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#F2C4CE' }}>Score Trend</h2>
              <div className="h-48 flex items-end gap-2">
                {sessions.slice(0, 8).reverse().map((s, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-t" style={{ height: `${s.score}%`, backgroundColor: '#F58F7C' }} />
                    <div className="text-xs mt-1" style={{ color: '#D6D6D6' }}>{s.score}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-8 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#F2C4CE' }}>Practice by Domain</h2>
              <div className="space-y-3">
                {Array.from(new Set(sessions.map((s) => s.domain))).map((domain) => {
                  const count = sessions.filter((s) => s.domain === domain).length;
                  const pct = Math.round((count / totalSessions) * 100);
                  return (
                    <div key={domain}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-semibold" style={{ color: '#D6D6D6' }}>{domain}</span>
                        <span className="text-sm" style={{ color: '#D6D6D6' }}>{pct}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: '#2C2B30' }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#F58F7C' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#D6D6D6' }}>Recent Sessions</h2>
          {sessions.length === 0 ? (
            <div className="rounded-xl p-12 text-center mb-12 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <p className="text-lg mb-4" style={{ color: '#D6D6D6' }}>No sessions yet. Complete your first interview to see your progress here.</p>
              <Link href="/prepare" className="inline-block px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
                Start Practicing
              </Link>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden mb-12 border border-[#4F4F51]" style={{ backgroundColor: '#4F4F51' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#2C2B30]">
                    <tr>
                      {['Date', 'Domain', 'Difficulty', 'Score', 'Duration'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#F2C4CE' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-[#2C2B30] hover:bg-[#2C2B30] transition">
                        <td className="px-6 py-4 text-sm" style={{ color: '#D6D6D6' }}>{new Date(session.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#D6D6D6' }}>{session.domain}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#2C2B30', color: '#F2C4CE' }}>{session.difficulty}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: '#F58F7C' }}>{session.score}%</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#D6D6D6' }}>{session.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/prepare" className="inline-block px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
            Start New Practice Session
          </Link>
        </div>
      </div>
    </div>
  );
}
