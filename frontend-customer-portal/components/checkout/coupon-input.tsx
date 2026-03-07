'use client';

import { useState } from 'react';
import { Ticket, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useValidateCoupon } from '@/hooks/useStorefront';
import type { Coupon } from '@/types/api';

interface CouponInputProps {
  merchantSlug: string;
  transactionType: 'booking' | 'reservation' | 'sell_product';
  subtotal: number;
  disabled?: boolean;
  onApply: (code: string, discount: number, coupon: Coupon) => void;
  onRemove: () => void;
  appliedCode?: string | null;
  appliedDiscount?: number;
}

export function CouponInput({
  merchantSlug,
  transactionType,
  subtotal,
  disabled,
  onApply,
  onRemove,
  appliedCode,
  appliedDiscount,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;
    setError(null);

    try {
      const result = await validateCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        merchant_slug: merchantSlug,
        transaction_type: transactionType,
        subtotal,
      });
      const data = result.data;
      onApply(data.coupon.code, data.discount_amount, data.coupon);
      setCode('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handleRemove = () => {
    onRemove();
    setError(null);
    setCode('');
  };

  if (appliedCode) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Coupon <code className="font-mono font-bold">{appliedCode}</code> applied
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-emerald-600 hover:text-red-600"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {appliedDiscount !== undefined && appliedDiscount > 0 && (
          <p className="text-xs text-emerald-700 mt-1">
            Discount: -₱{appliedDiscount.toFixed(2)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Have a coupon?</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          placeholder="Enter code"
          className="font-mono uppercase text-sm"
          disabled={disabled || validateCoupon.isPending}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={disabled || validateCoupon.isPending || !code.trim()}
        >
          {validateCoupon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
