"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MapPin } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/shared/LiveMap'), { ssr: false });
const ResourceMap3D = dynamic(() => import('@/components/shared/ResourceMap3D'), { ssr: false });

export default function LiveMapPage() {
  const [mapMode, setMapMode] = useState<'3d' | '2d'>('3d');

  return (
    <DashboardLayout role="government" title="Tactical Incident Map" subtitle="ResQAI 3D Operational Grid">
      <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Tactical Incident Map</span>
            <div className="flex rounded-lg border border-[#1e3352] p-0.5 text-[9px] bg-[#060e1d]">
              <button
                onClick={() => setMapMode('2d')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition-colors cursor-pointer ${
                  mapMode === '2d' ? 'bg-primary text-white' : 'text-[#64748b] hover:text-foreground'
                }`}
              >
                2D MAP
              </button>
              <button
                onClick={() => setMapMode('3d')}
                className={`px-2 py-0.5 rounded-md font-mono font-medium transition-colors cursor-pointer ${
                  mapMode === '3d' ? 'bg-primary text-white' : 'text-[#64748b] hover:text-foreground'
                }`}
              >
                3D TACTICAL
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#64748b]">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-[10px]">Hyderabad Region</span>
          </div>
        </div>
        <div className="relative">
          {mapMode === '2d' ? (
            <>
              <LiveMap height="500px" center={[17.385, 78.4867]} zoom={12} />
              {/* Map legend */}
              <div className="absolute bottom-4 left-4 z-[1000] p-2.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/90 backdrop-blur text-[10px] space-y-1.5">
                {[
                  { color: '#ef4444', label: 'Critical' },
                  { color: '#f97316', label: 'High' },
                  { color: '#f59e0b', label: 'Medium' },
                  { color: '#22c55e', label: 'Safe' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: l.color }} />
                    <span className="text-[#64748b]">{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[500px] w-full">
              <ResourceMap3D />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
