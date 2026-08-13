import React, { useState } from 'react';
import DestinationManager from './components/DestinationManager.jsx';
import ShellCard from '../../components/shared/ShellCard.jsx';
import { supabase } from '../../lib/supabaseClient';

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: 'OV' },
  { id: 'destinations', label: 'Destinations', icon: 'DS' },
  { id: 'map', label: 'Map', icon: 'MP' },
  { id: 'submissions', label: 'Submissions', icon: 'SB' },
  { id: 'accommodations', label: 'Accommodations', icon: 'AC' },
  { id: 'reviews', label: 'Reviews', icon: 'RV' },
  { id: 'transport', label: 'Transport', icon: 'TR' },
  { id: 'users', label: 'Users', icon: 'US' },
  { id: 'settings', label: 'Settings', icon: 'ST' },
];

const overviewCards = [
  ['Destinations', 'Manage tourist spots and publication status.'],
  ['Pending submissions', 'Review user-submitted attractions and stays.'],
  ['Reviews', 'Moderate ratings and public feedback.'],
  ['Map coverage', 'Check locations missing coordinates.'],
];

const moduleDescriptions = {
  destinations: [
    'Destinations Management',
    'Add, edit, publish, unpublish, and archive tourist destinations.',
    ['Name, slug, category, municipality', 'Coordinates and image URL', 'Fees, hours, featured status'],
  ],
  map: [
    'Map Management',
    'Review all published destinations on the province map.',
    ['Spot missing coordinates', 'Open destination edit flow later', 'Prepare marker drag updates later'],
  ],
  submissions: [
    'Submissions Review',
    'Approve, reject, or convert user submissions into public listings.',
    ['Pending queue', 'Submitter contact info', 'Approve/reject workflow'],
  ],
  accommodations: [
    'Accommodation Management',
    'Manage hotels, resorts, inns, and homestays.',
    ['Price range and amenities', 'Contact information', 'Publish/unpublish listing'],
  ],
  reviews: [
    'Reviews Moderation',
    'Moderate destination reviews before showing them publicly.',
    ['Approve or reject', 'Filter by destination', 'Remove inappropriate content'],
  ],
  transport: [
    'Transport Routes',
    'Maintain routes, costs, durations, and practical travel notes.',
    ['Origin and destination', 'Transport type', 'Estimated duration and cost'],
  ],
  users: [
    'Users and Roles',
    'View registered users and manage role assignments later.',
    ['Traveler accounts', 'Admin role visibility', 'Profile metadata'],
  ],
  settings: [
    'Admin Settings',
    'Configure dashboard behavior and content rules later.',
    ['Site visibility', 'Submission rules', 'Moderation defaults'],
  ],
};

function PlaceholderModule({ activeTab }) {
  const [title, description, bullets] = moduleDescriptions[activeTab];

  return (
    <ShellCard>
      <p className="text-xs font-black uppercase text-sea">Phase 1 shell</p>
      <h2 className="mt-1 text-2xl font-black">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {bullets.map((bullet) => (
          <div className="rounded-lg bg-mist p-4" key={bullet}>
            <p className="font-black">{bullet}</p>
            <p className="mt-2 text-sm text-slate-600">CRUD and live Supabase data come in Phase 2.</p>
          </div>
        ))}
      </div>
    </ShellCard>
  );
}

export default function AdminDashboard({ user, onBack, onTravelerOpen }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState('');

  const activeTabLabel = adminTabs.find((tab) => tab.id === activeTab)?.label || 'Overview';

  async function handleSignOut() {
    if (!supabase) return;

    setIsSigningOut(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) setMessage(error.message);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <button className="flex items-center gap-3 font-extrabold" onClick={onBack} type="button">
          <span className="grid size-9 place-items-center rounded-lg bg-ink text-sm font-black text-white">
            AD
          </span>
          <span className="hidden sm:inline">Sorso Spot</span>
        </button>

        <nav className="min-w-0 justify-self-center text-center" aria-label="Admin location">
          <p className="truncate text-xs font-black uppercase text-slate-500">{activeTabLabel}</p>
          <h1 className="truncate text-lg font-black sm:text-xl">Admin dashboard</h1>
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="hidden min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink sm:inline-flex sm:items-center"
            onClick={onTravelerOpen}
            type="button"
          >
            Traveler
          </button>
          <button
            className="hidden min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-ink md:inline-flex md:items-center"
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
          isSidebarOpen ? 'sm:grid-cols-[240px_1fr]' : 'sm:grid-cols-[72px_1fr]'
        }`}
      >
        <aside className="sticky top-[65px] hidden h-[calc(100svh-65px)] border-r border-slate-200 bg-white p-3 sm:block">
          <button
            className="mb-4 grid min-h-10 w-full place-items-center rounded-lg border border-slate-200 text-sm font-black text-ink"
            onClick={() => setIsSidebarOpen((current) => !current)}
            title={isSidebarOpen ? 'Hide sidebar labels' : 'Show sidebar labels'}
            type="button"
          >
            {isSidebarOpen ? '<' : '>'}
          </button>

          <div className="grid gap-2">
            {adminTabs.map((tab) => (
              <button
                className={`grid min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-extrabold ${
                  isSidebarOpen ? 'grid-cols-[38px_1fr]' : 'grid-cols-1 place-items-center'
                } ${
                  activeTab === tab.id
                    ? 'bg-ink text-white'
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
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:hidden" aria-label="Admin tabs">
            {adminTabs.map((tab) => (
              <button
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-extrabold ${
                  activeTab === tab.id ? 'bg-ink text-white' : 'bg-white text-slate-600'
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

          {activeTab === 'overview' ? (
            <div className="grid gap-6">
              <section className="rounded-lg bg-ink p-6 text-white shadow-travel">
                <p className="text-xs font-black uppercase text-sun">Admin overview</p>
                <h2 className="mt-2 text-3xl font-black leading-none">Content control center</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
                  Phase 1 sets up the admin navigation, module surfaces, and content-management
                  structure. Live data, CRUD forms, and moderation actions come next.
                </p>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map(([title, description]) => (
                  <ShellCard key={title}>
                    <p className="text-xs font-black uppercase text-slate-500">Module</p>
                    <h3 className="mt-2 text-xl font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                  </ShellCard>
                ))}
              </section>

              <ShellCard>
                <p className="text-xs font-black uppercase text-sea">Signed in admin</p>
                <h3 className="mt-1 text-2xl font-black">{user.email}</h3>
                <p className="mt-3 text-sm text-slate-600">
                  This shell is frontend-gated for now. Add Supabase RLS policies before allowing
                  real write actions.
                </p>
              </ShellCard>
            </div>
          ) : activeTab === 'destinations' ? (
            <DestinationManager />
          ) : (
            <PlaceholderModule activeTab={activeTab} />
          )}
        </main>
      </div>
    </div>
  );
}

