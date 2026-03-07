'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, differenceInCalendarDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useMerchantBySlug, useMerchantServices, useReservationAvailability, useActivePlatformFees } from '@/hooks/useStorefront';
import { useCreateReservation } from '@/hooks/useCustomerActions';
import { AuthGate } from '@/components/booking/auth-gate';
import { BookingSummary } from '@/components/booking/booking-summary';
import { ReservationCalendar } from './reservation-calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Home, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types/api';
import Link from 'next/link';
import { formatPrice } from '@/lib/storefront-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { RewardSelector } from '@/components/loyalty/reward-selector';
import { CouponInput } from '@/components/checkout/coupon-input';

function formatCurrency(amount: string | number) {
  return `\u20B1${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function ReservationPage({
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
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const monthStr = format(currentMonth, 'yyyy-MM');

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const { data: servicesData } = useMerchantServices(slug, { per_page: 100 });
  const { data: availabilityData, isLoading: availabilityLoading } = useReservationAvailability(
    slug,
    selectedServiceId,
    monthStr,
  );
  const { data: feesData } = useActivePlatformFees();
  const createReservation = useCreateReservation(slug);

  const merchant = merchantData?.data;
  const units = (servicesData?.data ?? []).filter((s: Service) => s.service_type === 'reservation');
  const availability = availabilityData?.data;

  const checkIn = selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : '';
  const checkOut = selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : '';
  const nights =
    selectedRange?.from && selectedRange?.to
      ? differenceInCalendarDays(selectedRange.to, selectedRange.from)
      : 0;
  const pricePerNight = availability?.service.price_per_night
    ? Number(availability.service.price_per_night)
    : 0;
  const estimatedTotal = nights * pricePerNight;

  const selectedUnitFromList = units.find((s: Service) => s.id === selectedServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !checkIn || !checkOut) return;

    try {
      await createReservation.mutateAsync({
        service_id: selectedServiceId,
        check_in: checkIn,
        check_out: checkOut,
        guest_count: guestCount,
        notes: notes || undefined,
        special_requests: specialRequests || undefined,
        loyalty_reward_id: selectedRewardId ?? undefined,
        coupon_code: couponCode ?? undefined,
      });
      toast.success('Reservation created successfully!');
      router.push(`/merchants/${slug}`);
    } catch {
      toast.error('Failed to create reservation. Please try again.');
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
    <AuthGate title="Sign in to reserve">
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
          Make a Reservation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column — unit detail */}
          <div className="space-y-4">
            {selectedUnitFromList ? (
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in overflow-hidden">
                {selectedUnitFromList.image?.preview && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={selectedUnitFromList.image.preview}
                      alt={selectedUnitFromList.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold">{selectedUnitFromList.name}</h2>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shrink-0">
                      Rental
                    </Badge>
                  </div>

                  {selectedUnitFromList.service_category?.name && (
                    <p className="text-sm text-muted-foreground">{selectedUnitFromList.service_category.name}</p>
                  )}

                  {selectedUnitFromList.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedUnitFromList.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {selectedUnitFromList.max_capacity && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Up to {selectedUnitFromList.max_capacity} guests
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-primary">
                    {selectedUnitFromList.price_per_night
                      ? <>{formatCurrency(selectedUnitFromList.price_per_night)}<span className="text-sm font-normal text-muted-foreground"> / night</span></>
                      : formatPrice(selectedUnitFromList.price)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-warm border-0 rounded-xl border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Home className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a unit to see its details</p>
                </CardContent>
              </Card>
            )}

            {/* Reservation summary */}
            {availability && nights > 0 && (() => {
              const reservationFee = feesData?.data?.find(f => f.transaction_type === 'reservation');
              const feeRate = reservationFee ? Number(reservationFee.rate_percentage) : 0;
              const feeAmount = Math.round(estimatedTotal * (feeRate / 100) * 100) / 100;
              const total = estimatedTotal + feeAmount;
              const items = [
                { label: 'Unit', value: availability.service.name },
                { label: 'Check-in', value: selectedRange?.from ? format(selectedRange.from, 'MMM d, yyyy') : '' },
                { label: 'Check-out', value: selectedRange?.to ? format(selectedRange.to, 'MMM d, yyyy') : '' },
                { label: 'Nights', value: nights.toString() },
                { label: 'Guests', value: guestCount.toString() },
                { label: 'Rate', value: `${formatCurrency(pricePerNight)}/night` },
                ...(feeRate > 0 ? [
                  { label: 'Subtotal', value: formatCurrency(estimatedTotal) },
                  { label: `Service Fee (${feeRate}%)`, value: formatCurrency(feeAmount) },
                ] : []),
              ];
              return (
                <div className="animate-fade-in-up">
                  <BookingSummary
                    title="Reservation Summary"
                    items={items}
                    total={{ label: 'Estimated Total', value: formatCurrency(total) }}
                  />
                </div>
              );
            })()}
          </div>

          {/* Right column — form with calendar */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-base font-[family-name:var(--font-display)]">Reservation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={selectedServiceId?.toString() ?? ''}
                      onValueChange={(v) => {
                        setSelectedServiceId(Number(v));
                        setSelectedRange(undefined);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((s: Service) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                            {s.floor ? ` (${s.floor})` : ''} — {formatCurrency(s.price_per_night ?? s.price)}/night
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendar */}
                  {selectedServiceId && (
                    <div className="animate-fade-in">
                      <Label className="mb-2 block">Select Dates</Label>
                      {availabilityLoading && !availability ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : availability ? (
                        <ReservationCalendar
                          reservedDates={availability.reserved_dates}
                          selectedRange={selectedRange}
                          onRangeSelect={setSelectedRange}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          pricePerNight={pricePerNight}
                          nights={nights}
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Guest count & notes */}
                  {nights > 0 && (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <Label>Guests</Label>
                        <Input
                          type="number"
                          className="h-11 rounded-lg"
                          min={1}
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label>Notes (optional)</Label>
                        <Textarea className="rounded-lg" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
                      </div>

                      <div>
                        <Label>Special Requests (optional)</Label>
                        <Textarea
                          className="rounded-lg"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="e.g. late check-in, extra pillows..."
                        />
                      </div>
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
                  transactionType="reservation"
                  subtotal={estimatedTotal}
                  disabled={createReservation.isPending}
                  appliedCode={couponCode}
                  appliedDiscount={couponDiscount}
                  onApply={(code, discount) => { setCouponCode(code); setCouponDiscount(discount); }}
                  onRemove={() => { setCouponCode(null); setCouponDiscount(0); }}
                />
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full shadow-warm-lg"
                disabled={!selectedServiceId || !checkIn || !checkOut || createReservation.isPending}
              >
                {createReservation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Reservation
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
