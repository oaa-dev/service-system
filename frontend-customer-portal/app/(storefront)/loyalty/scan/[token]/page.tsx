'use client';

import { use, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Gift,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StampCard } from '@/components/loyalty/stamp-card';
import { useScanLoyaltyQr } from '@/hooks/useLoyalty';
import { useAuthStore } from '@/stores/authStore';
import type { ScanResult } from '@/types/api';

function ScanSuccess({ result }: { result: ScanResult }) {
  const { card, stamp, reward_unlocked } = result;
  const program = card.loyalty_program;
  const required = program?.required_stamps ?? 0;

  // The newly earned stamp index is current_stamps - 1 (already incremented on server)
  const newStampIndex = Math.min(card.current_stamps - 1, required - 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-100/50">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">
          Stamp earned!
        </h2>
        <p className="text-muted-foreground text-sm">
          You collected stamp{' '}
          <strong>
            {card.current_stamps} of {required}
          </strong>{' '}
          at <strong>{card.merchant?.name ?? 'this merchant'}</strong>.
        </p>
        {stamp.source === 'qr_scan' && (
          <Badge variant="secondary" className="text-xs">
            QR scan
          </Badge>
        )}
      </div>

      {/* Stamp card visual */}
      <StampCard card={card} newStampIndex={newStampIndex} />

      {/* Reward unlocked callout */}
      {reward_unlocked && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="font-semibold text-amber-800">Reward unlocked!</p>
          </div>
          <p className="text-sm text-amber-700">
            {reward_unlocked.reward_description ??
              (reward_unlocked.reward_type === 'discount_percentage'
                ? `${reward_unlocked.reward_value ?? '?'}% discount`
                : reward_unlocked.reward_type === 'discount_fixed'
                  ? `₱${reward_unlocked.reward_value ?? '?'} off`
                  : 'Free product reward')}
          </p>
          {reward_unlocked.expires_at && (
            <p className="text-xs text-amber-600">
              Use before{' '}
              {new Date(reward_unlocked.expires_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full rounded-full shadow-warm">
          <Link href={`/loyalty/${card.id}`}>
            View my card
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href="/loyalty">All my cards</Link>
        </Button>
        {card.merchant?.slug && (
          <Button asChild variant="ghost" className="w-full text-muted-foreground">
            <Link href={`/merchants/${card.merchant.slug}`}>
              Back to {card.merchant.name}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ScanError({ message }: { message: string }) {
  const isAlreadyScanned = message.toLowerCase().includes('already') || message.toLowerCase().includes('used');
  const isExpired = message.toLowerCase().includes('expir');

  const title = isExpired
    ? 'QR code expired'
    : isAlreadyScanned
      ? 'Already scanned'
      : 'Scan failed';

  const description = isExpired
    ? 'This QR code is no longer valid. Ask the merchant for a new one.'
    : isAlreadyScanned
      ? 'You have already scanned this QR code. Each code can only be used once.'
      : message;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">{title}</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full rounded-full">
          <Link href="/loyalty">View my cards</Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href="/merchants">Browse merchants</Link>
        </Button>
      </div>
    </div>
  );
}

function NotAuthenticatedPrompt({ token }: { token: string }) {
  return (
    <div className="space-y-6 text-center animate-fade-in">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">Sign in to earn stamps</h2>
        <p className="text-muted-foreground text-sm">
          You need to be signed in to collect stamps and rewards.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full rounded-full shadow-warm">
          <Link href={`/login?redirect=/loyalty/scan/${token}`}>Sign in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href={`/register?redirect=/loyalty/scan/${token}`}>Create account</Link>
        </Button>
      </div>
    </div>
  );
}

export default function LoyaltyScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { isAuthenticated } = useAuthStore();
  const { mutate: scan, data: result, isPending, error, isSuccess, isError } = useScanLoyaltyQr();

  // Only scan once per mount, and only when authenticated
  const hasFired = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || hasFired.current) return;
    hasFired.current = true;
    scan(token);
  }, [isAuthenticated, scan, token]);

  // Extract a human-readable message from the API error
  const errorMessage = (() => {
    if (!error) return 'Something went wrong. Please try again.';
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? error.message ?? 'Something went wrong. Please try again.';
  })();

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      {/* Not logged in */}
      {!isAuthenticated && (
        <NotAuthenticatedPrompt token={token} />
      )}

      {/* Loading / scanning */}
      {isAuthenticated && isPending && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-display)]">Scanning…</h2>
          <p className="text-muted-foreground text-sm">Recording your stamp, please wait.</p>
        </div>
      )}

      {/* Success */}
      {isAuthenticated && isSuccess && result && (
        <ScanSuccess result={result} />
      )}

      {/* Error */}
      {isAuthenticated && isError && (
        <ScanError message={errorMessage} />
      )}
    </div>
  );
}
