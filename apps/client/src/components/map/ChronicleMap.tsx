import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../store/timelineStore';
import { LazyMapMarkers } from '../layout/LazyMapMarkers';
import { CinemaPopup } from './CinemaPopup';

export const ChronicleMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { center, zoom, pitch, bearing } = useMapStore();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const style = {
      version: 8 as const,
      sources: {
        'osm': {
          type: 'raster' as const,
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap'
        }
      },
      layers: [{
        id: 'osm',
        type: 'raster' as const,
        source: 'osm',
        paint: {
          'raster-saturation': -0.5,
          'raster-contrast': 0.2,
          'raster-brightness-min': 0.2,
          'raster-brightness-max': 0.8,
          'raster-hue-rotate': 15,
          'raster-opacity': 0.85
        }
      }]
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style as any,
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      antialias: true,
    attributionControl: {},
      fadeDuration: 1000
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      }),
      'top-right'
    );

    map.current.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }),
      'bottom-right'
    );

    map.current.on('load', () => {
      setMapReady(true);
      const canvas = map.current?.getCanvas();
      if (canvas) {
        canvas.style.filter = `
          sepia(0.4) 
          contrast(1.1) 
          brightness(0.85) 
          saturate(0.5)
        `;
      }
    });

    map.current.on('error', (e) => {
      console.warn('Map error:', e);
    });

    return () => {
      map.current?.remove();
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.flyTo({
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      duration: 2000,
      essential: true
    });
  }, [center, zoom, pitch, bearing]);

  return (
    <>
      <div
        ref={mapContainer}
        className="w-full h-full relative"
        style={{
          background: '#1a1410'
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '300px 300px'
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Use LazyMapMarkers instead of MapMarkers */}
      {mapReady && map.current && <LazyMapMarkers map={map.current} />}

      <CinemaPopup />
    </>
  );
};