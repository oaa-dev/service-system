'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantBySlug, useMerchantServices, useServiceDetail, useActivePlatformFees } from '@/hooks/useStorefront';
import { useCreateOrder } from '@/hooks/useCustomerActions';
import { AuthGate } from '@/components/booking/auth-gate';
import { BookingSummary } from '@/components/booking/booking-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Package, ShoppingBag } from 'lucide-react';
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

export default function OrderPage({
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
  const [quantity, setQuantity] = useState(1);
  const [unitLabel, setUnitLabel] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const { data: servicesData } = useMerchantServices(slug, { per_page: 100 });
  const { data: serviceDetailData } = useServiceDetail(slug, selectedServiceId ?? 0);
  const { data: feesData } = useActivePlatformFees();
  const createOrder = useCreateOrder(slug);

  const merchant = merchantData?.data;
  const products = (servicesData?.data ?? []).filter((s: Service) => s.service_type === 'sellable');
  const selectedProduct = serviceDetailData?.data ?? null;

  const unitPrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const estimatedTotal = unitPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || quantity <= 0) return;

    try {
      await createOrder.mutateAsync({
        service_id: selectedServiceId,
        quantity,
        unit_label: unitLabel,
        notes: notes || undefined,
        loyalty_reward_id: selectedRewardId ?? undefined,
        coupon_code: couponCode ?? undefined,
      });
      toast.success('Order placed successfully!');
      router.push(`/merchants/${slug}`);
    } catch {
      toast.error('Failed to place order. Please try again.');
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
    <AuthGate title="Sign in to order">
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
          Place an Order
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column — product detail */}
          <div className="space-y-4">
            {selectedProduct ? (
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in overflow-hidden">
                {selectedProduct.image?.preview && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={selectedProduct.image.preview}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold">{selectedProduct.name}</h2>
                    <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 shrink-0">
                      Product
                    </Badge>
                  </div>

                  {selectedProduct.service_category?.name && (
                    <p className="text-sm text-muted-foreground">{selectedProduct.service_category.name}</p>
                  )}

                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                  )}

                  {selectedProduct.track_stock && selectedProduct.stock_quantity !== null && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      {selectedProduct.stock_quantity} in stock
                    </span>
                  )}

                  {selectedProduct.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</p>
                  )}

                  <p className="text-2xl font-bold text-primary">{formatPrice(selectedProduct.price)}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-warm border-0 rounded-xl border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a product to see its details</p>
                </CardContent>
              </Card>
            )}

            {/* Order summary in left column */}
            {selectedProduct && quantity > 0 && (() => {
              const orderFee = feesData?.data?.find(f => f.transaction_type === 'sell_product');
              const feeRate = orderFee ? Number(orderFee.rate_percentage) : 0;
              const feeAmount = Math.round(estimatedTotal * (feeRate / 100) * 100) / 100;
              const total = estimatedTotal + feeAmount;
              const items = [
                { label: 'Product', value: selectedProduct.name },
                { label: 'Unit Price', value: formatCurrency(selectedProduct.price) },
                { label: 'Quantity', value: `${quantity} ${unitLabel}` },
                ...(feeRate > 0 ? [
                  { label: 'Subtotal', value: formatCurrency(estimatedTotal) },
                  { label: `Service Fee (${feeRate}%)`, value: formatCurrency(feeAmount) },
                ] : []),
              ];
              return (
                <div className="animate-fade-in-up">
                  <BookingSummary
                    title="Order Summary"
                    items={items}
                    total={{ label: 'Estimated Total', value: formatCurrency(total) }}
                  />
                </div>
              );
            })()}
          </div>

          {/* Right column — form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="shadow-warm border-0 rounded-xl animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-base font-[family-name:var(--font-display)]">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Product</Label>
                    <Select
                      value={selectedServiceId?.toString() ?? ''}
                      onValueChange={(v) => setSelectedServiceId(Number(v))}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((s: Service) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name} — {formatCurrency(s.price)}
                            {s.track_stock && s.stock_quantity !== null && ` (${s.stock_quantity} in stock)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-lg"
                        min={1}
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        className="h-11 rounded-lg"
                        value={unitLabel}
                        onChange={(e) => setUnitLabel(e.target.value)}
                        placeholder="e.g. pcs, kg, lbs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea
                      className="rounded-lg"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions..."
                    />
                  </div>
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
                  transactionType="sell_product"
                  subtotal={estimatedTotal}
                  disabled={createOrder.isPending}
                  appliedCode={couponCode}
                  appliedDiscount={couponDiscount}
                  onApply={(code, discount) => { setCouponCode(code); setCouponDiscount(discount); }}
                  onRemove={() => { setCouponCode(null); setCouponDiscount(0); }}
                />
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full shadow-warm-lg"
                disabled={!selectedServiceId || quantity <= 0 || createOrder.isPending}
              >
                {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Order
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
