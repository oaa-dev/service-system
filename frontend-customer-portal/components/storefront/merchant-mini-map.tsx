'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

interface MerchantMiniMapProps {
  latitude: number;
  longitude: number;
  merchantName: string;
}

/**
 * A small, interactive map pinning a single merchant location.
 * Shows a popup with the merchant name; user can close/reopen by clicking the marker.
 * Intended to be dynamically imported with `{ ssr: false }` by parent components.
 */
export default function MerchantMiniMap({
  latitude,
  longitude,
  merchantName,
}: MerchantMiniMapProps) {
  const position = { lat: latitude, lng: longitude };
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <div className="h-56 w-full overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={position}
          defaultZoom={15}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
          gestureHandling="cooperative"
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            position={position}
            title={merchantName}
            onClick={() => setInfoOpen((v) => !v)}
          />

          {infoOpen && (
            <InfoWindow
              position={position}
              onCloseClick={() => setInfoOpen(false)}
              headerDisabled
            >
              <p className="text-xs font-semibold text-foreground px-0.5">{merchantName}</p>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
