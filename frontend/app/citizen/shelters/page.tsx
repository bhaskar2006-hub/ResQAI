"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { Home } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/shared/LiveMap'), { ssr: false });

interface ShelterInfo {
  id: string; name: string; address: string; capacity: number; occupancy: number; latitude: number; longitude: number;
}
interface ApiResponse<T> { success?: boolean; data?: T }

export default function CitizenSheltersPage() {
  const [shelters, setShelters] = useState<ShelterInfo[]>([]);

  const fetchShelters = useCallback(async () => {
    try {
      const res = await api.get('/shelters').catch(() => null) as ApiResponse<{ shelters?: ShelterInfo[] }> | null;
      if (res?.success && res.data?.shelters) setShelters(res.data.shelters);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  return (
    <DashboardLayout role="citizen" title="Shelters Directory" subtitle="Active evacuation points and occupancy states">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Map area */}
        <div className="xl:col-span-2 bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Designated Shelter Points</span>
              <Badge className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-mono text-[9px]">ACTIVE</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[#64748b]">
              <Home className="h-3.5 w-3.5" />
              <span className="text-[10px]">Mesh Grid</span>
            </div>
          </div>
          <div className="relative">
            <LiveMap height="450px" center={[17.385, 78.4867]} zoom={12} />
          </div>
        </div>

        {/* Shelter List */}
        <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 glass-panel h-fit">
          <div className="border-b border-[#1e3352] pb-2.5 mb-3.5">
            <h3 className="text-sm font-semibold text-foreground">Nearby Emergency Shelters</h3>
            <p className="text-[11px] text-[#64748b] mt-0.5">Real-time occupancy status.</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {shelters.length === 0 ? (
              <p className="text-center text-xs text-[#64748b] py-8">No designated shelters registered near your coordinates.</p>
            ) : (
              shelters.map(shelter => {
                const capacityPct = Math.round((shelter.occupancy / shelter.capacity) * 100);
                return (
                  <div key={shelter.id} className="p-3.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 flex items-start gap-3">
                    <Home className="h-4.5 w-4.5 text-[#22c55e] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-semibold text-[#e8edf5] truncate">{shelter.name}</p>
                      <p className="text-[10px] text-[#64748b] truncate">{shelter.address}</p>
                      <div className="space-y-1 pt-1.5">
                        <div className="flex justify-between text-[9px] text-[#64748b]">
                          <span>Occupancy Load</span>
                          <span>{shelter.occupancy} / {shelter.capacity} ({capacityPct}%)</span>
                        </div>
                        <div className="h-1 bg-[#1e3352] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${capacityPct > 80 ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
