import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaRedoAlt, FaTimes, FaTrash } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const emptyForm = {
  origin: '',
  destination: '',
  transport_type: '',
  duration: '',
  cost_range: '',
  notes: '',
  is_published: true,
};
const routeSelectFields =
  'id, origin, destination, transport_type, duration:estimated_duration, cost_range:estimated_cost, notes:route_notes, is_published, created_at';

function TextField({ label, name, onChange, placeholder, value }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-extrabold text-slate-500">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export default function TransportManager() {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return routes;
    return routes.filter((route) =>
      [route.origin, route.destination, route.transport_type, route.duration, route.cost_range, route.notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [routes, search]);

  async function loadRoutes() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('transport_routes')
      .select(routeSelectFields)
      .order('origin', { ascending: true });

    if (error) {
      setRoutes([]);
      setMessage(`Unable to load transport routes: ${error.message}`);
    } else {
      setRoutes(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
    setMessage('');
  }

  function openEditForm(route) {
    setForm({
      origin: route.origin || '',
      destination: route.destination || '',
      transport_type: route.transport_type || '',
      duration: route.duration || '',
      cost_range: route.cost_range || '',
      notes: route.notes || '',
      is_published: Boolean(route.is_published),
    });
    setEditingId(route.id);
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
    if (!form.origin.trim() || !form.destination.trim()) {
      setMessage('Origin and destination are required.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      transport_type: form.transport_type.trim() || null,
      estimated_duration: form.duration.trim() || null,
      estimated_cost: form.cost_range.trim() || null,
      route_notes: form.notes.trim() || null,
      is_published: Boolean(form.is_published),
    };

    const result = editingId
      ? await supabase.from('transport_routes').update(payload).eq('id', editingId).select(routeSelectFields).single()
      : await supabase.from('transport_routes').insert(payload).select(routeSelectFields).single();

    setIsSaving(false);
    if (result.error) {
      setMessage(`Unable to save route: ${result.error.message}`);
      return;
    }

    closeForm();
    loadRoutes();
  }

  async function togglePublished(route) {
    setMessage('');
    const { error } = await supabase
      .from('transport_routes')
      .update({ is_published: !route.is_published })
      .eq('id', route.id);

    if (error) {
      setMessage(`Unable to update route: ${error.message}`);
      return;
    }
    setRoutes((current) =>
      current.map((item) =>
        item.id === route.id ? { ...item, is_published: !item.is_published } : item,
      ),
    );
  }

  async function deleteRoute(route) {
    const shouldDelete = window.confirm(`Delete ${route.origin} to ${route.destination} permanently?`);
    if (!shouldDelete) return;

    setDeletingId(route.id);
    setMessage('');

    const { error } = await supabase.from('transport_routes').delete().eq('id', route.id);

    setDeletingId(null);
    if (error) {
      setMessage(`Unable to delete route: ${error.message}`);
      return;
    }

    setRoutes((current) => current.filter((item) => item.id !== route.id));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Routes</p>
          <p className="mt-2 text-3xl font-black">{routes.length}</p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-black">
            {routes.filter((route) => route.is_published).length}
          </p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-black">
            {routes.filter((route) => !route.is_published).length}
          </p>
        </ShellCard>
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Transport</p>
            <h2 className="mt-1 text-2xl font-black">Route guide</h2>
            <p className="mt-2 text-sm text-slate-600">
              Maintain origins, destinations, ride types, travel time, costs, and local notes.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search routes, notes, costs"
              type="search"
              value={search}
            />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink" disabled={isLoading} onClick={loadRoutes} type="button">
              <FaRedoAlt aria-hidden="true" />
              Refresh
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-extrabold text-white" onClick={openCreateForm} type="button">
              <FaPlus aria-hidden="true" />
              Add
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {message}
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1fr_1fr_.8fr_.8fr_180px] gap-3 bg-mist px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid">
            <span>Route</span>
            <span>Type</span>
            <span>Cost</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Loading routes...</p>
            ) : filteredRoutes.length ? (
              filteredRoutes.map((route) => (
                <article className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_.8fr_.8fr_180px] lg:items-center" key={route.id}>
                  <div>
                    <h3 className="font-black">{route.origin} to {route.destination}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{route.duration || 'No duration'}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{route.transport_type || 'Transport'}</p>
                  <p className="text-sm text-slate-600">{route.cost_range || 'No cost range'}</p>
                  <span className={`w-fit rounded-lg px-3 py-2 text-xs font-black ${route.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {route.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink disabled:opacity-60" disabled={deletingId === route.id} onClick={() => openEditForm(route)} type="button">Edit</button>
                    <button className="min-h-10 rounded-lg bg-sea px-3 text-sm font-extrabold text-white disabled:opacity-60" disabled={deletingId === route.id} onClick={() => togglePublished(route)} type="button">
                      {route.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-extrabold text-rose-700 disabled:opacity-60" disabled={deletingId === route.id} onClick={() => deleteRoute(route)} title="Delete route" type="button">
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">No routes found.</p>
            )}
          </div>
        </div>
      </ShellCard>

      {isFormOpen && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm" onClick={closeForm} role="presentation">
          <section className="max-h-[calc(100svh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-travel sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">{editingId ? 'Edit route' : 'New route'}</p>
                <h2 className="mt-1 text-2xl font-black">{editingId ? 'Update transport route' : 'Add transport route'}</h2>
              </div>
              <button aria-label="Close route form" className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200" onClick={closeForm} type="button">
                <FaTimes aria-hidden="true" />
              </button>
            </div>
            {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Origin" name="origin" onChange={handleChange} placeholder="Sorsogon City" value={form.origin} />
                <TextField label="Destination" name="destination" onChange={handleChange} placeholder="Bulusan" value={form.destination} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Transport type" name="transport_type" onChange={handleChange} placeholder="Van / Jeepney / Boat" value={form.transport_type} />
                <TextField label="Duration" name="duration" onChange={handleChange} placeholder="1.5 hours" value={form.duration} />
              </div>
              <TextField label="Cost range" name="cost_range" onChange={handleChange} placeholder="PHP 80 - 150" value={form.cost_range} />
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Notes</span>
                <textarea className="min-h-28 resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" name="notes" onChange={handleChange} placeholder="Schedule, terminal, or local reminders" value={form.notes} />
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg bg-mist px-3 text-sm font-extrabold text-ink">
                <input checked={form.is_published} className="size-4 accent-teal-700" name="is_published" onChange={handleChange} type="checkbox" />
                Publish route
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add route'}
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
