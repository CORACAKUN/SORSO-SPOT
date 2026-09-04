import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkedAlt,
  FaPaperPlane,
  FaPlus,
  FaRegStar,
  FaRoute,
  FaStar,
  FaTimes,
  FaTrash,
  FaUserCircle,
} from 'react-icons/fa';
import DashboardPanel from '../../components/shared/DashboardPanel.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { supabase } from '../../lib/supabaseClient';
import GoogleMapDemo from '../../components/GoogleMapDemo.jsx';
import { useUserDashboardData } from './useUserDashboardData';

const tabs = [
  { id: 'explore', label: 'Explore', icon: FaMapMarkedAlt },
  { id: 'reviews', label: 'Reviews', icon: FaRegStar },
  { id: 'submissions', label: 'Submissions', icon: FaPaperPlane },
  { id: 'travel', label: 'Travel Plans', icon: FaRoute },
  { id: 'account', label: 'Account', icon: FaUserCircle },
  { id: 'saved', label: 'Saved Places', icon: FaBookmark },
];

const emptyReviewForm = {
  destination_slug: '',
  rating: 5,
  title: '',
  body: '',
};

const emptySubmissionForm = {
  submission_type: 'destination',
  name: '',
  municipality: '',
  description: '',
  contact_info: '',
};

function Field({ label, name, onChange, placeholder, value, type = 'text' }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-extrabold text-slate-500">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'pending').trim().toLowerCase();
  const classes = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-800',
    rejected: 'bg-rose-50 text-rose-700',
  };

  return (
    <span className={`w-fit rounded-lg px-3 py-2 text-xs font-black uppercase ${classes[normalizedStatus] || 'bg-slate-100 text-slate-600'}`}>
      {normalizedStatus}
    </span>
  );
}

export default function UserDashboard({ isAdmin = false, onAdminOpen, user, onBack }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);
  const [isSavingTravelPlan, setIsSavingTravelPlan] = useState(false);
  const [travelForm, setTravelForm] = useState({ day: 'Day 1', destination_slug: '', notes: '' });
  const {
    accommodations,
    addReview,
    addSubmission,
    addTravelPlan,
    approvedReviews,
    destinations,
    isLoading,
    message,
    reviews,
    savedDestinationSlugs,
    savedDestinations,
    setMessage,
    submissions,
    toggleFavorite,
    travelPlans,
    removeTravelPlan,
  } = useUserDashboardData(user);

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Traveler';
  const destinationOptions = useMemo(
    () => destinations.map((destination) => ({
      label: destination.name,
      slug: destination.slug,
      municipality: destination.municipality,
    })),
    [destinations],
  );

  const destinationBySlug = useMemo(() => {
    return destinations.reduce((map, destination) => {
      map[destination.slug] = destination;
      return map;
    }, {});
  }, [destinations]);

  const mapPlaces = useMemo(() => {
    const destinationPlaces = destinations.map((destination) => ({
      ...destination,
      map_type: 'destination',
      map_key: `destination:${destination.slug}`,
      is_saveable: true,
    }));
    const accommodationPlaces = accommodations.map((accommodation) => ({
      ...accommodation,
      map_type: 'accommodation',
      map_key: `accommodation:${accommodation.id || accommodation.slug || accommodation.name}`,
      category: accommodation.accommodation_type || 'Accommodation',
      best_time: accommodation.price_range,
      opening_hours: null,
      entrance_fee: accommodation.price_range,
      travel_tips: accommodation.amenities,
      description:
        accommodation.amenities || accommodation.price_range
          ? [accommodation.price_range, accommodation.amenities].filter(Boolean).join(' - ')
          : 'Published accommodation listing.',
      is_saveable: false,
    }));

    return [...destinationPlaces, ...accommodationPlaces];
  }, [accommodations, destinations]);

  useEffect(() => {
    const welcomeKey = `sorso-dashboard-welcome-${user.id}`;
    if (!window.sessionStorage.getItem(welcomeKey)) {
      setShowWelcome(true);
      window.sessionStorage.setItem(welcomeKey, 'seen');
    }
  }, [user.id]);

  useEffect(() => {
    if (destinationOptions.length && !reviewForm.destination_slug) {
      setReviewForm((current) => ({ ...current, destination_slug: destinationOptions[0].slug }));
    }
    if (destinationOptions.length && !travelForm.destination_slug) {
      setTravelForm((current) => ({ ...current, destination_slug: destinationOptions[0].slug }));
    }
  }, [destinationOptions, reviewForm.destination_slug, travelForm.destination_slug]);

  async function handleSignOut() {
    if (!supabase) return;

    setIsSigningOut(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) setMessage(error.message);
  }

  function openReviewForm(destinationSlug = '') {
    setReviewForm({
      ...emptyReviewForm,
      destination_slug: destinationSlug || destinationOptions[0]?.slug || '',
    });
    setIsReviewFormOpen(true);
    setMessage('');
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!reviewForm.destination_slug || !reviewForm.title.trim() || !reviewForm.body.trim()) {
      setMessage('Destination, title, and review text are required.');
      return;
    }

    setIsSavingReview(true);
    const { error } = await addReview(reviewForm);
    setIsSavingReview(false);

    if (error) {
      setMessage(`Unable to submit review: ${error.message}`);
      return;
    }

    setIsReviewFormOpen(false);
    setReviewForm(emptyReviewForm);
    setMessage('Review submitted. It will appear publicly after admin approval.');
  }

  async function submitPlace(event) {
    event.preventDefault();
    if (!submissionForm.name.trim() || !submissionForm.municipality.trim()) {
      setMessage('Place name and municipality are required.');
      return;
    }

    setIsSavingSubmission(true);
    const { error } = await addSubmission(submissionForm);
    setIsSavingSubmission(false);

    if (error) {
      setMessage(`Unable to submit place: ${error.message}`);
      return;
    }

    setIsSubmissionFormOpen(false);
    setSubmissionForm(emptySubmissionForm);
    setMessage('Submission sent. Admin will review it before publishing.');
  }

  async function submitTravelPlan(event) {
    event.preventDefault();
    if (!travelForm.day.trim() || !travelForm.destination_slug) {
      setMessage('Day and destination are required for the travel plan.');
      return;
    }

    setIsSavingTravelPlan(true);
    const { error } = await addTravelPlan(travelForm);
    setIsSavingTravelPlan(false);

    if (error) {
      setMessage(`Unable to add travel plan: ${error.message}`);
      return;
    }

    setTravelForm({ day: `Day ${travelPlans.length + 2}`, destination_slug: destinationOptions[0]?.slug || '', notes: '' });
    setMessage('');
  }

  async function deleteTravelPlan(id) {
    const { error } = await removeTravelPlan(id);
    if (error) setMessage(`Unable to remove travel plan: ${error.message}`);
  }

  function renderSavedPlaces() {
    return (
      <DashboardPanel eyebrow="Saved places" title="Your bookmarked spots">
        <div className="grid gap-3">
          {isLoading ? (
            <EmptyState text="Loading saved places..." />
          ) : savedDestinations.length ? (
            savedDestinations.map((favorite) => (
              <article
                className="grid gap-4 rounded-lg bg-mist p-4 lg:grid-cols-[96px_1fr_auto] lg:items-center"
                key={`${favorite.destination_slug}-${favorite.created_at}`}
              >
                <img
                  alt=""
                  className="h-20 w-full rounded-lg bg-white object-cover lg:h-16"
                  src={destinationBySlug[favorite.destination_slug]?.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
                />
                <div>
                  <h3 className="font-black">{favorite.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {favorite.location} - {favorite.category} - Best time: {favorite.bestTime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-extrabold text-ink"
                    onClick={() => openReviewForm(favorite.destination_slug)}
                    type="button"
                  >
                    <FaStar aria-hidden="true" />
                    Review
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sea px-3 text-sm font-extrabold text-white"
                    onClick={() => {
                      setTravelForm((current) => ({ ...current, destination_slug: favorite.destination_slug }));
                      setActiveTab('travel');
                    }}
                    type="button"
                  >
                    <FaRoute aria-hidden="true" />
                    Plan
                  </button>
                  <button
                    aria-label={`Remove ${favorite.title} from saved places`}
                    className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-white text-rose-700"
                    onClick={() => toggleFavorite(favorite.destination_slug)}
                    type="button"
                  >
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
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
                  {React.createElement(tab.icon, { 'aria-hidden': 'true' })}
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
                approvedReviews={approvedReviews}
                destinations={mapPlaces}
                onToggleFavorite={toggleFavorite}
                savedDestinationSlugs={savedDestinationSlugs}
              />
            </DashboardPanel>
          )}

          {activeTab === 'reviews' && (
            <div className="grid gap-6">
              <section className="grid gap-4 md:grid-cols-3">
                <DashboardPanel>
                  <p className="text-xs font-black uppercase text-slate-500">Total reviews</p>
                  <p className="mt-2 text-3xl font-black">{reviews.length}</p>
                </DashboardPanel>
                <DashboardPanel>
                  <p className="text-xs font-black uppercase text-slate-500">Pending</p>
                  <p className="mt-2 text-3xl font-black">
                    {reviews.filter((review) => review.status === 'pending').length}
                  </p>
                </DashboardPanel>
                <DashboardPanel>
                  <p className="text-xs font-black uppercase text-slate-500">Approved</p>
                  <p className="mt-2 text-3xl font-black">
                    {reviews.filter((review) => review.status === 'approved').length}
                  </p>
                </DashboardPanel>
              </section>

              <DashboardPanel eyebrow="Reviews" title="Your destination reviews">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Share recent travel notes. Reviews stay pending until an admin approves them.
                  </p>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sea px-4 text-sm font-extrabold text-white"
                    onClick={() => openReviewForm()}
                    type="button"
                  >
                    <FaPlus aria-hidden="true" />
                    Write review
                  </button>
                </div>

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
                        <div>
                          <h3 className="font-black">{review.title}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {destinationBySlug[review.destination_slug]?.name || review.destination_slug}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-black text-coral">
                            <FaStar aria-hidden="true" />
                            {review.rating}/5
                          </span>
                          <StatusBadge status={review.status} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{review.body}</p>
                    </article>
                  ))
                ) : (
                  <EmptyState text="No reviews yet. Your destination reviews will appear here." />
                )}
                </div>
              </DashboardPanel>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="grid gap-6">
              <section className="grid gap-4 md:grid-cols-4">
                {[
                  ['Total', submissions.length],
                  ['Pending', submissions.filter((submission) => submission.status === 'pending').length],
                  ['Approved', submissions.filter((submission) => submission.status === 'approved').length],
                  ['Rejected', submissions.filter((submission) => submission.status === 'rejected').length],
                ].map(([label, value]) => (
                  <DashboardPanel key={label}>
                    <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black">{value}</p>
                  </DashboardPanel>
                ))}
              </section>

              <DashboardPanel eyebrow="Submissions" title="Suggest a place">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Send places, stays, routes, or sports activity suggestions for admin review.
                  </p>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sea px-4 text-sm font-extrabold text-white"
                    onClick={() => {
                      setSubmissionForm(emptySubmissionForm);
                      setIsSubmissionFormOpen(true);
                    }}
                    type="button"
                  >
                    <FaPlus aria-hidden="true" />
                    Submit
                  </button>
                </div>

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
                        {submission.description && (
                          <p className="mt-2 text-sm text-slate-600">{submission.description}</p>
                        )}
                      </div>
                      <StatusBadge status={submission.status} />
                    </article>
                  ))
                ) : (
                  <EmptyState text="No submissions yet. Attraction and accommodation submissions will appear here." />
                )}
                </div>
              </DashboardPanel>
            </div>
          )}

          {activeTab === 'travel' && (
            <DashboardPanel eyebrow="Travel plans" title="Build an itinerary">
              <form className="grid gap-4 rounded-lg bg-mist p-4 lg:grid-cols-[150px_1fr_1fr_auto] lg:items-end" onSubmit={submitTravelPlan}>
                <Field
                  label="Day"
                  name="day"
                  onChange={(event) => setTravelForm((current) => ({ ...current, day: event.target.value }))}
                  placeholder="Day 1"
                  value={travelForm.day}
                />
                <label className="grid gap-1">
                  <span className="text-sm font-extrabold text-slate-500">Destination</span>
                  <select
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                    onChange={(event) => setTravelForm((current) => ({ ...current, destination_slug: event.target.value }))}
                    value={travelForm.destination_slug}
                  >
                    {destinationOptions.map((destination) => (
                      <option key={destination.slug} value={destination.slug}>
                        {destination.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Notes"
                  name="notes"
                  onChange={(event) => setTravelForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Morning visit, bring cash"
                  value={travelForm.notes}
                />
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sea px-4 text-sm font-extrabold text-white disabled:opacity-60"
                  disabled={isSavingTravelPlan}
                  type="submit"
                >
                  <FaPlus aria-hidden="true" />
                  {isSavingTravelPlan ? 'Adding...' : 'Add'}
                </button>
              </form>

              <div className="mt-5 grid gap-3">
                {travelPlans.length ? (
                  travelPlans.map((plan) => {
                    const destination = destinationBySlug[plan.destination_slug];
                    return (
                      <article
                        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center"
                        key={plan.id}
                      >
                        <div>
                          <p className="text-sm font-black uppercase text-sea">{plan.day}</p>
                          <h3 className="mt-1 font-black">{destination?.name || plan.destination_slug}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {destination?.municipality || 'Sorsogon'} - {plan.notes || destination?.best_time || 'No notes yet'}
                          </p>
                        </div>
                        <button
                          aria-label="Remove travel plan item"
                          className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-rose-50 text-rose-700"
                          onClick={() => deleteTravelPlan(plan.id)}
                          type="button"
                        >
                          <FaTrash aria-hidden="true" />
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState text="No travel plan items yet. Add saved or explored destinations to start building an itinerary." />
                )}
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

      {isReviewFormOpen && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsReviewFormOpen(false)}
          role="presentation"
        >
          <section
            className="w-full max-w-xl rounded-lg bg-white p-5 shadow-travel sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">Review</p>
                <h2 className="mt-1 text-2xl font-black">Write destination review</h2>
              </div>
              <button
                aria-label="Close review form"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200"
                onClick={() => setIsReviewFormOpen(false)}
                type="button"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={submitReview}>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Destination</span>
                <select
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                  onChange={(event) => setReviewForm((current) => ({ ...current, destination_slug: event.target.value }))}
                  value={reviewForm.destination_slug}
                >
                  {destinationOptions.map((destination) => (
                    <option key={destination.slug} value={destination.slug}>
                      {destination.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Rating</span>
                <select
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                  onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
                  value={reviewForm.rating}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} star{rating > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Title"
                name="title"
                onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Great sunrise stop"
                value={reviewForm.title}
              />
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Review</span>
                <textarea
                  className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                  onChange={(event) => setReviewForm((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Share tips, timing, fees, crowd level, or what made the visit worth it."
                  value={reviewForm.body}
                />
              </label>
              <button
                className="min-h-11 rounded-lg bg-sea px-4 font-extrabold text-white disabled:opacity-60"
                disabled={isSavingReview}
                type="submit"
              >
                {isSavingReview ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          </section>
        </div>
      )}

      {isSubmissionFormOpen && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsSubmissionFormOpen(false)}
          role="presentation"
        >
          <section
            className="w-full max-w-xl rounded-lg bg-white p-5 shadow-travel sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">Submission</p>
                <h2 className="mt-1 text-2xl font-black">Suggest new content</h2>
              </div>
              <button
                aria-label="Close submission form"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200"
                onClick={() => setIsSubmissionFormOpen(false)}
                type="button"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={submitPlace}>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Type</span>
                <select
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                  onChange={(event) => setSubmissionForm((current) => ({ ...current, submission_type: event.target.value }))}
                  value={submissionForm.submission_type}
                >
                  <option value="destination">Destination</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="transport">Transport</option>
                  <option value="sports">Sports activity</option>
                </select>
              </label>
              <Field
                label="Name"
                name="name"
                onChange={(event) => setSubmissionForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Place or activity name"
                value={submissionForm.name}
              />
              <Field
                label="Municipality"
                name="municipality"
                onChange={(event) => setSubmissionForm((current) => ({ ...current, municipality: event.target.value }))}
                placeholder="Bulusan"
                value={submissionForm.municipality}
              />
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Description</span>
                <textarea
                  className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
                  onChange={(event) => setSubmissionForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What should admins know about this place, route, or activity?"
                  value={submissionForm.description}
                />
              </label>
              <Field
                label="Contact info"
                name="contact_info"
                onChange={(event) => setSubmissionForm((current) => ({ ...current, contact_info: event.target.value }))}
                placeholder="Phone, page, email, or local contact"
                value={submissionForm.contact_info}
              />
              <button
                className="min-h-11 rounded-lg bg-sea px-4 font-extrabold text-white disabled:opacity-60"
                disabled={isSavingSubmission}
                type="submit"
              >
                {isSavingSubmission ? 'Submitting...' : 'Send submission'}
              </button>
            </form>
          </section>
        </div>
      )}

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
