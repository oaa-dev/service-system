import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

interface PresenceMember {
  id: number;
  name: string;
  is_merchant_owner: boolean;
}

/**
 * Hook to check whether the owner of a given merchant is currently online.
 * Joins the presence-merchant.{merchantId} channel and monitors member
 * join/leave events to track whether the merchant owner is connected.
 *
 * Returns false when merchantId is null or when the WebSocket server is
 * unavailable — the UI should treat false as "unknown / offline".
 */
export function useMerchantOnline(merchantId: number | null): boolean {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!merchantId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    const channelName = `presence-merchant.${merchantId}`;

    try {
      const echo = getEcho();
      if (!echo) return;

      channel = echo.join(channelName);

      channel
        .here((members: PresenceMember[]) => {
          setIsOnline(members.some((m) => m.is_merchant_owner));
        })
        .joining((member: PresenceMember) => {
          if (member.is_merchant_owner) setIsOnline(true);
        })
        .leaving((member: PresenceMember) => {
          if (member.is_merchant_owner) setIsOnline(false);
        })
        .error(() => {
          // Silently ignore presence channel errors
        });
    } catch {
      // Reverb unavailable — leave indicator hidden
    }

    return () => {
      if (channel) {
        try {
          const echo = getEcho();
          if (echo) {
            echo.leave(channelName);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [merchantId]);

  return isOnline;
}
