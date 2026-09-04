import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBed,
  FaClipboardList,
  FaMapMarkedAlt,
  FaRedo,
  FaRoute,
  FaStar,
  FaUsersCog,
} from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const emptyOverview = {
  destinations: [],
  submissions: [],
  reviews: [],
  accommodations: [],
  routes: [],
  profiles: [],
};

async function loadOverviewTable(key, query) {
  const { data, error } = await query;
  return {
    key,
    data: error ? [] : data || [],
    error: error?.message || '',
  };
}

function asNumber(value) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'bg-mist text-sea' }) {
  return (
    <ShellCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${tone}`}>
          <Icon aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{detail}</p>
    </ShellCard>
  );
}

function QueueButton({ children, count, onClick }) {
  return (
    <button
      className="flex min-h-14 items-center justify-between gap-4 rounded-lg bg-mist px-4 text-left font-extrabold text-ink transition hover:bg-sea hover:text-white"
      onClick={onClick}
      type="button"
    >
      <span>{children}</span>
      <span className="grid min-w-9 place-items-center rounded-lg bg-white px-2 py-1 text-sm text-sea">
        {count}
      </span>
    </button>
  );
}

export default function OverviewManager({ user, onOpenTab }) {
  const [overview, setOverview] = useState(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadOverview() {
    if (!supabase) return;

    setIsLoading(true);
    setMessage('');

    const queries = {
      destinations: supabase
        .from('destinations')
        .select('name, latitude, longitude, is_published, is_featured'),
      submissions: supabase.from('submissions').select('status'),
      reviews: supabase.from('reviews').select('status, rating'),
      accommodations: supabase.from('accommodations').select('is_published'),
      routes: supabase.from('transport_routes').select('is_published'),
      profiles: supabase.from('profiles').select('role'),
    };

    const results = await Promise.all(
      Object.entries(queries).map(([key, query]) => loadOverviewTable(key, query)),
    );

    const nextOverview = { ...emptyOverview };
    const errors = [];

    results.forEach((result) => {
      nextOverview[result.key] = result.data;
      if (result.error) errors.push(`${result.key}: ${result.error}`);
    });

    setOverview(nextOverview);
    setMessage(errors.length ? `Some overview data could not be loaded. ${errors.join(' | ')}` : '');
    setIsLoading(false);
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const summary = useMemo(() => {
    const totalDestinations = overview.destinations.length;
    const publishedDestinations = overview.destinations.filter((item) => item.is_published).length;
    const featuredDestinations = overview.destinations.filter((item) => item.is_featured).length;
    const mappedDestinations = overview.destinations.filter((item) => {
      return asNumber(item.latitude) !== null && asNumber(item.longitude) !== null;
    }).length;
    const missingCoordinates = Math.max(totalDestinations - mappedDestinations, 0);
    const draftDestinations = Math.max(totalDestinations - publishedDestinations, 0);
    const pendingSubmissions = overview.submissions.filter((item) => item.status === 'pending').length;
    const pendingReviews = overview.reviews.filter((item) => item.status === 'pending').length;
    const approvedReviews = overview.reviews.filter((item) => item.status === 'approved');
    const ratings = approvedReviews.map((item) => asNumber(item.rating)).filter((item) => item !== null);
    const averageRating = ratings.length
      ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)
      : '0.0';

    return {
      totalDestinations,
      publishedDestinations,
      featuredDestinations,
      mappedDestinations,
      missingCoordinates,
      mapCoverage: totalDestinations ? Math.round((mappedDestinations / totalDestinations) * 100) : 0,
      draftDestinations,
      pendingSubmissions,
      pendingReviews,
      averageRating,
      publishedAccommodations: overview.accommodations.filter((item) => item.is_published).length,
      publishedRoutes: overview.routes.filter((item) => item.is_published).length,
      admins: overview.profiles.filter((item) => item.role === 'admin').length,
      travelers: overview.profiles.filter((item) => item.role !== 'admin').length,
    };
  }, [overview]);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-ink p-6 text-white shadow-travel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sun">Admin overview</p>
            <h2 className="mt-2 text-3xl font-black leading-none">Content control center</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
              Live snapshot of destination content, moderation queues, map readiness, and support
              listings for the Sorsogon travel guide.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-ink disabled:opacity-60"
            disabled={isLoading}
            onClick={loadOverview}
            type="button"
          >
            <FaRedo aria-hidden="true" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {message && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${summary.publishedDestinations} published, ${summary.draftDestinations} draft`}
          icon={FaClipboardList}
          label="Destinations"
          value={summary.totalDestinations}
        />
        <MetricCard
          detail={`${summary.mappedDestinations} mapped, ${summary.missingCoordinates} missing coordinates`}
          icon={FaMapMarkedAlt}
          label="Map coverage"
          tone="bg-sky-50 text-sky-700"
          value={`${summary.mapCoverage}%`}
        />
        <MetricCard
          detail="User-submitted listings waiting for review"
          icon={FaClipboardList}
          label="Pending submissions"
          tone="bg-amber-50 text-amber-700"
          value={summary.pendingSubmissions}
        />
        <MetricCard
          detail={`Approved review average: ${summary.averageRating}`}
          icon={FaStar}
          label="Pending reviews"
          tone="bg-rose-50 text-rose-700"
          value={summary.pendingReviews}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ShellCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-sea">Work queue</p>
              <h3 className="mt-1 text-2xl font-black">Needs attention</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QueueButton count={summary.pendingSubmissions} onClick={() => onOpenTab('submissions')}>
              Review submissions
            </QueueButton>
            <QueueButton count={summary.pendingReviews} onClick={() => onOpenTab('reviews')}>
              Moderate reviews
            </QueueButton>
            <QueueButton count={summary.missingCoordinates} onClick={() => onOpenTab('map')}>
              Fix map coordinates
            </QueueButton>
            <QueueButton count={summary.draftDestinations} onClick={() => onOpenTab('destinations')}>
              Check destination drafts
            </QueueButton>
          </div>
        </ShellCard>

        <ShellCard>
          <p className="text-xs font-black uppercase text-sea">Content health</p>
          <h3 className="mt-1 text-2xl font-black">Publishing status</h3>

          <div className="mt-5 grid gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-mist p-4">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-sea">
                <FaBed aria-hidden="true" />
              </span>
              <div>
                <p className="font-black">{summary.publishedAccommodations} accommodations published</p>
                <p className="text-sm text-slate-600">Hotels, resorts, inns, and homestays.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-mist p-4">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-sea">
                <FaRoute aria-hidden="true" />
              </span>
              <div>
                <p className="font-black">{summary.publishedRoutes} transport routes published</p>
                <p className="text-sm text-slate-600">Routes, costs, duration, and notes.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-mist p-4">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-sea">
                <FaUsersCog aria-hidden="true" />
              </span>
              <div>
                <p className="font-black">{summary.admins} admins, {summary.travelers} travelers</p>
                <p className="text-sm text-slate-600">Current account roles in profiles.</p>
              </div>
            </div>
          </div>
        </ShellCard>
      </section>

      <ShellCard>
        <p className="text-xs font-black uppercase text-sea">Signed in admin</p>
        <h3 className="mt-1 text-2xl font-black">{user.email}</h3>
        <p className="mt-3 text-sm text-slate-600">
          Write access still depends on your Supabase RLS policies, so keep admin-only policies on
          destinations, submissions, reviews, accommodations, transport routes, profiles, and site settings.
        </p>
      </ShellCard>
    </div>
  );
}
