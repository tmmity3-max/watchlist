'use client';

import { createClient } from '@/lib/supabase/client';

export default function GoogleAuthButton({ label = 'Continue with Google' }) {
  const supabase = createClient();

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // Supabase redirects the browser to Google, then back to /auth/callback —
    // nothing else to do here.
  }

  return (
    <button
      onClick={handleGoogleAuth}
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-base-border bg-base-panel2 px-3 py-2 text-sm hover:bg-base-panel"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C33.9 5.5 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.5 15.6 18.9 12.5 24 12.5c3.1 0 5.8 1.1 8 3l6-6C33.9 5.5 29.2 3.5 24 3.5c-7.6 0-14.1 4.3-17.4 10.6z"
        />
        <path
          fill="#4CAF50"
          d="M24 44.5c5.1 0 9.8-1.9 13.3-5.2l-6.2-5.1c-2 1.5-4.6 2.4-7.1 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.8 40.1 16.4 44.5 24 44.5z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.7l6.2 5.1C40.9 36 44.5 30.5 44.5 24c0-1.2-.1-2.4-.3-3.5z"
        />
      </svg>
      {label}
    </button>
  );
}
