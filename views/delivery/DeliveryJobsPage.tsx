'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bike,
  CheckCircle,
  KeyRound,
  MapPin,
  Navigation,
  Package,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import {
  acceptDeliveryJob,
  completeDeliveryJob,
  enableDeliveryPartner,
  getDeliveryPartner,
  fetchDeliveryJobs,
  isDeliveryPartner,
  mapsUrl,
  setDeliveryPartnerOnline,
  verifyPickupOtp,
  type DeliveryJob,
} from '@/lib/delivery';

const DeliveryJobsPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupInput, setPickupInput] = useState<Record<string, string>>({});
  const [dropInput, setDropInput] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [partnerUid, setPartnerUid] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isAdmin = userData?.role === 'admin';

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const partner = isAdmin || (await isDeliveryPartner(currentUser.uid));
      setAllowed(partner);
      if (!partner) return;
      const rider = await getDeliveryPartner(currentUser.uid);
      setIsOnline(Boolean(rider?.isOnline));
      setJobs(await fetchDeliveryJobs(isAdmin ? undefined : currentUser.uid));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser, userData?.role]);

  const handleEnableSelf = async () => {
    if (!currentUser) return;
    await enableDeliveryPartner({
      userId: currentUser.uid,
      name: userData?.displayName || currentUser.displayName || 'Delivery partner',
      phone: userData?.phone,
    });
    setMessage('Delivery partner access enabled');
    await load();
  };

  const handleOnlineToggle = async () => {
    if (!currentUser) return;
    setStatusLoading(true);
    try {
      const updated = await setDeliveryPartnerOnline(currentUser.uid, !isOnline);
      setIsOnline(updated.isOnline);
      setMessage(updated.isOnline ? 'You are online. New jobs can be assigned to you.' : 'You are offline.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update online status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAccept = async (job: DeliveryJob) => {
    if (!currentUser || !job.id) return;
    try {
      await acceptDeliveryJob(
        job.id,
        currentUser.uid,
        userData?.displayName || currentUser.displayName || 'Rider'
      );
      setMessage(`Accepted ${job.orderNumber}`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not accept this job');
    }
  };

  const handlePickup = async (job: DeliveryJob) => {
    if (!job.id) return;
    const ok = await verifyPickupOtp(job.id, pickupInput[job.id] || '');
    if (!ok) {
      alert('Invalid pickup OTP. Ask the seller for the 6-digit code.');
      return;
    }
    setMessage(`Picked up ${job.orderNumber}. Ask the customer for their delivery OTP at drop.`);
    await load();
  };

  const handleDrop = async (job: DeliveryJob) => {
    if (!job.id) return;
    const ok = await completeDeliveryJob(job.id, dropInput[job.id] || '');
    if (!ok) {
      alert('Invalid customer OTP.');
      return;
    }
    setMessage(`Delivered ${job.orderNumber}`);
    await load();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to continue</h1>
          <Button onClick={() => router.push('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!loading && !allowed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Delivery partner access</h1>
          <p className="text-gray-600 mb-6">
            An admin must enable your account as a delivery partner.
          </p>
          {isAdmin && (
            <Button onClick={handleEnableSelf}>Enable my delivery access</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <Bike className="w-8 h-8 text-orange-600" />
              Delivery jobs
            </h1>
            <p className="text-gray-600 mt-1">Pickup OTP at the store, then customer OTP at drop.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="secondary" onClick={handleEnableSelf}>
                Enable me
              </Button>
            )}
            <Button variant="secondary" onClick={load}>Refresh</Button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-white border rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500">
              {isOnline
                ? 'You can accept new pickups.'
                : 'Go online to get assigned delivery jobs.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOnlineToggle}
            disabled={statusLoading}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-pressed={isOnline}
            aria-label={isOnline ? 'Go offline' : 'Go online'}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                isOnline ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isAdmin && (
          <div className="mb-4 p-4 bg-white border rounded-xl flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Partner user UID"
              value={partnerUid}
              onChange={(e) => setPartnerUid(e.target.value)}
            />
            <input
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Partner name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (!partnerUid.trim()) return;
                await enableDeliveryPartner({
                  userId: partnerUid.trim(),
                  name: partnerName.trim() || 'Delivery partner',
                });
                setPartnerUid('');
                setPartnerName('');
                setMessage('Delivery partner enabled');
              }}
            >
              Add partner
            </Button>
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
            {!isOnline && !isAdmin
              ? 'You are offline. Go online to receive new pickup jobs.'
              : 'No active pickups. Jobs appear when a seller marks an order as packed.'}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b flex justify-between gap-3">
                  <div>
                    <p className="font-black text-lg">{job.orderNumber}</p>
                    <p className="text-sm text-gray-600">{job.sellerName}</p>
                  </div>
                  <span className="h-fit px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800">
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-4 text-sm">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-xl bg-amber-50">
                      <p className="text-xs font-bold uppercase text-amber-800 mb-1">Pick</p>
                      <p className="text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        {job.pickAddress}
                      </p>
                      <a
                        href={mapsUrl(job.pickLocation?.lat, job.pickLocation?.lng, job.pickAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-orange-700 font-semibold mt-2"
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate to store
                      </a>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50">
                      <p className="text-xs font-bold uppercase text-green-800 mb-1">Drop</p>
                      <p className="text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        {job.dropAddress}
                      </p>
                      <p className="text-gray-600 mt-1">{job.customerName}</p>
                      {job.customerPhone && (
                        <a href={`tel:${job.customerPhone}`} className="inline-flex items-center gap-1 text-green-800 mt-1">
                          <Phone className="w-3 h-3" />
                          {job.customerPhone}
                        </a>
                      )}
                      <a
                        href={mapsUrl(job.dropLocation?.lat, job.dropLocation?.lng, job.dropAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-green-800 font-semibold mt-2 ml-3"
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate to customer
                      </a>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Products
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.items.map((item) => (
                        <span key={item.productId} className="text-xs bg-gray-50 px-3 py-2 rounded-lg">
                          {item.productName} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {job.status === 'available' && (
                    <Button onClick={() => handleAccept(job)}>Accept pickup</Button>
                  )}

                  {job.status === 'assigned' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        Enter the seller pickup OTP
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Pickup OTP"
                        value={pickupInput[job.id!] || ''}
                        onChange={(e) =>
                          setPickupInput((prev) => ({ ...prev, [job.id!]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <Button onClick={() => handlePickup(job)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify pickup
                      </Button>
                    </div>
                  )}

                  {job.status === 'picked_up' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Enter the customer delivery OTP</p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Customer OTP"
                        value={dropInput[job.id!] || ''}
                        onChange={(e) =>
                          setDropInput((prev) => ({ ...prev, [job.id!]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <Button onClick={() => handleDrop(job)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete delivery
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryJobsPage;
