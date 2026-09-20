'use client';

import { useEffect, useMemo, useState } from 'react';
import { cachedPlaceName, requestPincode, requestPlaceName } from '@/lib/location/place';
import {
  addressMatchKey,
  insertUserAddress,
  listUserAddresses,
  type SavedAddress,
} from '@/lib/location/addresses';
import {
  GUEST_ADDRESSES_KEY,
  LOCATION_CHANGED_EVENT,
  addressCacheKey,
  displayNameForAddress,
  extractPincode,
  pincodeForAddress,
  readJson,
  readSelectedLocation,
  writeJson,
  writeSelectedLocation,
  withCachedPincode,
  type AreaResult,
  type SelectedLocation,
} from '@/lib/location/selection';
import { useAuth } from '@/contexts/AuthContext';

export function useLocationSelection() {
  const { currentUser, loading: authLoading } = useAuth();
  const [place, setPlace] = useState(cachedPlaceName()?.name || '');
  const [pincode, setPincode] = useState(cachedPlaceName()?.pincode || '');
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesReady, setAddressesReady] = useState(false);

  const applySelected = (selected: SelectedLocation | null) => {
    if (!selected?.name) return;
    setPlace(selected.name);
    setPincode(selected.pincode || extractPincode(selected.name));
    setSelectedAddressId(selected.type === 'saved' ? selected.addressId : undefined);
  };

  useEffect(() => {
    const selected = readSelectedLocation();
    if (selected) {
      applySelected(selected);
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'granted') void enableLocation(false);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const sync = () => applySelected(readSelectedLocation());
    window.addEventListener(LOCATION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LOCATION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const loadAddresses = async () => {
      const authUserId = currentUser?.id;
      const cached = readJson<SavedAddress[]>(addressCacheKey(authUserId), []);
      if (!cancelled) setAddresses(withCachedPincode(cached, cached));

      if (!authUserId) {
        if (!cancelled) setAddressesReady(true);
        return;
      }

      try {
        const remote = await listUserAddresses(authUserId);
        const guest = readJson<SavedAddress[]>(GUEST_ADDRESSES_KEY, []);
        const existing = new Set(remote.map(addressMatchKey));
        const merged = [...remote];

        for (const address of guest) {
          if (existing.has(addressMatchKey(address))) continue;
          const saved = await insertUserAddress(authUserId, currentUser.uid, {
            label: address.label,
            line1: address.line1,
            street: address.street,
            saveAs: address.saveAs,
            area: address.area,
            city: address.city,
            receiverName: address.receiverName,
            receiverPhone: address.receiverPhone,
            instructions: address.instructions,
          });
          merged.unshift({ ...saved, pincode: address.pincode });
          existing.add(addressMatchKey(saved));
        }

        if (guest.length) localStorage.removeItem(GUEST_ADDRESSES_KEY);
        if (!cancelled) {
          const next = withCachedPincode(merged, cached);
          setAddresses(next);
          writeJson(addressCacheKey(authUserId), next);
        }
      } catch {
        if (!cancelled) {
          setSaveError('Could not load saved addresses. Showing this device only.');
        }
      } finally {
        if (!cancelled) setAddressesReady(true);
      }
    };

    void loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser?.id, currentUser?.uid]);

  const enableLocation = async (closePicker = true) => {
    setLocBusy(true);
    setLocError('');
    try {
      const result = await requestPlaceName();
      setPlace(result.name);
      setPincode(result.pincode || '');
      setSelectedAddressId(undefined);
      writeSelectedLocation({
        type: 'gps',
        name: result.name,
        pincode: result.pincode,
      });
      if (closePicker) setPickerOpen(false);
    } catch {
      setLocError('Allow location access to show your area');
    } finally {
      setLocBusy(false);
    }
  };

  const selectLocation = (next: SelectedLocation) => {
    applySelected(next);
    setLocError('');
    writeSelectedLocation(next);
    setPickerOpen(false);
  };

  const saveAddress = async (address: Omit<SavedAddress, 'id'> & { id?: string }) => {
    setSavingAddress(true);
    setSaveError('');
    try {
      let stored: SavedAddress;
      if (currentUser?.id) {
        stored = {
          ...(await insertUserAddress(currentUser.id, currentUser.uid, address)),
          pincode: address.pincode,
          latitude: address.latitude,
          longitude: address.longitude,
          mapAddress: address.mapAddress,
        };
      } else {
        stored = { ...address, id: address.id || crypto.randomUUID() };
      }

      const next = [stored, ...addresses.filter((item) => item.id !== stored.id)];
      setAddresses(next);
      writeJson(addressCacheKey(currentUser?.id), next);
      selectLocation({
        type: 'saved',
        name: displayNameForAddress(stored),
        addressId: stored.id,
        pincode: pincodeForAddress(stored),
      });
    } catch {
      setSaveError(
        currentUser
          ? 'Could not save this address. Check that the user_addresses table exists.'
          : 'Sign in to save this address to your account.'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId]
  );
  const hasSelectedSavedAddress = Boolean(selectedAddress);

  return {
    pickerOpen,
    setPickerOpen,
    locBusy,
    locError,
    saveError,
    savingAddress,
    signedIn: Boolean(currentUser),
    addresses,
    addressesReady,
    place,
    pincode,
    selectedAddress,
    hasSelectedSavedAddress,
    enableLocation,
    selectSearch: (result: AreaResult) => {
      selectLocation({ type: 'search', name: result.name });
      if (result.latitude == null || result.longitude == null) return;
      void requestPincode(result.latitude, result.longitude)
        .then((pin) => {
          if (!pin) return;
          setPincode(pin);
          writeSelectedLocation({
            type: 'search',
            name: result.name,
            pincode: pin,
          });
        })
        .catch(() => undefined);
    },
    selectAddress: (address: SavedAddress) =>
      selectLocation({
        type: 'saved',
        name: displayNameForAddress(address),
        addressId: address.id,
        pincode: pincodeForAddress(address),
      }),
    saveAddress,
  };
}
