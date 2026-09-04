import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaRedoAlt, FaTimes } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const emptyForm = {
  name: '',
  municipality: '',
  accommodation_type: '',
  price_range: '',
  amenities: '',
  contact_info: '',
  latitude: '',
  longitude: '',
  image_url: '',
  is_published: true,
};

function TextField({ label, name, onChange, placeholder, step, value, type = 'text' }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-extrabold text-slate-500">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

export default function AccommodationsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.municipality, item.accommodation_type]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [items, search]);

  async function loadItems() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('accommodations')
      .select('id, name, municipality, accommodation_type, price_range, amenities, contact_info, latitude, longitude, image_url, is_published, created_at')
      .order('name', { ascending: true });

    if (error) {
      setItems([]);
      setMessage(`Unable to load accommodations: ${error.message}`);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadItems();
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

  function openEditForm(item) {
    setForm({
      name: item.name || '',
      municipality: item.municipality || '',
      accommodation_type: item.accommodation_type || '',
      price_range: item.price_range || '',
      amenities: item.amenities || '',
      contact_info: item.contact_info || '',
      latitude: item.latitude ?? '',
      longitude: item.longitude ?? '',
      image_url: item.image_url || '',
      is_published: Boolean(item.is_published),
    });
    setEditingId(item.id);
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
    if (!form.name.trim() || !form.municipality.trim()) {
      setMessage('Name and municipality are required.');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      municipality: form.municipality.trim(),
      accommodation_type: form.accommodation_type.trim() || null,
      price_range: form.price_range.trim() || null,
      amenities: form.amenities.trim() || null,
      contact_info: form.contact_info.trim() || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      image_url: form.image_url.trim() || null,
    };

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
      ? await supabase.from('accommodations').update(payload).eq('id', editingId).select().single()
      : await supabase.from('accommodations').insert(payload).select().single();

    setIsSaving(false);
    if (result.error) {
      setMessage(`Unable to save accommodation: ${result.error.message}`);
      return;
    }

    closeForm();
    loadItems();
  }

  async function togglePublished(item) {
    setMessage('');
    const { error } = await supabase
      .from('accommodations')
      .update({ is_published: !item.is_published })
      .eq('id', item.id);

    if (error) {
      setMessage(`Unable to update accommodation: ${error.message}`);
      return;
    }
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, is_published: !entry.is_published } : entry,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-black">{items.length}</p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-black">
            {items.filter((item) => item.is_published).length}
          </p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-black">
            {items.filter((item) => !item.is_published).length}
          </p>
        </ShellCard>
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Accommodations</p>
            <h2 className="mt-1 text-2xl font-black">Stay listings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage hotels, resorts, inns, and homestays shown to travelers.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stays"
              type="search"
              value={search}
            />
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink"
              disabled={isLoading}
              onClick={loadItems}
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

        {message && (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {message}
          </p>
        )}

        <div className="mt-6 grid gap-3">
          {isLoading ? (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
              Loading accommodations...
            </p>
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <article
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[96px_1fr_.8fr_180px] lg:items-center"
                key={item.id}
              >
                <img
                  alt=""
                  className="h-20 w-full rounded-lg bg-mist object-cover lg:h-16"
                  src={item.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                />
                <div>
                  <h3 className="font-black">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.municipality} - {item.accommodation_type || 'Stay'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.price_range || 'No price range'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))
                      ? `${item.latitude}, ${item.longitude}`
                      : 'No coordinates'}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-lg px-3 py-2 text-xs font-black ${
                    item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.is_published ? 'Published' : 'Draft'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink"
                    onClick={() => openEditForm(item)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="min-h-10 rounded-lg bg-sea px-3 text-sm font-extrabold text-white"
                    onClick={() => togglePublished(item)}
                    type="button"
                  >
                    {item.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
              No accommodations found.
            </p>
          )}
        </div>
      </ShellCard>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onClick={closeForm}
          role="presentation"
        >
          <section
            className="max-h-[calc(100svh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-travel sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">
                  {editingId ? 'Edit accommodation' : 'New accommodation'}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {editingId ? 'Update stay listing' : 'Add stay listing'}
                </h2>
              </div>
              <button
                aria-label="Close accommodation form"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200"
                onClick={closeForm}
                type="button"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {message && (
              <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                {message}
              </p>
            )}

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" name="name" onChange={handleChange} placeholder="Hotel name" value={form.name} />
                <TextField label="Municipality" name="municipality" onChange={handleChange} placeholder="Sorsogon City" value={form.municipality} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Type" name="accommodation_type" onChange={handleChange} placeholder="Resort / Hotel / Homestay" value={form.accommodation_type} />
                <TextField label="Price range" name="price_range" onChange={handleChange} placeholder="PHP 1,500 - 3,000" value={form.price_range} />
              </div>
              <TextField label="Amenities" name="amenities" onChange={handleChange} placeholder="WiFi, parking, pool" value={form.amenities} />
              <TextField label="Contact info" name="contact_info" onChange={handleChange} placeholder="Phone or Facebook page" value={form.contact_info} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Latitude" name="latitude" onChange={handleChange} placeholder="12.9742" step="any" type="number" value={form.latitude} />
                <TextField label="Longitude" name="longitude" onChange={handleChange} placeholder="123.9937" step="any" type="number" value={form.longitude} />
              </div>
              <TextField label="Image URL" name="image_url" onChange={handleChange} placeholder="https://example.com/photo.jpg" type="url" value={form.image_url} />
              <label className="flex min-h-11 items-center gap-3 rounded-lg bg-mist px-3 text-sm font-extrabold text-ink">
                <input checked={form.is_published} className="size-4 accent-teal-700" name="is_published" onChange={handleChange} type="checkbox" />
                Publish listing
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add accommodation'}
                </button>
                <button className="min-h-11 rounded-lg border border-slate-200 px-4 font-extrabold text-ink" onClick={closeForm} type="button">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
