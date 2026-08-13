import React, { useEffect, useRef, useState } from 'react';

const sorsogonCenter = { lat: 12.9731, lng: 123.9935 };
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const fallbackImage =
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80';

let googleMapsPromise;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error('Google Maps failed to load.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

export default function GoogleMapDemo({ destinations }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markerRefs = useRef({});
  const [error, setError] = useState('');
  const validDestinations = destinations.filter((destination) => {
    return Number.isFinite(Number(destination.latitude)) && Number.isFinite(Number(destination.longitude));
  });

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function createPopupContent(destination) {
    return `
      <div class="sorso-map-card" style="width: 260px; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #13201f;">
        <img
          src="${escapeHtml(destination.image_url || fallbackImage)}"
          alt=""
          style="width: 100%; height: 112px; object-fit: cover; border-radius: 8px 8px 0 0; display: block;"
        />
        <div style="padding: 12px 14px 14px;">
          <p style="margin: 0 0 4px; color: #116d75; font-size: 11px; font-weight: 900; text-transform: uppercase;">
            ${escapeHtml(destination.municipality || 'Sorsogon')} - ${escapeHtml(destination.category || 'Tourist spot')}
          </p>
          <strong style="display: block; font-size: 17px; line-height: 1.15;">${escapeHtml(destination.name)}</strong>
          <p style="margin: 8px 0 0; color: #5d6a67; font-size: 13px;">
            Best time: ${escapeHtml(destination.best_time || 'Year-round')}
          </p>
          <button
            type="button"
            style="margin-top: 12px; width: 100%; border: 0; border-radius: 8px; background: #116d75; color: white; min-height: 36px; font-weight: 900; cursor: default;"
          >
            View details
          </button>
        </div>
      </div>
    `;
  }

  function openDestination(destination) {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    const marker = markerRefs.current[destination.slug];

    if (!map || !infoWindow || !marker) return;

    const position = {
      lat: Number(destination.latitude),
      lng: Number(destination.longitude),
    };

    map.panTo(position);
    map.setZoom(Math.max(map.getZoom(), 11));
    infoWindow.setContent(createPopupContent(destination));
    infoWindow.open(map, marker);
  }

  useEffect(() => {
    let isMounted = true;

    async function initializeMap() {
      if (!googleMapsApiKey) {
        setError('Add VITE_GOOGLE_MAPS_API_KEY to .env to enable the Google Maps demo.');
        return;
      }

      try {
        const maps = await loadGoogleMaps();
        if (!isMounted || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: sorsogonCenter,
          zoom: 10,
          mapTypeId: 'hybrid',
          streetViewControl: false,
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: maps.ControlPosition.LEFT_TOP,
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: maps.ControlPosition.LEFT_BOTTOM,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: maps.ControlPosition.LEFT_CENTER,
          },
        });

        mapInstanceRef.current = map;
        const infoWindow = new maps.InfoWindow();
        infoWindowRef.current = infoWindow;
        markerRefs.current = {};

        validDestinations.forEach((destination) => {
          const position = {
            lat: Number(destination.latitude),
            lng: Number(destination.longitude),
          };
          const marker = new maps.Marker({
            map,
            position,
            title: destination.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#d96945',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
          markerRefs.current[destination.slug] = marker;

          marker.addListener('click', () => {
            openDestination(destination);
          });
        });

        if (validDestinations.length > 1) {
          const bounds = new maps.LatLngBounds();
          validDestinations.forEach((destination) => {
            bounds.extend({
              lat: Number(destination.latitude),
              lng: Number(destination.longitude),
            });
          });
          map.fitBounds(bounds, 64);
        }
      } catch (mapError) {
        if (isMounted) setError(mapError.message);
      }
    }

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, [destinations]);

  if (error) {
    return (
      <div className="grid min-h-[620px] place-items-center rounded-lg border border-dashed border-slate-300 bg-mist p-6 text-center">
        <div>
          <p className="text-sm font-black uppercase text-sea">Google Maps demo</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div className="sorso-google-map absolute inset-0" ref={mapRef} />

      <aside className="absolute inset-x-3 bottom-3 z-10 max-h-[240px] overflow-y-auto rounded-lg bg-white/95 p-3 shadow-travel backdrop-blur md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100%-32px)] md:w-80">
        <div className="mb-3">
          <p className="text-xs font-black uppercase text-sea">Explore</p>
          <h3 className="text-xl font-black">Sorsogon spots</h3>
        </div>

        <div className="grid gap-2">
          {validDestinations.length ? (
            validDestinations.map((destination) => (
              <button
                className="grid grid-cols-[64px_1fr] gap-3 rounded-lg p-2 text-left hover:bg-mist"
                key={destination.slug}
                onClick={() => openDestination(destination)}
                type="button"
              >
                <img
                  alt=""
                  className="size-16 rounded-lg object-cover"
                  src={destination.image_url || fallbackImage}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{destination.name}</span>
                  <span className="mt-1 block truncate text-xs font-bold uppercase text-sea">
                    {destination.municipality || 'Sorsogon'}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {destination.category || 'Tourist spot'}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-lg bg-mist p-3 text-sm font-semibold text-slate-600">
              Add latitude and longitude to destinations to show map markers.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
