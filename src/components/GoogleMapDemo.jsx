import React, { useEffect, useRef, useState } from 'react';
import {
  FaClock,
  FaCoins,
  FaCompass,
  FaRegBookmark,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaBookmark,
  FaRegCalendarAlt,
  FaTimes,
} from 'react-icons/fa';

const sorsogonCenter = { lat: 12.9731, lng: 123.9935 };
const sorsogonOverviewZoom = 10;
const destinationZoom = 14;
const zoomOutAnimationDuration = 1.3;
const zoomInAnimationDuration = 2.05;
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const fallbackImage =
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80';

let googleMapsPromise;
let leafletPromise;

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

function loadLeaflet() {
  if (!leafletPromise) {
    leafletPromise = Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(
      ([leafletModule]) => leafletModule.default,
    );
  }

  return leafletPromise;
}

export default function GoogleMapDemo({
  destinations,
  onToggleFavorite,
  savedDestinationSlugs = new Set(),
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markerRefs = useRef({});
  const leafletMapRef = useRef(null);
  const leafletMarkerRefs = useRef({});
  const [provider, setProvider] = useState('leaflet');
  const [leafletStyle, setLeafletStyle] = useState('satellite');
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [error, setError] = useState('');
  const [favoriteActionSlug, setFavoriteActionSlug] = useState('');
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
            data-sorso-details-slug="${escapeHtml(destination.slug)}"
            type="button"
            style="margin-top: 12px; width: 100%; border: 0; border-radius: 8px; background: #116d75; color: white; min-height: 36px; font-weight: 900; cursor: pointer;"
          >
            View details
          </button>
        </div>
      </div>
    `;
  }

  useEffect(() => {
    function handleDetailsClick(event) {
      const button = event.target.closest('[data-sorso-details-slug]');
      if (!button) return;

      const destination = destinations.find((item) => item.slug === button.dataset.sorsoDetailsSlug);
      if (destination) setSelectedDestination(destination);
    }

    document.addEventListener('click', handleDetailsClick);
    return () => document.removeEventListener('click', handleDetailsClick);
  }, [destinations]);

  function openDestination(destination) {
    if (provider === 'leaflet') {
      const map = leafletMapRef.current;
      const marker = leafletMarkerRefs.current[destination.slug];

      if (!map || !marker) return;

      const position = [Number(destination.latitude), Number(destination.longitude)];
      map.closePopup();
      marker.bindPopup(createPopupContent(destination), {
        closeButton: true,
        maxWidth: 280,
        minWidth: 260,
      });

      const openPopup = () => marker.openPopup();
      const shouldZoomOutFirst = map.getZoom() > sorsogonOverviewZoom + 1;

      if (shouldZoomOutFirst) {
        map.once('moveend', () => {
          map.once('moveend', openPopup);
          map.flyTo(position, destinationZoom, {
            animate: true,
            duration: zoomInAnimationDuration,
          });
        });
        map.flyTo([sorsogonCenter.lat, sorsogonCenter.lng], sorsogonOverviewZoom, {
          animate: true,
          duration: zoomOutAnimationDuration,
        });
      } else {
        map.once('moveend', openPopup);
        map.flyTo(position, destinationZoom, {
          animate: true,
          duration: zoomInAnimationDuration,
        });
      }
      return;
    }

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

  async function handleToggleFavorite(destinationSlug) {
    if (!onToggleFavorite || favoriteActionSlug) return;

    setFavoriteActionSlug(destinationSlug);
    await onToggleFavorite(destinationSlug);
    setFavoriteActionSlug('');
  }

  useEffect(() => {
    let isMounted = true;

    async function initializeLeafletMap() {
      if (provider !== 'leaflet' || !mapRef.current) return;

      setError('');
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const leaflet = await loadLeaflet();
      if (!isMounted || !mapRef.current) return;

      mapRef.current.innerHTML = '';

      const map = leaflet.map(mapRef.current, {
        center: [sorsogonCenter.lat, sorsogonCenter.lng],
        zoom: sorsogonOverviewZoom,
        zoomControl: false,
      });

      leaflet.control.zoom({ position: 'bottomleft' }).addTo(map);
      const tileLayer =
        leafletStyle === 'satellite'
          ? leaflet.tileLayer(
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              {
                attribution:
                  'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
                maxZoom: 19,
              },
            )
          : leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19,
            });

      tileLayer.addTo(map);

      leafletMapRef.current = map;
      leafletMarkerRefs.current = {};

      const markerIcon = leaflet.divIcon({
        className: '',
        html:
          '<span style="display:block;width:18px;height:18px;border-radius:999px;background:#d96945;border:3px solid #fff;box-shadow:0 6px 16px rgba(19,32,31,.28);"></span>',
        iconAnchor: [9, 9],
        iconSize: [18, 18],
        popupAnchor: [0, -8],
      });

      validDestinations.forEach((destination) => {
        const marker = leaflet
          .marker([Number(destination.latitude), Number(destination.longitude)], {
            icon: markerIcon,
            title: destination.name,
          })
          .addTo(map);

        marker.bindPopup(createPopupContent(destination), {
          closeButton: true,
          maxWidth: 280,
          minWidth: 260,
        });
        leafletMarkerRefs.current[destination.slug] = marker;
      });

      window.setTimeout(() => map.invalidateSize(), 0);
    }

    initializeLeafletMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRefs.current = {};
      }
    };
  }, [destinations, leafletStyle, provider]);

  useEffect(() => {
    let isMounted = true;

    async function initializeMap() {
      if (provider !== 'google' || !isGoogleEnabled) return;

      if (!googleMapsApiKey) {
        setError('Add VITE_GOOGLE_MAPS_API_KEY to .env to enable the Google Maps demo.');
        return;
      }

      try {
        const maps = await loadGoogleMaps();
        if (!isMounted || !mapRef.current) return;

        mapRef.current.innerHTML = '';

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
  }, [destinations, isGoogleEnabled, provider]);

  function renderDestinationList() {
    return (
      <aside className="absolute inset-x-3 bottom-3 z-[1000] max-h-[240px] overflow-y-auto rounded-lg bg-white/95 p-3 shadow-travel backdrop-blur md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100%-32px)] md:w-80">
        <div className="mb-3">
          <h3 className="text-xl font-black">Sorsogon spots</h3>
        </div>

        <div className="grid gap-2">
          {validDestinations.length ? (
            validDestinations.map((destination) => {
              const isSaved = savedDestinationSlugs.has(destination.slug);

              return (
                <button
                  className="grid grid-cols-[64px_1fr_28px] gap-3 rounded-lg p-2 text-left hover:bg-mist"
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
                    <span
                      className="mt-2 inline-flex text-xs font-black text-sea"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDestination(destination);
                      }}
                    >
                      View details
                    </span>
                  </span>
                  <span
                    className={`grid size-8 place-items-center rounded-lg ${
                      isSaved ? 'bg-sun/25 text-ink' : 'bg-mist text-slate-500'
                    }`}
                    title={isSaved ? 'Saved' : 'Not saved'}
                  >
                    {isSaved ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="rounded-lg bg-mist p-3 text-sm font-semibold text-slate-600">
              Add latitude and longitude to destinations to show map markers.
            </p>
          )}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <div className="grid h-[calc(100svh-170px)] min-h-[480px] place-items-center rounded-lg border border-dashed border-slate-300 bg-mist p-6 text-center">
        <div>
          <p className="text-sm font-black uppercase text-sea">Google Maps demo</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const isGooglePaused = provider === 'google' && !isGoogleEnabled;
  const destinationDetails = selectedDestination
    ? [
        {
          icon: FaRegCalendarAlt,
          label: 'Best time',
          value: selectedDestination.best_time,
        },
        {
          icon: FaClock,
          label: 'Opening hours',
          value: selectedDestination.opening_hours,
        },
        {
          icon: FaCoins,
          label: 'Entrance fee',
          value: selectedDestination.entrance_fee,
        },
        {
          icon: FaMapMarkerAlt,
          label: 'Address',
          value: selectedDestination.address,
        },
        {
          icon: FaPhoneAlt,
          label: 'Contact',
          value: selectedDestination.contact_info,
        },
        {
          icon: FaCompass,
          label: 'Travel tips',
          value: selectedDestination.travel_tips,
        },
      ].filter((item) => item.value)
    : [];
  const isSelectedDestinationSaved = selectedDestination
    ? savedDestinationSlugs.has(selectedDestination.slug)
    : false;

  return (
    <div className="relative z-0 h-[calc(100svh-170px)] min-h-[480px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div
        className={`absolute inset-0 ${provider === 'google' ? 'sorso-google-map' : 'sorso-leaflet-map'}`}
        ref={mapRef}
      />

      {isGooglePaused && (
        <div className="absolute inset-0 z-[5] bg-[linear-gradient(135deg,#e8f2ec,#f9fbf6_45%,#d7e6ef)]">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[10%] top-[12%] h-40 w-56 rounded-[45%] bg-sea/15" />
            <div className="absolute bottom-[16%] left-[28%] h-56 w-72 rounded-[48%] bg-forest/15" />
            <div className="absolute right-[22%] top-[18%] h-72 w-64 rounded-[45%] bg-sun/20" />
            <div className="absolute bottom-[10%] right-[8%] h-44 w-56 rounded-[45%] bg-coral/15" />
          </div>

          <div className="absolute left-4 top-20 max-w-sm rounded-lg bg-white/95 p-4 shadow-travel backdrop-blur">
            <p className="text-xs font-black uppercase text-sea">Google Maps demo</p>
            <h3 className="mt-1 text-xl font-black">Google map paused</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              OSM is active by default. Load Google only when you need the Google demo.
            </p>
            <button
              className="mt-4 min-h-11 rounded-lg bg-ink px-4 font-extrabold text-white"
              onClick={() => setIsGoogleEnabled(true)}
              type="button"
            >
              Load Google Map
            </button>
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 z-[1001] flex max-w-[calc(100%-24px)] flex-wrap gap-2">
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-travel">
          <button
            className={`min-h-10 px-4 text-sm font-extrabold ${
              provider === 'leaflet' ? 'bg-ink text-white' : 'text-ink hover:bg-mist'
            }`}
            onClick={() => {
              setProvider('leaflet');
              setError('');
            }}
            type="button"
          >
            OSM
          </button>
          <button
            className={`min-h-10 px-4 text-sm font-extrabold ${
              provider === 'google' ? 'bg-ink text-white' : 'text-ink hover:bg-mist'
            }`}
            onClick={() => {
              setProvider('google');
              setError('');
            }}
            type="button"
          >
            Google
          </button>
        </div>

        {provider === 'leaflet' && (
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-travel">
            <button
              className={`min-h-10 px-4 text-sm font-extrabold ${
                leafletStyle === 'map' ? 'bg-sea text-white' : 'text-ink hover:bg-mist'
              }`}
              onClick={() => setLeafletStyle('map')}
              type="button"
            >
              Map
            </button>
            <button
              className={`min-h-10 px-4 text-sm font-extrabold ${
                leafletStyle === 'satellite' ? 'bg-sea text-white' : 'text-ink hover:bg-mist'
              }`}
              onClick={() => setLeafletStyle('satellite')}
              type="button"
            >
              Satellite
            </button>
          </div>
        )}
      </div>

      {renderDestinationList()}

      {selectedDestination && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedDestination(null)}
          role="presentation"
        >
          <section
            className="max-h-[calc(100svh-48px)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-travel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <img
                alt=""
                className="h-64 w-full object-cover"
                src={selectedDestination.image_url || fallbackImage}
              />
              <button
                aria-label="Close destination details"
                className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white text-ink shadow-travel transition hover:bg-mist"
                onClick={() => setSelectedDestination(null)}
                type="button"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-black uppercase text-sea">
                {selectedDestination.municipality || 'Sorsogon'} -{' '}
                {selectedDestination.category || 'Tourist spot'}
              </p>
              <h2 className="mt-2 text-3xl font-black leading-none">
                {selectedDestination.name}
              </h2>
              {selectedDestination.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {selectedDestination.description}
                </p>
              )}

              {onToggleFavorite && (
                <button
                  className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-extrabold ${
                    isSelectedDestinationSaved
                      ? 'bg-sun/25 text-ink'
                      : 'bg-sea text-white'
                  } disabled:opacity-60`}
                  disabled={favoriteActionSlug === selectedDestination.slug}
                  onClick={() => handleToggleFavorite(selectedDestination.slug)}
                  type="button"
                >
                  {isSelectedDestinationSaved ? (
                    <FaBookmark aria-hidden="true" />
                  ) : (
                    <FaRegBookmark aria-hidden="true" />
                  )}
                  {favoriteActionSlug === selectedDestination.slug
                    ? 'Saving...'
                    : isSelectedDestinationSaved
                      ? 'Saved place'
                      : 'Save place'}
                </button>
              )}

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {destinationDetails.map(({ icon: Icon, label, value }) => (
                  <div className="grid grid-cols-[34px_1fr] gap-3 rounded-lg bg-mist p-4" key={label}>
                    <dt className="grid size-9 place-items-center rounded-lg bg-white text-sea">
                      <Icon aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </dt>
                    <dd>
                      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
