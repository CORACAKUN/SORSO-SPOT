import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

const emptyDestinationForm = {
  name: '',
  slug: '',
  municipality: '',
  category: '',
  best_time: '',
  latitude: '',
  longitude: '',
  image_url: '',
  is_published: true,
};

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

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDestinationPayload(form) {
  return {
    name: form.name.trim(),
    slug: createSlug(form.slug || form.name),
    municipality: form.municipality.trim(),
    category: form.category.trim(),
    best_time: form.best_time.trim() || null,
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
    image_url: form.image_url.trim() || null,
    is_published: Boolean(form.is_published),
  };
}

function ShellCard({ children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function TextField({
  label,
  name,
  onChange,
  placeholder,
  required = false,
  step,
  type = 'text',
  value,
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-extrabold text-slate-500">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-sea focus:ring-2 focus:ring-sea/20"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function DestinationManager() {
  const [destinations, setDestinations] = useState([]);
  const [form, setForm] = useState(emptyDestinationForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return destinations;

    return destinations.filter((destination) => {
      return [destination.name, destination.municipality, destination.category, destination.slug]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [destinations, search]);

  async function loadDestinations() {
    if (!supabase) {
      setIsLoading(false);
      setMessage('Supabase is not configured yet.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, slug, municipality, category, best_time, latitude, longitude, image_url, is_published')
      .order('name', { ascending: true });

    if (error) {
      setMessage(`Unable to load destinations: ${error.message}`);
      setDestinations([]);
    } else {
      setDestinations(data || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDestinations();
  }, []);

  function handleFieldChange(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && !editingId ? { slug: createSlug(value) } : {}),
    }));
  }

  function startEdit(destination) {
    setEditingId(destination.id);
    setForm({
      name: destination.name || '',
      slug: destination.slug || '',
      municipality: destination.municipality || '',
      category: destination.category || '',
      best_time: destination.best_time || '',
      latitude: destination.latitude ?? '',
      longitude: destination.longitude ?? '',
      image_url: destination.image_url || '',
      is_published: Boolean(destination.is_published),
    });
    setMessage('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyDestinationForm);
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = normalizeDestinationPayload(form);
    if (!payload.name || !payload.slug || !payload.municipality || !payload.category) {
      setMessage('Name, slug, municipality, and category are required.');
      return;
    }

    if (
      (payload.latitude !== null && Number.isNaN(payload.latitude)) ||
      (payload.longitude !== null && Number.isNaN(payload.longitude))
    ) {
      setMessage('Latitude and longitude must be valid numbers.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const result = editingId
      ? await supabase.from('destinations').update(payload).eq('id', editingId).select().single()
      : await supabase.from('destinations').insert(payload).select().single();

    setIsSaving(false);

    if (result.error) {
      setMessage(`Unable to save destination: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? 'Destination updated.' : 'Destination added.');
    resetForm();
    loadDestinations();
  }

  async function togglePublished(destination) {
    setMessage('');

    const { error } = await supabase
      .from('destinations')
      .update({ is_published: !destination.is_published })
      .eq('id', destination.id);

    if (error) {
      setMessage(`Unable to update publish status: ${error.message}`);
      return;
    }

    setDestinations((current) =>
      current.map((item) =>
        item.id === destination.id ? { ...item, is_published: !item.is_published } : item,
      ),
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Destinations</p>
            <h2 className="mt-1 text-2xl font-black">Manage tourist spots</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Add places, update map coordinates, and control which destinations appear on the
              traveler map.
            </p>
          </div>
          <input
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search destinations"
            type="search"
            value={search}
          />
        </div>

        {message && (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {message}
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[88px_1.2fr_.8fr_.7fr_.8fr_160px] gap-3 bg-mist px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid">
            <span>Image</span>
            <span>Name</span>
            <span>Municipality</span>
            <span>Category</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Loading destinations...</p>
            ) : filteredDestinations.length ? (
              filteredDestinations.map((destination) => (
                <article
                  className="grid gap-4 p-4 lg:grid-cols-[88px_1.2fr_.8fr_.7fr_.8fr_160px] lg:items-center"
                  key={destination.id}
                >
                  <img
                    alt=""
                    className="h-20 w-full rounded-lg bg-mist object-cover lg:h-16"
                    src={
                      destination.image_url ||
                      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
                    }
                  />
                  <div>
                    <h3 className="font-black">{destination.name}</h3>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                      {destination.slug}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{destination.municipality}</p>
                  <p className="text-sm text-slate-600">{destination.category}</p>
                  <span
                    className={`w-fit rounded-lg px-3 py-2 text-xs font-black ${
                      destination.is_published
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {destination.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink"
                      onClick={() => startEdit(destination)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="min-h-10 rounded-lg bg-sea px-3 text-sm font-extrabold text-white"
                      onClick={() => togglePublished(destination)}
                      type="button"
                    >
                      {destination.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">
                No destinations found. Add the first one using the form.
              </p>
            )}
          </div>
        </div>
      </ShellCard>

      <ShellCard className="h-fit">
        <p className="text-xs font-black uppercase text-sea">
          {editingId ? 'Edit destination' : 'New destination'}
        </p>
        <h2 className="mt-1 text-2xl font-black">
          {editingId ? 'Update place details' : 'Add a tourist spot'}
        </h2>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="name"
            onChange={handleFieldChange}
            placeholder="Bulusan Lake"
            required
            value={form.name}
          />
          <TextField
            label="Slug"
            name="slug"
            onChange={handleFieldChange}
            placeholder="bulusan-lake"
            required
            value={form.slug}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <TextField
              label="Municipality"
              name="municipality"
              onChange={handleFieldChange}
              placeholder="Bulusan"
              required
              value={form.municipality}
            />
            <TextField
              label="Category"
              name="category"
              onChange={handleFieldChange}
              placeholder="Nature"
              required
              value={form.category}
            />
          </div>
          <TextField
            label="Best time"
            name="best_time"
            onChange={handleFieldChange}
            placeholder="November to May"
            value={form.best_time}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Latitude"
              name="latitude"
              onChange={handleFieldChange}
              placeholder="12.7669"
              step="any"
              type="number"
              value={form.latitude}
            />
            <TextField
              label="Longitude"
              name="longitude"
              onChange={handleFieldChange}
              placeholder="124.0871"
              step="any"
              type="number"
              value={form.longitude}
            />
          </div>
          <TextField
            label="Image URL"
            name="image_url"
            onChange={handleFieldChange}
            placeholder="https://example.com/photo.jpg"
            type="url"
            value={form.image_url}
          />
          <label className="flex min-h-11 items-center gap-3 rounded-lg bg-mist px-3 text-sm font-extrabold text-ink">
            <input
              checked={form.is_published}
              className="size-4 accent-teal-700"
              name="is_published"
              onChange={handleFieldChange}
              type="checkbox"
            />
            Show on traveler map
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add destination'}
            </button>
            {editingId && (
              <button
                className="min-h-11 rounded-lg border border-slate-200 px-4 font-extrabold text-ink"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </ShellCard>
    </div>
  );
}

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
