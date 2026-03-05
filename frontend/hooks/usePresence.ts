import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getEcho } from '@/lib/echo';

/**
 * Hook for merchant users to broadcast their presence.
 * Joins the presence-merchant.{merchantId} channel while mounted,
 * so that customers can observe whether the merchant is online.
 * Only active when the authenticated user has a merchant record.
 */
export function useMerchantPresence() {
  const user = useAuthStore((state) => state.user);
  const merchantId = user?.merchant?.id ?? null;

  useEffect(() => {
    if (!merchantId) return;

    let channelName: string | null = null;

    try {
      const echo = getEcho();
      if (!echo) return;

      channelName = `presence-merchant.${merchantId}`;
      echo.join(channelName);
    } catch {
      // Reverb unavailable — silently skip
    }

    return () => {
      if (channelName) {
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
}
