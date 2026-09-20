'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Home,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { AddressLabel, SavedAddress } from '@/lib/location/addresses';
import AddressMapPicker, { type PinnedLocation } from '@/components/location/AddressMapPicker';
import {
  displayNameForAddress,
  extractPincode,
  formatAddress,
  formatLocationName,
  pincodeForAddress,
  type AreaResult,
} from '@/lib/location/selection';

type PickerView = 'list' | 'add';

export interface LocationPickerProps {
  open: boolean;
  locBusy: boolean;
  locError: string;
  saveError: string;
  savingAddress: boolean;
  signedIn: boolean;
  addresses: SavedAddress[];
  selectedName: string;
  selectedPincode: string;
  onClose: () => void;
  onUseCurrentLocation: () => void;
  onSelectSearch: (result: AreaResult) => void;
  onSelectAddress: (address: SavedAddress) => void;
  onSaveAddress: (address: Omit<SavedAddress, 'id'>) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  open,
  locBusy,
  locError,
  saveError,
  savingAddress,
  signedIn,
  addresses,
  selectedName,
  selectedPincode,
  onClose,
  onUseCurrentLocation,
  onSelectSearch,
  onSelectAddress,
  onSaveAddress,
}) => {
  const titleId = useId();
  const [view, setView] = useState<PickerView>('list');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setView('list');
    setQuery('');
    setResults([]);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=6&language=en&format=json`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('Search failed');
        const data = (await response.json()) as {
          results?: Array<{
            id: number;
            name: string;
            admin1?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
          }>;
        };
        setResults(
          (data.results || []).map((item) => ({
            id: String(item.id),
            name: item.name,
            detail: [item.admin1, item.country].filter(Boolean).join(', '),
            latitude: item.latitude,
            longitude: item.longitude,
          }))
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const filteredAddresses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return addresses;
    return addresses.filter((address) =>
      `${address.label} ${address.saveAs} ${address.line1} ${address.street} ${address.area} ${address.city}`
        .toLowerCase()
        .includes(term)
    );
  }, [addresses, query]);

  if (!open || !mounted) return null;

  const handleBack = () => {
    if (view === 'add') {
      setView('list');
      return;
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close location picker"
        className="absolute inset-0 hidden bg-black/50 md:block"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full flex-col bg-white md:absolute md:left-1/2 md:top-1/2 md:h-auto md:max-h-[85vh] md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="-ml-1 rounded-full p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label={view === 'add' ? 'Back to locations' : 'Close'}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 id={titleId} className="min-w-0 truncate text-sm font-semibold text-neutral-900">
            {view === 'add' && selectedName
              ? selectedName
              : view === 'add'
                ? 'Add address'
                : 'Select location'}
          </h2>
        </div>

        {view === 'list' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="px-4 pt-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for area, street name…"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-orange-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4 py-4">
              <button
                type="button"
                onClick={onUseCurrentLocation}
                disabled={locBusy}
                className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-3 text-left text-orange-700 disabled:opacity-60"
              >
                <LocateFixed className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold leading-tight">
                  {locBusy ? 'Finding…' : 'Use current location'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setView('add')}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left text-neutral-800"
              >
                <Plus className="h-4 w-4 shrink-0 text-orange-600" />
                <span className="text-xs font-semibold leading-tight">Add address</span>
              </button>
            </div>

            {locError && (
              <p className="px-4 pb-2 text-xs text-red-600">{locError}</p>
            )}
            {saveError && (
              <p className="px-4 pb-2 text-xs text-red-600">{saveError}</p>
            )}
            {!signedIn && (
              <p className="px-4 pb-2 text-xs text-neutral-500">
                Sign in to keep saved addresses on your account.
              </p>
            )}

            {query.trim().length >= 2 && (
              <section className="px-4 pb-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  Search results
                </h3>
                {searching && (
                  <p className="py-3 text-sm text-neutral-500">Searching areas…</p>
                )}
                {!searching && results.length === 0 && (
                  <p className="py-3 text-sm text-neutral-500">No matching areas</p>
                )}
                <ul className="divide-y divide-neutral-100">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => onSelectSearch(result)}
                        className="flex w-full items-start gap-3 py-3 text-left"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                        <span>
                          <span className="block text-sm font-semibold text-neutral-900">
                            {result.name}
                          </span>
                          {result.detail && (
                            <span className="block text-xs text-neutral-500">{result.detail}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="px-4 pb-6">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Saved addresses
              </h3>
              {filteredAddresses.length === 0 ? (
                <p className="rounded-xl bg-neutral-50 px-3 py-4 text-sm text-neutral-500">
                  No saved addresses yet. Add one to reuse it next time.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {filteredAddresses.map((address) => {
                    const selected = selectedName === displayNameForAddress(address);
                    return (
                      <li key={address.id}>
                        <button
                          type="button"
                          onClick={() => onSelectAddress(address)}
                          className="flex w-full items-start gap-3 py-3 text-left"
                        >
                          <AddressIcon label={address.label} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-neutral-900">
                                {address.saveAs || address.label}
                              </span>
                              {selected && (
                                <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                                  Selected
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-neutral-500">
                              {formatLocationName(formatAddress(address), pincodeForAddress(address))}
                            </span>
                            {address.latitude != null && address.longitude != null && (
                              <span className="mt-1 block text-[11px] font-medium text-orange-700">
                                Map pin saved
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <AddAddressForm
            areaHint={selectedName}
            pincodeHint={selectedPincode}
            saving={savingAddress}
            saveError={saveError}
            signedIn={signedIn}
            onChangeArea={() => setView('list')}
            onSave={onSaveAddress}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

const AddressIcon: React.FC<{ label: AddressLabel }> = ({ label }) => {
  const iconClass = 'mt-0.5 h-4 w-4 shrink-0 text-orange-600';
  if (label === 'House') return <Home className={iconClass} />;
  if (label === 'Office') return <Briefcase className={iconClass} />;
  return <Navigation className={iconClass} />;
};

const AddAddressForm: React.FC<{
  areaHint: string;
  pincodeHint: string;
  saving: boolean;
  saveError: string;
  signedIn: boolean;
  onChangeArea: () => void;
  onSave: (address: Omit<SavedAddress, 'id'>) => void;
}> = ({ areaHint, pincodeHint, saving, saveError, signedIn, onChangeArea, onSave }) => {
  const { currentUser, userData } = useAuth();
  const accountName = userData?.displayName || currentUser?.displayName || '';
  const accountPhone = userData?.phone || currentUser?.phoneNumber || '';
  const [useAccount, setUseAccount] = useState(Boolean(accountName || accountPhone));
  const [label, setLabel] = useState<AddressLabel>('House');
  const [line1, setLine1] = useState('');
  const [street, setStreet] = useState('');
  const [saveAs, setSaveAs] = useState('');
  const [pincode, setPincode] = useState(pincodeHint);
  const [area, setArea] = useState(areaHint);
  const [city, setCity] = useState('');
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const [instructions, setInstructions] = useState('');

  const canSave = Boolean(line1.trim() && saveAs.trim());

  const handlePinChange = (next: PinnedLocation) => {
    setPin(next);
    if (next.pincode) setPincode(next.pincode);
    if (next.area) setArea(next.area);
    if (next.city) setCity(next.city);
    if (next.street && !street.trim()) setStreet(next.street);
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || saving) return;
        onSave({
          label,
          line1: line1.trim(),
          street: street.trim(),
          saveAs: saveAs.trim(),
          area: area || areaHint || saveAs.trim(),
          city,
          pincode: pincode.trim() || extractPincode(area || areaHint) || undefined,
          receiverName: useAccount ? accountName : '',
          receiverPhone: useAccount ? accountPhone : '',
          instructions: instructions.trim(),
          latitude: pin?.lat,
          longitude: pin?.lng,
          mapAddress: pin?.address,
        });
      }}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <section>
          <h3 className="text-base font-bold text-neutral-900">Receiver details</h3>
          <button
            type="button"
            onClick={() => setUseAccount((value) => !value)}
            className="mt-3 flex w-full items-start gap-3 text-left"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                useAccount
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-neutral-300 bg-white'
              }`}
            >
              {useAccount && <Check className="h-3.5 w-3.5" />}
            </span>
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                Use my account details
              </span>
              {(accountName || accountPhone) && (
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {[accountName, accountPhone].filter(Boolean).join(', ')}
                </span>
              )}
            </span>
          </button>
        </section>

        <section>
          <h3 className="text-base font-bold text-neutral-900">Location details</h3>
          <div className="mt-3 flex gap-2">
            {([
              { value: 'House', icon: Home },
              { value: 'Office', icon: Briefcase },
              { value: 'Other', icon: Navigation },
            ] as const).map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLabel(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  label === value
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {value}
              </button>
            ))}
          </div>

          <input
            value={line1}
            onChange={(event) => setLine1(event.target.value)}
            placeholder="Building / Floor *"
            className="mt-4 h-12 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-orange-400"
          />
          <input
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            placeholder="Street (Recommended)"
            className="mt-3 h-12 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-orange-400"
          />
          <input
            value={saveAs}
            onChange={(event) => setSaveAs(event.target.value)}
            placeholder="Save address as *"
            className="mt-3 h-12 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-orange-400"
          />
          <input
            value={pincode}
            onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="Pincode"
            className="mt-3 h-12 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-orange-400"
          />

          <div className="mt-3 flex items-stretch gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2.5">
              <p className="truncate text-sm text-neutral-700">
                {formatLocationName(
                  area || areaHint || 'Choose an area from search or current location',
                  pincode || pincodeHint
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onChangeArea}
              className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-neutral-200 text-xs font-semibold text-orange-700"
            >
              <MapPin className="mb-1 h-4 w-4" />
              Change
            </button>
          </div>

          <div className="mt-4">
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">Pin on map</h4>
            <AddressMapPicker
              value={pin}
              searchHint={area || areaHint}
              height="220px"
              onChange={handlePinChange}
            />
          </div>
        </section>

        <section>
          <h3 className="text-base font-bold text-neutral-900">
            Delivery instructions <span className="font-medium text-neutral-400">(Recommended)</span>
          </h3>
          <div className="relative mt-3">
            <input
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Instructions to reach location"
              className="h-12 w-full rounded-xl border border-neutral-200 px-3 pr-16 text-sm outline-none focus:border-orange-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-700">
              Add
            </span>
          </div>
        </section>
      </div>

      <div className="border-t border-neutral-100 p-4">
        {saveError && <p className="mb-2 text-xs text-red-600">{saveError}</p>}
        {!signedIn && (
          <p className="mb-2 text-xs text-neutral-500">
            Sign in to save this address to your account. It will stay on this device until then.
          </p>
        )}
        <button
          type="submit"
          disabled={!canSave || saving}
          className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {saving ? 'Saving…' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

export default LocationPicker;
