'use client';

import { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import Link from 'next/link';
import type { Merchant } from '@/types/api';
import { haversineDistance } from '@/lib/geo-utils';

// Default map center: Philippines
const PH_CENTER = { lat: 12.8797, lng: 121.774 };
const PH_ZOOM = 6;

interface UserLocation {
  lat: number;
  lng: number;
}

interface MerchantMapViewProps {
  merchants: Merchant[];
  userLocation?: UserLocation | null;
  radiusKm?: number | null;
}

interface FitBoundsProps {
  merchants: Merchant[];
  userLocation?: UserLocation | null;
}

function FitBounds({ merchants, userLocation }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: google.maps.LatLngLiteral[] = merchants
      .filter((m) => m.address?.latitude != null && m.address?.longitude != null)
      .map((m) => ({
        lat: m.address!.latitude as number,
        lng: m.address!.longitude as number,
      }));

    if (userLocation) {
      points.push({ lat: userLocation.lat, lng: userLocation.lng });
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [map, merchants, userLocation]);

  return null;
}

function RadiusCircle({ center, radiusKm }: { center: UserLocation; radiusKm: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center: { lat: center.lat, lng: center.lng },
      radius: radiusKm * 1000,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radiusKm]);

  return null;
}

function formatDistance(merchant: Merchant, userLocation?: UserLocation | null): string | null {
  if (!userLocation) return null;

  if (merchant.distance != null) {
    return merchant.distance < 1
      ? `${Math.round(merchant.distance * 1000)} m away`
      : `${merchant.distance.toFixed(1)} km away`;
  }

  const lat = merchant.address?.latitude;
  const lng = merchant.address?.longitude;
  if (lat == null || lng == null) return null;

  const km = haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
  return km < 1
    ? `${Math.round(km * 1000)} m away`
    : `${km.toFixed(1)} km away`;
}

function MerchantInfoWindowContent({
  merchant,
  userLocation,
}: {
  merchant: Merchant;
  userLocation?: UserLocation | null;
}) {
  const dist = formatDistance(merchant, userLocation);
  return (
    <div className="min-w-[140px] space-y-1.5">
      <p className="font-semibold text-gray-900 leading-tight">{merchant.name}</p>
      {dist && <p className="text-xs text-gray-500">{dist}</p>}
      <Link
        href={`/merchants/${merchant.slug}`}
        className="inline-block mt-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        View Store →
      </Link>
    </div>
  );
}

export default function MerchantMapView({
  merchants,
  userLocation,
  radiusKm,
}: MerchantMapViewProps) {
  // Single selected merchant for click-to-open mode (no radius)
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  // IDs of popups the user has manually closed (radius mode only)
  const [closedIds, setClosedIds] = useState<Set<number>>(new Set());

  // Reset closed popups whenever the radius changes
  useEffect(() => {
    setClosedIds(new Set());
    setSelectedMerchant(null);
  }, [radiusKm]);

  const merchantsWithCoords = merchants.filter(
    (m) => m.address?.latitude != null && m.address?.longitude != null,
  );

  const radiusActive = radiusKm != null && radiusKm > 0;

  const handleMarkerClick = (merchant: Merchant) => {
    if (radiusActive) {
      // Re-open a manually closed popup
      setClosedIds((prev) => {
        const next = new Set(prev);
        next.delete(merchant.id);
        return next;
      });
    } else {
      setSelectedMerchant((prev) => (prev?.id === merchant.id ? null : merchant));
    }
  };

  const handleInfoWindowClose = (merchant: Merchant) => {
    if (radiusActive) {
      setClosedIds((prev) => new Set(prev).add(merchant.id));
    } else {
      setSelectedMerchant(null);
    }
  };

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-xl">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={PH_CENTER}
          defaultZoom={PH_ZOOM}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
        >
          <FitBounds merchants={merchantsWithCoords} userLocation={userLocation} />

          {merchantsWithCoords.map((merchant) => (
            <AdvancedMarker
              key={merchant.id}
              position={{
                lat: merchant.address!.latitude as number,
                lng: merchant.address!.longitude as number,
              }}
              onClick={() => handleMarkerClick(merchant)}
            />
          ))}

          {/* Radius mode: one InfoWindow per visible merchant (sibling, not child of marker) */}
          {radiusActive &&
            merchantsWithCoords
              .filter((m) => !closedIds.has(m.id))
              .map((merchant) => (
                <InfoWindow
                  key={`iw-${merchant.id}`}
                  position={{
                    lat: merchant.address!.latitude as number,
                    lng: merchant.address!.longitude as number,
                  }}
                  onCloseClick={() => handleInfoWindowClose(merchant)}
                  headerDisabled
                >
                  <MerchantInfoWindowContent
                    merchant={merchant}
                    userLocation={userLocation}
                  />
                </InfoWindow>
              ))}

          {/* No-radius mode: single InfoWindow rendered outside markers */}
          {!radiusActive && selectedMerchant && (
            <InfoWindow
              position={{
                lat: selectedMerchant.address!.latitude as number,
                lng: selectedMerchant.address!.longitude as number,
              }}
              onCloseClick={() => setSelectedMerchant(null)}
              headerDisabled
            >
              <MerchantInfoWindowContent
                merchant={selectedMerchant}
                userLocation={userLocation}
              />
            </InfoWindow>
          )}

          {/* User location: pulsing blue dot */}
          {userLocation && (
            <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }}>
              <div className="relative flex items-center justify-center">
                <div className="absolute h-10 w-10 rounded-full bg-blue-500/20 animate-ping" />
                <div className="relative h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {userLocation && radiusKm && (
            <RadiusCircle center={userLocation} radiusKm={radiusKm} />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
