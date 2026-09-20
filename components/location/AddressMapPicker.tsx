'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { loadGoogleMaps, parseGeocodeResult } from '@/lib/location/googleMaps';

export interface PinnedLocation {
  lat: number;
  lng: number;
  address?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
}

interface AddressMapPickerProps {
  value: PinnedLocation | null;
  searchHint?: string;
  height?: string;
  onChange: (location: PinnedLocation) => void;
}

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  value,
  searchHint,
  height = '220px',
  onChange,
}) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [locBusy, setLocBusy] = useState(false);

  onChangeRef.current = onChange;

  const applyPin = (lat: number, lng: number, maps: typeof google.maps) => {
    const finish = (next: PinnedLocation) => onChangeRef.current(next);
    const next: PinnedLocation = { lat, lng };
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        finish({ ...next, ...parseGeocodeResult(results[0]) });
        return;
      }
      finish(next);
    });
  };

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load Google Maps');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || !window.google?.maps || mapRef.current) return;

    const maps = window.google.maps;
    const center = value || DEFAULT_CENTER;
    const map = new maps.Map(mapEl.current, {
      zoom: value ? 17 : 12,
      center,
      mapTypeId: maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    mapRef.current = map;

    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      applyPin(event.latLng.lat(), event.latLng.lng(), maps);
    });

    if (value) {
      const marker = new maps.Marker({
        position: value,
        map,
        draggable: true,
        title: 'Delivery pin',
      });
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (!position) return;
        applyPin(position.lat(), position.lng(), maps);
      });
      markerRef.current = marker;
    }
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!map || !maps || !value) return;

    if (markerRef.current) {
      markerRef.current.setPosition(value);
    } else {
      const marker = new maps.Marker({
        position: value,
        map,
        draggable: true,
        title: 'Delivery pin',
      });
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (!position) return;
        applyPin(position.lat(), position.lng(), maps);
      });
      markerRef.current = marker;
    }
    map.panTo(value);
    if ((map.getZoom() || 0) < 16) map.setZoom(17);
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    const hint = searchHint?.trim();
    if (!map || !maps || !hint || value) return;

    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address: hint }, (results, status) => {
      const loc = status === 'OK' ? results?.[0]?.geometry?.location : undefined;
      if (!loc) return;
      map.panTo({ lat: loc.lat(), lng: loc.lng() });
      map.setZoom(15);
    });
  }, [searchHint, value]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation || !window.google?.maps) return;
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyPin(position.coords.latitude, position.coords.longitude, window.google.maps);
        setLocBusy(false);
      },
      () => setLocBusy(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loadError) {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-3 text-xs text-red-600">{loadError}</p>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-neutral-50" style={{ height }}>
        <p className="text-sm text-neutral-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">Tap the map or drag the pin to set the exact spot</p>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locBusy}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locBusy ? 'Finding…' : 'My location'}
        </button>
      </div>
      <div ref={mapEl} className="w-full overflow-hidden rounded-xl border border-neutral-200" style={{ height }} />
      {value ? (
        <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-orange-800">Pinned location will be saved</p>
            <p className="mt-0.5 truncate text-xs text-orange-700">
              {value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">No pin yet. Choose a point so delivery can find this address.</p>
      )}
    </div>
  );
};

export default AddressMapPicker;
