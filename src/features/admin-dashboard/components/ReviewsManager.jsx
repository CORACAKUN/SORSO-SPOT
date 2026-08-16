import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaRedoAlt, FaTimes } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const statusOptions = ['all', 'pending', 'approved', 'rejected'];

function normalizeStatus(value) {
  return String(value || 'pending').trim().toLowerCase();
}

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((review) => normalizeStatus(review.status) === statusFilter);
  }, [reviews, statusFilter]);

  const counts = useMemo(() => {
    return reviews.reduce(
      (total, review) => {
        const status = normalizeStatus(review.status);
        total[status] = (total[status] || 0) + 1;
        total.all += 1;
        return total;
      },
      { all: 0, approved: 0, pending: 0, rejected: 0 },
    );
  }, [reviews]);

  async function loadReviews() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('reviews')
      .select('id, destination_slug, rating, title, body, status, user_email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setReviews([]);
      setMessage(`Unable to load reviews: ${error.message}`);
    } else {
      setReviews(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function updateStatus(review, nextStatus) {
    if (!review.id) {
      setMessage('This review has no id, so it cannot be updated from the dashboard.');
      return;
    }

    setUpdatingId(review.id);
    setMessage('');
    const { data, error } = await supabase
      .from('reviews')
      .update({ status: nextStatus })
      .eq('id', review.id)
      .select('id, destination_slug, rating, title, body, status, user_email, created_at')
      .single();

    setUpdatingId(null);
    if (error) {
      setMessage(`Unable to update review: ${error.message}`);
      return;
    }
    setReviews((current) => current.map((item) => (item.id === review.id ? data : item)));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', counts.all],
          ['Pending', counts.pending],
          ['Approved', counts.approved],
          ['Rejected', counts.rejected],
        ].map(([label, value]) => (
          <ShellCard key={label}>
            <p className="text-xs font-black uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </ShellCard>
        ))}
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Reviews</p>
            <h2 className="mt-1 text-2xl font-black">Moderation queue</h2>
            <p className="mt-2 text-sm text-slate-600">
              Approve or reject traveler reviews before they appear publicly.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink" disabled={isLoading} onClick={loadReviews} type="button">
              <FaRedoAlt aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

        <div className="mt-6 grid gap-3">
          {isLoading ? (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">Loading reviews...</p>
          ) : filteredReviews.length ? (
            filteredReviews.map((review) => (
              <article className="rounded-lg border border-slate-200 bg-white p-4" key={review.id || `${review.destination_slug}-${review.created_at}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-sea">{review.destination_slug}</p>
                    <h3 className="mt-1 font-black">{review.title || 'Untitled review'}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.body || 'No review body.'}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      {review.user_email || 'No user email'} - {review.rating || 0}/5
                    </p>
                  </div>
                  <span className={`rounded-lg px-3 py-2 text-xs font-black ${normalizeStatus(review.status) === 'approved' ? 'bg-emerald-50 text-emerald-700' : normalizeStatus(review.status) === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
                    {normalizeStatus(review.status)}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sea px-3 text-sm font-extrabold text-white disabled:opacity-60" disabled={updatingId === review.id} onClick={() => updateStatus(review, 'approved')} type="button">
                    <FaCheck aria-hidden="true" />
                    Approve
                  </button>
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-3 text-sm font-extrabold text-white disabled:opacity-60" disabled={updatingId === review.id} onClick={() => updateStatus(review, 'rejected')} type="button">
                    <FaTimes aria-hidden="true" />
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">No reviews match this filter.</p>
          )}
        </div>
      </ShellCard>
    </div>
  );
}
