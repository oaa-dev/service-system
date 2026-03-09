'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth } from 'date-fns';
import { useMerchantBySlug, useMerchantServices, useBookingAvailability, useActivePlatformFees } from '@/hooks/useStorefront';
import { useCreateBooking } from '@/hooks/useCustomerActions';
import { AuthGate } from '@/components/booking/auth-gate';
import { BookingSummary } from '@/components/booking/booking-summary';
import { BookingCalendar } from './booking-calendar';
import { MerchantSlotPicker } from './merchant-slot-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types/api';
import Link from 'next/link';
import { formatPrice } from '@/lib/storefront-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { RewardSelector } from '@/components/loyalty/reward-selector';
import { CouponInput } from '@/components/checkout/coupon-input';

function formatTime(time: string) {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function formatCurrency(amount: string | number) {
  return `\u20B1${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = use(params);
  const { service: serviceParam } = use(searchParams);
  const router = useRouter();

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    serviceParam ? Number(serviceParam) : null,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSlotStartTime, setSelectedSlotStartTime] = useState<string | null>(null);
  const [selectedSlotEndTime, setSelectedSlotEndTime] = useState<string | null>(null);
  const [selectedSlotMaxCapacity, setSelectedSlotMaxCapacity] = useState<number | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const monthStr = format(currentMonth, 'yyyy-MM');
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const { data: servicesData } = useMerchantServices(slug, { per_page: 100 });
  const { data: availabilityData, isLoading: availabilityLoading } = useBookingAvailability(
    slug,
    selectedServiceId,
    monthStr,
  );
  const { data: feesData } = useActivePlatformFees();
  const createBooking = useCreateBooking(slug);

  const merchant = merchantData?.data;
  const services = (servicesData?.data ?? []).filter((s: Service) => s.service_type === 'bookable');
  const availability = availabilityData?.data;

  const selectedServiceFromList = services.find((s: Service) => s.id === selectedServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedDateStr || !selectedSlotId) return;

    try {
      const result = await createBooking.mutateAsync({
        service_id: selectedServiceId,
        booking_date: selectedDateStr,
        booking_slot_id: selectedSlotId,
        party_size: partySize,
        notes: notes || undefined,
        loyalty_reward_id: selectedRewardId ?? undefined,
        coupon_code: couponCode ?? undefined,
      });
      const checkoutUrl = result?.data?.payment?.checkout_url;
      if (checkoutUrl) {
        toast.success('Redirecting to payment...');
        window.location.href = checkoutUrl;
      } else {
        toast.success('Booking created successfully!');
        router.push(`/merchants/${slug}`);
      }
    } catch {
      toast.error('Failed to create booking. Please try again.');
    }
  };

  if (merchantLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Merchant not found</h2>
      </div>
    );
  }

  return (
    <AuthGate title="Sign in to book">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href={`/merchants/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {merchant.name}
        </Link>

        {/* Merchant identity */}
        <div className="flex items-center gap-3 mb-4 animate-fade-in">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={merchant.logo?.preview} alt={merchant.name} className="object-cover" />
            <AvatarFallback className="rounded-lg text-sm font-bold bg-primary/10 text-primary">
              {getInitials(merchant.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground">at</p>
            <p className="font-semibold leading-tight">{merchant.name}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6 font-[family-name:var(--font-display)] animate-fade-in">
          Book a Service
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column — service detail + summary */}
          <div className="space-y-4">
            {selectedServiceFromList ? (
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in overflow-hidden">
                {selectedServiceFromList.image?.preview && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={selectedServiceFromList.image.preview}
                      alt={selectedServiceFromList.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold">{selectedServiceFromList.name}</h2>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">
                      Bookable
                    </Badge>
                  </div>

                  {selectedServiceFromList.service_category?.name && (
                    <p className="text-sm text-muted-foreground">{selectedServiceFromList.service_category.name}</p>
                  )}

                  {selectedServiceFromList.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedServiceFromList.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {selectedServiceFromList.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {selectedServiceFromList.duration} min
                      </span>
                    )}
                    {selectedServiceFromList.max_capacity && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Up to {selectedServiceFromList.max_capacity}
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-primary">{formatPrice(selectedServiceFromList.price)}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-warm border-0 rounded-xl border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a service to see its details</p>
                </CardContent>
              </Card>
            )}

            {/* Booking summary */}
            {availability && selectedSlotStartTime && selectedDate && (() => {
              const subtotal = Number(availability.service.price) * partySize;
              const bookingFee = feesData?.data?.find(f => f.transaction_type === 'booking');
              const feeRate = bookingFee ? Number(bookingFee.rate_percentage) : 0;
              const feeAmount = Math.round(subtotal * (feeRate / 100) * 100) / 100;
              const total = subtotal + feeAmount;

              // Compute duration from slot times if available, fallback to service duration
              let durationMin = availability.service.duration;
              if (selectedSlotEndTime) {
                const [sh, sm] = selectedSlotStartTime.split(':').map(Number);
                const [eh, em] = selectedSlotEndTime.split(':').map(Number);
                durationMin = (eh * 60 + em) - (sh * 60 + sm);
              }

              const timeLabel = selectedSlotEndTime
                ? `${formatTime(selectedSlotStartTime)} – ${formatTime(selectedSlotEndTime)}`
                : formatTime(selectedSlotStartTime);

              const items = [
                { label: 'Service', value: availability.service.name },
                { label: 'Date', value: format(selectedDate, 'MMM d, yyyy') },
                { label: 'Time', value: timeLabel },
                ...(durationMin > 0 ? [{ label: 'Duration', value: `${durationMin} min` }] : []),
                { label: 'Party Size', value: partySize.toString() },
                ...(feeRate > 0 ? [
                  { label: 'Subtotal', value: formatCurrency(subtotal) },
                  { label: `Service Fee (${feeRate}%)`, value: formatCurrency(feeAmount) },
                ] : []),
              ];
              return (
                <div className="animate-fade-in-up">
                  <BookingSummary
                    title="Booking Summary"
                    items={items}
                    total={{ label: 'Total', value: formatCurrency(total) }}
                  />
                </div>
              );
            })()}
          </div>

          {/* Right column — form with calendar */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service selector */}
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-base font-[family-name:var(--font-display)]">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label>Service</Label>
                    <Select
                      value={selectedServiceId?.toString() ?? ''}
                      onValueChange={(v) => {
                        setSelectedServiceId(Number(v));
                        setSelectedDate(undefined);
                        setSelectedSlotId(null);
                        setSelectedSlotStartTime(null);
                        setSelectedSlotEndTime(null);
                        setSelectedSlotMaxCapacity(null);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s: Service) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name} — {formatCurrency(s.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendar */}
                  {selectedServiceId && (
                    <div className="animate-fade-in">
                      <Label className="mb-2 block">Select Date</Label>
                      {availabilityLoading && !availability ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : availability ? (
                        <BookingCalendar
                          schedule={availability.schedule}
                          bookedSlots={availability.booked_slots}
                          serviceDuration={availability.service.duration}
                          maxCapacity={availability.service.max_capacity}
                          selectedDate={selectedDate}
                          onDateSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedSlotId(null);
                            setSelectedSlotStartTime(null);
                            setSelectedSlotEndTime(null);
                            setSelectedSlotMaxCapacity(null);
                          }}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Party size (before slot picker so capacity filtering works) */}
                  {selectedDate && (
                    <div className="animate-fade-in">
                      <Label>Party Size</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-lg"
                        min={1}
                        max={selectedSlotMaxCapacity ?? availability?.service.max_capacity ?? 100}
                        value={partySize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPartySize(val > 0 ? val : 1);
                          setSelectedSlotId(null);
                          setSelectedSlotStartTime(null);
                          setSelectedSlotEndTime(null);
                          setSelectedSlotMaxCapacity(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Slot picker */}
                  {selectedDate && selectedServiceId && (
                    <div className="animate-fade-in">
                      <Label className="mb-2 block">Select Time</Label>
                      <MerchantSlotPicker
                        slug={slug}
                        serviceId={selectedServiceId}
                        selectedDate={selectedDateStr}
                        selectedSlotId={selectedSlotId}
                        partySize={partySize}
                        onSlotSelect={(slotId, slotStartTime, slotEndTime, slotMaxCapacity) => {
                          setSelectedSlotId(slotId);
                          setSelectedSlotStartTime(slotStartTime);
                          setSelectedSlotEndTime(slotEndTime);
                          setSelectedSlotMaxCapacity(slotMaxCapacity);
                        }}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  {selectedSlotStartTime && (
                    <div className="animate-fade-in">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        className="rounded-lg"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {merchant && (
                <RewardSelector
                  merchantId={merchant.id}
                  selectedRewardId={selectedRewardId}
                  onApply={(id) => { setSelectedRewardId(id); if (id) { setCouponCode(null); setCouponDiscount(0); } }}
                />
              )}

              {merchant && !selectedRewardId && (
                <CouponInput
                  merchantSlug={slug}
                  transactionType="booking"
                  subtotal={selectedServiceFromList ? parseFloat(selectedServiceFromList.price) * partySize : 0}
                  disabled={createBooking.isPending}
                  appliedCode={couponCode}
                  appliedDiscount={couponDiscount}
                  onApply={(code, discount) => { setCouponCode(code); setCouponDiscount(discount); }}
                  onRemove={() => { setCouponCode(null); setCouponDiscount(0); }}
                />
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full shadow-warm-lg"
                disabled={
                  !selectedServiceId ||
                  !selectedDate ||
                  !selectedSlotStartTime ||
                  createBooking.isPending
                }
              >
                {createBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
