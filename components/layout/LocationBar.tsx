'use client';

import { useEffect, useState } from 'react';
import { Bell, ChevronRight, MapPin } from 'lucide-react';
import LocationPicker from '@/components/location/LocationPicker';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { formatLocationName } from '@/lib/location/selection';
import {
  browserNotificationPermission,
  requestBrowserNotificationPermission,
} from '@/lib/notifications/browser';

const LocationBar: React.FC = () => {
  const {
    pickerOpen,
    setPickerOpen,
    locBusy,
    locError,
    saveError,
    savingAddress,
    signedIn,
    addresses,
    place,
    pincode,
    enableLocation,
    selectSearch,
    selectAddress,
    saveAddress,
  } = useLocationSelection();
  const [alertState, setAlertState] = useState<NotificationPermission>(
    typeof window === 'undefined' ? 'default' : browserNotificationPermission()
  );

  useEffect(() => {
    setAlertState(browserNotificationPermission());
  }, []);

  const enableAlerts = async () => {
    const permission = await requestBrowserNotificationPermission();
    setAlertState(permission);
  };

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="min-w-0 flex items-center gap-1.5 text-neutral-600"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0 text-orange-600" />
          {place ? (
            <span className="font-semibold text-neutral-800 truncate">
              {formatLocationName(place, pincode)}
            </span>
          ) : (
            <span className="font-medium text-neutral-500 truncate">
              {locBusy ? 'Finding your area…' : locError || 'Allow location to show your area'}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
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

      <LocationPicker
        open={pickerOpen}
        locBusy={locBusy}
        locError={locError}
        saveError={saveError}
        savingAddress={savingAddress}
        signedIn={signedIn}
        addresses={addresses}
        selectedName={place}
        selectedPincode={pincode}
        onClose={() => setPickerOpen(false)}
        onUseCurrentLocation={() => void enableLocation(true)}
        onSelectSearch={selectSearch}
        onSelectAddress={selectAddress}
        onSaveAddress={(address) => void saveAddress(address)}
      />
    </div>
  );
};

export default LocationBar;
