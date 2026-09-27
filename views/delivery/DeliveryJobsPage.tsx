'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bike,
  CheckCircle,
  IndianRupee,
  KeyRound,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import {
  acceptDeliveryJob,
  completeDeliveryJob,
  enableDeliveryPartner,
  fetchDeliveryJobByOrderId,
  fetchDeliveryJobs,
  getDeliveryPartner,
  isDeliveryPartner,
  mapsUrl,
  setDeliveryPartnerOnline,
  verifyPickupOtp,
  type DeliveryJob,
} from '@/lib/delivery';
import { fetchOrderById } from '@/lib/orders/store';
import { subscribeTable } from '@/lib/realtime/subscribe';
import type { OrderItem, OrderRecord } from '@/lib/orders/types';

function readFocusOrderId(pathId?: string) {
  if (typeof window === 'undefined') return pathId || null;
  const fromQuery = new URLSearchParams(window.location.search).get('order');
  const fromPath = window.location.pathname.split('/').filter(Boolean)[1];
  return fromQuery || fromPath || pathId || null;
}

function isCashPayment(method?: string | null) {
  return /cod|cash/i.test(method || '');
}

function itemVariant(item: OrderItem) {
  return [item.size, item.color, item.brand].filter(Boolean).join(' · ');
}

function JobOrderDetail({
  job,
  order,
  pickupValue,
  dropValue,
  onPickupChange,
  onDropChange,
  onAccept,
  onPickup,
  onDrop,
}: {
  job: DeliveryJob | null;
  order: OrderRecord | null;
  pickupValue: string;
  dropValue: string;
  onPickupChange: (value: string) => void;
  onDropChange: (value: string) => void;
  onAccept: () => void;
  onPickup: () => void;
  onDrop: () => void;
}) {
  const items = job?.items?.length ? job.items : order?.items || [];
  const pickAddress = job?.pickAddress || order?.storeAddress || order?.storeLocation?.address || 'Store address unavailable';
  const dropAddress = job?.dropAddress || order?.customerAddress || 'Customer address unavailable';
  const pickLat = job?.pickLocation?.lat ?? order?.storeLocation?.lat;
  const pickLng = job?.pickLocation?.lng ?? order?.storeLocation?.lng;
  const dropLat = job?.dropLocation?.lat ?? order?.customerLocation?.lat;
  const dropLng = job?.dropLocation?.lng ?? order?.customerLocation?.lng;
  const storePhone = job?.storePhone || order?.storePhone;
  const customerPhone = job?.customerPhone || order?.customerPhone || '';
  const customerName = job?.customerName || order?.customerName || 'Customer';
  const sellerName = job?.sellerName || order?.sellerName || 'Store';
  const total = Number(job?.total || order?.total || 0);
  const paymentMethod = order?.paymentMethod || 'razorpay';
  const cash = isCashPayment(paymentMethod);
  const status = job?.status || (order?.status === 'packed' ? 'available' : order?.status) || 'placed';

  return (
    <div id="delivery-order-detail" className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-orange-50/60">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Order details</p>
            <p className="font-black text-2xl text-gray-900 mt-1">
              {job?.orderNumber || order?.orderNumber || 'Order'}
            </p>
            <p className="text-sm text-gray-600 mt-1">{sellerName}</p>
          </div>
          <div className="text-right">
            <span className="inline-block h-fit px-3 py-1 rounded-full text-xs font-bold bg-white text-orange-800 border border-orange-200">
              {String(status).replaceAll('_', ' ')}
            </span>
            <p className="mt-2 text-lg font-black text-gray-900 flex items-center justify-end gap-1">
              <IndianRupee className="w-4 h-4" />
              {total.toLocaleString()}
            </p>
            <p className={`text-xs font-semibold ${cash ? 'text-amber-800' : 'text-green-700'}`}>
              {cash ? 'Collect cash on delivery' : 'Already paid online'}
            </p>
          </div>
        </div>
        {(order?.distanceKm != null || order?.etaMinutes != null) && (
          <p className="text-xs text-gray-600 mt-3">
            {order.distanceKm != null ? `${order.distanceKm} km` : ''}
            {order.distanceKm != null && order.etaMinutes != null ? ' · ' : ''}
            {order.etaMinutes != null ? `~${order.etaMinutes} min` : ''}
          </p>
        )}
      </div>

      <div className="p-5 space-y-4 text-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-amber-50">
            <p className="text-xs font-bold uppercase text-amber-800 mb-2 flex items-center gap-1">
              <Store className="w-3 h-3" />
              Pickup
            </p>
            <p className="font-semibold text-gray-900">{sellerName}</p>
            <p className="text-gray-900 flex items-start gap-2 mt-1">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              {pickAddress}
            </p>
            {storePhone && (
              <a href={`tel:${storePhone}`} className="inline-flex items-center gap-1 text-amber-900 font-semibold mt-2">
                <Phone className="w-3 h-3" />
                {storePhone}
              </a>
            )}
            <a
              href={mapsUrl(pickLat, pickLng, pickAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-orange-700 font-semibold mt-2 sm:ml-3"
            >
              <Navigation className="w-3 h-3" />
              Navigate to store
            </a>
          </div>

          <div className="p-3 rounded-xl bg-green-50">
            <p className="text-xs font-bold uppercase text-green-800 mb-2">Drop</p>
            <p className="font-semibold text-gray-900">{customerName}</p>
            <p className="text-gray-900 flex items-start gap-2 mt-1">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              {dropAddress}
            </p>
            {customerPhone && (
              <a href={`tel:${customerPhone}`} className="inline-flex items-center gap-1 text-green-800 font-semibold mt-2">
                <Phone className="w-3 h-3" />
                {customerPhone}
              </a>
            )}
            <a
              href={mapsUrl(dropLat, dropLng, dropAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-green-800 font-semibold mt-2 sm:ml-3"
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
          {items.length === 0 ? (
            <p className="text-gray-500">No products on this order.</p>
          ) : (
            <div className="divide-y rounded-xl border overflow-hidden">
              {items.map((item, index) => (
                <div key={`${item.productId || 'item'}-${index}`} className="flex gap-3 p-3 bg-white">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                    {itemVariant(item) && (
                      <p className="text-xs text-gray-500">{itemVariant(item)}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Qty {item.quantity}
                      {item.price ? ` · ₹${Number(item.price).toLocaleString()} each` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {!job && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            {order?.status === 'cancelled'
              ? 'This order was cancelled.'
              : order?.status === 'delivered'
                ? 'This order is already delivered.'
                : 'Waiting for the seller to pack this order. The pickup job will appear here after it is packed.'}
          </p>
        )}

        {job?.status === 'available' && (
          <Button onClick={onAccept}>Accept pickup</Button>
        )}

        {job?.status === 'assigned' && (
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
              value={pickupValue}
              onChange={(e) => onPickupChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <Button onClick={onPickup}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify pickup
            </Button>
          </div>
        )}

        {job?.status === 'picked_up' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Enter the customer delivery OTP</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Customer OTP"
              value={dropValue}
              onChange={(e) => onDropChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <Button onClick={onDrop}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete delivery
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const DeliveryJobsPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
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
  const [focusOrderId, setFocusOrderId] = useState<string | null>(params.id || null);
  const [focusJob, setFocusJob] = useState<DeliveryJob | null>(null);
  const [focusOrder, setFocusOrder] = useState<OrderRecord | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = userData?.role === 'admin';

  const load = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoading(true);
    try {
      const partner = isAdmin || (await isDeliveryPartner(currentUser.uid));
      setAllowed(partner);
      if (!partner) return;
      const rider = await getDeliveryPartner(currentUser.uid);
      setIsOnline(Boolean(rider?.isOnline));
      const nextJobs = await fetchDeliveryJobs(isAdmin ? undefined : currentUser.uid);
      setJobs(nextJobs);

      const focusedId = readFocusOrderId(params.id);
      if (focusedId) {
        const [job, order] = await Promise.all([
          fetchDeliveryJobByOrderId(focusedId).catch(() => null),
          fetchOrderById(focusedId).catch(() => null),
        ]);
        setFocusJob(job);
        setFocusOrder(order);
      } else {
        setFocusJob(null);
        setFocusOrder(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setFocusOrderId(readFocusOrderId(params.id));
  }, [params.id]);

  useEffect(() => {
    if (!currentUser) return;
    void load();
    return subscribeTable({
      channel: `delivery-jobs-${currentUser.uid}`,
      table: 'delivery_jobs',
      onChange: () => {
        void load(true);
      },
    });
  }, [currentUser, userData?.role, focusOrderId]);

  useEffect(() => {
    if (!focusOrderId || loading) return;
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusOrderId, loading, focusJob?.id, focusOrder?.id]);

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

  const listJobs = jobs.filter((job) => job.orderId !== focusOrderId);

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
            <Button variant="secondary" onClick={() => load()}>Refresh</Button>
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
        ) : (
          <div className="space-y-4">
            {focusOrderId && (
              <div ref={detailRef}>
                {focusJob || focusOrder ? (
                  <JobOrderDetail
                    job={focusJob}
                    order={focusOrder}
                    pickupValue={focusJob?.id ? pickupInput[focusJob.id] || '' : ''}
                    dropValue={focusJob?.id ? dropInput[focusJob.id] || '' : ''}
                    onPickupChange={(value) => {
                      if (!focusJob?.id) return;
                      setPickupInput((prev) => ({ ...prev, [focusJob.id!]: value }));
                    }}
                    onDropChange={(value) => {
                      if (!focusJob?.id) return;
                      setDropInput((prev) => ({ ...prev, [focusJob.id!]: value }));
                    }}
                    onAccept={() => focusJob && handleAccept(focusJob)}
                    onPickup={() => focusJob && handlePickup(focusJob)}
                    onDrop={() => focusJob && handleDrop(focusJob)}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
                    No order found for this delivery link.
                  </div>
                )}
              </div>
            )}

            {!focusOrderId && jobs.length === 0 && (
              <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
                {!isOnline && !isAdmin
                  ? 'You are offline. Go online to receive new pickup jobs.'
                  : 'No active pickups. Jobs appear when a seller marks an order as packed.'}
              </div>
            )}

            {listJobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  focusOrderId === job.orderId ? 'ring-2 ring-orange-400' : ''
                }`}
              >
                <div className="p-5 border-b flex justify-between gap-3">
                  <div>
                    <p className="font-black text-lg">{job.orderNumber}</p>
                    <p className="text-sm text-gray-600">{job.sellerName}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">₹{Number(job.total || 0).toLocaleString()}</p>
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
                      {job.storePhone && (
                        <a href={`tel:${job.storePhone}`} className="inline-flex items-center gap-1 text-amber-900 mt-2">
                          <Phone className="w-3 h-3" />
                          {job.storePhone}
                        </a>
                      )}
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
                      {job.items.map((item, index) => (
                        <span key={`${item.productId || 'item'}-${index}`} className="text-xs bg-gray-50 px-3 py-2 rounded-lg">
                          {item.productName} × {item.quantity}
                          {itemVariant(item) ? ` · ${itemVariant(item)}` : ''}
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
