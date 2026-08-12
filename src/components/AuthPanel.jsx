import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const initialSignInForm = {
  email: '',
  password: '',
};

const initialSignUpForm = {
  displayName: '',
  email: '',
  password: '',
};

function TextField({ label, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
        minLength={type === 'password' ? 6 : undefined}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={name !== 'displayName'}
        type={type}
        value={value}
      />
    </label>
  );
}

export default function AuthPanel({ initialView = 'sign-in', isOpen, onClose }) {
  const [view, setView] = useState(initialView);
  const [signInForm, setSignInForm] = useState(initialSignInForm);
  const [signUpForm, setSignUpForm] = useState(initialSignUpForm);
  const [session, setSession] = useState(null);
  const [loadingAction, setLoadingAction] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setView(initialView);
    setMessage('');
  }, [initialView, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  function updateSignInField(event) {
    const { name, value } = event.target;
    setSignInForm((current) => ({ ...current, [name]: value }));
  }

  function updateSignUpField(event) {
    const { name, value } = event.target;
    setSignUpForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSignIn(event) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Add your Supabase URL and publishable key in .env first.');
      return;
    }

    setLoadingAction('sign-in');
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: signInForm.email.trim(),
      password: signInForm.password,
    });

    setLoadingAction('');

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Signed in successfully.');
    setSignInForm(initialSignInForm);
  }

  async function handleSignUp(event) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Add your Supabase URL and publishable key in .env first.');
      return;
    }

    setLoadingAction('sign-up');
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: signUpForm.email.trim(),
      password: signUpForm.password,
      options: {
        data: {
          display_name: signUpForm.displayName.trim(),
        },
      },
    });

    setLoadingAction('');

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage('Account created. Check your email to confirm your sign up.');
      setSignUpForm(initialSignUpForm);
      return;
    }

    setMessage('Account created and signed in.');
    setSignUpForm(initialSignUpForm);
  }

  async function handleSignOut() {
    if (!supabase) return;

    setLoadingAction('sign-out');
    const { error } = await supabase.auth.signOut();
    setLoadingAction('');
    setMessage(error ? error.message : 'Signed out successfully.');
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/70 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="max-h-[calc(100svh-48px)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-travel sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase text-sun">Traveler account</p>
            <h2 className="text-2xl font-black leading-none" id="auth-modal-title">
              {session ? 'Your account' : view === 'sign-up' ? 'Create account' : 'Sign in'}
            </h2>
          </div>
          <button
            aria-label="Close account form"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist text-xl font-black text-ink"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            Add your Supabase values to a local <strong>.env</strong> file using
            <strong> VITE_SUPABASE_URL</strong> and
            <strong> VITE_SUPABASE_PUBLISHABLE_KEY</strong>, then restart the dev server.
          </div>
        ) : session ? (
          <div className="grid gap-4">
            <div className="rounded-lg bg-mist p-4">
              <p className="text-sm font-extrabold uppercase text-sea">Signed in</p>
              <h3 className="mt-1 break-words text-lg font-black">{session.user.email}</h3>
            </div>
            <button
              className="min-h-11 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60"
              disabled={loadingAction === 'sign-out'}
              onClick={handleSignOut}
              type="button"
            >
              {loadingAction === 'sign-out' ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 rounded-lg bg-mist p-1">
              <button
                className={`rounded-md px-3 py-2 text-sm font-extrabold ${
                  view === 'sign-in' ? 'bg-white text-ink shadow-sm' : 'text-slate-600'
                }`}
                onClick={() => {
                  setView('sign-in');
                  setMessage('');
                }}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`rounded-md px-3 py-2 text-sm font-extrabold ${
                  view === 'sign-up' ? 'bg-white text-ink shadow-sm' : 'text-slate-600'
                }`}
                onClick={() => {
                  setView('sign-up');
                  setMessage('');
                }}
                type="button"
              >
                Sign up
              </button>
            </div>

            {view === 'sign-in' ? (
              <form className="grid gap-4" onSubmit={handleSignIn}>
                <TextField
                  label="Email"
                  name="email"
                  onChange={updateSignInField}
                  placeholder="you@example.com"
                  type="email"
                  value={signInForm.email}
                />
                <TextField
                  label="Password"
                  name="password"
                  onChange={updateSignInField}
                  placeholder="Your password"
                  type="password"
                  value={signInForm.password}
                />
                <button
                  className="min-h-11 rounded-lg bg-sea px-4 font-extrabold text-white disabled:opacity-60"
                  disabled={loadingAction === 'sign-in'}
                  type="submit"
                >
                  {loadingAction === 'sign-in' ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleSignUp}>
                <TextField
                  label="Display name"
                  name="displayName"
                  onChange={updateSignUpField}
                  placeholder="Juan Traveler"
                  value={signUpForm.displayName}
                />
                <TextField
                  label="Email"
                  name="email"
                  onChange={updateSignUpField}
                  placeholder="you@example.com"
                  type="email"
                  value={signUpForm.email}
                />
                <TextField
                  label="Password"
                  name="password"
                  onChange={updateSignUpField}
                  placeholder="At least 6 characters"
                  type="password"
                  value={signUpForm.password}
                />
                <button
                  className="min-h-11 rounded-lg bg-coral px-4 font-extrabold text-white disabled:opacity-60"
                  disabled={loadingAction === 'sign-up'}
                  type="submit"
                >
                  {loadingAction === 'sign-up' ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </>
        )}

        {message && (
          <p className="mt-4 rounded-lg bg-mist p-3 text-sm font-semibold text-slate-700">{message}</p>
        )}
      </section>
    </div>
  );
}
