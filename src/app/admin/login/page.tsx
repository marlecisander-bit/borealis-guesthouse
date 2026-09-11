'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BorealisLogo } from '@/components/brand/BorealisLogo';
import { isValidEmail } from '@/utils/helpers';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => searchParams.get('error') === 'not-authorized'
    ? 'This account is signed in but has not been granted Borealis administrator access.'
    : '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Login failed. Please try again.');

      const requested = new URLSearchParams(window.location.search).get('returnTo');
      const destination = requested?.startsWith('/admin') && !requested.startsWith('//')
        ? requested
        : '/admin/dashboard';
      window.location.assign(destination);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : '';
      const message = rawMessage.toLowerCase().includes('invalid login credentials')
        ? 'The email or password is incorrect. Confirm that this user exists in Supabase Authentication.'
        : rawMessage || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <BorealisLogo priority variant="light" className="mx-auto mb-3 h-24 w-auto" />
          <p className="text-sm font-medium tracking-wide text-slate-300">Secure property administration</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <h1 className="mb-2 text-2xl font-bold text-slate-950">Welcome back</h1>
          <p className="mb-6 text-sm text-slate-500">Sign in to manage Borealis Guest House.</p>

          {error && (
            <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-16 outline-none transition focus:border-transparent focus:ring-2 focus:ring-slate-900"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 min-h-12 w-full rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs leading-5 text-slate-600">
              Admin accounts are managed securely through Supabase Authentication.
              Contact the property owner if you need access or a password reset.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Borealis Guest House Platform © 2026
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-900" />}><LoginForm /></Suspense>;
}
