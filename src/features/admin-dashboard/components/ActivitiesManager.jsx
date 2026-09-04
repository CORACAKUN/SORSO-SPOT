import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaRedoAlt, FaTimes, FaTrash } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const emptyForm = {
  name: '',
  slug: '',
  destination_slug: '',
  activity_type: '',
  difficulty: '',
  estimated_cost: '',
  season: '',
  description: '',
  safety_notes: '',
  is_published: true,
};

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function TextField({ label, name, onChange, placeholder, required = false, value }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-extrabold text-slate-500">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

export default function ActivitiesManager() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activities;

    return activities.filter((activity) =>
      [
        activity.name,
        activity.slug,
        activity.destination_slug,
        activity.activity_type,
        activity.difficulty,
        activity.season,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [activities, search]);

  async function loadActivities() {
    if (!supabase) return;

    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('activities')
      .select(
        'id, destination_slug, name, slug, activity_type, difficulty, estimated_cost, season, description, safety_notes, is_published, created_at',
      )
      .order('name', { ascending: true });

    if (error) {
      setActivities([]);
      setMessage(`Unable to load activities: ${error.message}`);
    } else {
      setActivities(data || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadActivities();
  }, []);

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && !editingId ? { slug: createSlug(value) } : {}),
    }));
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
    setMessage('');
  }

  function openEditForm(activity) {
    setForm({
      name: activity.name || '',
      slug: activity.slug || '',
      destination_slug: activity.destination_slug || '',
      activity_type: activity.activity_type || '',
      difficulty: activity.difficulty || '',
      estimated_cost: activity.estimated_cost || '',
      season: activity.season || '',
      description: activity.description || '',
      safety_notes: activity.safety_notes || '',
      is_published: Boolean(activity.is_published),
    });
    setEditingId(activity.id);
    setIsFormOpen(true);
    setMessage('');
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: createSlug(form.slug || form.name),
      destination_slug: form.destination_slug.trim() || null,
      activity_type: form.activity_type.trim() || null,
      difficulty: form.difficulty.trim() || null,
      estimated_cost: form.estimated_cost.trim() || null,
      season: form.season.trim() || null,
      description: form.description.trim() || null,
      safety_notes: form.safety_notes.trim() || null,
      is_published: Boolean(form.is_published),
    };

    if (!payload.name || !payload.slug) {
      setMessage('Name and slug are required.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const result = editingId
      ? await supabase.from('activities').update(payload).eq('id', editingId).select().single()
      : await supabase.from('activities').insert(payload).select().single();

    setIsSaving(false);
    if (result.error) {
      setMessage(`Unable to save activity: ${result.error.message}`);
      return;
    }

    closeForm();
    loadActivities();
  }

  async function togglePublished(activity) {
    setMessage('');
    const { error } = await supabase
      .from('activities')
      .update({ is_published: !activity.is_published })
      .eq('id', activity.id);

    if (error) {
      setMessage(`Unable to update activity: ${error.message}`);
      return;
    }

    setActivities((current) =>
      current.map((item) =>
        item.id === activity.id ? { ...item, is_published: !item.is_published } : item,
      ),
    );
  }

  async function deleteActivity(activity) {
    const shouldDelete = window.confirm(`Delete ${activity.name} permanently?`);
    if (!shouldDelete) return;

    setDeletingId(activity.id);
    setMessage('');

    const { error } = await supabase.from('activities').delete().eq('id', activity.id);

    setDeletingId(null);
    if (error) {
      setMessage(`Unable to delete activity: ${error.message}`);
      return;
    }

    setActivities((current) => current.filter((item) => item.id !== activity.id));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Activities</p>
          <p className="mt-2 text-3xl font-black">{activities.length}</p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-black">
            {activities.filter((activity) => activity.is_published).length}
          </p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-black">
            {activities.filter((activity) => !activity.is_published).length}
          </p>
        </ShellCard>
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Activities</p>
            <h2 className="mt-1 text-2xl font-black">Tours and things to do</h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage activity cards shown on the public adventure section.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activities"
              type="search"
              value={search}
            />
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink"
              disabled={isLoading}
              onClick={loadActivities}
              type="button"
            >
              <FaRedoAlt aria-hidden="true" />
              Refresh
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-extrabold text-white"
              onClick={openCreateForm}
              type="button"
            >
              <FaPlus aria-hidden="true" />
              Add
            </button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1fr_.8fr_.8fr_.8fr_190px] gap-3 bg-mist px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid">
            <span>Activity</span>
            <span>Type</span>
            <span>Season</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Loading activities...</p>
            ) : filteredActivities.length ? (
              filteredActivities.map((activity) => (
                <article className="grid gap-4 p-4 lg:grid-cols-[1fr_.8fr_.8fr_.8fr_190px] lg:items-center" key={activity.id}>
                  <div>
                    <h3 className="font-black">{activity.name}</h3>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                      {activity.slug || 'No slug'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {activity.activity_type || activity.difficulty || 'Activity'}
                  </p>
                  <p className="text-sm text-slate-600">{activity.season || 'Any season'}</p>
                  <span className={`w-fit rounded-lg px-3 py-2 text-xs font-black ${activity.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {activity.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink disabled:opacity-60" disabled={deletingId === activity.id} onClick={() => openEditForm(activity)} type="button">Edit</button>
                    <button className="min-h-10 rounded-lg bg-sea px-3 text-sm font-extrabold text-white disabled:opacity-60" disabled={deletingId === activity.id} onClick={() => togglePublished(activity)} type="button">
                      {activity.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-extrabold text-rose-700 disabled:opacity-60" disabled={deletingId === activity.id} onClick={() => deleteActivity(activity)} title="Delete activity" type="button">
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">No activities found.</p>
            )}
          </div>
        </div>
      </ShellCard>

      {isFormOpen && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm" onClick={closeForm} role="presentation">
          <section className="max-h-[calc(100svh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-travel sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">{editingId ? 'Edit activity' : 'New activity'}</p>
                <h2 className="mt-1 text-2xl font-black">{editingId ? 'Update activity' : 'Add activity'}</h2>
              </div>
              <button aria-label="Close activity form" className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200" onClick={closeForm} type="button">
                <FaTimes aria-hidden="true" />
              </button>
            </div>
            {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" name="name" onChange={handleChange} placeholder="Whale shark watching" required value={form.name} />
                <TextField label="Slug" name="slug" onChange={handleChange} placeholder="whale-shark-watching" required value={form.slug} />
              </div>
              <TextField label="Destination slug" name="destination_slug" onChange={handleChange} placeholder="donsol-whale-shark" value={form.destination_slug} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Activity type" name="activity_type" onChange={handleChange} placeholder="Marine wildlife" value={form.activity_type} />
                <TextField label="Difficulty" name="difficulty" onChange={handleChange} placeholder="Beginner friendly" value={form.difficulty} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Estimated cost" name="estimated_cost" onChange={handleChange} placeholder="PHP 3,500 per boat" value={form.estimated_cost} />
                <TextField label="Season" name="season" onChange={handleChange} placeholder="November to June" value={form.season} />
              </div>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Description</span>
                <textarea className="min-h-28 resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" name="description" onChange={handleChange} placeholder="Short description shown on the public site" value={form.description} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Safety notes</span>
                <textarea className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" name="safety_notes" onChange={handleChange} placeholder="Guide requirements, weather reminders, or restrictions" value={form.safety_notes} />
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg bg-mist px-3 text-sm font-extrabold text-ink">
                <input checked={form.is_published} className="size-4 accent-teal-700" name="is_published" onChange={handleChange} type="checkbox" />
                Publish activity
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add activity'}
                </button>
                <button className="min-h-11 rounded-lg border border-slate-200 px-4 font-extrabold text-ink" onClick={closeForm} type="button">Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
