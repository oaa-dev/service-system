'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGenerateLoyaltyQr } from '@/hooks/useLoyalty';
import type { LoyaltyStampQrCode, LoyaltyQrMode } from '@/types/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { QrCode, RefreshCw, Clock, Scan, Info } from 'lucide-react';

// ─── Countdown hook ──────────────────────────────────────────────────────────

function calcRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function useCountdown(expiresAt: string | null): { seconds: number; isExpired: boolean } {
  // Tick counter drives re-renders; actual value is derived each render
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt]);

  const seconds = calcRemaining(expiresAt);
  return { seconds, isExpired: seconds === 0 };
}

// ─── Countdown display ───────────────────────────────────────────────────────

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const { seconds, isExpired } = useCountdown(expiresAt);

  if (isExpired) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Clock className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isWarning = seconds < 30;

  return (
    <Badge
      variant={isWarning ? 'destructive' : 'secondary'}
      className="gap-1 tabular-nums"
    >
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function QrGenerator() {
  const [mode, setMode] = useState<LoyaltyQrMode>('single_use');
  const [qrCode, setQrCode] = useState<LoyaltyStampQrCode | null>(null);
  const generateQr = useGenerateLoyaltyQr();

  const { isExpired: isSingleUseExpired } = useCountdown(
    qrCode?.mode === 'single_use' ? (qrCode.expires_at ?? null) : null
  );

  const isQrExpired =
    qrCode !== null &&
    (qrCode.is_expired ||
      (qrCode.mode === 'single_use' && isSingleUseExpired) ||
      (qrCode.mode === 'daily' && new Date(qrCode.expires_at) < new Date()));

  const handleGenerate = async () => {
    try {
      const code = await generateQr.mutateAsync({ mode });
      setQrCode(code);
    } catch {
      toast.error('Failed to generate QR code');
    }
  };

  // Midnight validity string for daily mode
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR stamp mode</CardTitle>
          <CardDescription>
            Choose how long the QR code can be used after generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={mode}
            onValueChange={(val) => {
              setMode(val as LoyaltyQrMode);
              setQrCode(null); // clear existing QR when mode changes
            }}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors cursor-pointer">
              <RadioGroupItem value="single_use" id="mode-single" className="mt-0.5" />
              <Label htmlFor="mode-single" className="flex-1 cursor-pointer">
                <span className="font-medium">Single-use</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Valid for 2 minutes. Can only be scanned once. Best for in-person purchases.
                </p>
              </Label>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors cursor-pointer">
              <RadioGroupItem value="daily" id="mode-daily" className="mt-0.5" />
              <Label htmlFor="mode-daily" className="flex-1 cursor-pointer">
                <span className="font-medium">Daily</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Valid until midnight. Can be scanned multiple times. Best for promotions.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Generate button */}
      {(!qrCode || isQrExpired) && (
        <div className="flex justify-center">
          <Button
            onClick={handleGenerate}
            disabled={generateQr.isPending}
            size="lg"
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            {generateQr.isPending ? 'Generating…' : 'Generate QR code'}
          </Button>
        </div>
      )}

      {/* QR display */}
      {qrCode && !isQrExpired && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {qrCode.mode === 'single_use' ? 'Single-use QR' : 'Daily QR'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {qrCode.mode === 'single_use' ? (
                  <CountdownBadge expiresAt={qrCode.expires_at} />
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Valid until midnight
                  </Badge>
                )}
                {qrCode.mode === 'daily' && (
                  <Badge variant="outline" className="gap-1">
                    <Scan className="h-3 w-3" />
                    {qrCode.scan_count} scan{qrCode.scan_count !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={`${process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? 'http://localhost:3001'}/loyalty/scan/${qrCode.token}`}
                size={220}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#09090b"
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-mono tracking-wider break-all">
                {`${process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? 'http://localhost:3001'}/loyalty/scan/${qrCode.token.slice(0, 8)}…`}
              </p>
              {qrCode.mode === 'daily' && (
                <p className="text-xs text-muted-foreground">
                  Expires {midnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground max-w-sm">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Show this QR to your customer. They scan it with the customer app to earn a stamp.
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generateQr.isPending}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generateQr.isPending ? 'animate-spin' : ''}`} />
              Generate new QR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expired state */}
      {qrCode && isQrExpired && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">QR code expired</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a new one to continue awarding stamps.
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={generateQr.isPending} className="gap-2">
              <QrCode className="h-4 w-4" />
              Generate next QR
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Generate a QR code and show it to your customer.</li>
          <li>The customer scans it with their loyalty card in the customer app.</li>
          <li>A stamp is automatically added to their card.</li>
          <li>
            When they reach {' '}
            <span className="font-medium text-foreground">the required stamp count</span>,
            a reward is issued automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}
