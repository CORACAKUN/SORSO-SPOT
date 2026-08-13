import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import DashboardPanel from '../../components/shared/DashboardPanel.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { supabase } from '../../lib/supabaseClient';
import GoogleMapDemo from '../../components/GoogleMapDemo.jsx';
import { useUserDashboardData } from './useUserDashboardData';

const tabs = [
  { id: 'explore', label: 'Explore', icon: 'EX' },
  { id: 'reviews', label: 'Reviews', icon: 'RV' },
  { id: 'submissions', label: 'Submissions', icon: 'SB' },
  { id: 'travel', label: 'Travel Plans', icon: 'TP' },
  { id: 'account', label: 'Account', icon: 'AC' },
  { id: 'saved', label: 'Saved Places', icon: 'SP' },
];

const tripPlan = [
  ['Day 1', 'Sorsogon City arrival, food stops, and baywalk sunset.'],
  ['Day 2', 'Bulusan Lake kayaking, nature walk, and nearby viewpoints.'],
  ['Day 3', 'Matnog island hopping or Donsol wildlife tour.'],
];

export default function UserDashboard({ isAdmin = false, onAdminOpen, user, onBack }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const {
    destinations,
    isLoading,
    message,
    reviews,
    savedDestinationSlugs,
    savedDestinations,
    setMessage,
    submissions,
    toggleFavorite,
  } = useUserDashboardData(user);

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Traveler';

  useEffect(() => {
    const welcomeKey = `sorso-dashboard-welcome-${user.id}`;
    if (!window.sessionStorage.getItem(welcomeKey)) {
      setShowWelcome(true);
      window.sessionStorage.setItem(welcomeKey, 'seen');
    }
  }, [user.id]);

  async function handleSignOut() {
    if (!supabase) return;

    setIsSigningOut(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) setMessage(error.message);
  }

  function renderSavedPlaces() {
    return (
      <DashboardPanel>
        <div className="grid gap-3">
          {isLoading ? (
            <EmptyState text="Loading saved places..." />
          ) : savedDestinations.length ? (
            savedDestinations.map((favorite) => (
              <article
                className="grid gap-3 rounded-lg bg-mist p-4 md:grid-cols-[1fr_auto] md:items-center"
                key={`${favorite.destination_slug}-${favorite.created_at}`}
              >
                <div>
                  <h3 className="font-black">{favorite.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {favorite.location} - {favorite.category} - Best time: {favorite.bestTime}
                  </p>
                </div>
                <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-sea">
                  Saved
                </span>
              </article>
            ))
          ) : (
            <EmptyState text="No saved places yet. Browse destinations and save favorites next." />
          )}
        </div>
      </DashboardPanel>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-[1100] grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <button className="flex items-center gap-3 font-extrabold" onClick={onBack} type="button">
          <span className="grid size-9 place-items-center rounded-lg bg-sea text-sm font-black text-white">
            SS
          </span>
          <span className="hidden sm:inline">Sorso Spot</span>
        </button>

        <nav className="min-w-0 justify-self-center text-center" aria-label="Dashboard location">
          <h1 className="truncate text-lg font-black sm:text-xl">Traveler dashboard</h1>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              className="hidden min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink sm:inline-flex sm:items-center"
              onClick={onAdminOpen}
              type="button"
            >
              Admin
            </button>
          )}
          <button
            className="hidden min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink sm:inline-flex sm:items-center"
            onClick={onBack}
            type="button"
          >
            View site
          </button>
          <button
            className="min-h-10 rounded-lg bg-ink px-3 text-sm font-extrabold text-white disabled:opacity-60 sm:px-4"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>

      <div
        className={`grid min-h-[calc(100svh-65px)] ${
          isSidebarOpen ? 'sm:grid-cols-[220px_1fr]' : 'sm:grid-cols-[72px_1fr]'
        }`}
      >
        <aside className="sticky top-[65px] hidden h-[calc(100svh-65px)] border-r border-slate-200 bg-white p-3 sm:block">
          <button
            className="mb-4 grid min-h-10 w-full place-items-center rounded-lg border border-slate-200 text-sm font-black text-ink"
            onClick={() => setIsSidebarOpen((current) => !current)}
            title={isSidebarOpen ? 'Hide sidebar labels' : 'Show sidebar labels'}
            type="button"
          >
            {isSidebarOpen ? <FaChevronLeft aria-hidden="true" /> : <FaChevronRight aria-hidden="true" />}
          </button>

          <div className="grid gap-2">
            {tabs.map((tab) => (
              <button
                className={`grid min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-extrabold ${
                  isSidebarOpen ? 'grid-cols-[38px_1fr]' : 'grid-cols-1 place-items-center'
                } ${
                  activeTab === tab.id
                    ? 'bg-sea text-white'
                    : 'bg-white text-slate-600 hover:bg-mist hover:text-ink'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                type="button"
              >
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-black ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-mist text-sea'
                  }`}
                >
                  {tab.icon}
                </span>
                {isSidebarOpen && <span className="truncate">{tab.label}</span>}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:hidden" aria-label="Dashboard tabs">
            {tabs.map((tab) => (
              <button
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-extrabold ${
                  activeTab === tab.id ? 'bg-sea text-white' : 'bg-white text-slate-600'
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {message && (
            <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              {message}
            </p>
          )}

          {activeTab === 'explore' && (
            <DashboardPanel>
              <GoogleMapDemo
                destinations={destinations}
                onToggleFavorite={toggleFavorite}
                savedDestinationSlugs={savedDestinationSlugs}
              />
            </DashboardPanel>
          )}

          {activeTab === 'reviews' && (
            <DashboardPanel>
              <div className="grid gap-3">
                {isLoading ? (
                  <EmptyState text="Loading reviews..." />
                ) : reviews.length ? (
                  reviews.map((review) => (
                    <article
                      className="rounded-lg bg-mist p-4"
                      key={`${review.destination_slug}-${review.created_at}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-black">{review.title}</h3>
                        <span className="rounded-lg bg-white px-3 py-1 text-sm font-black text-coral">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{review.body}</p>
                      <p className="mt-3 text-xs font-black uppercase text-slate-500">
                        {review.destination_slug} - {review.status}
                      </p>
                    </article>
                  ))
                ) : (
                  <EmptyState text="No reviews yet. Your destination reviews will appear here." />
                )}
              </div>
            </DashboardPanel>
          )}

          {activeTab === 'submissions' && (
            <DashboardPanel>
              <div className="grid gap-3">
                {isLoading ? (
                  <EmptyState text="Loading submissions..." />
                ) : submissions.length ? (
                  submissions.map((submission) => (
                    <article
                      className="grid gap-2 rounded-lg bg-mist p-4 md:grid-cols-[1fr_auto] md:items-center"
                      key={`${submission.name}-${submission.submitted_at}`}
                    >
                      <div>
                        <h3 className="font-black">{submission.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {submission.submission_type} - {submission.municipality}
                        </p>
                      </div>
                      <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-forest">
                        {submission.status}
                      </span>
                    </article>
                  ))
                ) : (
                  <EmptyState text="No submissions yet. Attraction and accommodation submissions will appear here." />
                )}
              </div>
            </DashboardPanel>
          )}

          {activeTab === 'travel' && (
            <DashboardPanel>
              <div className="grid gap-3">
                {tripPlan.map(([label, text]) => (
                  <article className="rounded-lg border border-slate-200 bg-white p-4" key={label}>
                    <p className="font-black text-sea">{label}</p>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </article>
                ))}
              </div>
            </DashboardPanel>
          )}

          {activeTab === 'account' && (
            <DashboardPanel>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-mist p-4">
                  <p className="text-sm font-extrabold text-slate-500">Display name</p>
                  <p className="mt-1 break-words font-black">{displayName}</p>
                </div>
                <div className="rounded-lg bg-mist p-4">
                  <p className="text-sm font-extrabold text-slate-500">Email</p>
                  <p className="mt-1 break-words font-black">{user.email}</p>
                </div>
                <div className="rounded-lg bg-mist p-4">
                  <p className="text-sm font-extrabold text-slate-500">Account ID</p>
                  <p className="mt-1 break-all text-sm font-black">{user.id}</p>
                </div>
                <div className="rounded-lg bg-mist p-4">
                  <p className="text-sm font-extrabold text-slate-500">Dashboard access</p>
                  <p className="mt-1 font-black">{isAdmin ? 'Admin' : 'Traveler'}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Account settings, profile editing, and notification preferences can be added here
                later.
              </p>
            </DashboardPanel>
          )}

          {activeTab === 'saved' && renderSavedPlaces()}
        </main>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-travel">
            <p className="text-xs font-black uppercase text-sun">Welcome</p>
            <h2 className="mt-2 text-3xl font-black leading-none">Hi, {displayName}.</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Your traveler dashboard is ready. Start with Explore, then use the sidebar tabs for
              reviews, submissions, travel plans, and saved places.
            </p>
            <button
              className="mt-6 min-h-11 w-full rounded-lg bg-sea px-4 font-extrabold text-white"
              onClick={() => setShowWelcome(false)}
              type="button"
            >
              Continue
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
