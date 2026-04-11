"use client";

import Link from "next/link";
import { BarChart3, Menu, LogOut, User } from "lucide-react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState, useEffect } from "react";

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
    <nav style={{ backgroundColor: '#2C2B30' }} className="text-white shadow-lg border-b border-[#4F4F51]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8" style={{ color: '#F58F7C' }} />
            <span className="text-2xl font-bold" style={{ color: '#F2C4CE' }}>PrepHire</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-[#F2C4CE] transition text-[#D6D6D6]">Home</Link>
            <Link href="/prepare" className="hover:text-[#F2C4CE] transition text-[#D6D6D6]">Prepare</Link>
            <Link href="/dashboard" className="hover:text-[#F2C4CE] transition text-[#D6D6D6]">Dashboard</Link>

            {status === "loading" ? (
              <div className="w-24 h-8 bg-[#4F4F51] animate-pulse rounded-md" />
            ) : session ? (
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 hover:text-[#F2C4CE] transition focus:outline-none">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border-2 border-[#F58F7C]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#4F4F51] flex items-center justify-center border-2 border-[#F58F7C]">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <span className="font-medium hidden lg:block">{session.user?.name?.split(" ")[0]}</span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 border border-[#4F4F51]" style={{ backgroundColor: '#2C2B30' }}>
                    <Link href="/profile" className="block px-4 py-2 text-[#D6D6D6] hover:bg-[#4F4F51] hover:text-[#F2C4CE] transition" onClick={() => setShowProfileMenu(false)}>
                      Profile Settings
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left px-4 py-2 text-[#D6D6D6] hover:bg-[#4F4F51] flex items-center gap-2 hover:text-[#F58F7C] transition">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-5 py-2 rounded-full font-semibold transition shadow-sm" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
                Sign Up
              </button>
            )}
          </div>
          <button className="md:hidden"><Menu className="w-6 h-6" /></button>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl shadow-xl w-full max-w-md p-8 relative border border-[#4F4F51]" style={{ backgroundColor: '#2C2B30' }}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#D6D6D6] hover:text-white transition">✕</button>
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-8 h-8" style={{ color: '#F58F7C' }} />
                <span className="text-2xl font-bold" style={{ color: '#F2C4CE' }}>PrepHire</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{isSignUp ? "Create an account" : "Welcome back"}</h1>
              <p className="text-[#D6D6D6] text-sm text-center">{isSignUp ? "Sign up to start your AI interview preparation" : "Log in to continue your interview preparation"}</p>
            </div>

            <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full flex items-center justify-center gap-3 border border-[#4F4F51] rounded-lg px-6 py-3 text-[#D6D6D6] font-medium hover:bg-[#4F4F51] transition mb-4" style={{ backgroundColor: '#2C2B30' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#4F4F51]" />
              <span className="text-xs text-[#D6D6D6]">or</span>
              <div className="flex-1 h-px bg-[#4F4F51]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full border border-[#4F4F51] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F58F7C]" style={{ backgroundColor: '#4F4F51' }} />
              )}
              <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full border border-[#4F4F51] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F58F7C]" style={{ backgroundColor: '#4F4F51' }} />
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                className="w-full border border-[#4F4F51] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F58F7C]" style={{ backgroundColor: '#4F4F51' }} />
              {error && <p className="text-[#F58F7C] text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg px-6 py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-60" style={{ backgroundColor: '#F58F7C', color: '#2C2B30' }}>
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#D6D6D6]">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="font-semibold hover:opacity-80 transition" style={{ color: '#F2C4CE' }}>
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}
