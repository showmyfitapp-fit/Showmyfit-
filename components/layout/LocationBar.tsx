'use client';

import { useEffect, useState } from 'react';
import { Bell, MapPin } from 'lucide-react';
import { cachedPlaceName, requestPlaceName } from '@/lib/location/place';
import {
  browserNotificationPermission,
  requestBrowserNotificationPermission,
} from '@/lib/notifications/browser';

const LocationBar: React.FC = () => {
  const [place, setPlace] = useState(cachedPlaceName()?.name || '');
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState('');
  const [alertState, setAlertState] = useState<NotificationPermission>(
    typeof window === 'undefined' ? 'default' : browserNotificationPermission()
  );

  useEffect(() => {
    setAlertState(browserNotificationPermission());
    if (cachedPlaceName()?.name) return;
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'granted') enableLocation();
      })
      .catch(() => undefined);
  }, []);

  const enableLocation = async () => {
    setLocBusy(true);
    setLocError('');
    try {
      const result = await requestPlaceName();
      setPlace(result.name);
    } catch {
      setLocError('Allow location access to show your area');
    } finally {
      setLocBusy(false);
    }
  };

  const enableAlerts = async () => {
    const permission = await requestBrowserNotificationPermission();
    setAlertState(permission);
  };

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/90">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={place ? undefined : enableLocation}
          className="min-w-0 flex items-center gap-1.5 text-neutral-600 truncate"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0 text-orange-600" />
          {place ? (
            <span className="font-semibold text-neutral-800 truncate">{place}</span>
          ) : (
            <span className="font-medium text-neutral-500 truncate">
              {locBusy ? 'Finding your area…' : locError || 'Allow location to show your area'}
            </span>
          )}
        </button>

        {alertState !== 'granted' && (
          <button
            type="button"
            onClick={enableAlerts}
            className="shrink-0 inline-flex items-center gap-1 font-semibold text-orange-700 hover:text-orange-800"
          >
            <Bell className="w-3.5 h-3.5" />
            Enable order alerts
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationBar;
