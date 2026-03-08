"use client";
import React, { useMemo, useState } from "react";
import Map, { Marker, Source, Layer, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Package, Truck, AlertTriangle } from "lucide-react";

interface HoverInfo {
  feature: { properties: { id: string; status: string; carrier: string; [key: string]: unknown } };
  x: number;
  y: number;
  lngLat: { lng: number; lat: number };
}

interface Location {
  lng: number;
  lat: number;
  name?: string;
}

interface Shipment {
  id: string;
  source: string;
  destination: string;
  source_coords: Location;
  destination_coords: Location;
  status: string;
  current_carrier_id: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: Location;
  current_inventory: number;
  capacity: number;
}

interface Disruption {
  type: string;
  entity_id: string;
  severity: number;
  affected_region: string;
}

interface InteractiveMapProps {
  shipments: Shipment[];
  warehouses: Warehouse[];
  disruptions: Disruption[];
}

export default function InteractiveMap({ shipments, warehouses, disruptions }: InteractiveMapProps) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // Helper to generate a curved line between two points
  const generateCurve = (start: Location, end: Location) => {
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    
    const points = [];
    const numPoints = 100;
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const arcAmount = 0.2; // Curve depth
        
        // Linear interpolation
        const lx = start.lng + dx * t;
        const ly = start.lat + dy * t;
        
        // Add curve perpendicular to the line
        // Simple quadratic curve logic
        const cx = lx - dy * arcAmount * Math.sin(t * Math.PI);
        const cy = ly + dx * arcAmount * Math.sin(t * Math.PI);
        
        points.push([cx, cy]);
    }
    return points;
  };

  const routeFeatures = useMemo(() => {
    return shipments?.map((s) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: generateCurve(s.source_coords, s.destination_coords)
      },
      properties: {
        id: s.id,
        status: s.status,
        carrier: s.current_carrier_id
      }
    }));
  }, [shipments]);

  const activeRoutesGeoJSON = {
    type: "FeatureCollection" as const,
    features: routeFeatures || []
  };

  return (
    <div className="w-full h-full relative group">
      <Map
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 3.8,
          pitch: 45, // Angled for 3D appearance
          bearing: -10
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        interactiveLayerIds={['route-line-hitbox']}
        onMouseMove={(e) => {
            if (e.features && e.features.length > 0) {
                setHoverInfo({
                    feature: e.features[0] as unknown as { properties: { id: string; status: string; carrier: string; [key: string]: unknown } },
                    x: e.point.x,
                    y: e.point.y,
                    lngLat: e.lngLat
                });
            } else {
                setHoverInfo(null);
            }
        }}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <NavigationControl position="bottom-right" />

        {/* --- Route Lines --- */}
        <Source type="geojson" data={activeRoutesGeoJSON}>
          {/* Base invisible line for hover interactions */}
          <Layer
            id="route-line-hitbox"
            type="line"
            paint={{
              'line-color': 'transparent',
              'line-width': 15
            }}
          />
          {/* Glow effect */}
          <Layer
             id="route-line-glow"
             type="line"
             paint={{
                 'line-color': [
                     'match',
                     ['get', 'status'],
                     'DELAYED', '#f43f5e',
                     'REROUTED', '#22d3ee',
                     /* default */ '#34d399'
                 ],
                 'line-width': 6,
                 'line-blur': 6,
                 'line-opacity': 0.4
             }}
          />
          {/* Core line */}
          <Layer
            id="route-line"
            type="line"
            layout={{
                'line-join': 'round',
                'line-cap': 'round'
            }}
            paint={{
                'line-color': [
                    'match',
                    ['get', 'status'],
                    'DELAYED', '#e11d48',
                    'REROUTED', '#0891b2',
                    /* default */ '#059669'
                ],
                'line-width': 2,
                'line-dasharray': [
                    'case',
                    ['==', ['get', 'status'], 'DELAYED'], ['literal', [2, 4]],
                    ['literal', [1, 0]]
                ]
            }}
          />
        </Source>
        
        {/* --- Warehouses --- */}
        {warehouses?.map((w) => (
          <Marker key={`w-${w.id}`} longitude={w.location.lng} latitude={w.location.lat}>
            <div className="flex flex-col items-center group/hub cursor-crosshair">
                <div className="w-5 h-5 bg-purple-500/20 border border-purple-500 rounded flex items-center justify-center shadow-[0_0_15px_#a855f7_inset]">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-sm animate-pulse" />
                </div>
                <div className="absolute top-6 opacity-0 group-hover/hub:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm border border-neutral-700 p-2 rounded-lg text-xs whitespace-nowrap z-50 shadow-xl pointer-events-none">
                    <p className="font-bold text-white flex items-center gap-1.5 mb-1"><Package className="w-3 h-3 text-purple-400" /> {w.name}</p>
                    <p className="text-neutral-400 flex justify-between gap-4"><span>Occupancy:</span> <span className="text-white font-mono">{w.current_inventory} / {w.capacity}</span></p>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${(w.current_inventory / w.capacity) * 100}%` }} />
                    </div>
                </div>
            </div>
          </Marker>
        ))}

        {/* --- Shipments (Current positions / dots) --- */}
        {shipments?.map((s) => {
          const progress = s.status === 'DELAYED' ? 0.3 : s.status === 'REROUTED' ? 0.8 : 0.6;
          // Interpolate position along the curve
          const curve = generateCurve(s.source_coords, s.destination_coords);
          const pointIndex = Math.floor(progress * (curve.length - 1));
          const pos = curve[pointIndex];
          const colorClass = s.status === 'DELAYED' ? 'bg-rose-500' : s.status === 'REROUTED' ? 'bg-cyan-500' : 'bg-emerald-500';
          const shadowClass = s.status === 'DELAYED' ? 'shadow-[0_0_20px_#f43f5e]' : s.status === 'REROUTED' ? 'shadow-[0_0_20px_#22d3ee]' : 'shadow-[0_0_20px_#34d399]';

          return (
            <Marker key={`s-dot-${s.id}`} longitude={pos[0]} latitude={pos[1]}>
              <div className="relative flex cursor-pointer group/shipment">
                <span className={`animate-ping absolute -inset-1 rounded-full opacity-60 ${colorClass}`}></span>
                <div className={`relative w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center ${colorClass} ${shadowClass}`}>
                    <div className="w-1 h-1 bg-white rounded-full opacity-70" />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* --- Disruptions --- */}
        {disruptions?.map((d, i) => {
            // Usually we'd map this to actual coordinates, falling back to a central India marker for demonstration
            return (
                <Marker key={`d-${i}`} longitude={79} latitude={22}>
                   <div className="flex flex-col items-center z-40 animate-pulse">
                       <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                           <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                               <AlertTriangle className="w-6 h-6 text-rose-500" />
                           </div>
                       </div>
                   </div>
                </Marker>
            );
        })}

        {/* Tooltip */}
        {hoverInfo && hoverInfo.feature && (
            <Popup
                longitude={hoverInfo.lngLat.lng}
                latitude={hoverInfo.lngLat.lat}
                closeButton={false}
                closeOnClick={false}
                className="z-50"
                offset={10}
            >
                <div className="bg-neutral-900 border border-neutral-700 p-2 rounded-lg shadow-2xl min-w-[150px]">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-2">
                        <Truck className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-xs text-white">{hoverInfo.feature.properties.id}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Status:</span>
                            <span className={`font-bold ${hoverInfo.feature.properties.status === 'DELAYED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {hoverInfo.feature.properties.status}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Carrier:</span>
                            <span className="text-neutral-300">{hoverInfo.feature.properties.carrier}</span>
                        </div>
                    </div>
                </div>
            </Popup>
        )}
      </Map>
    </div>
  );
}
