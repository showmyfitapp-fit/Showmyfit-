import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface GoogleMapLocationProps {
  location: Location | null;
  onLocationChange: (location: Location | null) => void;
  isEditing?: boolean;
  height?: string;
}

const GoogleMapLocation: React.FC<GoogleMapLocationProps> = ({
  location,
  onLocationChange,
  isEditing = false,
  height = '300px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        // Wait for the existing script to load
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps) {
            setIsMapLoaded(true);
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
        return;
      }

      const apiKey = 'AIzaSyCeyIcYq60rZLMaXRlnU0UwKzDQaonuVwI';

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.google || !window.google.maps) return;

    const mapElement = mapRef.current;
    if (!mapElement) return;

    const mapInstance = new google.maps.Map(mapElement, {
      zoom: location ? 15 : 10,
      center: location ? { lat: location.lat, lng: location.lng } : { lat: 12.9716, lng: 77.5946 }, // Default to Bangalore
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);

    // Add marker if location exists
    if (location) {
      const markerInstance = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstance,
        title: 'Store Location',
        draggable: isEditing,
      });

      setMarker(markerInstance);

      // Add click listener for editing
      if (isEditing) {
        markerInstance.addListener('dragend', () => {
          const newPosition = markerInstance.getPosition();
          if (newPosition) {
            const newLocation = {
              lat: newPosition.lat(),
              lng: newPosition.lng(),
            };
            onLocationChange(newLocation);
            reverseGeocode(newPosition.lat(), newPosition.lng());
            setHasUnsavedChanges(true);
          }
        });
      }
    }

    // Add click listener to map for editing
    if (isEditing) {
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          onLocationChange(newLocation);
          reverseGeocode(event.latLng.lat(), event.latLng.lng());
          setHasUnsavedChanges(true);
        }
      });
    }
  }, [isMapLoaded, location, isEditing, onLocationChange]);

  // Update marker when location changes
  useEffect(() => {
    if (!map || !location) return;

    if (marker) {
      marker.setPosition({ lat: location.lat, lng: location.lng });
    } else {
      const newMarker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: 'Store Location',
        draggable: isEditing,
      });
      setMarker(newMarker);
    }

    map.setCenter({ lat: location.lat, lng: location.lng });
  }, [location, map, isEditing]);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        onLocationChange({ lat, lng, address });
      }
    });
  };

  const handleSaveLocation = () => {
    if (location) {
      setHasUnsavedChanges(false);
      // The location is already saved via onLocationChange callback
      console.log('Location saved:', location);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        onLocationChange(newLocation);
        reverseGeocode(latitude, longitude);
        setHasUnsavedChanges(true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  if (!isMapLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-[5px]">
      {isEditing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                {location ? 'Click on map or drag marker to set location' : 'Click on map to set your store location'}
              </span>
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGettingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* Save Location Button */}
          {hasUnsavedChanges && location && (
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-800">You have unsaved location changes</span>
              </div>
              <button
                onClick={handleSaveLocation}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>Save Location</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full rounded-lg border border-gray-300"
        style={{ height }}
      />

      {location && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Store Location</p>
              <p className="text-sm text-blue-700">
                {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {!location && !isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No location set</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapLocation;
