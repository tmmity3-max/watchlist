'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push('/dashboard');
    router.refresh();
  }

  async function handleMagicLink() {
    setError('');
    if (!email) return setError('Enter your email first.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMagicSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-base-border bg-base-panel p-6">
        <h1 className="mb-1 text-lg font-semibold">TM Watchlist</h1>
        <p className="mb-6 text-sm text-base-muted">Sign in to sync your watchlists.</p>

        {magicSent ? (
          <p className="rounded-lg bg-base-panel2 p-3 text-sm text-tag-green">
            Check your inbox — we sent a sign-in link to {email}.
          </p>
        ) : (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-base-border bg-base-panel2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-base-border bg-base-panel2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {error && <p className="text-sm text-tag-red">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="my-4 flex items-center gap-2 text-xs text-base-muted">
              <div className="h-px flex-1 bg-base-border" /> or <div className="h-px flex-1 bg-base-border" />
            </div>

            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full rounded-lg border border-base-border px-3 py-2 text-sm hover:bg-base-panel2 disabled:opacity-50"
            >
              Send magic link
            </button>

            <div className="mt-3">
              <GoogleAuthButton label="Continue with Google" />
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm text-base-muted">
          No account?{' '}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
