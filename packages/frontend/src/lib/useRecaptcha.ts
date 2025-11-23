'use client';

import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [ready, setReady] = useState(!siteKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      // Dev bypass when no site key is configured
      setReady(true);
      return;
    }

    if (typeof window === 'undefined') return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-recaptcha="true"]'
    );

    if (existingScript) {
      window.grecaptcha?.ready(() => setReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = 'true';
    script.onload = () => {
      window.grecaptcha?.ready(() => setReady(true));
    };
    script.onerror = () => setError('Failed to load reCAPTCHA');

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', () => setReady(true));
      script.removeEventListener('error', () => setError('Failed to load reCAPTCHA'));
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string) => {
      if (!siteKey) {
        return 'dev-bypass-token';
      }

      if (!window.grecaptcha || !ready) {
        throw new Error('reCAPTCHA not ready');
      }

      return window.grecaptcha.execute(siteKey, { action });
    },
    [ready, siteKey]
  );

  return { ready, error, executeRecaptcha };
}
