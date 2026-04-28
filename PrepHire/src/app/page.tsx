import Link from "next/link";
import { Sparkles, Zap, BarChart3, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text)' }}>
              Master Your Interviews with{" "}
              <span style={{ color: 'var(--color-accent)' }}>AI-Powered Practice</span>
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text)' }}>
              Get real-time feedback, personalized coaching, and build confidence for your next big interview.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/prepare" className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transform hover:scale-105 transition" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
                Start Practicing
              </Link>
              <button className="border-2 px-8 py-3 rounded-lg font-semibold transition" style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}>
                Learn More
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/homepgimg.png"
              alt="Interview simulation illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: 'var(--color-text)' }}>Why Choose PrepHire?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'AI-Powered Analysis', desc: 'Get instant feedback on your responses with keyword matching and grammar checking' },
              { icon: BarChart3, title: 'Progress Tracking', desc: 'Monitor your improvement with detailed analytics and performance metrics' },
              { icon: Trophy, title: 'Personalized Questions', desc: 'Practice with questions tailored to your resume and target job domain' },
              { icon: Sparkles, title: 'Real-Time Feedback', desc: 'Receive actionable suggestions for improvement after each session' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Icon className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-secondary)' }}>{title}</h3>
                <p style={{ color: 'var(--color-text)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-secondary)' }}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>Ready to Ace Your Interview?</h2>
          <p className="text-xl mb-8" style={{ color: 'var(--color-text)' }}>Start practicing today and get personalized feedback</p>
          <Link href="/prepare" className="inline-block px-8 py-3 rounded-lg font-bold hover:opacity-90 transform hover:scale-105 transition" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}>
            Begin Practice Session
          </Link>
        </div>
      </section>

      <footer className="py-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center" style={{ color: 'var(--color-text)' }}>
          <p>&copy; 2026 PrepHire. Master your interviews with AI-powered practice.</p>
        </div>
      </footer>
    </div>
  );
}
