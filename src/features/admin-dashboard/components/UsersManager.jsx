import React, { useEffect, useMemo, useState } from 'react';
import { FaRedoAlt, FaSave } from 'react-icons/fa';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

const roles = ['user', 'admin'];
const roleFilters = ['all', 'admin', 'user'];

export default function UsersManager() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      const normalizedRole = profile.role || 'user';
      const matchesRole = roleFilter === 'all' || normalizedRole === roleFilter;
      const matchesSearch =
        !query ||
        [profile.display_name, profile.role, profile.home_city, profile.id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesRole && matchesSearch;
    });
  }, [profiles, roleFilter, search]);

  async function loadProfiles() {
    if (!supabase) return;
    setIsLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role, home_city, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setProfiles([]);
      setMessage(`Unable to load users: ${error.message}`);
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function updateRole(profile, role) {
    setUpdatingId(profile.id);
    setMessage('');

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profile.id)
      .select('id, display_name, role, home_city, created_at')
      .single();

    setUpdatingId(null);
    if (error) {
      setMessage(`Unable to update role: ${error.message}`);
      return;
    }
    setProfiles((current) => current.map((item) => (item.id === profile.id ? data : item)));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Users</p>
          <p className="mt-2 text-3xl font-black">{profiles.length}</p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Admins</p>
          <p className="mt-2 text-3xl font-black">
            {profiles.filter((profile) => profile.role === 'admin').length}
          </p>
        </ShellCard>
        <ShellCard>
          <p className="text-xs font-black uppercase text-slate-500">Travelers</p>
          <p className="mt-2 text-3xl font-black">
            {profiles.filter((profile) => profile.role !== 'admin').length}
          </p>
        </ShellCard>
      </section>

      <ShellCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Users</p>
            <h2 className="mt-1 text-2xl font-black">Accounts and roles</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review profile rows and update dashboard access roles.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 md:w-72" onChange={(event) => setSearch(event.target.value)} placeholder="Search users" type="search" value={search} />
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-sea focus:ring-2 focus:ring-sea/20"
              onChange={(event) => setRoleFilter(event.target.value)}
              value={roleFilter}
            >
              {roleFilters.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All roles' : role}
                </option>
              ))}
            </select>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink" disabled={isLoading} onClick={loadProfiles} type="button">
              <FaRedoAlt aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1fr_.8fr_.7fr_180px] gap-3 bg-mist px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid">
            <span>User</span>
            <span>Home city</span>
            <span>Role</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Loading users...</p>
            ) : filteredProfiles.length ? (
              filteredProfiles.map((profile) => (
                <article className="grid gap-4 p-4 lg:grid-cols-[1fr_.8fr_.7fr_180px] lg:items-center" key={profile.id}>
                  <div>
                    <h3 className="font-black">{profile.display_name || 'Unnamed user'}</h3>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">{profile.id}</p>
                  </div>
                  <p className="text-sm text-slate-600">{profile.home_city || 'No home city'}</p>
                  <select className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-sea focus:ring-2 focus:ring-sea/20" disabled={updatingId === profile.id} onChange={(event) => updateRole(profile, event.target.value)} value={profile.role || 'user'}>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <span className="inline-flex min-h-10 items-center gap-2 text-sm font-extrabold text-slate-500">
                    <FaSave aria-hidden="true" />
                    {updatingId === profile.id ? 'Saving...' : 'Auto-saves'}
                  </span>
                </article>
              ))
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">No users match the current filters.</p>
            )}
          </div>
        </div>
      </ShellCard>
    </div>
  );
}
