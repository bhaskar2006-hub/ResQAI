"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';

// Fix Leaflet default marker icons in Next.js
const createIcon = (color: string, size: number = 12) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px; 
      background: ${color}; 
      border-radius: 50%; 
      border: 2px solid white;
      box-shadow: 0 0 8px ${color}80;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const icons = {
  sos: createIcon('#dc2626', 16),
  hospital: createIcon('#2563eb', 14),
  shelter: createIcon('#16a34a', 14),
  resource: createIcon('#d97706', 12),
  fire: createIcon('#ea580c', 16),
  flood: createIcon('#7c3aed', 16),
};

interface MapNode {
  id: string;
  lat: number;
  lng: number;
  type: 'sos' | 'hospital' | 'shelter' | 'resource';
  name: string;
  details: string;
  status?: string;
}

interface DisasterZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  name: string;
  type: string;
  severity: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

interface LiveMapProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  showControls?: boolean;
}

export default function LiveMap({ height = '500px', center = [17.385, 78.4867], zoom = 12, showControls = true }: LiveMapProps) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [disasters, setDisasters] = useState<DisasterZone[]>([]);
  const [mapCenter] = useState<[number, number]>(center);

  const fetchMapData = useCallback(async () => {
    try {
      const [hospitalsRes, sheltersRes, resourcesRes, sosRes, disastersRes] = await Promise.all([
        api.get('/hospitals').catch(() => ({ success: false })),
        api.get('/shelters').catch(() => ({ success: false })),
        api.get('/resources').catch(() => ({ success: false })),
        api.get('/sos').catch(() => ({ success: false })),
        api.get('/disasters?active=true').catch(() => ({ success: false })),
      ]) as Record<string, unknown>[];

      const mapped: MapNode[] = [];

      // Hospitals
      const hData = hospitalsRes as { success?: boolean; data?: { hospitals?: Array<{ id: string; name: string; latitude: number; longitude: number; availableBeds: number; capacity: number }> } };
      if (hData.success && hData.data?.hospitals) {
        hData.data.hospitals.forEach((h) => {
          mapped.push({ id: h.id, lat: h.latitude, lng: h.longitude, type: 'hospital', name: h.name, details: `Beds: ${h.availableBeds}/${h.capacity}` });
        });
      }

      // Shelters
      const sData = sheltersRes as { success?: boolean; data?: { shelters?: Array<{ id: string; name: string; latitude: number; longitude: number; occupancy: number; capacity: number }> } };
      if (sData.success && sData.data?.shelters) {
        sData.data.shelters.forEach((s) => {
          mapped.push({ id: s.id, lat: s.latitude, lng: s.longitude, type: 'shelter', name: s.name, details: `Occupancy: ${s.occupancy}/${s.capacity}` });
        });
      }

      // Resources
      const rData = resourcesRes as { success?: boolean; data?: { resources?: Array<{ id: string; identifier: string; type: string; latitude: number; longitude: number; status: string }> } };
      if (rData.success && rData.data?.resources) {
        rData.data.resources.forEach((r) => {
          mapped.push({ id: r.id, lat: r.latitude, lng: r.longitude, type: 'resource', name: `${r.type} ${r.identifier}`, details: `Status: ${r.status}`, status: r.status });
        });
      }

      // SOS Reports
      const sosData = sosRes as { success?: boolean; data?: { sosReports?: Array<{ id: string; description: string; latitude: number; longitude: number; status: string }> } };
      if (sosData.success && sosData.data?.sosReports) {
        sosData.data.sosReports.forEach((sos) => {
          if (sos.status !== 'RESOLVED') {
            mapped.push({ id: sos.id, lat: sos.latitude, lng: sos.longitude, type: 'sos', name: 'Emergency SOS', details: sos.description.substring(0, 80), status: sos.status });
          }
        });
      }

      setNodes(mapped);

      // Disasters
      const dData = disastersRes as { success?: boolean; data?: { disasters?: Array<{ id: string; name: string; type: string; severity: string; latitude: number; longitude: number; radius: number }> } };
      if (dData.success && dData.data?.disasters) {
        setDisasters(dData.data.disasters.map((d) => ({
          id: d.id, lat: d.latitude, lng: d.longitude, radius: d.radius * 1000, // km to meters
          name: d.name, type: d.type, severity: d.severity,
        })));
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    }
  }, []);

  useEffect(() => {
    fetchMapData();

    const socket = getSocket();
    const handleNewSOS = () => fetchMapData();
    const handleSOSUpdated = () => fetchMapData();
    socket.on('newSOS', handleNewSOS);
    socket.on('sosUpdated', handleSOSUpdated);
    return () => {
      socket.off('newSOS', handleNewSOS);
      socket.off('sosUpdated', handleSOSUpdated);
    };
  }, [fetchMapData]);

  return (
    <Card className="overflow-hidden">
      {showControls && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-severity-low animate-pulse-severity" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Tactical Map</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { color: '#dc2626', label: 'SOS' },
              { color: '#2563eb', label: 'Hospital' },
              { color: '#16a34a', label: 'Shelter' },
              { color: '#d97706', label: 'Resource' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height }} className="relative">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <MapUpdater center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Disaster zones */}
          {disasters.map((d) => (
            <Circle
              key={d.id}
              center={[d.lat, d.lng]}
              radius={d.radius}
              pathOptions={{
                color: d.severity === 'CRITICAL' ? '#dc2626' : d.severity === 'HIGH' ? '#ea580c' : '#d97706',
                fillOpacity: 0.15,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>{d.name}</strong><br />
                  Type: {d.type} | Severity: {d.severity}
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Map markers */}
          {nodes.map((node) => (
            <Marker key={`${node.type}-${node.id}`} position={[node.lat, node.lng]} icon={icons[node.type]}>
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <div className="font-bold text-sm">{node.name}</div>
                  <div className="text-muted-foreground">{node.details}</div>
                  {node.status && (
                    <div className="mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        node.status === 'PENDING' ? 'bg-severity-critical/10 text-severity-critical border-severity-critical/30' :
                        node.status === 'AVAILABLE' ? 'bg-severity-low/10 text-severity-low border-severity-low/30' :
                        'bg-primary/10 text-primary border-primary/30'
                      }`}>{node.status}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
