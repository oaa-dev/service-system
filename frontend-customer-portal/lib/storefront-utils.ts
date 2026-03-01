import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Music2,
  MessageCircle,
  Globe,
  type LucideIcon,
} from 'lucide-react';

import type { MerchantBusinessHour, Address } from '@/types/api';

/**
 * Convert 24h time string (HH:MM) to 12h format with AM/PM.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Determine if a merchant is currently open based on business hours.
 * Uses the current local time and day of week to check against the merchant's schedule.
 */
export function isOpenNow(businessHours: MerchantBusinessHour[]): { isOpen: boolean; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (!todayHours || todayHours.is_closed) {
    return { isOpen: false, label: 'Closed' };
  }

  if (currentTime >= todayHours.open_time && currentTime <= todayHours.close_time) {
    return { isOpen: true, label: 'Open Now' };
  }

  if (currentTime < todayHours.open_time) {
    return { isOpen: false, label: `Opens at ${formatTime(todayHours.open_time)}` };
  }

  // After close_time
  return { isOpen: false, label: 'Closed' };
}

/**
 * Build a full address string from an Address object.
 * Useful for display or Google Maps queries.
 */
export function formatFullAddress(address: Address | null | undefined): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.barangay?.name,
    address.city?.name,
    address.province?.name,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Map social platform slugs to lucide-react icon components.
 */
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  'twitter-x': Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  whatsapp: MessageCircle,
};

export function getSocialIcon(slug: string): LucideIcon {
  return SOCIAL_ICONS[slug] || Globe;
}

/**
 * Format a price value as Philippine Peso (PHP).
 */
export function formatPrice(price: string | number): string {
  return `\u20B1${Number(price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
