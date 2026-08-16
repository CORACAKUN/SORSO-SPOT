import React, { useEffect, useMemo, useState } from 'react';
import { FaRedoAlt } from 'react-icons/fa';
import GoogleMapDemo from '../../../components/GoogleMapDemo.jsx';
import ShellCard from '../../../components/shared/ShellCard.jsx';
import { supabase } from '../../../lib/supabaseClient';

export default function MapManager() {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const mappedDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      return Number.isFinite(Number(destination.latitude)) && Number.isFinite(Number(destination.longitude));
    });
  }, [destinations]);

  const missingCoordinateDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      return !Number.isFinite(Number(destination.latitude)) || !Number.isFinite(Number(destination.longitude));
    });
  }, [destinations]);

  const draftDestinations = useMemo(() => {
    return destinations.filter((destination) => !destination.is_published);
  }, [destinations]);

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
      .select(
        'name, slug, municipality, category, description, address, best_time, opening_hours, entrance_fee, contact_info, travel_tips, latitude, longitude, image_url, is_featured, is_published',
      )
      .order('name', { ascending: true });

    if (error) {
      setMessage(`Unable to load map destinations: ${error.message}`);
      setDestinations([]);
    } else {
      setDestinations(data || []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDestinations();
  }, []);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Total places', destinations.length],
          ['On map', mappedDestinations.length],
          ['Missing coordinates', missingCoordinateDestinations.length],
          ['Drafts', draftDestinations.length],
        ].map(([label, value]) => (
          <ShellCard key={label}>
            <p className="text-xs font-black uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </ShellCard>
        ))}
      </section>

      <ShellCard>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-sea">Map coverage</p>
            <h2 className="mt-1 text-2xl font-black">Destination map</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Review mapped destinations, check coordinate gaps, and inspect draft places before
              publishing them to travelers.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-ink"
            disabled={isLoading}
            onClick={loadDestinations}
            type="button"
          >
            <FaRedoAlt aria-hidden="true" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {message && (
          <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {message}
          </p>
        )}

        <GoogleMapDemo destinations={mappedDestinations} />
      </ShellCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <ShellCard>
          <p className="text-xs font-black uppercase text-sea">Needs coordinates</p>
          <h2 className="mt-1 text-xl font-black">Not shown on map</h2>
          <div className="mt-4 grid gap-3">
            {isLoading ? (
              <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
                Loading coordinate checks...
              </p>
            ) : missingCoordinateDestinations.length ? (
              missingCoordinateDestinations.map((destination) => (
                <article className="rounded-lg bg-mist p-4" key={destination.slug}>
                  <h3 className="font-black">{destination.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {destination.municipality || 'No municipality'} -{' '}
                    {destination.category || 'No category'}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase text-slate-500">
                    Add latitude and longitude in Destinations
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
                All destinations have coordinates.
              </p>
            )}
          </div>
        </ShellCard>

        <ShellCard>
          <p className="text-xs font-black uppercase text-sea">Publication</p>
          <h2 className="mt-1 text-xl font-black">Draft places</h2>
          <div className="mt-4 grid gap-3">
            {isLoading ? (
              <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
                Loading publication checks...
              </p>
            ) : draftDestinations.length ? (
              draftDestinations.map((destination) => (
                <article className="rounded-lg bg-mist p-4" key={destination.slug}>
                  <h3 className="font-black">{destination.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {destination.municipality || 'No municipality'} -{' '}
                    {destination.category || 'No category'}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase text-slate-500">
                    Drafts are visible here for admin review
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-mist p-4 text-sm font-semibold text-slate-600">
                No draft destinations.
              </p>
            )}
          </div>
        </ShellCard>
      </section>
    </div>
  );
}
