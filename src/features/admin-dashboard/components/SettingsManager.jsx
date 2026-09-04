import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaRedoAlt, FaTimes, FaTrash } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const emptyForm = { key: '', value: '', description: '' };

export default function SettingsManager() {
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const settingsByKey = useMemo(() => {
    return settings.reduce((map, item) => {
      map[item.key] = item.value;
      return map;
    }, {});
  }, [settings]);

  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return settings;

    return settings.filter((setting) =>
      [setting.key, setting.value, setting.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, settings]);

  async function loadSettings() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, description, updated_at')
      .order('key', { ascending: true });

    if (error) {
      setSettings([]);
      setMessage(`Unable to load settings: ${error.message}`);
    } else {
      setSettings(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingKey('');
    setIsFormOpen(true);
    setMessage('');
  }

  function openEditForm(setting) {
    setForm({
      key: setting.key || '',
      value: setting.value || '',
      description: setting.description || '',
    });
    setEditingKey(setting.key);
    setIsFormOpen(true);
    setMessage('');
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingKey('');
    setIsFormOpen(false);
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.key.trim()) {
      setMessage('Setting key is required.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    const payload = {
      key: form.key.trim(),
      value: form.value.trim(),
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingKey
      ? await supabase.from('site_settings').update(payload).eq('key', editingKey).select().single()
      : await supabase.from('site_settings').insert(payload).select().single();

    setIsSaving(false);
    if (result.error) {
      setMessage(`Unable to save setting: ${result.error.message}`);
      return;
    }

    closeForm();
    loadSettings();
  }

  async function deleteSetting(setting) {
    const shouldDelete = window.confirm(`Delete ${setting.key} permanently?`);
    if (!shouldDelete) return;

    setDeletingKey(setting.key);
    setMessage('');

    const { error } = await supabase.from('site_settings').delete().eq('key', setting.key);

    setDeletingKey('');
    if (error) {
      setMessage(`Unable to delete setting: ${error.message}`);
      return;
    }

    setSettings((current) => current.filter((item) => item.key !== setting.key));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Settings</p>
          <p className="mt-2 text-3xl font-black">{settings.length}</p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Submissions</p>
          <p className="mt-2 text-xl font-black">
            {settingsByKey.submissions_enabled || 'not set'}
          </p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Reviews</p>
          <p className="mt-2 text-xl font-black">
            {settingsByKey.reviews_enabled || 'not set'}
          </p>
        </ShellCard>
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Settings</p>
            <h2 className="mt-1 text-2xl font-black">Site configuration</h2>
            <p className="mt-2 text-sm text-slate-600">
              Store simple key/value controls for feature flags and dashboard copy.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search settings"
              type="search"
              value={search}
            />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink" disabled={isLoading} onClick={loadSettings} type="button">
              <FaRedoAlt aria-hidden="true" />
              Refresh
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-extrabold text-white" onClick={openCreateForm} type="button">
              <FaPlus aria-hidden="true" />
              Add
            </button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

        <div className="mt-6 grid gap-3">
          {isLoading ? (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">Loading settings...</p>
          ) : filteredSettings.length ? (
            filteredSettings.map((setting) => (
              <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto] md:items-center" key={setting.key}>
                <div>
                  <h3 className="font-black">{setting.key}</h3>
                  <p className="mt-1 text-sm text-slate-600">{setting.description || 'No description'}</p>
                </div>
                <p className="break-words rounded-lg bg-mist p-3 text-sm font-semibold text-ink">{setting.value || 'empty'}</p>
                <div className="flex flex-wrap gap-2">
                  <button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-extrabold text-ink disabled:opacity-60" disabled={deletingKey === setting.key} onClick={() => openEditForm(setting)} type="button">Edit</button>
                  <button className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-extrabold text-rose-700 disabled:opacity-60" disabled={deletingKey === setting.key} onClick={() => deleteSetting(setting)} title="Delete setting" type="button">
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
              No settings found. Add keys such as submissions_enabled, reviews_enabled, or featured_section_title.
            </p>
          )}
        </div>
      </ShellCard>

      {isFormOpen && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm" onClick={closeForm} role="presentation">
          <section className="w-full max-w-xl rounded-lg bg-white p-5 shadow-travel sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-sea">{editingKey ? 'Edit setting' : 'New setting'}</p>
                <h2 className="mt-1 text-2xl font-black">Configuration value</h2>
              </div>
              <button aria-label="Close setting form" className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-ink transition hover:bg-slate-200" onClick={closeForm} type="button">
                <FaTimes aria-hidden="true" />
              </button>
            </div>
            {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Key</span>
                <input className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" disabled={Boolean(editingKey)} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} placeholder="submissions_enabled" value={form.key} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Value</span>
                <input className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder="true" value={form.value} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-extrabold text-slate-500">Description</span>
                <textarea className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this setting controls" value={form.description} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-extrabold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Save setting'}</button>
                <button className="min-h-11 rounded-lg border border-slate-200 px-4 font-extrabold text-ink" onClick={closeForm} type="button">Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
