"use client";

import Link from "next/link";
import { Sparkles, Menu, LogOut, User } from "lucide-react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navigation() {
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpenAuthModal = () => setShowAuthModal(true);
    window.addEventListener("openAuthModal", handleOpenAuthModal);
    return () => window.removeEventListener("openAuthModal", handleOpenAuthModal);
  }, []);

  const closeModal = () => {
    setShowAuthModal(false);
    setError("");
    setForm({ name: "", email: "", password: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
      }
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.error) setError("Invalid email or password.");
      else closeModal();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav
      style={{ backgroundColor: 'var(--color-background)', borderBottomColor: 'var(--color-border)' }}
      className="text-white shadow-lg border-b"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            <span className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>PrepHire</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="transition" style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}>Home</Link>
            <Link href="/prepare" className="transition" style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}>Prepare</Link>
            <Link href="/dashboard" className="transition" style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}>Dashboard</Link>

            <ThemeToggle />

            {status === "loading" ? (
              <div className="w-24 h-8 animate-pulse rounded-md" style={{ backgroundColor: 'var(--color-card)' }} />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 transition focus:outline-none"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border-2" style={{ borderColor: 'var(--color-accent)' }} />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-accent)' }}>
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <span className="font-medium hidden lg:block">{session.user?.name?.split(" ")[0]}</span>
                </button>
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 border"
                    style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 transition"
                      style={{ color: 'var(--color-text)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-4 py-2 flex items-center gap-2 transition"
                      style={{ color: 'var(--color-text)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text)'; }}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-5 py-2 rounded-full font-semibold transition shadow-sm"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
              >
                Sign Up
              </button>
            )}
          </div>
          <button className="md:hidden"><Menu className="w-6 h-6" /></button>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-xl w-full max-w-md p-8 relative border"
            style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 transition"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}
            >✕</button>
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>PrepHire</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{isSignUp ? "Create an account" : "Welcome back"}</h1>
              <p className="text-sm text-center" style={{ color: 'var(--color-text)' }}>
                {isSignUp ? "Sign up to start your AI interview preparation" : "Log in to continue your interview preparation"}
              </p>
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 rounded-lg px-6 py-3 font-medium transition mb-4 border"
              style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-card)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-background)')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text)' }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 border"
                  style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', outlineColor: 'var(--color-accent)' }}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 border"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', outlineColor: 'var(--color-accent)' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 border"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', outlineColor: 'var(--color-accent)' }}
              />
              {error && <p className="text-sm" style={{ color: 'var(--color-accent)' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-6 py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
              >
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text)' }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="font-semibold hover:opacity-80 transition"
                style={{ color: 'var(--color-secondary)' }}
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}
