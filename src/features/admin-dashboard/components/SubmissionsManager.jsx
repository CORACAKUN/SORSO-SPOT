import React, { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaEye, FaFilter, FaRedoAlt, FaTimes } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const statusOptions = ['all', 'pending', 'approved', 'rejected'];
const draftableTypes = new Set(['destination', 'accommodation']);

function normalizeStatus(value) {
  return String(value || 'pending').trim().toLowerCase();
}

function normalizeType(value) {
  return String(value || '').trim().toLowerCase();
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SubmissionsManager() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [message, setMessage] = useState('');

  const submissionTypes = useMemo(() => {
    return ['all', ...new Set(submissions.map((item) => item.submission_type).filter(Boolean))];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesStatus =
        statusFilter === 'all' || normalizeStatus(submission.status) === statusFilter;
      const matchesType =
        typeFilter === 'all' || normalizeType(submission.submission_type) === normalizeType(typeFilter);
      return matchesStatus && matchesType;
    });
  }, [statusFilter, submissions, typeFilter]);

  const statusCounts = useMemo(() => {
    return submissions.reduce(
      (counts, submission) => {
        const status = normalizeStatus(submission.status);
        counts[status] = (counts[status] || 0) + 1;
        counts.total += 1;
        return counts;
      },
      { approved: 0, pending: 0, rejected: 0, total: 0 },
    );
  }, [submissions]);

  async function loadSubmissions() {
    if (!supabase) {
      setIsLoading(false);
      setMessage('Supabase is not configured yet.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('submissions')
      .select('id, submission_type, name, municipality, description, contact_info, status, submitted_at, submitter_email')
      .order('submitted_at', { ascending: false });

    if (error) {
      setSubmissions([]);
      setMessage(`Unable to load submissions: ${error.message}`);
    } else {
      setSubmissions(data || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function updateSubmissionStatus(submission, nextStatus) {
    if (!submission.id) {
      setMessage('This submission has no id, so it cannot be updated from the dashboard.');
      return;
    }

    setUpdatingId(submission.id);
    setMessage('');

    const { data, error } = await supabase
      .from('submissions')
      .update({ status: nextStatus })
      .eq('id', submission.id)
      .select('id, submission_type, name, municipality, description, contact_info, status, submitted_at, submitter_email')
      .single();

    setUpdatingId(null);

    if (error) {
      setMessage(`Unable to update submission: ${error.message}`);
      return;
    }

    setSubmissions((current) =>
      current.map((item) => (item.id === submission.id ? data : item)),
    );
    setSelectedSubmission((current) => (current?.id === submission.id ? data : current));
  }

  async function createDraftListing(submission) {
    const submissionType = normalizeType(submission.submission_type);
    if (!draftableTypes.has(submissionType)) {
      setMessage('Only destination and accommodation submissions can be converted into draft listings.');
      return;
    }

    if (!submission.name?.trim() || !submission.municipality?.trim()) {
      setMessage('Name and municipality are required before creating a draft listing.');
      return;
    }

    setConvertingId(submission.id);
    setMessage('');

    const table = submissionType === 'accommodation' ? 'accommodations' : 'destinations';
    const payload =
      submissionType === 'accommodation'
        ? {
            name: submission.name.trim(),
            municipality: submission.municipality.trim(),
            accommodation_type: 'Traveler submission',
            amenities: submission.description?.trim() || null,
            contact_info: submission.contact_info?.trim() || null,
            is_published: false,
          }
        : {
            name: submission.name.trim(),
            slug: createSlug(submission.name),
            municipality: submission.municipality.trim(),
            category: 'Traveler submission',
            description: submission.description?.trim() || null,
            contact_info: submission.contact_info?.trim() || null,
            is_featured: false,
            is_published: false,
          };

    const { error: insertError } = await supabase.from(table).insert(payload);

    if (insertError) {
      setConvertingId(null);
      setMessage(`Unable to create ${submissionType} draft: ${insertError.message}`);
      return;
    }

    const { data, error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submission.id)
      .select('id, submission_type, name, municipality, description, contact_info, status, submitted_at, submitter_email')
      .single();

    setConvertingId(null);

    if (updateError) {
      setMessage(`Draft created, but submission status was not updated: ${updateError.message}`);
      return;
    }

    setSubmissions((current) =>
      current.map((item) => (item.id === submission.id ? data : item)),
    );
    setSelectedSubmission((current) => (current?.id === submission.id ? data : current));
    setMessage(`${submission.name} was created as an unpublished ${submissionType} draft.`);
  }

  function renderStatusBadge(statusValue) {
    const status = normalizeStatus(statusValue);
    const classes = {
      approved: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-amber-50 text-amber-800',
      rejected: 'bg-rose-50 text-rose-700',
    };

    return (
      <span className={`w-fit rounded-lg px-3 py-2 text-xs font-black ${classes[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', statusCounts.total],
          ['Pending', statusCounts.pending],
          ['Approved', statusCounts.approved],
          ['Rejected', statusCounts.rejected],
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
            <p className="text-xs font-black uppercase text-sea">Submissions</p>
            <h2 className="mt-1 text-2xl font-black">Review queue</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Moderate traveler-submitted places before turning them into public destination,
              accommodation, or transport listings.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink"
            disabled={isLoading}
            onClick={loadSubmissions}
            type="button"
          >
            <FaRedoAlt aria-hidden="true" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="grid gap-1 sm:w-52">
            <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500">
              <FaFilter aria-hidden="true" />
              Status
            </span>
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 sm:w-60">
            <span className="text-sm font-extrabold text-slate-500">Type</span>
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
              onChange={(event) => setTypeFilter(event.target.value)}
              value={typeFilter}
            >
              {submissionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {message}
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1fr_.8fr_.8fr_.7fr_180px] gap-3 bg-mist px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid">
            <span>Name</span>
            <span>Type</span>
            <span>Municipality</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Loading submissions...</p>
            ) : filteredSubmissions.length ? (
              filteredSubmissions.map((submission) => {
                const submissionType = normalizeType(submission.submission_type);
                const canCreateDraft = draftableTypes.has(submissionType);

                return (
                <article
                  className="grid gap-4 p-4 lg:grid-cols-[1fr_.8fr_.8fr_.7fr_180px] lg:items-center"
                  key={submission.id || `${submission.name}-${submission.submitted_at}`}
                >
                  <div>
                    <h3 className="font-black">{submission.name || 'Untitled submission'}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {submission.submitter_email || 'No submitter email'} -{' '}
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleDateString()
                        : 'No date'}
                    </p>
                    {submission.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {submission.description}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {submission.submission_type || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {submission.municipality || 'No municipality'}
                  </p>
                  {renderStatusBadge(submission.status)}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink"
                      onClick={() => setSelectedSubmission(submission)}
                      type="button"
                    >
                      <FaEye aria-hidden="true" />
                      View
                    </button>
                    {canCreateDraft && (
                      <button
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-3 text-sm font-extrabold text-white disabled:opacity-60"
                        disabled={convertingId === submission.id || updatingId === submission.id}
                        onClick={() => createDraftListing(submission)}
                        type="button"
                      >
                        <FaCheck aria-hidden="true" />
                        Draft
                      </button>
                    )}
                    <button
                      className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-sea px-3 text-sm font-extrabold text-white disabled:opacity-60"
                      disabled={updatingId === submission.id || convertingId === submission.id}
                      onClick={() => updateSubmissionStatus(submission, 'approved')}
                      title="Approve submission"
                      type="button"
                    >
                      <FaCheck aria-hidden="true" />
                    </button>
                    <button
                      className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-rose-600 px-3 text-sm font-extrabold text-white disabled:opacity-60"
                      disabled={updatingId === submission.id || convertingId === submission.id}
                      onClick={() => updateSubmissionStatus(submission, 'rejected')}
                      title="Reject submission"
                      type="button"
                    >
                      <FaTimes aria-hidden="true" />
                    </button>
                  </div>
                </article>
                );
              })
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">
                No submissions match the current filters.
              </p>
            )}
          </div>
        </div>
      </ShellCard>

      {selectedSubmission && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedSubmission(null)}
          role="presentation"
        >
          <section
            className="max-h-[calc(100svh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-travel sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">
                  {selectedSubmission.submission_type || 'Submission'}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {selectedSubmission.name || 'Untitled submission'}
                </h2>
              </div>
              <button
                aria-label="Close submission details"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200"
                onClick={() => setSelectedSubmission(null)}
                type="button"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Status', normalizeStatus(selectedSubmission.status)],
                ['Municipality', selectedSubmission.municipality],
                ['Description', selectedSubmission.description],
                ['Contact info', selectedSubmission.contact_info],
                ['Submitter', selectedSubmission.submitter_email],
                [
                  'Submitted',
                  selectedSubmission.submitted_at
                    ? new Date(selectedSubmission.submitted_at).toLocaleString()
                    : '',
                ],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div className="rounded-lg bg-mist p-4" key={label}>
                    <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-ink">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 text-sm font-extrabold text-white disabled:opacity-60"
                disabled={updatingId === selectedSubmission.id || convertingId === selectedSubmission.id}
                onClick={() => updateSubmissionStatus(selectedSubmission, 'approved')}
                type="button"
              >
                <FaCheck aria-hidden="true" />
                Approve
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-extrabold text-white disabled:opacity-60"
                disabled={updatingId === selectedSubmission.id || convertingId === selectedSubmission.id}
                onClick={() => updateSubmissionStatus(selectedSubmission, 'rejected')}
                type="button"
              >
                <FaTimes aria-hidden="true" />
                Reject
              </button>
              {draftableTypes.has(normalizeType(selectedSubmission.submission_type)) && (
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-extrabold text-white disabled:opacity-60"
                  disabled={updatingId === selectedSubmission.id || convertingId === selectedSubmission.id}
                  onClick={() => createDraftListing(selectedSubmission)}
                  type="button"
                >
                  <FaCheck aria-hidden="true" />
                  {convertingId === selectedSubmission.id ? 'Creating...' : 'Create draft listing'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
