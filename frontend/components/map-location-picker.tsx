'use client';

import { useCallback } from 'react';
import { APIProvider, Map, Marker, type MapMouseEvent } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

const PHILIPPINES_CENTER = { lat: 12.8797, lng: 121.774 };
const PHILIPPINES_ZOOM = 6;
const PIN_ZOOM = 15;

interface Props {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (lat: number | null, lng: number | null) => void;
  disabled?: boolean;
}

// Must be a default export so next/dynamic can import it without a named specifier.
export default function MapLocationPicker({ latitude, longitude, onChange, disabled = false }: Props) {
  const hasPin = latitude != null && longitude != null;

  const center = hasPin
    ? { lat: latitude, lng: longitude }
    : PHILIPPINES_CENTER;

  const zoom = hasPin ? PIN_ZOOM : PHILIPPINES_ZOOM;

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!disabled && e.detail.latLng) {
        onChange(e.detail.latLng.lat, e.detail.latLng.lng);
      }
    },
    [disabled, onChange],
  );

  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onChange(e.latLng.lat(), e.latLng.lng());
      }
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null, null);
  }, [onChange]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map Location
            </CardTitle>
            <CardDescription className="mt-1">
              {hasPin
                ? 'Drag the pin or click the map to reposition'
                : 'Click on the map to place a pin'}
            </CardDescription>
          </div>
          {hasPin && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear pin
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        <div className="relative rounded-md overflow-hidden border" style={{ height: 300 }}>
          {!hasPin && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
              <span className="bg-background/90 text-muted-foreground text-sm px-3 py-1.5 rounded-md shadow">
                Click to place a pin
              </span>
            </div>
          )}
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <Map
              key={`${center.lat}-${center.lng}-${zoom}`}
              defaultCenter={center}
              defaultZoom={zoom}
              gestureHandling="greedy"
              streetViewControl={false}
              style={{ width: '100%', height: '100%' }}
              onClick={handleMapClick}
            >
              {hasPin && (
                <Marker
                  position={{ lat: latitude, lng: longitude }}
                  draggable={!disabled}
                  onDragEnd={handleDragEnd}
                />
              )}
            </Map>
          </APIProvider>
        </div>

        {hasPin && (
          <p className="text-xs text-muted-foreground font-mono">
            Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
