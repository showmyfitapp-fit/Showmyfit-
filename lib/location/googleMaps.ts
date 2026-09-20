/// <reference types="google.maps" />

const FALLBACK_KEY = 'AIzaSyBZIJybunE12Dll1THaT_Pnt0-B5gBqJiw';

export function googleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || FALLBACK_KEY;
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const existing = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const wait = () => {
        if (window.google?.maps) resolve(window.google.maps);
        else setTimeout(wait, 80);
      };
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      wait();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey()}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to initialize'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export function parseGeocodeResult(result: google.maps.GeocoderResult) {
  const component = (type: string) =>
    result.address_components.find((item) => item.types.includes(type))?.long_name || '';

  return {
    address: result.formatted_address,
    street: [component('street_number'), component('route')].filter(Boolean).join(' '),
    area:
      component('sublocality_level_1') ||
      component('sublocality') ||
      component('neighborhood') ||
      component('administrative_area_level_3'),
    city: component('locality') || component('administrative_area_level_2'),
    pincode: component('postal_code'),
  };
}
