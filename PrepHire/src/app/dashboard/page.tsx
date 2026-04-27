'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, TrendingUp, Award, Zap, ChevronRight, LayoutDashboard, History, PieChart } from 'lucide-react';
import Navigation from '@/components/Navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

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

  const scoreChartData = {
    labels: [...sessions].slice(0, 8).reverse().map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Score %',
        data: [...sessions].slice(0, 8).reverse().map(s => s.score),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: 'var(--color-card)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const domainData = Array.from(new Set(sessions.map((s) => s.domain))).map((domain) => ({
    name: domain,
    count: sessions.filter((s) => s.domain === domain).length,
  }));

  const doughnutData = {
    labels: domainData.map(d => d.name),
    datasets: [
      {
        data: domainData.map(d => d.count),
        backgroundColor: [
          '#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-accent)' }}>
              <LayoutDashboard size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Performance Analytics</span>
            </div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>Your Progress Dashboard</h1>
          </div>
          <Link href="/prepare" className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition hover:scale-105" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
            Practice New Domain <ChevronRight size={20} />
          </Link>
        </div>

        {/* Status Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Sessions', value: totalSessions, sub: 'Ranked Interviews', icon: Calendar, accent: '#3b82f6' },
            { label: 'Average Score', value: totalSessions ? `${averageScore}%` : '—', sub: 'Mean Accuracy', icon: TrendingUp, accent: '#22c55e' },
            { label: 'Highest Score', value: totalSessions ? `${highestScore}%` : '—', sub: 'Peak Achievement', icon: Award, accent: '#f59e0b' },
            { label: 'Domains', value: new Set(sessions.map((s) => s.domain)).size || '—', sub: 'Skill Coverage', icon: Zap, accent: '#ef4444' },
          ].map(({ label, value, sub, icon: Icon, accent }) => (
            <div key={label} className="rounded-2xl p-6 transition-all hover:translate-y-[-4px]" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${accent}15` }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <div className="text-sm font-bold opacity-60 uppercase tracking-tight" style={{ color: 'var(--color-text)' }}>{label}</div>
              </div>
              <div className="text-4xl font-black mb-1" style={{ color: 'var(--color-text)' }}>{value}</div>
              <div className="text-xs font-semibold" style={{ color: accent }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Main Score Trend Chart */}
            <div className="lg:col-span-2 rounded-2xl p-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <History size={20} className="opacity-60" /> Score Progression
                </h2>
                <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-secondary)' }}>Last 8 Sessions</div>
              </div>
              <div style={{ height: '320px' }}>
                <Line 
                  data={scoreChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 1)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        cornerRadius: 12,
                        displayColors: false,
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
                      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, stepSize: 20 } },
                    }
                  }}
                />
              </div>
            </div>

            {/* Domain Distribution Pie Chart */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <PieChart size={20} className="opacity-60" /> Domain Mix
              </h2>
              <div style={{ height: '260px' }} className="flex items-center justify-center">
                <Doughnut 
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: { 
                          color: 'rgba(255,255,255,0.6)', 
                          padding: 20, 
                          font: { size: 10 },
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 1)',
                        cornerRadius: 12,
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-16 text-center mb-12 border-2 border-dashed" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>No sessions found in your history.</p>
            <Link href="/prepare" className="inline-block px-10 py-4 rounded-xl font-bold transition hover:scale-105 shadow-lg" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
              Start Your First Interview
            </Link>
          </div>
        )}

        {/* Recent Sessions Table */}
        {sessions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Activity History</h2>
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-background)' }}>
                      {['DATE', 'DOMAIN', 'DIFFICULTY', 'SCORE', 'DURATION'].map((h) => (
                        <th key={h} className="px-8 py-5 text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="transition-all hover:bg-white/5 active:bg-white/10 border-b" style={{ borderColor: 'var(--color-background)' }}>
                        <td className="px-8 py-5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{new Date(session.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-sm" style={{ color: 'var(--color-text)' }}>
                          <span className="capitalize">{session.domain}</span>
                        </td>
                        <td className="px-8 py-5 text-sm">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-black" style={{ color: session.score >= 75 ? '#22c55e' : 'var(--color-accent)' }}>{session.score}%</td>
                        <td className="px-8 py-5 text-sm opacity-60" style={{ color: 'var(--color-text)' }}>{session.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/prepare" className="inline-block px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
            Start New Practice Session
          </Link>
        </div>
      </div>
    </div>
  );
}
