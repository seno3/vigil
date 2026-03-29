'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type mapboxgl from 'mapbox-gl';

const FALLBACK = { lat: 39.8283, lng: -98.5795 };
const FLY_DURATION = 2200;
const GEO_TIMEOUT = 3000;
const FADE_START_DELAY = 400; // ms after click before flyTo begins

export type ButtonLabel = 'OPEN' | 'LOCATING...' | 'OPEN →';

export function useMapTransition(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>('OPEN');

  const clickTimeRef = useRef(0);
  const pendingFlyRef = useRef<{ lat: number; lng: number } | null>(null);
  const geoResolvedRef = useRef(false);
  // Keep a ref in sync so callbacks can read the current value without stale closure
  const mapLoadedRef = useRef(mapLoaded);
  useEffect(() => { mapLoadedRef.current = mapLoaded; }, [mapLoaded]);

  const doFly = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [lng, lat],
        zoom: 14,
        pitch: 45,
        bearing: -12,
        duration: FLY_DURATION,
        easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      });
    }
    // Navigate after fly completes — pass coords so dashboard can centre its own map
    setTimeout(() => {
      router.push(
        `/dashboard?skipIntro=true&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`,
      );
    }, FLY_DURATION);
  }, [mapRef, router]);

  // If geo resolved while map was still loading, fire the pending fly now
  useEffect(() => {
    if (!mapLoaded || !pendingFlyRef.current) return;
    const { lat, lng } = pendingFlyRef.current;
    pendingFlyRef.current = null;
    doFly(lat, lng);
  }, [mapLoaded, doFly]);

  const scheduleFly = useCallback((lat: number, lng: number) => {
    const elapsed = Date.now() - clickTimeRef.current;
    const delay = Math.max(0, FADE_START_DELAY - elapsed);

    if (mapLoadedRef.current) {
      if (delay > 0) {
        setTimeout(() => doFly(lat, lng), delay);
      } else {
        doFly(lat, lng);
      }
    } else {
      // Map tiles still loading — the useEffect above will fire when ready
      pendingFlyRef.current = { lat, lng };
    }
  }, [doFly]);

  const startTransition = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setButtonLabel('LOCATING...');
    clickTimeRef.current = Date.now();
    geoResolvedRef.current = false;

    // Single resolve gate — first caller wins (geo or timeout)
    const resolve = (lat: number, lng: number) => {
      if (geoResolvedRef.current) return;
      geoResolvedRef.current = true;
      scheduleFly(lat, lng);
    };

    // Hard timeout — never leave the user waiting more than 3s
    const timeoutId = setTimeout(() => {
      setButtonLabel('OPEN →');
      resolve(FALLBACK.lat, FALLBACK.lng);
    }, GEO_TIMEOUT);

    if (!navigator?.geolocation) {
      clearTimeout(timeoutId);
      resolve(FALLBACK.lat, FALLBACK.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        setButtonLabel('OPEN');
        resolve(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        clearTimeout(timeoutId);
        resolve(FALLBACK.lat, FALLBACK.lng);
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT },
    );
  }, [isTransitioning, scheduleFly]);

  return { startTransition, isTransitioning, buttonLabel };
}
